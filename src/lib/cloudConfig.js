// Supabase connection for the deployed app.
//
// These two values are baked in on purpose. The anon key is a PUBLISHABLE
// credential: it ends up in the JavaScript bundle of every deployment anyway,
// so hiding it buys nothing. What actually protects the data is Row Level
// Security on `app_state` (see supabase/migrations/0001_app_state.sql), which
// limits every signed-in user to their own row. The anon key alone cannot read
// or write anybody's data.
//
// Never put the `service_role` key here – that one bypasses RLS.
//
// Build-time environment variables still win, so a fork or a private
// deployment can point at its own project without touching this file:
//   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
const DEFAULT_URL = 'https://hkxyfshehwnlfsybetfq.supabase.co'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhreHlmc2hlaHdubGZzeWJldGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MzQzODgsImV4cCI6MjEwMDUxMDM4OH0.xcgO6OBvnalpDX2hw58_ruT8IBKBFZFSQT83QeQQ3t8'

// Strip a trailing "/rest/v1" (that is the API endpoint shown in the Supabase
// dashboard; the client wants the project root) and any trailing slash.
function normalizeUrl(u) {
  return String(u || '')
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/+$/, '')
}

export const SUPABASE_URL = normalizeUrl(import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL)
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim()
