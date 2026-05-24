// garden.js — question garden where members add and pick questions

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'
import { renderAnswers } from './answers.js'
import { renderZine } from './zine.js'
import { renderNav } from './nav.js'

let currentAccessToken = null
let allQuestions = [] // store all questions for filtering
let currentUserId = null
let activeFilter = 'all'
let issuedQuestionIds = new Set() // questions added to this issue

const CATEGORIES = ['all', 'fun', 'deep', 'rec', 'life', 'hot take', 'goals']
const CARD_COLORS = [
  '#EEE8B8', '#EEC8D4', '#D8CCE8', '#C8DFB8', '#F0D8C0', '#C0D8EE'
]
const ROTATIONS = [-1, 0.5, -0.5, 1]

export async function renderGarden(groupId, accessToken) {
  currentAccessToken = accessToken

  const { data: { user } } = await supabase.auth.getUser()
  currentUserId = user.id

  document.querySelector('#app').innerHTML = `
    <div class="garden-page">
      <div class="garden-header-area">
        <h1>question garden</h1>
        <p class="garden-subtitle">write your own, generate ideas, or pick from the collection below</p>
      </div>

      <div class="add-prompt-box">
        <div class="add-prompt-label">ADD A NEW PROMPT</div>
        <input type="text" id="question-input" class="add-prompt-input" placeholder="write your own question here..." />
        <div class="add-prompt-controls">
          <select id="category-select" class="category-pill-select">
            <option value="fun">Fun</option>
            <option value="deep">Deep</option>
            <option value="rec">Rec</option>
            <option value="life">Life</option>
            <option value="hot take">Hot Take</option>
            <option value="goals">Goals</option>
          </select>
          <button id="generate-btn" class="btn-ghost">generate with AI</button>
          <button id="add-question-btn" class="btn-primary">+ add to issue</button>
        </div>
        <p id="garden-message"></p>
      </div>

      <div class="issue-questions-section" id="issue-section" style="display:none;">
        <h3 class="issue-section-label">THIS ISSUE'S QUESTIONS</h3>
        <div class="issue-questions-list" id="issue-questions-list"></div>
      </div>

      <div class="suggested-section">
        <h3 class="suggested-section-label">SUGGESTED PROMPTS</h3>

        <div class="cat-pills" id="cat-pills">
          ${CATEGORIES.map(cat => `
            <button class="pill ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">
              ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          `).join('')}
        </div>

        <div class="cards-grid" id="question-list">
          <p>Loading questions...</p>
        </div>
      </div>

      <div class="garden-bottom-buttons">
        <button id="back-to-answers-btn" class="btn-ghost">← back to your answers</button>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'garden')
  await loadQuestions(groupId)

  // Category filter pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      activeFilter = e.target.dataset.filter
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'))
      e.target.classList.add('active')
      renderFilteredQuestions()
    })
  })

  document.querySelector('#add-question-btn').addEventListener('click', async () => {
    const input = document.querySelector('#question-input')
    const categorySelect = document.querySelector('#category-select')
    const text = input.value.trim()
    const category = categorySelect.value
    const message = document.querySelector('#garden-message')

    if (!text) {
      message.textContent = 'Please type a question first.'
      return
    }

    message.textContent = 'Adding...'

    const { data: { user } } = await supabase.auth.getUser()

    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${currentAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, category, group_id: groupId, added_by: user.id })
    })

    if (!response.ok) {
      const err = await response.json()
      message.textContent = err.message || 'Something went wrong.'
    } else {
      const newQuestion = await response.json()
      message.textContent = 'Added!'
      issuedQuestionIds.add(newQuestion[0].id)
      input.value = ''
      await loadQuestions(groupId)
      renderIssueQuestions()
    }
  })

  document.querySelector('#back-to-answers-btn').addEventListener('click', () => {
    renderAnswers(groupId, accessToken)
  })
}

async function loadQuestions(groupId) {
  const questions = await dbQuery(
    'questions',
    `group_id=eq.${groupId}&order=created_at.asc`,
    currentAccessToken
  )

  allQuestions = questions || []
  renderFilteredQuestions()
}

function renderFilteredQuestions() {
  const filtered = activeFilter === 'all'
    ? allQuestions
    : allQuestions.filter(q => (q.category || 'fun').toLowerCase() === activeFilter)

  const list = document.querySelector('#question-list')

  if (!filtered || filtered.length === 0) {
    list.innerHTML = `<p style="grid-column:1/-1">No questions in this filter.</p>`
    return
  }

  list.innerHTML = filtered.map((q, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length]
    const rotation = ROTATIONS[i % ROTATIONS.length]
    const isAdded = q.added_by === currentUserId
    const isInIssue = issuedQuestionIds.has(q.id)
    const opacity = isInIssue ? 'opacity: 0.6' : ''

    return `
      <div class="q-card" style="background:${color};transform:rotate(${rotation}deg);${opacity}">
        <div class="q-card-cat">${(q.category || 'fun').toUpperCase()}</div>
        <div class="q-card-text">${q.text}</div>
        ${isInIssue ? '<div class="q-card-badge">in issue</div>' : ''}
        <button class="q-card-action" title="${isAdded ? 'You added this' : 'Add question to issue'}">
          ${isInIssue ? '✓' : '+'}
        </button>
      </div>
    `
  }).join('')
}

function renderIssueQuestions() {
  if (issuedQuestionIds.size === 0) {
    document.getElementById('issue-section').style.display = 'none'
    return
  }

  document.getElementById('issue-section').style.display = 'block'
  const list = document.getElementById('issue-questions-list')

  const issueQuestions = allQuestions.filter(q => issuedQuestionIds.has(q.id))

  list.innerHTML = issueQuestions.map((q, i) => `
    <div class="issue-question-row">
      <span class="issue-q-number">${i + 1}.</span>
      <span class="issue-q-text">${q.text}</span>
      ${q.category === 'poll' ? '<span class="poll-badge">POLL</span>' : ''}
      <button class="issue-q-remove" data-question-id="${q.id}">×</button>
    </div>
  `).join('')

  document.querySelectorAll('.issue-q-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.dataset.questionId
      issuedQuestionIds.delete(qId)
      renderIssueQuestions()
      renderFilteredQuestions()
    })
  })
}