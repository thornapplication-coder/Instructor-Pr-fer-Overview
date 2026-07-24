import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { downloadJson } from '../lib/format.js'
import { exportTrainersExcel, exportPlanningExcel, exportProvidersExcel } from '../lib/tableExports.js'
import { APP_VERSION, APP_BUILD_DATE, CHANGELOG, COPYRIGHT } from '../version.js'
import { cloudConfigured } from '../lib/supabaseSync.js'
import { persistenceStatus } from '../lib/persistence.js'

// Pages exportable as PDF (order matches the tab bar). Umschulung/Planung use
// their own label keys; the PDF is scoped to that page by the print stylesheet.
const PDF_PAGES = [
  { id: 'dashboard', key: 'tab_dashboard' },
  { id: 'conversion', key: 'tab_conversion' },
  { id: 'capacity', key: 'tab_capacity' },
  { id: 'trainers', key: 'tab_trainers' },
  { id: 'planning', key: 'tab_planning' },
  { id: 'providers', key: 'tab_providers' }
]

function fmtBytes(n) {
  if (!n && n !== 0) return '–'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

export default function Settings({ onPrintTab }) {
  const { data, t, lang, setLang, exportData, importData, resetData } = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)
  const [persist, setPersist] = useState(null)

  useEffect(() => {
    persistenceStatus().then(setPersist)
  }, [])

  const doExport = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    const payload = {
      _meta: { copyright: COPYRIGHT, version: APP_VERSION, exportedAt: new Date().toISOString() },
      ...exportData()
    }
    downloadJson(`737trainer-backup-${stamp}.json`, payload)
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

      <section className="card downloads-card">
        <h3 className="card-title">{t('downloads')}</h3>
        <p className="muted small">{t('downloadsHint')}</p>

        <div className="dl-group">
          <div className="dl-group-title">{t('dl_pdf')}</div>
          <div className="dl-grid">
            {PDF_PAGES.map((p) => (
              <button key={p.id} className="dl-btn" onClick={() => onPrintTab && onPrintTab(p.id)}>
                <span className="dl-badge pdf">PDF</span>
                <span className="dl-btn-lbl">{t(p.key)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dl-group">
          <div className="dl-group-title">{t('dl_excel')}</div>
          <div className="dl-grid">
            <button className="dl-btn" onClick={() => exportTrainersExcel(data, t, lang)}>
              <span className="dl-badge xls">XLS</span>
              <span className="dl-btn-lbl">{t('tab_trainers')}</span>
            </button>
            <button className="dl-btn" onClick={() => exportPlanningExcel(data, t, lang)}>
              <span className="dl-badge xls">XLS</span>
              <span className="dl-btn-lbl">{t('tab_planning')}</span>
            </button>
            <button className="dl-btn" onClick={() => exportProvidersExcel(data, t)}>
              <span className="dl-badge xls">XLS</span>
              <span className="dl-btn-lbl">{t('tab_providers')}</span>
            </button>
          </div>
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
