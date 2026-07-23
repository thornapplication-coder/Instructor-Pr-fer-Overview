// Live aggregations over the trainer list. Category orders mirror the Excel
// "Statistik_Daten" tab so the numbers line up 1:1 with the source file.
import { partTimeFactor } from './format.js'

const QUAL_ORDER = ['TRE', 'TRE/SEN', 'LTC', 'TRI', 'new TRI']
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

export function byQual(trainers) {
  return ordered(tally(trainers, (t) => t.qual), QUAL_ORDER)
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

export function pipelineDistribution(trainers, stages) {
  const map = tally(trainers, (t) => t.conv?.stage || 'nominated')
  return stages.map((s) => ({ ...s, count: map.get(s.id) || 0 }))
}

// Head-count style KPIs.
export function headcount(trainers) {
  const active = trainers.filter((t) => t.ore !== 'Rente')
  const examiners = trainers.filter((t) => t.qual.startsWith('TRE'))
  const instructors = trainers.filter((t) => t.qual === 'TRI' || t.qual === 'new TRI' || t.qual === 'LTC')
  const retiring = trainers.filter((t) => t.ore === 'Rente')
  // Weighted FTE (VZ = 1.0), ignoring non-numeric part-time strings.
  let fte = 0
  for (const t of trainers) {
    const f = partTimeFactor(t.partTime)
    fte += f == null ? 1 : f
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
