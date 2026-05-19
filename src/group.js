// group.js — create or join a group

import { supabase } from './supabase.js'

export function renderGroupSelect() {
  document.querySelector('#app').innerHTML = `
    <div class="group-container">
      <h1>Zeene 🌿</h1>
      <p class="tagline">Get started by creating or joining a group</p>

      <div class="group-box">
        <div class="group-tabs">
          <button class="group-tab active" id="tab-create">Create a group</button>
          <button class="group-tab" id="tab-join">Join a group</button>
        </div>

        <div id="group-form">
          <input type="text" id="group-input" placeholder="Group name" />
          <button id="group-submit">Create</button>
        </div>

        <p id="group-message"></p>
      </div>
    </div>
  `

  let mode = 'create'

  document.querySelector('#tab-create').addEventListener('click', () => {
    mode = 'create'
    document.querySelector('#group-input').placeholder = 'Group name'
    document.querySelector('#group-submit').textContent = 'Create'
    document.querySelector('#tab-create').classList.add('active')
    document.querySelector('#tab-join').classList.remove('active')
    document.querySelector('#group-message').textContent = ''
  })

  document.querySelector('#tab-join').addEventListener('click', () => {
    mode = 'join'
    document.querySelector('#group-input').placeholder = 'Invite code'
    document.querySelector('#group-submit').textContent = 'Join'
    document.querySelector('#tab-join').classList.add('active')
    document.querySelector('#tab-create').classList.remove('active')
    document.querySelector('#group-message').textContent = ''
  })

  document.querySelector('#group-submit').addEventListener('click', async () => {
    const input = document.querySelector('#group-input').value.trim()
    const message = document.querySelector('#group-message')

    if (!input) {
      message.textContent = 'Please fill in the field above.'
      return
    }

    message.textContent = 'Loading...'

    if (mode === 'create') {
      await createGroup(input, message)
    } else {
      await joinGroup(input, message)
    }
  })
}

async function createGroup(name, message) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Generate a random invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single()

  if (groupError) {
    message.textContent = groupError.message
    return
  }

  // Add creator as a member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (memberError) {
    message.textContent = memberError.message
    return
  }

  message.textContent = `Group created! Your invite code is: ${inviteCode}`
}

async function joinGroup(inviteCode, message) {
  const { data: { user } } = await supabase.auth.getUser()

  // Find the group with this invite code
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select()
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (groupError || !group) {
    message.textContent = 'Invalid invite code. Please try again.'
    return
  }

  // Add user as a member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id })

  if (memberError) {
    message.textContent = 'You are already in this group!'
    return
  }

  message.textContent = `You joined ${group.name}!`
}