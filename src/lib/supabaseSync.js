// Cloud sync layer (Supabase). Intentionally INERT until a Supabase project is
// available (the account's free-tier project slot was full at build time).
//
// To switch it on later:
//   1. Create a Supabase project (EU/Frankfurt) and a table `app_state`:
//        create table app_state (
//          user_id uuid primary key references auth.users(id),
//          data jsonb not null,
//          updated_at timestamptz not null default now()
//        );
//        alter table app_state enable row level security;
//        create policy "own row" on app_state
//          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
//   2. Put the URL + anon key into .env as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
//   3. This module then provides sign-in and last-write-wins push/pull of the whole
//      data blob (fine for a single user using one device at a time).
//
// The rest of the app already works fully offline (localStorage) and supports
// manual Export/Import, so nothing here is required for day-to-day use.

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const cloudConfigured = Boolean(URL && ANON)

let client = null
async function getClient() {
  if (!cloudConfigured) return null
  if (client) return client
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(URL, ANON)
  return client
}

export async function signIn(email, password) {
  const c = await getClient()
  if (!c) throw new Error('cloud not configured')
  return c.auth.signInWithPassword({ email, password })
}

export async function pull() {
  const c = await getClient()
  if (!c) return null
  const { data: sess } = await c.auth.getUser()
  if (!sess?.user) return null
  const { data } = await c.from('app_state').select('data').eq('user_id', sess.user.id).single()
  return data?.data ?? null
}

export async function push(blob) {
  const c = await getClient()
  if (!c) return
  const { data: sess } = await c.auth.getUser()
  if (!sess?.user) return
  await c
    .from('app_state')
    .upsert({ user_id: sess.user.id, data: blob, updated_at: new Date().toISOString() })
}
