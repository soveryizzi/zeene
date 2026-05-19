// main.js — entry point

import './style.css'
import { supabase, dbQuery } from './supabase.js'
import { renderAuth } from './auth.js'
import { renderGroupSelect } from './group.js'
import { renderGarden } from './garden.js'

document.querySelector('#app').innerHTML = `<p>Loading...</p>`

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    renderAuth()
    return
  }

  const memberships = await dbQuery(
    'group_members',
    `user_id=eq.${session.user.id}&select=group_id`,
    session.access_token
  )

  const membership = memberships[0] || null

  if (membership) {
    renderGarden(membership.group_id, session.access_token)
  } else {
    renderGroupSelect()
  }
})