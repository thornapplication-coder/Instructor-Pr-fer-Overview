// Calendar months as plain 'YYYY-MM' strings.
//
// The provider capacity plan is per month, and a month is not a date: "November
// 2026" has no day, and giving it one only invites the timezone bugs that
// courses.js already documents. A string sorts, compares and merges correctly
// with no Date involved at all.

const RE = /^(\d{4})-(\d{2})$/

/** true for a well-formed 'YYYY-MM' with a real month number. */
export function isMonth(key) {
  const m = RE.exec(String(key || '').trim())
  if (!m) return false
  const n = Number(m[2])
  return n >= 1 && n <= 12
}

/** Months since year 0, so two months can be compared and subtracted. */
function ordinal(key) {
  const m = RE.exec(String(key || '').trim())
  if (!m) return null
  return Number(m[1]) * 12 + (Number(m[2]) - 1)
}

function fromOrdinal(n) {
  const y = Math.floor(n / 12)
  const mo = (n % 12) + 1
  return String(y).padStart(4, '0') + '-' + String(mo).padStart(2, '0')
}

/** 'YYYY-MM' + n months (n may be negative). '' for an unusable input. */
export function addMonths(key, n) {
  const o = ordinal(key)
  return o == null ? '' : fromOrdinal(o + n)
}

/** The month a Date falls in. Local fields on purpose: a planner types the
 *  month they are living in, not the one UTC happens to be in. */
export function monthOfDate(d) {
  const x = d || new Date()
  return String(x.getFullYear()) + '-' + String(x.getMonth() + 1).padStart(2, '0')
}

/**
 * Every month from `from` to `to`, inclusive, ascending.
 *
 * Empty when either end is unusable or the pair is backwards – a reversed range
 * is a typo, not a request for a descending list. Capped, because the range is
 * user-typed and "2026-01" to "2999-12" would otherwise render eleven thousand
 * rows and take the tab down with it.
 */
export const MAX_RANGE_MONTHS = 120

export function monthRange(from, to) {
  const a = ordinal(from)
  const b = ordinal(to)
  if (a == null || b == null || b < a) return []
  const n = Math.min(b - a, MAX_RANGE_MONTHS - 1)
  const out = []
  for (let i = 0; i <= n; i++) out.push(fromOrdinal(a + i))
  return out
}

/** "Nov 2026". Same formatter the conversion timeline uses. */
export function monthLabel(key, lang) {
  const m = RE.exec(String(key || '').trim())
  if (!m) return String(key || '')
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { month: 'short', year: 'numeric' })
}

/**
 * The window the capacity plan covers, from the two settings.
 *
 * An empty `from` means "the month we are in", so the plan follows the calendar
 * without anybody editing it every January. `to` defaults to the end of 2027 –
 * the horizon the phase-in was planned against.
 */
export const DEFAULT_CAPACITY_TO = '2027-12'

export function capacityRange(from, to, today) {
  const start = isMonth(from) ? from : monthOfDate(today)
  const end = isMonth(to) ? to : DEFAULT_CAPACITY_TO
  return monthRange(start, end)
}
