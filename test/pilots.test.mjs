// Other pilots: several Boeing ratings per person, and a validity that is
// never stored. "Gültig"/"Abgelaufen" are columns of the roster this replaces,
// but a stored flag is wrong the morning after it is written, so both are
// worked out against today every time they are drawn.
import { pilotValidity, ratingValid, normalizeTlc, withPilotDefaults } from '../src/data/pilots.js'
import { SEED_PILOTS } from '../src/data/pilotsSeed.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }
const TODAY = new Date(2026, 6, 27) // 27.07.2026

console.log('\nOther pilots – validity is computed, never stored')
{
  ok(ratingValid({ until: '2026-09-30' }, TODAY) === true, 'a date in the future is valid')
  ok(ratingValid({ until: '2026-06-30' }, TODAY) === false, 'a date in the past is expired')
  ok(ratingValid({ until: '2026-07-27' }, TODAY) === true, 'expiring today still counts for the whole day')
  ok(ratingValid({ until: '' }, TODAY) === null, 'no date is not a verdict either way')
  ok(ratingValid(null, TODAY) === null, 'and neither is no rating at all')

  // The case the spreadsheet marks with an x in BOTH columns.
  const two = { ratings: [{ until: '2026-06-30' }, { until: '2026-09-30' }] }
  const v = pilotValidity(two, TODAY)
  ok(v.valid === true && v.expired === true,
    'somebody with one lapsed and one current rating is both, exactly as the roster shows it')
  ok(pilotValidity({ ratings: [] }, TODAY).valid === false, 'no ratings is not "valid"')
  ok(pilotValidity({ ratings: [{ until: '' }] }, TODAY).expired === false, 'a rating with no date is not "expired" either')
  ok(pilotValidity(null, TODAY).valid === false, 'no pilot at all is not a crash')
}

console.log('\nOther pilots – the record')
{
  ok(normalizeTlc('abc') === 'ABC', 'a TLC is upper case')
  ok(normalizeTlc('ab-c1') === 'ABC', 'punctuation is dropped')
  ok(normalizeTlc('ABCDEF') === 'ABC', 'and it is three characters, never more')
  ok(normalizeTlc('') === '', 'empty stays empty – the column is optional')

  // The old single-rating shape has to survive.
  const old = withPilotDefaults({ id: 'p', name: 'X', status: 'valid', b737Until: '2027-01-31' })
  ok(old.ratings.length === 1 && old.ratings[0].type === '737', 'an old record becomes one 737 rating')
  ok(old.ratings[0].until === '2027-01-31', 'keeping its date')
  ok(old.status === undefined && old.b737Until === undefined, 'and the old fields are gone, not carried alongside')
  const exp = withPilotDefaults({ id: 'p', name: 'X', status: 'experience' })
  ok(exp.boeingExp === true && exp.ratings.length === 0, 'Boeing experience without a rating becomes the flag')
  ok(withPilotDefaults({ id: 'p' }).ratings.length === 0, 'a blank record has no ratings, not one empty one')
}

console.log('\nOther pilots – the roster that was imported')
{
  ok(SEED_PILOTS.length === 65, 'sixty-five people (' + SEED_PILOTS.length + ')')
  const ratings = SEED_PILOTS.reduce((n, p) => n + p.ratings.length, 0)
  ok(ratings === 71, 'seventy-one ratings – six people hold two (' + ratings + ')')
  ok(SEED_PILOTS.every((p) => /^[^,]+, .+$/.test(p.name)), 'every name reads "Nachname, Vorname"')
  ok(SEED_PILOTS.every((p) => p.ratings.every((r) => !r.until || /^\d{4}-\d{2}-\d{2}$/.test(r.until))),
    'every date is a real ISO date, not the sheet\'s M/D/YY')
  ok(SEED_PILOTS.every((p) => p.id && p.ratings.every((r) => r.id)), 'and everything carries an id the merge can use')
  const multi = SEED_PILOTS.filter((p) => p.ratings.length > 1)
  ok(multi.length === 6, 'the six with two ratings came through as one person, not two (' + multi.length + ')')
  const jerry = SEED_PILOTS.find((p) => p.name.startsWith('Altenhuber'))
  ok(jerry.ratings.map((r) => r.type).join('/') === '777/787/757/767', 'both of the first row\'s types are on one record')
  const jv = pilotValidity(jerry, TODAY)
  ok(jv.valid && jv.expired, 'and he is both valid and expired, like the source sheet says')
}
