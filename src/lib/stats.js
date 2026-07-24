// Live aggregations over the trainer list. Category orders mirror the Excel
// "Statistik_Daten" tab so the numbers line up 1:1 with the source file.
import { firstStageId, releasedStageId } from '../data/pipeline.js'

// Resolve stage semantics positionally instead of by the literal ids
// 'nominated'/'released' (stages are user-editable): first = not started, last =
// released. An unknown/deleted stage id counts as "not started" – the same
// bucket the board's first-column fallback puts it in. When no stage list is
// passed the literal defaults apply (backwards-compatible).
function stageResolver(stages) {
  const has = stages && stages.length
  const firstId = firstStageId(stages)
  const releasedId = releasedStageId(stages)
  const valid = has ? new Set(stages.map((s) => s.id)) : null
  const stageOf = (t) => {
    const s = t.conv?.stage || firstId
    return valid && !valid.has(s) ? firstId : s
  }
  return { firstId, releasedId, stageOf }
}

const QUAL_ORDER = ['SEN', 'TRE', 'TRI', 'LTC', 'SFI', 'TKI']
const BASE_ORDER = ['PMI', 'VIE', 'SZG', 'PRG', 'ARN']
const ORE_ORDER = ['A', 'B', 'C', 'Rente']

function tally(items, keyFn) {
  const m = new Map()
  for (const it of items) {
    const k = keyFn(it)
    if (k === undefined || k === null || k === '') continue
    m.set(k, (m.get(k) || 0) + 1)
  }
  return m
}

function ordered(map, order) {
  const seen = new Set()
  const rows = []
  for (const k of order) {
    rows.push({ key: k, count: map.get(k) || 0 })
    seen.add(k)
  }
  for (const [k, v] of map) if (!seen.has(k)) rows.push({ key: k, count: v })
  return rows.filter((r) => r.count > 0 || order.includes(r.key))
}

function bySize(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }))
}

export function byQual(trainers, order) {
  return ordered(tally(trainers, (t) => t.qual), order && order.length ? order : QUAL_ORDER)
}
export function byBase(trainers) {
  return ordered(tally(trainers, (t) => t.base), BASE_ORDER)
}
export function byOre(trainers) {
  return ordered(tally(trainers, (t) => t.ore || '—'), ORE_ORDER)
}
export function byAuthority(trainers) {
  return bySize(tally(trainers, (t) => t.authority || '—'))
}

export function byPartTime(trainers) {
  const map = tally(trainers, (t) => {
    const pt = t.partTime
    if (typeof pt === 'number') return pt >= 1 ? 'VZ' : String(Math.round(pt * 100) + '%')
    const s = String(pt || '').trim()
    return s === 'VZ' || s === '' ? 'VZ' : s
  })
  // Full-time first, then part-time factors descending, strings last.
  const rows = [...map.entries()].map(([key, count]) => ({ key, count }))
  const rank = (k) => {
    if (k === 'VZ') return 1000
    const m = /^(\d+)%$/.exec(k)
    return m ? Number(m[1]) : -1
  }
  return rows.sort((a, b) => rank(b.key) - rank(a.key))
}

export function byFunction(trainers) {
  let withFn = 0
  let without = 0
  for (const t of trainers) (t.remark && t.remark.trim() ? withFn++ : without++)
  return { withFunction: withFn, withoutFunction: without, total: trainers.length }
}

// Conversion summary for the Overview KPIs.
export function conversionSummary(trainers, stages) {
  const { firstId, releasedId, stageOf } = stageResolver(stages)
  let released = 0
  let notStarted = 0
  let inProgress = 0
  for (const t of trainers) {
    const stage = stageOf(t)
    if (stage === releasedId) released++
    else if (stage === firstId) notStarted++
    else inProgress++
  }
  return { released, inProgress, notStarted, total: trainers.length }
}

// FTE tied up in an active conversion vs. still available.
// "in conversion" = stage is neither the first (nominated / not started) nor
// the final (released). Those trainers are occupied by their own training.
function round1(x) {
  return Math.round(x * 10) / 10
}
export function conversionFteSummary(trainers, stages) {
  const { firstId, releasedId, stageOf } = stageResolver(stages)
  let total = 0
  let inConversion = 0
  let released = 0
  let notStarted = 0
  for (const t of trainers) {
    if ((t.ore || '') === 'Rente') continue // retirees are not deployable capacity
    const f = typeof t.fte === 'number' ? t.fte : 1
    total += f
    const stage = stageOf(t)
    if (stage === releasedId) released += f
    else if (stage === firstId) notStarted += f
    else inConversion += f
  }
  return {
    total: round1(total),
    inConversion: round1(inConversion),
    available: round1(total - inConversion),
    released: round1(released),
    notStarted: round1(notStarted)
  }
}

export function pipelineDistribution(trainers, stages) {
  const { stageOf } = stageResolver(stages)
  const map = tally(trainers, (t) => stageOf(t))
  return stages.map((s) => ({ ...s, count: map.get(s.id) || 0 }))
}

// Capacity aggregation: how much FTE sits in each group, how much is tied up in
// an active conversion, how much stays available, split by current aircraft.
// "in conversion" = not nominated, not released (mirrors conversionFteSummary).
function capacityBy(trainers, keyFn, aircraftList, order, stages) {
  const { firstId, releasedId, stageOf } = stageResolver(stages)
  const acs = aircraftList && aircraftList.length ? aircraftList : ['A320', 'B737']
  const map = new Map()
  const get = (k) => {
    if (!map.has(k)) {
      const ac = {}
      for (const a of acs) ac[a] = 0
      map.set(k, { key: k, total: 0, inConversion: 0, headcount: 0, ac })
    }
    return map.get(k)
  }
  for (const t of trainers) {
    if ((t.ore || '') === 'Rente') continue // retirees are not deployable capacity
    const fte = typeof t.fte === 'number' ? t.fte : 1
    const row = get(keyFn(t))
    row.total += fte
    row.headcount += 1
    const stage = stageOf(t)
    if (stage !== firstId && stage !== releasedId) row.inConversion += fte
    if (t.aircraft && row.ac[t.aircraft] != null) row.ac[t.aircraft] += fte
  }
  const rows = [...map.values()].map((r) => {
    const ac = {}
    for (const a of acs) ac[a] = round1(r.ac[a])
    return {
      key: r.key,
      headcount: r.headcount,
      total: round1(r.total),
      inConversion: round1(r.inConversion),
      available: round1(r.total - r.inConversion),
      ac
    }
  })
  if (order && order.length) {
    const rank = (k) => {
      const i = order.indexOf(k)
      return i < 0 ? 999 : i
    }
    rows.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key))
  } else {
    rows.sort((a, b) => a.key.localeCompare(b.key))
  }
  const totals = {
    key: '',
    headcount: rows.reduce((s, r) => s + r.headcount, 0),
    total: round1(rows.reduce((s, r) => s + r.total, 0)),
    inConversion: round1(rows.reduce((s, r) => s + r.inConversion, 0)),
    available: round1(rows.reduce((s, r) => s + r.available, 0)),
    ac: Object.fromEntries(acs.map((a) => [a, round1(rows.reduce((s, r) => s + r.ac[a], 0))]))
  }
  return { rows, totals, aircraft: acs }
}

export function capacityByBase(trainers, aircraftList, stages) {
  return capacityBy(trainers, (t) => t.base || '—', aircraftList, null, stages)
}

// Legacy "new TRI" still folds into "TRI" (defensive for old/imported data);
// other quals stay as-is.
export function qualGroup(q) {
  const s = String(q || '').trim()
  if (s === 'TRI' || s === 'new TRI') return 'TRI'
  return s || '—'
}

// Canonical qualification ranking, highest first (spec): the order used
// everywhere qualifications are shown or sorted.
export const QUAL_RANK = ['SEN', 'TRE', 'TRI', 'LTC', 'SFI', 'TKI']

export function qualRankIndex(key) {
  const i = QUAL_RANK.indexOf(key)
  return i < 0 ? QUAL_RANK.length + 1 : i
}

export function capacityByQual(trainers, aircraftList, stages) {
  return capacityBy(trainers, (t) => qualGroup(t.qual), aircraftList, QUAL_RANK, stages)
}

// Provider load vs. capacity. Demand = planning assignments pointing at each
// provider that are still active (any status except "n/a" and "completed").
// util = demand / slots (null when no slots number is set).
export function providerUtilization(trainers, providers, steps) {
  const demand = new Map()
  const bump = (pid, step, entry) => {
    const d = demand.get(pid) || { total: 0, byStep: {}, people: [] }
    d.total += 1
    d.byStep[step.id] = (d.byStep[step.id] || 0) + 1
    d.people.push(entry)
    demand.set(pid, d)
  }
  for (const t of trainers) {
    for (const s of steps) {
      const a = t.assignments?.[s.id]
      if (!a || !a.providerId) continue
      if (a.status === 'na' || a.status === 'done') continue
      bump(a.providerId, s, { trainer: t, step: s, date: a.date || '', status: a.status || 'open' })
    }
  }
  return providers
    .map((p) => {
      const d = demand.get(p.id) || { total: 0, byStep: {}, people: [] }
      const slots = Number(p.slots) || 0
      return {
        provider: p,
        demand: d.total,
        byStep: d.byStep,
        slots,
        util: slots > 0 ? d.total / slots : null,
        people: d.people
      }
    })
    .sort((a, b) => (a.provider.name || '').localeCompare(b.provider.name || ''))
}

// Head-count style KPIs. Qualification tiles follow the canonical rank
// SEN · TRE · TRI · LTC · SFI · TKI; each person counts once (no double-count).
export function headcount(trainers) {
  const EXAMINER = new Set(['SEN', 'TRE'])
  const isQual = (t, id) => t.qual === id
  const active = trainers.filter((t) => t.ore !== 'Rente')
  const examiners = trainers.filter((t) => EXAMINER.has(t.qual) || String(t.qual).startsWith('TRE'))
  const tri = trainers.filter((t) => isQual(t, 'TRI'))
  const ltc = trainers.filter((t) => isQual(t, 'LTC'))
  const sfiTki = trainers.filter((t) => isQual(t, 'SFI') || isQual(t, 'TKI'))
  const instructors = trainers.filter((t) => new Set(['TRI', 'LTC', 'SFI', 'TKI']).has(t.qual))
  const retiring = trainers.filter((t) => t.ore === 'Rente')
  const firstOfficers = trainers.filter((t) => t.role === 'fo')
  const captains = trainers.filter((t) => t.role !== 'fo')
  // Weighted FTE from the per-person editable FTE field (default 1.0).
  let fte = 0
  for (const t of trainers) {
    fte += typeof t.fte === 'number' ? t.fte : 1
  }
  return {
    total: trainers.length,
    active: active.length,
    examiners: examiners.length,
    tri: tri.length,
    ltc: ltc.length,
    sfiTki: sfiTki.length,
    instructors: instructors.length,
    retiring: retiring.length,
    captains: captains.length,
    firstOfficers: firstOfficers.length,
    fte: Math.round(fte * 10) / 10
  }
}

// Qualification breakdown split by current aircraft (A320 vs B737). Rows follow
// the given qual order (canonical rank), custom quals appended by size.
export function qualByAircraft(trainers, order) {
  const ord = order && order.length ? order : QUAL_RANK
  const map = new Map()
  for (const t of trainers) {
    const q = t.qual
    if (q === undefined || q === null || q === '') continue
    if (!map.has(q)) map.set(q, { key: q, A320: 0, B737: 0, count: 0 })
    const row = map.get(q)
    row.count += 1
    if (t.aircraft === 'A320') row.A320 += 1
    else if (t.aircraft === 'B737') row.B737 += 1
  }
  const rank = (k) => {
    const i = ord.indexOf(k)
    return i < 0 ? 999 : i
  }
  return [...map.values()].sort((a, b) => rank(a.key) - rank(b.key) || b.count - a.count)
}

// Captain vs First Officer split (each person counts once).
export function byRole(trainers) {
  let captains = 0
  let fo = 0
  for (const t of trainers) (t.role === 'fo' ? fo++ : captains++)
  return { captains, fo, total: trainers.length }
}
