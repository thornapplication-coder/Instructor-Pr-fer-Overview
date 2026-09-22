// Unit tests for the record-level cloud merge (src/lib/merge.js).
//
// This is the piece that decides which device's edit survives, so it is the
// piece worth pinning down. Pure functions, no browser, no dependencies:
//   npm test
import { mergeBlobs, stampChanges, stable, backfillStamps, MERGE_LISTS, SEED_AT } from '../src/lib/merge.js'
import { sharingNotSetUp } from '../src/lib/syncErrors.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }
const eq = (a, b, m) =>
  ok(stable(a) === stable(b), m + (stable(a) === stable(b) ? '' : `\n        got  ${stable(a)}\n        want ${stable(b)}`))

const T = (n) => `2026-07-25T10:${String(n).padStart(2, '0')}:00.000Z`
const blob = (trainers, extra = {}) => ({ trainers, updatedAt: T(0), ...extra })
const names = (list) => list.map((r) => r.id + ':' + (r.name || ''))

console.log('\nmerge – serialization')
ok(stable({ b: 1, a: 2 }) === stable({ a: 2, b: 1 }), 'stable() ignores key order')
ok(stable([1, 2]) !== stable([2, 1]), 'stable() keeps array order significant')
ok(stable({ a: undefined }) === '{"a":null}', 'stable() handles undefined')

console.log('\nmerge – stamping')
{
  const prev = blob([{ id: 'a', name: 'Anna', _at: T(1) }, { id: 'b', name: 'Ben', _at: T(1) }])
  const next = { ...prev, trainers: [{ id: 'a', name: 'Anna NEU', _at: T(1) }, prev.trainers[1]] }
  const out = stampChanges(prev, next, T(5))
  ok(out.trainers[0]._at === T(5), 'a changed record gets a fresh stamp')
  ok(out.trainers[1]._at === T(1), 'an untouched record keeps its stamp')
  eq(out._tomb, {}, 'no tombstones without a deletion')
}
{
  const prev = blob([{ id: 'a', name: 'Anna', _at: T(1) }])
  const next = { ...prev, trainers: [{ name: 'Anna', id: 'a', _at: T(1) }] } // keys reordered
  ok(stampChanges(prev, next, T(9)).trainers[0]._at === T(1), 'a no-op re-save does not re-stamp')
}
{
  const prev = blob([{ id: 'a', _at: T(1) }, { id: 'b', _at: T(1) }])
  eq(stampChanges(prev, { ...prev, trainers: [prev.trainers[0]] }, T(6))._tomb,
    { trainers: { b: T(6) } }, 'a deletion leaves a tombstone')
}
{
  const prev = blob([{ id: 'a', _at: T(1) }], { _tomb: { trainers: { b: T(2) } } })
  const out = stampChanges(prev, { ...prev, trainers: [prev.trainers[0], { id: 'b', name: 'again' }] }, T(7))
  eq(out._tomb, {}, 're-adding an id clears its tombstone')
  ok(out.trainers[1]._at === T(7), 'the re-added record is stamped now')
}
{
  const prev = { trainers: [], providers: [{ id: 'p1', name: 'CAE', _at: T(1) }], updatedAt: T(0) }
  ok(stampChanges(prev, { ...prev, providers: [{ id: 'p1', name: 'CAE Wien' }] }, T(4)).providers[0]._at === T(4),
    'lists other than trainers are stamped too')
}
{
  const seeded = backfillStamps({ trainers: [{ id: 'a' }, { id: 'b', _at: T(3) }] }, T(1))
  ok(seeded.trainers[0]._at === T(1) && seeded.trainers[1]._at === T(3),
    'backfill only fills what is missing')
}

console.log('\nmerge – the case this all exists for')
{
  // Laptop edited Anna, iPad edited Ben. Both must survive.
  const localB = blob([{ id: 'a', name: 'Anna NEU', _at: T(8) }, { id: 'b', name: 'Ben', _at: T(1) }], { updatedAt: T(8) })
  const remoteB = blob([{ id: 'a', name: 'Anna', _at: T(1) }, { id: 'b', name: 'Ben NEU', _at: T(7) }], { updatedAt: T(7) })
  eq(names(mergeBlobs(localB, remoteB).trainers), ['a:Anna NEU', 'b:Ben NEU'],
    'edits to DIFFERENT records both survive')
}
{
  const localB = blob([{ id: 'a', name: 'local', _at: T(3) }], { updatedAt: T(3) })
  const remoteB = blob([{ id: 'a', name: 'remote', _at: T(9) }], { updatedAt: T(9) })
  eq(names(mergeBlobs(localB, remoteB).trainers), ['a:remote'], 'same record: the newer edit wins')
  eq(names(mergeBlobs(remoteB, localB).trainers), ['a:remote'], 'and the result does not depend on the order')
}
{
  const localB = blob([{ id: 'a', _at: T(1) }], { updatedAt: T(1) })
  const remoteB = blob([{ id: 'b', _at: T(2) }], { updatedAt: T(2) })
  eq(mergeBlobs(localB, remoteB).trainers.map((r) => r.id).sort(), ['a', 'b'], 'new records from both sides are kept')
}

console.log('\nmerge – deletion')
{
  const localB = blob([], { updatedAt: T(5), _tomb: { trainers: { a: T(5) } } })
  const remoteB = blob([{ id: 'a', name: 'Anna', _at: T(1) }], { updatedAt: T(1) })
  eq(mergeBlobs(localB, remoteB).trainers, [], 'a delete is not undone by the other device')
  eq(mergeBlobs(remoteB, localB).trainers, [], 'seen from the other side as well')
}
{
  const localB = blob([], { updatedAt: T(5), _tomb: { trainers: { a: T(5) } } })
  const remoteB = blob([{ id: 'a', name: 'Anna NEU', _at: T(9) }], { updatedAt: T(9) })
  eq(names(mergeBlobs(localB, remoteB).trainers), ['a:Anna NEU'], 'an edit after the delete brings the record back')
}
{
  const old = new Date(Date.now() - 200 * 864e5).toISOString()
  const localB = blob([], { updatedAt: T(5), _tomb: { trainers: { a: old } } })
  const remoteB = blob([{ id: 'a', _at: T(1) }], { updatedAt: T(1) })
  eq(mergeBlobs(localB, remoteB).trainers.map((r) => r.id), ['a'], 'a tombstone past its TTL is dropped')
}

console.log('\nmerge – ordering, scalars, robustness')
{
  const localB = { trainers: [], stages: [{ id: 's2', _at: T(1) }, { id: 's1', _at: T(1) }], updatedAt: T(9) }
  const remoteB = { trainers: [], stages: [{ id: 's1', _at: T(1) }, { id: 's3', _at: T(2) }], updatedAt: T(2) }
  eq(mergeBlobs(localB, remoteB).stages.map((r) => r.id), ['s2', 's1', 's3'],
    'the newer side keeps its stage order, unknown ids append')
}
{
  const localB = blob([], { updatedAt: T(9), theme: 'dark', lang: 'en' })
  const remoteB = blob([], { updatedAt: T(2), theme: 'light', lang: 'de' })
  const m = mergeBlobs(localB, remoteB)
  ok(m.theme === 'dark' && m.lang === 'en' && m.updatedAt === T(9), 'settings follow the newer blob')
  ok(mergeBlobs(remoteB, localB).theme === 'dark', 'independent of argument order')
}
{
  eq(mergeBlobs(blob([{ id: 'a' }]), null).trainers.map((r) => r.id), ['a'], 'a null remote returns local unchanged')
  eq(mergeBlobs(null, blob([{ id: 'b' }])).trainers.map((r) => r.id), ['b'], 'a null local returns remote')
  eq(mergeBlobs(blob([{ id: 'a' }]), { nonsense: true }).trainers.map((r) => r.id), ['a'], 'a garbage remote is ignored')
  eq(mergeBlobs(blob([{ id: 'a', _at: T(1) }]), blob([{ name: 'no id' }])).trainers.map((r) => r.id), ['a'],
    'records without an id are skipped, not crashed on')
}
{
  const localB = blob([{ id: 'a', name: 'old local' }], { updatedAt: T(1) })
  const remoteB = blob([{ id: 'a', name: 'newer remote', _at: T(9) }], { updatedAt: T(9) })
  eq(names(mergeBlobs(localB, remoteB).trainers), ['a:newer remote'], 'a stamped record beats an unstamped one')
}
{
  const localB = blob([{ id: 'a', _at: T(3) }, { id: 'b', _at: T(1) }], { updatedAt: T(3), _tomb: { trainers: { z: T(2) } } })
  const remoteB = blob([{ id: 'b', _at: T(7) }, { id: 'c', _at: T(4) }], { updatedAt: T(7) })
  const once = mergeBlobs(localB, remoteB)
  eq(stable(mergeBlobs(once, remoteB)), stable(once), 'merging again changes nothing (idempotent)')
  eq(stable(mergeBlobs(once, once)), stable(once), 'merging a blob with itself is a no-op')
}

ok(MERGE_LISTS.length > 0, 'MERGE_LISTS is populated (' + MERGE_LISTS.length + ' lists)')

// ---------------------------------------------------------------------------
// A factory-fresh install must never beat real data.
//
// iOS drops a site's localStorage after roughly a week without a visit, and a
// home-screen PWA is not exempt. The device comes back holding the seed. If
// that seed is stamped "now" - as it was - then on the next sign-in every seed
// record is newer than the real one on the server and replaces it, and anybody
// deleted since walks back in, because the tombstone predates the new stamp.
// Nothing on screen says so: the sync dot goes green.
console.log('\nmerge – a fresh install loses against real data')
{
  // The fresh install is NEWER than the server by the clock - that is the
  // whole trap. T() is July, so these two need their own dates: with July
  // stamps the server would win on `updatedAt` alone and the test would pass
  // without the fix being there at all.
  const REAL = '2026-09-01T08:00:00.000Z'
  const TODAY = '2026-09-22T07:00:00.000Z'
  const fresh = {
    _seed: true,
    updatedAt: TODAY,                   // a fresh install saves itself at once
    theme: 'light',
    capacityTo: '2028-12',
    trainers: [
      { id: 'HMF', name: 'Hammerer', ore: '', convStage: 'st1', _at: SEED_AT },
      { id: 'GONE', name: 'Seed Person', _at: SEED_AT }
    ],
    _tomb: {}
  }
  const server = {
    updatedAt: REAL,
    theme: 'dark',
    capacityTo: '2027-06',
    trainers: [
      { id: 'HMF', name: 'Hammerer', ore: 'ORE-2', convStage: 'st4', _at: REAL },
      { id: 'NEU', name: 'Von Hand angelegt', _at: REAL }
    ],
    _tomb: { trainers: { GONE: REAL } }
  }

  const m = mergeBlobs(fresh, server)
  const by = (id) => m.trainers.find((t) => t.id === id)
  ok(by('HMF').convStage === 'st4', 'the server’s conversion stage survives (st4)')
  ok(by('HMF').ore === 'ORE-2', 'and so does the ORE tier (ORE-2)')
  ok(!by('GONE'), 'somebody deleted on the server stays deleted')
  ok(!!by('NEU'), 'and a record only the server has is kept')
  ok(m.theme === 'dark', 'settings outside the lists come from the real side too')
  ok(m.capacityTo === '2027-06', '  including the capacity window')
  ok(m._seed === undefined, 'the merged result is no longer marked as seed')

  // Same both ways round: sync() passes (local, remote), the retry passes the
  // carried merge. Neither order may change who wins.
  const rev = mergeBlobs(server, fresh)
  eq(rev.trainers.find((t) => t.id === 'HMF'), by('HMF'), 'argument order does not decide it')

  // The protection must not swallow a real edit made on the fresh device
  // before it signed in - that IS somebody's work.
  const edited = {
    ...fresh,
    _seed: undefined,
    trainers: [{ ...fresh.trainers[0], ore: 'ORE-1', _at: TODAY }, fresh.trainers[1]]
  }
  delete edited._seed
  ok(mergeBlobs(edited, server).trainers.find((t) => t.id === 'HMF').ore === 'ORE-1',
    'an edit made on that device before signing in still wins')

  // And with no remote row at all there is nothing to lose against: the seed
  // is what gets uploaded, exactly as before.
  ok(mergeBlobs(fresh, null) === fresh, 'a first device still uploads its seed')
}

console.log('\nsync – "sharing is off" is not a fault')
{
  ok(sharingNotSetUp({ code: '42703', message: 'column app_state.shared does not exist' }),
    'a missing `shared` column reads as "not set up"')
  ok(sharingNotSetUp({ code: '42501', message: 'permission denied for table app_state' }),
    'and so does a missing anon grant')
  ok(sharingNotSetUp({ message: 'column "shared" does not exist' }),
    'even with no code, the message is enough')
  ok(!sharingNotSetUp({ message: 'TypeError: Failed to fetch' }),
    'a dead connection stays a fault')
  ok(!sharingNotSetUp({ code: 'PGRST301', message: 'JWT expired' }),
    'and so does an expired token')
  ok(!sharingNotSetUp(null), 'no error at all is not "not set up"')
}
