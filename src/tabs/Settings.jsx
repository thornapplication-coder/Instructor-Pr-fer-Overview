import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { downloadJson } from '../lib/format.js'
import { APP_VERSION, APP_BUILD_DATE, CHANGELOG } from '../version.js'
import { cloudConfigured } from '../lib/supabaseSync.js'
import { persistenceStatus } from '../lib/persistence.js'

function fmtBytes(n) {
  if (!n && n !== 0) return '–'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

export default function Settings() {
  const { data, t, lang, setLang, exportData, importData, resetData } = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)
  const [persist, setPersist] = useState(null)

  useEffect(() => {
    persistenceStatus().then(setPersist)
  }, [])

  const doExport = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadJson(`ewl737-backup-${stamp}.json`, exportData())
  }

  const doImport = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        if (!window.confirm(t('importConfirm'))) return
        importData(obj)
        setMsg({ ok: true, text: t('importOk') })
      } catch (e) {
        setMsg({ ok: false, text: t('importErr') })
      }
    }
    reader.readAsText(file)
  }

  const lastSaved = new Date(data.updatedAt)
  const lastSavedStr = isNaN(lastSaved)
    ? '–'
    : lastSaved.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB')

  return (
    <div className="tab-pane settings">
      <h2 className="pane-title">{t('settings_title')}</h2>

      <section className="card">
        <h3 className="card-title">{t('language')}</h3>
        <div className="lang-toggle big">
          {['de', 'en'].map((l) => (
            <button
              key={l}
              className={'lang-btn' + (lang === l ? ' active' : '')}
              onClick={() => setLang(l)}
            >
              {l === 'de' ? 'Deutsch' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section className="card safety-card">
        <h3 className="card-title">{t('dataSafety')}</h3>
        {persist && (
          <p className={'persist-line ' + (persist.persisted ? 'ok' : 'warn')}>
            <span className="persist-dot" />
            {persist.persisted ? t('persistGranted') : t('persistDenied')}
          </p>
        )}
        {persist && persist.usage != null && (
          <p className="muted small">{t('storageUsage')}: {fmtBytes(persist.usage)}</p>
        )}
        <p className="safety-warning">⚠ {t('persistWarning')}</p>
        <button className="btn btn-primary" onClick={doExport}>{t('backupNow')}</button>
      </section>

      <section className="card">
        <h3 className="card-title">{t('dataMgmt')}</h3>
        <p className="muted small">{t('lastSaved')}: {lastSavedStr}</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={doExport}>⤓ {t('exportData')}</button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            ⤒ {t('importData')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && doImport(e.target.files[0])}
          />
          <button
            className="btn btn-danger-ghost"
            onClick={() => window.confirm(t('resetConfirm')) && resetData()}
          >
            ↺ {t('resetData')}
          </button>
        </div>
        {msg && (
          <p className={'inline-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">{t('cloudSync')}</h3>
        <p className="muted small">
          {cloudConfigured
            ? (lang === 'de' ? 'Cloud-Sync aktiv.' : 'Cloud sync active.')
            : t('cloudNotConfigured')}
        </p>
      </section>

      <section className="card">
        <h3 className="card-title">{t('installHint')}</h3>
        <p className="muted small">{t('installHintText')}</p>
      </section>

      <section className="card">
        <h3 className="card-title">{t('versionChangelog')}</h3>
        <p className="muted small">
          {t('currentVersion')}: <strong>v{APP_VERSION}</strong> · {APP_BUILD_DATE}
        </p>
        <div className="changelog">
          {CHANGELOG.map((entry) => (
            <div className="changelog-entry" key={entry.version}>
              <div className="changelog-head">
                <span className={'ver-tag ver-' + entry.type}>v{entry.version}</span>
                <span className="muted small">{entry.date}</span>
              </div>
              <ul>
                {(entry.changes[lang] || entry.changes.de).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
