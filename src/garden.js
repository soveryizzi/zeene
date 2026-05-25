// garden.js — question garden

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'
import { renderAnswers } from './answers.js'
import { renderZine } from './zine.js'
import { renderNav } from './nav.js'

let currentAccessToken = null
let groupId = null
let allQuestions = []
let currentUserId = null
let activeFilter = 'all'
let issuedQuestionIds = new Set()
let isPollMode = false
let showAllQuestions = false

const CATEGORIES = ['all', 'fun', 'deep', 'rec', 'life', 'hot take', 'goals', 'photo', 'poll']

const CARD_COLORS = [
  '#C8DFB8', '#B8D4C8', '#C2DACC', '#D4E8D0', '#BCCFBC',
  '#C4D8C0', '#D0E0C8', '#B8CEB8', '#CADAC4', '#C0D4BC'
]

const SEED_QUESTIONS = [
  { text: "what song has been on repeat and what does that say about you?", category: "fun" },
  { text: "describe your current life in three words", category: "fun" },
  { text: "what are you embarrassingly bad at?", category: "fun" },
  { text: "what's a weird habit you've fully accepted about yourself?", category: "fun" },
  { text: "what is your villain era right now?", category: "fun" },
  { text: "something you changed your mind about recently", category: "deep" },
  { text: "what would your 15-year-old self think of you now?", category: "deep" },
  { text: "what's something you're still figuring out?", category: "deep" },
  { text: "a belief you hold that most people around you don't", category: "deep" },
  { text: "best $20 you've spent in the last month", category: "rec" },
  { text: "recommend something — anything", category: "rec" },
  { text: "a show, book, or podcast that actually changed something for you", category: "rec" },
  { text: "underrated place you've been to recently", category: "rec" },
  { text: "what are you irrationally excited about right now?", category: "life" },
  { text: "something small that made you irrationally happy lately", category: "life" },
  { text: "most recent thing you genuinely laughed out loud at", category: "life" },
  { text: "what does a perfect tuesday look like for you right now?", category: "life" },
  { text: "what's something you've been meaning to do for over a year?", category: "goals" },
  { text: "one thing you want to be different by next month", category: "goals" },
  { text: "something you're quietly proud of lately", category: "goals" },
  { text: "a hill you are willing to die on right now", category: "hot take" },
  { text: "most overrated thing people your age are obsessed with", category: "hot take" },
  { text: "an opinion you have that you'd never say at a dinner party", category: "hot take" },
  { text: "show us where you are right now", category: "photo" },
  { text: "something on your desk or bedside table", category: "photo" },
  { text: "last screenshot on your camera roll", category: "photo" },
  { text: "a view you've seen recently that stuck with you", category: "photo" },
  { text: "how are we all doing honestly?", category: "poll", options: ["thriving", "surviving", "somewhere in between", "send help"] },
  { text: "what should we theme next month's issue?", category: "poll", options: ["seasons / nature", "nostalgia", "ambitions", "open topic"] },
  { text: "pick a group challenge for next month", category: "poll", options: ["read the same book", "try a new recipe", "go somewhere new", "a digital detox day"] },
]

export async function renderGarden(gId, accessToken) {
  currentAccessToken = accessToken
  groupId = gId

  const { data: { user } } = await supabase.auth.getUser()
  currentUserId = user.id

  document.querySelector('#app').innerHTML = `
    <div class="garden-page">

      <div class="issue-questions-section" id="issue-section">
        <div class="issue-section-header">
          <h1>this issue's questions</h1>
          <button class="issue-add-more-btn" id="issue-add-more">+ add more questions</button>
        </div>
        <div class="issue-questions-list" id="issue-questions-list">
          <div class="issue-empty-state" id="issue-empty">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <g transform="translate(20,20)">
                <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(0)"/>
                <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(72)"/>
                <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(144)"/>
                <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(216)"/>
                <path fill="none" d="M0,0 C-4,-3 -6,-14 0,-20 C6,-14 4,-3 0,0Z" stroke="#94B5A0" stroke-width="1.5" stroke-linecap="round" transform="rotate(288)"/>
                <circle fill="#C2DACC" cx="0" cy="0" r="4" stroke="#94B5A0" stroke-width="1.5"/>
              </g>
            </svg>
            <p class="issue-empty-title">nothing here yet</p>
            <p class="issue-empty-sub">write your own or tap + on any prompt below to add it to this issue</p>
          </div>
        </div>
      </div>

      <div class="garden-paper-sheet">
        <div class="garden-paper-content">

          <div class="garden-header-area">
            <h1>question garden</h1>
            <p class="garden-subtitle">write your own, generate ideas, or pick from the collection below</p>
          </div>

          <div class="add-prompt-label-above">ADD A NEW PROMPT</div>

          <div class="add-sticky" id="add-sticky">
            <div class="add-sticky-top">
              <label class="poll-toggle-label">
                <span class="poll-toggle-text">poll</span>
                <div class="poll-toggle-track" id="poll-track">
                  <div class="poll-toggle-thumb"></div>
                </div>
              </label>
            </div>
            <textarea id="question-input" class="add-sticky-textarea" placeholder="write your own question here..."></textarea>
            <div id="poll-options-wrap" style="display:none">
              <div class="poll-options-list" id="poll-options-list">
                <div class="poll-option-row"><span class="poll-dot"></span><input class="poll-option-input" placeholder="option 1" /></div>
                <div class="poll-option-row"><span class="poll-dot"></span><input class="poll-option-input" placeholder="option 2" /></div>
              </div>
              <button class="poll-add-option-btn" id="poll-add-option">+ add option</button>
            </div>
            <div class="add-sticky-actions">
              <button id="generate-btn" class="add-sticky-ai-btn">✦ generate with AI</button>
              <button id="add-question-btn" class="add-sticky-submit-btn" disabled>+ add to issue</button>
            </div>
            <p id="garden-message" class="garden-message"></p>
          </div>

          <div class="suggested-section">
            <h3 class="suggested-section-label">SUGGESTED PROMPTS</h3>
            <div class="cat-pills" id="cat-pills">
              ${CATEGORIES.map(cat => `
                <button class="pill ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">
                  ${cat === 'hot take' ? 'Hot Take' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              `).join('')}
            </div>
            <div class="cards-grid" id="question-list">
              <p>Loading...</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `

  renderNav(gId, accessToken, 'garden')
  await loadQuestions(gId)
  setupEventListeners(gId)
}

function setupEventListeners(gId) {
  // Category pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      activeFilter = e.target.dataset.filter
      showAllQuestions = false
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'))
      e.target.classList.add('active')
      renderFilteredQuestions()
    })
  })

  // Poll toggle
  const pollTrack = document.querySelector('#poll-track')
  pollTrack.addEventListener('click', () => {
    isPollMode = !isPollMode
    pollTrack.classList.toggle('on', isPollMode)
    document.querySelector('#poll-options-wrap').style.display = isPollMode ? 'block' : 'none'
    document.querySelector('#question-input').placeholder = isPollMode
      ? 'what should the group vote on?'
      : 'write your own question here...'
  })

  // Enable add button only when textarea has content
  document.querySelector('#question-input').addEventListener('input', () => {
    const hasText = document.querySelector('#question-input').value.trim().length > 0
    document.querySelector('#add-question-btn').disabled = !hasText
  })

  // Add poll option
  document.querySelector('#poll-add-option').addEventListener('click', () => {
    const list = document.querySelector('#poll-options-list')
    const count = list.querySelectorAll('.poll-option-input').length + 1
    const row = document.createElement('div')
    row.className = 'poll-option-row'
    row.innerHTML = `<span class="poll-dot"></span><input class="poll-option-input" placeholder="option ${count}" />`
    list.appendChild(row)
  })

  // Issue section scroll to input
  document.querySelector('#issue-add-more')?.addEventListener('click', () => {
    document.querySelector('#question-input')?.focus()
    document.querySelector('#question-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })

  // Add question button
  document.querySelector('#add-question-btn').addEventListener('click', async () => {
    const input = document.querySelector('#question-input')
    const text = input.value.trim()
    const message = document.querySelector('#garden-message')

    if (!text) {
      message.textContent = 'Please type a question first.'
      return
    }

    message.textContent = 'Adding...'

    const category = isPollMode ? 'poll' : 'fun'

    const { data: { user } } = await supabase.auth.getUser()

    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${currentAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        category,
        group_id: gId,
        added_by: user.id
      })
    })

    if (!response.ok) {
      const err = await response.json()
      message.textContent = err.message || 'Something went wrong.'
    } else {
      const newQuestion = await response.json()
      message.textContent = ''
      issuedQuestionIds.add(newQuestion[0].id)
      input.value = ''
      document.querySelector('#add-question-btn').disabled = true
      await loadQuestions(gId)
      renderIssueQuestions()
    }
  })

  // Generate with AI (placeholder with poll support)
  document.querySelector('#generate-btn').addEventListener('click', () => {
    const textSuggestions = [
      "what's a small habit you've picked up recently that you didn't expect to stick?",
      "if your current mood was a weather forecast, what would it say?",
      "what's a corner of the internet you've been living in lately?",
      "what are you currently pretending not to be stressed about?",
      "what's the most recent thing you googled that you'd never admit to?",
      "what's something you've been doing alone that you secretly love?",
      "if your apartment could talk, what would it say about you right now?",
      "what's the nicest thing a stranger has done for you recently?",
      "what's a phase you went through that you look back on with pure affection?",
    ]
    const pollSuggestions = [
      { q: "how are we all actually doing right now?", opts: ["thriving honestly", "surviving", "somewhere in between", "ask me tomorrow"] },
      { q: "ideal way to spend a free saturday?", opts: ["total rest", "social plans", "something creative", "adventure outside"] },
      { q: "current relationship with your phone?", opts: ["attached at the hip", "trying to detox", "healthy balance", "it's complicated"] },
      { q: "how do you feel about where you live right now?", opts: ["love it", "it's fine", "ready to move", "complicated"] },
    ]

    if (isPollMode) {
      const poll = pollSuggestions[Math.floor(Math.random() * pollSuggestions.length)]
      document.querySelector('#question-input').value = poll.q
      document.querySelector('#add-question-btn').disabled = false
      const inputs = document.querySelectorAll('.poll-option-input')
      poll.opts.forEach((opt, i) => {
        if (inputs[i]) inputs[i].value = opt
      })
    } else {
      const random = textSuggestions[Math.floor(Math.random() * textSuggestions.length)]
      document.querySelector('#question-input').value = random
      document.querySelector('#add-question-btn').disabled = false
    }
  })
}

async function loadQuestions(gId) {
  const questions = await dbQuery(
    'questions',
    `group_id=eq.${gId}&order=created_at.asc`,
    currentAccessToken
  )

  const realTexts = new Set((questions || []).map(q => q.text.toLowerCase()))
  const seedFiltered = SEED_QUESTIONS.filter(s => !realTexts.has(s.text.toLowerCase()))
  const seededWithIds = seedFiltered.map((s, i) => ({
    ...s,
    id: `seed-${i}`,
    isSeed: true
  }))

  allQuestions = [...(questions || []), ...seededWithIds]
  renderFilteredQuestions()
  renderIssueQuestions()
}

function renderFilteredQuestions() {
  const filtered = activeFilter === 'all'
    ? allQuestions
    : allQuestions.filter(q => (q.category || 'fun').toLowerCase() === activeFilter.toLowerCase())

  const list = document.querySelector('#question-list')

  if (!filtered || filtered.length === 0) {
    list.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;">
        <svg width="56" height="56" viewBox="0 0 40 40" fill="none" style="margin:0 auto 1rem;display:block;animation:sway 4s ease-in-out infinite;">
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
        <p style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;">the garden is empty</p>
        <p style="font-size:13px;color:var(--ink-faint);">add your first question above to get started</p>
      </div>`
    return
  }

  const visible = showAllQuestions ? filtered : filtered.slice(0, 9)
  const hasMore = !showAllQuestions && filtered.length > 9

  list.innerHTML = visible.map((q, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length]
    const isInIssue = issuedQuestionIds.has(q.id)
    const isPoll = q.category === 'poll'
    const isPhoto = q.category === 'photo'

    return `
      <div class="q-card ${isInIssue ? 'q-card-in-issue' : ''}" style="background:${color}">
        <div class="q-card-top">
          <span class="q-card-cat">${(q.category || 'fun').toUpperCase()}</span>
          ${isPoll ? '<span class="q-card-type-badge">poll</span>' : ''}
          ${isPhoto ? '<span class="q-card-type-badge">photo</span>' : ''}
        </div>
        <div class="q-card-text">${q.text}</div>
        ${isPoll && q.options ? `
          <div class="q-card-options">
            ${q.options.slice(0, 3).map(o => `<div class="q-card-option">${o}</div>`).join('')}
          </div>` : ''}
        <div class="q-card-footer">
          <span class="q-card-in-badge" style="${isInIssue ? '' : 'display:none'}">✓ in issue</span>
          <button class="q-card-action ${isInIssue ? 'q-card-action-added' : ''}"
                  data-question-id="${q.id}"
                  data-is-seed="${q.isSeed || false}"
                  data-text="${q.text.replace(/"/g, '&quot;')}"
                  data-category="${q.category || 'fun'}">
            ${isInIssue ? '✓' : '+'}
          </button>
        </div>
      </div>
    `
  }).join('')

  if (hasMore) {
    list.innerHTML += `
      <div style="grid-column:1/-1;text-align:center;padding:1rem 0 0.5rem;">
        <button id="show-all-btn" style="background:transparent;border:1.5px solid var(--border-mid);color:var(--ink-faint);border-radius:999px;padding:8px 20px;font-size:13px;font-family:'Montserrat',sans-serif;cursor:pointer;transition:all 0.15s;">
          show all ${filtered.length} prompts
        </button>
      </div>`
    document.querySelector('#show-all-btn').addEventListener('click', () => {
      showAllQuestions = true
      renderFilteredQuestions()
    })
  }

  document.querySelectorAll('.q-card-action').forEach(btn => {
    btn.addEventListener('click', async () => {
      const qId = btn.dataset.questionId
      const isSeed = btn.dataset.isSeed === 'true'

      if (issuedQuestionIds.has(qId)) {
        issuedQuestionIds.delete(qId)
        renderFilteredQuestions()
        renderIssueQuestions()
        return
      }

      if (isSeed) {
        const { data: { user } } = await supabase.auth.getUser()
        const response = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: btn.dataset.text,
            category: btn.dataset.category,
            group_id: groupId,
            added_by: user.id
          })
        })
        if (response.ok) {
          const saved = await response.json()
          issuedQuestionIds.add(saved[0].id)
          await loadQuestions(groupId)
        }
      } else {
        issuedQuestionIds.add(qId)
        renderFilteredQuestions()
        renderIssueQuestions()
      }
    })
  })
}

function renderIssueQuestions() {
  const emptyState = document.getElementById('issue-empty')
  const list = document.getElementById('issue-questions-list')

  list.querySelectorAll('.issue-question-row').forEach(r => r.remove())

  if (issuedQuestionIds.size === 0) {
    if (emptyState) emptyState.style.display = 'flex'
    return
  }

  if (emptyState) emptyState.style.display = 'none'

  const issueQuestions = allQuestions.filter(q => issuedQuestionIds.has(q.id))

  issueQuestions.forEach((q, i) => {
    const row = document.createElement('div')
    row.className = 'issue-question-row'
    row.innerHTML = `
      <span class="issue-q-number">${i + 1}</span>
      <span class="issue-q-text">${q.text}</span>
      ${q.category === 'poll' ? '<span class="poll-badge">POLL</span>' : ''}
      <button class="issue-q-remove" data-question-id="${q.id}">×</button>
    `
    list.appendChild(row)
  })

  document.querySelectorAll('.issue-q-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      issuedQuestionIds.delete(btn.dataset.questionId)
      renderIssueQuestions()
      renderFilteredQuestions()
    })
  })
}