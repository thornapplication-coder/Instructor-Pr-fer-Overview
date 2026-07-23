import React from 'react'
import { useStore } from '../lib/store.jsx'
import { APP_VERSION } from '../version.js'

// Custom app brand mark (inline SVG) — an ascending "wave" motif in the
// Eurowings palette on a clean white tile. Cohesive with the PWA icon.
function BrandMark() {
  return (
    <div className="brandmark" aria-label="EWL 737">
      <svg viewBox="0 0 100 100" width="44" height="44" role="img">
        <rect x="3" y="3" width="94" height="94" rx="24" fill="#ffffff" />
        <path d="M25 65 L41 41" stroke="#6BCCE0" strokeWidth="9" strokeLinecap="round" />
        <path d="M38 69 L59 37" stroke="#00A6CF" strokeWidth="9" strokeLinecap="round" />
        <path d="M52 73 L81 33" stroke="#AF1E65" strokeWidth="9" strokeLinecap="round" />
        <text x="50" y="90" textAnchor="middle" fontSize="15" fontWeight="800" fill="#871C54">
          737
        </text>
      </svg>
    </div>
  )
}

export default function TopBar({ tabs, active, onSelect }) {
  const { t, lang, setLang, data } = useStore()
  const asOf = new Date(data.updatedAt)
  const asOfStr = isNaN(asOf) ? '' : asOf.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')

  return (
    <header className="topbar">
      <div className="topbar-main">
        <div className="brand">
          <BrandMark />
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
