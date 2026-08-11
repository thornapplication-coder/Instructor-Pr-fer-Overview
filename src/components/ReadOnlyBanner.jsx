import React from 'react'
import { useStore } from '../lib/store.jsx'
import { formatDate } from '../lib/format.js'

/**
 * The band a visitor sees.
 *
 * Shown whenever this device is reading somebody else's shared state: the cloud
 * is configured, nobody is signed in, and the store is refusing every write. It
 * says so out loud rather than letting a disabled screen look broken, and it
 * carries the timestamp, because "is this current?" is the first question a
 * shared link raises.
 *
 * `no-print` and `no-capture`: it is a property of the device looking, not of
 * the data, and it has no business on a printout or in a PDF export.
 */
export default function ReadOnlyBanner() {
  const { t, lang, readOnly, sync } = useStore()
  if (!readOnly) return null
  const at = sync?.lastSyncedAt ? new Date(sync.lastSyncedAt) : null
  const stamp = at && !isNaN(at)
    ? at.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : null
  return (
    <div className="ro-banner no-print no-capture" role="status">
      <span className="ro-eye" aria-hidden="true">👁</span>
      <span className="ro-text">
        <b>{t('ro_banner')}</b>{' '}
        {stamp && <span className="ro-at">{t('ro_bannerAt').replace('{t}', stamp)}.</span>}{' '}
        <span className="muted">{t('ro_bannerHint')}</span>
      </span>
    </div>
  )
}
