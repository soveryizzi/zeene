// auth.js — handles sign up and log in

import { supabase } from './supabase.js'

export function renderAuth() {
  document.querySelector('#app').innerHTML = `
    <div class="auth-container" style="position:relative;overflow:hidden;min-height:100vh">
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0" viewBox="0 0 960 1440" xmlns="http://www.w3.org/2000/svg">
        <!-- Top right flower: 8-petal rose/wisteria -->
        <!-- Rose petals -->
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(0 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(45 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(90 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(135 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(180 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(225 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(270 912 115)"/>
        <ellipse cx="912" cy="115" rx="18" ry="35" fill="#D4789A" opacity="0.7" transform="rotate(315 912 115)"/>
        <!-- Wisteria offset petals -->
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(0 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(45 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(90 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(135 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(180 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(225 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(270 916 119)"/>
        <ellipse cx="916" cy="119" rx="18" ry="35" fill="#8C6B9E" opacity="0.6" transform="rotate(315 916 119)"/>
        <!-- Center circles -->
        <circle cx="912" cy="115" r="8" fill="#D4789A" opacity="0.8"/>
        <circle cx="916" cy="119" r="8" fill="#8C6B9E" opacity="0.6"/>
        <!-- Stem and leaf -->
        <path d="M 912 150 Q 890 180 870 220" stroke="#8C6B9E" stroke-width="2" fill="none" opacity="0.5"/>
        <ellipse cx="865" cy="235" rx="12" ry="6" fill="#8C6B9E" opacity="0.4" transform="rotate(-30 865 235)"/>

        <!-- Bottom left flower: 6-petal wisteria/rose -->
        <!-- Wisteria petals -->
        <ellipse cx="48" cy="1324" rx="16" ry="32" fill="#8C6B9E" opacity="0.7" transform="rotate(0 48 1324)"/>
        <ellipse cx="48" cy="1324" rx="16" ry="32" fill="#8C6B9E" opacity="0.7" transform="rotate(60 48 1324)"/>
        <ellipse cx="48" cy="1324" rx="16" ry="32" fill="#8C6B9E" opacity="0.7" transform="rotate(120 48 1324)"/>
        <ellipse cx="48" cy="1324" rx="16" ry="32" fill="#8C6B9E" opacity="0.7" transform="rotate(180 48 1324)"/>
        <ellipse cx="48" cy="1324" rx="16" ry="32" fill="#8C6B9E" opacity="0.7" transform="rotate(240 48 1324)"/>
        <ellipse cx="48" cy="1324" rx="16" ry="32" fill="#8C6B9E" opacity="0.7" transform="rotate(300 48 1324)"/>
        <!-- Rose offset petals -->
        <ellipse cx="51" cy="1320" rx="16" ry="32" fill="#D4789A" opacity="0.5" transform="rotate(0 51 1320)"/>
        <ellipse cx="51" cy="1320" rx="16" ry="32" fill="#D4789A" opacity="0.5" transform="rotate(60 51 1320)"/>
        <ellipse cx="51" cy="1320" rx="16" ry="32" fill="#D4789A" opacity="0.5" transform="rotate(120 51 1320)"/>
        <ellipse cx="51" cy="1320" rx="16" ry="32" fill="#D4789A" opacity="0.5" transform="rotate(180 51 1320)"/>
        <ellipse cx="51" cy="1320" rx="16" ry="32" fill="#D4789A" opacity="0.5" transform="rotate(240 51 1320)"/>
        <ellipse cx="51" cy="1320" rx="16" ry="32" fill="#D4789A" opacity="0.5" transform="rotate(300 51 1320)"/>
        <!-- Center circles -->
        <circle cx="48" cy="1324" r="6" fill="#8C6B9E" opacity="0.8"/>
        <circle cx="51" cy="1320" r="6" fill="#D4789A" opacity="0.6"/>
        <!-- Fern-like stem and leaflets -->
        <path d="M 48 1300 Q 70 1280 90 1250" stroke="#8C6B9E" stroke-width="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="58" cy="1290" rx="5" ry="3" fill="#8C6B9E" opacity="0.4" transform="rotate(45 58 1290)"/>
        <ellipse cx="70" cy="1275" rx="5" ry="3" fill="#8C6B9E" opacity="0.4" transform="rotate(50 70 1275)"/>
        <ellipse cx="82" cy="1260" rx="5" ry="3" fill="#8C6B9E" opacity="0.4" transform="rotate(55 82 1260)"/>
      </svg>
      <div style="position:relative;z-index:1">
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