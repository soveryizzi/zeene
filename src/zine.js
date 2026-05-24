// zine.js — notebook-style journal reader with page curl animation

import { supabase, dbQuery } from './supabase.js'
import { renderNav } from './nav.js'

let currentAccessToken = null
let pages = [] // array of page objects (0 = cover, 1+ = questions)
let currentPage = 0

let coverData = {
  groupName: '',
  profiles: [],
  questionCount: 0
}

const CARD_COLORS = [
  { bg: '#C8DFB8', text: '#2E5C2A' },
  { bg: '#D8CCE8', text: '#8C6B9E' },
  { bg: '#EEC8D4', text: '#D4789A' },
]

export async function renderZine(groupId, accessToken) {
  currentAccessToken = accessToken
  currentPage = 0

  document.querySelector('#app').innerHTML = `
    <div class="zine-container">
      <div class="notebook-wrap">
        <div class="notebook-stage" id="notebook-stage">
          <div class="notebook-page" id="current-page"></div>
        </div>
        <div class="journal-nav">
          <button class="arrow-btn" id="prev-btn">←</button>
          <span class="page-indicator" id="page-indicator">Cover</span>
          <button class="arrow-btn" id="next-btn">→</button>
        </div>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'zine')
  await loadZine(groupId)
}

async function loadZine(groupId) {
  const questions = await dbQuery(
    'questions',
    `group_id=eq.${groupId}&order=created_at.asc`,
    currentAccessToken
  )

  const members = await dbQuery(
    'group_members',
    `group_id=eq.${groupId}&select=user_id`,
    currentAccessToken
  )

  const userIds = members.map(m => m.user_id).join(',')
  const profiles = await dbQuery(
    'profiles',
    `id=in.(${userIds})&select=*`,
    currentAccessToken
  )

  const group = await dbQuery(
    'groups',
    `id=eq.${groupId}&select=name`,
    currentAccessToken
  )
  const groupName = group[0]?.name || 'Our group'

  const profileMap = {}
  const colorMap = {}
  profiles.forEach((p, i) => {
    profileMap[p.id] = p.display_name || 'Anonymous'
    colorMap[p.id] = CARD_COLORS[i % CARD_COLORS.length]
  })

  pages = []

  if (questions && questions.length > 0) {
    const questionIds = questions.map(q => q.id).join(',')
    const answers = await dbQuery(
      'answers',
      `question_id=in.(${questionIds})&select=*`,
      currentAccessToken
    )

    const answerMap = {}
    questions.forEach(q => { answerMap[q.id] = [] })
    answers.forEach(a => {
      if (answerMap[a.question_id]) answerMap[a.question_id].push(a)
    })

    questions.forEach((q, i) => {
      pages.push({
        type: 'question',
        questionNum: i + 1,
        totalQuestions: questions.length,
        question: q.text,
        answers: answerMap[q.id],
        profileMap,
        colorMap
      })
    })
  }

  coverData = { groupName, profiles, questionCount: questions?.length || 0 }
  renderCurrentPage()

  document.querySelector('#prev-btn').addEventListener('click', () => navigate(-1))
  document.querySelector('#next-btn').addEventListener('click', () => navigate(1))

  let touchStartX = 0
  const stage = document.querySelector('#notebook-stage')
  stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX })
  stage.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1)
  })
}

function navigate(dir) {
  const newPage = currentPage + dir
  if (newPage < 0 || newPage > pages.length) return

  const pageEl = document.querySelector('#current-page')

  // Fade out
  pageEl.style.transition = 'opacity 0.2s ease'
  pageEl.style.opacity = '0'

  setTimeout(() => {
    currentPage = newPage
    renderCurrentPage()
    // Fade in
    pageEl.style.opacity = '0'
    requestAnimationFrame(() => {
      pageEl.style.transition = 'opacity 0.2s ease'
      pageEl.style.opacity = '1'
    })
    updateIndicator()
  }, 200)
}

function updateIndicator() {
  const indicator = document.querySelector('#page-indicator')
  if (currentPage === 0) {
    indicator.textContent = 'Cover'
  } else {
    indicator.textContent = `${currentPage} of ${pages.length}`
  }
}

function renderCurrentPage() {
  const pageEl = document.querySelector('#current-page')

  if (currentPage === 0) {
    renderCoverPage(pageEl)
  } else {
    renderQuestionPage(pageEl, pages[currentPage - 1])
  }

  updatePageButtonStates()
}

function updatePageButtonStates() {
  const prevBtn = document.querySelector('#prev-btn')
  const nextBtn = document.querySelector('#next-btn')

  prevBtn.disabled = currentPage === 0
  prevBtn.style.opacity = currentPage === 0 ? '0.3' : '1'

  nextBtn.disabled = currentPage === pages.length
  nextBtn.style.opacity = currentPage === pages.length ? '0.3' : '1'
}

function renderCoverPage(el) {
  const { groupName, profiles, questionCount } = coverData
  const now = new Date()
  const month = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()

  const memberAvatars = profiles.slice(0, 6).map((p, i) => {
    const color = CARD_COLORS[i % CARD_COLORS.length]
    const initials = (p.display_name || 'AN').slice(0, 2).toUpperCase()
    return `
      <div class="avatar-item">
        <div class="avatar-circle" style="background:${color.bg};color:${color.text}">${initials}</div>
        <div class="avatar-name">${p.display_name || 'Anonymous'}</div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div class="notebook-page-cover">
      <div class="spine-binding">
        ${Array(5).fill('<div class="binding-ring"></div>').join('')}
      </div>

      <div class="cover-content">
        <p class="cover-month">${month.toUpperCase()} ${year}</p>

        <div class="cover-title-area">
          <div class="cover-title">Zeene</div>
          <div class="cover-title-ghost">Zeene</div>
        </div>

        <p class="cover-group">${groupName}</p>
        <p class="cover-question-count">${questionCount} question${questionCount !== 1 ? 's' : ''}</p>
      </div>

      <div class="cover-members">
        ${memberAvatars}
      </div>

      <svg class="cover-flower" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="60" rx="16" ry="28" fill="#D4789A" opacity="0.6" transform="rotate(0 60 60)"/>
        <ellipse cx="60" cy="60" rx="16" ry="28" fill="#D4789A" opacity="0.6" transform="rotate(60 60 60)"/>
        <ellipse cx="60" cy="60" rx="16" ry="28" fill="#D4789A" opacity="0.6" transform="rotate(120 60 60)"/>
        <ellipse cx="63" cy="63" rx="16" ry="28" fill="#8C6B9E" opacity="0.5" transform="rotate(0 63 63)"/>
        <ellipse cx="63" cy="63" rx="16" ry="28" fill="#8C6B9E" opacity="0.5" transform="rotate(60 63 63)"/>
        <ellipse cx="63" cy="63" rx="16" ry="28" fill="#8C6B9E" opacity="0.5" transform="rotate(120 63 63)"/>
        <circle cx="60" cy="60" r="10" fill="#D4789A" opacity="0.7"/>
        <circle cx="63" cy="63" r="10" fill="#8C6B9E" opacity="0.5"/>
      </svg>

    </div>
  `
}

function renderQuestionPage(el, pageData) {
  const rotations = [-1.5, 1, -0.8, 0.5, -1.2, 0.8]

  const stickies = pageData.answers.map((a, i) => {
    const color = pageData.colorMap[a.user_id] || CARD_COLORS[0]
    const rotation = rotations[i % rotations.length]
    return `
      <div class="sticky-note" style="background:${color.bg};transform:rotate(${rotation}deg)">
        <div class="sticky-tab" style="background:${color.bg}"></div>
        <div class="sticky-content">
          <p class="sticky-text">${a.content}</p>
          <p class="sticky-author" style="color:${color.text}">${pageData.profileMap[a.user_id] || 'Anonymous'}</p>
        </div>
      </div>
    `
  }).join('')

  el.innerHTML = `
    <div class="notebook-page-question">
      <div class="page-spine"></div>

      <div class="hole-punch hole-top"></div>
      <div class="hole-punch hole-mid"></div>
      <div class="hole-punch hole-bot"></div>

      <div class="page-content">
        <p class="question-label">Question ${pageData.questionNum} of ${pageData.totalQuestions}</p>
        <p class="question-text">${pageData.question}</p>
        <div class="stickies-grid">
          ${stickies}
        </div>
      </div>

      <p class="page-number">${pageData.questionNum}</p>
    </div>
  `
}