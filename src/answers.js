// answers.js — write your answers to this month's questions

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'
import { renderNav } from './nav.js'
import { renderGarden } from './garden.js'
import { renderZine } from './zine.js'

let currentAccessToken = null
let currentGroupId = null
let currentUserId = null
let debounceTimers = {}

const CARD_COLORS = [
  '#EEC8D4', '#D8CCE8', '#C8DFB8', '#F0D8C0', '#EEE8B8'
]

export async function renderAnswers(groupId, accessToken) {
  currentAccessToken = accessToken
  currentGroupId = groupId

  const { data: { user } } = await supabase.auth.getUser()
  currentUserId = user.id

  document.querySelector('#app').innerHTML = `
    <div class="answers-page">
      <div class="answers-header">
        <div>
          <h1>your answers</h1>
          <p class="answers-subtitle">write something for each question this month</p>
        </div>
        <div class="answers-nav-buttons">
          <button class="nav-ghost-btn" id="add-more-btn">+ add more questions</button>
          <button class="nav-ghost-btn" id="preview-btn">preview in issue</button>
        </div>
      </div>

      <div id="answers-list">
        <p>Loading questions...</p>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'answers')
  await loadQuestionsWithAnswers(groupId)

  document.querySelector('#add-more-btn').addEventListener('click', () => {
    renderGarden(groupId, accessToken)
  })

  document.querySelector('#preview-btn').addEventListener('click', () => {
    renderZine(groupId, accessToken)
  })
}

async function loadQuestionsWithAnswers(groupId) {
  const list = document.querySelector('#answers-list')

  const questions = await dbQuery(
    'questions',
    `group_id=eq.${groupId}&order=created_at.asc`,
    currentAccessToken
  )

  if (!questions || questions.length === 0) {
    list.innerHTML = `<p>No questions yet. Add some in the garden first!</p>`
    return
  }

  const answers = await dbQuery(
    'answers',
    `user_id=eq.${currentUserId}&select=*`,
    currentAccessToken
  )

  const answerMap = {}
  if (answers) {
    answers.forEach(a => {
      answerMap[a.question_id] = a
    })
  }

  list.innerHTML = questions.map((q, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length]
    const existingAnswer = answerMap[q.id]
    return `
      <div class="answer-card" style="background:${color}">
        <div class="answer-header">
          <div class="answer-number">${i + 1}. ${q.text}</div>
          <span class="answer-saved-indicator" data-question-id="${q.id}"></span>
        </div>
        <textarea
          class="answer-textarea"
          data-question-id="${q.id}"
          placeholder="write something here..."
        >${existingAnswer?.content || ''}</textarea>
      </div>
    `
  }).join('')

  document.querySelectorAll('.answer-textarea').forEach(textarea => {
    textarea.addEventListener('input', () => {
      const questionId = textarea.dataset.questionId

      // Clear existing timer
      if (debounceTimers[questionId]) {
        clearTimeout(debounceTimers[questionId])
      }

      // Set new timer
      debounceTimers[questionId] = setTimeout(() => {
        saveAnswer(questionId, textarea.value.trim(), answerMap)
      }, 800)
    })
  })
}

async function saveAnswer(questionId, content, answerMap) {
  const indicator = document.querySelector(`.answer-saved-indicator[data-question-id="${questionId}"]`)

  if (!content) {
    return
  }

  const existing = answerMap[questionId]

  try {
    if (existing) {
      await fetch(`${SUPABASE_URL}/rest/v1/answers?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${currentAccessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ content })
      })

      answerMap[questionId].content = content
    } else {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/answers`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${currentAccessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          question_id: questionId,
          user_id: currentUserId,
          content
        })
      })

      if (response.ok) {
        const data = await response.json()
        answerMap[questionId] = data[0]
      }
    }

    // Show saved indicator
    indicator.textContent = 'saved ✓'
    indicator.style.opacity = '1'

    // Fade out after 2 seconds
    setTimeout(() => {
      indicator.style.opacity = '0'
    }, 2000)
  } catch (err) {
    console.error('Error saving answer:', err)
  }
}