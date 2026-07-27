import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import DateInput from '../components/DateInput.jsx'
import Modal from '../components/Modal.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import { useSort, Th } from '../components/sortable.jsx'
import CourseCalendar from '../components/CourseCalendar.jsx'
import CourseRunManager from '../components/CourseRunManager.jsx'
import { providersForStep } from '../lib/providerMatch.js'
import { conflictsFor, findRun, resolveAssignment, runsForStep, spanDays, spanText } from '../lib/courses.js'
import { formatDate } from '../lib/format.js'
import { ASSIGNMENT_STATUS, STAFF_TYPE } from '../data/pipeline.js'
import { useThemed } from '../lib/useThemed.js'
import { qualLabel } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'


function targetLabel(providers, resolved) {
  const p = providers.find((x) => x.id === resolved.providerId)
  if (p && p.name) return p.name
  if (resolved.location) return resolved.location
  return null
}

// What a cell shows: "n/a" when marked so, else provider/location – taken from
// the chosen course date when there is one, so a cell never looks empty just
// because the provider is recorded on the course rather than on the person.
function cellLabel(providers, runs, a) {
  if (!a) return null
  if (a.status === 'na') return 'n/a'
  return targetLabel(providers, resolveAssignment(a, findRun(runs, a.courseId)))
}

export default function Planning({ view: viewProp, embedded }) {
  const tint = useThemed()
  const { data, t, lang, setAssignmentSteps } = useStore()
  const { trainers, providers, assignmentSteps, quals, courseRuns } = data
  const [q, setQ] = useState('')
  const [fBase, setFBase] = useState('')
  const [fStaff, setFStaff] = useState('')
  const [fOre, setFOre] = useState('')
  const [fAircraft, setFAircraft] = useState('')
  const [editing, setEditing] = useState(null)
  const [manageSteps, setManageSteps] = useState(false)
  const [manageCourses, setManageCourses] = useState(false)
  // Controlled from the hub when it is embedded there; standalone it keeps its
  // own two-way switch, so the component still works on its own.
  const [ownView, setView] = useState('table') // 'table' | 'calendar'
  const view = viewProp || ownView

  const bases = useMemo(() => [...new Set(trainers.map((x) => x.base).filter(Boolean))].sort(), [trainers])
  const anyFilter = !!(q.trim() || fBase || fStaff || fOre || fAircraft)
  const resetFilters = () => { setQ(''); setFBase(''); setFStaff(''); setFOre(''); setFAircraft('') }

  // The Planung grid always covers EVERY trainer (new ones included); only the
  // explicit filters above can narrow it, and the counter makes that visible.
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return trainers
      .filter((x) => (fBase ? x.base === fBase : true))
      .filter((x) => (fStaff ? (x.staffType || 'internal') === fStaff : true))
      .filter((x) => (fOre ? x.ore === fOre : true))
      .filter((x) => (fAircraft ? x.aircraft === fAircraft : true))
      .filter((x) => (n ? [x.name, x.tlc, x.base, qualLabel(quals, x.qual), x.aircraft].join(' ').toLowerCase().includes(n) : true))
  }, [trainers, q, fBase, fStaff, fOre, fAircraft, quals])

  const accessors = useMemo(() => {
    const a = {
      name: (x) => x.name,
      staff: (x) => t('staff_' + (x.staffType || 'internal'))
    }
    for (const s of assignmentSteps) {
      a['step_' + s.id] = (x) => cellLabel(providers, courseRuns, x.assignments?.[s.id]) || ''
    }
    return a
  }, [assignmentSteps, providers, courseRuns, t])
  const { sorted, sortKey, dir, toggle } = useSort(rows, accessors, 'name')
  const sp = { sortKey, dir, onSort: toggle }

  return (
    <div className="tab-pane">
      <div className="toolbar no-print">
        {!embedded && <h2 className="pane-title">{t('planning_title')}</h2>}
        <input className="input search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={fBase} onChange={(e) => setFBase(e.target.value)}>
          <option value="">{t('filterBase')}: {t('all')}</option>
          {bases.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={fStaff} onChange={(e) => setFStaff(e.target.value)}>
          <option value="">{t('filterStaff')}: {t('all')}</option>
          <option value="external">{t('staff_external')}</option>
          <option value="internal">{t('staff_internal')}</option>
        </select>
        <select className="input" value={fAircraft} onChange={(e) => setFAircraft(e.target.value)}>
          <option value="">{t('filterAircraft')}: {t('all')}</option>
          {[...AIRCRAFT].sort().map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="input" value={fOre} onChange={(e) => setFOre(e.target.value)}>
          <option value="">{t('filterOre')}: {t('all')}</option>
          {['A', 'B', 'C'].map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="count-pill">{rows.length} / {trainers.length} {t('showing')}</span>
        {anyFilter && (
          <button className="btn btn-ghost" onClick={resetFilters}>↺ {t('resetFilters')}</button>
        )}
        <span className="push-right" />
        {!viewProp && (
          <div className="seg-toggle" role="group" aria-label={t('planning_view')}>
            <button
              className={'seg-btn' + (view === 'table' ? ' active' : '')}
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
            >
              {t('planning_viewTable')}
            </button>
            <button
              className={'seg-btn' + (view === 'calendar' ? ' active' : '')}
              aria-pressed={view === 'calendar'}
              onClick={() => setView('calendar')}
            >
              {t('planning_viewCalendar')}
            </button>
          </div>
        )}
        <button className="btn btn-ghost" onClick={() => setManageCourses(true)}>
          🗓 {t('manageCourseDates')}
        </button>
        <button className="btn btn-ghost" onClick={() => setManageSteps(true)}>
          ⚙ {t('manageSteps')}
        </button>
      </div>

      <p className="planning-note">
        {t('planning_hint')}
        {providers.length === 0 && <> · {t('planning_noProviders')}</>}
      </p>

      {view === 'calendar' && (
        <CourseCalendar trainers={sorted} steps={assignmentSteps} providers={providers} runs={courseRuns} />
      )}

      {view === 'table' && (
      <div className="table-wrap">
        <table className="data-table planning-table">
          <thead>
            <tr>
              <Th label={t('f_name')} k="name" {...sp} />
              <Th label={t('f_staffType')} k="staff" {...sp} />
              {assignmentSteps.map((s) => (
                <Th
                  key={s.id}
                  label={s.label}
                  k={'step_' + s.id}
                  sortKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  className="step-col"
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((x) => {
              const staff = STAFF_TYPE[x.staffType || 'internal']
              return (
                <tr key={x.id}>
                  <td className="strong nowrap">
                    <button className="link-btn" onClick={() => setEditing(x.id)}>{x.name}</button>
                    <div className="muted small">{x.base} · {qualLabel(quals, x.qual)}{x.aircraft ? ' · ' + x.aircraft : ''}</div>
                  </td>
                  <td>
                    <span className="staff-tag" style={{ '--tag': tint(staff.color) }}>
                      {t('staff_' + (x.staffType || 'internal'))}
                    </span>
                  </td>
                  {assignmentSteps.map((s) => {
                    const a = x.assignments?.[s.id]
                    const label = cellLabel(providers, courseRuns, a)
                    const st = ASSIGNMENT_STATUS[a?.status] || ASSIGNMENT_STATUS.open
                    const r = a ? resolveAssignment(a, findRun(courseRuns, a.courseId)) : null
                    const span = r ? spanText(r.from, r.to, lang) : ''
                    return (
                      <td key={s.id}>
                        {/* A booking onto a course date that has no provider yet
                            still IS a booking – judged on the label alone it read
                            as "+ zuweisen" and looked unassigned. */}
                        <button className="cell-assign" onClick={() => setEditing(x.id)}>
                          {label || span ? (
                            <>
                              <span className="assign-dot" style={{ background: tint(st.color) }} />
                              {label && <span className="assign-label">{label}</span>}
                              {span && <span className="assign-date">{span}</span>}
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
            {sorted.length === 0 && (
              <tr><td colSpan={2 + assignmentSteps.length} className="empty-row">{t('noTrainers')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {editing &&
        (() => {
          // `editing` holds only the trainer id; always render from live store
          // data and close the modal if the trainer no longer exists.
          const live = trainers.find((tr) => tr.id === editing)
          return live ? (
            <PlanningModal
              trainer={live}
              providers={providers}
              steps={assignmentSteps}
              runs={courseRuns}
              onClose={() => setEditing(null)}
            />
          ) : null
        })()}
      {manageCourses && (
        <Modal title={t('manageCourseDates')} onClose={() => setManageCourses(false)} wide
          footer={<div className="foot-row"><div className="push-right">
            <button className="btn btn-primary" onClick={() => setManageCourses(false)}>{t('close')}</button></div></div>}>
          <CourseRunManager steps={assignmentSteps} providers={providers} trainers={trainers} />
        </Modal>
      )}
      {manageSteps && (
        <Modal title={t('manageSteps')} onClose={() => setManageSteps(false)}
          footer={<div className="foot-row"><p className="muted small">{t('dragHint')}</p>
            <div className="push-right"><button className="btn btn-primary" onClick={() => setManageSteps(false)}>{t('close')}</button></div></div>}>
          <CategoryManager items={assignmentSteps} onChange={setAssignmentSteps} />
        </Modal>
      )}
    </div>
  )
}

// One line in the course-date dropdown: period first, because that is what is
// being chosen; the provider only tells the periods apart.
function runOption(run, providers, lang) {
  const where = targetLabel(providers, { providerId: run.providerId, location: run.location })
  const span = spanText(run.from, run.to, lang)
  return [span || '(?)', where].filter(Boolean).join(' · ')
}

function PlanningModal({ trainer, providers, steps, runs, onClose }) {
  // Its own themed resolver: this is a sibling of Planning(), not a nested
  // function, so the `tint` defined there is simply not in scope here. Reading
  // it threw on the first render of the dialog and blanked the whole app.
  const tint = useThemed()
  const { data, t, lang, setAssignment, upsertTrainer } = useStore()
  const setStep = (stepId, changes) => setAssignment(trainer.id, stepId, changes)
  const clashes = conflictsFor(trainer, steps, runs)
  const setStaff = (v) => upsertTrainer({ ...trainer, staffType: v })
  const courseDefs = data.providerCourses

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

      {/* The one thing the grid cannot show: two booked periods that run into
          each other. A warning, not a block – a course really can be left early
          to join the next one, and the planner is the one who knows. */}
      {clashes.length > 0 && (
        <p className="warn-text small" style={{ marginBottom: 12 }}>
          ⚠ {t('course_clash')}{' '}
          {clashes.map(([a, b]) => a.step.label + ' ↔ ' + b.step.label).join(' · ')}
        </p>
      )}

      <div className="assign-editor">
        {steps.map((s) => {
          const a = trainer.assignments?.[s.id] || {}
          const stepOpts = providersForStep(providers, s, courseDefs)
          // Inject the currently-assigned provider even if it no longer matches
          // the step's course keywords, so the controlled select never shows blank
          // while the grid cell still displays that provider's name.
          const assigned = a.providerId && providers.find((p) => p.id === a.providerId)
          const opts =
            assigned && !stepOpts.some((p) => p.id === assigned.id) ? [...stepOpts, assigned] : stepOpts
          const stepRuns = runsForStep(runs, s.id)
          const run = findRun(runs, a.courseId)
          const eff = resolveAssignment(a, run)
          return (
            <div className="assign-block" key={s.id} style={{ borderLeft: `4px solid ${tint(s.color)}` }}>
              <div className="assign-block-title">{s.label}</div>
              <div className="assign-grid">
                <label className="field span2">
                  <span className="field-label">{t('courseDate')}</span>
                  {/* Choosing a course clears the person's own provider and
                      location: resolveAssignment gives those priority, so a
                      leftover value from before would keep winning with no
                      control left in the dialog to remove it. */}
                  <select
                    className="input"
                    value={a.courseId || ''}
                    onChange={(e) =>
                      setStep(s.id, e.target.value ? { courseId: e.target.value, providerId: '', location: '' } : { courseId: '' })
                    }
                  >
                    <option value="">{t('course_own')}</option>
                    {stepRuns.map((r) => (
                      <option key={r.id} value={r.id}>{runOption(r, providers, lang)}</option>
                    ))}
                  </select>
                </label>

                {/* With a course chosen, provider, location and period belong to
                    THAT course – repeating them per person is how the same
                    course came to have three different end dates. Only the
                    person's own deviation stays editable. */}
                {run ? (
                  <>
                    <div className="field span2">
                      <span className="field-label">{t('course_scheduled')}</span>
                      <p className="assign-run">
                        {[targetLabel(providers, { providerId: run.providerId, location: run.location }), spanText(run.from, run.to, lang)]
                          .filter(Boolean)
                          .join(' · ') || '–'}
                        {spanDays(run.from, run.to) != null && (
                          <span className="muted"> · {spanDays(run.from, run.to)} {t('course_daysShort')}</span>
                        )}
                      </p>
                    </div>
                    <label className="field">
                      <span className="field-label">{t('course_ownFrom')}</span>
                      <DateInput value={a.date || ''} onChange={(v) => setStep(s.id, { date: v })} />
                    </label>
                    <label className="field">
                      <span className="field-label">{t('course_ownTo')}</span>
                      <DateInput value={a.end || ''} onChange={(v) => setStep(s.id, { end: v })} />
                    </label>
                    {eff.overridden && <p className="field span2 warn-text small">{t('course_overridden')}</p>}
                  </>
                ) : (
                  <>
                    <label className="field">
                      <span className="field-label">{t('provider')}</span>
                      <select className="input" value={a.providerId || ''} onChange={(e) => setStep(s.id, { providerId: e.target.value })}>
                        <option value="">{t('noProvider')}</option>
                        {[...opts].sort((x, y) => (x.name || '').localeCompare(y.name || '')).map((p) => (<option key={p.id} value={p.id}>{p.name || '(?)'}</option>))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">{t('location')}</span>
                      <input className="input" value={a.location || ''} onChange={(e) => setStep(s.id, { location: e.target.value })} />
                    </label>
                    <label className="field">
                      <span className="field-label">{t('course_from')}</span>
                      <DateInput value={a.date || ''} onChange={(v) => setStep(s.id, { date: v })} />
                    </label>
                    <label className="field">
                      <span className="field-label">{t('course_to')}</span>
                      <DateInput value={a.end || ''} onChange={(v) => setStep(s.id, { end: v })} />
                    </label>
                  </>
                )}

                <label className="field">
                  <span className="field-label">{t('status')}</span>
                  {/* empty choice = back to default "open" so stored value and UI never diverge */}
                  <select className="input" value={a.status || 'open'} onChange={(e) => setStep(s.id, { status: e.target.value || 'open' })}>
                    <option value=""></option>
                    {Object.entries(ASSIGNMENT_STATUS)
                      .sort((x, y) => (lang === 'de' ? x[1].de : x[1].en).localeCompare(lang === 'de' ? y[1].de : y[1].en))
                      .map(([k, v]) => (
                        <option key={k} value={k}>{lang === 'de' ? v.de : v.en}</option>
                      ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">{t('note')}</span>
                  <input className="input" value={a.note || ''} onChange={(e) => setStep(s.id, { note: e.target.value })} />
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
