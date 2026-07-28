// Provider capacity: seats IN TOTAL, overall and broken down by course type,
// plus the month-by-month plan that says when they fall.
//
// A single total hides the thing that actually blocks a plan: a provider may
// run six type ratings and only two TRI courses. The breakdown is what makes
// "is this provider big enough" answerable per course.
//
// And a single figure of any kind hides WHEN. The months are not alike – four
// type ratings in November 2026, none in December, six in March 2027 – so the
// distribution is its own record rather than a rate to divide by.
import { providerSlots, providerUtilization, providerMonths, capacityByMonth, providerPlanCheck } from '../src/lib/stats.js'
import { monthRange, capacityRange, addMonths, isMonth, monthOfDate, MAX_RANGE_MONTHS } from '../src/lib/months.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const STEPS = [
  { id: 'tr', label: 'Type Rating' },
  { id: 'tri', label: 'TRI-Kurs' },
  { id: 'lifus', label: 'LIFUS' }
]

console.log('\nProvider capacity – totals, per course type')
{
  const split = providerSlots({ slots: '', slotsByStep: { tr: 6, tri: 2 } }, STEPS)
  ok(split.byStep.tr === 6 && split.byStep.tri === 2, 'each course type keeps its own figure')
  ok(split.byStep.lifus === 0, 'a course type with nothing entered reads zero, not undefined')
  ok(split.total === 8, 'with no overall figure typed, the breakdown IS the total (' + split.total + ')')
  ok(split.splitOver === false, 'and it cannot exceed a total that was never stated')

  const typed = providerSlots({ slots: 10, slotsByStep: { tr: 6, tri: 2 } }, STEPS)
  ok(typed.total === 10, 'a typed total wins over the sum – it is the contract with the provider')
  ok(typed.split === 8, 'the sum is still reported alongside it')
  ok(typed.splitOver === false, 'a breakdown below the total is normal, not a warning')

  const over = providerSlots({ slots: 5, slotsByStep: { tr: 6, tri: 2 } }, STEPS)
  ok(over.splitOver === true, 'a breakdown promising MORE than the total is flagged')
  ok(over.total === 5, 'but the total stands – nothing is silently corrected')

  ok(providerSlots({ slots: -4 }, STEPS).total === 0, 'a negative capacity cannot exist')
  ok(providerSlots({ slotsByStep: { tr: '3' } }, STEPS).byStep.tr === 3, 'a typed number is accepted')
  ok(providerSlots({ slotsByStep: { tr: 2.6 } }, STEPS).byStep.tr === 3, 'seats are whole people')
  ok(providerSlots(null, STEPS).total === 0, 'no provider at all is not a crash')
  ok(providerSlots({ slots: 4 }, null).total === 4, 'and neither is no step list')
}

console.log('\nProvider capacity – demand meets it')
{
  const providers = [
    { id: 'p1', name: 'A', slots: '', slotsByStep: { tr: 2, tri: 5 } },
    { id: 'p2', name: 'B', slots: 9, slotsByStep: {} }
  ]
  const runs = [{ id: 'c1', stepId: 'tr', providerId: 'p1', from: '2026-03-03', to: '2026-03-20' }]
  const trainers = [
    // Three people booked onto p1's TR course – through the course date, so the
    // provider is recorded on the course and not on any of them.
    { id: 't1', assignments: { tr: { courseId: 'c1', status: 'booked' } } },
    { id: 't2', assignments: { tr: { courseId: 'c1', status: 'booked' } } },
    { id: 't3', assignments: { tr: { courseId: 'c1', status: 'booked' } } },
    // One TRI booked at p1 the old way, plus one completed that no longer counts.
    { id: 't4', assignments: { tri: { providerId: 'p1', status: 'planned' } } },
    { id: 't5', assignments: { tri: { providerId: 'p1', status: 'done' } } },
    { id: 't6', assignments: { tr: { providerId: 'p2', status: 'open' } } }
  ]
  const u = providerUtilization(trainers, providers, STEPS, runs)
  const a = u.find((x) => x.provider.id === 'p1')
  ok(a.demand === 4, 'demand counts the course bookings and skips the completed one (' + a.demand + ')')
  ok(a.slots === 7, 'the capacity is the breakdown summed (' + a.slots + ')')
  ok(a.byStep.tr === 3 && a.slotsByStep.tr === 2,
    'per course type the bottleneck is visible: 3 wanted, 2 seats')
  ok(a.byStep.tri === 1 && a.slotsByStep.tri === 5, 'while the other course type has room to spare')
  // The total looks comfortable (4 of 7) even though TR is over. That is the
  // whole reason the breakdown exists.
  ok(a.util < 1, 'the overall figure alone would have read as comfortable (' + Math.round(a.util * 100) + ' %)')

  const b = u.find((x) => x.provider.id === 'p2')
  ok(b.slots === 9 && b.slotsByStep.tr === 0,
    'a provider with only an overall figure keeps it, with an empty breakdown')
  ok(b.util != null && Math.abs(b.util - 1 / 9) < 1e-9, 'and is still measured against it')
}

console.log('\nMonths – the axis the plan hangs on')
{
  ok(isMonth('2026-11') === true, 'a month is a year and a month, nothing else')
  ok(isMonth('2026-13') === false, 'a thirteenth month is not one')
  ok(isMonth('2026-00') === false, 'and neither is a zeroth')
  ok(isMonth('2026-11-04') === false, 'a date is not a month – it would sort between two of them')
  ok(isMonth('') === false && isMonth(null) === false, 'nothing is not a month')

  ok(addMonths('2026-11', 2) === '2027-01', 'adding months rolls the year over')
  ok(addMonths('2027-01', -2) === '2026-11', 'and back again')
  ok(addMonths('nonsense', 1) === '', 'an unusable month yields nothing, not NaN-NaN')

  const r = monthRange('2026-11', '2027-02')
  ok(r.length === 4, 'a range is inclusive at both ends (' + r.length + ')')
  ok(r[0] === '2026-11' && r[3] === '2027-02', 'and runs in order (' + r.join(', ') + ')')
  ok(monthRange('2026-11', '2026-11').length === 1, 'one month is a range of one')
  // A reversed pair is a typo, not a request for a descending list. The UI says
  // so out loud rather than drawing an empty table with no explanation.
  ok(monthRange('2027-02', '2026-11').length === 0, 'an end before its start is empty, not reversed')
  ok(monthRange('', '2027-12').length === 0, 'a missing end of the range is empty')
  // Capped: the range is user-typed, and '2026-01' to '2999-12' would otherwise
  // render eleven thousand rows and take the tab down with it.
  ok(monthRange('2026-01', '2999-12').length === MAX_RANGE_MONTHS,
    'a runaway range is capped (' + monthRange('2026-01', '2999-12').length + ')')

  const today = new Date(2026, 6, 28) // July 2026
  ok(monthOfDate(today) === '2026-07', 'today knows its own month (' + monthOfDate(today) + ')')
  const def = capacityRange('', '2027-12', today)
  ok(def[0] === '2026-07', 'an empty start means the month we are in (' + def[0] + ')')
  ok(def[def.length - 1] === '2027-12', 'and the default end is the phase-in horizon')
  ok(def.length === 18, 'July 2026 to December 2027 is eighteen months (' + def.length + ')')
  ok(capacityRange('2026-01', '', today)[0] === '2026-01', 'a typed start is kept')
  ok(capacityRange('2026-01', '', today).slice(-1)[0] === '2027-12', 'a missing end falls back to the default')
}

console.log('\nProvider capacity – the monthly plan')
{
  const p = {
    id: 'p1',
    slots: 20,
    slotsByStep: { tr: 12, tri: 5 },
    slotsByMonth: {
      '2026-11': { tr: 4 },
      '2026-12': { tr: 2 },
      '2027-03': { tr: 6, tri: 1 }
    }
  }
  const window3 = ['2026-11', '2026-12', '2027-01']
  const rows = providerMonths(p, STEPS, window3)
  ok(rows.length === 3, 'one row per month asked for, not per month stored')
  ok(rows[0].byStep.tr === 4 && rows[0].total === 4, 'November carries its four type ratings')
  // A month with nothing in it is still a row. A timeline that omits its gaps
  // is a list, and the gaps are what a planner is looking for.
  ok(rows[2].total === 0, 'January is empty and still present')
  ok(rows[2].byStep.tri === 0, 'its course types read zero, not undefined')

  const all = ['2026-11', '2026-12', '2027-03']
  const sums = capacityByMonth([p], STEPS, all)
  ok(sums.totals.byStep.tr === 12, 'the type ratings add up across the months (' + sums.totals.byStep.tr + ')')
  ok(sums.totals.total === 13, 'and so does everything together (' + sums.totals.total + ')')

  const two = capacityByMonth([p, { id: 'p2', slotsByMonth: { '2026-11': { tr: 3 } } }], STEPS, all)
  ok(two.rows[0].byStep.tr === 7, 'two providers in one month are summed (' + two.rows[0].byStep.tr + ')')
  ok(capacityByMonth([], STEPS, all).totals.total === 0, 'no providers is zero, not a crash')
  ok(capacityByMonth([p], STEPS, []).rows.length === 0, 'no months is no rows')

  // The plan against the agreed totals. A warning, never a block – the same
  // rule the seat count on a course date follows.
  const okPlan = providerPlanCheck(p, STEPS, Object.keys(p.slotsByMonth))
  ok(okPlan.plannedTotal === 13, 'the plan knows its own size (' + okPlan.plannedTotal + ')')
  ok(okPlan.overSteps.length === 0, 'a plan inside its totals raises nothing')
  ok(okPlan.overTotal === false, 'and neither does the grand total')

  const overStep = providerPlanCheck({ ...p, slotsByStep: { tr: 5, tri: 5 } }, STEPS, Object.keys(p.slotsByMonth))
  ok(overStep.overSteps.length === 1 && overStep.overSteps[0].id === 'tr',
    'twelve type ratings against a five-seat figure is called out, and names the course type')
  ok(overStep.overTotal === false, 'while the grand total, still 20, is not')

  const overAll = providerPlanCheck({ ...p, slots: 10 }, STEPS, Object.keys(p.slotsByMonth))
  ok(overAll.overTotal === true, 'thirteen distributed against a ten-seat total is called out')
  ok(overAll.typedTotal === 10, 'and the typed figure is reported, not the plan (' + overAll.typedTotal + ')')

  // Nothing typed means nothing to contradict: the plan IS the figure then.
  const untyped = providerPlanCheck({ slotsByMonth: p.slotsByMonth }, STEPS, Object.keys(p.slotsByMonth))
  ok(untyped.overSteps.length === 0 && untyped.overTotal === false,
    'with no total stated the plan cannot exceed it')

  ok(providerMonths(null, STEPS, window3)[0].total === 0, 'no provider at all is not a crash')
  ok(providerMonths({ slotsByMonth: { '2026-11': { tr: -3 } } }, STEPS, ['2026-11'])[0].total === 0,
    'a negative seat count cannot exist')
  ok(providerMonths({ slotsByMonth: { '2026-11': { tr: 2.6 } } }, STEPS, ['2026-11'])[0].byStep.tr === 3,
    'seats are whole people here too')
}
