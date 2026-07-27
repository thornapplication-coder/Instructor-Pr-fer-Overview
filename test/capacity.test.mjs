// Provider capacity: seats PER MONTH, overall and broken down by course type.
//
// A single total hides the thing that actually blocks a plan: a provider may
// run six type ratings a month and only two TRI courses. The breakdown is what
// makes "is this provider big enough" answerable per course.
import { providerSlots, providerUtilization } from '../src/lib/stats.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const STEPS = [
  { id: 'tr', label: 'Type Rating' },
  { id: 'tri', label: 'TRI-Kurs' },
  { id: 'lifus', label: 'LIFUS' }
]

console.log('\nProvider capacity – per month, per course type')
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
