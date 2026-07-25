import React from 'react'
import { useStore } from '../lib/store.jsx'

// Compact cloud-sync indicator for the header. Mirrors `sync.state` from
// useCloudSync; hidden entirely when no Supabase project is configured, so the
// purely-local build looks exactly as before.
export default function SyncBadge() {
  const { sync, t, lang } = useStore()
  if (!sync || !sync.cloudConfigured) return null

  const { state, lastSyncedAt, pendingChanges } = sync
  const MAP = {
    signedOut: { cls: 'off', icon: '○', key: 'sync_signedOut' },
    offline: { cls: 'offline', icon: '⚠', key: 'sync_offline' },
    syncing: { cls: 'busy', icon: '↻', key: 'sync_syncing' },
    synced: { cls: 'ok', icon: '✓', key: 'sync_synced' },
    error: { cls: 'err', icon: '!', key: 'sync_error' },
    conflict: { cls: 'warn', icon: '⚠', key: 'sync_conflict' }
  }
  const m = MAP[state] || MAP.signedOut
  const when = lastSyncedAt ? new Date(lastSyncedAt) : null
  const timeStr =
    when && !isNaN(when) ? when.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : ''
  const title = t(m.key) + (state === 'synced' && timeStr ? ' · ' + timeStr : '')

  return (
    <span className={'sync-badge ' + m.cls} title={title} aria-live="polite" aria-label={title}>
      <span className="sync-icon" aria-hidden="true">{m.icon}</span>
      <span className="sync-text">
        {t(m.key)}
        {state === 'synced' && timeStr && <span className="sync-time"> {timeStr}</span>}
        {state === 'synced' && pendingChanges && <span className="sync-time"> ·</span>}
      </span>
    </span>
  )
}
