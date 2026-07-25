// Plan vs. actual. The traffic light drives a real decision ("do we book more
// sim slots"), so the rule behind it has to be exact and explainable.
import { planSeries, planStatus, upsertMilestone, planFor, slackFor } from '../src/lib/plan.js'
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
  const one = upsertMilestone([], '2026-08', 5)
  ok(one.length === 1 && one[0].released === 5, 'a milestone is created')
  // Same guard as the history recorder: no change means no new array, so the
  // store can skip the patch and not stamp a record for a no-op.
  ok(upsertMilestone(one, '2026-08', 5) === one, 'setting the same number again returns the identical array')
  ok(upsertMilestone(one, '2026-08', 6) !== one, 'a different number does write')
  ok(upsertMilestone(one, '2026-08', 6)[0].released === 6, 'and replaces rather than appends')
  ok(upsertMilestone(one, '2026-08', 0).length === 0, 'setting 0 removes the milestone')
  ok(upsertMilestone(one, 'kaputt', 5) === one, 'a malformed month is refused outright')
  ok(upsertMilestone(one, '2026-09', 9).length === 2, 'another month appends')
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
