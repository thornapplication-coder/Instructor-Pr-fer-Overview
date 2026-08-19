// Excel exports for the tabular pages, generated directly from the store data.
// Centralized here so the (single) Downloads section in Settings owns all
// downloads; the individual tabs no longer carry their own export controls.
import { downloadExcel } from './exports.js'
import { formatPartTime, formatFte } from './format.js'
import { stageLabel } from '../data/pipeline.js'
import { labelOf } from '../data/lists.js'
import { qualLabel, isOwnStaff } from '../data/qualifications.js'
import { courseLabel, simVersionLabel } from '../data/providers.js'
import { pilotRole, pilotValidity, ratingValid } from '../data/pilots.js'
import { formatDate } from './format.js'
import { findRun, resolveAssignment, seatUsage, spanDays, spanText } from './courses.js'
import { providerSlots } from './stats.js'
import { monthLabel } from './months.js'

const byName = (a, b) => (a.name || '').localeCompare(b.name || '')

// Trainer table + the "Trainer seit" dates (LTC/TRI/TRE) so a full report is
// self-contained. On screen those dates live only in the detail modal.
export function exportTrainersExcel(data, t, lang) {
  const { trainers, stages, quals } = data
  const rows = [...trainers].sort(byName)
  downloadExcel(
    'trainer',
    [
      { label: t('f_qual'), value: (x) => qualLabel(quals, x.qual) },
      { label: t('f_base'), value: (x) => x.base },
      { label: t('f_tlc'), value: (x) => x.tlc },
      { label: t('f_name'), value: (x) => x.name },
      { label: t('f_role'), value: (x) => t(x.role === 'fo' ? 'role_fo' : 'role_captain') },
      // Only where it exists. Seniority, ORE and the conversion phase are
      // places in our own list, scheme and pipeline; the screen leaves all
      // three blank for an external trainer, and a spreadsheet that disagreed
      // with the screen would be the one people trust.
      { label: t('f_seniority'), value: (x) => (isOwnStaff(x) && x.seniority ? formatDate(x.seniority, lang) : '') },
      {
        label: t('f_extCompany'),
        // Only where it means something: a company on an internal trainer would
        // read as a fact rather than as a leftover.
        value: (x) => (x.staffType === 'external' ? labelOf(data.extCompanies, x.extCompany, '') : '')
      },
      { label: t('f_partTime'), value: (x) => formatPartTime(x.partTime, lang) },
      { label: t('f_fte'), value: (x) => formatFte(x.fte) },
      { label: t('f_aircraft'), value: (x) => x.aircraft },
      { label: t('f_ore'), value: (x) => (isOwnStaff(x) ? x.ore : '') },
      { label: t('f_staffType'), value: (x) => t('staff_' + (x.staffType || 'internal')) },
      { label: t('f_authority'), value: (x) => x.authority },
      { label: t('f_ltc'), value: (x) => x.ltcDate },
      { label: t('f_tri'), value: (x) => x.triDate },
      { label: t('f_tre'), value: (x) => x.treDate },
      { label: t('f_conversion'), value: (x) => (isOwnStaff(x) ? stageLabel(stages.find((s) => s.id === x.conv?.stage)) : '') },
      // Free text last, matching the screen and the PDF.
      { label: t('f_remark'), value: (x) => x.remark },
      { label: t('f_note'), value: (x) => x.note || '' }
    ],
    rows,
    t('trainers_title'),
    lang
  )
}

export function exportPlanningExcel(data, t, lang) {
  const { trainers, providers, assignmentSteps, quals, courseRuns } = data
  const rows = [...trainers].sort(byName)
  // Resolved through the course date: a booking made that way carries no
  // provider of its own, so the raw field would export a column of blanks.
  const cellLabel = (a) => {
    if (!a) return ''
    if (a.status === 'na') return 'n/a'
    const r = resolveAssignment(a, findRun(courseRuns, a.courseId))
    const p = providers.find((x) => x.id === r.providerId)
    if (p && p.name) return p.name
    return r.location || ''
  }
  const spanLabel = (a) => {
    const r = resolveAssignment(a, findRun(courseRuns, a.courseId))
    return spanText(r.from, r.to, lang)
  }
  // An untouched cell (no provider/location, default 'open' status) exports as
  // empty – matching the on-screen "+ zuweisen" state – instead of " [offen]".
  const stepCell = (x, s) => {
    const a = x.assignments?.[s.id]
    if (!a) return ''
    // Falls back to the period: a course booking whose course has no provider
    // named yet exported as an empty cell and read as "nothing planned".
    const label = cellLabel(a)
    const span = spanLabel(a)
    if (!label && !span) return ''
    if (a.status === 'na') return label || 'n/a'
    const stLbl = a.status ? ` [${labelOf(data.assignStatus, a.status, a.status)}]` : ''
    return [label, span].filter(Boolean).join(' · ') + stLbl
  }
  downloadExcel(
    'planung',
    [
      { label: t('f_name'), value: (x) => x.name },
      { label: t('f_base'), value: (x) => x.base },
      { label: t('f_qual'), value: (x) => qualLabel(quals, x.qual) },
      { label: t('f_aircraft'), value: (x) => x.aircraft },
      { label: t('f_staffType'), value: (x) => t('staff_' + (x.staffType || 'internal')) },
      ...assignmentSteps.map((s) => ({ label: s.label, value: (x) => stepCell(x, s) }))
    ],
    rows,
    t('planning_title'),
    lang
  )
}

export function exportProvidersExcel(data, t, lang) {
  const { providers, providerStatus, providerCourses, simVersions } = data
  const rows = [...providers].sort(byName)
  const statusLabel = (id) => (providerStatus.find((s) => s.id === id) || {}).label || ''
  downloadExcel(
    'provider',
    [
      { label: t('p_name'), value: (p) => p.name },
      { label: t('p_courses'), value: (p) => [...(p.courses || [])].map((c) => courseLabel(providerCourses, c)).sort().join(', ') },
      { label: t('p_simVersion'), value: (p) => [...(p.simVersions || [])].map((s) => simVersionLabel(simVersions, s)).sort().join(', ') },
      { label: t('p_locations'), value: (p) => [...(p.locations || [])].sort().join(', ') },
      { label: t('p_contact'), value: (p) => p.contactPerson },
      { label: t('p_email'), value: (p) => p.email },
      { label: t('p_phone'), value: (p) => p.phone },
      { label: t('p_slots'), value: (p) => providerSlots(p, data.assignmentSteps).total || '' },
      {
        label: t('p_slotsByStep'),
        value: (p) =>
          data.assignmentSteps
            .filter((s2) => p.slotsByStep?.[s2.id])
            .map((s2) => s2.label + ': ' + p.slotsByStep[s2.id])
            .join(', ')
      },
      {
        // The plan, not just the total: "40 seats" and "30 of them in 2027" are
        // different facts, and the spreadsheet is where the second one gets
        // pasted into a mail to the provider. Chronological, and only the
        // months that hold something.
        label: t('p_timeline'),
        value: (p) =>
          Object.keys(p.slotsByMonth || {})
            .sort()
            .map((m) => {
              const cells = p.slotsByMonth[m] || {}
              const parts = data.assignmentSteps
                .filter((s2) => cells[s2.id])
                .map((s2) => s2.label + ' ' + cells[s2.id])
              return parts.length ? monthLabel(m, lang) + ': ' + parts.join(', ') : ''
            })
            .filter(Boolean)
            .join(' · ')
      },
      { label: t('p_status'), value: (p) => statusLabel(p.status) }
    ],
    rows,
    t('providers_title'),
    lang
  )
}

// Other pilots (company line pilots, not trainers).
// Course dates. Their own sheet rather than a column somewhere: a course is a
// record in its own right, with a period, a capacity and a booked count.
export function exportCourseDatesExcel(data, t, lang) {
  const { courseRuns, providers, assignmentSteps, trainers } = data
  const used = seatUsage(trainers, assignmentSteps)
  const rows = [...(courseRuns || [])].sort((a, b) => String(a.from).localeCompare(String(b.from)))
  const stepLabel = (id) => (assignmentSteps.find((x) => x.id === id) || {}).label || ''
  const providerName = (id) => (providers.find((x) => x.id === id) || {}).name || ''
  downloadExcel(
    'kurstermine',
    [
      { label: t('course_type'), value: (r) => stepLabel(r.stepId) },
      { label: t('provider'), value: (r) => providerName(r.providerId) },
      { label: t('location'), value: (r) => r.location || '' },
      { label: t('course_from'), value: (r) => (r.from ? formatDate(r.from, lang) : '') },
      { label: t('course_to'), value: (r) => (r.to ? formatDate(r.to, lang) : '') },
      { label: t('course_days'), value: (r) => spanDays(r.from, r.to) ?? '' },
      { label: t('course_seats'), value: (r) => r.seats || '' },
      { label: t('course_booked'), value: (r) => used.get(r.id) || 0 },
      { label: t('note'), value: (r) => r.note || '' }
    ],
    rows,
    t('manageCourseDates'),
    lang
  )
}

export function exportPilotsExcel(data, t, lang) {
  const { otherPilots } = data
  // One row per RATING, like the roster spreadsheet: a person with two types
  // gets two lines, and the continuation line repeats nothing but the rating.
  // "Gültig"/"Abgelaufen" are computed against today, never read from a field.
  const rows = []
  for (const p of [...otherPilots].sort(byName)) {
    const list = p.ratings && p.ratings.length ? p.ratings : [{ id: p.id + '-none', type: '', until: '' }]
    list.forEach((r, i) => rows.push({ p, r, first: i === 0 }))
  }
  downloadExcel(
    'other-pilots',
    [
      { label: t('f_base'), value: (x) => (x.first ? x.p.base || '' : '') },
      { label: t('f_tlc'), value: (x) => (x.first ? x.p.tlc || '' : '') },
      { label: t('f_name'), value: (x) => (x.first ? x.p.name || '' : '') },
      { label: t('f_position'), value: (x) => (x.first ? t('role_' + (pilotRole(x.p) === 'fo' ? 'fo' : 'captain')) : '') },
      { label: t('f_type'), value: (x) => x.r.type || '' },
      { label: t('f_validity'), value: (x) => (x.r.until ? formatDate(x.r.until, lang) : '') },
      { label: t('f_boeingExp'), value: (x) => (x.first && x.p.boeingExp ? 'x' : '') },
      { label: t('f_valid'), value: (x) => (ratingValid(x.r) === true ? 'x' : '') },
      { label: t('f_expired'), value: (x) => (ratingValid(x.r) === false ? 'x' : '') },
      { label: t('f_comment'), value: (x) => (x.first ? x.p.remark || '' : '') }
    ],
    rows,
    t('pilots_title'),
    lang
  )
}
