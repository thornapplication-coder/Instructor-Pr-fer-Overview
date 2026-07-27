import { STATUS } from '../lib/palette.js'
import { useThemed } from '../lib/useThemed.js'
import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { useSort, Th } from '../components/sortable.jsx'
import { emptyProvider, courseLabel, simVersionLabel } from '../data/providers.js'
import { providerUtilization } from '../lib/stats.js'
import { findRun, resolveAssignment } from '../lib/courses.js'

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
  const tint = useThemed()
  const { data, t, upsertProvider, deleteProvider, newId } = useStore()
  const { providers, providerCourses, providerStatus, simVersions, trainers, assignmentSteps, courseRuns } = data
  const util = useMemo(
    () => providerUtilization(trainers, providers, assignmentSteps, courseRuns),
    [trainers, providers, assignmentSteps, courseRuns]
  )
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)

  const statusLabel = (id) => (providerStatus.find((s) => s.id === id) || {}).label || ''

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return providers.filter((p) =>
      n
        ? [
            p.name,
            (p.locations || []).join(' '),
            p.contactPerson,
            (p.courses || []).map((c) => courseLabel(providerCourses, c)).join(' '),
            (p.simVersions || []).map((s) => simVersionLabel(simVersions, s)).join(' ')
          ]
            .join(' ')
            .toLowerCase()
            .includes(n)
        : true
    )
  }, [providers, q, providerCourses, simVersions])

  const mainAcc = useMemo(
    () => ({
      name: (p) => p.name || '',
      courses: (p) => [...(p.courses || [])].map((c) => courseLabel(providerCourses, c)).sort().join(', '),
      sim: (p) => [...(p.simVersions || [])].map((s) => simVersionLabel(simVersions, s)).sort().join(', '),
      locations: (p) => [...(p.locations || [])].sort().join(', '),
      contact: (p) => p.contactPerson || '',
      status: (p) => statusLabel(p.status)
    }),
    [providerStatus, providerCourses, simVersions]
  )
  const main = useSort(rows, mainAcc, 'name')

  const utilAcc = useMemo(
    () => ({
      name: (u) => u.provider.name || '',
      assigned: (u) => u.demand,
      slots: (u) => u.slots,
      util: (u) => (u.util == null ? -1 : u.util)
    }),
    []
  )
  const utilS = useSort(util, utilAcc, 'name')

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('providers_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="push-right" />
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
              {(() => { const sp = { sortKey: main.sortKey, dir: main.dir, onSort: main.toggle }; return (
              <tr>
                <Th label={t('p_name')} k="name" {...sp} />
                <Th label={t('p_courses')} k="courses" {...sp} />
                <Th label={t('p_simVersion')} k="sim" {...sp} />
                <Th label={t('p_locations')} k="locations" {...sp} />
                <Th label={t('p_contact')} k="contact" {...sp} />
                <Th label={t('p_status')} k="status" {...sp} />
              </tr>
              ) })()}
            </thead>
            <tbody>
              {main.sorted.map((p) => {
                const st = providerStatus.find((s) => s.id === p.status) || { label: p.status || '–', color: STATUS.neutral }
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
                    <td>
                      <div className="type-tags">
                        {[...(p.courses || [])]
                          .map((c) => courseLabel(providerCourses, c))
                          .sort()
                          .map((label) => (
                            <span key={label} className="type-tag">{label}</span>
                          ))}
                      </div>
                    </td>
                    <td>
                      <div className="type-tags">
                        {[...(p.simVersions || [])]
                          .map((s) => simVersionLabel(simVersions, s))
                          .sort()
                          .map((label) => (
                            <span key={label} className="sim-tag">{label}</span>
                          ))}
                        {!(p.simVersions || []).length && <span className="muted small">–</span>}
                      </div>
                    </td>
                    <td>
                      <div className="type-tags">
                        {[...(p.locations || [])].sort().map((l) => (
                          <span key={l} className="icao-tag">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {p.contactPerson || '–'}
                      {p.email && <div className="muted small">{p.email}</div>}
                    </td>
                    <td><span className="status-tag" style={{ '--tag': tint(st.color) }}>{st.label}</span></td>
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
                {(() => { const sp = { sortKey: utilS.sortKey, dir: utilS.dir, onSort: utilS.toggle }; return (
                <tr>
                  <Th label={t('p_name')} k="name" {...sp} />
                  <th>{t('p_courses')}</th>
                  <Th label={t('prov_assigned')} k="assigned" className="num" {...sp} />
                  <Th label={t('prov_slots')} k="slots" className="num" {...sp} />
                  <Th label={t('prov_util')} k="util" {...sp} />
                </tr>
                ) })()}
              </thead>
              <tbody>
                {utilS.sorted.map((u) => (
                  <tr
                    key={u.provider.id}
                    className="clickable"
                    onClick={() => setEditing({ ...u.provider })}
                    tabIndex={0}
                    aria-label={u.provider.name || ''}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...u.provider }) } }}
                  >
                    <td className="strong">{u.provider.name || '–'}</td>
                    <td>
                      <div className="type-tags">
                        {/* Demand against the capacity of the SAME course type.
                            A provider's total can look comfortable while the one
                            course everybody needs is the bottleneck. */}
                        {assignmentSteps
                          .filter((s) => u.byStep[s.id] || u.slotsByStep?.[s.id])
                          .map((s) => {
                            const need = u.byStep[s.id] || 0
                            const cap = u.slotsByStep?.[s.id] || 0
                            return (
                              <span
                                key={s.id}
                                className={'type-tag' + (cap > 0 && need > cap ? ' over' : '')}
                                title={cap > 0 ? t('prov_stepTag').replace('{n}', String(need)).replace('{m}', String(cap)) : ''}
                              >
                                {s.label}: {need}{cap > 0 ? ' / ' + cap : ''}
                              </span>
                            )
                          })}
                        {u.demand === 0 && !assignmentSteps.some((s) => u.slotsByStep?.[s.id]) && (
                          <span className="muted small">–</span>
                        )}
                      </div>
                    </td>
                    <td className="num strong">{u.demand}</td>
                    <td className="num">
                      {u.slots || '–'}
                      {u.slotsSplitOver && <span className="warn-text small" title={t('p_slotsOverShort')}> !</span>}
                    </td>
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
          simVersions={simVersions}
          steps={assignmentSteps}
          onClose={() => setEditing(null)}
          onSave={(p) => { upsertProvider(p); setEditing(null) }}
          onDelete={(id) => {
            // Resolved, not raw: a booking made through a course date carries no
            // provider of its own, so counting the raw field would report "0
            // assignments" and then quietly blank a course everyone is on.
            const assignedCount = trainers.reduce(
              (n, tr) =>
                n +
                Object.values(tr.assignments || {}).filter(
                  (x) => x && resolveAssignment(x, findRun(courseRuns, x.courseId)).providerId === id
                ).length,
              0
            )
            const msg =
              assignedCount > 0
                ? t('deleteProviderAssignedConfirm').replace('{n}', assignedCount)
                : t('deleteProviderConfirm')
            if (window.confirm(msg)) { deleteProvider(id); setEditing(null) }
          }}
          isNew={!providers.some((x) => x.id === editing.id)}
        />
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

// Multi-select built from a dropdown (empty entry on top). Picking an option
// adds it as a removable chip; already-picked options drop out of the list.
function MultiPick({ value, options, labelOf, placeholder, tagClass, onChange }) {
  const picked = value || []
  const open = (options || []).filter((o) => !picked.includes(o.id))
  return (
    <div>
      <div className="icao-chips">
        {[...picked].sort((a, b) => labelOf(a).localeCompare(labelOf(b))).map((id) => (
          <span key={id} className={(tagClass || 'type-tag') + ' removable'}>
            {labelOf(id)}
            <button type="button" className="chip-x" onClick={() => onChange(picked.filter((x) => x !== id))}>✕</button>
          </span>
        ))}
      </div>
      <select
        className="input"
        value=""
        onChange={(e) => { if (e.target.value) onChange([...picked, e.target.value]) }}
      >
        <option value="">{placeholder}</option>
        {[...open].sort((a, b) => (a.label || '').localeCompare(b.label || '')).map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// Small "⚙" next to a field label that opens the list editor for that field
// inside this same dialog (no nested modal).
function ManageLink({ onClick, title }) {
  return (
    <button type="button" className="field-manage" onClick={onClick} title={title} aria-label={title}>
      ⚙
    </button>
  )
}

function ProviderForm({ provider, providerCourses, providerStatus, simVersions, steps, onClose, onSave, onDelete, isNew }) {
  const { t, setProviderCourses, setProviderStatus, setSimVersions } = useStore()
  const [p, setP] = useState({
    ...provider,
    courses: provider.courses || [],
    locations: provider.locations || [],
    simVersions: provider.simVersions || []
  })
  // Which taxonomy list is being edited in-place ('courses' | 'sim' | 'status').
  const [manage, setManage] = useState(null)
  const typedSlots = Math.max(0, Math.round(Number(p.slots) || 0))
  const splitSum = (steps || []).reduce((n, st) => n + Math.max(0, Math.round(Number(p.slotsByStep?.[st.id]) || 0)), 0)
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }))
  const toggleCourse = (id) =>
    setP((s) => {
      const has = (s.courses || []).includes(id)
      return { ...s, courses: has ? s.courses.filter((x) => x !== id) : [...(s.courses || []), id] }
    })

  const MANAGERS = {
    courses: { title: t('manageCourses'), items: providerCourses, onChange: setProviderCourses, hasColor: false },
    sim: { title: t('manageSimVersions'), items: simVersions, onChange: setSimVersions, hasColor: false },
    status: { title: t('manageProviderStatus'), items: providerStatus, onChange: setProviderStatus, hasColor: true }
  }

  // Leaving the list editor: drop references this form still holds to entries
  // that were just deleted, otherwise a stale id would be saved back and then
  // render as a raw "cat-xxxxxxx" tag in the table and the exports.
  const closeManage = () => {
    const alive = (defs, id) => (defs || []).some((x) => x.id === id)
    setP((s) => ({
      ...s,
      courses: (s.courses || []).filter((id) => alive(providerCourses, id)),
      simVersions: (s.simVersions || []).filter((id) => alive(simVersions, id)),
      status: alive(providerStatus, s.status) ? s.status : ''
    }))
    setManage(null)
  }

  // Sub-view: edit one of the selectable lists without leaving the dialog, so
  // the half-filled provider form is preserved behind it.
  if (manage) {
    const m = MANAGERS[manage]
    return (
      <Modal
        title={m.title}
        onClose={closeManage}
        wide
        footer={
          <div className="foot-row">
            <p className="muted small">{t('dragHint')}</p>
            <div className="push-right">
              <button className="btn btn-primary" onClick={closeManage}>← {t('back')}</button>
            </div>
          </div>
        }
      >
        <CategoryManager items={m.items} onChange={m.onChange} hasColor={m.hasColor} />
      </Modal>
    )
  }

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
                  window.alert(t('providerNameRequired'))
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
        <Field label={t('p_courses')} span2 extra={<ManageLink onClick={() => setManage('courses')} title={t('manageCourses')} />}>
          <div className="checks">
            {[...providerCourses].sort((a, b) => a.label.localeCompare(b.label)).map((c) => (
              <label key={c.id} className={'check-pill' + ((p.courses || []).includes(c.id) ? ' on' : '')}>
                <input type="checkbox" checked={(p.courses || []).includes(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label={t('p_simVersion')} span2 extra={<ManageLink onClick={() => setManage('sim')} title={t('manageSimVersions')} />}>
          <MultiPick
            value={p.simVersions || []}
            options={simVersions}
            labelOf={(id) => simVersionLabel(simVersions, id)}
            placeholder={t('addSimVersion')}
            tagClass="sim-tag"
            onChange={(v) => set('simVersions', v)}
          />
        </Field>
        <Field label={t('p_locations')} span2>
          <IcaoInput value={p.locations || []} onChange={(v) => set('locations', v)} />
        </Field>
        <Field label={t('p_status')} extra={<ManageLink onClick={() => setManage('status')} title={t('manageProviderStatus')} />}>
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
        <Field label={t('p_slots')}>
          <input className="input" type="number" min="0" step="1" value={p.slots ?? ''} onChange={(e) => set('slots', e.target.value)} />
        </Field>
        <Field label={t('p_slotsByStep')} span2>
          {/* Per course type, because a provider that runs six type ratings a
              month may only run two TRI courses – a single total hides that. */}
          <div className="slot-grid">
            {steps.map((st) => (
              <label className="slot-cell" key={st.id}>
                <span className="slot-name">{st.label}</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="–"
                  value={p.slotsByStep?.[st.id] || ''}
                  aria-label={st.label + ' – ' + t('p_slots')}
                  onChange={(e) =>
                    set('slotsByStep', { ...(p.slotsByStep || {}), [st.id]: e.target.value === '' ? 0 : Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <p className="stat-hint">
            {t('p_slotsHint')}
            {splitSum > 0 && ' ' + t('p_slotsSum').replace('{n}', String(splitSum))}
          </p>
          {typedSlots > 0 && splitSum > typedSlots && (
            <p className="warn-text small">{t('p_slotsOver').replace('{n}', String(splitSum)).replace('{m}', String(typedSlots))}</p>
          )}
        </Field>
        <Field label={t('p_notes')} span2>
          <textarea className="input" rows={3} value={p.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

// With `extra` (the ⚙ list editor) the wrapper must NOT be a <label>: a click
// that lands next to the button would activate the label and silently toggle
// the field's first control (e.g. tick a course the provider does not offer).
function Field({ label, children, span2, extra }) {
  const cls = 'field' + (span2 ? ' span2' : '')
  if (extra) {
    return (
      <div className={cls}>
        <span className="field-label">
          {label}
          {extra}
        </span>
        {children}
      </div>
    )
  }
  return (
    <label className={cls}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
