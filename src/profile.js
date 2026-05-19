// profile.js — set your display name on first login

import { supabase, dbQuery, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'

export async function renderSetDisplayName(onComplete) {
  document.querySelector('#app').innerHTML = `
    <div class="profile-container">
      <h1>Zeene 🌿</h1>
      <h2>What should we call you?</h2>
      <p>This is how your name will appear in the zine.</p>

      <div class="profile-form">
        <input type="text" id="display-name-input" placeholder="Your name..." maxlength="30" />
        <button id="save-name-btn">Let's go</button>
      </div>

      <p id="profile-message"></p>
    </div>
  `

  document.querySelector('#save-name-btn').addEventListener('click', async () => {
    const input = document.querySelector('#display-name-input')
    const name = input.value.trim()
    const message = document.querySelector('#profile-message')

    if (!name) {
      message.textContent = 'Please enter a name.'
      return
    }

    message.textContent = 'Saving...'

    const { data: { user } } = await supabase.auth.getUser()

    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ display_name: name })
    })

    if (response.ok) {
      onComplete()
    } else {
      message.textContent = 'Something went wrong. Try again.'
    }
  })
}