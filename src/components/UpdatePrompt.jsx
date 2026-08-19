import React, { useEffect } from 'react'
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

  // "App ist offline verfügbar" is news, not a decision - there is nothing to
  // answer. It used to sit over the bottom of the board until it was tapped
  // away, covering real controls on every fresh session, so it now takes
  // itself off after a few seconds. The update banner does NOT: that one asks
  // a question and has to wait for the answer.
  useEffect(() => {
    if (!offlineReady || needRefresh) return
    const id = setTimeout(() => setOfflineReady(false), 6000)
    return () => clearTimeout(id)
  }, [offlineReady, needRefresh, setOfflineReady])

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
