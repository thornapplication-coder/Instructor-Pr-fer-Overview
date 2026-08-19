// Supabase connection for the deployed app.
//
// These two values are baked in on purpose. The anon key is a PUBLISHABLE
// credential: it ends up in the JavaScript bundle of every deployment anyway,
// so hiding it buys nothing. What actually protects the data is Row Level
// Security on `app_state` (see supabase/migrations/0001_app_state.sql), which
// limits every signed-in user to their own row. The anon key alone can never
// WRITE anybody's data: there is no insert/update/delete policy for anon at
// all.
//
// Reading is the exception, and it is deliberate. Migration 0002_shared_read
// adds an anon SELECT policy for rows carrying `shared = true`, which is what
// the read-only link runs on (pullPublic() in supabaseSync.js, the viewer loop
// in cloudSync.js, the banner in ReadOnlyBanner.jsx). So: flagging a row
// publishes it to ANYONE who can reach the site, not only to people who were
// handed the link - because this key is in the bundle they already have. A row
// is private until somebody flips that flag, and public the moment they do.
//
// Never put the `service_role` key here – that one bypasses RLS.
//
// Build-time environment variables still win, so a fork or a private
// deployment can point at its own project without touching this file:
//   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// Setting EITHER of them switches off the baked-in pair completely, so a
// half-configured build can never mix one project's URL with another's key.
// To ship an offline-only build, blank out DEFAULT_URL below.
const DEFAULT_URL = 'https://hkxyfshehwnlfsybetfq.supabase.co'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhreHlmc2hlaHdubGZzeWJldGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MzQzODgsImV4cCI6MjEwMDUxMDM4OH0.xcgO6OBvnalpDX2hw58_ruT8IBKBFZFSQT83QeQQ3t8'

// The Supabase dashboard shows the API endpoint as ".../rest/v1/", but the
// client wants the project root. Strip trailing slashes FIRST so that a doubled
// slash ("/rest/v1//") is handled too, then the suffix (case-insensitively),
// then any slash the suffix left behind.
function normalizeUrl(u) {
  return String(u == null ? '' : u)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '')
    .replace(/\/+$/, '')
}

// Take URL and key from the environment as a PAIR, or fall back to the pair
// above. Mixing the two sources would produce a build that looks configured
// but fails every request with "Invalid API key".
//
// Empty counts as "not provided": CI substitutes an EMPTY STRING for a secret
// that was never created (see .github/workflows/deploy.yml), and that must not
// silently switch the deployed app to an unconfigured state. Supplying only one
// of the two still disables cloud sync outright, so a half-configured build
// says "not set up" instead of failing on every request.
const envUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const envKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
const useEnv = Boolean(envUrl || envKey)

// Say so out loud when only half the pair is set. The behaviour below is
// deliberate and stays as it is - but silently is the wrong way to do it: the
// build is green, the site loads, and every device just stops syncing with
// nothing anywhere to explain why. A console error at least leaves a trace in
// the one place somebody would look.
if (useEnv && !(envUrl && envKey)) {
  console.error(
    '[cloudConfig] Only one of VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY is set. ' +
    'They are read as a pair, so cloud sync is OFF in this build. ' +
    'Set both, or neither to keep the built-in project.'
  )
}

export const SUPABASE_URL = normalizeUrl(useEnv ? envUrl : DEFAULT_URL)
export const SUPABASE_ANON_KEY = String(useEnv ? envKey : DEFAULT_ANON_KEY).trim()
