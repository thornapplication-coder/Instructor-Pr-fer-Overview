// Import "other pilots" (company line pilots, not trainers) from Excel/CSV.
// Reuses the hardened sheet reader from importExcel.js: same CSV handling for
// German dates, same header detection, same prototype-pollution guard.
import { parseRecordsFromArrayBuffer, toISO, norm } from './importExcel.js'

// Header text -> pilot field. Normalized, lower-case, tolerant of DE/EN.
const PILOT_ALIASES = {
  name: ['name', 'pilot', 'nachname, vorname'],
  tlc: ['tlc', 'kürzel', 'kuerzel', 'kz'],
  base: ['base', 'standort', 'homebase'],
  role: ['position', 'rolle', 'rolle (cockpit)', 'role', 'role (cockpit)', 'funktion cockpit', 'cockpit'],
  type: ['type', 'muster', 'rating', 'type rating', 'typerating'],
  // 'gültigkeit' is what THIS APP writes (exportPilotsExcel, column f_validity).
  // It was missing, so the app's own export re-imported with no date at all -
  // and a pilot with no date is a pilot with no ratings. Exporting the tab and
  // reading it back wiped every type rating on the roster and reported
  // "Import erfolgreich". The English label ('expiry') was in the list, so only
  // the German export - the one actually in use - was destructive.
  b737Until: [
    'gültigkeit', 'gueltigkeit', 'gültig bis', 'gueltig bis', 'abgelaufen',
    'abgelaufen am', 'ablauf', 'ablaufdatum', 'valid until', 'expiry', 'expires',
    'expiry date', 'validity', 'b737 bis', 'datum'
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
// A rating date in the past means the rating lapsed, in the future that it is
// One person can occupy SEVERAL rows.
//
// That is the shape of the roster spreadsheet and the shape this app exports:
// one line per rating, and the continuation lines carry the rating only - name,
// TLC, base and role are left blank because they would just repeat. Read row by
// row, a continuation line looks like a blank row and was thrown away, so a
// pilot with three ratings came back with one. Combined with the missing
// 'gültigkeit' alias, they came back with none.
//
// So the rows are read first and folded into people afterwards: an identity
// carries forward until a new one appears, and every rating found under it
// belongs to that person.
export async function parsePilotsFromArrayBuffer(buf, today) {
  const rows = await parseRecordsFromArrayBuffer(buf, PILOT_ALIASES, (rec) => {
    const str = (v) => (v == null ? '' : String(v).trim())
    const iso = toISO(rec.b737Until)
    const until = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : ''
    const type = str(rec.type)
    const row = {
      name: str(rec.name),
      tlc: str(rec.tlc),
      base: str(rec.base),
      role: toRole(rec.role),
      remark: str(rec.remark),
      rating: until || type ? { id: '', type: type || '737', until } : null
    }
    // A row with neither an identity nor a rating carries nothing at all.
    if (!row.name && !row.tlc && !row.rating) return null
    return row
  })

  const people = []
  let current = null
  for (const row of rows) {
    const isNewPerson = !!(row.name || row.tlc)
    if (isNewPerson || !current) {
      // ONLY the fields the sheet actually carries.
      //
      // This used to build every key unconditionally, so a missing column
      // arrived as '' and the merge below - a plain overwrite - wrote that
      // emptiness over the stored value. A two-column sheet of names and codes
      // wiped base, role, remark and ratings off everybody it matched.
      //
      // The trainer importer has always done it the other way (pickFields), so
      // the two sat side by side behind the same confirmation with opposite
      // rules. This is the trainer rule: an empty cell means "not stated", and
      // what is not stated is not changed. Clearing a field stays the dialog's
      // job, where it is deliberate.
      current = { _ratings: [] }
      if (row.name) current.name = row.name
      if (row.tlc) current.tlc = row.tlc
      if (row.base) current.base = row.base
      if (row.role) current.role = row.role
      if (row.remark) current.remark = row.remark
      people.push(current)
    } else {
      // A continuation line may still carry a field the first line left empty.
      if (row.base && !current.base) current.base = row.base
      if (row.remark && !current.remark) current.remark = row.remark
    }
    // Only a rating with a real date is one; a bare type with no expiry is
    // what the export writes for somebody who holds none.
    if (row.rating && row.rating.until) current._ratings.push(row.rating)
  }

  return people.map((p) => {
    const { _ratings, ...rest } = p
    // Same rule for the ratings: a sheet that lists none says nothing about
    // them, so the stored ones stand. Only a sheet that DOES carry ratings
    // replaces what is there - and then boeingExp follows from it.
    return _ratings.length ? { ...rest, ratings: _ratings, boeingExp: false } : rest
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
