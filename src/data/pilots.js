// "Other pilots": company line pilots who are NOT trainers/examiners, tracked
// only for their relationship to the B737. Deliberately a separate collection
// from `trainers`, so they never leak into the trainer KPIs or the conversion.

// B737 standing. `valid`/`expired` describe a type rating, `experience` covers
// pilots who flew Boeing before but hold no current rating.
export const PILOT_STATUS = {
  valid: { de: 'B737 gültig', en: 'B737 valid', color: '#2FA36B' },
  expired: { de: 'B737 abgelaufen', en: 'B737 expired', color: '#C8102E' },
  experience: { de: 'Boeing-Erfahrung', en: 'Boeing experience', color: '#E8A33D' }
}

export const PILOT_STATUS_IDS = ['valid', 'expired', 'experience']

export function pilotStatusLabel(status, lang) {
  const s = PILOT_STATUS[status]
  if (!s) return status || ''
  return lang === 'de' ? s.de : s.en
}

export function pilotStatusColor(status) {
  return (PILOT_STATUS[status] || {}).color || '#787878'
}

// Cockpit position, same vocabulary as the trainers' `role`.
export function pilotRole(p) {
  return p && p.role === 'fo' ? 'fo' : 'captain'
}

// A rating marked valid whose date already passed is really expired – surface
// that instead of silently trusting the stored flag.
export function isRatingOverdue(pilot, today) {
  if (!pilot || pilot.status !== 'valid' || !pilot.b737Until) return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(pilot.b737Until))
  if (!m) return false
  const due = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const now = today || new Date()
  return due < new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function emptyPilot(id) {
  return {
    id,
    name: '',
    tlc: '',
    base: '',
    role: 'captain',
    status: 'valid',
    b737Until: '', // valid until / expired on (ISO yyyy-mm-dd)
    remark: ''
  }
}

// Fill gaps on stored / imported records so the table never sees undefined.
export function withPilotDefaults(p) {
  return {
    ...emptyPilot(p && p.id ? p.id : 'plt-' + Math.random().toString(36).slice(2, 9)),
    ...p,
    role: pilotRole(p),
    status: PILOT_STATUS[p && p.status] ? p.status : 'valid'
  }
}
