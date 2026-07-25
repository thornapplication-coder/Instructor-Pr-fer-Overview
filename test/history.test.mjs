// Monthly progress history: it must only write when something changed, must
// survive a merge from another device, and must never invent a past.
import { monthKey, progressSnapshot, upsertMonth, historySeries, monthLabelShort } from '../src/lib/history.js'
import { mergeBlobs } from '../src/lib/merge.js'
import { DEFAULT_STAGES } from '../src/data/pipeline.js'
import { SEED_TRAINERS } from '../src/data/seed.js'
import { normalizeQual } from '../src/data/qualifications.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const stages = DEFAULT_STAGES
const trainers = SEED_TRAINERS.map((t) => ({ ...t, qual: normalizeQual(t.qual) }))

console.log('\nHistory – the month key')
{
  ok(monthKey(new Date(2026, 6, 25)) === '2026-07', 'July 2026 is "2026-07" (month is 1-based, zero padded)')
  ok(monthKey(new Date(2026, 0, 1)) === '2026-01', 'January pads to "2026-01"')
  ok(monthKey(new Date(2026, 11, 31)) === '2026-12', 'December is "2026-12", not "2027-00"')
  // Sorting the key as plain text has to give chronological order, because
  // historySeries relies on exactly that instead of parsing dates.
  const keys = ['2026-12', '2027-01', '2026-02', '2026-10']
  ok([...keys].sort((a, b) => a.localeCompare(b)).join() === '2026-02,2026-10,2026-12,2027-01',
    'the keys sort chronologically as plain strings')
}

console.log('\nHistory – it writes only when something actually changed')
{
  const snap = progressSnapshot(trainers, stages)
  ok(snap.released + snap.inProgress + snap.notStarted > 0, `the snapshot counts the conversion pool (${JSON.stringify(snap)})`)

  const first = upsertMonth([], '2026-07', snap)
  ok(first.length === 1 && first[0].id === '2026-07', 'the first call creates the month')

  // This is the guard the store relies on: an unchanged month must come back as
  // the SAME array, or every app start would claim an edit and push to the cloud.
  ok(upsertMonth(first, '2026-07', snap) === first, 'an unchanged month returns the identical array (no write)')
  ok(upsertMonth(first, '2026-07', { ...snap, released: snap.released + 1 }) !== first,
    'a changed number does return a new array')

  const moved = upsertMonth(first, '2026-07', { released: 5, inProgress: 4, notStarted: 3 })
  ok(moved.length === 1, 'updating the current month does not append a second record for it')
  ok(moved[0].released === 5 && moved[0].notStarted === 3, 'and it carries the new numbers')

  const nextMonth = upsertMonth(moved, '2026-08', snap)
  ok(nextMonth.length === 2, 'a new month appends')
  ok(nextMonth[0].released === 5, 'and leaves the finished month untouched')
}

console.log('\nHistory – the series is chronological and adds up')
{
  // Deliberately out of order: a merge appends whatever the other device had.
  const raw = [
    { id: '2026-09', released: 9, inProgress: 2, notStarted: 1 },
    { id: '2026-07', released: 0, inProgress: 3, notStarted: 9 },
    { id: '2026-08', released: 4, inProgress: 5, notStarted: 3 }
  ]
  const s = historySeries(raw)
  ok(s.map((x) => x.key).join() === '2026-07,2026-08,2026-09', 'out-of-order records come back sorted')
  ok(s.every((x) => x.total === x.released + x.inProgress + x.notStarted), 'every column totals its own segments')
  ok(s[0].total === 12 && s[2].total === 12, 'the population stays the same size across months (12)')

  // Junk must not draw a column: a record without a month has no place on a
  // time axis, and a missing number is 0, not NaN.
  const dirty = historySeries([{ id: '2026-07' }, null, { released: 3 }, { id: '2026-08', released: '4' }])
  ok(dirty.length === 2, 'records without a month id are dropped')
  ok(dirty[0].total === 0, 'a record with no numbers is zero, not NaN')
  ok(dirty[1].released === 4, 'a numeric string still counts')
  ok(historySeries(undefined).length === 0, 'no history at all is an empty series, not a crash')
}

console.log('\nHistory – two devices, one month')
{
  const base = { trainers: [], _tomb: {}, updatedAt: '2026-07-01T00:00:00.000Z' }
  // Same month edited on both sides: newer wins, exactly like every other list.
  const local = { ...base, history: [{ id: '2026-07', released: 2, inProgress: 1, notStarted: 7, _at: '2026-07-10T09:00:00.000Z' }] }
  const remote = { ...base, history: [{ id: '2026-07', released: 3, inProgress: 1, notStarted: 6, _at: '2026-07-11T09:00:00.000Z' }] }
  const merged = mergeBlobs(local, remote)
  ok(merged.history.length === 1, 'the same month does not end up twice')
  ok(merged.history[0].released === 3, 'the newer write wins the month (3)')

  // Different months from two devices must BOTH survive – that is the whole
  // point of putting history in MERGE_LISTS rather than letting the blob win.
  const a = { ...base, history: [{ id: '2026-07', released: 2, inProgress: 0, notStarted: 8, _at: '2026-07-31T09:00:00.000Z' }] }
  const b = { ...base, history: [{ id: '2026-08', released: 5, inProgress: 0, notStarted: 5, _at: '2026-08-31T09:00:00.000Z' }] }
  const both = mergeBlobs(a, b)
  ok(both.history.length === 2, 'a month only one device saw is not lost')
  ok(historySeries(both.history).map((x) => x.key).join() === '2026-07,2026-08', 'and the merged months still sort right')
}

console.log('\nHistory – month labels')
{
  ok(monthLabelShort('2026-07', 'de') === 'Jul 26', 'German short label (Jul 26)')
  ok(monthLabelShort('2026-03', 'de') === 'Mär 26', 'German uses Mär, not Mar')
  ok(monthLabelShort('2026-05', 'en') === 'May 26', 'English short label (May 26)')
  ok(monthLabelShort('2026-13', 'de') === '2026-13', 'an impossible month falls back to the raw key rather than undefined')
}
