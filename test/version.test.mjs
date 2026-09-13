// The version stands in five places. They have to agree.
//
// CLAUDE.md has said "alle vier, sonst driften sie auseinander" from early on,
// and it was kept by hand every time - until a bump script replaced only the
// FIRST occurrence in package-lock.json, where the version appears twice. The
// root said 1.64.0 and packages[""] still said 1.62.0; nothing broke, nothing
// complained, and the next `npm install` quietly rewrote the file.
//
// Nothing user-facing depends on the lockfile's copy, which is exactly why it
// can drift for months. A rule that is only written down is a rule that holds
// until somebody is in a hurry.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
const versionJs = read('src/version.js')
const changelogMd = read('CHANGELOG.md')

console.log('\nVersion – the five places agree')
{
  const appVersion = (versionJs.match(/APP_VERSION = '([^']+)'/) || [])[1]
  const jsTop = (versionJs.match(/version: '([0-9.]+)'/) || [])[1]
  const mdTop = (changelogMd.match(/^## \[([0-9.]+)\]/m) || [])[1]

  const places = {
    'package.json': pkg.version,
    'package-lock.json (root)': lock.version,
    'package-lock.json (packages[""])': lock.packages && lock.packages[''] && lock.packages[''].version,
    'src/version.js APP_VERSION': appVersion,
    'src/version.js CHANGELOG[0]': jsTop,
    'CHANGELOG.md': mdTop
  }
  const values = Object.values(places)
  const same = values.every((v) => v && v === values[0])
  ok(same, 'every place names the same version (' +
    Object.entries(places).map(([k, v]) => k.split(' ')[0] + '=' + v).join(', ') + ')')
  if (!same) {
    for (const [where, v] of Object.entries(places)) {
      if (v !== values[0]) ok(false, '  ' + where + ' says ' + v + ', not ' + values[0])
    }
  }
  ok(/^\d+\.\d+\.\d+$/.test(values[0] || ''), 'and it is a plain semver (' + values[0] + ')')
}

console.log('\nVersion – the changelog is complete and in order')
{
  const jsVersions = [...versionJs.matchAll(/version: '([0-9.]+)'/g)].map((m) => m[1])
  const mdVersions = [...changelogMd.matchAll(/^## \[([0-9.]+)\]/gm)].map((m) => m[1])
  ok(jsVersions.length === mdVersions.length,
    'both changelogs carry the same number of entries (' + jsVersions.length + ' / ' + mdVersions.length + ')')

  const onlyJs = jsVersions.filter((v) => !mdVersions.includes(v))
  const onlyMd = mdVersions.filter((v) => !jsVersions.includes(v))
  ok(onlyJs.length === 0, 'no version is only in the in-app changelog (' + (onlyJs.join(', ') || 'none') + ')')
  ok(onlyMd.length === 0, 'no version is only in CHANGELOG.md (' + (onlyMd.join(', ') || 'none') + ')')

  const dupes = jsVersions.filter((v, i) => jsVersions.indexOf(v) !== i)
  ok(dupes.length === 0, 'no version appears twice (' + (dupes.join(', ') || 'none') + ')')

  // Newest first, and each step forward - a version out of order means an entry
  // was pasted in the wrong place and will be read as history it is not.
  const num = (v) => v.split('.').map(Number)
  const desc = (a, b) => {
    const [A, B] = [num(a), num(b)]
    for (let i = 0; i < 3; i++) { if (A[i] !== B[i]) return A[i] > B[i] }
    return false
  }
  let ordered = true
  for (let i = 1; i < jsVersions.length; i++) if (!desc(jsVersions[i - 1], jsVersions[i])) ordered = false
  ok(ordered, 'the entries run newest to oldest without a gap in the order')
}
