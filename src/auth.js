// auth.js — handles sign up and log in

import { supabase } from './supabase.js'

export function renderAuth() {
  document.querySelector('#app').innerHTML = `
    <div class="auth-container">
      <h1>Zeene 🌿</h1>
      <p class="tagline">A monthly zine for you and your friends</p>

      <div class="auth-box">
        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login">Log in</button>
          <button class="auth-tab" id="tab-signup">Sign up</button>
        </div>

        <div id="auth-form">
          <input type="email" id="auth-email" placeholder="Email" />
          <input type="password" id="auth-password" placeholder="Password" />
          <button id="auth-submit">Log in</button>
        </div>

        <p id="auth-message"></p>
      </div>
    </div>
  `

  // Tab switching
  document.querySelector('#tab-login').addEventListener('click', () => {
    setMode('login')
  })

  document.querySelector('#tab-signup').addEventListener('click', () => {
    setMode('signup')
  })

  // Form submit
  document.querySelector('#auth-submit').addEventListener('click', handleAuth)

  let mode = 'login'

  function setMode(newMode) {
    mode = newMode
    const submitBtn = document.querySelector('#auth-submit')
    const loginTab = document.querySelector('#tab-login')
    const signupTab = document.querySelector('#tab-signup')

    if (mode === 'login') {
      submitBtn.textContent = 'Log in'
      loginTab.classList.add('active')
      signupTab.classList.remove('active')
    } else {
      submitBtn.textContent = 'Sign up'
      signupTab.classList.add('active')
      loginTab.classList.remove('active')
    }
  }

  async function handleAuth() {
    const email = document.querySelector('#auth-email').value
    const password = document.querySelector('#auth-password').value
    const message = document.querySelector('#auth-message')

    if (!email || !password) {
      message.textContent = 'Please enter your email and password.'
      return
    }

    message.textContent = 'Loading...'

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        message.textContent = error.message
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        message.textContent = error.message
      } else {
        message.textContent = 'Account created! You are now logged in.'
      }
    }
  }
}