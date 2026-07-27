import React, { useState, useEffect, useRef, useCallback } from 'react'
import { requestPersistence } from './lib/persistence.js'
import { CaptureContext } from './lib/capture.js'
import TopBar from './components/TopBar.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import Dashboard from './tabs/Dashboard.jsx'
import Trainers from './tabs/Trainers.jsx'
import ConversionHub from './tabs/ConversionHub.jsx'
import Capacity from './tabs/Capacity.jsx'
import Providers from './tabs/Providers.jsx'
import Pilots from './tabs/Pilots.jsx'
import Settings from './tabs/Settings.jsx'
import { APP_VERSION, COPYRIGHT } from './version.js'

const TABS = [
  { id: 'dashboard', labelKey: 'tab_dashboard', Comp: Dashboard },
  { id: 'trainers', labelKey: 'tab_trainers', Comp: Trainers },
  // Board, planning grid and calendar live behind one tab (see ConversionHub):
  // they describe the same journey of the same person and used to be able to
  // disagree with each other unnoticed.
  { id: 'conversion', labelKey: 'tab_conversion', Comp: ConversionHub },
  { id: 'capacity', labelKey: 'tab_capacity', Comp: Capacity },
  { id: 'providers', labelKey: 'tab_providers', Comp: Providers },
  { id: 'pilots', labelKey: 'tab_pilots', Comp: Pilots },
  // `icon` keeps this one out of the tab row and puts it in the header
  // instead. The nav derives that from the record, so nothing has to know the
  // id 'settings' by name.
  { id: 'settings', labelKey: 'tab_settings', icon: 'gear', Comp: Settings }
]

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [captureTab, setCaptureTab] = useState(null)
  const captureRef = useRef(null)
  const Current = TABS.find((t) => t.id === active)?.Comp || Dashboard

  // Ask the browser to keep our local data (prevents automatic eviction).
  useEffect(() => {
    requestPersistence()
  }, [])

  // Render a tab off-screen at desktop width and rasterize it to a canvas, so
  // the dashboard PDF looks exactly like the on-screen dashboard (KPI tiles +
  // charts) even when exported from a phone. Returns null on failure.
  const captureTabImage = useCallback(async (tabId) => {
    setCaptureTab(tabId)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise((r) => setTimeout(r, 250))
    let canvas = null
    try {
      const html2canvas = (await import('html2canvas')).default
      const node = captureRef.current?.firstElementChild
      if (node) {
        canvas = await html2canvas(node, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1200,
          scrollX: 0,
          scrollY: 0
        })
      }
    } catch (e) {
      canvas = null
    }
    setCaptureTab(null)
    return canvas
  }, [])

  const CaptureTab = captureTab ? TABS.find((t) => t.id === captureTab)?.Comp : null

  return (
    <CaptureContext.Provider value={captureTabImage}>
      <div className="app">
        <TopBar tabs={TABS} active={active} onSelect={setActive} />
        <main className="content">
          <Current />
        </main>
        <footer className="app-footer">
          <span>{COPYRIGHT} · v{APP_VERSION}</span>
        </footer>
        {/* Last in DOM so keyboard tab order matches its bottom-of-screen position */}
        <UpdatePrompt />
      </div>
      {/* Off-screen host used to rasterize a tab at desktop width for PDF export. */}
      <div ref={captureRef} className="pdf-capture" aria-hidden="true">
        {CaptureTab && (
          <div className="content pdf-capture-content">
            <CaptureTab />
          </div>
        )}
      </div>
    </CaptureContext.Provider>
  )
}
