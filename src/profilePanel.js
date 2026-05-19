// profilePanel.js — slide-in profile panel

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'

export async function openProfilePanel(accessToken) {
  // Get current user and profile
  const { data: { user } } = await supabase.auth.getUser()
  const profiles = await dbQuery(
    'profiles',
    `id=eq.${user.id}&select=display_name`,
    accessToken
  )
  const profile = profiles[0] || {}

  // Create overlay
  const overlay = document.createElement('div')
  overlay.className = 'profile-overlay'
  overlay.innerHTML = `
    <div class="profile-panel">
      <button class="profile-close-btn" id="panel-close">← Close</button>
      <h2>Your profile</h2>

      <div class="profile-field">
        <label>Display name</label>
        <input type="text" id="panel-name" value="${profile.display_name || ''}" placeholder="Your name..." />
        <button class="profile-save-btn" id="panel-name-save">Save name</button>
        <p class="profile-status" id="panel-name-status"></p>
      </div>

      <hr class="profile-divider" />

      <div class="profile-field">
        <label>New password</label>
        <input type="password" id="panel-password" placeholder="New password..." />
        <button class="profile-save-btn" id="panel-password-save">Update password</button>
        <p class="profile-status" id="panel-password-status"></p>
      </div>

      <hr class="profile-divider" />

      <button class="profile-signout-btn" id="panel-signout">Sign out</button>
    </div>
  `

  document.body.appendChild(overlay)

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove()
  })

  // Close button
  overlay.querySelector('#panel-close').addEventListener('click', () => {
    overlay.remove()
  })

  // Save display name
  overlay.querySelector('#panel-name-save').addEventListener('click', async () => {
    const name = overlay.querySelector('#panel-name').value.trim()
    const status = overlay.querySelector('#panel-name-status')

    if (!name) {
      status.textContent = 'Please enter a name.'
      return
    }

    status.textContent = 'Saving...'

    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ display_name: name })
    })

    if (response.ok) {
      status.textContent = 'Saved!'
    } else {
      status.textContent = 'Something went wrong.'
    }
  })

  // Update password
  overlay.querySelector('#panel-password-save').addEventListener('click', async () => {
    const password = overlay.querySelector('#panel-password').value
    const status = overlay.querySelector('#panel-password-status')

    if (!password || password.length < 6) {
      status.textContent = 'Must be at least 6 characters.'
      return
    }

    status.textContent = 'Updating...'

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      status.textContent = error.message
    } else {
      status.textContent = 'Password updated!'
      overlay.querySelector('#panel-password').value = ''
    }
  })

  // Sign out
  overlay.querySelector('#panel-signout').addEventListener('click', () => {
    overlay.remove()
    supabase.auth.signOut()
  })
}