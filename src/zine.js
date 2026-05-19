// zine.js — journal reader with page turn animation

import { supabase, dbQuery } from './supabase.js'
import { renderNav } from './nav.js'

let currentAccessToken = null
let pages = [] // array of page objects
let currentSpread = 0 // 0 = cover, 1 = first spread, etc.

const CARD_COLORS = [
  { bg: '#C8DFB8', border: '#A8C4A0', author: '#2E5C2A' },
  { bg: '#D8CCE8', border: '#C9B2D6', author: '#8C6B9E' },
  { bg: '#EEC8D4', border: '#EAB8CC', author: '#D4789A' },
]

export async function renderZine(groupId, accessToken) {
  currentAccessToken = accessToken
  currentSpread = 0

  document.querySelector('#app').innerHTML = `
    <div class="zine-container">
      <div class="journal-wrap">
        <div class="journal" id="journal"></div>
        <div class="journal-nav">
          <button class="arrow-btn" id="prev-btn">←</button>
          <span class="page-indicator" id="page-indicator"></span>
          <button class="arrow-btn" id="next-btn">→</button>
        </div>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'zine')
  await loadZine(groupId)
}

async function loadZine(groupId) {
  // Fetch all data
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

  // Build profile and color maps
  const profileMap = {}
  const colorMap = {}
  profiles.forEach((p, i) => {
    profileMap[p.id] = p.display_name || 'Anonymous'
    colorMap[p.id] = CARD_COLORS[i % CARD_COLORS.length]
  })

  // Build pages array
  // Page 0 = cover
  // Each question gets a spread (left = question + stickies, right = overflow or next question)
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
      const qAnswers = answerMap[q.id]
      const leftStickies = qAnswers.slice(0, 6)
      const rightStickies = qAnswers.slice(6)

      pages.push({
        type: 'spread',
        questionNum: i + 1,
        totalQuestions: questions.length,
        question: q.text,
        leftStickies,
        rightStickies,
        hasOverflow: rightStickies.length > 0,
        profileMap,
        colorMap
      })
    })
  }

  // Render cover first
  renderSpread(groupName, profiles, questions?.length || 0)

  // Nav
  document.querySelector('#prev-btn').addEventListener('click', () => navigate(-1))
  document.querySelector('#next-btn').addEventListener('click', () => navigate(1))

  // Swipe support
  let touchStartX = 0
  const journal = document.querySelector('#journal')
  journal.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX })
  journal.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1)
  })
}

function navigate(dir) {
  const newSpread = currentSpread + dir
  if (newSpread < 0 || newSpread > pages.length) return

  const journal = document.querySelector('#journal')
  const animClass = dir > 0 ? 'page-turn-forward' : 'page-turn-back'

  journal.classList.add(animClass)
  setTimeout(() => {
    journal.classList.remove(animClass)
    currentSpread = newSpread
    if (currentSpread === 0) {
      renderSpread(null, null, null, true)
    } else {
      renderPage(pages[currentSpread - 1])
    }
    updateIndicator()
  }, 300)

  updateIndicator()
}

function updateIndicator() {
  const indicator = document.querySelector('#page-indicator')
  if (!indicator) return
  if (currentSpread === 0) {
    indicator.textContent = 'Cover'
  } else {
    indicator.textContent = `${currentSpread} of ${pages.length}`
  }
}

function renderSpread(groupName, profiles, questionCount, fromCache = false) {
  const journal = document.querySelector('#journal')

  if (currentSpread === 0) {
    // Render cover
    const memberAvatars = profiles ? profiles.slice(0, 5).map((p, i) => {
      const color = CARD_COLORS[i % CARD_COLORS.length]
      const initials = (p.display_name || 'AN').slice(0, 2).toUpperCase()
      return `
        <div class="member-card">
          <div class="member-avatar" style="background:${color.bg};color:${color.author}">${initials}</div>
          <p class="member-name">${p.display_name || 'Anonymous'}</p>
        </div>
      `
    }).join('') : ''

    const now = new Date()
    const month = now.toLocaleString('default', { month: 'long' })
    const year = now.getFullYear()

    journal.innerHTML = `
      <div class="journal-cover">
        <div class="cover-spine">
          ${Array(6).fill('<div class="spine-ring"></div>').join('')}
        </div>
        <div class="cover-left">
          <svg class="cover-flowers" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="130" cy="150" rx="32" ry="54" fill="#D4789A" opacity="0.45" transform="rotate(0 130 150)"/>
            <ellipse cx="130" cy="150" rx="32" ry="54" fill="#D4789A" opacity="0.45" transform="rotate(45 130 150)"/>
            <ellipse cx="130" cy="150" rx="32" ry="54" fill="#D4789A" opacity="0.45" transform="rotate(90 130 150)"/>
            <ellipse cx="130" cy="150" rx="32" ry="54" fill="#D4789A" opacity="0.45" transform="rotate(135 130 150)"/>
            <ellipse cx="136" cy="156" rx="32" ry="54" fill="#8C6B9E" opacity="0.28" transform="rotate(0 136 156)"/>
            <ellipse cx="136" cy="156" rx="32" ry="54" fill="#8C6B9E" opacity="0.28" transform="rotate(45 136 156)"/>
            <ellipse cx="136" cy="156" rx="32" ry="54" fill="#8C6B9E" opacity="0.28" transform="rotate(90 136 156)"/>
            <ellipse cx="136" cy="156" rx="32" ry="54" fill="#8C6B9E" opacity="0.28" transform="rotate(135 136 156)"/>
            <circle cx="130" cy="150" r="20" fill="#D4789A" opacity="0.7"/>
            <circle cx="135" cy="155" r="20" fill="#8C6B9E" opacity="0.3"/>
            <path d="M130 178 Q118 195 108 215" stroke="#D4789A" stroke-width="2" fill="none" opacity="0.4"/>
            <ellipse cx="112" cy="202" rx="18" ry="8" fill="#D4789A" opacity="0.3" transform="rotate(-20 112 202)"/>
            <path d="M70 80 Q60 108 52 135" stroke="#8C6B9E" stroke-width="1.5" fill="none" opacity="0.45"/>
            <ellipse cx="64" cy="94" rx="11" ry="4" fill="#8C6B9E" opacity="0.4" transform="rotate(-40 64 94)"/>
            <ellipse cx="58" cy="108" rx="11" ry="4" fill="#8C6B9E" opacity="0.4" transform="rotate(-35 58 108)"/>
            <ellipse cx="54" cy="122" rx="10" ry="4" fill="#8C6B9E" opacity="0.35" transform="rotate(-30 54 122)"/>
          </svg>
          <div style="position:relative;z-index:1">
            <p class="cover-month">${month} ${year}</p>
            <div class="cover-title">Zeene</div>
            <p class="cover-group">${groupName}</p>
            <p class="cover-vol">${questionCount} question${questionCount !== 1 ? 's' : ''} inside</p>
          </div>
        </div>
        <div class="cover-right">
          <div class="polaroid">
            <div class="polaroid-img">${groupName[0].toUpperCase()}</div>
            <p class="polaroid-caption">${groupName}</p>
          </div>
          <div>
            <p class="members-label">The crew</p>
            <div class="members">${memberAvatars}</div>
          </div>
        </div>
      </div>
    `
  } else {
    renderPage(pages[currentSpread - 1])
  }

  updateIndicator()
}

function renderPage(page) {
  const journal = document.querySelector('#journal')

  const renderStickies = (stickies) => stickies.map((a, i) => {
    const color = page.colorMap[a.user_id] || CARD_COLORS[0]
    const rotations = [-1.5, 1, -0.8, 0.5, -1.2, 0.8]
    return `
      <div class="sticky" style="background:${color.bg};border:0.5px solid ${color.border};transform:rotate(${rotations[i % rotations.length]}deg)">
        <p class="sticky-txt">${a.content}</p>
        <p class="sticky-auth" style="color:${color.author}">${page.profileMap[a.user_id] || 'Anonymous'}</p>
      </div>
    `
  }).join('')

  const rightContent = page.hasOverflow
    ? `
      <p class="overflow-label">...continued</p>
      <div class="page-stickies">${renderStickies(page.rightStickies)}</div>
    `
    : `<p class="no-answers" style="font-size:13px;color:#A0A898;font-style:italic;line-height:2;padding-top:8px">No more answers on this page.</p>`

  journal.innerHTML = `
    <div class="journal-open">
      <div class="open-spine">
        ${Array(6).fill('<div class="spine-hole"></div>').join('')}
      </div>
      <div class="page-left">
        <div class="page-holes-left">
          <div class="hole"></div>
          <div class="hole"></div>
          <div class="hole"></div>
        </div>
        <p class="question-num">Question ${page.questionNum} of ${page.totalQuestions}</p>
        <p class="paper-question">${page.question}</p>
        <div class="page-stickies">${renderStickies(page.leftStickies)}</div>
        <p class="page-num">${(page.questionNum * 2) - 1}</p>
      </div>
      <div class="page-right">
        ${rightContent}
        <p class="page-num-right">${page.questionNum * 2}</p>
      </div>
    </div>
  `
}