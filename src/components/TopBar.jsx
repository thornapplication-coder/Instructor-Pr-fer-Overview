import React from 'react'
import { useStore } from '../lib/store.jsx'

// App brand mark (inline SVG) — matches the home-screen icon: burgundy tile,
// white "737", blue "TRAINER". White ring so it reads on the burgundy header.
function BrandMark() {
  return (
    <div className="brandmark" aria-label="737 TRAINER">
      <svg viewBox="0 0 120 120" width="46" height="46" role="img">
        <defs>
          <linearGradient id="ewTile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#AF1E65" />
            <stop offset="1" stopColor="#871C54" />
          </linearGradient>
          <clipPath id="ewClip"><rect x="4" y="4" width="112" height="112" rx="26" /></clipPath>
        </defs>
        <rect x="4" y="4" width="112" height="112" rx="26" fill="url(#ewTile)" stroke="#fff" strokeWidth="3" />
        <g clipPath="url(#ewClip)">
          <ellipse cx="28" cy="106" rx="42" ry="38" fill="#00A6CF" opacity="0.28" />
        </g>
        <text x="60" y="70" textAnchor="middle" fontSize="46" fontWeight="800" fill="#fff" fontFamily="Mulish, sans-serif">737</text>
        <text x="61" y="93" textAnchor="middle" fontSize="20" fontWeight="800" fill="#2196F3" fontFamily="Mulish, sans-serif" letterSpacing="1">TRAINER</text>
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
          <button
            className="reload-btn"
            onClick={() => window.location.reload()}
            title={t('reload')}
            aria-label={t('reload')}
          >
            ⟳
          </button>
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
