// Test runner: plain node, no dependencies, no build step.
//   npm test
import { results as merge } from './merge.test.mjs'
import { results as coverage } from './sync-coverage.test.mjs'
import { results as fte } from './fte.test.mjs'
import { results as exports } from './exports.test.mjs'
import { results as ore } from './ore.test.mjs'
import { results as courses } from './courses.test.mjs'
import { results as capacity } from './capacity.test.mjs'
import { results as imports } from './imports.test.mjs'

const fails = [...merge.fails, ...coverage.fails, ...fte.fails, ...exports.fails, ...ore.fails, ...courses.fails, ...capacity.fails, ...imports.fails]
console.log('')
if (fails.length) {
  console.log(`FAILED – ${fails.length} check(s):`)
  fails.forEach((f) => console.log('  · ' + f))
  process.exit(1)
}
console.log('All checks passed.')
