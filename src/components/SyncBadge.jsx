import React from 'react'
import { useStore } from '../lib/store.jsx'

// Cloud-sync indicator for the header: one dot, deliberately binary.
//   green = signed in and in sync
//   red   = anything else (not signed in, offline, error, conflict)
// The precise state stays available as tooltip / screen-reader text, so nothing
// is lost by dropping the label. Hidden entirely when no Supabase project is
// configured, so the purely-local build looks exactly as before.
const KEYS = {
  signedOut: 'sync_signedOut',
  offline: 'sync_offline',
  syncing: 'sync_syncing',
  synced: 'sync_synced',
  error: 'sync_error',
  conflict: 'sync_conflict'
}

export default function SyncBadge() {
  const { sync, t, lang } = useStore()
  if (!sync || !sync.cloudConfigured) return null

  const { state, lastSyncedAt } = sync
  // "syncing" counts as green but pulses: a routine background sync must not
  // flash the dot red every couple of seconds.
  const ok = state === 'synced' || state === 'syncing'
  const when = lastSyncedAt ? new Date(lastSyncedAt) : null
  const timeStr =
    when && !isNaN(when) ? when.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
  const label = t(KEYS[state] || KEYS.signedOut) + (state === 'synced' && timeStr ? ' · ' + timeStr : '')

  return (
    <span
      className={'sync-dot-badge ' + (ok ? 'ok' : 'bad') + (state === 'syncing' ? ' busy' : '')}
      title={label}
      role="img"
      aria-live="polite"
      aria-label={label}
    />
  )
}
