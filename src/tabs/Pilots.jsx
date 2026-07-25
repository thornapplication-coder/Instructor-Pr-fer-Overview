import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import DateInput from '../components/DateInput.jsx'
import Modal from '../components/Modal.jsx'
import { useSort, Th } from '../components/sortable.jsx'
import { formatDate } from '../lib/format.js'
import {
  PILOT_STATUS,
  PILOT_STATUS_IDS,
  pilotStatusLabel,
  pilotStatusColor,
  pilotRole,
  isRatingOverdue,
  emptyPilot
} from '../data/pilots.js'

function RoleTag({ role, t }) {
  const fo = role === 'fo'
  return (
    <span className={'role-tag ' + (fo ? 'role-fo' : 'role-captain')} title={fo ? t('role_fo') : t('role_captain')}>
      {fo ? t('role_foShort') : t('role_captainShort')}
    </span>
  )
}

// Company line pilots (not trainers): who already holds a B737 rating, whose
// rating lapsed, and who has Boeing experience without a current rating.
export default function Pilots() {
  const { data, t, lang, upsertPilot, deletePilot, newId } = useStore()
  const { otherPilots, trainers } = data
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fRole, setFRole] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [editing, setEditing] = useState(null)

  // Offer the bases already in use anywhere in the app, so the dropdown is
  // useful even before the first pilot is imported.
  const bases = useMemo(() => {
    const set = new Set()
    for (const p of otherPilots) if (p.base) set.add(p.base)
    for (const x of trainers) if (x.base) set.add(x.base)
    return [...set].sort()
  }, [otherPilots, trainers])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return otherPilots
      .filter((p) => (fBase ? p.base === fBase : true))
      .filter((p) => (fRole ? pilotRole(p) === fRole : true))
      .filter((p) => (fStatus ? p.status === fStatus : true))
      .filter((p) =>
        n
          ? [p.name, p.tlc, p.base, p.remark, pilotStatusLabel(p.status, lang)]
              .join(' ')
              .toLowerCase()
              .includes(n)
          : true
      )
  }, [otherPilots, q, fBase, fRole, fStatus, lang])

  const accessors = useMemo(
    () => ({
      name: (p) => p.name || '',
      tlc: (p) => p.tlc || '',
      base: (p) => p.base || '',
      role: (p) => (pilotRole(p) === 'captain' ? 0 : 1),
      status: (p) => PILOT_STATUS_IDS.indexOf(p.status),
      until: (p) => p.b737Until || '9999',
      remark: (p) => p.remark || ''
    }),
    []
  )
  const { sorted, sortKey, dir, toggle } = useSort(rows, accessors, 'name')
  const sp = { sortKey, dir, onSort: toggle }

  const counts = useMemo(() => {
    const c = { valid: 0, expired: 0, experience: 0 }
    for (const p of otherPilots) if (c[p.status] != null) c[p.status]++
    return c
  }, [otherPilots])

  return (
    <div className="tab-pane">
      <div className="toolbar no-print">
        <h2 className="pane-title">{t('pilots_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={fRole} onChange={(e) => setFRole(e.target.value)}>
          <option value="">{t('f_position')}: {t('all')}</option>
          <option value="captain">{t('role_captain')}</option>
          <option value="fo">{t('role_fo')}</option>
        </select>
        <select className="input" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">{t('f_b737Status')}: {t('all')}</option>
          {PILOT_STATUS_IDS.map((s) => (
            <option key={s} value={s}>{pilotStatusLabel(s, lang)}</option>
          ))}
        </select>
        <span className="count-pill">{rows.length} / {otherPilots.length} {t('showing')}</span>
        <span className="push-right" />
        <button className="btn btn-primary" onClick={() => setEditing({ ...emptyPilot(newId('plt')), _isNew: true })}>
          + {t('addPilot')}
        </button>
      </div>

      <p className="planning-note">{t('pilots_hint')}</p>

      <div className="fte-summary">
        {PILOT_STATUS_IDS.map((s) => (
          <span key={s} className="fte-pill" style={{ borderLeft: `4px solid ${pilotStatusColor(s)}` }}>
            {pilotStatusLabel(s, lang)}: <b>{counts[s]}</b>
          </span>
        ))}
      </div>

      {otherPilots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧑‍✈️</div>
          <p>{t('pilots_empty')}</p>
          <button className="btn btn-primary" onClick={() => setEditing({ ...emptyPilot(newId('plt')), _isNew: true })}>
            + {t('addPilot')}
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <Th label={t('f_name')} k="name" {...sp} />
                <Th label={t('f_tlc')} k="tlc" {...sp} />
                <Th label={t('f_base')} k="base" {...sp} />
                <Th label={t('f_position')} k="role" {...sp} />
                <Th label={t('f_b737Status')} k="status" {...sp} />
                <Th label={t('f_b737Until')} k="until" {...sp} />
                <Th label={t('f_comment')} k="remark" {...sp} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const overdue = isRatingOverdue(p)
                return (
                  <tr
                    key={p.id}
                    className="clickable"
                    onClick={() => setEditing({ ...p })}
                    tabIndex={0}
                    aria-label={p.name || ''}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...p }) } }}
                  >
                    <td className="strong">{p.name || '–'}</td>
                    <td className="mono">{p.tlc || '–'}</td>
                    <td>{p.base || '–'}</td>
                    <td><RoleTag role={pilotRole(p)} t={t} /></td>
                    <td>
                      <span className="status-tag" style={{ background: pilotStatusColor(p.status) }}>
                        {pilotStatusLabel(p.status, lang)}
                      </span>
                    </td>
                    <td className={overdue ? 'strong overdue-date' : ''} title={overdue ? t('pilots_overdueHint') : undefined}>
                      {p.b737Until ? formatDate(p.b737Until, lang) : '–'}
                      {overdue && ' ⚠'}
                    </td>
                    <td className="muted small">{p.remark || '–'}</td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="empty-row">{t('pilots_none')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PilotForm
          pilot={editing}
          bases={bases}
          onClose={() => setEditing(null)}
          onSave={(p) => { upsertPilot(p); setEditing(null) }}
          onDelete={(id) => {
            if (window.confirm(t('deletePilotConfirm'))) { deletePilot(id); setEditing(null) }
          }}
        />
      )}
    </div>
  )
}

function PilotForm({ pilot, bases, onClose, onSave, onDelete }) {
  const { t, lang } = useStore()
  const [p, setP] = useState({ ...pilot })
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }))
  const isNew = !!pilot._isNew

  const submit = () => {
    if (!(p.name || '').trim()) {
      window.alert(t('pilotNameRequired'))
      return
    }
    const out = { ...p }
    delete out._isNew
    onSave(out)
  }

  // The date means "valid until" for a current rating and "expired on" for a
  // lapsed one; Boeing experience usually carries no date at all.
  const dateLabel =
    p.status === 'expired' ? t('f_b737ExpiredOn') : p.status === 'valid' ? t('f_b737ValidUntil') : t('f_b737Until')

  return (
    <Modal
      title={isNew ? t('addPilot') : t('editPilot')}
      onClose={onClose}
      wide
      footer={
        <div className="foot-row">
          {!isNew && <button className="btn btn-danger" onClick={() => onDelete(p.id)}>{t('delete')}</button>}
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={submit}>{t('save')}</button>
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <Field label={t('f_name')} span2>
          <input className="input" value={p.name || ''} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label={t('f_tlc')}>
          <input className="input" value={p.tlc || ''} onChange={(e) => set('tlc', e.target.value)} />
        </Field>
        <Field label={t('f_base')}>
          <select className="input" value={p.base || ''} onChange={(e) => set('base', e.target.value)}>
            <option value=""></option>
            {!bases.includes(p.base) && p.base && <option value={p.base}>{p.base}</option>}
            {bases.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label={t('f_position')}>
          <select className="input" value={pilotRole(p)} onChange={(e) => set('role', e.target.value)}>
            <option value="captain">{t('role_captain')}</option>
            <option value="fo">{t('role_fo')}</option>
          </select>
        </Field>
        <Field label={t('f_b737Status')}>
          <select className="input" value={p.status || 'valid'} onChange={(e) => set('status', e.target.value)}>
            {PILOT_STATUS_IDS.map((s) => (
              <option key={s} value={s}>{pilotStatusLabel(s, lang)}</option>
            ))}
          </select>
        </Field>
        <Field label={dateLabel} span2>
          <DateInput value={p.b737Until || ''} onChange={(v) => set('b737Until', v)} />
        </Field>
        <Field label={t('f_comment')} span2>
          <input className="input" value={p.remark || ''} onChange={(e) => set('remark', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children, span2 }) {
  return (
    <label className={'field' + (span2 ? ' span2' : '')}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
