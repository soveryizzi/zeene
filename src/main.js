// main.js — entry point

import './style.css'
import { supabase } from './supabase.js'
import { renderAuth } from './auth.js'
import { renderGroupSelect } from './group.js'

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    renderGroupSelect()
  } else {
    renderAuth()
  }
})