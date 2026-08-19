// FTE arithmetic: the same people must always add up to the same number.
//
// This exists because they did not. The data sums to exactly 42.85 – right on
// the rounding boundary – and adding it person by person as floating point
// yields 42.849999999999994 while adding it base by base yields 42.85. Those
// round to 42.8 and 42.9, and the app did both in different places, so the same
// 48 people showed two different totals depending on which card you read.
import { capacityByBase, capacityByAircraft, capacityByQual, conversionFteSummary, headcount, sumFte, byQualGroup } from '../src/lib/stats.js'
import { DEFAULT_STAGES } from '../src/data/pipeline.js'
import { SEED_TRAINERS } from '../src/data/seed.js'
import { fteFromPartTime } from '../src/lib/format.js'
import { normalizeQual, conversionTrainers, OTHER_QUALS } from '../src/data/qualifications.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const stages = DEFAULT_STAGES
const AC = ['A320', 'B737']
// Mirror what the store does on load: fill `fte` from the part-time workload
// and normalise the qualification. Skipping the latter would put "TRE/SEN"
// outside the conversion pool here but inside it in the running app, and the
// numbers this file compares would no longer be the ones on screen.
const trainers = SEED_TRAINERS.map((t) => ({
  ...t,
  qual: normalizeQual(t.qual),
  fte: typeof t.fte === 'number' ? t.fte : fteFromPartTime(t.partTime)
}))
// One population: the whole roster. The "Rente" ORE tier that every capacity
// figure used to exclude no longer exists, so there is nothing to filter out.
const active = trainers

// The app shows one decimal. Rounding it has to happen on whole hundredths,
// never on a float that may sit a hair below the .x5 boundary.
const shown = (exact) => Math.round(Math.round(exact * 100) / 10) / 10

console.log('\nFTE – one population, one number')
{
  const base = capacityByBase(trainers, AC, stages)
  const ac = capacityByAircraft(trainers, AC, stages)
  const qual = capacityByQual(trainers, AC, stages)
  const direct = sumFte(active)
  const want = shown(direct)

  ok(base.totals.total === want, `grouped by base equals the direct sum (${base.totals.total} vs ${want})`)
  ok(ac.totals.total === want, `grouped by aircraft equals it too (${ac.totals.total})`)
  ok(qual.totals.total === want, `grouped by qualification equals it too (${qual.totals.total})`)
  ok(headcount(trainers).fte === want, `the dashboard tile equals it too (${headcount(trainers).fte})`)

  // The exact sum must be a whole number of hundredths – that is what makes the
  // rounding decision reproducible. 44.649999999999999 is not.
  ok(Math.abs(direct * 100 - Math.round(direct * 100)) < 1e-9,
    `the exact sum is whole hundredths (${direct})`)
}

console.log('\nFTE – a total agrees with its own columns')
for (const [name, cap] of [
  ['base', capacityByBase(trainers, AC, stages)],
  ['aircraft', capacityByAircraft(trainers, AC, stages)],
  ['qualification', capacityByQual(trainers, AC, stages)]
]) {
  const t = cap.totals
  const diff = Math.round((t.total - t.inConversion) * 100) / 100
  ok(diff === t.available, `${name}: total - in conversion = available (${t.total} - ${t.inConversion} = ${t.available})`)
  // Summing the printed rows may differ from the printed total by at most one
  // rounding step per row – but the total itself must come from the raw sum.
  const rowSum = Math.round(cap.rows.reduce((s, r) => s + r.total, 0) * 100) / 100
  ok(Math.abs(rowSum - t.total) <= cap.rows.length * 0.05,
    `${name}: the printed rows stay within rounding distance of the total (${rowSum} vs ${t.total})`)
}

// The seed has nobody mid-conversion, so "total - in conversion = available"
// holds there for the trivial reason. Force people into a middle stage across a
// range of part-time factors and check the subtraction on the printed values,
// where rounding each column on its own goes wrong by 0.1.
console.log('\nFTE – the subtraction holds when people ARE in conversion')
{
  const mid = stages[Math.floor(stages.length / 2)].id
  let worst = null
  for (let take = 1; take <= active.length; take++) {
    const list = active.map((t, i) => (i < take ? { ...t, conv: { stage: mid } } : t))
    for (const cap of [capacityByBase(list, AC, stages), capacityByAircraft(list, AC, stages), capacityByQual(list, AC, stages)]) {
      for (const r of [...cap.rows, cap.totals]) {
        const diff = Math.round((r.total - r.inConversion) * 100) / 100
        if (diff !== r.available) worst = `${take} in conversion, row "${r.key}": ${r.total} - ${r.inConversion} = ${diff}, but the column says ${r.available}`
      }
    }
    const conv = conversionFteSummary(conversionTrainers(list), stages)
    const d = Math.round((conv.total - conv.inConversion) * 100) / 100
    if (d !== conv.available) worst = `${take} in conversion, summary: ${conv.total} - ${conv.inConversion} = ${d}, column says ${conv.available}`
  }
  ok(worst === null, worst || `every row subtracts correctly across all ${active.length} conversion sizes`)

  // The seed never happens to land on the bad residue, so pin it explicitly.
  // Rounding each column on its own turns 0.05 total / 0.04 in conversion into
  // "0,1 − 0,0 = 0,0". Hand-entered FTE values reach these figures easily.
  const edge = [
    { id: 'e1', qual: 'TRI', base: 'PMI', aircraft: 'A320', fte: 0.04, conv: { stage: mid } },
    { id: 'e2', qual: 'TRI', base: 'PMI', aircraft: 'A320', fte: 0.01, conv: { stage: stages[0].id } }
  ]
  const er = capacityByBase(edge, AC, stages).rows[0]
  ok(Math.round((er.total - er.inConversion) * 100) / 100 === er.available,
    `the 0,05/0,04 boundary case still subtracts (${er.total} - ${er.inConversion} = ${er.available})`)
}

console.log('\nFTE – the scopes are what they claim to be')
{
  const hc = headcount(trainers)
  const all = sumFte(trainers)
  ok(hc.fte === shown(all), `the headline FTE is the whole roster (${hc.fte})`)
  // The old "excluding retirees" variant is gone with the tier itself. Assert
  // it is really gone rather than silently equal, or a stale caller reading
  // hc.fteActive would get undefined and print "NaN" on a card.
  ok(hc.fteActive === undefined && hc.active === undefined,
    'there is no second "active" population hiding behind another name')

  // The conversion figures cover SEN/TRE/TRI/LTC only, so they can never exceed
  // the overall total – that difference is a scope, not a discrepancy. (With
  // today's data every trainer holds a conversion qual, so the two are equal.)
  const conv = conversionFteSummary(conversionTrainers(active), stages)
  ok(conv.total <= hc.fte, `the conversion scope is a subset (${conv.total} <= ${hc.fte})`)
  ok(Math.round((conv.inConversion + conv.available) * 100) / 100 === conv.total,
    `in conversion + available = total (${conv.inConversion} + ${conv.available} = ${conv.total})`)
}

console.log('\nFTE – the sum does not depend on the order it is added in')
{
  const shuffled = [...active].reverse()
  ok(sumFte(shuffled) === sumFte(active), 'reversing the list changes nothing')
  // Grouping arbitrarily and summing the groups must give the identical value.
  const groups = [[], [], []]
  active.forEach((t, i) => groups[i % 3].push(t))
  const viaGroups = Math.round(groups.reduce((s, g) => s + sumFte(g) * 100, 0)) / 100
  ok(viaGroups === sumFte(active), `summing three arbitrary groups gives the same (${viaGroups})`)
}


console.log('\nThe four groups that are not one of our trainer grades')
{
  const people = [
    { id: 'a', qual: 'TREX', fte: 1 },
    { id: 'b', qual: 'TREX', fte: 0.5 },
    { id: 'c', qual: 'TRIX', fte: 0.5 },
    { id: 'd', qual: 'NOTR', fte: 1 },
    // Not one of the four, and it must not leak into any of them.
    { id: 'e', qual: 'TRI', fte: 1 }
  ]
  const g = byQualGroup(people, OTHER_QUALS)
  ok(g.rows.length === 4, 'four groups asked for, four rows back (' + g.rows.length + ')')
  ok(g.rows.map((r) => r.key).join(',') === OTHER_QUALS.join(','),
    'in the order they were asked for (' + g.rows.map((r) => r.key).join(', ') + ')')
  ok(g.rows[0].count === 2 && g.rows[0].fte === 1.5, 'a group counts its people and their FTE (2 / 1.5)')
  // A group at zero is an answer. Dropping the row would leave the reader
  // unable to tell "none" from "not asked about".
  ok(g.rows[3].count === 0 && g.rows[3].fte === 0, 'a group with nobody in it keeps its row at zero')
  ok(g.totals.count === 4 && g.totals.fte === 3,
    'the total covers the four and nothing else (' + g.totals.count + ' / ' + g.totals.fte + ')')

  // The grand total comes from the raw people, never from adding up rows that
  // have already been rounded - the same rule every other FTE figure follows.
  const thirds = [
    { id: 'x', qual: 'TREX', fte: 0.05 },
    { id: 'y', qual: 'TRIX', fte: 0.05 },
    { id: 'z', qual: 'NOTR', fte: 0.05 }
  ]
  const t3 = byQualGroup(thirds, OTHER_QUALS)
  ok(t3.totals.fte === 0.15, 'three times 0.05 is 0.15, not 0.15000000000000002 (' + t3.totals.fte + ')')

  ok(byQualGroup(null, OTHER_QUALS).totals.count === 0, 'no people at all is zero, not a crash')
  ok(byQualGroup(people, []).rows.length === 0, 'no groups asked for is no rows')
}
