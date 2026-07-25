// Cloud sync layer (Supabase). The whole app state is stored as ONE jsonb row
// per user in `app_state`, which suits a single planner working from a few
// devices. The app stays fully offline-first: localStorage remains the source
// of truth, and everything here is best-effort on top of it.
//
// The project URL and the publishable anon key live in cloudConfig.js (see the
// note there on why baking them in is safe). The matching schema is in
// supabase/migrations/0001_app_state.sql.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './cloudConfig.js'

const URL = SUPABASE_URL
const ANON = SUPABASE_ANON_KEY

export const cloudConfigured = Boolean(URL && ANON)

const TABLE = 'app_state'

let client = null
export async function getClient() {
  if (!cloudConfigured) return null
  if (client) return client
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(URL, ANON, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
  return client
}

export async function getUser() {
  const c = await getClient()
  if (!c) return null
  const { data } = await c.auth.getUser()
  return data?.user || null
}

export async function signIn(email, password) {
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  const { data, error } = await c.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signUp(email, password) {
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  const { data, error } = await c.auth.signUp({ email, password })
  if (error) throw error
  return data.user
}

export async function signOut() {
  const c = await getClient()
  if (!c) return
  await c.auth.signOut()
}

// Notifies on sign-in / sign-out / token refresh. Returns an unsubscribe fn.
export async function onAuthChange(cb) {
  const c = await getClient()
  if (!c) return () => {}
  const { data } = c.auth.onAuthStateChange((_evt, session) => cb(session?.user || null))
  return () => data?.subscription?.unsubscribe?.()
}

// Read the remote row. Returns { blob, remoteAt } or null when nothing is
// stored yet. `remoteAt` is the server-side updated_at, used to detect whether
// another device wrote since our last sync.
export async function pull() {
  const c = await getClient()
  if (!c) return null
  const user = await getUser()
  if (!user) return null
  const { data, error } = await c
    .from(TABLE)
    .select('data, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { blob: data.data, remoteAt: data.updated_at }
}

// Write the blob. Returns the new server updated_at so the caller can track it.
export async function push(blob) {
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  const user = await getUser()
  if (!user) throw new Error('not signed in')
  const { data, error } = await c
    .from(TABLE)
    .upsert(
      { user_id: user.id, data: blob, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('updated_at')
    .single()
  if (error) throw error
  return data.updated_at
}
