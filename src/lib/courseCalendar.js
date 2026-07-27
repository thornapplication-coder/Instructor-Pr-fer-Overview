// Builds the "when does which trainer start which course" calendar for the
// Planung tab (and its PDF/print output) from the per-trainer step assignments.
// Pure functions – no DOM, no store – so they are easy to test and reuse.
import { resolveAssignment } from './courses.js'

function parseISO(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ''))
  if (!m) return null
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(dt) ? null : dt
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Flatten every dated assignment into one entry per trainer + step.
// Steps marked "n/a" are skipped – nothing starts there.
//
// `runs` are the course dates. An assignment that points at one has no dates
// and no provider of its own, so without resolving it first the calendar would
// go blank for exactly the people who are properly booked.
export function courseEntries(trainers, steps, providers, runs) {
  const out = []
  // Index once: a linear find() per assignment is O(entries x providers).
  const byId = new Map((providers || []).map((p) => [p.id, p]))
  const runById = new Map((runs || []).map((r) => [r.id, r]))
  const providerName = (id) => {
    const p = byId.get(id)
    return p && p.name ? p.name : ''
  }
  for (const tr of trainers || []) {
    for (const s of steps || []) {
      const a = tr.assignments?.[s.id]
      if (!a || a.status === 'na') continue
      const r = resolveAssignment(a, runById.get(a.courseId) || null)
      const date = parseISO(r.from)
      if (!date) continue
      out.push({
        date,
        iso: r.from,
        end: r.to,
        days: r.days,
        month: monthKey(date),
        day: date.getDate(),
        trainer: tr,
        step: s,
        status: a.status || 'open',
        where: providerName(r.providerId) || r.location || ''
      })
    }
  }
  return out.sort((x, y) => x.date - y.date || (x.trainer.name || '').localeCompare(y.trainer.name || ''))
}

// Group entries into calendar months, ascending. Every month between the first
// and the last entry is present (even if empty), so the calendar reads as a
// continuous timeline instead of jumping over gaps.
export function courseMonths(entries) {
  if (!entries.length) return []
  const first = entries[0].date
  const last = entries[entries.length - 1].date
  const byMonth = new Map()
  for (const e of entries) {
    if (!byMonth.has(e.month)) byMonth.set(e.month, [])
    byMonth.get(e.month).push(e)
  }
  const months = []
  const cur = new Date(first.getFullYear(), first.getMonth(), 1)
  const end = new Date(last.getFullYear(), last.getMonth(), 1)
  while (cur <= end) {
    const key = monthKey(cur)
    months.push({
      month: key,
      year: cur.getFullYear(),
      monthIndex: cur.getMonth(),
      items: byMonth.get(key) || []
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

// Day cells for one month, laid out as full Monday-based weeks. Leading and
// trailing cells outside the month are null so the grid stays rectangular.
export function monthGrid(year, monthIndex, items) {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday = 0
  const byDay = new Map()
  for (const it of items || []) {
    if (!byDay.has(it.day)) byDay.set(it.day, [])
    byDay.get(it.day).push(it)
  }
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, items: byDay.get(d) || [] })
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// Compact badge text for a course/step so the chips stay readable in a day
// cell: prefer an existing all-caps token ("TRI-Kurs" -> "TRI", "LIFUS" ->
// "LIFUS"), otherwise use the initials ("Type Rating" -> "TR"). The full label
// is still shown in the chip's tooltip.
export function stepAbbrev(label) {
  const s = String(label || '').trim()
  if (!s) return ''
  if (s.length <= 5) return s
  const words = s.split(/[^A-Za-zÄÖÜäöüß0-9]+/).filter(Boolean)
  const caps = words.find((w) => w.length >= 2 && w.length <= 6 && w === w.toUpperCase())
  if (caps) return caps
  const initials = words.map((w) => w[0].toUpperCase()).join('')
  return initials.slice(0, 4) || s.slice(0, 4)
}

export function monthTitle(month, lang) {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return month
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'long', year: 'numeric' })
}

export const WEEKDAYS = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}
