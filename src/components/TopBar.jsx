import React from 'react'
import logo from '../assets/ew-logo.png'
import { useStore } from '../lib/store.jsx'
import { APP_VERSION } from '../version.js'

export default function TopBar({ tabs, active, onSelect }) {
  const { t, lang, setLang, data } = useStore()
  const asOf = new Date(data.updatedAt)
  const asOfStr = isNaN(asOf) ? '' : asOf.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="brand">
          <div className="logo-pill">
            <img src={logo} alt="Eurowings" />
          </div>
          <div className="brand-text">
            <h1>{t('appTitle')}</h1>
            <p>{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="topbar-right">
          <div className="asof">
            <span className="asof-label">{t('asOf')}</span>
            <span className="asof-date">{asOfStr}</span>
          </div>
          <div className="lang-toggle" role="group" aria-label="language">
            {['de', 'en'].map((l) => (
              <button
                key={l}
                className={'lang-btn' + (lang === l ? ' active' : '')}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="version-chip">v{APP_VERSION}</span>
        </div>
      </div>
      <nav className="tabs" aria-label="sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={'tab' + (active === tab.id ? ' active' : '')}
            onClick={() => onSelect(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>
    </header>
  )
}
