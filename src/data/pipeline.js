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
