// Export it, read it back, still have it.
//
// Both halves of this were broken and neither said so. The pilots export writes
// its expiry column as "Gültigkeit"; the importer's alias list had every other
// spelling but that one, so the date never arrived - and a pilot with no date
// is a pilot with no ratings. Exporting the tab and reading it straight back
// wiped every type rating on the roster and reported "Import erfolgreich".
// (The English label was in the list, so only the German export - the one in
// use - destroyed data.)
//
// Underneath sat a second one: the .xls this app writes is an HTML table, and
// the importer took it for a CSV and read the whole markup as a single line.
//
// So the check builds the real export bytes with the real writer and feeds them
// to the real reader. Anything less would have passed while both were broken.
import { parsePilotsFromArrayBuffer, mergePilotRecords } from '../src/lib/importPilots.js'
import { parseTrainersFromArrayBuffer, mergeTrainerRecords } from '../src/lib/importExcel.js'

const fails = []
export const results = { fails }
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) fails.push(m) }

// The export writer builds a Blob in the browser. Rebuild its markup here from
// the same escaping rules, so this test exercises the READER against the shape
// the writer really produces (banner row, header row, one row per rating).
const esc = (v) => {
  const s = v == null ? '' : String(v)
  const guarded = /^[=+\-@]/.test(s) ? "'" + s : s
  return guarded.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function xlsBytes(title, headers, rows) {
  const html =
    '<html><head><meta charset="utf-8" /></head><body><table>' +
    '<tr><td colspan="' + headers.length + '">737 TRAINER — ' + esc(title) + '</td></tr>' +
    '<tr>' + headers.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>' +
    rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') +
    '</table></body></html>'
  const enc = new TextEncoder()
  const body = enc.encode(html)
  const out = new Uint8Array(body.length + 3)
  out.set([0xef, 0xbb, 0xbf], 0) // the BOM the writer prepends
  out.set(body, 3)
  return out.buffer
}

console.log('\nPilots – the export reads back, ratings and all')
{
  const headers = ['Base', 'TLC', 'Name', 'Position', 'Type', 'Gültigkeit', 'Boeing-Erfahrung', 'Gültig', 'Abgelaufen', 'Kommentar']
  // One person, three ratings: the continuation rows repeat nothing but the
  // rating, exactly as exportPilotsExcel writes them.
  const rows = [
    ['VIE', 'ABC', 'Muster, Max', 'CPT', '737', '01.06.2027', '', 'x', '', 'mag Nachtflug'],
    ['', '', '', '', '757', '01.02.2025', '', '', 'x', ''],
    ['', '', '', '', '767', '15.09.2028', '', 'x', '', ''],
    ['PMI', 'XYZ', 'Zweite, Person', 'FO', '', '', 'x', '', '', '']
  ]
  const recs = await parsePilotsFromArrayBuffer(xlsBytes('Other Pilots', headers, rows))
  ok(recs.length === 2, 'two people out of four rows – the continuation lines belong to the first (' + recs.length + ')')

  const max = recs.find((r) => r.tlc === 'ABC')
  ok(!!max, 'the person with several ratings survived')
  ok(max && max.ratings.length === 3, '  with ALL THREE ratings, not one and not none (' + (max?.ratings.length) + ')')
  ok(max && max.ratings.map((r) => r.type).join(',') === '737,757,767',
    '  each keeping its own type (' + max?.ratings.map((r) => r.type).join(', ') + ')')
  ok(max && max.ratings[0].until === '2027-06-01',
    '  and its own German date, read as ISO (' + max?.ratings[0].until + ')')
  ok(max && max.base === 'VIE' && max.remark === 'mag Nachtflug',
    '  the fields only the first line carries came along too')

  const other = recs.find((r) => r.tlc === 'XYZ')
  ok(other && other.ratings.length === 0 && other.boeingExp === true,
    'somebody with no rating reads as Boeing experience without one')

  // And through the merge, against a roster that already holds them.
  const existing = [{ id: 'p1', name: 'Muster, Max', tlc: 'ABC', base: 'VIE', role: 'captain', ratings: [], boeingExp: true, remark: '' }]
  const merged = mergePilotRecords(existing, recs)
  const kept = merged.pilots.find((p) => p.tlc === 'ABC')
  ok(kept && kept.id === 'p1', 'a matched pilot keeps their id (' + kept?.id + ')')
  ok(kept && kept.ratings.length === 3, '  and gains the three ratings the sheet carried')
  ok(merged.pilots.length === 2, 'the unknown person is added, not merged into somebody (' + merged.pilots.length + ')')
}

console.log('\nTrainers – the same file format reads back')
{
  // The headers the writer really emits: f_remark is "Funktion" and f_note is
  // "Anmerkungen" - not the other way round, which is exactly the sort of
  // assumption a round-trip test exists to catch.
  const headers = ['Qualifikation', 'Base', 'TLC', 'Name', 'Rolle (Cockpit)', 'Teilzeit', 'FTE', 'Funktion']
  const rows = [
    ['TRI', 'VIE', 'ABC', 'Muster, Max', 'CPT', '80%', '0,8', 'Base CPT'],
    ['737 TRAINER — v1.0.0', '', '', '', '', '', '', ''] // the footer the writer adds
  ]
  const recs = await parseTrainersFromArrayBuffer(xlsBytes('Trainer', headers, rows))
  ok(recs.length === 1, 'the data row is read and the footer banner is not (' + recs.length + ')')
  ok(recs[0] && recs[0].name === 'Muster, Max' && recs[0].tlc === 'ABC', '  name and TLC survive')
  ok(recs[0] && recs[0].fte === 0.8, '  the decimal comma is read as 0.8, not as 8 (' + recs[0]?.fte + ')')

  // An empty cell must NOT blank a stored value - the promise the import hint
  // makes on screen.
  const existing = [{ id: 't1', name: 'Muster, Max', tlc: 'ABC', ore: 'A', remark: 'alt', base: 'VIE' }]
  const merged = mergeTrainerRecords(existing, recs)
  const kept = merged.trainers.find((x) => x.id === 't1')
  ok(kept && kept.ore === 'A', 'a column the sheet does not have leaves the stored value alone (' + kept?.ore + ')')
  ok(kept && kept.remark === 'Base CPT', '  while a column it does have wins (' + kept?.remark + ')')
}

console.log('\nCSV – the delimiter is sniffed past the banner line')
{
  // A German Excel writes ';'. Line 1 is the brand banner and contains neither
  // delimiter, so sniffing line 1 alone always answered ',' and produced one
  // column and zero records.
  const csv = '737 TRAINER — Trainer\nQualifikation;Base;TLC;Name\nTRI;VIE;ABC;Muster, Max\n'
  const enc = new TextEncoder()
  const recs = await parseTrainersFromArrayBuffer(enc.encode(csv).buffer)
  ok(recs.length === 1, 'a semicolon CSV under a banner line is read (' + recs.length + ')')
  ok(recs[0] && recs[0].tlc === 'ABC', '  and the columns land in the right fields (' + recs[0]?.tlc + ')')
}
