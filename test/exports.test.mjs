// What the exports carry in their footer – and that the import still knows to
// throw that footer away.
//
// These two are one thing, not two: the Excel importer recognises the app's own
// banner and footer rows by their text. Change the footer without changing the
// matcher and re-importing our own export silently gains a trainer named after
// it. That has happened before, which is why the guard is a test.
import { footerLine } from '../src/lib/brand.js'
import { isExportBanner } from '../src/lib/importExcel.js'
import { APP_VERSION, COPYRIGHT } from '../src/version.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

console.log('\nExports – no byline in the footer')
{
  const line = footerLine()
  ok(!/copyright/i.test(line), `the footer carries no copyright notice ("${line}")`)
  ok(!line.includes('©'), 'nor the © sign')
  ok(!/thorn/i.test(line), 'nor the author name')
  // The version stays: on a printed page it is the only way to tell which build
  // produced the numbers.
  ok(line.includes(APP_VERSION), `but it still names the build (${APP_VERSION})`)
}

console.log('\nExports – the importer still skips our own rows')
{
  const row = (v) => [v, '', '']
  ok(isExportBanner(row(footerLine())),
    `the current footer is recognised and dropped on re-import ("${footerLine()}")`)
  ok(isExportBanner(row('737 TRAINER · Trainer')), 'so is the banner row')

  // Files exported BEFORE the copyright was dropped still carry it. Re-importing
  // one of those has to keep working.
  ok(isExportBanner(row(`${COPYRIGHT} · v1.22.1`)), 'and so is the old copyright footer')

  // Real data must survive: none of these may be mistaken for a banner.
  ok(!isExportBanner(row('Senior 737 Trainer')), 'a remark mentioning 737 Trainer is NOT a banner')
  ok(!isExportBanner(row('Thorn, Patrick')), 'and neither is a person')
  ok(!isExportBanner(row('v1')), 'a bare "v1" is not a version footer either')
  ok(!isExportBanner(row('')), 'an empty cell is not a banner')
}
