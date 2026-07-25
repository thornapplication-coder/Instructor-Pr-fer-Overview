// Test runner: plain node, no dependencies, no build step.
//   npm test
import { results as merge } from './merge.test.mjs'
import { results as coverage } from './sync-coverage.test.mjs'
import { results as fte } from './fte.test.mjs'
import { results as history } from './history.test.mjs'

const fails = [...merge.fails, ...coverage.fails, ...fte.fails, ...history.fails]
console.log('')
if (fails.length) {
  console.log(`FAILED – ${fails.length} check(s):`)
  fails.forEach((f) => console.log('  · ' + f))
  process.exit(1)
}
console.log('All checks passed.')
