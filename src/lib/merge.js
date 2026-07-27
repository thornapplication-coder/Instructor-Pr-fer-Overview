// Record-level merge for the cloud sync.
//
// The app state travels as one blob, but replacing that blob wholesale means a
// device always loses everything it changed while another device was ahead.
// Editing different people on two devices is the normal case for one planner
// with a laptop and an iPad, so the merge happens per record instead:
//
//   * every record in the lists below carries `_at`, the moment it last changed
//   * on merge, the union of both sides is taken and each id keeps its newer
//     version – edits to DIFFERENT records never collide
//   * deletions leave a tombstone in `_tomb`, so a delete is not undone by the
//     other device still having the record; a later edit still beats the delete
//
// Only a record edited on both sides since the last sync can lose something,
// and then the newer edit wins. Everything outside the lists (language, theme,
// dashboard order, migration flags) is small and follows the newer blob.

export const MERGE_LISTS = [
  'trainers',
  'otherPilots',
  'providers',
  'stages',
  'quals',
  'assignmentSteps',
  // Course dates: one record per scheduled run of a course. Two devices adding
  // DIFFERENT courses must both survive, which per-record merging gives.
  'courseRuns',
  'providerCourses',
  'providerStatus',
  'simVersions',
  // One record per calendar month, id 'YYYY-MM'. Merged per record like the
  // rest: two devices writing the same month is the normal case, and the newer
  // write wins – both compute it from the same merged trainer list anyway.
  'history',
  // The conversion milestones ("by 2026-10, 15 released"), same month-as-id
  // shape. Unlike history these are typed by hand, so two devices editing
  // DIFFERENT months must both survive – which is exactly what this gives.
  'plan'
]

// A tombstone older than this is dropped. It has to outlive any plausible
// offline stretch – pruning too early lets a device that was away resurrect
// what someone else deleted.
const TOMB_TTL_MS = 180 * 24 * 60 * 60 * 1000

// Stable JSON: keys sorted, so two structurally equal values always serialize
// identically. Plain JSON.stringify follows insertion order, and every object
// spread in the store can reorder keys.
export function stable(v) {
  if (v === undefined) return 'null'
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']'
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}'
}

const iso = (v) => (typeof v === 'string' ? v : '')

// Compare two records ignoring their stamp: re-saving a form without changing
// anything must not count as an edit, or every save would win every merge.
function sameRecord(a, b) {
  if (a === b) return true
  const { _at: _x, ...ra } = a || {}
  const { _at: _y, ...rb } = b || {}
  return stable(ra) === stable(rb)
}

/**
 * Stamp the records that actually changed between `prev` and `next`, and turn
 * disappeared records into tombstones. Called from the store's single patch
 * choke point, so no individual mutation has to remember to do it.
 */
export function stampChanges(prev, next, now) {
  const out = { ...next }
  const tomb = { ...(next?._tomb || {}) }

  for (const key of MERGE_LISTS) {
    const before = Array.isArray(prev?.[key]) ? prev[key] : []
    const after = Array.isArray(next?.[key]) ? next[key] : []
    // Untouched lists keep their array identity through an object spread.
    if (before === after) continue

    const prevById = new Map()
    before.forEach((r) => { if (r && r.id) prevById.set(r.id, r) })

    let touched = false
    const stamped = after.map((rec) => {
      if (!rec || !rec.id) return rec
      const old = prevById.get(rec.id)
      if (old && sameRecord(old, rec)) return rec
      touched = true
      return { ...rec, _at: now }
    })
    if (touched) out[key] = stamped

    const live = new Set(after.map((r) => r && r.id).filter(Boolean))
    let t = tomb[key] ? { ...tomb[key] } : null
    before.forEach((r) => {
      if (r && r.id && !live.has(r.id)) {
        t = t || {}
        t[r.id] = now
      }
    })
    if (t) {
      // A re-added id is alive again; its record was just stamped with `now`.
      live.forEach((id) => { delete t[id] })
      if (Object.keys(t).length) tomb[key] = t
      else delete tomb[key]
    }
  }

  out._tomb = tomb
  return out
}

/**
 * Give every unstamped record a stamp. Used for the seed and for data written
 * before this merge existed (or coming from an Excel/JSON import).
 *
 * `at` should be the moment the data is known to have changed – the blob's own
 * updatedAt – not "now". Stamping old records with "now" would let a device
 * that has merely been opened last win every merge with stale content.
 */
export function backfillStamps(data, at) {
  if (!data || typeof data !== 'object') return data
  for (const key of MERGE_LISTS) {
    const list = data[key]
    if (!Array.isArray(list) || list.every((r) => r && r._at)) continue
    data[key] = list.map((r) => (r && r._at ? r : { ...r, _at: at }))
  }
  return data
}

function mergeTomb(a, b) {
  const out = {}
  const cutoff = new Date(Date.now() - TOMB_TTL_MS).toISOString()
  for (const src of [a, b]) {
    if (!src || typeof src !== 'object') continue
    for (const id of Object.keys(src)) {
      const at = iso(src[id])
      if (at && at > cutoff && at > (out[id] || '')) out[id] = at
    }
  }
  return out
}

// Keep the reference side's ordering (stage order, qualification ranking and
// the planning columns are all meaningful), appending ids it did not know.
function orderLike(reference, records) {
  const rank = new Map()
  ;(Array.isArray(reference) ? reference : []).forEach((r, i) => { if (r && r.id) rank.set(r.id, i) })
  const known = []
  const extra = []
  records.forEach((r) => (rank.has(r.id) ? known : extra).push(r))
  known.sort((a, b) => rank.get(a.id) - rank.get(b.id))
  return known.concat(extra)
}

/**
 * Merge a local and a remote blob into the state both sides should hold.
 * Pure and idempotent: merge(merge(a, b), b) === merge(a, b), and the result
 * does not depend on which side is passed first.
 */
export function mergeBlobs(local, remote) {
  if (!remote || typeof remote !== 'object' || !Array.isArray(remote.trainers)) return local
  if (!local || typeof local !== 'object' || !Array.isArray(local.trainers)) return remote

  const localNewer = iso(local.updatedAt) >= iso(remote.updatedAt)
  const base = localNewer ? local : remote
  const out = { ...base }
  const tomb = {}

  for (const key of MERGE_LISTS) {
    const lList = Array.isArray(local[key]) ? local[key] : []
    const rList = Array.isArray(remote[key]) ? remote[key] : []
    const t = mergeTomb(local._tomb?.[key], remote._tomb?.[key])

    const picked = new Map()
    lList.forEach((r) => { if (r && r.id) picked.set(r.id, r) })
    rList.forEach((r) => {
      if (!r || !r.id) return
      const cur = picked.get(r.id)
      if (!cur || iso(r._at) > iso(cur._at)) picked.set(r.id, r)
    })

    const kept = []
    picked.forEach((rec, id) => {
      // A delete only sticks while nobody edited the record afterwards.
      const del = t[id]
      if (del && del > iso(rec._at)) return
      kept.push(rec)
    })

    out[key] = orderLike(base[key], kept)
    if (Object.keys(t).length) tomb[key] = t
  }

  out._tomb = tomb
  out.updatedAt = iso(local.updatedAt) > iso(remote.updatedAt) ? local.updatedAt : remote.updatedAt
  return out
}
