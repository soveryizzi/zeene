// main.js — entry point

import './style.css'
import { supabase, dbQuery } from './supabase.js'
import { renderAuth } from './auth.js'
import { renderGroupSelect } from './group.js'
import { renderGarden } from './garden.js'
import { renderSetDisplayName } from './profile.js'

document.querySelector('#app').innerHTML = `<p>Loading...</p>`

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    renderAuth()
    return
  }

  // Check if user needs to set their display name
  const profiles = await dbQuery(
    'profiles',
    `id=eq.${session.user.id}&select=display_name`,
    session.access_token
  )

  const profile = profiles[0] || null
  const emailPrefix = session.user.email.split('@')[0]
  const needsDisplayName = !profile?.display_name || profile.display_name === emailPrefix

  if (needsDisplayName) {
    renderSetDisplayName(() => routeUser(session.user.id, session.access_token))
    return
  }

  await routeUser(session.user.id, session.access_token)
})

async function routeUser(userId, accessToken) {
  const memberships = await dbQuery(
    'group_members',
    `user_id=eq.${userId}&select=group_id`,
    accessToken
  )

  const membership = memberships[0] || null

  if (membership) {
    renderGarden(membership.group_id, accessToken)
  } else {
    renderGroupSelect()
  }
}