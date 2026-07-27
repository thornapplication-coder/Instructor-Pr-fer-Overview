// Browser checks against the real built app.
//   npm run build && npm run test:browser
//
// Playwright is not a dependency here – if the machine does not have it, this
// says so and exits 0 rather than failing a checkout that is otherwise fine.
import { loadChromium, startPreview, shotDir, hasBuild } from './harness.mjs'

const SUITES = [
  './shell.test.mjs',
  './dashboard.test.mjs',
  './review.test.mjs',
  './stamping.test.mjs',
  './board.test.mjs',
  './exports.test.mjs',
  './fte.test.mjs',
  './trend.test.mjs',
  './plan.test.mjs',
  './dates.test.mjs',
  './columns.test.mjs',
  './planning.test.mjs',
  './courses.test.mjs',
  './capacity.test.mjs'
]

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
