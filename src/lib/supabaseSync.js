// Cloud sync layer (Supabase). The whole app state is stored as ONE jsonb row
// per user in `app_state`, which suits a single planner working from a few
// devices. The app stays fully offline-first: localStorage remains the source
// of truth, and everything here is best-effort on top of it.
//
// The project URL and the publishable anon key live in cloudConfig.js (see the
// note there on why baking them in is safe). The matching schema is in
// supabase/migrations/0001_app_state.sql.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './cloudConfig.js'

// NB: do not alias these to `URL` – that shadows the global URL constructor
// for the whole module.
export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

const TABLE = 'app_state'

let client = null
export async function getClient() {
  if (!cloudConfigured) return null
  if (client) return client
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  })
  return client
}

// Reads the persisted session instead of calling /auth/v1/user, which is a
// network round trip. sync() runs on mount, on every reconnect and after every
// edit burst, so the difference is noticeable on a flaky mobile connection.
export async function getUser() {
  const s = await getSession()
  return s?.user || null
}

export async function getSession() {
  const c = await getClient()
  if (!c) return null
  const { data } = await c.auth.getSession()
  return data?.session || null
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
// The session is passed along so callers can keep an access token at hand for
// the unload push, which has no time to await anything.
export async function onAuthChange(cb) {
  const c = await getClient()
  if (!c) return () => {}
  const { data } = c.auth.onAuthStateChange((_evt, session) => cb(session?.user || null, session || null))
  return () => data?.subscription?.unsubscribe?.()
}

// Read the remote row. Returns { blob, remoteAt } or null when nothing is
// stored yet. `remoteAt` is the server-side updated_at, used to detect whether
// another device wrote since our last sync.
export async function pull(user) {
  const c = await getClient()
  if (!c) return null
  const u = user || (await getUser())
  if (!u) return null
  const { data, error } = await c
    .from(TABLE)
    .select('data, updated_at')
    .eq('user_id', u.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { blob: data.data, remoteAt: data.updated_at }
}

// Write the blob. Returns the new server updated_at.
//
// With `expectedUpdatedAt` this is a compare-and-swap: the update only applies
// while the row still carries the timestamp we read a moment ago. Another
// device writing between our pull and our push therefore cannot be silently
// replaced by our (now stale) copy – we return null instead and the caller
// re-reads and merges again. Without it, the small window between pull and push
// is a data-loss window.
//
// updated_at is deliberately never SENT: a database trigger owns it, so a
// client cannot backdate a write and win an exchange it should have lost.
export async function push(blob, user, expectedUpdatedAt) {
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  const u = user || (await getUser())
  if (!u) throw new Error('not signed in')

  if (expectedUpdatedAt) {
    const { data, error } = await c
      .from(TABLE)
      .update({ data: blob })
      .eq('user_id', u.id)
      .eq('updated_at', expectedUpdatedAt)
      .select('updated_at')
    if (error) throw error
    // No row matched -> the row moved on since we read it.
    return data && data.length ? data[0].updated_at : null
  }

  // First write for this user: there is no row to compare against yet.
  const { data, error } = await c
    .from(TABLE)
    .upsert({ user_id: u.id, data: blob }, { onConflict: 'user_id' })
    .select('updated_at')
    .single()
  if (error) throw error
  return data.updated_at
}

// Best-effort write while the page is going away (tab closed, app backgrounded
// on a phone). A normal request is cancelled the moment the document is gone,
// so this is a raw fetch with `keepalive`, which the browser is allowed to
// finish afterwards. Nothing here can be awaited – by then we may not exist.
//
// COMPARE-AND-SWAP, not a plain upsert. There is no time to pull and merge
// here, so the write is made conditional on the row still carrying the
// `updated_at` we last saw: `updated_at=eq.<expected>` matches no row once
// another device has written, and the update is skipped instead of replacing
// that device's work with our older copy. Our edits simply stay local and are
// merged properly on the next open.
//
// (This is exactly what went wrong before: an unconditional upsert here erased
// changes another device had already pushed.)
//
// `keepalive` caps the body at 64 KiB. A bigger blob falls back to an ordinary
// request: it still completes whenever the page is merely hidden (the common
// case on iOS), and the regular 2-minute sync catches whatever was lost.
export function pushOnUnload(blob, userId, accessToken, expectedUpdatedAt) {
  if (!cloudConfigured || !userId || !accessToken || !blob) return false
  // Without a known server timestamp there is nothing to compare against, so a
  // write here could only be a blind overwrite. Skip it; the row is created by
  // the first ordinary sync anyway.
  if (!expectedUpdatedAt) return false
  try {
    const body = JSON.stringify({ data: blob })
    // encodeURIComponent is not optional: the timestamp ends in "+00:00" and a
    // raw "+" in a query string decodes to a space, so the filter would never
    // match and the write would silently never happen.
    const q =
      `user_id=eq.${encodeURIComponent(userId)}` +
      `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`
    fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${q}`, {
      method: 'PATCH',
      keepalive: body.length < 60000,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + accessToken,
        Prefer: 'return=minimal'
      },
      body
    }).catch(() => {})
    return true
  } catch (_) {
    return false
  }
}
