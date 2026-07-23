import React, { useState, useEffect } from 'react'
import { requestPersistence } from './lib/persistence.js'
import TopBar from './components/TopBar.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import Overview from './tabs/Overview.jsx'
import Trainers from './tabs/Trainers.jsx'
import Conversion from './tabs/Conversion.jsx'
import Planning from './tabs/Planning.jsx'
import Statistics from './tabs/Statistics.jsx'
import Providers from './tabs/Providers.jsx'
import Settings from './tabs/Settings.jsx'

const TABS = [
  { id: 'overview', labelKey: 'tab_overview', Comp: Overview },
  { id: 'trainers', labelKey: 'tab_trainers', Comp: Trainers },
  { id: 'conversion', labelKey: 'tab_conversion', Comp: Conversion },
  { id: 'planning', labelKey: 'tab_planning', Comp: Planning },
  { id: 'statistics', labelKey: 'tab_statistics', Comp: Statistics },
  { id: 'providers', labelKey: 'tab_providers', Comp: Providers },
  { id: 'settings', labelKey: 'tab_settings', Comp: Settings }
]

export default function App() {
  const [active, setActive] = useState('overview')
  const Current = TABS.find((t) => t.id === active)?.Comp || Overview

  // Ask the browser to keep our local data (prevents automatic eviction).
  useEffect(() => {
    requestPersistence()
  }, [])
  return (
    <div className="app">
      <UpdatePrompt />
      <TopBar tabs={TABS} active={active} onSelect={setActive} />
      <main className="content">
        <Current />
      </main>
      <footer className="app-footer">
        <span>EWL 737 Trainer &amp; Examiner Monitoring · Eurowings</span>
      </footer>
    </div>
  )
}
