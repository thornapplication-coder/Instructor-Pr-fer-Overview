// Import an updated trainer roster from Excel (.xlsx/.xls) or CSV.
// The columns are matched by header name (DE/EN, tolerant of the original file),
// so the app's own Trainer export round-trips cleanly. Existing trainers are
// matched by TLC (else name) and only their roster fields are refreshed –
// conversion status and planning assignments are preserved.
// SheetJS is heavy, so it is loaded lazily (only when an import actually runs).

import { fteFromPartTime } from './format.js'

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim()

// Header text -> trainer field. Normalized, lower-case, tolerant.
const FIELD_ALIASES = {
  qual: ['qualifikation', 'qualification', 'qual'],
  base: ['base', 'standort'],
  tlc: ['tlc', 'kürzel', 'kuerzel', 'kz'],
  name: ['name'],
  remark: ['funktion / anmerkung', 'funktion/anmerkung', 'funktion', 'anmerkung', 'bemerkung', 'function / remark', 'function/remark', 'function', 'remark'],
  role: ['rolle (cockpit)', 'rolle', 'role (cockpit)', 'role', 'funktion cockpit', 'cockpit'],
  partTime: ['part-time', 'part time', 'parttime', 'teilzeit', 'pt'],
  fte: ['fte', 'fte (1 = 100%)', 'fte 1 = 100%', 'vollzeitäquivalent', 'vollzeitaequivalent', 'vze'],
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
    // Two-digit years pivot at 50: "98" -> 1998 (a past LTC/TRI/TRE date),
    // "05" -> 2005. Blindly prefixing "20" turned "01.06.98" into 2098.
    let y = m[3]
    if (y.length === 2) {
      const yy = Number(y)
      y = String(yy <= 50 ? 2000 + yy : 1900 + yy)
    }
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return s
}

// Cockpit role -> 'fo' | 'captain' | null (null = column absent/unrecognized, so
// the existing value is kept). Accepts FO / F/O / First Officer / Copilot as FO.
function toRole(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase()
  if (!s) return null
  if (/^(fo|f\/o|f\.o\.?)$/.test(s) || /first\s*officer|copilot|co-?pilot|kopilot/.test(s)) return 'fo'
  if (/^(cpt|capt|c)$/.test(s) || /captain|kapit/.test(s)) return 'captain'
  return null
}

// Numeric FTE (accepts "0,8" decimal comma), clamped to a sane range; else null.
function toFte(v) {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'))
  if (isNaN(n)) return null
  return Math.max(0, Math.min(2, n))
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
  const role = toRole(rec.role)
  if (role) out.role = role
  if (str(rec.authority)) out.authority = str(rec.authority)
  const pt = toPartTime(rec.partTime)
  if (pt !== '') out.partTime = pt
  // Keep FTE in step with the roster: use an explicit FTE column when present,
  // otherwise derive it from part-time (mirrors the in-app part-time -> FTE
  // coupling) so a refreshed part-time doesn't leave a stale FTE behind.
  const fte = toFte(rec.fte)
  if (fte != null) out.fte = fte
  else if (pt !== '') out.fte = fteFromPartTime(pt)
  const ltc = toISO(rec.ltcDate)
  if (ltc) out.ltcDate = ltc
  const tri = toISO(rec.triDate)
  if (tri) out.triDate = tri
  const tre = toISO(rec.treDate)
  if (tre) out.treDate = tre
  return out
}

// A binary spreadsheet? .xlsx is a ZIP ("PK"), legacy .xls is an OLE compound
// file (D0 CF 11 E0). Anything else we treat as CSV/plain text.
function isSpreadsheetBinary(bytes) {
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) return true
  if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return true
  return false
}

function decodeText(bytes) {
  let s = new TextDecoder('utf-8').decode(bytes)
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1) // strip UTF-8 BOM
  return s
}

// Minimal RFC-4180-ish CSV parser (handles quotes and , or ; delimiters). We
// parse CSV ourselves rather than via SheetJS so German dd.mm.yyyy dates and
// decimal-comma values ("0,8") stay as raw strings for toISO / toPartTime,
// instead of being US-fuzzy-parsed (day/month swapped, "0,8" -> 8).
function parseCsvRows(text) {
  const nl = text.indexOf('\n')
  const firstLine = nl >= 0 ? text.slice(0, nl) : text
  const delim = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','
  const rows = []
  let row = []
  let field = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQ = false
      } else field += c
    } else if (c === '"') inQ = true
    else if (c === delim) { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// Read an .xlsx/.xls workbook with a prototype-pollution guard around the parse.
// CVE-2023-30533 lets a crafted workbook inject keys onto Object.prototype during
// XLSX.read; the maintained fix ships only on the SheetJS CDN (not reachable from
// this build's package registry). XLSX.read is synchronous, so we snapshot
// Object.prototype's own keys and strip any newly-added ones immediately after –
// before any awaited app code (normalize/merge) can observe a polluted prototype.
function readWorkbookGuarded(XLSX, buf) {
  const proto = Object.prototype
  const before = new Set(Object.getOwnPropertyNames(proto))
  try {
    return XLSX.read(buf, { type: 'array', cellDates: true })
  } finally {
    for (const k of Object.getOwnPropertyNames(proto)) {
      if (!before.has(k)) { try { delete proto[k] } catch (_) { /* non-configurable */ } }
    }
  }
}

async function sheetToRows(buf) {
  const bytes = new Uint8Array(buf)
  if (!isSpreadsheetBinary(bytes)) return parseCsvRows(decodeText(bytes))
  const XLSX = await import('xlsx')
  const wb = readWorkbookGuarded(XLSX, buf)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' })
}

// Score a row by how many recognized field headers it carries; the real header
// row wins over a metadata/cover block that merely happens to contain "Name".
function headerScore(row) {
  if (!Array.isArray(row)) return { score: 0, hasName: false }
  let score = 0
  let hasName = false
  for (const c of row) {
    const f = fieldForHeader(c)
    if (f) { score++; if (f === 'name') hasName = true }
  }
  return { score, hasName }
}

// Parse the first worksheet of an .xlsx/.xls/.csv file into roster records.
export async function parseTrainersFromArrayBuffer(buf) {
  const rows = await sheetToRows(buf)
  if (!rows.length) return []
  // Pick the row with the MOST recognized headers (and a Name column), so a
  // cover/metadata block like ["Erstellt von","Name","Datum"] above the table
  // no longer hijacks header detection.
  let hIdx = -1
  let best = 0
  rows.forEach((r, i) => {
    const { score, hasName } = headerScore(r)
    if (hasName && score > best) { best = score; hIdx = i }
  })
  if (hIdx < 0) hIdx = rows.findIndex((r) => Array.isArray(r) && r.some((c) => norm(c) === 'name'))
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
    if (isExportBanner(r)) continue // skip our own brand / copyright rows on re-import
    records.push(pickFields(rec))
  }
  return records
}

// Rows the app's own export adds (the "737 TRAINER …" banner and the "©
// Copyright …" footer) always occupy column 0. Anchor the check there and to
// unmistakable markers so a legitimate remark like "Senior 737 Trainer" in some
// other column is never mistaken for a banner and dropped.
function isExportBanner(row) {
  const s = norm(row && row[0])
  return s.startsWith('737 trainer') || s.includes('©')
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
