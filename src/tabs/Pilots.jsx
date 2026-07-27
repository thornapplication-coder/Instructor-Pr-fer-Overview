import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { RoleTag } from '../components/tags.jsx'
import DateInput from '../components/DateInput.jsx'
import Modal from '../components/Modal.jsx'
import { useSort, Th } from '../components/sortable.jsx'
import { formatDate } from '../lib/format.js'
import { emptyPilot, emptyRating, normalizeTlc, pilotRole, pilotValidity, ratingValid } from '../data/pilots.js'

// Company line pilots (not trainers): which Boeing types they are rated on and
// whether those ratings still hold TODAY.
//
// "Gültig" and "Abgelaufen" are columns of the spreadsheet this replaces, but
// they are not fields here: they are worked out from the expiry date every time
// the table is drawn. A stored flag would be wrong the morning after it was
// written, on a list whose only job is to say who may fly what now.
export default function Pilots() {
  const { data, t, lang, upsertPilot, deletePilot, newId } = useStore()
  const { otherPilots, bases, pilotTypes } = data
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fType, setFType] = useState('')
  const [fValidity, setFValidity] = useState('')
  const [editing, setEditing] = useState(null)

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return otherPilots
      .filter((p) => (fBase ? p.base === fBase : true))
      .filter((p) => (fType ? (p.ratings || []).some((r) => r.type === fType) : true))
      .filter((p) => {
        if (!fValidity) return true
        const v = pilotValidity(p)
        return fValidity === 'valid' ? v.valid : v.expired
      })
      .filter((p) =>
        n
          ? [p.name, p.tlc, p.base, p.remark, ...(p.ratings || []).map((r) => r.type)]
              .join(' ')
              .toLowerCase()
              .includes(n)
          : true
      )
  }, [otherPilots, q, fBase, fType, fValidity])

  const acc = useMemo(
    () => ({
      base: (p) => p.base || '',
      tlc: (p) => p.tlc || '',
      name: (p) => p.name || '',
      type: (p) => (p.ratings || []).map((r) => r.type).join(' '),
      // Soonest expiry first; a person with no date at all sorts last.
      until: (p) => (p.ratings || []).map((r) => r.until || '9999').sort()[0] || '9999',
      exp: (p) => (p.boeingExp ? 0 : 1),
      valid: (p) => (pilotValidity(p).valid ? 0 : 1),
      expired: (p) => (pilotValidity(p).expired ? 0 : 1)
    }),
    []
  )
  const { sorted, sortKey, dir, toggle } = useSort(rows, acc, 'name')
  const sp = { sortKey, dir, onSort: toggle }
  const anyFilter = !!(q.trim() || fBase || fType || fValidity)

  const addPilot = () => setEditing({ ...emptyPilot(newId('plt')), _isNew: true })

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('pilots_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <select className="input" value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">{t('f_type')}: {t('all')}</option>
          {pilotTypes.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
        <select className="input" value={fValidity} onChange={(e) => setFValidity(e.target.value)}>
          <option value="">{t('f_validity')}: {t('all')}</option>
          <option value="valid">{t('f_valid')}</option>
          <option value="expired">{t('f_expired')}</option>
        </select>
        <span className="count-pill">{rows.length} / {otherPilots.length} {t('showing')}</span>
        {anyFilter && (
          <button className="btn btn-ghost" onClick={() => { setQ(''); setFBase(''); setFType(''); setFValidity('') }}>
            ↺ {t('resetFilters')}
          </button>
        )}
        <span className="push-right" />
        <button className="btn btn-primary" onClick={addPilot}>+ {t('addPilot')}</button>
      </div>

      <p className="planning-note">{t('pilot_ratingsHint')}</p>

      {otherPilots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✈️</div>
          <p>{t('pilots_none')}</p>
          <button className="btn btn-primary" onClick={addPilot}>+ {t('addPilot')}</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table card-at-1000 pilots-table">
            <thead>
              <tr>
                <Th label={t('f_base')} k="base" {...sp} />
                <Th label={t('f_tlc')} k="tlc" {...sp} />
                <Th label={t('f_name')} k="name" {...sp} />
                <Th label={t('f_type')} k="type" {...sp} />
                <Th label={t('f_validity')} k="until" {...sp} />
                <Th label={t('f_boeingExp')} k="exp" className="center" {...sp} />
                <Th label={t('f_valid')} k="valid" className="center" {...sp} />
                <Th label={t('f_expired')} k="expired" className="center" {...sp} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const list = p.ratings || []
                return (
                  <tr
                    key={p.id}
                    className="clickable"
                    onClick={() => setEditing({ ...p })}
                    tabIndex={0}
                    aria-label={p.name || ''}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...p }) } }}
                  >
                    {/* Each cell carries its own heading. It is invisible while
                        the table is a table; on a phone the row becomes a card,
                        the header row is gone, and this is what names the
                        value. */}
                    <td className="c-base" data-label={t('f_base')}>{p.base || '–'}</td>
                    <td className="c-tlc mono" data-label={t('f_tlc')}>{p.tlc || '–'}</td>
                    <td className="c-name card-name strong nowrap">
                      {p.name || '–'}
                      <div className="muted small"><RoleTag role={pilotRole(p)} sm /></div>
                    </td>
                    {/* Every rating gets its own line in all four columns, so
                        the × for "valid" sits on the SAME line as the date it
                        refers to. One × per person put the mark of the second
                        rating next to the first rating's date. */}
                    <td className="c-type" data-label={t('f_type')}>
                      {list.length
                        ? list.map((r) => <div key={r.id} className="rating-line">{r.type || '–'}</div>)
                        : <div className="rating-line">–</div>}
                    </td>
                    <td className="c-until" data-label={t('f_validity')}>
                      {list.length
                        ? list.map((r) => {
                            const rv = ratingValid(r)
                            return (
                              <div
                                key={r.id}
                                className={'rating-line' + (rv === true ? ' date-ok' : rv === false ? ' date-bad' : '')}
                              >
                                {r.until ? formatDate(r.until, lang) : '–'}
                              </div>
                            )
                          })
                        : <div className="rating-line">–</div>}
                    </td>
                    {/* Boeing experience belongs to the PERSON, so it is marked
                        once, on the first line. */}
                    <td className="c-exp center" data-label={t('f_boeingExp')}>
                      <div className="rating-line">{p.boeingExp ? '×' : ''}</div>
                      {list.slice(1).map((r) => <div key={r.id} className="rating-line" />)}
                    </td>
                    <td className="c-valid center mark-ok" data-label={t('f_valid')}>
                      {list.length
                        ? list.map((r) => (
                            <div key={r.id} className="rating-line">{ratingValid(r) === true ? '×' : ''}</div>
                          ))
                        : <div className="rating-line" />}
                    </td>
                    <td className="c-expired center mark-bad" data-label={t('f_expired')}>
                      {list.length
                        ? list.map((r) => (
                            <div key={r.id} className="rating-line">{ratingValid(r) === false ? '×' : ''}</div>
                          ))
                        : <div className="rating-line" />}
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && <tr><td colSpan={8} className="empty-row">{t('noTrainers')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PilotForm
          pilot={editing}
          bases={bases}
          types={pilotTypes}
          onClose={() => setEditing(null)}
          onSave={(p) => { upsertPilot(p); setEditing(null) }}
          onDelete={(id) => { if (window.confirm(t('deletePilotConfirm'))) { deletePilot(id); setEditing(null) } }}
        />
      )}
    </div>
  )
}

function PilotForm({ pilot, bases, types, onClose, onSave, onDelete }) {
  const { t, lang, newId } = useStore()
  const [p, setP] = useState({ ...pilot, ratings: [...(pilot.ratings || [])] })
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }))
  const isNew = !!pilot._isNew

  const setRating = (id, changes) =>
    setP((s) => ({ ...s, ratings: s.ratings.map((r) => (r.id === id ? { ...r, ...changes } : r)) }))
  const addRating = () => setP((s) => ({ ...s, ratings: [...s.ratings, emptyRating(newId('rat'))] }))
  const dropRating = (id) => setP((s) => ({ ...s, ratings: s.ratings.filter((r) => r.id !== id) }))

  const submit = () => {
    if (!(p.name || '').trim()) { window.alert(t('pilotNameRequired')); return }
    const out = { ...p, tlc: normalizeTlc(p.tlc) }
    delete out._isNew
    onSave(out)
  }

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
          <input
            className="input"
            value={p.name || ''}
            placeholder="Nachname, Vorname"
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>
        <Field label={t('f_tlc')}>
          {/* Three characters, upper case, on entry rather than on save: a field
              that silently rewrites what was typed once it is closed is worse
              than one that shows the rule while it is being typed. */}
          <input
            className="input mono"
            value={p.tlc || ''}
            maxLength={3}
            placeholder="ABC"
            onChange={(e) => set('tlc', normalizeTlc(e.target.value))}
          />
        </Field>
        <Field label={t('f_base')}>
          <select className="input" value={p.base || ''} onChange={(e) => set('base', e.target.value)}>
            <option value=""></option>
            {/* A base that is no longer on the list stays selectable, or the
                controlled select would silently blank the stored value. */}
            {p.base && !bases.some((b) => b.id === p.base) && <option value={p.base}>{p.base}</option>}
            {bases.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </Field>
        <Field label={t('f_position')}>
          <select className="input" value={pilotRole(p)} onChange={(e) => set('role', e.target.value)}>
            <option value="captain">{t('role_captain')}</option>
            <option value="fo">{t('role_fo')}</option>
          </select>
        </Field>
        <Field label={t('f_boeingExp')}>
          <label className="check-line">
            <input type="checkbox" checked={!!p.boeingExp} onChange={(e) => set('boeingExp', e.target.checked)} />
            <span>{t('yes')}</span>
          </label>
        </Field>

        <div className="field span2">
          <span className="field-label">{t('f_type')}</span>
          <div className="rating-editor">
            {p.ratings.map((r) => {
              const v = ratingValid(r)
              return (
                <div className="rating-row" key={r.id}>
                  <select className="input" value={r.type || ''} onChange={(e) => setRating(r.id, { type: e.target.value })}>
                    <option value=""></option>
                    {r.type && !types.some((x) => x.id === r.type) && <option value={r.type}>{r.type}</option>}
                    {types.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                  <DateInput value={r.until || ''} onChange={(val) => setRating(r.id, { until: val })} />
                  <span className={'rating-verdict' + (v === true ? ' ok' : v === false ? ' bad' : '')}>
                    {v === true ? t('f_valid') : v === false ? t('f_expired') : '–'}
                  </span>
                  <button className="mini-btn danger" onClick={() => dropRating(r.id)} title={t('delete')}>✕</button>
                </div>
              )
            })}
            {!p.ratings.length && <p className="muted small">{t('pilot_noRatings')}</p>}
            <button className="btn btn-ghost" onClick={addRating}>+ {t('pilot_addRating')}</button>
          </div>
        </div>

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
