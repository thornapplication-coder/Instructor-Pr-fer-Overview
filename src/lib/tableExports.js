// Excel exports for the tabular pages, generated directly from the store data.
// Centralized here so the (single) Downloads section in Settings owns all
// downloads; the individual tabs no longer carry their own export controls.
import { downloadExcel } from './exports.js'
import { formatPartTime, formatFte } from './format.js'
import { stageLabel, ASSIGNMENT_STATUS } from '../data/pipeline.js'
import { qualLabel } from '../data/qualifications.js'
import { courseLabel, simVersionLabel } from '../data/providers.js'
import { pilotStatusLabel, pilotRole } from '../data/pilots.js'
import { formatDate } from './format.js'

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
      { label: t('f_remark'), value: (x) => x.remark },
      { label: t('f_partTime'), value: (x) => formatPartTime(x.partTime, lang) },
      { label: t('f_fte'), value: (x) => formatFte(x.fte) },
      { label: t('f_aircraft'), value: (x) => x.aircraft },
      { label: t('f_ore'), value: (x) => x.ore },
      { label: t('f_staffType'), value: (x) => t('staff_' + (x.staffType || 'internal')) },
      { label: t('f_authority'), value: (x) => x.authority },
      { label: t('f_ltc'), value: (x) => x.ltcDate },
      { label: t('f_tri'), value: (x) => x.triDate },
      { label: t('f_tre'), value: (x) => x.treDate },
      { label: t('f_conversion'), value: (x) => stageLabel(stages.find((s) => s.id === x.conv?.stage)) }
    ],
    rows,
    t('trainers_title'),
    lang
  )
}

export function exportPlanningExcel(data, t, lang) {
  const { trainers, providers, assignmentSteps, quals } = data
  const rows = [...trainers].sort(byName)
  const cellLabel = (a) => {
    if (!a) return ''
    if (a.status === 'na') return 'n/a'
    const p = providers.find((x) => x.id === a.providerId)
    if (p && p.name) return p.name
    return a.location || ''
  }
  // An untouched cell (no provider/location, default 'open' status) exports as
  // empty – matching the on-screen "+ zuweisen" state – instead of " [offen]".
  const stepCell = (x, s) => {
    const a = x.assignments?.[s.id]
    if (!a) return ''
    const label = cellLabel(a)
    if (!label) return ''
    if (a.status === 'na') return label
    const stDef = ASSIGNMENT_STATUS[a.status]
    const stLbl = stDef ? ` [${lang === 'de' ? stDef.de : stDef.en}]` : ''
    return label + stLbl
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
      { label: t('p_capacity'), value: (p) => p.capacity },
      { label: t('p_status'), value: (p) => statusLabel(p.status) }
    ],
    rows,
    t('providers_title'),
    lang
  )
}

// Other pilots (company line pilots, not trainers).
export function exportPilotsExcel(data, t, lang) {
  const rows = [...(data.otherPilots || [])].sort(byName)
  downloadExcel(
    'other-pilots',
    [
      { label: t('f_name'), value: (p) => p.name },
      { label: t('f_tlc'), value: (p) => p.tlc },
      { label: t('f_base'), value: (p) => p.base },
      { label: t('f_position'), value: (p) => t(pilotRole(p) === 'fo' ? 'role_fo' : 'role_captain') },
      { label: t('f_b737Status'), value: (p) => pilotStatusLabel(p.status, lang) },
      { label: t('f_b737Until'), value: (p) => (p.b737Until ? formatDate(p.b737Until, lang) : '') },
      { label: t('f_comment'), value: (p) => p.remark }
    ],
    rows,
    t('pilots_title'),
    lang
  )
}
