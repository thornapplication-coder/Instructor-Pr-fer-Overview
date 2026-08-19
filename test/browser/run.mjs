// Browser checks against the real built app.
//   npm run build && npm run test:browser
//
// Playwright is not a dependency here – if the machine does not have it, this
// says so and exits 0 rather than failing a checkout that is otherwise fine.
import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadChromium, startPreview, shotDir, hasBuild } from './harness.mjs'

const SUITES = [
  './shell.test.mjs',
  './dashboard.test.mjs',
  './review.test.mjs',
  './stamping.test.mjs',
  './board.test.mjs',
  './exports.test.mjs',
  './fte.test.mjs',
  './dates.test.mjs',
  './columns.test.mjs',
  './planning.test.mjs',
  './courses.test.mjs',
  './capacity.test.mjs',
  './exportsAll.test.mjs',
  './lists.test.mjs',
  './pilots.test.mjs',
  './readonly.test.mjs',
  './trainerform.test.mjs',
  './uxfixes.test.mjs',
  './fonts.test.mjs'
]

// The list above is ordered on purpose, so it stays written out - but a suite
// that exists on disk and is not in it would run nowhere and say nothing. The
// logic runner reads its directory for the same reason; here the directory
// only has to AGREE with the list.
{
  const here = dirname(fileURLToPath(import.meta.url))
  const onDisk = readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort()
  const listed = SUITES.map((p) => p.replace('./', '')).sort()
  const missing = onDisk.filter((f) => !listed.includes(f))
  const ghosts = listed.filter((f) => !onDisk.includes(f))
  if (missing.length || ghosts.length) {
    if (missing.length) console.error('Suite file(s) not in SUITES – they would never run: ' + missing.join(', '))
    if (ghosts.length) console.error('SUITES names a file that does not exist: ' + ghosts.join(', '))
    process.exit(1)
  }
}

const chromium = await loadChromium()
if (!chromium) {
  console.log('Playwright is not available on this machine – browser checks skipped.')
  console.log('(The logic tests in `npm test` are unaffected.)')
  process.exit(0)
}
if (!hasBuild()) {
  console.error('No build found. Run `npm run build` first.')
  process.exit(1)
}

const shots = shotDir()
const preview = await startPreview()
const browser = await chromium.launch()
const fails = []

try {
  for (const path of SUITES) {
    const { default: run } = await import(path)
    fails.push(...(await run(browser, preview.url, shots)))
  }
} finally {
  await browser.close()
  preview.stop()
}

console.log('')
if (fails.length) {
  console.log(`FAILED – ${fails.length} check(s):`)
  fails.forEach((f) => console.log('  · ' + f))
  process.exit(1)
}
console.log('All browser checks passed.')
