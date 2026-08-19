// Display helpers. Keep pure (no side effects) so they are easy to reuse.

// Part-time can be a number (0.8) or a string ("VZ", "DEC", "80% + NOV").
export function formatPartTime(pt, lang) {
  if (pt === null || pt === undefined || pt === '') return '–'
  if (typeof pt === 'number') {
    if (pt >= 1) return lang === 'de' ? 'VZ' : 'FT'
    return Math.round(pt * 100) + '%'
  }
  const s = String(pt).trim()
  if (s === 'VZ') return lang === 'de' ? 'VZ' : 'FT'
  return s
}

// Numeric part-time factor for aggregation (VZ = 1.0, unknown strings ignored).
export function partTimeFactor(pt) {
  if (typeof pt === 'number') return pt
  const s = String(pt || '').trim()
  if (s === 'VZ') return 1
  const m = s.match(/(\d+)\s*%/)
  if (m) return Number(m[1]) / 100
  return null
}

// FTE follows the part-time workload: VZ / full / unknown -> 1.0 (100%),
// a part-time factor otherwise. Clamped to a sane range.
export function fteFromPartTime(pt) {
  const f = partTimeFactor(pt)
  if (f == null) return 1
  return Math.max(0, Math.min(2, f))
}

// Compact FTE display: 1, 0,8, 0,75 (no trailing zeros), in the reader's
// notation.
//
// Two decimals rather than formatFte1's one, because a person's own FTE is a
// contract figure: 0.75 is three quarters, and rounding it to "0,8" on the row
// that names them would be wrong in a way a total never is. The notation is
// the same rule though - this column sits on the same screen as the dashboard
// hero, and "0.75" beside "44,7" is the mixed-notation defect the changelog
// already recorded once.
export function formatFte(fte, lang) {
  const n = typeof fte === 'number' ? fte : 1
  const s = String(Number(n.toFixed(2)))
  return lang === 'de' ? s.replace('.', ',') : s
}

// Issuing authority is stored/entered as "EASA - Austria"; only the country is
// of interest, so the EASA prefix (and its separator) is stripped. A value that
// carries no country ("EASA") is kept as-is so nothing is lost.
export function normalizeAuthority(a) {
  const s = String(a == null ? '' : a).trim()
  if (!s) return ''
  // "EASA" must be followed by the end of the string or a non-alphanumeric
  // separator, so "EASAX Land" is left alone; the separator run itself is then
  // consumed (covers "-", "_", ":", "/", en/em dash, whitespace, …).
  const m = /^easa(?=$|[^A-Za-z0-9])[\s._:;,|/\\–—-]*(.*)$/i.exec(s)
  if (!m) return s
  const rest = m[1].trim()
  return rest || s
}

export function formatDate(iso, lang) {
  if (!iso) return '–'
  // Non-date strings (e.g. "C weil 25%") pass through unchanged.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const [, y, mo, d] = m
  return lang === 'de' ? `${d}.${mo}.${y}` : `${y}-${mo}-${d}`
}

// Split "Nachname, Vorname" for compact display where useful.
export function shortName(name) {
  return (name || '').split('(')[0].trim()
}

export function classNames(...xs) {
  return xs.filter(Boolean).join(' ')
}

export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// FTE with one decimal, in the reader's notation. Lives here rather than in a
// tab so the dashboard and the capacity tab cannot print the same figure two
// different ways ("4,6" vs "4.6"), which is exactly what happened once.
export function formatFte1(value, lang) {
  return formatNum1(value, lang)
}

// The same one-decimal rule for anything that is not an FTE – course lengths,
// axis ticks. Same reason: two notations for the same figure on one page is
// how "38.9" once ended up next to "38,9".
export function formatNum1(value, lang) {
  const n = typeof value === 'number' ? value : Number(value) || 0
  const s = (Math.round(n * 10) / 10).toString()
  return lang === 'de' ? s.replace('.', ',') : s
}
