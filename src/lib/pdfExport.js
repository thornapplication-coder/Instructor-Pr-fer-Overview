// Per-page PDF reports, generated directly from the current store data.
// No window.print(), no DOM scraping: this guarantees the correct page and the
// current data on every platform (desktop, iPhone, iPad – the file downloads /
// opens in the share sheet). jsPDF + autotable are lazy-loaded (heavy).
import { BRAND_NAME, BRAND_HEX, hexToRgb, footerLine, fileStamp, reportDate } from './brand.js'
import { formatPartTime, formatFte, formatFte1, formatDate } from './format.js'
import { stageLabel, CONV_STATUS, ASSIGNMENT_STATUS, firstStageId } from '../data/pipeline.js'
import { qualLabel } from '../data/qualifications.js'
import { courseLabel, simVersionLabel } from '../data/providers.js'
import { PILOT_STATUS_IDS, pilotStatusLabel, pilotRole } from '../data/pilots.js'
import { conversionTrainers } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'
import {
  headcount,
  conversionSummary,
  conversionFteSummary,
  byQual,
  byBase,
  byOre,
  byAuthority,
  byPartTime,
  byFunction,
  qualByAircraft,
  capacityByBase,
  capacityByQual,
  capacityByAircraft,
  providerUtilization
} from './stats.js'
import { stageName, targetsByMonth, monthLabel } from './alerts.js'
import { courseEntries, courseMonths, monthTitle } from './courseCalendar.js'

const BURG = hexToRgb(BRAND_HEX.burg)
const BURG_DARK = hexToRgb(BRAND_HEX.burgDark)
const GREY = hexToRgb(BRAND_HEX.grey)

let _pdf = null
async function loadPdf() {
  if (_pdf) return _pdf
  const [jsMod, autoMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  _pdf = { jsPDF: jsMod.jsPDF || jsMod.default, autoTable: autoMod.default || autoMod }
  return _pdf
}


// Branded header + footer, drawn on every page via autotable's didDrawPage.
function decorate(doc, title, lang, dateStr) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(...BURG)
  doc.rect(0, 0, W, 50, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(BRAND_NAME, 40, 23)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(title, 40, 40)
  doc.setFontSize(9)
  doc.text(dateStr, W - 40, 23, { align: 'right' })
  doc.setTextColor(...GREY)
  doc.setFontSize(8)
  doc.text(footerLine(), 40, H - 16)
  doc.text(String(doc.internal.getCurrentPageInfo().pageNumber), W - 40, H - 16, { align: 'right' })
}

function makeCtx(doc, autoTable, title, lang) {
  const ctx = { doc, autoTable, title, lang, dateStr: reportDate(lang), y: 66 }
  return ctx
}

// Draw one table with an optional burgundy section-title row spanning all
// columns; returns the new Y. autotable handles page breaks automatically.
function table(ctx, { section, head, body, foot, columnStyles }) {
  const { doc, autoTable } = ctx
  const headRows = []
  const colCount = head.length
  if (section) {
    headRows.push([{ content: section, colSpan: colCount, styles: { halign: 'left', fillColor: BURG_DARK, textColor: 255, fontStyle: 'bold', fontSize: 10 } }])
  }
  headRows.push(head)
  autoTable(doc, {
    startY: ctx.y,
    head: headRows,
    body,
    foot,
    margin: { top: 60, bottom: 30, left: 40, right: 40 },
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: BURG, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [241, 243, 245], textColor: BURG_DARK, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 248, 249] },
    columnStyles: columnStyles || {},
    didDrawPage: () => decorate(ctx.doc, ctx.title, ctx.lang, ctx.dateStr)
  })
  ctx.y = doc.lastAutoTable.finalY + 16
  return ctx.y
}

// Place the whole capture on a SINGLE A4 page, scaled to fit under the branded
// header. Returns true on success, false for a degenerate (zero-size) canvas so
// the caller can fall back to the data-table dashboard instead of emitting a
// blank page.
// How far the capture may be shrunk to keep it on a single page, relative to
// the size the page width alone would allow. One page is the intent (see
// CHANGELOG 1.10.1) – but only while it stays readable. Every card added to the
// dashboard makes the capture taller, and without a floor the whole report just
// keeps getting smaller until the numbers cannot be read at all.
const MIN_LEGIBLE = 0.75

function addCanvasPages(doc, canvas, title, lang) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 24
  const top = 58 // below the header bar
  const bottom = 24
  const availW = pageW - margin * 2
  const availH = pageH - top - bottom
  if (!canvas.width || !canvas.height) return false

  const widthScale = availW / canvas.width
  const onePageScale = Math.min(widthScale, availH / canvas.height)

  // Release the (potentially tens-of-MB) capture backing store promptly – iOS
  // Safari caps total canvas memory and GC is lazy.
  const release = () => { canvas.width = 0; canvas.height = 0 }

  if (onePageScale >= widthScale * MIN_LEGIBLE) {
    const w = canvas.width * onePageScale
    const h = canvas.height * onePageScale
    decorate(doc, title, lang, reportDate(lang))
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin + (availW - w) / 2, top, w, h)
    release()
    return true
  }

  // Too tall to stay legible on one page: print at full width and continue on
  // the next page. The break falls wherever the page ends – the capture is a
  // picture, so there are no card boundaries left to break along.
  const sliceH = Math.floor(availH / widthScale) // source pixels per page
  const pages = Math.ceil(canvas.height / sliceH)
  const cut = document.createElement('canvas')
  const ctx = cut.getContext('2d')
  for (let i = 0; i < pages; i++) {
    const sy = i * sliceH
    const sh = Math.min(sliceH, canvas.height - sy)
    cut.width = canvas.width
    cut.height = sh
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh)
    if (i > 0) doc.addPage()
    decorate(doc, title, lang, reportDate(lang))
    doc.addImage(cut.toDataURL('image/jpeg', 0.95), 'JPEG', margin, top, availW, sh * widthScale)
  }
  cut.width = 0
  cut.height = 0
  release()
  return true
}

// opts.output: 'save' downloads the file; 'print' opens the PDF and triggers the
// browser's print dialog. opts.win is a window the caller opened synchronously
// inside the click (so it survives popup blockers). Returns 'saved' | 'printed'.
// The PDF is serialized exactly once and its blob URL is revoked after a delay.
function finalize(doc, page, opts) {
  const { output = 'save', win = null } = opts || {}
  const name = `737trainer-${page}-${fileStamp()}.pdf`
  if (output !== 'print') {
    doc.save(name)
    return 'saved'
  }
  doc.autoPrint()
  const url = URL.createObjectURL(doc.output('blob'))
  const cleanup = () => setTimeout(() => URL.revokeObjectURL(url), 60000)
  if (win && !win.closed) {
    win.location.href = url
    cleanup()
    return 'printed'
  }
  let opened = null
  try {
    opened = window.open(url, '_blank')
  } catch (e) {
    opened = null
  }
  if (opened) {
    cleanup()
    return 'printed'
  }
  // Popup blocked and no pre-opened window: download the already-built blob
  // (no second serialization) instead.
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  cleanup()
  return 'saved'
}

// ---------------------------------------------------------------- Trainers ---
async function exportTrainersPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('trainers_title'), lang)
  const rows = [...data.trainers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  table(ctx, {
    head: [t('f_qual'), t('f_base'), t('f_tlc'), t('f_name'), t('f_role'), t('f_remark'), t('f_partTime'), t('f_fte'), t('f_aircraft'), t('f_ore'), t('f_staffType'), t('f_authority'), t('f_conversion')],
    body: rows.map((x) => [
      qualLabel(data.quals, x.qual), x.base || '', x.tlc || '', x.name || '',
      t(x.role === 'fo' ? 'role_foShort' : 'role_captainShort'), x.remark || '',
      formatPartTime(x.partTime, lang), formatFte(x.fte), x.aircraft || '', x.ore || '',
      t('staff_' + (x.staffType || 'internal')), x.authority || '',
      stageLabel(data.stages.find((s) => s.id === x.conv?.stage))
    ]),
    columnStyles: { 3: { cellWidth: 110 }, 5: { cellWidth: 80 } }
  })
  return finalize(doc, 'trainer', opts)
}

// ---------------------------------------------------------------- Planning ---
async function exportPlanningPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('planning_title'), lang)
  const steps = data.assignmentSteps
  const rows = [...data.trainers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const cellLabel = (a) => {
    if (!a) return ''
    if (a.status === 'na') return 'n/a'
    const p = data.providers.find((x) => x.id === a.providerId)
    if (p && p.name) return p.name
    return a.location || ''
  }
  // Untouched cells (no provider/location, default 'open') export as empty –
  // matching the on-screen "+ zuweisen" state – instead of " [offen]".
  const stepCell = (x, s) => {
    const a = x.assignments?.[s.id]
    if (!a) return ''
    const lbl = cellLabel(a)
    if (!lbl) return ''
    if (a.status === 'na') return lbl
    const st = ASSIGNMENT_STATUS[a.status]
    const stl = st ? ` [${lang === 'de' ? st.de : st.en}]` : ''
    return lbl + stl
  }
  table(ctx, {
    section: t('planning_title'),
    head: [t('f_name'), t('f_base'), t('f_qual'), t('f_aircraft'), t('f_staffType'), ...steps.map((s) => s.label)],
    body: rows.map((x) => [
      x.name || '', x.base || '', qualLabel(data.quals, x.qual), x.aircraft || '',
      t('staff_' + (x.staffType || 'internal')), ...steps.map((s) => stepCell(x, s))
    ])
  })
  // Course calendar: one table per month, so the printout shows at a glance
  // when each trainer starts which course.
  const entries = courseEntries(data.trainers, steps, data.providers)
  const months = courseMonths(entries).filter((m) => m.items.length)
  if (months.length) {
    for (const m of months) {
      table(ctx, {
        section: `${monthTitle(m.month, lang)} — ${t('planning_calendarStarts')}: ${m.items.length}`,
        head: [t('targetDate'), t('f_tlc'), t('f_name'), t('stage'), t('provider'), t('status')],
        body: m.items.map((it) => [
          formatDate(it.iso, lang),
          it.trainer.tlc || '',
          it.trainer.name || '',
          it.step.label,
          it.where || '-',
          ASSIGNMENT_STATUS[it.status] ? (lang === 'de' ? ASSIGNMENT_STATUS[it.status].de : ASSIGNMENT_STATUS[it.status].en) : ''
        ]),
        columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 40 } }
      })
    }
  } else {
    table(ctx, {
      section: t('planning_calendar'),
      head: [t('targetDate'), t('f_name'), t('stage')],
      body: [['-', t('planning_calendarEmpty'), '']]
    })
  }
  return finalize(doc, 'planung', opts)
}

// --------------------------------------------------------------- Providers ---
async function exportProvidersPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('providers_title'), lang)
  const providers = [...data.providers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const statusLabel = (id) => (data.providerStatus.find((s) => s.id === id) || {}).label || ''
  table(ctx, {
    section: t('providers_title'),
    head: [t('p_name'), t('p_courses'), t('p_simVersion'), t('p_locations'), t('p_contact'), t('p_capacity'), t('p_status')],
    body: providers.map((p) => [
      p.name || '', [...(p.courses || [])].map((c) => courseLabel(data.providerCourses, c)).sort().join(', '),
      [...(p.simVersions || [])].map((s) => simVersionLabel(data.simVersions, s)).sort().join(', '),
      [...(p.locations || [])].sort().join(', '),
      p.contactPerson || '', p.capacity || '', statusLabel(p.status)
    ])
  })
  const util = providerUtilization(data.trainers, data.providers, data.assignmentSteps)
  table(ctx, {
    section: t('prov_capacity'),
    head: [t('p_name'), t('prov_assigned'), t('prov_slots'), t('prov_util')],
    body: util.map((u) => [u.provider.name || '', String(u.demand), u.slots ? String(u.slots) : '-', u.util == null ? '-' : Math.round(u.util * 100) + '%']),
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
  })
  return finalize(doc, 'provider', opts)
}

// ---------------------------------------------------------------- Capacity ---
// FTE cells go through the same formatter the screen uses – printing them raw
// gave the PDF "42.9" where the tab said "42,9" for the identical figure.
function capCells(r, cap, lang) {
  const f = (v) => formatFte1(v, lang)
  return [String(r.headcount), f(r.total), f(r.inConversion), f(r.available), f(r.ac[cap.aircraft[0]] ?? 0), f(r.ac[cap.aircraft[1]] ?? 0)]
}
function capBody(cap, lang, labelFor) {
  return cap.rows.map((r) => [labelFor ? labelFor(r.key) : r.key, ...capCells(r, cap, lang)])
}
function capFoot(cap, lang, totalLabel) {
  return [[totalLabel, ...capCells(cap.totals, cap, lang)]]
}
async function exportCapacityPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('capacity_title'), lang)
  const capQ = capacityByQual(data.trainers, AIRCRAFT, data.stages)
  const capA = capacityByAircraft(data.trainers, AIRCRAFT, data.stages)
  const capB = capacityByBase(data.trainers, AIRCRAFT, data.stages)
  const numCols = { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
  const headRow = (first) => [first, t('cap_head'), t('cap_total'), t('cap_inConv'), t('cap_avail'), AIRCRAFT[0], AIRCRAFT[1]]
  table(ctx, { section: t('capacity_byQual'), head: headRow(t('f_qual')), body: capBody(capQ, lang, (k) => qualLabel(data.quals, k)), foot: capFoot(capQ, lang, t('total')), columnStyles: numCols })
  table(ctx, { section: t('capacity_byAircraft'), head: headRow(t('f_aircraft')), body: capBody(capA, lang), foot: capFoot(capA, lang, t('total')), columnStyles: numCols })
  table(ctx, { section: t('capacity_byBase'), head: headRow(t('f_base')), body: capBody(capB, lang), foot: capFoot(capB, lang, t('total')), columnStyles: numCols })
  const months = targetsByMonth(conversionTrainers(data.trainers), null, data.stages)
  const tl = []
  for (const m of months) for (const it of m.items) tl.push([monthLabel(m.month, lang), it.trainer.name || '', it.trainer.base || '', stageName(data.stages, it.trainer.conv?.stage), formatDate(it.trainer.conv?.target, lang)])
  table(ctx, {
    section: t('capacity_timeline'),
    head: [t('month'), t('f_name'), t('f_base'), t('stage'), t('targetDate')],
    body: tl.length ? tl : [['-', t('capacity_noTargets'), '', '', '']]
  })
  return finalize(doc, 'kapazitaet', opts)
}

// --------------------------------------------------------------- Dashboard ---
async function exportDashboardPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  // Preferred: a rasterized copy of the on-screen dashboard (KPI tiles + charts),
  // scaled to fit one A4 page. Falls back to the data-table view below when no
  // capture was supplied or the capture came back degenerate (zero-size).
  if (opts && opts.canvas) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
    if (addCanvasPages(doc, opts.canvas, 'Dashboard', lang)) {
      return finalize(doc, 'dashboard', opts)
    }
    // fall through to the table-based dashboard rather than saving a blank page
  }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, 'Dashboard', lang)
  const trainers = data.trainers
  const hc = headcount(trainers)
  // Conversion figures cover SEN / TRE / TRI / LTC only (no SFI / TKI).
  const convPool = conversionTrainers(trainers)
  const cs = conversionSummary(convPool, data.stages)
  const fte = conversionFteSummary(convPool, data.stages)
  const bd = (label, rows) =>
    table(ctx, { section: label, head: [t('category'), t('count')], body: rows.map((r) => [r.label || r.key, String(r.count)]), columnStyles: { 1: { halign: 'right', cellWidth: 80 } } })
  // Mirrors the on-screen sections: overview first, then the B737 conversion.
  table(ctx, {
    section: t('section_overview'),
    head: [t('category'), t('count')],
    // Mirrors the on-screen summary band: heads and FTE only. The per-qual,
    // Captain/FO and active rows that used to sit here repeat in the tables
    // right below (byQual, chart_role), same as the tiles they came from.
    // fteActive, and labelled: hc.fte counts the retirees too, so this row
    // used to print a bigger total than the very same band on screen.
    body: [
      [t('kpi_totalTrainers'), String(hc.total)],
      ['FTE ' + t('total') + ' (' + t('fteExclRetired') + ')', formatFte1(hc.fteActive, lang)]
    ],
    columnStyles: { 1: { halign: 'right', cellWidth: 80 } }
  })
  bd(t('stat_qual'), byQual(trainers, data.quals.map((q) => q.id)).map((r) => ({ ...r, label: qualLabel(data.quals, r.key) })))
  // Qualification per aircraft (A320 / B737) as one row per qual.
  table(ctx, {
    section: t('chart_qualByAircraft'),
    head: [t('f_qual'), AIRCRAFT[0], AIRCRAFT[1], t('total')],
    body: qualByAircraft(trainers, data.quals.map((q) => q.id), AIRCRAFT).map((r) => [
      qualLabel(data.quals, r.key), String(r[AIRCRAFT[0]] || 0), String(r[AIRCRAFT[1]] || 0), String(r.count)
    ]),
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
  })
  bd(t('chart_role'), [{ key: t('role_captain'), count: hc.captains }, { key: t('role_fo'), count: hc.firstOfficers }])
  bd(t('stat_base'), byBase(trainers))
  bd(t('stat_aircraft'), AIRCRAFT.map((a) => ({ key: a, count: trainers.filter((x) => x.aircraft === a).length })))
  bd(t('stat_authority'), byAuthority(trainers))
  bd(t('stat_partTime'), byPartTime(trainers))
  const fn = byFunction(trainers)
  bd(t('stat_function'), [{ key: t('withFunction'), count: fn.withFunction }, { key: t('withoutFunction'), count: fn.withoutFunction }])
  const staffInt = trainers.filter((x) => (x.staffType || 'internal') === 'internal').length
  bd(t('filterStaff'), [{ key: t('staff_internal'), count: staffInt }, { key: t('staff_external'), count: trainers.length - staffInt }])
  table(ctx, {
    section: t('section_conversion'),
    head: [t('category'), t('count')],
    body: [
      [t('kpi_released'), String(cs.released)],
      [t('kpi_inProgress'), String(cs.inProgress)],
      [t('kpi_notStarted'), String(cs.notStarted)],
      [t('kpi_fteInConversion'), formatFte1(fte.inConversion, lang)],
      [t('kpi_fteAvailable'), formatFte1(fte.available, lang)],
      ['FTE ' + t('total') + ' ' + t('fteConvScope'), formatFte1(fte.total, lang)]
    ],
    columnStyles: { 1: { halign: 'right', cellWidth: 80 } }
  })
  bd(t('chart_byOre'), byOre(convPool))
  return finalize(doc, 'dashboard', opts)
}

// -------------------------------------------------------------- Conversion ---
async function exportConversionPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('conversion_title'), lang)
  const stages = data.stages
  const stageIds = new Set(stages.map((s) => s.id))
  const firstId = firstStageId(stages)
  // Conversion covers SEN / TRE / TRI / LTC only (no SFI / TKI).
  const convPool = conversionTrainers(data.trainers)
  const visible = convPool.filter((x) => x.ore !== 'Rente')
  const fte = conversionFteSummary(convPool, stages)
  table(ctx, {
    section: t('conversion_title'),
    head: [t('category'), t('count')],
    body: [
      [t('fteInConversionShort'), formatFte1(fte.inConversion, lang)],
      [t('fteAvailableShort'), formatFte1(fte.available, lang)],
      ['FTE ' + t('total') + ' ' + t('fteConvScope'), formatFte1(fte.total, lang)]
    ],
    columnStyles: { 1: { halign: 'right', cellWidth: 80 } }
  })
  stages.forEach((s, si) => {
    const cards = visible.filter((x) => {
      const stg = x.conv?.stage || firstId
      return stg === s.id || (si === 0 && !stageIds.has(stg))
    })
    table(ctx, {
      section: `${stageLabel(s)} (${cards.length})`,
      head: [t('f_name'), t('f_base'), t('f_qual'), t('f_aircraft'), t('status'), t('targetDate')],
      body: cards.length
        ? cards.map((x) => [
            x.name || '', x.base || '', qualLabel(data.quals, x.qual), x.aircraft || '',
            (CONV_STATUS[x.conv?.status] ? (lang === 'de' ? CONV_STATUS[x.conv.status].de : CONV_STATUS[x.conv.status].en) : ''),
            x.conv?.target ? formatDate(x.conv.target, lang) : '-'
          ])
        : [['-', '', '', '', '', '']]
    })
  })
  return finalize(doc, 'umschulung', opts)
}

// ----------------------------------------------------------- Other pilots ---
async function exportPilotsPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('pilots_title'), lang)
  const all = [...(data.otherPilots || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const head = [t('f_name'), t('f_tlc'), t('f_base'), t('f_position'), t('f_b737Until'), t('f_comment')]
  const row = (p) => [
    p.name || '', p.tlc || '', p.base || '',
    t(pilotRole(p) === 'fo' ? 'role_fo' : 'role_captain'),
    p.b737Until ? formatDate(p.b737Until, lang) : '-',
    p.remark || ''
  ]
  // One section per B737 standing, so the printout groups the way the tab does.
  for (const st of PILOT_STATUS_IDS) {
    const group = all.filter((p) => p.status === st)
    table(ctx, {
      section: `${pilotStatusLabel(st, lang)} (${group.length})`,
      head,
      body: group.length ? group.map(row) : [['-', '', '', '', '', '']]
    })
  }
  return finalize(doc, 'other-pilots', opts)
}

const EXPORTERS = {
  dashboard: exportDashboardPdf,
  conversion: exportConversionPdf,
  capacity: exportCapacityPdf,
  trainers: exportTrainersPdf,
  planning: exportPlanningPdf,
  providers: exportProvidersPdf,
  pilots: exportPilotsPdf
}

// Dispatch by tab id. Returns a promise that resolves once the PDF is saved.
export function exportPagePdf(pageId, data, t, lang, opts = {}) {
  const fn = EXPORTERS[pageId]
  if (!fn) return Promise.reject(new Error('unknown page ' + pageId))
  return fn(data, t, lang, opts)
}
