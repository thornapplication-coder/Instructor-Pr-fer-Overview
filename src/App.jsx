import React, { useState, useEffect } from 'react'
import { requestPersistence } from './lib/persistence.js'
import TopBar from './components/TopBar.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import Dashboard from './tabs/Dashboard.jsx'
import Trainers from './tabs/Trainers.jsx'
import Conversion from './tabs/Conversion.jsx'
import Capacity from './tabs/Capacity.jsx'
import Planning from './tabs/Planning.jsx'
import Providers from './tabs/Providers.jsx'
import Settings from './tabs/Settings.jsx'
import { APP_VERSION, COPYRIGHT } from './version.js'

const TABS = [
  { id: 'dashboard', labelKey: 'tab_dashboard', Comp: Dashboard },
  { id: 'trainers', labelKey: 'tab_trainers', Comp: Trainers },
  { id: 'conversion', labelKey: 'tab_conversion', Comp: Conversion },
  { id: 'capacity', labelKey: 'tab_capacity', Comp: Capacity },
  { id: 'planning', labelKey: 'tab_planning', Comp: Planning },
  { id: 'providers', labelKey: 'tab_providers', Comp: Providers },
  { id: 'settings', labelKey: 'tab_settings', Comp: Settings }
]

export default function App() {
  const [active, setActive] = useState('dashboard')
  const Current = TABS.find((t) => t.id === active)?.Comp || Dashboard

  // Ask the browser to keep our local data (prevents automatic eviction).
  useEffect(() => {
    requestPersistence()
  }, [])

  // PDF export lives in Settings, but print CSS scopes the printout to the
  // visible tab. So briefly switch to the requested tab, let it render/paint,
  // print, then return to Settings.
  const printTab = (tabId) => {
    const restore = active
    setActive(tabId)
    window.setTimeout(() => {
      window.print()
      setActive(restore)
    }, 300)
  }

  return (
    <div className="app">
      <TopBar tabs={TABS} active={active} onSelect={setActive} />
      <main className="content">
        <Current onPrintTab={printTab} />
      </main>
      <footer className="app-footer">
        <span>{COPYRIGHT} · v{APP_VERSION}</span>
      </footer>
      {/* Last in DOM so keyboard tab order matches its bottom-of-screen position */}
      <UpdatePrompt />
    </div>
  )
}
