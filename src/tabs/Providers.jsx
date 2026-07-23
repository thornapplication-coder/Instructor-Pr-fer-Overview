import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import { PROVIDER_TYPES, PROVIDER_STATUS, emptyProvider } from '../data/providers.js'

export default function Providers() {
  const { data, t, lang, upsertProvider, deleteProvider, newId } = useStore()
  const { providers } = data
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return providers
      .filter((p) =>
        n
          ? [p.name, p.location, p.authority, p.contactPerson, (p.types || []).join(' ')]
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
        <input
          className="input search"
          placeholder={t('search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="btn btn-primary push-right"
          onClick={() => setEditing(emptyProvider(newId('prov')))}
        >
          + {t('addProvider')}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>{t('noProviders')}</p>
          <button className="btn btn-primary" onClick={() => setEditing(emptyProvider(newId('prov')))}>
            + {t('addProvider')}
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('p_name')}</th>
                <th>{t('p_types')}</th>
                <th>{t('p_location')}</th>
                <th>{t('p_authority')}</th>
                <th>{t('p_contact')}</th>
                <th>{t('p_capacity')}</th>
                <th>{t('p_status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = PROVIDER_STATUS[p.status] || PROVIDER_STATUS.candidate
                return (
                  <tr key={p.id} className="clickable" onClick={() => setEditing({ ...p })}>
                    <td className="strong">{p.name || '–'}</td>
                    <td>
                      <div className="type-tags">
                        {(p.types || []).map((tp) => (
                          <span key={tp} className="type-tag">{tp}</span>
                        ))}
                      </div>
                    </td>
                    <td>{p.location || '–'}</td>
                    <td className="muted small">{p.authority || '–'}</td>
                    <td>
                      {p.contactPerson || '–'}
                      {p.email && <div className="muted small">{p.email}</div>}
                    </td>
                    <td className="muted small">{p.capacity || '–'}</td>
                    <td>
                      <span className="status-tag" style={{ background: st.color }}>
                        {lang === 'de' ? st.de : st.en}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProviderForm
          provider={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            upsertProvider(p)
            setEditing(null)
          }}
          onDelete={(id) => {
            if (window.confirm(t('deleteProviderConfirm'))) {
              deleteProvider(id)
              setEditing(null)
            }
          }}
          isNew={!providers.some((x) => x.id === editing.id)}
        />
      )}
    </div>
  )
}

function ProviderForm({ provider, onClose, onSave, onDelete, isNew }) {
  const { t, lang } = useStore()
  const [p, setP] = useState({ ...provider })
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }))
  const toggleType = (tp) =>
    setP((s) => {
      const has = (s.types || []).includes(tp)
      return { ...s, types: has ? s.types.filter((x) => x !== tp) : [...(s.types || []), tp] }
    })

  return (
    <Modal
      title={isNew ? t('addProvider') : t('editProvider')}
      onClose={onClose}
      wide
      footer={
        <div className="foot-row">
          {!isNew && (
            <button className="btn btn-danger" onClick={() => onDelete(p.id)}>{t('delete')}</button>
          )}
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!(p.name || '').trim()) {
                  window.alert(lang === 'de' ? 'Bitte einen Anbieternamen eingeben.' : 'Please enter a provider name.')
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
        <Field label={t('p_types')} span2>
          <div className="checks">
            {PROVIDER_TYPES.map((tp) => (
              <label key={tp} className={'check-pill' + ((p.types || []).includes(tp) ? ' on' : '')}>
                <input
                  type="checkbox"
                  checked={(p.types || []).includes(tp)}
                  onChange={() => toggleType(tp)}
                />
                {tp}
              </label>
            ))}
          </div>
        </Field>
        <Field label={t('p_location')}>
          <input className="input" value={p.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label={t('p_authority')}>
          <input className="input" value={p.authority} onChange={(e) => set('authority', e.target.value)} />
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
        <Field label={t('p_status')}>
          <select className="input" value={p.status} onChange={(e) => set('status', e.target.value)}>
            {Object.entries(PROVIDER_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'de' ? v.de : v.en}</option>
            ))}
          </select>
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
