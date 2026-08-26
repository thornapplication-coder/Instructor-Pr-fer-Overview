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
import { parseTrainersFromArrayBuffer, mergeTrainerRecords, resolveRecordIds } from '../src/lib/importExcel.js'

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

  // A sheet that lists no rating for somebody says NOTHING about their
  // ratings - it does not say they have none. So the record carries no
  // `ratings` key at all and the stored ones stand. Same rule as every other
  // column: an empty cell is "not stated", not "make it empty".
  const other = recs.find((r) => r.tlc === 'XYZ')
  ok(other && !('ratings' in other), 'a row with no rating leaves the stored ratings alone')
  ok(other && !('base' in other) === false, '  while the fields it does carry are there (base ' + other?.base + ')')

  // And through the merge, against a roster that already holds them.
  const existing = [{ id: 'p1', name: 'Muster, Max', tlc: 'ABC', base: 'VIE', role: 'captain', ratings: [], boeingExp: true, remark: '' }]
  const merged = mergePilotRecords(existing, recs)
  const kept = merged.pilots.find((p) => p.tlc === 'ABC')
  ok(kept && kept.id === 'p1', 'a matched pilot keeps their id (' + kept?.id + ')')
  ok(kept && kept.ratings.length === 3, '  and gains the three ratings the sheet carried')
  ok(merged.pilots.length === 2, 'the unknown person is added, not merged into somebody (' + merged.pilots.length + ')')
}

console.log('\nPilots – an empty cell does not blank a stored value')
{
  // The two importers used to disagree: the trainer one left a stored value
  // alone when the column was missing, the pilot one overwrote it with ''. A
  // two-column sheet of names and codes therefore wiped base, role, remark and
  // every rating off everybody it matched - behind the same confirmation text.
  const headers = ['Name', 'TLC']
  const recs = await parsePilotsFromArrayBuffer(xlsBytes('Other Pilots', headers, [['Muster, Max', 'ABC']]))
  ok(recs.length === 1, 'the two-column sheet is read (' + recs.length + ')')
  ok(!('base' in recs[0]) && !('role' in recs[0]) && !('remark' in recs[0]) && !('ratings' in recs[0]),
    '  and carries only what it states - no empty stand-ins for the rest')

  const before = {
    id: 'p1', name: 'Muster, Max', tlc: 'ABC', base: 'VIE', role: 'fo',
    ratings: [{ id: 'r1', type: '737', until: '2027-06-01' }], boeingExp: false, remark: 'mag Nachtflug'
  }
  const after = mergePilotRecords([before], recs).pilots[0]
  ok(after.base === 'VIE', 'base survives a sheet that does not mention it (' + after.base + ')')
  ok(after.role === 'fo', '  and so does the role (' + after.role + ')')
  ok(after.remark === 'mag Nachtflug', '  and the remark (' + after.remark + ')')
  ok(after.ratings.length === 1, '  and the ratings, which is the one that used to cost most (' + after.ratings.length + ')')
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


console.log('\nTrainers – the five label columns come back as ids')
{
  // The export writes Seniorität, Aircraft, Zugehörigkeit, Firma and Umschulung.
  // None was read back. For an existing person that was lossy; for a NEW row it
  // invented one - "extern" arriving as the internal default, which since
  // 1.50.0 drags the person into every conversion figure and every course seat
  // they should not occupy.
  const headers = ['Qualifikation', 'Base', 'TLC', 'Name', 'Seniorität', 'Aircraft', 'Zugehörigkeit', 'Firma (extern)', 'Umschulung']
  const rows = [['TRI', 'VIE', 'NEU', 'Neu, Person', '15.04.2016', 'B737', 'extern', 'SunExpress', 'SIM / Type Rating']]
  const parsed = await parseTrainersFromArrayBuffer(xlsBytes('Trainer', headers, rows))
  ok(parsed.length === 1, 'the row is read (' + parsed.length + ')')
  ok(parsed[0].seniority === '2016-04-15', 'the seniority date arrives as ISO (' + parsed[0].seniority + ')')

  const lists = {
    aircraftTypes: [{ id: 'A320', label: 'A320' }, { id: 'B737', label: 'B737' }],
    extCompanies: [{ id: 'c-tui', label: 'TUI' }, { id: 'c-sun', label: 'SunExpress' }],
    stages: [{ id: 'nominated', label: 'Nominierung' }, { id: 'simulator', label: 'SIM / Type Rating' }]
  }
  const r = resolveRecordIds(parsed[0], lists)
  ok(r.staffType === 'external', '"extern" resolves to the stored id, not to the internal default (' + r.staffType + ')')
  ok(r.extCompany === 'c-sun', 'the company label resolves to its id (' + r.extCompany + ')')
  ok(r.aircraft === 'B737', 'the aircraft comes back (' + r.aircraft + ')')
  ok(r.conv && r.conv.stage === 'simulator', 'and the conversion phase, by label (' + r.conv?.stage + ')')
  ok(!('convStage' in r), '  with the raw text dropped rather than stored beside it')

  // Anything that does not resolve is left out, never guessed: a stage id no
  // stage carries would put somebody in a phase no view can draw, and an
  // unknown affiliation quietly reading as "internal" is the bug itself.
  const junk = resolveRecordIds(
    { staffType: 'Aushilfe', aircraft: 'B787', extCompany: 'Wer auch immer', convStage: 'Gibt es nicht' }, lists)
  ok(!('staffType' in junk) && !('aircraft' in junk) && !('extCompany' in junk) && !('conv' in junk),
    'an unresolvable label is dropped, not invented (' + JSON.stringify(junk) + ')')
}
