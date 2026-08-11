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
// The column both write paths compare against. Named once so the postgrest-js
// call and the hand-built unload query below cannot drift apart.
const CAS_COLUMN = 'updated_at'

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

// The shared row, read WITHOUT a session.
//
// This is the "everyone with the link sees the current state" path. It needs a
// database policy that lets the anon role read rows flagged `shared` (see
// supabase/migrations/0002_shared_read.sql); without it this simply returns
// null and the app falls back to its local copy, which is why no caller treats
// an empty result as an error.
//
// Read-only by construction: there is no matching write policy for anon, so a
// visitor could not push even if the client tried. The protection is the
// database's, not this function's.
export async function pullPublic() {
  const c = await getClient()
  if (!c) return null
  const { data, error } = await c
    .from(TABLE)
    .select('data, updated_at')
    .eq('shared', true)
    // Newest first and one row only: the flag is meant for a single row, but a
    // second one flipped by accident must not make the result arbitrary.
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { blob: data.data, remoteAt: data.updated_at }
}

// Compare-and-swap write. The update only applies while the row still carries
// the timestamp we read a moment ago, so a device that wrote between our pull
// and our push cannot be silently replaced by our (now stale) copy: we return
// null and the caller re-reads and merges again.
//
// The expectation is REQUIRED. It used to be optional, with a missing value
// falling through to an unconditional upsert – i.e. one undefined variable
// anywhere would have quietly restored the overwrite this exists to prevent.
//
// `updated_at` is never SENT: a database trigger owns it, so a client cannot
// backdate a write and win an exchange it should have lost.
export async function pushCas(blob, user, expectedUpdatedAt) {
  if (!expectedUpdatedAt) throw new Error('pushCas needs the timestamp to compare against')
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  const u = user || (await getUser())
  if (!u) throw new Error('not signed in')

  const { data, error } = await c
    .from(TABLE)
    .update({ data: blob })
    .eq('user_id', u.id)
    .eq(CAS_COLUMN, expectedUpdatedAt)
    .select(CAS_COLUMN)
  if (error) throw error
  // No row matched -> the row moved on since we read it. A matched row without
  // a timestamp counts as a miss too: "success" with nothing to track would
  // clear remoteAt and disable every later conditional write.
  const at = data && data.length ? data[0][CAS_COLUMN] : null
  return at || null
}

// First write for this account: there is no row to compare against yet.
// Deliberately an INSERT rather than an upsert – if two devices start at the
// same moment, the loser gets a unique violation and takes the merge path
// instead of replacing the winner's row wholesale.
export async function createRow(blob, user) {
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  const u = user || (await getUser())
  if (!u) throw new Error('not signed in')

  const { data, error } = await c
    .from(TABLE)
    .insert({ user_id: u.id, data: blob })
    .select(CAS_COLUMN)
    .single()
  if (error) {
    if (error.code === '23505') return null // someone created it first
    throw error
  }
  return data?.[CAS_COLUMN] || null
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
    // The keepalive cap is 64 KiB of BYTES, not characters. This app's data is
    // German - umlauts and "ß" cost two bytes each - so measuring `body.length`
    // would wave an over-cap body through, the browser would reject the request
    // and the .catch below would swallow it.
    const bytes = new TextEncoder().encode(body).length
    // encodeURIComponent is not optional: the timestamp ends in "+00:00" and a
    // raw "+" in a query string decodes to a space, so the filter would never
    // match and the write would silently never happen.
    const q =
      `user_id=eq.${encodeURIComponent(userId)}` +
      `&${CAS_COLUMN}=eq.${encodeURIComponent(expectedUpdatedAt)}`
    fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${q}`, {
      method: 'PATCH',
      keepalive: bytes < 60000,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + accessToken,
        Prefer: 'return=minimal'
      },
      body
    }).catch(() => {})
    // NOTE: true means "the request was handed to the browser" - nothing more.
    // It cannot mean delivered, matched or accepted: the page is going away, so
    // there is no response to wait for. Never treat it as "the data is safe".
    return true
  } catch (_) {
    return false
  }
}
