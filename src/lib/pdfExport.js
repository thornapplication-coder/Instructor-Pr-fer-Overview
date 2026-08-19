// Per-page PDF reports, generated directly from the current store data.
// No window.print(), no DOM scraping: this guarantees the correct page and the
// current data on every platform (desktop, iPhone, iPad – the file downloads /
// opens in the share sheet). jsPDF + autotable are lazy-loaded (heavy).
import { BRAND_NAME, BRAND_HEX, hexToRgb, fileStamp, reportDate } from './brand.js'
import { formatPartTime, formatFte, formatFte1, formatDate } from './format.js'
import { stageLabel, firstStageId } from '../data/pipeline.js'
import { qualLabel } from '../data/qualifications.js'
import { courseLabel, simVersionLabel } from '../data/providers.js'
import { pilotRole, pilotValidity, ratingValid } from '../data/pilots.js'
import { conversionTrainers, isOwnStaff, OTHER_QUALS } from '../data/qualifications.js'
import { AIRCRAFT } from '../data/aircraft.js'
import {
  headcount,
  conversionSummary,
  conversionFteSummary,
  byQual,
  byQualGroup,
  byBase,
  byOre,
  byAuthority,
  byPartTime,
  byFunction,
  qualByAircraft,
  capacityByBase,
  capacityByQual,
  capacityByAircraft,
  providerUtilization,
  providerSlots,
  capacityByMonth
} from './stats.js'
import { stageName, targetsByMonth, monthLabel } from './alerts.js'
import { capacityRange } from './months.js'
import { labelOf } from '../data/lists.js'
import { courseEntries, courseMonths, monthTitle } from './courseCalendar.js'
import { findRun, resolveAssignment, seatUsage, spanDays, spanText } from './courses.js'

const BURG = hexToRgb(BRAND_HEX.burg)
const BURG_DARK = hexToRgb(BRAND_HEX.burgDark)

let _pdf = null
async function loadPdf() {
  if (_pdf) return _pdf
  const [jsMod, autoMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  _pdf = { jsPDF: jsMod.jsPDF || jsMod.default, autoTable: autoMod.default || autoMod }
  return _pdf
}


// Page margin for the table reports, in points. 24pt ≈ 8.5 mm – narrow enough
// to use the sheet, wide enough that no printer clips the outer column.
const PAGE_MARGIN = 24

// Branded header, drawn on every page via autotable's didDrawPage. No footer:
// neither the version nor the page number earns the strip of paper it costs,
// and without it the table may run to the bottom edge.
function decorate(doc, title, lang, dateStr) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...BURG)
  doc.rect(0, 0, W, 50, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(BRAND_NAME, PAGE_MARGIN, 23)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(title, PAGE_MARGIN, 40)
  doc.setFontSize(9)
  doc.text(dateStr, W - PAGE_MARGIN, 23, { align: 'right' })
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
    // top clears the branded header band; bottom is just breathing room now
    // that nothing is printed down there.
    margin: { top: 60, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
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
  const margin = PAGE_MARGIN
  const top = 58 // below the header bar
  const bottom = PAGE_MARGIN
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
    // Same column order as the on-screen table: the two free-text columns last.
    head: [t('f_qual'), t('f_base'), t('f_tlc'), t('f_name'), t('f_role'), t('f_seniority'), t('f_partTime'), t('f_fte'), t('f_aircraft'), t('f_ore'), t('f_staffType'), t('f_extCompany'), t('f_authority'), t('f_conversion'), t('f_remark'), t('f_note')],
    body: rows.map((x) => [
      qualLabel(data.quals, x.qual), x.base || '', x.tlc || '', x.name || '',
      t(x.role === 'fo' ? 'role_foShort' : 'role_captainShort'),
      // Seniority, ORE and the conversion phase only where they exist: they
      // are places in OUR list, OUR priority scheme and OUR pipeline, and the
      // screen leaves them blank for an external trainer. An export that
      // printed a leftover value would contradict the table it exports.
      isOwnStaff(x) && x.seniority ? formatDate(x.seniority, lang) : '',
      formatPartTime(x.partTime, lang), formatFte(x.fte), x.aircraft || '',
      isOwnStaff(x) ? x.ore || '' : '',
      t('staff_' + (x.staffType || 'internal')),
      x.staffType === 'external' ? labelOf(data.extCompanies, x.extCompany, '') : '',
      x.authority || '',
      isOwnStaff(x) ? stageLabel(data.stages.find((s) => s.id === x.conv?.stage)) : '',
      x.remark || '', x.note || ''
    ]),
    columnStyles: { 3: { cellWidth: 110 }, 14: { cellWidth: 80 }, 15: { cellWidth: 80 } }
  })
  return finalize(doc, 'trainer', opts)
}

// ---------------------------------------------------------------- Planning ---
// The planning grid and the course calendar as blocks, so the Umschulung PDF
// can carry all three of the tab's views – board, grid, calendar – in one file,
// which is what the tab now IS.
function planningTables(ctx, data, t, lang) {
  const steps = data.assignmentSteps
  const rows = [...data.trainers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  // Resolved through the course date, like the screen: otherwise the PDF of a
  // fully booked plan prints an empty grid.
  const cellLabel = (a) => {
    if (!a) return ''
    if (a.status === 'na') return 'n/a'
    const r = resolveAssignment(a, findRun(data.courseRuns, a.courseId))
    const p = data.providers.find((x) => x.id === r.providerId)
    if (p && p.name) return p.name
    return r.location || ''
  }
  const spanLabel = (a) => {
    const r = resolveAssignment(a, findRun(data.courseRuns, a.courseId))
    return spanText(r.from, r.to, lang)
  }
  // Untouched cells (no provider/location, default 'open') export as empty –
  // matching the on-screen "+ zuweisen" state – instead of " [offen]".
  const stepCell = (x, s) => {
    const a = x.assignments?.[s.id]
    if (!a) return ''
    // Same fallback as the screen: a booked course with no provider named yet
    // is a booking, not an empty cell.
    const lbl = cellLabel(a)
    const span = spanLabel(a)
    if (!lbl && !span) return ''
    if (a.status === 'na') return lbl || 'n/a'
    const stl = a.status ? ` [${labelOf(data.assignStatus, a.status, a.status)}]` : ''
    // Name AND period: the screen shows both in the cell, and a PDF that drops
    // the period is missing the thing the course dates exist for.
    return [lbl, span].filter(Boolean).join('\n') + stl
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
  const entries = courseEntries(data.trainers, steps, data.providers, data.courseRuns)
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
          labelOf(data.assignStatus, it.status, '')
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
}

async function exportPlanningPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('planning_title'), lang)
  planningTables(ctx, data, t, lang)
  return finalize(doc, 'planung', opts)
}

// One table of course dates. Shared by the provider PDF (where the capacity it
// is measured against lives) and by its own page.
function courseDatesTable(ctx, data, t, lang) {
  const runs = [...(data.courseRuns || [])].sort((a, b) => String(a.from).localeCompare(String(b.from)))
  const used = seatUsage(data.trainers, data.assignmentSteps)
  table(ctx, {
    section: t('manageCourseDates'),
    head: [t('course_type'), t('provider'), t('location'), t('course_from'), t('course_to'), t('course_days'), t('course_seats'), t('course_booked')],
    body: runs.length
      ? runs.map((r) => {
          const st = data.assignmentSteps.find((x) => x.id === r.stepId)
          const p = data.providers.find((x) => x.id === r.providerId)
          const days = spanDays(r.from, r.to)
          return [
            st ? st.label : '-', p ? p.name : '-', r.location || '-',
            r.from ? formatDate(r.from, lang) : '-', r.to ? formatDate(r.to, lang) : '-',
            days == null ? '-' : String(days), r.seats ? String(r.seats) : '-', String(used.get(r.id) || 0)
          ]
        })
      : [['-', t('course_none'), '', '', '', '', '', '']],
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
  })
}

async function exportCourseDatesPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('manageCourseDates'), lang)
  courseDatesTable(ctx, data, t, lang)
  // Who is on each course – the attendee list is the other half of the record.
  const runs = [...(data.courseRuns || [])].sort((a, b) => String(a.from).localeCompare(String(b.from)))
  for (const r of runs) {
    const people = data.trainers.filter((x) =>
      data.assignmentSteps.some((s) => {
        const a = x.assignments?.[s.id]
        return a && a.courseId === r.id && a.status !== 'na'
      })
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (!people.length) continue
    const st = data.assignmentSteps.find((x) => x.id === r.stepId)
    table(ctx, {
      section: `${st ? st.label : ''} ${spanText(r.from, r.to, lang)} — ${people.length}`,
      head: [t('f_tlc'), t('f_name'), t('f_base'), t('f_qual'), t('status')],
      body: people.map((x) => {
        const s2 = data.assignmentSteps.find((s3) => x.assignments?.[s3.id]?.courseId === r.id)
        const a = s2 ? x.assignments[s2.id] : null
        return [x.tlc || '', x.name || '', x.base || '', qualLabel(data.quals, x.qual), labelOf(data.assignStatus, a && a.status, '')]
      })
    })
  }
  return finalize(doc, 'kurstermine', opts)
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
    head: [t('p_name'), t('p_courses'), t('p_simVersion'), t('p_locations'), t('p_contact'), t('p_slots'), t('p_status')],
    body: providers.map((p) => [
      p.name || '', [...(p.courses || [])].map((c) => courseLabel(data.providerCourses, c)).sort().join(', '),
      [...(p.simVersions || [])].map((s) => simVersionLabel(data.simVersions, s)).sort().join(', '),
      [...(p.locations || [])].sort().join(', '),
      p.contactPerson || '', String(providerSlots(p, data.assignmentSteps).total || ''), statusLabel(p.status)
    ])
  })
  const util = providerUtilization(data.trainers, data.providers, data.assignmentSteps, data.courseRuns)
  table(ctx, {
    section: t('prov_capacity'),
    // The per-course-type breakdown is the point of the capacity figure: a
    // provider's total can look comfortable while the one course everybody
    // needs is the bottleneck. A PDF without it hides exactly that.
    head: [t('p_name'), t('p_courses'), t('prov_assigned'), t('prov_slots')],
    body: util.map((u) => [
      u.provider.name || '',
      data.assignmentSteps
        .filter((s2) => u.byStep[s2.id] || u.slotsByStep?.[s2.id])
        .map((s2) => `${s2.label}: ${u.byStep[s2.id] || 0}${u.slotsByStep?.[s2.id] ? ' / ' + u.slotsByStep[s2.id] : ''}`)
        .join('\n') || '-',
      String(u.demand),
      u.slots ? String(u.slots) : '-'
    ]),
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
  })
  // WHEN those seats fall. The two tables above are totals, and a printout that
  // stops there says a provider has forty seats without saying that thirty of
  // them are in 2027. Only the months that hold something are printed – a page
  // of zeros is not worth the paper.
  const capMonths = capacityRange(data.capacityFrom, data.capacityTo)
  const byMonth = capacityByMonth(data.providers, data.assignmentSteps, capMonths)
  const filled = byMonth.rows.filter((r) => r.total > 0)
  if (filled.length) {
    table(ctx, {
      section: t('cap_timelineTitle'),
      head: [t('p_month'), ...data.assignmentSteps.map((s) => s.label), t('total')],
      body: [
        ...filled.map((r) => [
          monthLabel(r.month, lang),
          ...data.assignmentSteps.map((s) => String(r.byStep[s.id] || '-')),
          String(r.total)
        ]),
        [t('total'), ...data.assignmentSteps.map((s) => String(byMonth.totals.byStep[s.id] || '-')), String(byMonth.totals.total)]
      ],
      columnStyles: Object.fromEntries(
        data.assignmentSteps.map((_, i) => [i + 1, { halign: 'right' }]).concat([[data.assignmentSteps.length + 1, { halign: 'right' }]])
      )
    })
  }

  // Course dates: a whole data set that existed nowhere in any export.
  courseDatesTable(ctx, data, t, lang)
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
    // Mirrors the on-screen summary band: heads and FTE only. The per-qual and
    // Captain/FO rows that used to sit here repeat in the tables right below
    // (byQual, chart_role), same as the tiles they came from.
    body: [
      [t('kpi_totalTrainers'), String(hc.total)],
      ['FTE ' + t('total'), formatFte1(hc.fte, lang)]
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
  // The four groups without a trainer grade of ours. Two columns, not one:
  // four external instructors at half time are four people and two FTE, and
  // the sheet is read by somebody planning against the second figure.
  const og = byQualGroup(trainers, OTHER_QUALS)
  table(ctx, {
    section: t('stat_otherGroups'),
    head: [t('category'), t('count'), 'FTE'],
    body: og.rows.map((r) => [qualLabel(data.quals, r.key), String(r.count), formatFte1(r.fte, lang)]),
    foot: [[t('total'), String(og.totals.count), formatFte1(og.totals.fte, lang)]],
    columnStyles: { 1: { halign: 'right', cellWidth: 60 }, 2: { halign: 'right', cellWidth: 60 } }
  })
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
  // Landscape: the tab's three views go in one file and the planning grid has
  // a column per course type, which portrait cannot hold.
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('conversion_title'), lang)
  const stages = data.stages
  const stageIds = new Set(stages.map((s) => s.id))
  const firstId = firstStageId(stages)
  // Conversion covers SEN / TRE / TRI / LTC only (no SFI / TKI).
  const convPool = conversionTrainers(data.trainers)
  const visible = convPool
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
            labelOf(data.convStatus, x.conv?.status, ''),
            x.conv?.target ? formatDate(x.conv.target, lang) : '-'
          ])
        : [['-', '', '', '', '', '']]
    })
  })
  // Board above, then the same tab's other two views.
  planningTables(ctx, data, t, lang)
  return finalize(doc, 'umschulung', opts)
}

// ----------------------------------------------------------- Other pilots ---
async function exportPilotsPdf(data, t, lang, opts) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('pilots_title'), lang)
  const pilots = [...data.otherPilots].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  // One row per rating, exactly like the roster it replaces; the continuation
  // row repeats nothing, so a person with two types reads as one block.
  const body = []
  for (const p of pilots) {
    const list = p.ratings && p.ratings.length ? p.ratings : [{ type: '', until: '' }]
    list.forEach((r, i) =>
      body.push([
        i === 0 ? p.base || '' : '',
        i === 0 ? p.tlc || '' : '',
        i === 0 ? p.name || '' : '',
        r.type || '',
        r.until ? formatDate(r.until, lang) : '',
        i === 0 && p.boeingExp ? 'x' : '',
        ratingValid(r) === true ? 'x' : '',
        ratingValid(r) === false ? 'x' : ''
      ])
    )
  }
  table(ctx, {
    section: t('pilots_title'),
    head: [t('f_base'), t('f_tlc'), t('f_name'), t('f_type'), t('f_validity'), t('f_boeingExp'), t('f_valid'), t('f_expired')],
    body: body.length ? body : [['-', '', t('pilots_none'), '', '', '', '', '']],
    columnStyles: {
      0: { cellWidth: 58 }, 1: { cellWidth: 36 }, 3: { cellWidth: 62 }, 4: { cellWidth: 68 },
      5: { halign: 'center', cellWidth: 74 }, 6: { halign: 'center', cellWidth: 46 }, 7: { halign: 'center', cellWidth: 58 }
    }
  })
  // The counts a reader would otherwise have to tally by hand off the page.
  const v = pilots.filter((p) => pilotValidity(p).valid).length
  const e = pilots.filter((p) => pilotValidity(p).expired).length
  table(ctx, {
    section: t('total'),
    head: [t('category'), t('count')],
    body: [
      [t('pilots_title'), String(pilots.length)],
      [t('f_valid'), String(v)],
      [t('f_expired'), String(e)],
      [t('f_boeingExp'), String(pilots.filter((p) => p.boeingExp).length)]
    ],
    columnStyles: { 1: { halign: 'right', cellWidth: 80 } }
  })
  return finalize(doc, 'other-pilots', opts)
}

const EXPORTERS = {
  dashboard: exportDashboardPdf,
  conversion: exportConversionPdf,
  capacity: exportCapacityPdf,
  trainers: exportTrainersPdf,
  planning: exportPlanningPdf,
  courseDates: exportCourseDatesPdf,
  providers: exportProvidersPdf,
  pilots: exportPilotsPdf
}

// Dispatch by tab id. Returns a promise that resolves once the PDF is saved.
export function exportPagePdf(pageId, data, t, lang, opts = {}) {
  const fn = EXPORTERS[pageId]
  if (!fn) return Promise.reject(new Error('unknown page ' + pageId))
  return fn(data, t, lang, opts)
}
