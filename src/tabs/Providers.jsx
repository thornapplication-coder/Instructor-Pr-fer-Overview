import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { emptyProvider } from '../data/providers.js'
import { providerUtilization } from '../lib/stats.js'

function UtilBar({ value }) {
  if (value == null) return <span className="muted small">–</span>
  const pct = Math.round(value * 100)
  const lvl = value > 1 ? 'over' : value >= 0.8 ? 'high' : 'ok'
  return (
    <div className="util">
      <div className="util-track">
        <div className={'util-fill ' + lvl} style={{ width: Math.min(100, pct) + '%' }} />
      </div>
      <span className={'util-pct ' + lvl}>{pct}%</span>
    </div>
  )
}

export default function Providers() {
  const { data, t, upsertProvider, deleteProvider, newId, setProviderCourses, setProviderStatus } = useStore()
  const { providers, providerCourses, providerStatus, trainers, assignmentSteps } = data
  const util = useMemo(
    () => providerUtilization(trainers, providers, assignmentSteps),
    [trainers, providers, assignmentSteps]
  )
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [manageCourses, setManageCourses] = useState(false)
  const [manageStatus, setManageStatus] = useState(false)

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return providers
      .filter((p) =>
        n
          ? [p.name, (p.locations || []).join(' '), p.authority, p.contactPerson, (p.courses || []).join(' ')]
              .join(' ')
              .toLowerCase()
              .includes(n)
          : true
      )
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [providers, q])

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('providers_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="push-right" />
        <button className="btn btn-ghost" onClick={() => setManageCourses(true)}>⚙ {t('manageCourses')}</button>
        <button className="btn btn-ghost" onClick={() => setManageStatus(true)}>⚙ {t('manageProviderStatus')}</button>
        <button className="btn btn-primary" onClick={() => setEditing(emptyProvider(newId('prov')))}>+ {t('addProvider')}</button>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>{t('noProviders')}</p>
          <button className="btn btn-primary" onClick={() => setEditing(emptyProvider(newId('prov')))}>+ {t('addProvider')}</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('p_name')}</th>
                <th>{t('p_courses')}</th>
                <th>{t('p_locations')}</th>
                <th>{t('p_authority')}</th>
                <th>{t('p_contact')}</th>
                <th>{t('p_capacity')}</th>
                <th>{t('p_status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = providerStatus.find((s) => s.id === p.status) || { label: p.status || '–', color: '#787878' }
                return (
                  <tr key={p.id} className="clickable" onClick={() => setEditing({ ...p })}>
                    <td className="strong">{p.name || '–'}</td>
                    <td>
                      <div className="type-tags">
                        {[...(p.courses || [])].sort().map((c) => (
                          <span key={c} className="type-tag">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="type-tags">
                        {[...(p.locations || [])].sort().map((l) => (
                          <span key={l} className="icao-tag">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="muted small">{p.authority || '–'}</td>
                    <td>
                      {p.contactPerson || '–'}
                      {p.email && <div className="muted small">{p.email}</div>}
                    </td>
                    <td className="muted small">{p.capacity || '–'}</td>
                    <td><span className="status-tag" style={{ background: st.color }}>{st.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {providers.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <h3 className="card-title">{t('prov_capacity')}</h3>
          <p className="muted small">{t('prov_capacityHint')}</p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('p_name')}</th>
                  <th>{t('p_courses')}</th>
                  <th className="num">{t('prov_assigned')}</th>
                  <th className="num">{t('prov_slots')}</th>
                  <th>{t('prov_util')}</th>
                </tr>
              </thead>
              <tbody>
                {util.map((u) => (
                  <tr key={u.provider.id} className="clickable" onClick={() => setEditing({ ...u.provider })}>
                    <td className="strong">{u.provider.name || '–'}</td>
                    <td>
                      <div className="type-tags">
                        {assignmentSteps
                          .filter((s) => u.byStep[s.id])
                          .map((s) => (
                            <span key={s.id} className="type-tag">{s.label}: {u.byStep[s.id]}</span>
                          ))}
                        {u.demand === 0 && <span className="muted small">–</span>}
                      </div>
                    </td>
                    <td className="num strong">{u.demand}</td>
                    <td className="num">{u.slots || '–'}</td>
                    <td><UtilBar value={u.util} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing && (
        <ProviderForm
          provider={editing}
          providerCourses={providerCourses}
          providerStatus={providerStatus}
          onClose={() => setEditing(null)}
          onSave={(p) => { upsertProvider(p); setEditing(null) }}
          onDelete={(id) => {
            if (window.confirm(t('deleteProviderConfirm'))) { deleteProvider(id); setEditing(null) }
          }}
          isNew={!providers.some((x) => x.id === editing.id)}
        />
      )}

      {manageCourses && (
        <Modal title={t('manageCourses')} onClose={() => setManageCourses(false)}
          footer={<div className="foot-row"><p className="muted small">{t('dragHint')}</p>
            <div className="push-right"><button className="btn btn-primary" onClick={() => setManageCourses(false)}>{t('close')}</button></div></div>}>
          <CategoryManager items={providerCourses} onChange={setProviderCourses} hasColor={false} />
        </Modal>
      )}
      {manageStatus && (
        <Modal title={t('manageProviderStatus')} onClose={() => setManageStatus(false)}
          footer={<div className="foot-row"><p className="muted small">{t('dragHint')}</p>
            <div className="push-right"><button className="btn btn-primary" onClick={() => setManageStatus(false)}>{t('close')}</button></div></div>}>
          <CategoryManager items={providerStatus} onChange={setProviderStatus} />
        </Modal>
      )}
    </div>
  )
}

function IcaoInput({ value, onChange }) {
  const { t } = useStore()
  const [text, setText] = useState('')
  const add = () => {
    const code = text.trim().toUpperCase()
    if (code && !value.includes(code)) onChange([...value, code])
    setText('')
  }
  return (
    <div>
      <div className="icao-chips">
        {[...value].sort().map((l) => (
          <span key={l} className="icao-tag removable">
            {l}
            <button type="button" className="chip-x" onClick={() => onChange(value.filter((x) => x !== l))}>✕</button>
          </span>
        ))}
      </div>
      <input
        className="input"
        value={text}
        placeholder={t('addIcao')}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
        }}
        onBlur={add}
      />
    </div>
  )
}

function ProviderForm({ provider, providerCourses, providerStatus, onClose, onSave, onDelete, isNew }) {
  const { t } = useStore()
  const [p, setP] = useState({ ...provider, courses: provider.courses || [], locations: provider.locations || [] })
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }))
  const toggleCourse = (id) =>
    setP((s) => {
      const has = (s.courses || []).includes(id)
      return { ...s, courses: has ? s.courses.filter((x) => x !== id) : [...(s.courses || []), id] }
    })

  return (
    <Modal
      title={isNew ? t('addProvider') : t('editProvider')}
      onClose={onClose}
      wide
      footer={
        <div className="foot-row">
          {!isNew && <button className="btn btn-danger" onClick={() => onDelete(p.id)}>{t('delete')}</button>}
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!(p.name || '').trim()) {
                  window.alert('Bitte einen Anbieternamen eingeben.')
                  return
                }
                onSave(p)
              }}
            >
              {t('save')}
            </button>
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <Field label={t('p_name')} span2>
          <input className="input" value={p.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label={t('p_courses')} span2>
          <div className="checks">
            {[...providerCourses].sort((a, b) => a.label.localeCompare(b.label)).map((c) => (
              <label key={c.id} className={'check-pill' + ((p.courses || []).includes(c.id) ? ' on' : '')}>
                <input type="checkbox" checked={(p.courses || []).includes(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label={t('p_locations')} span2>
          <IcaoInput value={p.locations || []} onChange={(v) => set('locations', v)} />
        </Field>
        <Field label={t('p_authority')}>
          <input className="input" value={p.authority} onChange={(e) => set('authority', e.target.value)} />
        </Field>
        <Field label={t('p_status')}>
          <select className="input" value={p.status} onChange={(e) => set('status', e.target.value)}>
            <option value=""></option>
            {[...providerStatus].sort((a, b) => (a.label || '').localeCompare(b.label || '')).map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label={t('p_contact')}>
          <input className="input" value={p.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
        </Field>
        <Field label={t('p_email')}>
          <input className="input" type="email" value={p.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label={t('p_phone')}>
          <input className="input" value={p.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label={t('p_website')}>
          <input className="input" value={p.website} onChange={(e) => set('website', e.target.value)} />
        </Field>
        <Field label={t('p_price')}>
          <input className="input" value={p.price} onChange={(e) => set('price', e.target.value)} />
        </Field>
        <Field label={t('p_capacity')}>
          <input className="input" value={p.capacity} onChange={(e) => set('capacity', e.target.value)} />
        </Field>
        <Field label={t('p_slots')}>
          <input className="input" type="number" min="0" step="1" value={p.slots ?? ''} onChange={(e) => set('slots', e.target.value)} />
        </Field>
        <Field label={t('p_notes')} span2>
          <textarea className="input" rows={3} value={p.notes} onChange={(e) => set('notes', e.target.value)} />
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
