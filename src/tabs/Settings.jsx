import React, { useContext, useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { CaptureContext } from '../lib/capture.js'
import { downloadJson } from '../lib/format.js'
import { exportTrainersExcel, exportPlanningExcel, exportProvidersExcel, exportPilotsExcel, exportCourseDatesExcel } from '../lib/tableExports.js'
import { exportPagePdf } from '../lib/pdfExport.js'
import { parseTrainersFromArrayBuffer, mergeTrainerRecords } from '../lib/importExcel.js'
import { parsePilotsFromArrayBuffer, mergePilotRecords } from '../lib/importPilots.js'
import { resolveQualId } from '../data/qualifications.js'
import { APP_VERSION, APP_BUILD_DATE, CHANGELOG } from '../version.js'
import SyncCard from '../components/SyncCard.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { EDITABLE_LISTS } from '../data/lists.js'
import { persistenceStatus } from '../lib/persistence.js'
import { capacityRange } from '../lib/months.js'

// Per-page export choices, in tab-bar order. Planung and the course dates are
// VIEWS of the Umschulung tab rather than tabs of their own, so they follow it
// here instead of sitting where a tab used to be. `excel` is the Excel builder
// where a tabular export makes sense; every page offers PDF + Print.
const EXPORT_PAGES = [
  { id: 'dashboard', key: 'tab_dashboard' },
  { id: 'trainers', key: 'tab_trainers', excel: exportTrainersExcel },
  { id: 'conversion', key: 'tab_conversion' },
  { id: 'planning', key: 'tab_planning', excel: exportPlanningExcel },
  { id: 'courseDates', key: 'manageCourseDates', excel: exportCourseDatesExcel },
  { id: 'capacity', key: 'tab_capacity' },
  { id: 'providers', key: 'tab_providers', excel: exportProvidersExcel },
  { id: 'pilots', key: 'tab_pilots', excel: exportPilotsExcel }
]

function fmtBytes(n) {
  if (!n && n !== 0) return '–'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

export default function Settings() {
  const { data, t, lang, setLang, exportData, importData, resetData, setTrainers, setPilots, setList, setCapacityRange, saveError } = useStore()
  const captureTabImage = useContext(CaptureContext)
  const fileRef = useRef(null)
  const xlsRef = useRef(null)
  const pilotRef = useRef(null)
  const [msg, setMsg] = useState(null)
  const [xlsMsg, setXlsMsg] = useState(null)
  const [pilotMsg, setPilotMsg] = useState(null)
  const [pdfBusy, setPdfBusy] = useState(null) // `${pageId}:${output}` of the running export
  const [pdfMsg, setPdfMsg] = useState(null)
  const [persist, setPersist] = useState(null)

  const doPdf = async (pageId, output) => {
    setPdfMsg(null)
    setPdfBusy(pageId + ':' + output)
    // For printing, open the window *inside the click* so it survives popup
    // blockers (Safari/iOS); the export navigates it once the PDF is ready.
    let win = null
    if (output === 'print') {
      try { win = window.open('', '_blank') } catch (e) { win = null }
    }
    try {
      // The dashboard PDF mirrors the on-screen layout: rasterize it first.
      let canvas = null
      if (pageId === 'dashboard' && captureTabImage) {
        canvas = await captureTabImage('dashboard')
      }
      const result = await exportPagePdf(pageId, data, t, lang, { output, win, canvas })
      if (output === 'print' && result === 'saved') setPdfMsg({ ok: true, text: t('pdfPrintFellBack') })
    } catch (e) {
      if (win) { try { win.close() } catch (_) { /* ignore */ } }
      setPdfMsg({ ok: false, text: t('pdfErr') })
    } finally {
      setPdfBusy(null)
    }
  }
  const doExcel = (fn) => {
    setPdfMsg(null)
    try {
      fn(data, t, lang)
    } catch (e) {
      setPdfMsg({ ok: false, text: t('pdfErr') })
    }
  }

  useEffect(() => {
    persistenceStatus().then(setPersist)
  }, [])

  const doExport = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    const payload = {
      // Version and timestamp only – no byline on a file that gets handed on.
      _meta: { version: APP_VERSION, exportedAt: new Date().toISOString() },
      ...exportData()
    }
    downloadJson(`737trainer-backup-${stamp}.json`, payload)
  }

  const doImport = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      let obj
      try {
        obj = JSON.parse(reader.result)
      } catch (e) {
        setMsg({ ok: false, text: t('importErr') })
        return
      }
      if (!window.confirm(t('importConfirm'))) return
      // importData validates the shape now and reports whether it was accepted,
      // so a random JSON file no longer silently wipes the roster with the seed.
      const ok = importData(obj)
      setMsg(ok ? { ok: true, text: t('importOk') } : { ok: false, text: t('importErr') })
    }
    reader.readAsText(file)
  }

  const doXlsImport = async (file) => {
    try {
      const buf = await file.arrayBuffer()
      const parsed = await parseTrainersFromArrayBuffer(buf)
      // Exports write qualification LABELS, so map them back to stored ids –
      // otherwise re-importing our own export detaches trainers from their qual.
      const records = parsed.map((r) =>
        r.qual ? { ...r, qual: resolveQualId(data.quals, r.qual) } : r
      )
      if (!records.length) {
        setXlsMsg({ ok: false, text: t('xlsImport_none') })
        return
      }
      if (!window.confirm(t('xlsImport_confirm').replace('{n}', records.length))) return
      const { trainers, updated, added } = mergeTrainerRecords(data.trainers, records)
      setTrainers(trainers)
      setXlsMsg({
        ok: true,
        text: t('xlsImport_ok').replace('{u}', updated).replace('{a}', added)
      })
    } catch (e) {
      setXlsMsg({ ok: false, text: t('xlsImport_err') })
    }
  }

  const doPilotImport = async (file) => {
    try {
      const buf = await file.arrayBuffer()
      const records = await parsePilotsFromArrayBuffer(buf)
      if (!records.length) {
        setPilotMsg({ ok: false, text: t('xlsImport_none') })
        return
      }
      if (!window.confirm(t('xlsImport_confirm').replace('{n}', records.length))) return
      const { pilots, updated, added } = mergePilotRecords(data.otherPilots || [], records)
      setPilots(pilots)
      setPilotMsg({ ok: true, text: t('xlsImport_ok').replace('{u}', updated).replace('{a}', added) })
    } catch (e) {
      setPilotMsg({ ok: false, text: t('xlsImport_err') })
    }
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

      <section className="card">
        <h3 className="card-title">{t('set_capacityRange')}</h3>
        <p className="muted small">{t('set_capacityRangeHint')}</p>
        <div className="range-row">
          <label className="field">
            <span className="field-label">{t('set_from')}</span>
            <input
              className="input"
              type="month"
              value={data.capacityFrom || ''}
              placeholder={t('set_capacityFromPlaceholder')}
              onChange={(e) => setCapacityRange(e.target.value, data.capacityTo)}
            />
          </label>
          <label className="field">
            <span className="field-label">{t('set_to')}</span>
            <input
              className="input"
              type="month"
              value={data.capacityTo || ''}
              onChange={(e) => setCapacityRange(data.capacityFrom, e.target.value)}
            />
          </label>
        </div>
        {/* Said here rather than only where the timeline is empty: this is the
            page that can put it right, and an empty table three tabs away does
            not explain itself. */}
        {capacityRange(data.capacityFrom, data.capacityTo).length === 0 && (
          <p className="warn-text small">{t('set_capacityBad')}</p>
        )}
      </section>

      <section className="card downloads-card">
        <h3 className="card-title">{t('downloads')}</h3>
        <p className="muted small">{t('downloadsHint')}</p>
        <div className="dl-list">
          {EXPORT_PAGES.map((p) => (
            <div className="dl-row" key={p.id}>
              <span className="dl-row-name">{t(p.key)}</span>
              <div className="dl-row-actions">
                <button className="dl-chip pdf" disabled={!!pdfBusy} onClick={() => doPdf(p.id, 'save')}>
                  {pdfBusy === p.id + ':save' ? '…' : 'PDF'}
                </button>
                {p.excel && (
                  <button className="dl-chip xls" disabled={!!pdfBusy} onClick={() => doExcel(p.excel)}>Excel</button>
                )}
                <button className="dl-chip print" disabled={!!pdfBusy} onClick={() => doPdf(p.id, 'print')}>
                  {pdfBusy === p.id + ':print' ? '…' : t('print')}
                </button>
              </div>
            </div>
          ))}
        </div>
        {pdfMsg && <p className={'inline-msg ' + (pdfMsg.ok ? 'ok' : 'err')}>{pdfMsg.text}</p>}
      </section>

      <section className="card">
        <h3 className="card-title">{t('lists_title')}</h3>
        <p className="muted small">{t('lists_hint')}</p>
        <div className="lists-grid">
          {EDITABLE_LISTS.map((l) => (
            <details className="list-block" key={l.key}>
              <summary>
                <span className="list-name">{t(l.labelKey)}</span>
                <span className="list-count">{(data[l.key] || []).length}</span>
                {l.locked && <span className="list-locked">{t('lists_locked')}</span>}
              </summary>
              {l.hint && <p className="muted small">{t(l.hint)}</p>}
              <CategoryManager
                items={data[l.key] || []}
                onChange={(items) => setList(l.key, items)}
                hasColor={l.hasColor !== false}
                locked={!!l.locked}
              />
            </details>
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
        {saveError && <p className="inline-msg err">⚠ {t('saveErr')}</p>}
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
        <h3 className="card-title">{t('xlsImport_title')}</h3>
        <p className="muted small">{t('xlsImport_hint')}</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => xlsRef.current?.click()}>
            ⤒ {t('xlsImport_btn')}
          </button>
          <input
            ref={xlsRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files[0]) doXlsImport(e.target.files[0])
              e.target.value = ''
            }}
          />
        </div>
        {xlsMsg && <p className={'inline-msg ' + (xlsMsg.ok ? 'ok' : 'err')}>{xlsMsg.text}</p>}
      </section>

      <section className="card">
        <h3 className="card-title">{t('pilotsImport_title')}</h3>
        <p className="muted small">{t('pilotsImport_hint')}</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => pilotRef.current?.click()}>
            ⤒ {t('pilotsImport_btn')}
          </button>
          <input
            ref={pilotRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files[0]) doPilotImport(e.target.files[0])
              e.target.value = ''
            }}
          />
        </div>
        {pilotMsg && <p className={'inline-msg ' + (pilotMsg.ok ? 'ok' : 'err')}>{pilotMsg.text}</p>}
      </section>

      <SyncCard />

      <section className="card">
        <h3 className="card-title">{t('installHint')}</h3>
        <p className="muted small">{t('installHintText')}</p>
      </section>

      <section className="card">
        <h3 className="card-title">{t('versionChangelog')}</h3>
        <p className="muted small">
          {t('currentVersion')}: <strong>v{APP_VERSION}</strong> · {APP_BUILD_DATE}
        </p>
        {/* Collapsed to version + date. Native <details> rather than a state
            hook: it is keyboard-operable, announced correctly by screen
            readers and searchable by the browser's find-in-page for free.
            The newest entry opens by default – that is the one being looked
            for after an update. */}
        <div className="changelog">
          {CHANGELOG.map((entry, idx) => (
            <details className="changelog-entry" key={entry.version} open={idx === 0}>
              <summary className="changelog-head">
                <span className={'ver-tag ver-' + entry.type}>v{entry.version}</span>
                <span className="muted small">{entry.date}</span>
              </summary>
              <ul>
                {(entry.changes[lang] || entry.changes.de).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
