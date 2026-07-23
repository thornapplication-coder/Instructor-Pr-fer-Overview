import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate } from '../lib/format.js'
import { ASSIGNMENT_STEPS, ASSIGNMENT_STATUS, STAFF_TYPE } from '../data/pipeline.js'

function providersForStep(providers, step) {
  if (!step.providerType) return providers
  const matched = providers.filter((p) => (p.types || []).includes(step.providerType))
  return matched.length ? matched : providers
}

function targetLabel(providers, assignment) {
  if (!assignment) return null
  const p = providers.find((x) => x.id === assignment.providerId)
  if (p && p.name) return p.name
  if (assignment.location) return assignment.location
  return null
}

export default function Planning() {
  const { data, t, lang } = useStore()
  const { trainers, providers } = data
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [fOre, setFOre] = useState('')
  const [editing, setEditing] = useState(null)

  const bases = useMemo(() => [...new Set(trainers.map((x) => x.base))].sort(), [trainers])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return trainers
      .filter((x) => (fBase ? x.base === fBase : true))
      .filter((x) => (fStaff ? (x.staffType || 'internal') === fStaff : true))
      .filter((x) => (fOre ? x.ore === fOre : true))
      .filter((x) => (n ? [x.name, x.tlc, x.base].join(' ').toLowerCase().includes(n) : true))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [trainers, q, fBase, fStaff, fOre])

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('planning_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={fStaff} onChange={(e) => setFStaff(e.target.value)}>
          <option value="">{t('filterStaff')}: {t('all')}</option>
          <option value="internal">{t('staff_internal')}</option>
          <option value="external">{t('staff_external')}</option>
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {['A', 'B', 'C'].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="count-pill">{rows.length} / {trainers.length}</span>
      </div>

      <p className="planning-note">
        {t('planning_hint')}
        {providers.length === 0 && <> · {t('planning_noProviders')}</>}
      </p>

      <div className="table-wrap">
        <table className="data-table planning-table">
          <thead>
            <tr>
              <th>{t('f_name')}</th>
              <th>{t('f_staffType')}</th>
              {ASSIGNMENT_STEPS.map((s) => (
                <th key={s.id} style={{ borderBottom: `3px solid ${s.color}` }}>
                  {lang === 'de' ? s.de : s.en}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const staff = STAFF_TYPE[x.staffType || 'internal']
              return (
                <tr key={x.id}>
                  <td className="strong nowrap">
                    <button className="link-btn" onClick={() => setEditing({ ...x })}>{x.name}</button>
                    <div className="muted small">{x.base} · {x.qual}</div>
                  </td>
                  <td>
                    <span className="staff-tag" style={{ background: staff.color }}>
                      {lang === 'de' ? staff.de : staff.en}
                    </span>
                  </td>
                  {ASSIGNMENT_STEPS.map((s) => {
                    const a = x.assignments?.[s.id]
                    const label = targetLabel(providers, a)
                    const st = ASSIGNMENT_STATUS[a?.status] || ASSIGNMENT_STATUS.open
                    return (
                      <td key={s.id}>
                        <button className="cell-assign" onClick={() => setEditing({ ...x })}>
                          {label ? (
                            <>
                              <span className="assign-dot" style={{ background: st.color }} />
                              <span className="assign-label">{label}</span>
                              {a?.date && <span className="assign-date">{formatDate(a.date, lang)}</span>}
                            </>
                          ) : (
                            <span className="assign-empty">+ {t('assign')}</span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={2 + ASSIGNMENT_STEPS.length} className="empty-row">{t('noTrainers')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <PlanningModal trainer={editing} providers={providers} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function PlanningModal({ trainer, providers, onClose }) {
  const { t, lang, setAssignment, upsertTrainer } = useStore()

  const setStep = (stepId, changes) => setAssignment(trainer.id, stepId, changes)
  const setStaff = (v) => upsertTrainer({ ...trainer, staffType: v })

  return (
    <Modal
      title={`${t('assignmentsFor')} ${trainer.name}`}
      onClose={onClose}
      wide
      footer={
        <div className="foot-row">
          <div className="push-right">
            <button className="btn btn-primary" onClick={onClose}>{t('close')}</button>
          </div>
        </div>
      }
    >
      <div className="field" style={{ marginBottom: 16 }}>
        <span className="field-label">{t('f_staffType')}</span>
        <div className="lang-toggle big" style={{ width: 'fit-content' }}>
          {['internal', 'external'].map((k) => (
            <button
              key={k}
              className={'lang-btn' + ((trainer.staffType || 'internal') === k ? ' active' : '')}
              onClick={() => setStaff(k)}
            >
              {t('staff_' + k)}
            </button>
          ))}
        </div>
      </div>

      <div className="assign-editor">
        {ASSIGNMENT_STEPS.map((s) => {
          const a = trainer.assignments?.[s.id] || {}
          const opts = providersForStep(providers, s)
          return (
            <div className="assign-block" key={s.id} style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="assign-block-title">{lang === 'de' ? s.de : s.en}</div>
              <div className="assign-grid">
                <label className="field">
                  <span className="field-label">{t('provider')}</span>
                  <select
                    className="input"
                    value={a.providerId || ''}
                    onChange={(e) => setStep(s.id, { providerId: e.target.value })}
                  >
                    <option value="">{t('noProvider')}</option>
                    {opts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name || '(?)'}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">{t('location')}</span>
                  <input
                    className="input"
                    value={a.location || ''}
                    onChange={(e) => setStep(s.id, { location: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span className="field-label">{t('status')}</span>
                  <select
                    className="input"
                    value={a.status || 'open'}
                    onChange={(e) => setStep(s.id, { status: e.target.value })}
                  >
                    {Object.entries(ASSIGNMENT_STATUS).map(([k, v]) => (
                      <option key={k} value={k}>{lang === 'de' ? v.de : v.en}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">{t('targetDate')}</span>
                  <input
                    className="input"
                    type="date"
                    value={a.date || ''}
                    onChange={(e) => setStep(s.id, { date: e.target.value })}
                  />
                </label>
                <label className="field span2">
                  <span className="field-label">{t('note')}</span>
                  <input
                    className="input"
                    value={a.note || ''}
                    onChange={(e) => setStep(s.id, { note: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
