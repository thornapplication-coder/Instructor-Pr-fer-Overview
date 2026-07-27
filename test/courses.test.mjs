// Course dates. The period now lives on the course, not on each of the eight
// people in it, and a person may still deviate from it. Both halves of that
// have to hold exactly, because everything downstream – the calendar, the seat
// warning, the duration figures – reads the resolved value, not the raw record.
import {
  attendees,
  conflictsFor,
  emptyCourseRun,
  findRun,
  isOverbooked,
  normalizeCourseRun,
  overlaps,
  resolveAssignment,
  runIsValid,
  runsForStep,
  seatUsage,
  spanDays,
  targetDays
} from '../src/lib/courses.js'
import { courseEntries } from '../src/lib/courseCalendar.js'
import { MERGE_LISTS } from '../src/lib/merge.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const STEPS = [
  { id: 'tr', label: 'Type Rating', color: '#111', targetDays: 18 },
  { id: 'tri', label: 'TRI-Kurs', color: '#222' },
  { id: 'lifus', label: 'LIFUS', color: '#333', targetDays: 6 }
]
const RUNS = [
  { id: 'c1', stepId: 'tr', providerId: 'p1', location: '', from: '2026-03-03', to: '2026-03-20', seats: 2 },
  { id: 'c2', stepId: 'tr', providerId: 'p1', location: '', from: '2026-05-04', to: '2026-05-21', seats: 8 },
  { id: 'c3', stepId: 'tri', providerId: '', location: 'Wien', from: '2026-03-16', to: '2026-03-25', seats: 0 }
]
const PROVIDERS = [{ id: 'p1', name: 'LAT' }]

console.log('\nCourse dates – how long something lasted')
{
  ok(spanDays('2026-03-03', '2026-03-20') === 18, 'a period is counted inclusively: 3rd to 20th is 18 days')
  ok(spanDays('2026-03-03', '2026-03-03') === 1, 'a one-day course lasted one day, not zero')
  ok(spanDays('2026-03-20', '2026-03-03') === null, 'an end before its start is not a negative course, it is nothing')
  ok(spanDays('2026-03-03', '') === null, 'half a period is no period')
  ok(spanDays('2026-02-30', '2026-03-02') === null, 'the 30th of February is rejected, not rolled into March')
  // Two courses of the same length either side of the European DST switch
  // (29.03.2026). Parsed as local dates these differ by an hour and round apart.
  ok(spanDays('2026-03-25', '2026-04-01') === spanDays('2026-05-25', '2026-06-01'),
    'a period spanning the clock change is as long as the same period in summer')
}

console.log('\nCourse dates – the record itself')
{
  ok(runIsValid(RUNS[0]) === true, 'a well-formed course is valid')
  ok(runIsValid({ ...RUNS[0], to: '2026-03-01' }) === false, 'one that ends before it starts is not')
  ok(runIsValid({ ...RUNS[0], to: '' }) === false, 'and neither is one with no end yet')
  ok(normalizeCourseRun({ id: 'x', seats: '6' }).seats === 6, 'a typed seat count is a number')
  ok(normalizeCourseRun({ id: 'x', seats: -3 }).seats === 0, 'a negative seat count cannot exist')
  ok(normalizeCourseRun({ id: 'x' }).from === '', 'missing fields come back as empty, never undefined')
  ok(emptyCourseRun('n').id === 'n', 'a blank course carries the id it was given')
  ok(runsForStep(RUNS, 'tr').length === 2, 'courses are filtered by course type (2 TR courses)')
  ok(runsForStep(RUNS, 'nope').length === 0, 'an unknown type has none, rather than all of them')
  ok(findRun(RUNS, 'c2').id === 'c2', 'a course is found by id')
  ok(findRun(RUNS, '') === null, 'no id is no course – not the first one')
  ok(findRun(RUNS, 'gone') === null, 'a deleted id resolves to nothing rather than throwing')
}

console.log('\nCourse dates – course first, person on top')
{
  const booked = { courseId: 'c1', status: 'booked' }
  const r = resolveAssignment(booked, findRun(RUNS, 'c1'))
  ok(r.from === '2026-03-03' && r.to === '2026-03-20', 'a booking with no dates of its own takes the course period')
  ok(r.providerId === 'p1', 'and the course provider')
  ok(r.days === 18, 'so it has a duration even though nothing was typed on the person')
  ok(r.overridden === false, 'and it is not flagged as a deviation')

  const late = resolveAssignment({ courseId: 'c1', date: '2026-03-05' }, findRun(RUNS, 'c1'))
  ok(late.from === '2026-03-05' && late.to === '2026-03-20', 'a personal start wins, the course still supplies the end')
  ok(late.days === 16, 'and the duration follows the person, not the course')
  ok(late.overridden === true, 'the deviation is flagged')

  const same = resolveAssignment({ courseId: 'c1', date: '2026-03-03' }, findRun(RUNS, 'c1'))
  ok(same.overridden === false, 'typing the course date again is not a deviation')

  const own = resolveAssignment({ date: '2026-06-01', end: '2026-06-05', providerId: 'p9' }, null)
  ok(own.days === 5 && own.providerId === 'p9', 'a booking with no course at all still works exactly as before')
  ok(own.overridden === false, 'and cannot deviate from a course it does not have')

  ok(resolveAssignment(null, null).days === null, 'nothing at all is not a crash')
  ok(resolveAssignment({ courseId: 'c1' }, null).days === null,
    'a course id whose record is gone leaves the booking undated rather than inventing a period')
}

console.log('\nCourse dates – seats')
{
  const trainers = [
    { id: 't1', name: 'A', assignments: { tr: { courseId: 'c1', status: 'booked' } } },
    { id: 't2', name: 'B', assignments: { tr: { courseId: 'c1', status: 'done' } } },
    { id: 't3', name: 'C', assignments: { tr: { courseId: 'c1', status: 'na' } } },
    { id: 't4', name: 'D', assignments: { tr: { courseId: 'c2', status: 'open' } } }
  ]
  const used = seatUsage(trainers, STEPS)
  ok(used.get('c1') === 2, '"n/a" does not take a seat (2 of 3 on c1)')
  ok(used.get('c2') === 1, 'the other course counts separately')
  ok(isOverbooked(RUNS[0], 2) === false, 'two people in two seats is full, not overbooked')
  ok(isOverbooked(RUNS[0], 3) === true, 'three people in two seats is overbooked')
  ok(isOverbooked(RUNS[2], 40) === false, 'a course with no stated seat count cannot be overbooked')
  ok(attendees(trainers, STEPS, 'c1').map((x) => x.trainer.name).join() === 'A,B',
    'the attendee list leaves out the person marked n/a')
}

console.log('\nCourse dates – two courses at once')
{
  ok(overlaps('2026-03-03', '2026-03-20', '2026-03-16', '2026-03-25') === true, 'periods that run into each other overlap')
  ok(overlaps('2026-03-03', '2026-03-20', '2026-03-21', '2026-03-30') === false, 'back to back is not an overlap')
  ok(overlaps('2026-03-03', '2026-03-20', '2026-03-20', '2026-03-30') === true, 'sharing a single day is')
  ok(overlaps('2026-03-03', '', '2026-03-16', '2026-03-25') === false, 'an incomplete period cannot be compared, so it does not warn')

  const clash = { id: 't', assignments: { tr: { courseId: 'c1' }, tri: { courseId: 'c3' } } }
  ok(conflictsFor(clash, STEPS, RUNS).length === 1, 'the same person in two overlapping courses is one conflict')
  const fine = { id: 't', assignments: { tr: { courseId: 'c2' }, tri: { courseId: 'c3' } } }
  ok(conflictsFor(fine, STEPS, RUNS).length === 0, 'courses in different months are not')
  const skipped = { id: 't', assignments: { tr: { courseId: 'c1', status: 'na' }, tri: { courseId: 'c3' } } }
  ok(conflictsFor(skipped, STEPS, RUNS).length === 0, 'a step marked n/a takes no time and cannot clash')
}

console.log('\nCourse dates – the calendar reads the resolved period')
{
  const trainers = [
    { id: 't1', name: 'A', tlc: 'AAA', assignments: { tr: { courseId: 'c1', status: 'booked' } } },
    { id: 't2', name: 'B', tlc: 'BBB', assignments: { tr: { date: '2026-04-07', end: '2026-04-10', status: 'booked' } } }
  ]
  const e = courseEntries(trainers, STEPS, PROVIDERS, RUNS)
  ok(e.length === 2, 'both the booked-onto-a-course and the free-typed entry appear (' + e.length + ')')
  ok(e[0].iso === '2026-03-03', 'the course booking is dated from its course, not left out')
  ok(e[0].where === 'LAT', 'and shows the provider recorded on the course')
  ok(e[0].days === 18, 'the entry carries its length')
  ok(e[1].iso === '2026-04-07' && e[1].days === 4, 'the free-typed one is unchanged')
  const naOnly = courseEntries([{ id: 'x', assignments: { tr: { courseId: 'c1', status: 'na' } } }], STEPS, PROVIDERS, RUNS)
  ok(naOnly.length === 0, 'nothing starts at a step marked n/a')
  ok(courseEntries(trainers, STEPS, PROVIDERS).length === 1,
    'called without the course list the free-typed entry still shows, rather than the whole calendar throwing')
}

console.log('\nCourse dates – target duration per course type')
{
  ok(targetDays(STEPS[0]) === 18, 'a course type can carry a target duration')
  ok(targetDays(STEPS[1]) === null, 'one without a target has none, not zero')
  ok(targetDays({ targetDays: 0 }) === null, 'zero days is not a target, it is "unset"')
  ok(targetDays({ targetDays: '12' }) === 12, 'a typed number is accepted')
  ok(targetDays(null) === null, 'no step at all is not a crash')
}

console.log('\nCourse dates – the merge knows about them')
{
  ok(MERGE_LISTS.includes('courseRuns'),
    'courseRuns is a merged list – otherwise two devices adding a course would keep only one of them')
}
