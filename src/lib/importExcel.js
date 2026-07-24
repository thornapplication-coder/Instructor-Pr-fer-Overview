// Import an updated trainer roster from Excel (.xlsx/.xls) or CSV.
// The columns are matched by header name (DE/EN, tolerant of the original file),
// so the app's own Trainer export round-trips cleanly. Existing trainers are
// matched by TLC (else name) and only their roster fields are refreshed –
// conversion status and planning assignments are preserved.
// SheetJS is heavy, so it is loaded lazily (only when an import actually runs).

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim()

// Header text -> trainer field. Normalized, lower-case, tolerant.
const FIELD_ALIASES = {
  qual: ['qualifikation', 'qualification', 'qual'],
  base: ['base', 'standort'],
  tlc: ['tlc', 'kürzel', 'kuerzel', 'kz'],
  name: ['name'],
  remark: ['funktion / anmerkung', 'funktion/anmerkung', 'funktion', 'anmerkung', 'bemerkung', 'function / remark', 'function/remark', 'function', 'remark'],
  partTime: ['part-time', 'part time', 'parttime', 'teilzeit', 'pt'],
  ore: ['ore a–c', 'ore a-c', 'ore', 'ore priorität', 'ore prioritaet'],
  authority: ['ausstellende behörde', 'ausstellende behoerde', 'behörde', 'behoerde', 'issuing authority', 'authority'],
  ltcDate: ['ltc seit', 'ltc since', 'ltc'],
  triDate: ['tri seit', 'tri since', 'tri'],
  treDate: ['tre seit', 'tre since', 'tre']
}

function fieldForHeader(header) {
  const n = norm(header)
  if (!n) return null
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(n)) return field
  }
  return null
}

// Excel serial / Date / string -> "YYYY-MM-DD" (non-date text passes through).
function toISO(v) {
  if (v == null || v === '') return ''
  if (v instanceof Date && !isNaN(v)) {
    const y = v.getFullYear()
    const m = String(v.getMonth() + 1).padStart(2, '0')
    const d = String(v.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(v).trim()
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})$/.exec(s)
  if (m) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3]
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return s
}

// Normalize a part-time value (number, "VZ", "80%", "0,8", messy string).
function toPartTime(v) {
  if (v == null || v === '') return ''
  if (typeof v === 'number') {
    if (v > 1 && v <= 100) return Math.round(v) / 100 // 80 -> 0.8
    return v
  }
  const s = String(v).trim()
  if (/^(vz|ft)$/i.test(s) || /vollzeit|full[- ]?time/i.test(s)) return 'VZ'
  const pct = /^(\d+(?:[.,]\d+)?)\s*%$/.exec(s)
  if (pct) return Number(pct[1].replace(',', '.')) / 100
  const frac = /^0?[.,]\d+$/.exec(s)
  if (frac) return Number(s.replace(',', '.'))
  return s
}

// Keep only the roster fields present (non-empty) in a row.
function pickFields(rec) {
  const out = {}
  const str = (v) => (v == null ? '' : String(v).trim())
  if (str(rec.tlc)) out.tlc = str(rec.tlc)
  if (str(rec.name)) out.name = str(rec.name)
  if (str(rec.qual)) out.qual = str(rec.qual)
  if (str(rec.base)) out.base = str(rec.base)
  if (rec.remark != null && str(rec.remark) !== '') out.remark = str(rec.remark)
  if (str(rec.ore)) out.ore = str(rec.ore)
  if (str(rec.authority)) out.authority = str(rec.authority)
  const pt = toPartTime(rec.partTime)
  if (pt !== '') out.partTime = pt
  const ltc = toISO(rec.ltcDate)
  if (ltc) out.ltcDate = ltc
  const tri = toISO(rec.triDate)
  if (tri) out.triDate = tri
  const tre = toISO(rec.treDate)
  if (tre) out.treDate = tre
  return out
}

// Parse the first worksheet of an .xlsx/.xls/.csv file into roster records.
export async function parseTrainersFromArrayBuffer(buf) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' })
  if (!rows.length) return []
  // Find the header row (the first row that contains a "Name" cell), so title
  // rows or merged banners above the table are skipped.
  let hIdx = rows.findIndex((r) => Array.isArray(r) && r.some((c) => norm(c) === 'name'))
  if (hIdx < 0) hIdx = 0
  const headerMap = {}
  rows[hIdx].forEach((h, i) => {
    const field = fieldForHeader(h)
    if (field && headerMap[field] == null) headerMap[field] = i
  })
  const records = []
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!Array.isArray(r)) continue
    const rec = {}
    for (const [field, ci] of Object.entries(headerMap)) rec[field] = r[ci]
    if (!norm(rec.name) && !norm(rec.tlc)) continue // skip blank rows
    records.push(pickFields(rec))
  }
  return records
}

// Merge records into the existing trainer list. Match by TLC, then name.
// Matched trainers keep their id / conv / assignments; new ones are appended.
export function mergeTrainerRecords(existing, records) {
  const byTlc = new Map()
  const byName = new Map()
  existing.forEach((t) => {
    if (norm(t.tlc)) byTlc.set(norm(t.tlc), t)
    if (norm(t.name)) byName.set(norm(t.name), t)
  })
  const result = [...existing]
  const idxById = new Map(result.map((t, i) => [t.id, i]))
  let updated = 0
  let added = 0
  let seq = 0
  for (const rec of records) {
    if (!rec.tlc && !rec.name) continue
    const ex = (rec.tlc && byTlc.get(norm(rec.tlc))) || (rec.name && byName.get(norm(rec.name)))
    if (ex) {
      updated++
      result[idxById.get(ex.id)] = { ...ex, ...rec }
    } else {
      added++
      const base = norm(rec.tlc || rec.name).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'row'
      const t = {
        id: `imp-${base}-${result.length}-${seq++}`,
        staffType: 'internal',
        conv: { stage: 'nominated', status: 'on_track', target: '', note: '' },
        ...rec
      }
      result.push(t)
      if (norm(t.tlc)) byTlc.set(norm(t.tlc), t)
      if (norm(t.name)) byName.set(norm(t.name), t)
      idxById.set(t.id, result.length - 1)
    }
  }
  return { trainers: result, updated, added }
}
