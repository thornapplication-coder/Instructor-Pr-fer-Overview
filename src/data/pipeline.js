// Milestone pipeline for the A320 -> 737 MAX instructor/examiner conversion.
// Fully user-editable: rename / recolor / add / delete / reorder (Umschulung tab).
// Each stage: { id, label, color }. `label` is language-neutral (user-defined).
export const DEFAULT_STAGES = [
  { id: 'nominated',    label: 'Nominierung',       color: '#871C54' },
  { id: 'groundschool', label: 'TR-Theorie',        color: '#AF1E65' },
  { id: 'simulator',    label: 'SIM / Type Rating', color: '#D41370' },
  { id: 'baselifus',    label: 'Base / LIFUS',      color: '#00A6CF' },
  { id: 'linecheck',    label: 'Linecheck',         color: '#6BCCE0' },
  { id: 'released',     label: '737 freigegeben',   color: '#2FA36B' }
]

export function stageLabel(stage) {
  if (!stage) return ''
  return stage.label ?? stage.de ?? stage.id
}

export const CONV_STATUS = {
  on_track: { de: 'im Plan',    en: 'on track', color: '#2FA36B' },
  at_risk:  { de: 'gefährdet',  en: 'at risk',  color: '#E8A33D' },
  blocked:  { de: 'blockiert',  en: 'blocked',  color: '#C8102E' },
  done:     { de: 'erledigt',   en: 'done',     color: '#787878' }
}

// Steps that are performed at an external provider / a location. Each trainer
// can be assigned a provider + location + date + status per step. This drives
// the "Planung" monitoring (deciding where each person does each step).
// Planning columns. User-editable (rename / recolor / add / delete / reorder).
// `providerType` (optional) filters which providers appear for that column.
export const ASSIGNMENT_STEPS = [
  { id: 'tr',    label: 'Type Rating',      color: '#D41370', providerType: 'TR' },
  { id: 'tri',   label: 'TRI-Kurs',         color: '#AF1E65', providerType: 'TRI' },
  { id: 'lifus', label: 'LIFUS',            color: '#00A6CF', providerType: null },
  { id: 'tre',   label: 'Examiner-Prüfung', color: '#871C54', providerType: 'TRE' }
]

export const ASSIGNMENT_STATUS = {
  open:    { de: 'offen',      en: 'open',       color: '#B0B4B8' },
  planned: { de: 'geplant',    en: 'planned',    color: '#E8A33D' },
  booked:  { de: 'gebucht',    en: 'booked',     color: '#00A6CF' },
  done:    { de: 'absolviert', en: 'completed',  color: '#2FA36B' },
  na:      { de: 'n/a',        en: 'n/a',        color: '#787878' }
}

export const STAFF_TYPE = {
  internal: { de: 'intern', en: 'internal', color: '#00A6CF' },
  external: { de: 'extern', en: 'external', color: '#E8A33D' }
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
