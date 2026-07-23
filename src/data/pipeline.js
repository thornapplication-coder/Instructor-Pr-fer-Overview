// Milestone pipeline for the A320 -> 737 MAX instructor/examiner conversion.
// These are DEFAULTS shipped with v1.0.0. They are stored in the working data set
// and can be renamed/extended by the user in Settings (kept simple & editable).
export const DEFAULT_STAGES = [
  { id: 'nominated',   de: 'Nominierung',        en: 'Nominated',        color: '#871C54' },
  { id: 'groundschool',de: 'TR-Theorie',         en: 'Groundschool',     color: '#AF1E65' },
  { id: 'simulator',   de: 'SIM / Type Rating',  en: 'SIM / Type Rating',color: '#D41370' },
  { id: 'baselifus',   de: 'Base / LIFUS',       en: 'Base / LIFUS',     color: '#00A6CF' },
  { id: 'linecheck',   de: 'Linecheck',          en: 'Line Check',       color: '#6BCCE0' },
  { id: 'released',    de: '737 freigegeben',    en: '737 Released',     color: '#2FA36B' }
]

export const CONV_STATUS = {
  on_track: { de: 'im Plan',    en: 'on track', color: '#2FA36B' },
  at_risk:  { de: 'gefährdet',  en: 'at risk',  color: '#E8A33D' },
  blocked:  { de: 'blockiert',  en: 'blocked',  color: '#C8102E' },
  done:     { de: 'erledigt',   en: 'done',     color: '#787878' }
}

// Steps that are performed at an external provider / a location. Each trainer
// can be assigned a provider + location + date + status per step. This drives
// the "Planung" monitoring (deciding where each person does each step).
export const ASSIGNMENT_STEPS = [
  { id: 'tr',    de: 'Type Rating',      en: 'Type Rating',    providerType: 'TR',  color: '#D41370' },
  { id: 'tri',   de: 'TRI-Kurs',         en: 'TRI Course',     providerType: 'TRI', color: '#AF1E65' },
  { id: 'lifus', de: 'LIFUS',            en: 'LIFUS',          providerType: null,  color: '#00A6CF' },
  { id: 'tre',   de: 'Examiner-Prüfung', en: 'Examiner Check', providerType: 'TRE', color: '#871C54' }
]

export const ASSIGNMENT_STATUS = {
  open:    { de: 'offen',      en: 'open',       color: '#B0B4B8' },
  planned: { de: 'geplant',    en: 'planned',    color: '#E8A33D' },
  booked:  { de: 'gebucht',    en: 'booked',     color: '#00A6CF' },
  done:    { de: 'absolviert', en: 'completed',  color: '#2FA36B' }
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

export function mergeAssignments(a) {
  const base = emptyAssignments()
  if (a && typeof a === 'object') {
    for (const k of Object.keys(base)) base[k] = { ...base[k], ...(a[k] || {}) }
  }
  return base
}

export function stageIndex(stages, id) {
  const i = stages.findIndex((s) => s.id === id)
  return i < 0 ? 0 : i
}

// Progress 0..1 based on how far along the pipeline a trainer is.
export function conversionProgress(stages, conv) {
  if (!conv) return 0
  const idx = stageIndex(stages, conv.stage)
  if (conv.stage === 'released') return 1
  return idx / (stages.length - 1)
}
