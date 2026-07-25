// The ORE card is titled "A–C", so it counts A–C and nothing else.
//
// It used to append an "—" bucket for everyone without a tier, which turned a
// missing value into a fourth category and made the card's header (the whole
// pool) disagree with the slices below it.
import { byOre } from '../src/lib/stats.js'
import { SEED_TRAINERS } from '../src/data/seed.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

console.log('\nORE – only A, B and C')
{
  const rows = byOre(SEED_TRAINERS)
  ok(rows.map((r) => r.key).join() === 'A,B,C', `exactly three rows, in order (${rows.map((r) => r.key).join(', ')})`)
  ok(rows.every((r) => ['A', 'B', 'C'].includes(r.key)), 'no "—" bucket for people without a tier')

  // Nobody may be double-counted or invented: the charted total has to be the
  // number of people who actually carry a tier.
  const charted = rows.reduce((n, r) => n + r.count, 0)
  const rated = SEED_TRAINERS.filter((t) => ['A', 'B', 'C'].includes(t.ore)).length
  ok(charted === rated, `the slices add up to the people who have a tier (${charted} = ${rated})`)
  ok(charted <= SEED_TRAINERS.length, `which is no more than everybody (${charted} <= ${SEED_TRAINERS.length})`)
}

console.log('\nORE – made-up values do not become categories')
{
  const rows = byOre([
    { ore: 'A' }, { ore: 'A' }, { ore: 'B' },
    { ore: '' }, { ore: undefined }, { ore: 'Rente' }, { ore: 'X' }
  ])
  ok(rows.length === 3, 'still exactly the three tiers')
  ok(rows.find((r) => r.key === 'A').count === 2, 'A counts its two')
  ok(rows.find((r) => r.key === 'C').count === 0, 'an empty tier stays visible at zero, so the legend never shifts')
  ok(rows.reduce((n, r) => n + r.count, 0) === 3, 'blank, unknown and the retired leftover are all simply not counted')
  ok(byOre([]).length === 3 && byOre(undefined).length === 3, 'no data still yields the three tiers, not a crash')
}
