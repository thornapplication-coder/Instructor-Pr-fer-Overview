// An identifier that is exported somewhere in src/ and used in a file that
// never imports it is a ReferenceError the bundler does NOT catch: Rollup
// resolves modules, not free variables, so `npm run build` stays green and the
// app dies white on the tab that uses it.
//
// This has now happened twice in one day (`resolveAssignment` on the board,
// `CATEGORICAL` on the dashboard), both times only found by a browser run
// several minutes long. This is the same check in a second.
import fs from 'fs'
import path from 'path'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (/\.(js|jsx)$/.test(f)) out.push(p)
  }
  return out
}

const files = walk('src')
// Every name any module exports, and the names re-exported through another.
const exportedNames = new Set()
for (const p of files) {
  const src = fs.readFileSync(p, 'utf8')
  for (const m of src.matchAll(/export (?:const|let|function|class) ([A-Za-z_$][\w$]*)/g)) exportedNames.add(m[1])
  for (const m of src.matchAll(/export \{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const as = part.trim().split(/\s+as\s+/)
      if (as.length > 1) exportedNames.add(as[1].trim())
      else if (as[0].trim()) exportedNames.add(as[0].trim())
    }
  }
}

const IMPORT_RE = /^import\s+([\s\S]*?)\s+from\s+'[^']*'$/gm
function namesInScope(src) {
  const names = new Set()
  for (const m of src.matchAll(IMPORT_RE)) {
    const clause = m[1]
    for (const inner of clause.matchAll(/\{([^}]*)\}/g)) {
      for (const part of inner[1].split(',')) {
        const as = part.trim().split(/\s+as\s+/)
        const n = (as[1] || as[0] || '').trim()
        if (n) names.add(n)
      }
    }
    const bare = clause.replace(/\{[^}]*\}/g, '').replace(/\*\s+as\s+/, '').split(',')
    for (const b of bare) { const n = b.trim(); if (n && /^[A-Za-z_$][\w$]*$/.test(n)) names.add(n) }
  }
  // Destructured function parameters – `function X({ a, b })` and `({ a }) =>`
  // put those names in scope just as firmly as a const does.
  for (const m of src.matchAll(/(?:function\s*[A-Za-z_$][\w$]*\s*|=>|\()\s*\{([^{}]*)\}\s*(?:\)|=>)/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(':').pop().trim().split('=')[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n)
    }
  }
  // Anything declared in the file itself, at any depth.
  for (const m of src.matchAll(/(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1])
  // `export { x as y }` puts BOTH names in scope of the exporting file.
  for (const m of src.matchAll(/export \{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) for (const n of part.trim().split(/\s+as\s+/)) if (n.trim()) names.add(n.trim())
  }
  for (const m of src.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(':').pop().trim().split('=')[0].trim()
      if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n)
    }
  }
  return names
}

console.log('\nImports – nothing used that is not in scope')
{
  const missing = []
  for (const p of files) {
    const src = fs.readFileSync(p, 'utf8')
    // Comments and string literals are prose: "stable", "headcount" and
    // "CHANGELOG" all occur there as ordinary English and are not references.
    const body = src
      .replace(IMPORT_RE, '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/`(?:\\.|[^`\\])*`/g, '``')
    const scope = namesInScope(src)
    for (const name of exportedNames) {
      if (scope.has(name)) continue
      // A bare identifier: not a property access, not an object key, not part
      // of a longer word, and not inside a string or a JSX attribute name.
      if (new RegExp('(?<![\\w.$\'"])' + name + '(?![\\w:$\'"])').test(body)) {
        missing.push(name + ' in ' + p)
      }
    }
  }
  ok(missing.length === 0, 'every exported identifier used in a file is imported there' + (missing.length ? ': ' + missing.join(', ') : ''))
}
