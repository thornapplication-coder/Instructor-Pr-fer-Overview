// Guard: every list in the app state must be merged record by record.
//
// A list that is missing from MERGE_LISTS is not an error anywhere – it simply
// falls back to whole-blob "the newer side wins", which silently loses the
// other device's edits. That is exactly the failure the record-level merge was
// built to remove, and it would come back the day someone adds a tenth list and
// forgets to register it. Hence this check.
//
// It reads store.jsx as text rather than importing it: the store is a .jsx
// module pulling in React, which node cannot load without a build step.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MERGE_LISTS } from '../src/lib/merge.js'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, '..', 'src', 'lib', 'store.jsx'), 'utf8')

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

console.log('\nsync coverage – every list is merged')

// The literal returned by freshData() is the definition of the app state.
const start = src.indexOf('function freshData(')
const end = src.indexOf('\n}', start)
ok(start > -1 && end > start, 'freshData() found in store.jsx')
const body = src.slice(start, end)

// Array-valued keys: either a seed mapped over, or an empty list.
const found = new Set()
for (const m of body.matchAll(/^\s{4}(\w+):\s*(?:\[\]|[A-Za-z_$][\w.$]*\.map\()/gm)) found.add(m[1])

ok(found.size >= 9, 'array-valued keys detected in freshData (' + [...found].join(', ') + ')')

const unmerged = [...found].filter((k) => !MERGE_LISTS.includes(k))
ok(
  unmerged.length === 0,
  unmerged.length
    ? 'NOT merged record by record: ' + unmerged.join(', ') + ' – add them to MERGE_LISTS in src/lib/merge.js'
    : 'all ' + found.size + ' lists are registered in MERGE_LISTS'
)

// And nothing registered that the state does not actually have.
const stale = MERGE_LISTS.filter((k) => !found.has(k))
ok(stale.length === 0, stale.length ? 'MERGE_LISTS names lists that no longer exist: ' + stale.join(', ') : 'no stale entries in MERGE_LISTS')

// The conversion and the planning ride inside the trainer record, which is why
// they need no list of their own – assert that this is still how it is stored.
ok(/conv:\s*\{/.test(src), 'conversion state lives inside the trainer record')
ok(/assignments:\s*mergeAssignments/.test(src), 'planning assignments live inside the trainer record')
