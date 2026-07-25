// Monthly progress history.
//
// The store holds one snapshot of TODAY – how many are released, in conversion,
// not started. That answers "where are we", never "are we fast enough". This
// module keeps one record per calendar month so the dashboard can show the
// curve over time.
//
// It can only look forward: nothing in the stored data says WHEN somebody
// reached a stage, so a past curve cannot be reconstructed. The first entry is
// written the first time the app runs after this version, and the current
// month's entry keeps being updated until the month is over.
import { conversionSummary } from './stats.js'
import { conversionTrainers } from '../data/qualifications.js'

/** 'YYYY-MM' for a Date (local time – the month a planner would call it). */
export function monthKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * The three conversion headcounts for the current trainer list. Deliberately
 * only headcounts: an FTE curve would need the same scope caveats as every
 * other FTE figure, and progress is counted in people.
 */
export function progressSnapshot(trainers, stages) {
  const cs = conversionSummary(conversionTrainers(trainers || []), stages || [])
  return { released: cs.released, inProgress: cs.inProgress, notStarted: cs.notStarted }
}

const sameSnap = (a, b) =>
  !!a && !!b && a.released === b.released && a.inProgress === b.inProgress && a.notStarted === b.notStarted

/**
 * Add or update this month's entry. Returns the SAME array reference when
 * nothing changed, so the caller can skip the patch entirely – otherwise every
 * app start would stamp a record and push it to the cloud for nothing.
 */
export function upsertMonth(history, month, snap) {
  const list = Array.isArray(history) ? history : []
  const at = list.find((h) => h.id === month)
  if (sameSnap(at, snap)) return list
  const next = { id: month, ...snap }
  return at ? list.map((h) => (h.id === month ? { ...h, ...next } : h)) : [...list, next]
}

/**
 * Chronological, with the total each column adds up to. Sorting here rather
 * than trusting insert order: a merge from another device appends whatever it
 * had, and 'YYYY-MM' sorts correctly as plain text.
 */
export function historySeries(history) {
  return (Array.isArray(history) ? [...history] : [])
    .filter((h) => h && typeof h.id === 'string')
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((h) => {
      const released = Number(h.released) || 0
      const inProgress = Number(h.inProgress) || 0
      const notStarted = Number(h.notStarted) || 0
      return { key: h.id, released, inProgress, notStarted, total: released + inProgress + notStarted }
    })
}

/** 'YYYY-MM' -> 'Jul 26' / short month plus two-digit year. */
export function monthLabelShort(key, lang) {
  const [y, m] = String(key).split('-')
  const idx = Number(m) - 1
  const DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const names = lang === 'en' ? EN : DE
  if (!(idx >= 0 && idx < 12)) return String(key)
  return `${names[idx]} ${String(y).slice(2)}`
}
