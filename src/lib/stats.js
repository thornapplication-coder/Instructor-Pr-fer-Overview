// Live aggregations over the trainer list. Category orders mirror the Excel
// "Statistik_Daten" tab so the numbers line up 1:1 with the source file.

const QUAL_ORDER = ['SEN', 'TRE', 'TRI', 'new TRI', 'LTC', 'SFI', 'TKI']
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
export function conversionSummary(trainers) {
  let released = 0
  let notStarted = 0
  let inProgress = 0
  for (const t of trainers) {
    const stage = t.conv?.stage || 'nominated'
    if (stage === 'released') released++
    else if (stage === 'nominated') notStarted++
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
export function conversionFteSummary(trainers) {
  let total = 0
  let inConversion = 0
  let released = 0
  let notStarted = 0
  for (const t of trainers) {
    const f = typeof t.fte === 'number' ? t.fte : 1
    total += f
    const stage = t.conv?.stage || 'nominated'
    if (stage === 'released') released += f
    else if (stage === 'nominated') notStarted += f
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
  const map = tally(trainers, (t) => t.conv?.stage || 'nominated')
  return stages.map((s) => ({ ...s, count: map.get(s.id) || 0 }))
}

// Capacity per base: how much FTE sits in each base, how much is tied up in an
// active conversion, how much stays available, split by current aircraft.
// Mirrors conversionFteSummary ("in conversion" = not nominated, not released).
export function capacityByBase(trainers, aircraftList) {
  const acs = aircraftList && aircraftList.length ? aircraftList : ['A320', 'B737']
  const map = new Map()
  const get = (b) => {
    if (!map.has(b)) {
      const ac = {}
      for (const a of acs) ac[a] = 0
      map.set(b, { base: b, total: 0, inConversion: 0, headcount: 0, ac })
    }
    return map.get(b)
  }
  for (const t of trainers) {
    const fte = typeof t.fte === 'number' ? t.fte : 1
    const row = get(t.base || '—')
    row.total += fte
    row.headcount += 1
    const stage = t.conv?.stage || 'nominated'
    if (stage !== 'nominated' && stage !== 'released') row.inConversion += fte
    if (t.aircraft && row.ac[t.aircraft] != null) row.ac[t.aircraft] += fte
  }
  const rows = [...map.values()].map((r) => {
    const ac = {}
    for (const a of acs) ac[a] = round1(r.ac[a])
    return {
      base: r.base,
      headcount: r.headcount,
      total: round1(r.total),
      inConversion: round1(r.inConversion),
      available: round1(r.total - r.inConversion),
      ac
    }
  })
  rows.sort((a, b) => a.base.localeCompare(b.base))
  const totals = {
    base: '',
    headcount: rows.reduce((s, r) => s + r.headcount, 0),
    total: round1(rows.reduce((s, r) => s + r.total, 0)),
    inConversion: round1(rows.reduce((s, r) => s + r.inConversion, 0)),
    available: round1(rows.reduce((s, r) => s + r.available, 0)),
    ac: Object.fromEntries(acs.map((a) => [a, round1(rows.reduce((s, r) => s + r.ac[a], 0))]))
  }
  return { rows, totals, aircraft: acs }
}

// Head-count style KPIs.
export function headcount(trainers) {
  const EXAMINER = new Set(['SEN', 'TRE'])
  const INSTRUCTOR = new Set(['TRI', 'new TRI', 'LTC', 'SFI', 'TKI'])
  const active = trainers.filter((t) => t.ore !== 'Rente')
  const examiners = trainers.filter((t) => EXAMINER.has(t.qual) || String(t.qual).startsWith('TRE'))
  const instructors = trainers.filter((t) => INSTRUCTOR.has(t.qual))
  const retiring = trainers.filter((t) => t.ore === 'Rente')
  // Weighted FTE from the per-person editable FTE field (default 1.0).
  let fte = 0
  for (const t of trainers) {
    fte += typeof t.fte === 'number' ? t.fte : 1
  }
  return {
    total: trainers.length,
    active: active.length,
    examiners: examiners.length,
    instructors: instructors.length,
    retiring: retiring.length,
    fte: Math.round(fte * 10) / 10
  }
}
