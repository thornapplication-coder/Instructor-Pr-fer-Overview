// Where the phase-in is HEADING - and what the answer is NOT allowed to hide.
//
// The tiles say where everybody stands right now; nothing said where that
// leads, which is the one question a phase-in exists to answer. The temptation
// is to derive a rate ("they have been moving at N a month") and extrapolate.
// That cannot be done honestly here: a record carries one `_at` stamp - the
// last change - not a history of when each person entered each phase. A curve
// built on a guessed rate would look authoritative and rest on nothing.
//
// So the outlook reads dates that already exist, and the checks below are
// mostly about what it refuses to do: it does not count half a plan as a
// finish, and it does not quietly leave out the people who have no date, whose
// number is the real answer to "when".
import { conversionOutlook, demandVsCapacity } from '../src/lib/stats.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const STAGES = [{ id: 'nominated' }, { id: 'simulator' }, { id: 'released' }]
const STEPS = [{ id: 'tr' }, { id: 'tri' }]
const RUNS = [
  { id: 'c1', stepId: 'tr', from: '2026-11-03', to: '2026-11-20' },
  { id: 'c2', stepId: 'tri', from: '2027-01-04', to: '2027-01-15' },
  { id: 'bad', stepId: 'tr', from: '2027-05-10', to: '2027-02-01' } // typed backwards
]
const TODAY = new Date(2026, 7, 19) // 19 Aug 2026

console.log('\nOutlook – when is the last one through')
{
  const trainers = [
    { id: 'done', conv: { stage: 'released' } },
    { id: 'target', conv: { stage: 'simulator', target: '2027-03-31' } },
    // Booked end to end: both steps have a course, so the forecast is complete.
    { id: 'booked', conv: { stage: 'simulator' }, assignments: { tr: { courseId: 'c1', status: 'booked' }, tri: { courseId: 'c2', status: 'booked' } } },
    { id: 'nothing', conv: { stage: 'nominated' } }
  ]
  const o = conversionOutlook(trainers, STEPS, RUNS, STAGES, TODAY)
  ok(o.released === 1, 'somebody already released is counted as through, not forecast (' + o.released + ')')
  ok(o.unknown === 1, 'somebody with no course and no target is counted as unknown (' + o.unknown + ')')
  ok(o.total === 4, 'and the total is everybody, so the three figures add up (' + o.total + ')')
  ok(o.last === '2027-03', 'the last month comes from the furthest date (' + o.last + ')')
  ok(o.series.length === 2, 'one row per month that finishes something (' + o.series.length + ')')
  ok(o.series[0].month === '2027-01' && o.series[0].done === 1,
    'the booked person lands on the END of their last course, not their first (' + o.series[0].month + ')')
  ok(o.series[1].released === 3,
    'the curve counts the already-released in, so it reads as "through" and not "finished this month" (' + o.series[1].released + ')')

  // Half a plan finishes early on paper. That is the flattering answer, so an
  // incomplete forecast falls back to the target date and, failing that, to
  // "unknown" - never to the one course that happens to be booked.
  const half = conversionOutlook(
    [{ id: 'half', conv: { stage: 'simulator' }, assignments: { tr: { courseId: 'c1', status: 'booked' } } }],
    STEPS, RUNS, STAGES, TODAY)
  ok(half.unknown === 1 && half.series.length === 0,
    'one booked step out of two is not a finish date (' + half.unknown + ' unknown)')

  // A course typed backwards must not become an outlook either - the same
  // guard finishForecast grew in 1.57.0.
  const backwards = conversionOutlook(
    [{ id: 'b', conv: { stage: 'simulator' }, assignments: { tr: { courseId: 'bad', status: 'booked' }, tri: { courseId: 'c2', status: 'booked' } } }],
    STEPS, RUNS, STAGES, TODAY)
  ok(backwards.unknown === 1, 'a backwards course date yields no outlook at all (' + backwards.unknown + ')')

  // A date in the past for somebody not released is an overdue, not progress.
  const late = conversionOutlook(
    [{ id: 'l', conv: { stage: 'simulator', target: '2026-05-01' } }], STEPS, RUNS, STAGES, TODAY)
  ok(late.overdue === 1, 'a target already past is named as overdue rather than counted as done (' + late.overdue + ')')

  ok(conversionOutlook([], STEPS, RUNS, STAGES, TODAY).total === 0, 'nobody at all is zero, not a crash')
  ok(conversionOutlook(null, STEPS, RUNS, STAGES, TODAY).series.length === 0, 'and neither is no list')
}

console.log('\nDemand against seats, month by month')
{
  const trainers = [
    { id: 'a', conv: { stage: 'simulator', target: '2026-11-10' } },
    { id: 'b', conv: { stage: 'simulator', target: '2026-11-20' } },
    { id: 'c', conv: { stage: 'simulator', target: '2026-12-05' } },
    { id: 'd', conv: { stage: 'released', target: '2026-11-01' } }, // already through
    { id: 'e', conv: { stage: 'simulator', target: '2028-06-01' } } // outside the window
  ]
  const providers = [{ id: 'p1', slotsByMonth: { '2026-11': { tr: 3 }, '2026-12': { tr: 1 } } }]
  const months = ['2026-11', '2026-12', '2027-01']
  const d = demandVsCapacity(trainers, providers, STEPS, STAGES, months)

  ok(d.rows.length === 3, 'one row per month in the window (' + d.rows.length + ')')
  ok(d.rows[0].demand === 2 && d.rows[0].seats === 3 && d.rows[0].short === false,
    'a month with room to spare is not flagged (2 of 3)')
  ok(d.rows[1].demand === 1 && d.rows[1].seats === 1 && d.rows[1].short === false,
    'exactly full is not short either – it is exactly enough (1 of 1)')
  ok(d.rows[2].demand === 0 && d.rows[2].seats === 0, 'an empty month is a row, not a gap in the axis')
  ok(d.shortMonths === 0, 'nothing is short here (' + d.shortMonths + ')')

  // Somebody already released does not need a seat any more.
  ok(d.totals.demand === 3, 'the released person is out of the demand (' + d.totals.demand + ')')
  // And a target outside the window is still demand - it is simply not on this
  // axis, which the card has to say rather than silently drop.
  ok(d.outside === 1, 'a target outside the window is counted and reported (' + d.outside + ')')

  const tight = demandVsCapacity(trainers, [{ id: 'p', slotsByMonth: { '2026-11': { tr: 1 } } }], STEPS, STAGES, months)
  ok(tight.rows[0].short === true && tight.rows[0].gap === -1,
    'two people against one seat is short by one (' + tight.rows[0].gap + ')')
  ok(tight.shortMonths === 2, 'and every short month is counted (' + tight.shortMonths + ')')

  ok(demandVsCapacity([], [], STEPS, STAGES, months).totals.demand === 0, 'no people and no providers is zero')
  ok(demandVsCapacity(trainers, providers, STEPS, STAGES, []).rows.length === 0, 'no months is no rows')
}
