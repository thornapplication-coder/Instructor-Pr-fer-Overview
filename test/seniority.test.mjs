// Seniority: the company list, read into the roster we already have.
//
// The source document ("Seniority_Cockpit_all_bases", Stand 03.07.2026) lists
// 416 cockpit crew. Only the people already on the trainer list are touched -
// it is a lookup, never an import. Three of our fifty are not in it at all and
// stay blank on purpose: a guessed seniority date is worse than none, because
// a wrong date does not look wrong, it just sorts into the wrong place.
import { SENIORITY_BY_TLC } from '../src/data/senioritySeed.js'
import { SEED_TRAINERS } from '../src/data/seed.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

console.log('\nSeniority – the lookup itself')
{
  const keys = Object.keys(SENIORITY_BY_TLC)
  ok(keys.length === 47, 'forty-seven of the fifty trainers have a date (' + keys.length + ')')
  ok(keys.every((k) => /^[A-Z0-9]{3}$/.test(k)), 'every key is a three-character TLC')
  ok(
    Object.values(SENIORITY_BY_TLC).every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)),
    'every value is an ISO date, not the document\'s DD.MM.YYYY'
  )
  // A date that does not exist parses back to a different day. 29.02.2024 is
  // real, 29.02.2023 is not, and the difference is invisible in a string.
  const bad = Object.entries(SENIORITY_BY_TLC).filter(([, v]) => {
    const [y, m, d] = v.split('-').map(Number)
    const back = new Date(Date.UTC(y, m - 1, d))
    return back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d
  })
  ok(bad.length === 0, 'and every date is a real calendar day (' + JSON.stringify(bad) + ')')

  const years = Object.values(SENIORITY_BY_TLC).map((v) => Number(v.slice(0, 4)))
  ok(Math.min(...years) >= 2016, 'nothing predates the airline (' + Math.min(...years) + ')')
  ok(Math.max(...years) <= 2026, 'and nothing is later than the document (' + Math.max(...years) + ')')
}

console.log('\nSeniority – it matches the roster, and only the roster')
{
  const tlcs = new Set(SEED_TRAINERS.map((t) => t.tlc))
  const strays = Object.keys(SENIORITY_BY_TLC).filter((k) => !tlcs.has(k))
  // The guard that matters: 416 people in the document, 50 on our list. A key
  // that is not one of ours would mean the seed grew a person.
  ok(strays.length === 0, 'no key belongs to somebody who is not on the trainer list (' + strays.join(', ') + ')')

  const missing = [...tlcs].filter((k) => !(k in SENIORITY_BY_TLC))
  ok(missing.length === 3, 'exactly three trainers have no entry (' + missing.join(', ') + ')')
  ok(
    ['E1H', 'BV3', 'HMQ'].every((k) => missing.includes(k)),
    '  and they are the three the document does not contain'
  )

  // Two were matched by hand across a spelling difference. Pinned, so that a
  // regenerated seed which silently drops them is caught here rather than by
  // somebody noticing a blank column months later.
  ok(SENIORITY_BY_TLC.O7J === '2022-07-04', 'the hand-matched "Olmendo/Olmedo Lainz" kept its date')
  ok(SENIORITY_BY_TLC.CJ4 === '2022-03-06', 'and so did "Ceballos Serrano/Ceballos"')

  // Spot check against the document, read off page 1: Hammerer Friedrich,
  // 15.04.2016. If the DD.MM -> ISO conversion ever flips, this is where.
  ok(SENIORITY_BY_TLC.HMF === '2016-04-15', 'a known row survives the date conversion (' + SENIORITY_BY_TLC.HMF + ')')
}
