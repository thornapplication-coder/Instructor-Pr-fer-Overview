import React, { useMemo } from 'react'
import { useStore } from '../lib/store.jsx'
import DateInput from './DateInput.jsx'
import { emptyCourseRun, isOverbooked, seatUsage, spanDays } from '../lib/courses.js'
import { providersForStep } from '../lib/providerMatch.js'

// Editor for the course dates: one row per scheduled run of a course type.
// Deliberately a flat table rather than a dialog per course – the whole point
// is to see the year's courses next to each other and spot the gaps.
//
// Nothing here blocks an entry. Seats are a warning, an end before its start is
// a warning; an editor that refuses input just gets worked around in a note.
export default function CourseRunManager({ steps, providers, trainers }) {
  const { data, t, newId, upsertCourseRun, deleteCourseRun, readOnly } = useStore()

  // Undated courses last, so a half-typed row does not jump around while the
  // date is still being entered.
  const runs = useMemo(
    () =>
      [...(data.courseRuns || [])].sort((a, b) => {
        if (!a.from && !b.from) return 0
        if (!a.from) return 1
        if (!b.from) return -1
        return a.from.localeCompare(b.from)
      }),
    [data.courseRuns]
  )
  const used = useMemo(() => seatUsage(trainers, steps), [trainers, steps])

  const set = (run, changes) => upsertCourseRun({ ...run, ...changes })
  const add = () => upsertCourseRun({ ...emptyCourseRun(newId('crs')), stepId: steps[0]?.id || '' })
  // A course with people on it is not a one-click delete: they all lose their
  // period at once, and re-adding it mints a new id they are not attached to.
  const remove = (run) => {
    const n = used.get(run.id) || 0
    if (n > 0 && !window.confirm(t('course_deleteConfirm').replace('{n}', String(n)))) return
    deleteCourseRun(run.id)
  }

  return (
    <div className="course-man">
      <p className="planning-note">{t('course_hint')}</p>
      <div className="table-wrap">
        <table className="data-table compact card-at-900 course-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th>{t('course_type')}</th>
              <th>{t('provider')}</th>
              <th>{t('location')}</th>
              <th>{t('course_from')}</th>
              <th>{t('course_to')}</th>
              <th className="num">{t('course_days')}</th>
              <th className="num">{t('course_seats')}</th>
              <th className="num">{t('course_booked')}</th>
              <th />
            </tr>
          </thead>
          <tbody role="rowgroup">
            {runs.map((r) => {
              const n = used.get(r.id) || 0
              const days = spanDays(r.from, r.to)
              const over = isOverbooked(r, n)
              return (
                <tr role="row" key={r.id}>
                  {/* Named cells for the card layout in a phone-width
                      dialog. This one is an editor, so the card is a small
                      stacked form rather than a read-out. */}
                  <td role="cell" className="cr-type" data-label={t('course_type')}>
                    <select className="input" disabled={readOnly} value={r.stepId} onChange={(e) => set(r, { stepId: e.target.value })}>
                      <option value="">–</option>
                      {steps.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                  <td role="cell" className="cr-prov" data-label={t('provider')}>
                    <select className="input" disabled={readOnly} value={r.providerId} onChange={(e) => set(r, { providerId: e.target.value })}>
                      <option value="">{t('noProvider')}</option>
                      {/* Same filter the assign dialog uses: a course of type
                          "Examiner-Prüfung" offering a TR-only provider would
                          bypass it for everybody booked onto that course. */}
                      {[...providersForStep(providers, steps.find((s) => s.id === r.stepId) || {}, data.providerCourses)]
                        .sort((x, y) => (x.name || '').localeCompare(y.name || ''))
                        .map((p) => <option key={p.id} value={p.id}>{p.name || '(?)'}</option>)}
                    </select>
                  </td>
                  <td role="cell" className="cr-loc" data-label={t('location')}>
                    <input className="input" disabled={readOnly} value={r.location || ''} onChange={(e) => set(r, { location: e.target.value })} />
                  </td>
                  <td role="cell" className="cr-from" data-label={t('course_from')}><DateInput disabled={readOnly} value={r.from || ''} onChange={(v) => set(r, { from: v })} /></td>
                  <td role="cell" className="cr-to" data-label={t('course_to')}><DateInput disabled={readOnly} value={r.to || ''} onChange={(v) => set(r, { to: v })} /></td>
                  <td role="cell" className="cr-days num" data-label={t('course_days')}>
                    {days == null
                      ? <span className={'muted' + (r.from && r.to ? ' warn-text' : '')}>{r.from && r.to ? t('course_badSpan') : '–'}</span>
                      : days}
                  </td>
                  <td role="cell" className="cr-seats num" data-label={t('course_seats')}>
                    <input
                      disabled={readOnly}
                      className="input seat-input"
                      type="number"
                      min="0"
                      value={r.seats || ''}
                      placeholder="–"
                      onChange={(e) => set(r, { seats: e.target.value === '' ? 0 : Number(e.target.value) })}
                      aria-label={t('course_seats')}
                    />
                  </td>
                  <td role="cell" className="cr-booked num" data-label={t('course_booked')}>
                    <span className={'seat-count' + (over ? ' over' : '')} title={over ? t('course_overbooked') : ''}>
                      {n}
                    </span>
                  </td>
                  <td role="cell" className="cr-del num">
                    {!readOnly && <button className="mini-btn danger" onClick={() => remove(r)} title={t('delete')}>✕</button>}
                  </td>
                </tr>
              )
            })}
            {runs.length === 0 && <tr role="row"><td role="cell" colSpan={9} className="empty-row">{t('course_none')}</td></tr>}
          </tbody>
        </table>
      </div>
      {!readOnly && <button className="btn btn-ghost" onClick={add}>+ {t('course_add')}</button>}
    </div>
  )
}
