import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useStore } from '../lib/store.jsx'

// Shows a banner when a new deployed version is detected by the service worker,
// with an explicit "Update now" button (registerType: 'prompt').
export default function UpdatePrompt() {
  const { t } = useStore()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for a new version every 60 minutes while the app stays open.
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    }
  })

  if (needRefresh) {
    return (
      <div className="update-banner" role="alert">
        <span className="update-dot" />
        <span className="update-text">{t('updateAvailable')}</span>
        <button className="btn btn-light" onClick={() => updateServiceWorker(true)}>
          {t('updateNow')}
        </button>
        <button className="btn btn-ghost-light" onClick={() => setNeedRefresh(false)}>
          {t('later')}
        </button>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="update-banner update-banner-soft" role="status">
        <span className="update-text">{t('offlineReady')}</span>
        <button className="btn btn-ghost-light" onClick={() => setOfflineReady(false)}>
          {t('close')}
        </button>
      </div>
    )
  }

  return null
}
