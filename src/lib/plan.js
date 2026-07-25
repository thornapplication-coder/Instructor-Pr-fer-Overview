// Plan vs. actual for the conversion.
//
// The history tells you how many are released. It cannot tell you whether that
// is enough – only a target can. A plan is a handful of milestones ("by the end
// of October, 15 released"), and this module answers the one question worth
// asking: are we behind, and by how many people?
//
// Milestones are stored as { id: 'YYYY-MM', released: n } – one per month, id
// equal to the month so the record merge reconciles two devices naturally.

/** Valid, sorted milestones. Junk is dropped rather than drawn as a phantom. */
export function planSeries(plan) {
  return (Array.isArray(plan) ? plan : [])
    .filter((p) => p && typeof p.id === 'string' && /^\d{4}-\d{2}$/.test(p.id))
    .map((p) => ({ id: p.id, released: Math.max(0, Math.round(Number(p.released) || 0)) }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * How far behind is "still amber"? A fixed headcount is wrong at both ends – one
 * person short of 3 is a different world from one short of 40 – so the slack is
 * a tenth of the milestone, and never less than one person (otherwise a target
 * of 5 would go red the moment a single check slipped by a week).
 */
export const slackFor = (target) => Math.max(1, Math.ceil(target * 0.1))

/**
 * Compare the plan against reality for a given month.
 *
 * `due` is the LAST milestone at or before the month – the one that should be
 * met by now. Picking the nearest one instead would let a missed October target
 * disappear from view in November, which is exactly when it matters most.
 */
export function planStatus(plan, actualReleased, month) {
  const series = planSeries(plan)
  const actual = Math.max(0, Math.round(Number(actualReleased) || 0))
  const past = series.filter((p) => p.id <= month)
  const due = past.length ? past[past.length - 1] : null
  const next = series.find((p) => p.id > month) || null

  if (!due) return { level: 'none', target: null, actual, gap: 0, due: null, next, series }

  const gap = due.released - actual
  const level = gap <= 0 ? 'on_track' : gap <= slackFor(due.released) ? 'at_risk' : 'behind'
  return { level, target: due.released, actual, gap: Math.max(0, gap), due, next, series }
}

/** Add or replace the milestone for a month; 0 or less removes it. */
export function upsertMilestone(plan, month, released) {
  const list = Array.isArray(plan) ? plan : []
  const n = Math.round(Number(released) || 0)
  if (!/^\d{4}-\d{2}$/.test(String(month))) return list
  if (n <= 0) return list.filter((p) => p.id !== month)
  const at = list.find((p) => p.id === month)
  if (at && Math.round(Number(at.released) || 0) === n) return list // no write, no stamp
  return at
    ? list.map((p) => (p.id === month ? { ...p, released: n } : p))
    : [...list, { id: month, released: n }]
}

/**
 * The plan value to draw against each history column – the milestone in force
 * that month, so the line steps up at a milestone and stays flat between them.
 * Months before the first milestone get null: there was no target yet, and a
 * line at zero would read as "the plan was zero".
 */
export function planFor(series, month) {
  let v = null
  for (const p of series) {
    if (p.id > month) break
    v = p.released
  }
  return v
}
