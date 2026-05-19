// answers.js — write your answers to this month's questions

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'
import { renderNav } from './nav.js'

let currentAccessToken = null

export async function renderAnswers(groupId, accessToken) {
  currentAccessToken = accessToken

  document.querySelector('#app').innerHTML = `
    <div class="answers-container">
      <h1>Your Answers</h1>
      <p class="page-sub">Answer this month's questions</p>

      <div id="answers-list">
        <p>Loading questions...</p>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'answers')
  await loadQuestionsWithAnswers(groupId)
}

async function loadQuestionsWithAnswers(groupId) {
  const list = document.querySelector('#answers-list')

  const { data: { user } } = await supabase.auth.getUser()

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
    `user_id=eq.${user.id}&select=*`,
    currentAccessToken
  )

  const answerMap = {}
  if (answers) {
    answers.forEach(a => {
      answerMap[a.question_id] = a
    })
  }

  list.innerHTML = questions.map(q => `
    <div class="answer-item" data-question-id="${q.id}">
      <p class="question-text">${q.text}</p>
      <textarea
        class="answer-input"
        data-question-id="${q.id}"
        placeholder="Write your answer..."
      >${answerMap[q.id]?.content || ''}</textarea>
      <div class="answer-actions">
        <button class="save-answer-btn" data-question-id="${q.id}">Save</button>
        <span class="save-status" data-question-id="${q.id}"></span>
      </div>
    </div>
  `).join('')

  document.querySelectorAll('.save-answer-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const questionId = btn.dataset.questionId
      const textarea = document.querySelector(`textarea[data-question-id="${questionId}"]`)
      const status = document.querySelector(`.save-status[data-question-id="${questionId}"]`)
      const content = textarea.value.trim()

      if (!content) {
        status.textContent = 'Please write something first.'
        return
      }

      status.textContent = 'Saving...'

      const existing = answerMap[questionId]

      if (existing) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/answers?id=eq.${existing.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ content })
        })

        if (response.ok) {
          status.textContent = 'Saved!'
          answerMap[questionId].content = content
        } else {
          status.textContent = 'Error saving.'
        }
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
            user_id: user.id,
            content
          })
        })

        if (response.ok) {
          const data = await response.json()
          status.textContent = 'Saved!'
          answerMap[questionId] = data[0]
        } else {
          const err = await response.json()
          status.textContent = err.message || 'Error saving.'
        }
      }
    })
  })
}