// Import "other pilots" (company line pilots, not trainers) from Excel/CSV.
// Reuses the hardened sheet reader from importExcel.js: same CSV handling for
// German dates, same header detection, same prototype-pollution guard.
import { parseRecordsFromArrayBuffer, toISO, norm } from './importExcel.js'
import { PILOT_STATUS } from '../data/pilots.js'

// Header text -> pilot field. Normalized, lower-case, tolerant of DE/EN.
const PILOT_ALIASES = {
  name: ['name', 'pilot', 'nachname, vorname'],
  tlc: ['tlc', 'kürzel', 'kuerzel', 'kz'],
  base: ['base', 'standort', 'homebase'],
  role: ['position', 'rolle', 'rolle (cockpit)', 'role', 'role (cockpit)', 'funktion cockpit', 'cockpit'],
  status: ['status', 'b737', 'b737 status', 'b737-status', 'rating', 'b737 rating', 'typerating', 'type rating'],
  b737Until: [
    'gültig bis', 'gueltig bis', 'abgelaufen', 'abgelaufen am', 'ablauf', 'ablaufdatum',
    'valid until', 'expiry', 'expires', 'expiry date', 'b737 bis', 'datum'
  ],
  remark: ['anmerkung', 'bemerkung', 'remark', 'note', 'notiz', 'kommentar']
}

// "CPT"/"Captain" vs "FO"/"First Officer" -> stored role.
function toRole(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase()
  if (!s) return null
  if (/^(fo|f\/o|f\.o\.?)$/.test(s) || /first\s*officer|copilot|co-?pilot|kopilot/.test(s)) return 'fo'
  if (/^(cpt|capt|c)$/.test(s) || /captain|kapit/.test(s)) return 'captain'
  return null
}

// Free text -> one of the three B737 standings. Falls back to null so the
// caller can derive the status from the date instead.
function toStatus(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase()
  if (!s) return null
  if (/erfahr|experience|ehemal|former|past/.test(s)) return 'experience'
  if (/abgelaufen|expired|invalid|ungültig|ungueltig|lapsed/.test(s)) return 'expired'
  if (/gültig|gueltig|valid|current|aktiv|active|ok|ja|yes/.test(s)) return 'valid'
  if (PILOT_STATUS[s]) return s
  return null
}

// A rating date in the past means the rating lapsed, in the future that it is
// still current – used when the sheet carries a date but no explicit status.
function statusFromDate(iso, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return null
  const [y, m, d] = iso.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const now = today || new Date()
  return due < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? 'expired' : 'valid'
}

export function parsePilotsFromArrayBuffer(buf, today) {
  return parseRecordsFromArrayBuffer(buf, PILOT_ALIASES, (rec) => {
    const str = (v) => (v == null ? '' : String(v).trim())
    const name = str(rec.name)
    const tlc = str(rec.tlc)
    if (!name && !tlc) return null // blank row
    const until = /^\d{4}-\d{2}-\d{2}$/.test(toISO(rec.b737Until)) ? toISO(rec.b737Until) : ''
    const out = {
      name,
      tlc,
      base: str(rec.base),
      role: toRole(rec.role) || 'captain',
      // Explicit status wins; otherwise derive it from the date; otherwise
      // treat the row as Boeing experience without a rating.
      status: toStatus(rec.status) || statusFromDate(until, today) || 'experience',
      b737Until: until,
      remark: str(rec.remark)
    }
    return out
  })
}

// Merge imported records into the existing list. Matched by TLC, else by name;
// matched pilots keep their id, new ones are appended.
export function mergePilotRecords(existing, records) {
  const byTlc = new Map()
  const byName = new Map()
  existing.forEach((p) => {
    if (norm(p.tlc)) byTlc.set(norm(p.tlc), p)
    if (norm(p.name)) byName.set(norm(p.name), p)
  })
  const result = [...existing]
  const idxById = new Map(result.map((p, i) => [p.id, i]))
  let updated = 0
  let added = 0
  let seq = 0
  for (const rec of records) {
    const ex = (rec.tlc && byTlc.get(norm(rec.tlc))) || (rec.name && byName.get(norm(rec.name)))
    if (ex) {
      updated++
      result[idxById.get(ex.id)] = { ...ex, ...rec }
    } else {
      added++
      const base = norm(rec.tlc || rec.name).replace(/[^a-z0-9]/g, '').slice(0, 8) || 'row'
      const p = { id: `plt-${base}-${result.length}-${seq++}`, ...rec }
      result.push(p)
      if (norm(p.tlc)) byTlc.set(norm(p.tlc), p)
      if (norm(p.name)) byName.set(norm(p.name), p)
      idxById.set(p.id, result.length - 1)
    }
  }
  return { pilots: result, updated, added }
}
