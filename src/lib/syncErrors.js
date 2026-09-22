// How to read a failure from the cloud, kept apart from the client that
// produces it. supabaseSync.js pulls in cloudConfig.js, which reads
// `import.meta.env` - that only exists inside Vite, so anything living there
// cannot be reached by `npm test`. This decision is worth a test, so it lives
// where a test can get at it.

// Is this error simply "the read-only link was never set up"?
//
// 0002_shared_read.sql adds the `shared` column, the anon policy and the anon
// grant. Until somebody runs it, pullPublic() asks for a column that does not
// exist (42703) or one the anon role may not see (42501), and PostgREST
// answers with an error rather than an empty result. cloudSync turned that
// into state 'error' - so every device that was merely NOT SIGNED IN reported
// "Sync-Fehler" instead of "Nicht angemeldet", and the one thing the screen
// had to say was the one thing it did not say.
//
// Sharing being off is a configuration, not a fault. Say so by returning null,
// which every caller already treats as "no shared row".
//
// Narrow on purpose: a network failure, a bad key or a dead project still
// throw, because those ARE faults and swallowing them would leave a device
// quietly showing yesterday's numbers under a calm status line.
export function sharingNotSetUp(error) {
  const code = String(error?.code || '')
  if (code === '42703' || code === '42501') return true
  // PostgREST answers out of a cached schema, so a project whose cache has not
  // been reloaded since the migration reports the column missing in its own
  // dialect rather than the database's.
  if (code === 'PGRST204' || code === 'PGRST200') return true
  return /column .*shared.* does not exist|permission denied for (table|column)/i.test(
    String(error?.message || '')
  )
}
