import { CATEGORICAL, STAGE_RAMP, STATUS } from '../lib/palette.js'

// Milestone pipeline for the A320 -> 737 MAX instructor/examiner conversion.
// Fully user-editable: rename / recolor / add / delete / reorder (Umschulung tab).
// Each stage: { id, label, color }. `label` is language-neutral (user-defined).
//
// The colours are ONE hue getting darker, not six different hues: the stages are
// a progression, so the reader should be able to see how far along a column is
// without reading its name. Six unrelated hues also put "SIM / Type Rating"
// (#D41370) next to "TR-Theorie" (#AF1E65) at ΔE 7.5 – near-identical.
export const DEFAULT_STAGES = [
  { id: 'nominated',    label: 'Nominierung',       color: STAGE_RAMP[0] },
  { id: 'groundschool', label: 'TR-Theorie',        color: STAGE_RAMP[1] },
  { id: 'simulator',    label: 'SIM / Type Rating', color: STAGE_RAMP[2] },
  { id: 'baselifus',    label: 'Base / LIFUS',      color: STAGE_RAMP[3] },
  { id: 'linecheck',    label: 'Linecheck',         color: STAGE_RAMP[4] },
  { id: 'released',     label: '737 freigegeben',   color: STAGE_RAMP[5] }
]

export function stageLabel(stage) {
  if (!stage) return ''
  return stage.label ?? stage.de ?? stage.id
}

// Real status: reserved colours, never reused for identity.
export const CONV_STATUS = {
  on_track: { de: 'im Plan',    en: 'on track', color: STATUS.good },
  at_risk:  { de: 'gefährdet',  en: 'at risk',  color: STATUS.warn },
  blocked:  { de: 'blockiert',  en: 'blocked',  color: STATUS.critical },
  done:     { de: 'erledigt',   en: 'done',     color: STATUS.neutral }
}

// Steps that are performed at an external provider / a location. Each trainer
// can be assigned a provider + location + date + status per step. This drives
// the "Planung" monitoring (deciding where each person does each step).
// Planning columns. User-editable (rename / recolor / add / delete / reorder).
// `providerType` (optional) filters which providers appear for that column.
// Planning columns are identities, not a progression -> categorical slots.
export const ASSIGNMENT_STEPS = [
  { id: 'tr',    label: 'Type Rating',      color: CATEGORICAL[0], providerType: 'TR' },
  { id: 'tri',   label: 'TRI-Kurs',         color: CATEGORICAL[1], providerType: 'TRI' },
  { id: 'lifus', label: 'LIFUS',            color: CATEGORICAL[2], providerType: null },
  { id: 'tre',   label: 'Examiner-Prüfung', color: CATEGORICAL[3], providerType: 'TRE' }
]

// How far a booking has got. "booked" is not a good/bad claim, so it wears the
// brand's sky rather than pretending to be a status step.
export const ASSIGNMENT_STATUS = {
  open:    { de: 'offen',      en: 'open',       color: STATUS.neutral },
  planned: { de: 'geplant',    en: 'planned',    color: STATUS.warn },
  booked:  { de: 'gebucht',    en: 'booked',     color: CATEGORICAL[1] },
  done:    { de: 'absolviert', en: 'completed',  color: STATUS.good },
  na:      { de: 'n/a',        en: 'n/a',        color: STATUS.neutral }
}

// intern/extern is an IDENTITY, not a state – "extern" is not a warning. It used
// to wear the at-risk amber, which is exactly the confusion this pass removes.
export const STAFF_TYPE = {
  internal: { de: 'intern', en: 'internal', color: CATEGORICAL[1] },
  external: { de: 'extern', en: 'external', color: CATEGORICAL[2] }
}

export function emptyAssignments() {
  const a = {}
  for (const s of ASSIGNMENT_STEPS) {
    a[s.id] = { providerId: '', location: '', date: '', status: 'open', note: '' }
  }
  return a
}

const EMPTY_STEP = { providerId: '', location: '', date: '', status: 'open', note: '' }

// Merge stored assignments onto the defaults WITHOUT dropping data stored under
// user-added custom step columns: iterate the union of the default step ids and
// whatever keys the stored object actually carries.
export function mergeAssignments(a) {
  const base = emptyAssignments()
  if (!a || typeof a !== 'object') return base
  const out = { ...base }
  for (const k of Object.keys(a)) {
    out[k] = { ...(base[k] || EMPTY_STEP), ...(a[k] || {}) }
  }
  return out
}

export function stageIndex(stages, id) {
  const i = stages.findIndex((s) => s.id === id)
  return i < 0 ? 0 : i
}

// Stage semantics are positional, NOT tied to the literal ids 'nominated' /
// 'released' (those stages are user-editable and can be renamed or deleted):
// the FIRST stage means "not started", the LAST stage means "released / done".
export function firstStageId(stages) {
  return (stages && stages.length && stages[0].id) || 'nominated'
}
export function releasedStageId(stages) {
  return (stages && stages.length && stages[stages.length - 1].id) || 'released'
}

// Progress 0..1 based on how far along the pipeline a trainer is.
export function conversionProgress(stages, conv) {
  if (!conv) return 0
  const idx = stageIndex(stages, conv.stage)
  if (conv.stage === releasedStageId(stages)) return 1
  return stages.length > 1 ? idx / (stages.length - 1) : 0
}
