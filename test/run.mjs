// Test runner: plain node, no dependencies, no build step.
//   npm test
//
// The suites are read from the directory, not from a list kept by hand.
//
// This file used to name every suite twice - once as an import and once in the
// `fails` spread - and it is the ONLY thing between a commit and the live site
// (.github/workflows/deploy.yml gates the deploy on `npm test`). Forget the
// import and the suite never runs; forget the spread and it runs, prints FAIL
// and the process still exits 0. Either way CI stays green and a broken build
// publishes. Both halves are now derived from what is on disk, and a file that
// does not export `results` is a failure rather than a silent skip.
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const files = readdirSync(HERE)
  .filter((f) => f.endsWith('.test.mjs'))
  .sort()

const fails = []
for (const file of files) {
  const mod = await import('./' + file)
  if (!mod.results || !Array.isArray(mod.results.fails)) {
    fails.push(file + ': exports no `results.fails` – the runner cannot see whether it passed')
    continue
  }
  fails.push(...mod.results.fails)
}

console.log('')
if (!files.length) {
  console.log('No test files found – that is a broken checkout, not a pass.')
  process.exit(1)
}
if (fails.length) {
  console.log(`FAILED – ${fails.length} check(s):`)
  fails.forEach((f) => console.log('  · ' + f))
  process.exit(1)
}
console.log(`All checks passed (${files.length} suites).`)
