import { STATUS } from '../lib/palette.js'
import { useThemed } from '../lib/useThemed.js'
import React, { useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import ExportLink from '../components/ExportLink.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { useSort, Th, SortSelect } from '../components/sortable.jsx'
import { emptyProvider, courseLabel, simVersionLabel } from '../data/providers.js'
import { providerSlots, providerUtilization, providerPlanCheck, capacityByMonth } from '../lib/stats.js'
import { findRun, resolveAssignment } from '../lib/courses.js'
import { capacityRange, monthLabel, isMonth } from '../lib/months.js'
import { StackedBars, colorAt } from '../components/charts.jsx'

export default function Providers() {
  const tint = useThemed()
  const { data, t, upsertProvider, deleteProvider, newId, readOnly } = useStore()
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
      slots: (u) => u.slots
    }),
    []
  )
  const utilS = useSort(util, utilAcc, 'name')

  return (
    <div className="tab-pane">
      <div className="toolbar">
        <h2 className="pane-title">{t('providers_title')}</h2>
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <SortSelect
          label={t('sortBy')}
          at={1000}
          sortKey={main.sortKey}
          dir={main.dir}
          onSort={main.toggle}
          options={[
            { k: 'name', label: t('p_name') },
            { k: 'status', label: t('p_status') },
            { k: 'locations', label: t('p_locations') },
            { k: 'courses', label: t('p_courses') }
          ]}
        />
        <span className="push-right" />
        <ExportLink id="providers" />
        {!readOnly && <button className="btn btn-primary" onClick={() => setEditing(emptyProvider(newId('prov')))}>+ {t('addProvider')}</button>}
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>{t('noProviders')}</p>
          <button className="btn btn-primary" onClick={() => setEditing(emptyProvider(newId('prov')))}>+ {t('addProvider')}</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table card-at-1000 provider-table" role="table">
            <thead role="rowgroup">
              {(() => { const sp = { sortKey: main.sortKey, dir: main.dir, onSort: main.toggle }; return (
              <tr role="row">
                <Th label={t('p_name')} k="name" {...sp} />
                <Th label={t('p_courses')} k="courses" {...sp} />
                <Th label={t('p_simVersion')} k="sim" {...sp} />
                <Th label={t('p_locations')} k="locations" {...sp} />
                <Th label={t('p_contact')} k="contact" {...sp} />
                <Th label={t('p_status')} k="status" {...sp} />
              </tr>
              ) })()}
            </thead>
            <tbody role="rowgroup">
              {main.sorted.map((p) => {
                const st = providerStatus.find((s) => s.id === p.status) || { label: p.status || '–', color: STATUS.neutral }
                return (
                  <tr role="row"
                    key={p.id}
                    className="clickable"
                    onClick={() => setEditing({ ...p })}
                    tabIndex={0}
                    aria-label={p.name || ''}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...p }) } }}
                  >
                    {/* Named cells and their own headings: inert while this is
                        a table, and what the card layout rearranges below the
                        width the six columns need. The course chips get the
                        card's full width there — squeezed into a narrow column
                        "Type Rating + Base Training" broke over four lines and
                        made one provider taller than a phone screen. */}
                    <td role="cell" className="pv-name card-name strong">{p.name || '–'}</td>
                    <td role="cell" className="pv-courses" data-label={t('p_courses')}>
                      <div className="type-tags">
                        {[...(p.courses || [])]
                          .map((c) => courseLabel(providerCourses, c))
                          .sort()
                          .map((label) => (
                            <span key={label} className="type-tag">{label}</span>
                          ))}
                        {/* On the card the heading is drawn whether or not the
                            list has anything in it, so an empty one has to say
                            "nothing set" rather than leave a caption over blank
                            space – on a fresh install that is every provider. */}
                        {!(p.courses || []).length && <span className="muted small">–</span>}
                      </div>
                    </td>
                    <td role="cell" className="pv-sim" data-label={t('p_simVersion')}>
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
                    <td role="cell" className="pv-loc" data-label={t('p_locations')}>
                      <div className="type-tags">
                        {[...(p.locations || [])].sort().map((l) => (
                          <span key={l} className="icao-tag">{l}</span>
                        ))}
                        {!(p.locations || []).length && <span className="muted small">–</span>}
                      </div>
                    </td>
                    <td role="cell" className="pv-contact wrap-anywhere" data-label={t('p_contact')}>
                      {p.contactPerson || '–'}
                      {p.email && <div className="muted small">{p.email}</div>}
                    </td>
                    <td role="cell" className="pv-status card-chip-end"><span className="status-tag" style={{ '--tag': tint(st.color) }}>{st.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Directly under the provider list. It lived at the bottom of the
          capacity tab first and was measured 2776px down on a phone – nobody
          found it. Here it is under the providers it describes, and the last
          section stays the one you scroll to on purpose. */}
      {providers.length > 0 && <ProviderMonthsChart providers={providers} steps={assignmentSteps} />}

      {providers.length > 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <h3 className="card-title">{t('prov_capacity')}</h3>
          <p className="muted small">{t('prov_capacityHint')}</p>
          {/* This table exists to answer "who is the bottleneck", which is a
              question about ORDER. Losing the header row on a card would have
              left it frozen at name-ascending. */}
          <SortSelect
            label={t('sortBy')}
            at={1000}
            sortKey={utilS.sortKey}
            dir={utilS.dir}
            onSort={utilS.toggle}
            options={[
              { k: 'assigned', label: t('prov_assigned') },
              { k: 'slots', label: t('prov_slots') },
              { k: 'name', label: t('p_name') }
            ]}
          />
          <div className="table-wrap">
            <table className="data-table card-at-1000 provider-cap-table" role="table">
              <thead role="rowgroup">
                {(() => { const sp = { sortKey: utilS.sortKey, dir: utilS.dir, onSort: utilS.toggle }; return (
                <tr role="row">
                  <Th label={t('p_name')} k="name" {...sp} />
                  <th>{t('p_courses')}</th>
                  <Th label={t('prov_assigned')} k="assigned" className="num" {...sp} />
                  <Th label={t('prov_slots')} k="slots" className="num" {...sp} />
                </tr>
                ) })()}
              </thead>
              <tbody role="rowgroup">
                {utilS.sorted.map((u) => (
                  <tr role="row"
                    key={u.provider.id}
                    className="clickable"
                    onClick={() => setEditing({ ...u.provider })}
                    tabIndex={0}
                    aria-label={u.provider.name || ''}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing({ ...u.provider }) } }}
                  >
                    <td role="cell" className="pc-name card-name strong">{u.provider.name || '–'}</td>
                    <td role="cell" className="pc-courses" data-label={t('p_courses')}>
                      <div className="type-tags">
                        {/* Demand against the capacity of the SAME course type.
                            A provider's total can look comfortable while the one
                            course everybody needs is the bottleneck. */}
                        {assignmentSteps
                          .filter((s) => u.byStep[s.id] || u.slotsByStep?.[s.id])
                          .map((s) => {
                            const need = u.byStep[s.id] || 0
                            const cap = u.slotsByStep?.[s.id] || 0
                            // Both figures are totals over the whole window now,
                            // so they compare directly: short is short. The old
                            // "how many months" reading died with the monthly
                            // rate – WHEN the seats fall is the timeline's job,
                            // and dividing by an average invented capacity in
                            // the months that have none.
                            const short = cap > 0 && need > cap ? need - cap : null
                            return (
                              <span
                                key={s.id}
                                className={'type-tag' + (short != null ? ' over' : '')}
                                title={
                                  cap > 0
                                    ? (short != null ? t('prov_stepTagOver') : t('prov_stepTag'))
                                        .replace('{n}', String(need))
                                        .replace('{m}', String(cap))
                                        .replace('{k}', String(short || 0))
                                    : ''
                                }
                              >
                                {s.label}: {need}{cap > 0 ? ' / ' + cap : ''}
                                {short != null && <b> · −{short}</b>}
                              </span>
                            )
                          })}
                        {u.demand === 0 && !assignmentSteps.some((s) => u.slotsByStep?.[s.id]) && (
                          <span className="muted small">–</span>
                        )}
                      </div>
                    </td>
                    <td role="cell" className="pc-assigned num strong" data-label={t('prov_assigned')}>{u.demand}</td>
                    <td role="cell" className="pc-slots num" data-label={t('prov_slots')}>
                      {u.slots || '–'}
                      {u.slotsSplitOver && <span className="warn-text small" title={t('p_slotsOverShort')}> !</span>}
                    </td>
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
// `label` is not drawn - the field caption above already is. It names the
// control for a screen reader, which the caption cannot do here: with the ⚙
// button beside it the caption is a <span>, not a <label>.
function MultiPick({ value, options, labelOf, placeholder, tagClass, onChange, label }) {
  const picked = value || []
  const open = (options || []).filter((o) => !picked.includes(o.id))
  return (
    <div>
      <div className="icao-chips">
        {[...picked].sort((a, b) => labelOf(a).localeCompare(labelOf(b))).map((id) => (
          <span key={id} className={(tagClass || 'type-tag') + ' removable'}>
            {labelOf(id)}
            <button
              type="button"
              className="chip-x"
              aria-label={labelOf(id)}
              title={labelOf(id)}
              onClick={() => onChange(picked.filter((x) => x !== id))}
            >✕</button>
          </span>
        ))}
      </div>
      <select
        className="input"
        aria-label={label || placeholder}
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

/**
 * The monthly plan as a picture, under the providers it belongs to.
 *
 * One bar per month, split by course type, over the whole configured window –
 * empty months included. In a table the empty months were a dimmed row; in a
 * chart they are a gap in the axis, which is what a timeline is for: you see
 * that November and December carry the load and that the spring is empty
 * without reading a single number.
 *
 * Stacked, not grouped: the question is how much a month holds altogether, and
 * the split is the second question. The colours are the planning steps' own, so
 * a course type is the same colour here, on the board and in the planning grid.
 */
function ProviderMonthsChart({ providers, steps }) {
  const { t, lang, data } = useStore()
  const [who, setWho] = useState('')
  const months = useMemo(
    () => capacityRange(data.capacityFrom, data.capacityTo),
    [data.capacityFrom, data.capacityTo]
  )
  const picked = useMemo(() => (who ? providers.filter((p) => p.id === who) : providers), [providers, who])
  const { rows, totals } = useMemo(() => capacityByMonth(picked, steps, months), [picked, steps, months])
  // Prefixed series keys: a step id is user-editable, and one called "label"
  // would otherwise overwrite the row's own label on the spread below.
  const series = steps.map((s, i) => ({ key: 's_' + s.id, label: s.label, color: s.color || colorAt(i) }))
  const chartRows = rows.map((r) => ({
    key: r.month,
    label: monthLabel(r.month, lang),
    ...Object.fromEntries(steps.map((s) => ['s_' + s.id, r.byStep[s.id] || 0]))
  }))

  return (
    <section className="card prov-months" style={{ marginTop: 18 }}>
      <div className="card-head">
        <h3 className="card-title">{t('cap_timelineTitle')}</h3>
        {totals.total > 0 && <span className="card-total">{t('total')}: {totals.total}</span>}
      </div>
      <p className="muted small">{t('cap_timelineHint')}</p>
      <div className="toolbar no-print" style={{ marginTop: 6 }}>
        <select className="input" value={who} onChange={(e) => setWho(e.target.value)} aria-label={t('cap_allProviders')}>
          <option value="">{t('cap_allProviders')}</option>
          {[...providers]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
            .map((p) => (
              <option key={p.id} value={p.id}>{p.name || '–'}</option>
            ))}
        </select>
      </div>
      {months.length === 0 ? (
        <p className="warn-text small">{t('set_capacityBad')}</p>
      ) : totals.total === 0 ? (
        <p className="muted small">{t('cap_noSlots')}</p>
      ) : (
        <StackedBars data={chartRows} series={series} />
      )}
    </section>
  )
}

/**
 * Seats per month, per course type – the provider's actual plan.
 *
 * Sparse by design: only the months that hold something get a row, added
 * through the picker. The dense alternative (every month of the window, always
 * on screen) is eighteen rows of mostly zeros per provider, and on a phone that
 * buries the three months that matter.
 *
 * Months already used drop out of the picker, so the same month cannot be
 * entered twice – two November rows would each look authoritative and only one
 * of them could survive the save.
 */
function MonthPlan({ value, steps, months, onChange }) {
  const { t, lang, readOnly } = useStore()
  const [pick, setPick] = useState('')
  // Months outside the configured window stay listed while they hold data:
  // silently hiding a number somebody typed is how a plan quietly loses a
  // course. They are flagged, and can be removed like any other row.
  const rows = Object.keys(value || {}).filter(isMonth).sort()
  const free = months.filter((m) => !(m in (value || {})))

  const setCell = (month, stepId, raw) => {
    const n = raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0))
    onChange({ ...(value || {}), [month]: { ...((value || {})[month] || {}), [stepId]: n } })
  }
  const removeMonth = (month) => {
    const next = { ...(value || {}) }
    delete next[month]
    onChange(next)
  }

  return (
    <div className="month-plan">
      {rows.length === 0 ? (
        <p className="muted small">{t('p_noMonths')}</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table compact card-at-900 month-table" role="table">
            <thead>
              <tr>
                <th scope="col">{t('p_month')}</th>
                {steps.map((s) => (
                  <th scope="col" key={s.id} className="num">{s.label}</th>
                ))}
                <th scope="col" className="num">{t('total')}</th>
                <th scope="col" aria-label={t('p_removeMonth')} />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const cells = (value || {})[m] || {}
                const sum = steps.reduce((n, s) => n + Math.max(0, Math.round(Number(cells[s.id]) || 0)), 0)
                const outside = !months.includes(m)
                return (
                  <tr key={m} role="row">
                    <td role="cell" className="mp-month card-name strong">
                      {monthLabel(m, lang)}
                      {outside && <span className="warn-text small" title={t('p_monthOutside')}> !</span>}
                    </td>
                    {steps.map((s) => (
                      <td role="cell" key={s.id} className="mp-cell num" data-label={s.label}>
                        <input
                          className="input"
                          disabled={readOnly}
                          type="number"
                          min="0"
                          step="1"
                          placeholder="–"
                          value={cells[s.id] || ''}
                          aria-label={monthLabel(m, lang) + ' – ' + s.label}
                          onChange={(e) => setCell(m, s.id, e.target.value)}
                        />
                      </td>
                    ))}
                    <td role="cell" className="mp-sum num strong" data-label={t('total')}>{sum || '–'}</td>
                    <td role="cell" className="mp-del">
                      {!readOnly && <button
                        type="button"
                        className="mini-btn danger"
                        title={t('p_removeMonth')}
                        aria-label={t('p_removeMonth') + ' – ' + monthLabel(m, lang)}
                        onClick={() => removeMonth(m)}
                      >
                        ✕
                      </button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {readOnly ? null : free.length === 0 ? (
        <p className="muted small">{t('p_monthFull')}</p>
      ) : (
        <div className="month-add">
          <select className="input" disabled={readOnly} value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t('p_month')}>
            <option value="">{t('p_month')}…</option>
            {free.map((m) => (
              <option key={m} value={m}>{monthLabel(m, lang)}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!pick}
            onClick={() => {
              if (!pick) return
              onChange({ ...(value || {}), [pick]: {} })
              setPick('')
            }}
          >
            + {t('p_addMonth')}
          </button>
        </div>
      )}
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
  const { t, data, readOnly, setProviderCourses, setProviderStatus, setSimVersions } = useStore()
  const [p, setP] = useState({
    ...provider,
    courses: provider.courses || [],
    locations: provider.locations || [],
    simVersions: provider.simVersions || []
  })
  // What the dialog opened with – so a stray tap on the backdrop can tell an
  // untouched record from one that has just been filled in.
  const opened = useRef(null)
  if (opened.current === null) {
    opened.current = JSON.stringify({
      ...provider,
      courses: provider.courses || [],
      locations: provider.locations || [],
      simVersions: provider.simVersions || []
    })
  }
  const dirty = !readOnly && JSON.stringify(p) !== opened.current
  // Which taxonomy list is being edited in-place ('courses' | 'sim' | 'status').
  const [manage, setManage] = useState(null)
  // From the helper, not re-derived: two copies of one rounding rule drift the
  // moment either side changes how a seat count is coerced.
  const slots = providerSlots(p, steps)
  // Memoised on the two settings, not rebuilt per render: a fresh array would
  // make the month picker rebuild on every keystroke in any field of the dialog.
  const months = useMemo(
    () => capacityRange(data.capacityFrom, data.capacityTo),
    [data.capacityFrom, data.capacityTo]
  )
  // Checked against the provider's OWN months, so a month that fell out of the
  // window still counts – it is still stored and still shown.
  const plan = providerPlanCheck(p, steps, Object.keys(p.slotsByMonth || {}))
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
  // xwide, not wide: the month table is Monat + one column per course type +
  // sum + delete, and the card breakpoint is on the VIEWPORT, not on the dialog.
  // A 720px dialog on a desktop therefore keeps the real table and simply hides
  // the right of it – the course-date dialog lost its delete button to exactly
  // that, at every window size, for two releases.
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
      confirmClose={dirty}
      xwide
      footer={
        <div className="foot-row">
          {!readOnly && !isNew && <button className="btn btn-danger" onClick={() => onDelete(p.id)}>{t('delete')}</button>}
          <div className="push-right">
            <button className="btn btn-ghost" onClick={onClose}>{readOnly ? t('close') : t('cancel')}</button>
            {!readOnly && (
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
            )}
          </div>
        </div>
      }
    >
      <div className="form-grid">
        <Field label={t('p_name')} span2>
          <input className="input" value={p.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label={t('p_courses')} span2 extra={<ManageLink onClick={() => setManage('courses')} title={t('manageCourses')} />}>
          <div className="checks" role="group" aria-label={t('p_courses')}>
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
            label={t('p_simVersion')}
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
          <select className="input" aria-label={t('p_status')} value={p.status} onChange={(e) => set('status', e.target.value)}>
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
            {slots.split > 0 && ' ' + t('p_slotsSum').replace('{n}', String(slots.split))}
          </p>
          {slots.splitOver && (
            <p className="warn-text small">
              {t('p_slotsOver').replace('{n}', String(slots.split)).replace('{m}', String(Math.round(Number(p.slots) || 0)))}
            </p>
          )}
        </Field>
        <Field label={t('p_timeline')} span2>
          <p className="stat-hint">{t('p_timelineHint')}</p>
          <MonthPlan
            value={p.slotsByMonth || {}}
            steps={steps}
            months={months}
            onChange={(v) => set('slotsByMonth', v)}
          />
          {plan.overSteps.map((s) => (
            <p className="warn-text small" key={s.id}>
              {t('p_planOverStep')
                .replace('{s}', s.label)
                .replace('{n}', String(plan.planned[s.id]))
                .replace('{m}', String(slots.byStep[s.id]))}
            </p>
          ))}
          {plan.overTotal && (
            <p className="warn-text small">
              {t('p_planOverTotal')
                .replace('{n}', String(plan.plannedTotal))
                .replace('{m}', String(plan.typedTotal))}
            </p>
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
