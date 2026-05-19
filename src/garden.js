// garden.js — question garden where members add and pick questions

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'
import { renderAnswers } from './answers.js'
import { renderZine } from './zine.js'
import { openProfilePanel } from './profilePanel.js'
import { renderNav } from './nav.js'

let currentAccessToken = null

export async function renderGarden(groupId, accessToken) {
  currentAccessToken = accessToken

  const groups = await dbQuery(
    'groups',
    `id=eq.${groupId}&select=name,invite_code`,
    accessToken
  )
  const group = groups[0] || { name: 'Your group', invite_code: '?' }

  const { data: { user } } = await supabase.auth.getUser()
  const profiles = await dbQuery(
    'profiles',
    `id=eq.${user.id}&select=display_name`,
    accessToken
  )
  const displayName = profiles[0]?.display_name || '?'
  const initial = displayName[0].toUpperCase()

  document.querySelector('#app').innerHTML = `
    <div class="garden-container">
      <div class="garden-header">
        <h1>Question Garden</h1>
        <div class="group-info">
          <span class="group-name">${group.name}</span>
          <span class="invite-code">Invite: <strong>${group.invite_code}</strong></span>
        </div>
      </div>

      <p class="section-label">Add a question</p>

      <div class="add-question">
        <input type="text" id="question-input" placeholder="Write your own question..." />
        <button id="add-question-btn">Add</button>
      </div>

      <p id="garden-message"></p>

      <div id="question-list">
        <p>Loading questions...</p>
      </div>
    </div>
  `

  renderNav(groupId, accessToken, 'garden')
  await loadQuestions(groupId)

  document.querySelector('#add-question-btn').addEventListener('click', async () => {
    const input = document.querySelector('#question-input')
    const text = input.value.trim()
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
      body: JSON.stringify({ text, group_id: groupId, added_by: user.id })
    })

    if (!response.ok) {
      const err = await response.json()
      message.textContent = err.message || 'Something went wrong.'
    } else {
      message.textContent = ''
      input.value = ''
      await loadQuestions(groupId)
    }
  })
}

async function loadQuestions(groupId) {
  const questions = await dbQuery(
    'questions',
    `group_id=eq.${groupId}&order=created_at.asc`,
    currentAccessToken
  )

  const list = document.querySelector('#question-list')

  if (!questions || questions.length === 0) {
    list.innerHTML = `<p>No questions yet. Add the first one!</p>`
    return
  }

  list.innerHTML = questions.map(q => `
    <div class="question-item">
      <p>${q.text}</p>
    </div>
  `).join('')
}