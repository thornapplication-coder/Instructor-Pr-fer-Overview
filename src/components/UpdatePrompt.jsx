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

  // Reload ourselves rather than trusting the helper to do it.
  //
  // `updateServiceWorker(true)` ignores its argument in this version - all it
  // does is post SKIP_WAITING. The reload comes from a "controlling" listener
  // that only fires when the page HAD a controller, and a hard reload leaves it
  // without one. index.html tells the user to hard-reload when the app looks
  // stale, which puts them in exactly that state: the button would then
  // activate the new worker and leave them looking at the old bundle.
  //
  // The generated worker does not call clientsClaim(), so on an uncontrolled
  // page "controllerchange" never arrives - hence the timeout, by which point
  // skipWaiting has activated the new worker and the reload picks it up.
  const applyUpdate = async () => {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null
    const taken = new Promise((done) => {
      if (!sw) { done(); return }
      const on = () => { sw.removeEventListener('controllerchange', on); done() }
      sw.addEventListener('controllerchange', on)
      setTimeout(() => { sw.removeEventListener('controllerchange', on); done() }, 2500)
    })
    await updateServiceWorker(true)
    await taken
    window.location.reload()
  }

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
        <button className="btn btn-light" onClick={applyUpdate}>
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
