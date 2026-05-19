// supabase.js — connection to our database

import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  }
})

// Direct fetch helper — pass the access token from the session
export async function dbQuery(table, params = '', accessToken = null) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? '?' + params : ''}`
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
  const response = await fetch(url, { headers })
  return response.json()
}