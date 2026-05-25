// answers.js — write your answers to this month's questions

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'
import { renderNav } from './nav.js'
import { renderGarden } from './garden.js'
import { renderZine } from './zine.js'

let currentAccessToken = null
let currentGroupId = null
let currentUserId = null
let debounceTimers = {}
let photosByQuestion = {} // questionId -> base64 string (UI only for now)

const CARD_COLORS = [
  '#EEC8D4', '#D8CCE8', '#C8DFB8', '#F0D8C0', '#EEE8B8', '#E3B8C2', '#BFA0B8'
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
          <button class="nav-ghost-btn" id="preview-btn">preview in issue →</button>
        </div>
      </div>
      <div id="answers-list">
        <p style="color:var(--ink-faint);font-size:14px;">Loading questions...</p>
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
    list.innerHTML = `
      <div style="text-align:center;padding:4rem 1rem;">
        <svg width="64" height="64" viewBox="0 0 40 40" fill="none" style="margin:0 auto 1.25rem;display:block;animation:sway 4s ease-in-out infinite;">
          <style>@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}</style>
          <g transform="translate(20,20)">
            <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(0)"/>
            <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(72)"/>
            <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(144)"/>
            <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(216)"/>
            <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(288)"/>
            <circle fill="#C2DACC" cx="0" cy="0" r="4" stroke="#94B5A0" stroke-width="1.5"/>
          </g>
        </svg>
        <p style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--ink);margin-bottom:8px;">nothing to answer yet</p>
        <p style="font-size:14px;color:var(--ink-faint);margin-bottom:1.5rem;line-height:1.6;">add some questions in the question garden and they'll appear here</p>
        <button id="go-garden-btn" style="background:var(--green);color:#fff;border:none;border-radius:999px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Montserrat',sans-serif;">go to question garden →</button>
      </div>`
    document.querySelector('#go-garden-btn').addEventListener('click', () => {
      renderGarden(currentGroupId, currentAccessToken)
    })
    return
  }

  const answers = await dbQuery(
    'answers',
    `user_id=eq.${currentUserId}&select=*`,
    currentAccessToken
  )

  const answerMap = {}
  if (answers) {
    answers.forEach(a => { answerMap[a.question_id] = a })
  }

  list.innerHTML = `
    <div class="answers-paper-sheet">
      <div class="answers-paper-content">
        <div class="answers-sticky-grid" id="answers-grid">
          ${questions.map((q, i) => {
            const color = CARD_COLORS[i % CARD_COLORS.length]
            const existing = answerMap[q.id]
            const rotation = ['-1.2deg', '0.8deg', '-0.5deg', '1.1deg', '-0.9deg', '0.6deg'][i % 6]
            return `
              <div class="answer-sticky" style="background:${color};--rotation:${rotation}">
                <div class="answer-sticky-tab"></div>
                <div class="answer-sticky-inner">
                  <div class="answer-sticky-q">${i + 1}. ${q.text}</div>
                  <textarea
                    class="answer-sticky-textarea"
                    data-question-id="${q.id}"
                    placeholder="write something here..."
                  >${existing?.content || ''}</textarea>
                  <div class="answer-photo-preview" id="photo-preview-${q.id}" style="display:none">
                    <img class="answer-photo-img" src="" alt="your photo" />
                    <button class="photo-remove-btn" data-question-id="${q.id}">×</button>
                  </div>
                  <div class="answer-sticky-footer">
                    <span class="answer-saved-indicator" data-question-id="${q.id}"></span>
                    <button class="answer-photo-btn" data-question-id="${q.id}">
                      <svg width="13" height="13" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="4" width="20" height="15" rx="2.5"/><circle cx="11" cy="12" r="3.5"/><path d="M15 4l-1.5-2.5h-5L7 4"/></svg>
                      add a photo
                    </button>
                  </div>
                </div>
                <input type="file" class="answer-photo-input" data-question-id="${q.id}" accept="image/*" style="display:none">
              </div>
            `
          }).join('')}
        </div>
      </div>
    </div>
  `

  // Autosave on textarea input
  document.querySelectorAll('.answer-sticky-textarea').forEach(textarea => {
    textarea.addEventListener('input', () => {
      const questionId = textarea.dataset.questionId
      clearTimeout(debounceTimers[questionId])
      debounceTimers[questionId] = setTimeout(() => {
        saveAnswer(questionId, textarea.value.trim(), answerMap)
      }, 800)
    })
  })

  // Photo upload buttons
  document.querySelectorAll('.answer-photo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.dataset.questionId
      document.querySelector(`.answer-photo-input[data-question-id="${qId}"]`).click()
    })
  })

  // Photo file inputs
  document.querySelectorAll('.answer-photo-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const qId = input.dataset.questionId
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        photosByQuestion[qId] = ev.target.result
        const preview = document.querySelector(`#photo-preview-${qId}`)
        preview.querySelector('.answer-photo-img').src = ev.target.result
        preview.style.display = 'block'
        document.querySelector(`.answer-photo-btn[data-question-id="${qId}"]`).textContent = '+ add another photo'
      }
      reader.readAsDataURL(file)
    })
  })

  // Photo remove buttons
  document.querySelectorAll('.photo-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.dataset.questionId
      delete photosByQuestion[qId]
      const preview = document.querySelector(`#photo-preview-${qId}`)
      preview.style.display = 'none'
      preview.querySelector('.answer-photo-img').src = ''
      document.querySelector(`.answer-photo-btn[data-question-id="${qId}"]`).innerHTML = `
        <svg width="13" height="13" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="4" width="20" height="15" rx="2.5"/><circle cx="11" cy="12" r="3.5"/><path d="M15 4l-1.5-2.5h-5L7 4"/></svg>
        add a photo`
    })
  })
}

async function saveAnswer(questionId, content, answerMap) {
  const indicator = document.querySelector(`.answer-saved-indicator[data-question-id="${questionId}"]`)
  if (!content) return

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

    if (indicator) {
      indicator.textContent = 'saved ✓'
      indicator.style.opacity = '1'
      setTimeout(() => { indicator.style.opacity = '0' }, 2000)
    }
  } catch (err) {
    console.error('Error saving answer:', err)
  }
}