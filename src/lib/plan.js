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
    .map((p) => ({
      id: p.id,
      released: Math.max(0, Math.round(Number(p.released) || 0)),
      // Two different targets share the month record, and they mean different
      // things: `released` is CUMULATIVE ("by October, 15 done"), `intake` is a
      // FLOW ("26 trainers start in October"). Keeping them apart matters –
      // comparing a month's intake against a cumulative milestone would be
      // nonsense, and one number cannot serve both.
      intake: Math.max(0, Math.round(Number(p.intake) || 0))
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Trainers scheduled into each month, split by cockpit role.
 *
 * "Scheduled into" = their conversion target date falls in that month. Unlike
 * the timeline on the Capacity tab this does NOT drop the already-released:
 * this chart is about throughput per month, and a month someone finished in is
 * exactly a month they were part of the intake.
 */
export function intakeByMonth(trainers) {
  const map = new Map()
  for (const t of trainers || []) {
    const m = /^(\d{4})-(\d{2})/.exec(String(t?.conv?.target || ''))
    if (!m) continue // no target date set – nothing to place on a time axis
    const key = `${m[1]}-${m[2]}`
    if (!map.has(key)) map.set(key, { key, captain: 0, fo: 0, total: 0 })
    const row = map.get(key)
    if (t.role === 'fo') row.fo += 1
    else row.captain += 1
    row.total += 1
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

/** The monthly intake target in force for a month (flat between milestones). */
export function intakeFor(series, month) {
  let v = null
  for (const p of series) {
    if (p.id > month) break
    if (p.intake > 0) v = p.intake
  }
  return v
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

/**
 * Set one or both targets for a month. `values` is a partial
 * `{ released, intake }` – an absent key leaves that target alone, so the two
 * editors never wipe each other's number.
 *
 * The record disappears only when BOTH targets are zero; clearing the intake
 * must not take a cumulative milestone with it. Returns the SAME array when
 * nothing changed, so the store can skip patch() and not stamp a no-op edit.
 */
export function upsertMilestone(plan, month, values) {
  const list = Array.isArray(plan) ? plan : []
  if (!/^\d{4}-\d{2}$/.test(String(month))) return list
  const num = (v) => Math.max(0, Math.round(Number(v) || 0))
  const at = list.find((p) => p.id === month)
  const next = {
    released: values.released === undefined ? num(at?.released) : num(values.released),
    intake: values.intake === undefined ? num(at?.intake) : num(values.intake)
  }
  if (next.released <= 0 && next.intake <= 0) {
    return at ? list.filter((p) => p.id !== month) : list
  }
  if (at && num(at.released) === next.released && num(at.intake) === next.intake) return list
  return at
    ? list.map((p) => (p.id === month ? { ...p, ...next } : p))
    : [...list, { id: month, ...next }]
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
