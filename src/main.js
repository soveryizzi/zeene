// main.js — entry point

import './style.css'
import { supabase } from './supabase.js'
import { renderAuth } from './auth.js'

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // User is logged in
    document.querySelector('#app').innerHTML = `
      <h1>Zeene 🌿</h1>
      <p>Welcome, ${session.user.email}!</p>
      <button id="signout">Sign out</button>
    `
    document.querySelector('#signout').addEventListener('click', () => {
      supabase.auth.signOut()
    })
  } else {
    // No user — show auth screen
    renderAuth()
  }
})