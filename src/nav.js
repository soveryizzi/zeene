// nav.js — persistent navigation

import { renderGarden } from './garden.js'
import { renderAnswers } from './answers.js'
import { renderZine } from './zine.js'
import { openProfilePanel } from './profilePanel.js'

export function renderNav(groupId, accessToken, activePage) {
  const existing = document.querySelector('.nav-top')
  if (existing) existing.remove()

  const nav = document.createElement('nav')
  nav.className = 'nav-top'
  nav.innerHTML = `
    <div class="nav-left">
      <span class="nav-logo" id="nav-logo">Zeene</span>
    </div>

    <div class="nav-center">
      <button class="nav-item ${activePage === 'garden' ? 'active' : ''}" id="nav-garden">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
          <path d="M12 20V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M12 14C12 14 8 12 6 8C8 8 11 9 12 14Z" fill="currentColor"/>
          <path d="M12 11C12 11 15 9 18 9C16 13 13 14 12 11Z" fill="currentColor"/>
          <path d="M9 20H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="nav-label">Question Garden</span>
      </button>

      <button class="nav-item ${activePage === 'answers' ? 'active' : ''}" id="nav-answers">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
          <path d="M4 20L8 19L19 8L16 5L5 16L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M16 5L19 8" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span class="nav-label">Your Answers</span>
      </button>

      <button class="nav-item ${activePage === 'zine' ? 'active' : ''}" id="nav-zine">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
          <path d="M12 6V19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M5 5C7 5 10 6 12 8C14 6 17 5 19 5V18C17 18 14 19 12 21C10 19 7 18 5 18V5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <span class="nav-label">Read the Zine</span>
      </button>
    </div>

    <div class="nav-right">
      <button class="nav-profile-btn" id="nav-profile">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 20C5 16.5 8 14 12 14C16 14 19 16.5 19 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `

  document.body.prepend(nav)

  document.querySelector('#nav-logo').addEventListener('click', () => {
    renderZine(groupId, accessToken)
  })

  document.querySelector('#nav-garden').addEventListener('click', () => {
    renderGarden(groupId, accessToken)
  })

  document.querySelector('#nav-answers').addEventListener('click', () => {
    renderAnswers(groupId, accessToken)
  })

  document.querySelector('#nav-zine').addEventListener('click', () => {
    renderZine(groupId, accessToken)
  })

  document.querySelector('#nav-profile').addEventListener('click', () => {
    openProfilePanel(accessToken)
  })
}