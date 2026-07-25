import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import SyncBadge from './SyncBadge.jsx'
import { BRAND } from '../lib/palette.js'

// App brand mark (inline SVG) — matches the home-screen icon: pure burgundy
// tile, white "737", blue "TRAINER". White ring so it reads on the header.
function BrandMark() {
  return (
    <div className="brandmark" aria-label="737 TRAINER">
      <svg viewBox="0 0 120 120" width="46" height="46" role="img">
        <rect x="4" y="4" width="112" height="112" rx="26" fill={BRAND.burgundy} stroke="#fff" strokeWidth="3" />
        <text x="60" y="70" textAnchor="middle" fontSize="46" fontWeight="800" fill="#fff" fontFamily="Mulish, sans-serif">737</text>
        <text x="61" y="93" textAnchor="middle" fontSize="20" fontWeight="800" fill={BRAND.sky} fontFamily="Mulish, sans-serif" letterSpacing="1">TRAINER</text>
      </svg>
    </div>
  )
}

export default function TopBar({ tabs, active, onSelect }) {
  const { t, lang, setLang, data, setTheme, saveNow, saveError } = useStore()
  const [saved, setSaved] = useState(false)
  const theme = data.theme || 'light'
  // Only flash the "saved" check when the write actually succeeded; a failed
  // save (quota/private mode) keeps the error state instead of faking success.
  const doSave = () => {
    if (saveNow()) {
      setSaved(true)
      setTimeout(() => setSaved(false), 1300)
    }
  }
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
          <SyncBadge />
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
            className={'icon-round save-btn' + (saved ? ' saved' : '') + (saveError ? ' save-error' : '')}
            onClick={doSave}
            title={saveError ? t('saveErr') : saved ? t('saved') : t('save')}
            aria-label={t('save')}
          >
            {saved ? (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
                strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
            )}
          </button>
          <button
            className="icon-round"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
          <button
            className="icon-round"
            onClick={() => window.location.reload()}
            title={t('reload')}
            aria-label={t('reload')}
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
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
