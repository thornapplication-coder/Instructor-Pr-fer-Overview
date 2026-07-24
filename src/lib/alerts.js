// Deadline / attention flags for the conversion monitoring.
// Pure functions over trainer data so they are easy to test and reuse.
import { stageLabel } from '../data/pipeline.js'

const SOON_DAYS = 30 // a target within this many days counts as "coming up"

export function parseISO(d) {
  if (!d) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d))
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

// Whole days from `from` to `target` (negative = in the past).
export function daysUntil(target, from) {
  return Math.round((target - from) / 86400000)
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Returns { level: 'overdue' | 'risk' | null, reasons: string[], days: number|null }
// - overdue (red): blocked, or a target date already in the past (not released)
// - risk (amber): at risk, or a target coming up within SOON_DAYS
// Retiring people and already-released people never raise a flag.
export function trainerAlerts(trainer, today) {
  const now = startOfDay(today || new Date())
  const empty = { level: null, reasons: [], days: null }
  if ((trainer.ore || '') === 'Rente') return empty
  const stage = trainer.conv?.stage || 'nominated'
  if (stage === 'released') return empty

  const status = trainer.conv?.status
  const target = parseISO(trainer.conv?.target)
  const days = target ? daysUntil(target, now) : null
  const reasons = []
  let level = null
  const raise = (lv) => {
    if (lv === 'overdue') level = 'overdue'
    else if (lv === 'risk' && level !== 'overdue') level = 'risk'
  }

  if (status === 'blocked') { raise('overdue'); reasons.push('blocked') }
  if (days != null && days < 0) { raise('overdue'); reasons.push('overdue') }
  if (status === 'at_risk') { raise('risk'); reasons.push('at_risk') }
  if (days != null && days >= 0 && days <= SOON_DAYS) { raise('risk'); reasons.push('soon') }

  return { level, reasons, days }
}

// All flagged trainers, most urgent first (overdue before risk, earliest date first).
export function collectAlerts(trainers, today) {
  const rank = { overdue: 0, risk: 1 }
  return trainers
    .map((t) => ({ trainer: t, ...trainerAlerts(t, today) }))
    .filter((a) => a.level)
    .sort((a, b) => {
      if (rank[a.level] !== rank[b.level]) return rank[a.level] - rank[b.level]
      return (a.days ?? 99999) - (b.days ?? 99999)
    })
}

export function stageName(stages, id) {
  return stageLabel(stages.find((s) => s.id === id)) || ''
}

// Conversion target dates grouped by calendar month (YYYY-MM), ascending.
// Released trainers and those without a target date are skipped. Each entry
// carries its alert flag so the timeline can colour it.
export function targetsByMonth(trainers, today) {
  const map = new Map()
  for (const t of trainers) {
    const stage = t.conv?.stage || 'nominated'
    if (stage === 'released') continue
    const d = parseISO(t.conv?.target)
    if (!d) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push({ trainer: t, date: d, ...trainerAlerts(t, today) })
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, items]) => ({
      month,
      items: items.sort((a, b) => a.date - b.date)
    }))
}

export function monthLabel(key, lang) {
  const m = /^(\d{4})-(\d{2})$/.exec(key)
  if (!m) return key
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'short', year: 'numeric' })
}
