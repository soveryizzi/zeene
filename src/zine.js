// zine.js — read everyone's answers as a zine

import { supabase, dbQuery } from './supabase.js'
import { renderNav } from './nav.js'

let currentAccessToken = null

export async function renderZine(groupId, accessToken) {
  currentAccessToken = accessToken

  document.querySelector('#app').innerHTML = `
    <div class="zine-container">
      <h1>This Month's Zine</h1>
      <p class="page-sub">May 2026</p>

      <div id="zine-content">
        <p>Loading...</p>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'zine')
  await loadZine(groupId)
}

async function loadZine(groupId) {
  const content = document.querySelector('#zine-content')

  const questions = await dbQuery(
    'questions',
    `group_id=eq.${groupId}&order=created_at.asc`,
    currentAccessToken
  )

  if (!questions || questions.length === 0) {
    content.innerHTML = `<p>No questions yet. Add some in the garden first!</p>`
    return
  }

  const questionIds = questions.map(q => q.id).join(',')
  const answers = await dbQuery(
    'answers',
    `question_id=in.(${questionIds})&select=*`,
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

  // Assign a color to each user
  const CARD_COLORS = [
    { bg: '#C8DFB8', border: '#A8C4A0', author: '#2E5C2A' },
    { bg: '#D8CCE8', border: '#C9B2D6', author: '#8C6B9E' },
    { bg: '#EEC8D4', border: '#EAB8CC', author: '#D4789A' },
  ]

  const profileMap = {}
  const colorMap = {}
  profiles.forEach((p, i) => {
    profileMap[p.id] = p.display_name || 'Anonymous'
    colorMap[p.id] = CARD_COLORS[i % CARD_COLORS.length]
  })

  const answerMap = {}
  questions.forEach(q => { answerMap[q.id] = [] })
  answers.forEach(a => {
    if (answerMap[a.question_id]) answerMap[a.question_id].push(a)
  })

  content.innerHTML = questions.map(q => {
    const qAnswers = answerMap[q.id]

    if (qAnswers.length === 0) {
      return `
        <div class="paper-sheet">
          <div class="paper-bg"></div>
          <div class="holes">
            <div class="hole"></div>
            <div class="hole"></div>
            <div class="hole"></div>
          </div>
          <div class="paper-content">
            <p class="paper-question">${q.text}</p>
            <p class="no-answers">No answers yet.</p>
          </div>
        </div>
      `
    }

    return `
      <div class="paper-sheet">
        <div class="paper-bg"></div>
        <div class="holes">
          <div class="hole"></div>
          <div class="hole"></div>
          <div class="hole"></div>
        </div>
        <div class="paper-content">
          <p class="paper-question">${q.text}</p>
          <div class="stickies">
            ${qAnswers.map(a => {
              const color = colorMap[a.user_id] || CARD_COLORS[0]
              return `
                <div class="sticky" style="background:${color.bg}; border: 0.5px solid ${color.border};">
                  <p class="sticky-text">${a.content}</p>
                  <p class="sticky-author" style="color:${color.author}">${profileMap[a.user_id] || 'Anonymous'}</p>
                </div>
              `
            }).join('')}
          </div>
        </div>
      </div>
    `
  }).join('')
}