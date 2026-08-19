import { AIRCRAFT } from './aircraft.js'
import { ASSIGNMENT_STATUS, CONV_STATUS, STAFF_TYPE } from './pipeline.js'
import { ORE_COLORS, AC_COLORS, STATUS } from '../lib/palette.js'

// The pick lists behind the dropdowns, as data rather than as constants.
//
// The rule that makes this safe: an id is the value STORED on a record and the
// value the code branches on ("done" excludes an assignment from the demand
// count, "na" takes no seat); a label is what the reader sees. Labels and
// colours are therefore always the user's to change, and only lists whose ids
// mean nothing to the code can gain or lose entries.
//
// That is the whole distinction `locked` carries. It is not a way of being
// precious about the data: adding a fifth assignment status would create a
// value no branch in the app knows what to do with, and it would silently
// behave like "open" everywhere.

const de = (o) => o.de
const en = (o) => o.en

function fromMap(map, ids, lang) {
  return (ids || Object.keys(map)).map((id) => ({
    id,
    label: (lang === 'en' ? en : de)(map[id]),
    color: map[id].color
  }))
}

export function defaultAircraftTypes() {
  return AIRCRAFT.map((id) => ({ id, label: id, color: AC_COLORS[id] || STATUS.neutral }))
}

// A, B, C – an ordinal priority, so the ramp runs dark (most urgent) to light.
export function defaultOreTiers() {
  return ['A', 'B', 'C'].map((id) => ({ id, label: id, color: ORE_COLORS[id] }))
}

export function defaultConvStatus(lang) {
  return fromMap(CONV_STATUS, null, lang)
}
export function defaultAssignStatus(lang) {
  return fromMap(ASSIGNMENT_STATUS, null, lang)
}
// Bases. Seeded from the roster so the dropdown is useful on day one; the list
// is the user's from then on (a station opens, a station closes). No colour:
// a base is a place, not a category anything is drawn by.
export function defaultBases() {
  return ['ARN', 'PMI', 'PRG', 'SZG', 'VIE', 'WP BCN', 'WP PMI', 'WP PRG', 'WP WAW']
    .map((id) => ({ id, label: id }))
}

// The Boeing types a line pilot can be rated on.
export function defaultPilotTypes() {
  return ['737', '747', '757', '757/767', '777', '777/787'].map((id) => ({ id, label: id }))
}

export function defaultStaffTypes(lang) {
  return fromMap(STAFF_TYPE, ['internal', 'external'], lang)
}

// Which company an EXTERNAL trainer belongs to. Free to grow: unlike the staff
// types themselves, no branch in the app reads these ids - they are a label on
// a person, so the list is the user's.
export function defaultExtCompanies() {
  return ['TUI', 'SunExpress', 'Others'].map((id) => ({ id, label: id }))
}

// Every list the settings page offers, in the order it shows them.
// `key`      – where it lives in the store (and in MERGE_LISTS)
// `locked`   – ids drive behaviour: rename and recolour only
// `hasColor` – some lists are plain text (provider courses, SIM versions)
export const EDITABLE_LISTS = [
  { key: 'quals', labelKey: 'list_quals', hint: 'list_qualsHint' },
  { key: 'stages', labelKey: 'list_stages', hint: 'list_stagesHint' },
  { key: 'assignmentSteps', labelKey: 'list_steps', hint: 'list_stepsHint' },
  { key: 'aircraftTypes', labelKey: 'list_aircraft', hint: 'list_aircraftHint' },
  { key: 'oreTiers', labelKey: 'list_ore', hint: 'list_oreHint' },
  { key: 'bases', labelKey: 'list_bases', hint: 'list_basesHint', hasColor: false },
  { key: 'pilotTypes', labelKey: 'list_pilotTypes', hint: 'list_pilotTypesHint', hasColor: false },
  { key: 'providerCourses', labelKey: 'list_providerCourses', hasColor: false },
  { key: 'providerStatus', labelKey: 'list_providerStatus' },
  { key: 'simVersions', labelKey: 'list_simVersions', hasColor: false },
  { key: 'convStatus', labelKey: 'list_convStatus', locked: true },
  { key: 'assignStatus', labelKey: 'list_assignStatus', locked: true },
  { key: 'staffTypes', labelKey: 'list_staffTypes', locked: true },
  { key: 'extCompanies', labelKey: 'list_extCompanies', hint: 'list_extCompaniesHint', hasColor: false }
]

// Look-ups used wherever a stored id has to become something a reader sees.
// Falling back to the raw id rather than to an empty string: a value whose
// entry was deleted should still be visible, not vanish from the row.
export function itemOf(list, id) {
  return (Array.isArray(list) ? list : []).find((x) => x && x.id === id) || null
}
export function labelOf(list, id, fallback) {
  const it = itemOf(list, id)
  return it && it.label ? it.label : fallback !== undefined ? fallback : id || ''
}
export function colorOf(list, id, fallback) {
  const it = itemOf(list, id)
  return (it && it.color) || fallback || STATUS.neutral
}
export function idsOf(list) {
  return (Array.isArray(list) ? list : []).map((x) => x && x.id).filter(Boolean)
}
