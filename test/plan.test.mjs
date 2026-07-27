// Plan vs. actual. The traffic light drives a real decision ("do we book more
// sim slots"), so the rule behind it has to be exact and explainable.
import { planSeries, planStatus, upsertMilestone, planFor, slackFor, intakeByMonth, intakeFor, addMonths, monthRange, monthWindow } from '../src/lib/plan.js'
import { mergeBlobs } from '../src/lib/merge.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const PLAN = [
  { id: '2026-08', released: 5 },
  { id: '2026-10', released: 15 },
  { id: '2027-01', released: 40 }
]

console.log('\nPlan – the milestone list')
{
  const s = planSeries([{ id: '2026-10', released: 15 }, { id: '2026-08', released: 5 }])
  ok(s.map((p) => p.id).join() === '2026-08,2026-10', 'milestones come back in chronological order')
  ok(planSeries([{ id: 'egal', released: 3 }, null, { released: 3 }]).length === 0, 'records without a proper month are dropped')
  ok(planSeries([{ id: '2026-08', released: '7' }])[0].released === 7, 'a numeric string is accepted')
  ok(planSeries([{ id: '2026-08', released: -4 }])[0].released === 0, 'a negative target cannot exist')
  ok(planSeries(undefined).length === 0, 'no plan at all is an empty list, not a crash')
}

console.log('\nPlan – which milestone is being measured')
{
  // Before the first milestone there is nothing to be behind on.
  const none = planStatus(PLAN, 0, '2026-07')
  ok(none.level === 'none', 'before the first milestone the card has no verdict')
  ok(none.next?.id === '2026-08', 'but it names the next one (2026-08)')

  const aug = planStatus(PLAN, 5, '2026-08')
  ok(aug.due.id === '2026-08' && aug.target === 5, 'in August the August milestone is the one due')
  ok(aug.next?.id === '2026-10', 'and October is next')

  // A missed milestone must NOT vanish once the month is over – November still
  // measures against October, which is exactly when being behind matters.
  const nov = planStatus(PLAN, 11, '2026-11')
  ok(nov.due.id === '2026-10', 'in November the last DUE milestone is still October, not the nearest one')
  ok(nov.target === 15 && nov.gap === 4, 'so 11 of 15 is a shortfall of 4')
  ok(nov.next?.id === '2027-01', 'and the next one is January')

  const after = planStatus(PLAN, 40, '2027-06')
  ok(after.due.id === '2027-01', 'past the last milestone it stays the one being measured')
  ok(after.next === null, 'and there is no next one')
}

console.log('\nPlan – the traffic light')
{
  // The documented rule: green when met, amber up to a tenth of the milestone
  // behind (at least one person), red beyond that.
  ok(slackFor(5) === 1, 'a target of 5 allows 1 person of slack')
  ok(slackFor(15) === 2, 'a target of 15 allows 2 (a tenth, rounded up)')
  ok(slackFor(40) === 4, 'a target of 40 allows 4')
  ok(slackFor(1) === 1, 'even a target of 1 allows 1 – never zero slack')

  const at = (actual) => planStatus(PLAN, actual, '2026-10').level
  ok(at(15) === 'on_track', '15 of 15 is green')
  ok(at(20) === 'on_track', 'being ahead is green, not an anomaly')
  ok(at(14) === 'at_risk', '1 behind is amber')
  ok(at(13) === 'at_risk', '2 behind is still amber (the tenth of 15)')
  ok(at(12) === 'behind', '3 behind is red')
  ok(at(0) === 'behind', 'nothing done at all is red')

  const ahead = planStatus(PLAN, 20, '2026-10')
  ok(ahead.gap === 0, 'the shortfall never goes negative – the card labels a lead as a lead')
}

console.log('\nPlan – editing milestones')
{
  const one = upsertMilestone([], '2026-08', { released: 5 })
  ok(one.length === 1 && one[0].released === 5, 'a milestone is created')
  // Same guard as the history recorder: no change means no new array, so the
  // store can skip the patch and not stamp a record for a no-op.
  ok(upsertMilestone(one, '2026-08', { released: 5 }) === one, 'setting the same number again returns the identical array')
  ok(upsertMilestone(one, '2026-08', { released: 6 }) !== one, 'a different number does write')
  ok(upsertMilestone(one, '2026-08', { released: 6 })[0].released === 6, 'and replaces rather than appends')
  ok(upsertMilestone(one, '2026-08', { released: 0 }).length === 0, 'setting 0 removes the milestone')
  ok(upsertMilestone(one, 'kaputt', { released: 5 }) === one, 'a malformed month is refused outright')
  ok(upsertMilestone(one, '2026-09', { released: 9 }).length === 2, 'another month appends')
}

console.log('\nPlan – the line drawn on the trend chart')
{
  const s = planSeries(PLAN)
  ok(planFor(s, '2026-07') === null, 'before the first milestone there is no line (not a line at zero)')
  ok(planFor(s, '2026-08') === 5, 'the milestone month itself carries its value')
  ok(planFor(s, '2026-09') === 5, 'between milestones the line stays flat at the last one')
  ok(planFor(s, '2026-10') === 15, 'and steps up on the next milestone')
  ok(planFor(s, '2030-01') === 40, 'far past the end it holds the final value')
}

console.log('\nPlan – two devices')
{
  const base = { trainers: [], _tomb: {}, updatedAt: '2026-07-01T00:00:00.000Z' }
  // Milestones are typed by hand, so two people planning DIFFERENT months is
  // the normal case and both have to survive.
  const a = { ...base, plan: [{ id: '2026-08', released: 5, _at: '2026-07-01T10:00:00.000Z' }] }
  const b = { ...base, plan: [{ id: '2026-10', released: 15, _at: '2026-07-01T11:00:00.000Z' }] }
  const both = mergeBlobs(a, b)
  ok(both.plan.length === 2, 'milestones set on two devices both survive')

  const x = { ...base, plan: [{ id: '2026-08', released: 5, _at: '2026-07-01T10:00:00.000Z' }] }
  const y = { ...base, plan: [{ id: '2026-08', released: 8, _at: '2026-07-02T10:00:00.000Z' }] }
  ok(mergeBlobs(x, y).plan[0].released === 8, 'the same month edited twice keeps the newer number')
}

console.log('\nPlan – the two targets do not overwrite each other')
{
  // One month record holds a CUMULATIVE milestone and a MONTHLY intake target.
  // Editing one must leave the other alone, or the two editors on the Capacity
  // tab would silently wipe each other's number.
  const a = upsertMilestone([], '2026-08', { released: 5 })
  const b = upsertMilestone(a, '2026-08', { intake: 26 })
  ok(b[0].released === 5 && b[0].intake === 26, 'setting the intake keeps the milestone (5 / 26)')
  const c = upsertMilestone(b, '2026-08', { released: 7 })
  ok(c[0].intake === 26, 'and setting the milestone keeps the intake')
  ok(upsertMilestone(c, '2026-08', { intake: 26 }) === c, 'an unchanged intake is still a no-op')

  // Clearing one target must not take the other with it.
  const d = upsertMilestone(c, '2026-08', { intake: 0 })
  ok(d.length === 1 && d[0].released === 7 && d[0].intake === 0, 'clearing the intake leaves the milestone standing')
  ok(upsertMilestone(d, '2026-08', { released: 0 }).length === 0, 'only clearing BOTH removes the record')
}

console.log('\nIntake – trainers per month by role')
{
  const T = (role, target) => ({ role, conv: { target } })
  const rows = intakeByMonth([
    T('captain', '2026-05-04'), T('fo', '2026-05-20'), T('fo', '2026-05-31'),
    T('captain', '2026-07-01'),
    T('fo', ''), T('captain', undefined), { role: 'fo' }
  ])
  ok(rows.map((r) => r.key).join() === '2026-05,2026-07', 'only months that actually have target dates (' + rows.map((r) => r.key).join() + ')')
  ok(rows[0].captain === 1 && rows[0].fo === 2, 'May splits 1 captain / 2 first officers')
  ok(rows[0].total === 3, 'and totals them')
  ok(rows.every((r) => r.total === r.captain + r.fo), 'every column totals its own two segments')

  // A missing role is a Captain everywhere else in the app; stay consistent.
  ok(intakeByMonth([{ conv: { target: '2026-05-01' } }])[0].captain === 1, 'no role recorded counts as Captain, as it does everywhere else')

  // Sorting, not insert order – a merge appends whatever the other device had.
  const unsorted = intakeByMonth([T('fo', '2026-09-01'), T('fo', '2026-02-01')])
  ok(unsorted[0].key === '2026-02', 'months come back chronologically')
  ok(intakeByMonth([]).length === 0 && intakeByMonth(undefined).length === 0, 'no data is an empty list, not a crash')
}

console.log('\nIntake – the monthly target line')
{
  const s = planSeries([
    { id: '2026-05', intake: 26 },
    { id: '2026-08', intake: 30 },
    { id: '2026-10', released: 15 } // milestone only – no intake target
  ])
  ok(intakeFor(s, '2026-04') === null, 'before the first target there is no line')
  ok(intakeFor(s, '2026-05') === 26, 'the target month carries its value')
  ok(intakeFor(s, '2026-08') === 30, 'and each planned month carries its own')
  ok(intakeFor(s, '2026-10') === null, 'a month with only a cumulative milestone has no intake target')
}

console.log('\nPlan – the six-month window')
{
  ok(addMonths('2026-07', 1) === '2026-08', 'one month on')
  ok(addMonths('2026-12', 1) === '2027-01', 'across the year boundary')
  ok(addMonths('2027-01', -1) === '2026-12', 'and backwards across it')
  ok(monthRange('2026-11', '2027-02').join() === '2026-11,2026-12,2027-01,2027-02', 'a range spans the year end')
  ok(monthRange('2027-05', '2027-01').length === 0, 'a backwards range is empty, not infinite')

  const w = monthWindow('2026-07', 0, 6, '2027-12')
  ok(w.months.length === 6, 'the window always holds six months')
  ok(w.months[0] === '2026-07' && w.months[5] === '2026-12', 'starting at the given month (' + w.months.join(' ') + ')')
  // 2026-07 .. 2027-12 is 18 months, so the last window starts at index 12.
  ok(w.maxOffset === 12, 'and it can be pushed to the end of the horizon (' + w.maxOffset + ')')

  const last = monthWindow('2026-07', 99, 6, '2027-12')
  ok(last.months[5] === '2027-12', 'an offset past the end clamps to the final month')
  ok(last.months.length === 6, 'and still shows six')
  ok(monthWindow('2026-07', -5, 6, '2027-12').start === 0, 'a negative offset clamps to the start')
}

console.log('\nIntake – every month owns its target')
{
  const s = planSeries([{ id: '2026-05', intake: 26 }, { id: '2026-08', intake: 30 }])
  ok(intakeFor(s, '2026-05') === 26, 'the month with a target shows it')
  // No carrying forward: an unplanned month must show NO line. A borrowed
  // number would look like a decision somebody actually made.
  ok(intakeFor(s, '2026-06') === null, 'the month after it has no target of its own')
  ok(intakeFor(s, '2026-07') === null, 'nor the one after that')
  ok(intakeFor(s, '2026-08') === 30, 'and the next planned month shows its own')
  ok(intakeFor(s, '2026-04') === null, 'a month before the first is empty too')
}
