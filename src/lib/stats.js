// Live aggregations over the trainer list. Category orders mirror the Excel
// "Statistik_Daten" tab so the numbers line up 1:1 with the source file.
import { firstStageId, releasedStageId } from '../data/pipeline.js'
import { isConversionQual, isInternal } from '../data/qualifications.js'
import { findRun, resolveAssignment } from './courses.js'

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

const QUAL_ORDER = ['SEN', 'TRE', 'TRI', 'LTC', 'SFI', 'TKI', 'TREX', 'TRIX', 'NOTR', 'EIS']
export const BASE_ORDER = ['PMI', 'VIE', 'SZG', 'PRG', 'ARN']
const ORE_ORDER = ['A', 'B', 'C']

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
// Only the real priority tiers. Somebody without an ORE is not a fourth
// category – the card is titled "A–C" and that is exactly what it counts, so
// its total is the people who actually carry a tier, not the whole pool.
export function byOre(trainers) {
  const rated = (trainers || []).filter((t) => ORE_ORDER.includes(t.ore))
  return ordered(tally(rated, (t) => t.ore), ORE_ORDER)
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
// ---------------------------------------------------------------- FTE ------
//
// WHAT AN FTE IS HERE: the sum of the per-person FTE field. That field defaults
// to the part-time workload – full time 1.0, 90 % 0.9, 80 % 0.8, 75 % 0.75,
// 60 % 0.6 … – and can be overridden per person in the trainer dialog. 50
// people at various part-time levels are therefore "44.65 FTE", not 50.
//
// There is exactly ONE population now: everybody on the list. The "Rente" ORE
// tier that used to be excluded from every capacity figure no longer exists.
//
// WHY IT IS COUNTED IN HUNDREDTHS: adding those values as floating point does
// not commute. Added group by group the data can come out a hair below a .x5
// boundary and round the other way, so the same people showed two different
// totals depending on which card you read. Whole hundredths remove the question.
export const fteOf = (t) => (typeof t?.fte === 'number' ? t.fte : 1)
const cents = (t) => Math.round(fteOf(t) * 100)

/** Exact FTE total of a list of trainers (see the note above). */
export function sumFte(list) {
  let c = 0
  for (const t of list) c += cents(t)
  return c / 100
}

// Round to one decimal from a hundredths integer, so the rounding decision is
// never made on a float that is a hair below the .x5 boundary.
const round1c = (c) => Math.round(c / 10) / 10

// "verfügbar" is derived from the two numbers next to it, not rounded on its
// own: rounding total and inConversion separately and rounding their difference
// separately disagree by 0.1 whenever the discarded hundredths fall either side
// of the .x5 boundary (e.g. 4.35 - 0.04 shows as "4,4 - 0,0 = 4,3"). A column
// that visibly fails its own subtraction is exactly what this release is about,
// so the displayed row is made to add up; the cost is at most 0.05 on this one
// cell, which the one-decimal display cannot show anyway.
const availOf = (totalC, convC) => Math.round((round1c(totalC) - round1c(convC)) * 100) / 100

export function conversionFteSummary(trainers, stages) {
  const { firstId, releasedId, stageOf } = stageResolver(stages)
  let total = 0
  let inConversion = 0
  let released = 0
  let notStarted = 0
  for (const t of trainers) {
    const f = cents(t)
    total += f
    const stage = stageOf(t)
    if (stage === releasedId) released += f
    else if (stage === firstId) notStarted += f
    else inConversion += f
  }
  return {
    total: round1c(total),
    inConversion: round1c(inConversion),
    available: availOf(total, inConversion),
    released: round1c(released),
    notStarted: round1c(notStarted)
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
// `seedKeys` guarantees those rows exist even when no trainer matches them, so
// e.g. the B737 row stays visible (all zeros) instead of vanishing.
function capacityBy(trainers, keyFn, aircraftList, order, stages, seedKeys) {
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
  for (const k of seedKeys || []) get(k)
  for (const t of trainers) {
    const fte = cents(t)
    const row = get(keyFn(t))
    row.total += fte
    row.headcount += 1
    // Only conversion-scope qualifications can be "in Umschulung"; otherwise an
    // SFI with a leftover stage would inflate this column past the FTE pills,
    // which are computed over the conversion pool.
    const stage = stageOf(t)
    // Same rule as conversionTrainers(): an external trainer is never "in
    // Umschulung", so their FTE must not appear in that column either - it
    // would contradict the pills above the table, which count the pool.
    if (isConversionQual(t.qual) && isInternal(t) && stage !== firstId && stage !== releasedId) row.inConversion += fte
    if (t.aircraft && row.ac[t.aircraft] != null) row.ac[t.aircraft] += fte
  }
  const raw = [...map.values()]
  const rows = raw.map((r) => {
    const ac = {}
    for (const a of acs) ac[a] = round1c(r.ac[a])
    return {
      key: r.key,
      headcount: r.headcount,
      total: round1c(r.total),
      inConversion: round1c(r.inConversion),
      available: availOf(r.total, r.inConversion),
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
  // Totals come from the RAW sums, never from the already-rounded rows: five
  // rows each rounded by up to 0.05 could otherwise put the total a quarter of
  // an FTE away from the truth, and make the total row disagree with its own
  // columns (total - inConversion != available).
  const totalCents = (pick) => raw.reduce((s, r) => s + pick(r), 0)
  const totals = {
    key: '',
    headcount: raw.reduce((s, r) => s + r.headcount, 0),
    total: round1c(totalCents((r) => r.total)),
    inConversion: round1c(totalCents((r) => r.inConversion)),
    available: availOf(totalCents((r) => r.total), totalCents((r) => r.inConversion)),
    ac: Object.fromEntries(acs.map((a) => [a, round1c(totalCents((r) => r.ac[a]))]))
  }
  return { rows, totals, aircraft: acs }
}

// Same base order as byBase(): the dashboard shows both next to each other, and
// two cards listing the bases in different orders invite reading row 1 against
// row 1 and comparing the wrong two.
export function capacityByBase(trainers, aircraftList, stages) {
  return capacityBy(trainers, (t) => t.base || '—', aircraftList, BASE_ORDER, stages)
}

// FTE capacity grouped by the trainer's CURRENT aircraft. Every known aircraft
// keeps its row even at zero, so B737 stays visible before the phase-in starts.
export function capacityByAircraft(trainers, aircraftList, stages) {
  const acs = aircraftList && aircraftList.length ? aircraftList : ['A320', 'B737']
  return capacityBy(trainers, (t) => t.aircraft || '—', acs, acs, stages, acs)
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
export const QUAL_RANK = ['SEN', 'TRE', 'TRI', 'LTC', 'SFI', 'TKI', 'TREX', 'TRIX', 'NOTR', 'EIS']

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
//
// Seats a provider can take IN TOTAL over the planning window, overall and per
// course type. Not per month: the months are not alike, and one rate per
// provider could not say "four type ratings in November, none in December".
// That distribution is `providerMonths()` below; these two are the agreed total
// it is measured against.
//
// The overall figure is typed, because that is the contract ("we have forty
// seats with them"). Where it is not typed the breakdown stands in for it, so
// the same number never has to be entered twice.
export function providerSlots(provider, steps) {
  const byStep = {}
  let sum = 0
  for (const s of steps || []) {
    const n = Math.max(0, Math.round(Number(provider?.slotsByStep?.[s.id]) || 0))
    byStep[s.id] = n
    sum += n
  }
  const typed = Math.max(0, Math.round(Number(provider?.slots) || 0))
  return { total: typed > 0 ? typed : sum, byStep, split: sum, splitOver: typed > 0 && sum > typed }
}

const seatsOf = (v) => Math.max(0, Math.round(Number(v) || 0))

/**
 * One provider's monthly plan, read as rows.
 *
 * `months` decides what comes back, so the caller – the configured window, or
 * the dialog's own list of filled months – is the only thing that has to know
 * which months matter. A month with no entry is still a row, at zero: a
 * timeline that silently omits its empty months is a list, and the gaps are
 * exactly what a planner is looking for.
 */
export function providerMonths(provider, steps, months) {
  const stepIds = (steps || []).map((s) => s.id)
  return (months || []).map((month) => {
    const stored = provider?.slotsByMonth?.[month] || {}
    const byStep = {}
    let total = 0
    for (const id of stepIds) {
      const n = seatsOf(stored[id])
      byStep[id] = n
      total += n
    }
    return { month, byStep, total }
  })
}

/**
 * The monthly plan summed across providers – the timeline the capacity tab
 * draws. `providers` is already filtered by the caller, so "all of them" and
 * "just TUI" are the same code path.
 */
export function capacityByMonth(providers, steps, months) {
  const stepIds = (steps || []).map((s) => s.id)
  const rows = (months || []).map((month) => {
    const byStep = Object.fromEntries(stepIds.map((id) => [id, 0]))
    let total = 0
    for (const p of providers || []) {
      const stored = p?.slotsByMonth?.[month] || {}
      for (const id of stepIds) {
        const n = seatsOf(stored[id])
        byStep[id] += n
        total += n
      }
    }
    return { month, byStep, total }
  })
  const totals = { byStep: Object.fromEntries(stepIds.map((id) => [id, 0])), total: 0 }
  for (const r of rows) {
    for (const id of stepIds) totals.byStep[id] += r.byStep[id]
    totals.total += r.total
  }
  return { rows, totals }
}

/**
 * Does the month-by-month plan promise more than the agreed total?
 *
 * A warning, never a block – the same rule the seat count on a course date
 * follows. A provider really can find one more slot, and an app that refuses
 * the entry just gets worked around in a notes field. Reported per course type
 * AND overall, because either can be over on its own: four course types each
 * inside their own figure can still break the grand total.
 *
 * `months` is what gets counted. The dialog passes the provider's OWN months,
 * not the configured window: a month that fell outside the window still holds
 * seats somebody typed, it is still shown (and flagged), and leaving it out of
 * the sum would report a plan that adds up while the stored one does not.
 */
export function providerPlanCheck(provider, steps, months) {
  const slots = providerSlots(provider, steps)
  const rows = providerMonths(provider, steps, months)
  const planned = {}
  let plannedTotal = 0
  for (const s of steps || []) planned[s.id] = 0
  for (const r of rows) {
    for (const s of steps || []) planned[s.id] += r.byStep[s.id]
    plannedTotal += r.total
  }
  // Only a typed figure can be exceeded. Where nothing is typed the plan IS the
  // figure, and a plan cannot contradict itself.
  const overSteps = (steps || []).filter((s) => slots.byStep[s.id] > 0 && planned[s.id] > slots.byStep[s.id])
  const typedTotal = seatsOf(provider?.slots)
  return { planned, plannedTotal, overSteps, overTotal: typedTotal > 0 && plannedTotal > typedTotal, typedTotal }
}

// `runs` are the course dates: a booking made through one carries the provider
// on the COURSE, not on the person. Without resolving that, every properly
// booked trainer would count as no demand at all and the utilisation bars would
// read empty for exactly the providers that are busiest.
export function providerUtilization(trainers, providers, steps, runs) {
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
      if (!a) continue
      if (a.status === 'na' || a.status === 'done') continue
      const r = resolveAssignment(a, findRun(runs, a.courseId))
      if (!r.providerId) continue
      bump(r.providerId, s, { trainer: t, step: s, date: r.from, status: a.status || 'open' })
    }
  }
  return providers
    .map((p) => {
      const d = demand.get(p.id) || { total: 0, byStep: {}, people: [] }
      const slots = providerSlots(p, steps)
      return {
        provider: p,
        demand: d.total,
        byStep: d.byStep,
        slots: slots.total,
        slotsByStep: slots.byStep,
        // The breakdown promising more than the overall figure is a warning,
        // not an error: a provider really can shuffle a slot between courses.
        slotsSplitOver: slots.splitOver,
        util: slots.total > 0 ? d.total / slots.total : null,
        people: d.people
      }
    })
    .sort((a, b) => (a.provider.name || '').localeCompare(b.provider.name || ''))
}

// Head-count style KPIs. Qualification tiles follow the canonical rank
// SEN · TRE · TRI · LTC · SFI · TKI; each person counts once (no double-count).
// There is no `active` / `fteActive` counterpart any more: they existed only to
// leave the "Rente" tier out, and with that tier gone they were the identical
// number under a second name – which is precisely the ambiguity this file has
// spent two releases removing.
export function headcount(trainers) {
  const EXAMINER = new Set(['SEN', 'TRE'])
  let examiners = 0
  let tri = 0
  let ltc = 0
  let sfiTki = 0
  let captains = 0
  let firstOfficers = 0
  let fte = 0
  for (const t of trainers) {
    if (EXAMINER.has(t.qual) || String(t.qual).startsWith('TRE')) examiners++
    else if (t.qual === 'TRI') tri++
    else if (t.qual === 'LTC') ltc++
    else if (t.qual === 'SFI' || t.qual === 'TKI') sfiTki++
    if (t.role === 'fo') firstOfficers++
    else captains++
    // Weighted FTE from the per-person editable FTE field (default 1.0).
    fte += cents(t)
  }
  return {
    total: trainers.length,
    examiners,
    tri,
    ltc,
    sfiTki,
    captains,
    firstOfficers,
    fte: round1c(fte)
  }
}

// Qualification breakdown split by current aircraft. Columns come from
// `aircraftList` (not hardcoded), so adding a type in data/aircraft.js is
// picked up here too. Rows follow the given qual order, custom quals by size.
export function qualByAircraft(trainers, order, aircraftList) {
  const ord = order && order.length ? order : QUAL_RANK
  const acs = aircraftList && aircraftList.length ? aircraftList : ['A320', 'B737']
  const map = new Map()
  for (const t of trainers) {
    const q = t.qual
    if (q === undefined || q === null || q === '') continue
    if (!map.has(q)) {
      const row = { key: q, count: 0 }
      for (const a of acs) row[a] = 0
      map.set(q, row)
    }
    const row = map.get(q)
    row.count += 1
    if (t.aircraft && row[t.aircraft] != null) row[t.aircraft] += 1
  }
  const rank = (k) => {
    const i = ord.indexOf(k)
    return i < 0 ? 999 : i
  }
  return [...map.values()].sort((a, b) => rank(a.key) - rank(b.key) || b.count - a.count)
}
