// zine.js — read everyone's answers as a zine

import { supabase, dbQuery } from './supabase.js'
import { renderGarden } from './garden.js'

let currentAccessToken = null

export async function renderZine(groupId, accessToken) {
  currentAccessToken = accessToken

  document.querySelector('#app').innerHTML = `
    <div class="zine-container">
      <h1>Zeene 🌿</h1>
      <h2>This Month's Zine</h2>

      <div id="zine-content">
        <p>Loading...</p>
      </div>

      <div class="zine-footer">
        <button id="back-btn">Back to Garden</button>
        <button id="signout-btn">Sign out</button>
      </div>
    </div>
  `

  await loadZine(groupId)

  document.querySelector('#back-btn').addEventListener('click', () => {
    renderGarden(groupId, accessToken)
  })

  document.querySelector('#signout-btn').addEventListener('click', () => {
    supabase.auth.signOut()
  })
}

async function loadZine(groupId) {
  const content = document.querySelector('#zine-content')

  // Get all questions for this group
  const questions = await dbQuery(
    'questions',
    `group_id=eq.${groupId}&order=created_at.asc`,
    currentAccessToken
  )

  if (!questions || questions.length === 0) {
    content.innerHTML = `<p>No questions yet. Add some in the garden first!</p>`
    return
  }

  // Get all answers for these questions
  const questionIds = questions.map(q => q.id).join(',')
  const answers = await dbQuery(
    'answers',
    `question_id=in.(${questionIds})&select=*`,
    currentAccessToken
  )

  // Get all members of this group
  const members = await dbQuery(
    'group_members',
    `group_id=eq.${groupId}&select=user_id`,
    currentAccessToken
  )

  // Get profiles for all members
  const userIds = members.map(m => m.user_id).join(',')
  const profiles = await dbQuery(
    'profiles',
    `id=in.(${userIds})&select=*`,
    currentAccessToken
  )

  // Build a map of user_id -> display name
  const profileMap = {}
  profiles.forEach(p => {
    profileMap[p.id] = p.display_name || 'Anonymous'
  })

  // Build a map of question_id -> array of answers
  const answerMap = {}
  questions.forEach(q => {
    answerMap[q.id] = []
  })
  answers.forEach(a => {
    if (answerMap[a.question_id]) {
      answerMap[a.question_id].push(a)
    }
  })

  // Render the zine
  content.innerHTML = questions.map(q => {
    const qAnswers = answerMap[q.id]

    if (qAnswers.length === 0) {
      return `
        <div class="zine-question">
          <h3>${q.text}</h3>
          <p class="no-answers">No answers yet.</p>
        </div>
      `
    }

    return `
      <div class="zine-question">
        <h3>${q.text}</h3>
        <div class="zine-answers">
          ${qAnswers.map(a => `
            <div class="zine-answer">
              <p class="answer-author">${profileMap[a.user_id]}</p>
              <p class="answer-content">${a.content}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }).join('')
}