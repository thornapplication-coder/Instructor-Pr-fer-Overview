// Per-page PDF reports, generated directly from the current store data.
// No window.print(), no DOM scraping: this guarantees the correct page and the
// current data on every platform (desktop, iPhone, iPad – the file downloads /
// opens in the share sheet). jsPDF + autotable are lazy-loaded (heavy).
import { APP_VERSION, COPYRIGHT } from '../version.js'
import { formatPartTime, formatFte, formatDate } from './format.js'
import { stageLabel, CONV_STATUS, ASSIGNMENT_STATUS } from '../data/pipeline.js'
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
  capacityByBase,
  capacityByQual,
  providerUtilization
} from './stats.js'
import { collectAlerts, stageName, targetsByMonth, monthLabel } from './alerts.js'

const BURG = [175, 30, 101]
const BURG_DARK = [135, 28, 84]
const GREEN = [47, 163, 107]
const GREY = [120, 120, 120]

let _pdf = null
async function loadPdf() {
  if (_pdf) return _pdf
  const [jsMod, autoMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  _pdf = { jsPDF: jsMod.jsPDF || jsMod.default, autoTable: autoMod.default || autoMod }
  return _pdf
}

function stamp() {
  return new Date().toISOString().slice(0, 10)
}
function dateStrOf(lang) {
  return new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')
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
  doc.text('737 TRAINER', 40, 23)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(title, 40, 40)
  doc.setFontSize(9)
  doc.text(dateStr, W - 40, 23, { align: 'right' })
  doc.setTextColor(...GREY)
  doc.setFontSize(8)
  doc.text(`${COPYRIGHT} · v${APP_VERSION}`, 40, H - 16)
  doc.text(String(doc.internal.getCurrentPageInfo().pageNumber), W - 40, H - 16, { align: 'right' })
}

function makeCtx(doc, autoTable, title, lang) {
  const ctx = { doc, autoTable, title, lang, dateStr: dateStrOf(lang), y: 66 }
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

// output: 'save' downloads the file; 'print' opens the PDF and triggers the
// browser's print dialog (falls back to download if the window is blocked).
function finalize(doc, page, output) {
  const name = `737trainer-${page}-${stamp()}.pdf`
  if (output === 'print') {
    doc.autoPrint()
    const url = doc.output('bloburl')
    const w = window.open(url, '_blank')
    if (!w) doc.save(name)
    return
  }
  doc.save(name)
}

// ---------------------------------------------------------------- Trainers ---
async function exportTrainersPdf(data, t, lang, output) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('trainers_title'), lang)
  const rows = [...data.trainers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  table(ctx, {
    head: [t('f_qual'), t('f_base'), t('f_tlc'), t('f_name'), t('f_remark'), t('f_partTime'), t('f_fte'), t('f_aircraft'), t('f_ore'), t('f_staffType'), t('f_authority'), t('f_conversion')],
    body: rows.map((x) => [
      x.qual || '', x.base || '', x.tlc || '', x.name || '', x.remark || '',
      formatPartTime(x.partTime, lang), formatFte(x.fte), x.aircraft || '', x.ore || '',
      t('staff_' + (x.staffType || 'internal')), x.authority || '',
      stageLabel(data.stages.find((s) => s.id === x.conv?.stage))
    ]),
    columnStyles: { 3: { cellWidth: 120 }, 4: { cellWidth: 90 } }
  })
  finalize(doc, 'trainer', output)
}

// ---------------------------------------------------------------- Planning ---
async function exportPlanningPdf(data, t, lang, output) {
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
  const stepCell = (x, s) => {
    const a = x.assignments?.[s.id]
    if (!a) return ''
    const lbl = cellLabel(a)
    const st = ASSIGNMENT_STATUS[a.status]
    const stl = st && a.status && a.status !== 'na' ? ` [${lang === 'de' ? st.de : st.en}]` : ''
    return (lbl || '') + stl
  }
  table(ctx, {
    head: [t('f_name'), t('f_base'), t('f_qual'), t('f_aircraft'), t('f_staffType'), ...steps.map((s) => s.label)],
    body: rows.map((x) => [
      x.name || '', x.base || '', x.qual || '', x.aircraft || '',
      t('staff_' + (x.staffType || 'internal')), ...steps.map((s) => stepCell(x, s))
    ])
  })
  finalize(doc, 'planung', output)
}

// --------------------------------------------------------------- Providers ---
async function exportProvidersPdf(data, t, lang, output) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('providers_title'), lang)
  const providers = [...data.providers].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const statusLabel = (id) => (data.providerStatus.find((s) => s.id === id) || {}).label || ''
  table(ctx, {
    section: t('providers_title'),
    head: [t('p_name'), t('p_courses'), t('p_locations'), t('p_authority'), t('p_contact'), t('p_capacity'), t('p_status')],
    body: providers.map((p) => [
      p.name || '', [...(p.courses || [])].sort().join(', '), [...(p.locations || [])].sort().join(', '),
      p.authority || '', p.contactPerson || '', p.capacity || '', statusLabel(p.status)
    ])
  })
  const util = providerUtilization(data.trainers, data.providers, data.assignmentSteps)
  table(ctx, {
    section: t('prov_capacity'),
    head: [t('p_name'), t('prov_assigned'), t('prov_slots'), t('prov_util')],
    body: util.map((u) => [u.provider.name || '', String(u.demand), u.slots ? String(u.slots) : '-', u.util == null ? '-' : Math.round(u.util * 100) + '%']),
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
  })
  finalize(doc, 'provider', output)
}

// ---------------------------------------------------------------- Capacity ---
function capBody(cap) {
  return cap.rows.map((r) => [r.key, String(r.headcount), String(r.total), String(r.inConversion), String(r.available), String(r.ac[cap.aircraft[0]] ?? 0), String(r.ac[cap.aircraft[1]] ?? 0)])
}
function capFoot(cap, totalLabel) {
  const tt = cap.totals
  return [[totalLabel, String(tt.headcount), String(tt.total), String(tt.inConversion), String(tt.available), String(tt.ac[cap.aircraft[0]] ?? 0), String(tt.ac[cap.aircraft[1]] ?? 0)]]
}
async function exportCapacityPdf(data, t, lang, output) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('capacity_title'), lang)
  const capQ = capacityByQual(data.trainers, AIRCRAFT)
  const capB = capacityByBase(data.trainers, AIRCRAFT)
  const numCols = { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
  const headRow = (first) => [first, t('cap_head'), t('cap_total'), t('cap_inConv'), t('cap_avail'), AIRCRAFT[0], AIRCRAFT[1]]
  table(ctx, { section: t('capacity_byQual'), head: headRow(t('f_qual')), body: capBody(capQ), foot: capFoot(capQ, t('total')), columnStyles: numCols })
  table(ctx, { section: t('capacity_byBase'), head: headRow(t('f_base')), body: capBody(capB), foot: capFoot(capB, t('total')), columnStyles: numCols })
  const months = targetsByMonth(data.trainers)
  const tl = []
  for (const m of months) for (const it of m.items) tl.push([monthLabel(m.month, lang), it.trainer.name || '', it.trainer.base || '', stageName(data.stages, it.trainer.conv?.stage), formatDate(it.trainer.conv?.target, lang)])
  table(ctx, {
    section: t('capacity_timeline'),
    head: [t('stage'), t('f_name'), t('f_base'), t('stage'), t('targetDate')],
    body: tl.length ? tl : [['-', t('capacity_noTargets'), '', '', '']]
  })
  finalize(doc, 'kapazitaet', output)
}

// --------------------------------------------------------------- Dashboard ---
async function exportDashboardPdf(data, t, lang, output) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, 'Dashboard', lang)
  const trainers = data.trainers
  const hc = headcount(trainers)
  const cs = conversionSummary(trainers)
  const fte = conversionFteSummary(trainers)
  table(ctx, {
    section: 'KPIs',
    head: [t('category'), t('count')],
    body: [
      [t('kpi_totalTrainers'), String(hc.total)],
      [t('kpi_examiners'), String(hc.examiners)],
      [t('kpi_instructors'), String(hc.instructors)],
      [t('kpi_active'), String(hc.active)],
      [t('kpi_released'), String(cs.released)],
      [t('kpi_inProgress'), String(cs.inProgress)],
      [t('kpi_notStarted'), String(cs.notStarted)],
      [t('kpi_fteInConversion'), String(fte.inConversion)],
      [t('kpi_fteAvailable'), String(fte.available)],
      ['FTE ' + t('total'), String(fte.total)]
    ],
    columnStyles: { 1: { halign: 'right', cellWidth: 80 } }
  })
  const bd = (label, rows) =>
    table(ctx, { section: label, head: [t('category'), t('count')], body: rows.map((r) => [r.label || r.key, String(r.count)]), columnStyles: { 1: { halign: 'right', cellWidth: 80 } } })
  bd(t('stat_qual'), byQual(trainers, data.quals.map((q) => q.id)))
  bd(t('stat_base'), byBase(trainers))
  bd(t('chart_byOre'), byOre(trainers))
  bd(t('stat_authority'), byAuthority(trainers))
  bd(t('stat_partTime'), byPartTime(trainers))
  const fn = byFunction(trainers)
  bd(t('stat_function'), [{ key: t('withFunction'), count: fn.withFunction }, { key: t('withoutFunction'), count: fn.withoutFunction }])
  const staffInt = trainers.filter((x) => (x.staffType || 'internal') === 'internal').length
  bd(t('filterStaff'), [{ key: t('staff_internal'), count: staffInt }, { key: t('staff_external'), count: trainers.length - staffInt }])
  const alerts = collectAlerts(trainers)
  table(ctx, {
    section: t('alerts_title'),
    head: [t('f_name'), t('f_base'), t('stage'), t('status'), t('targetDate')],
    body: alerts.length
      ? alerts.map((a) => [a.trainer.name || '', a.trainer.base || '', stageName(data.stages, a.trainer.conv?.stage), a.reasons.map((r) => t('alert_' + r)).join(', '), a.trainer.conv?.target ? formatDate(a.trainer.conv.target, lang) : '-'])
      : [['-', t('alerts_none'), '', '', '']]
  })
  finalize(doc, 'dashboard', output)
}

// -------------------------------------------------------------- Conversion ---
async function exportConversionPdf(data, t, lang, output) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const ctx = makeCtx(doc, autoTable, t('conversion_title'), lang)
  const stages = data.stages
  const stageIds = new Set(stages.map((s) => s.id))
  const visible = data.trainers.filter((x) => x.ore !== 'Rente')
  const fte = conversionFteSummary(data.trainers)
  table(ctx, {
    section: t('conversion_title'),
    head: [t('category'), t('count')],
    body: [
      [t('fteInConversionShort'), String(fte.inConversion)],
      [t('fteAvailableShort'), String(fte.available)],
      ['FTE ' + t('total'), String(fte.total)]
    ],
    columnStyles: { 1: { halign: 'right', cellWidth: 80 } }
  })
  stages.forEach((s, si) => {
    const cards = visible.filter((x) => {
      const stg = x.conv?.stage || 'nominated'
      return stg === s.id || (si === 0 && !stageIds.has(stg))
    })
    table(ctx, {
      section: `${stageLabel(s)} (${cards.length})`,
      head: [t('f_name'), t('f_base'), t('f_qual'), t('f_aircraft'), t('status'), t('targetDate')],
      body: cards.length
        ? cards.map((x) => [
            x.name || '', x.base || '', x.qual || '', x.aircraft || '',
            (CONV_STATUS[x.conv?.status] ? (lang === 'de' ? CONV_STATUS[x.conv.status].de : CONV_STATUS[x.conv.status].en) : ''),
            x.conv?.target ? formatDate(x.conv.target, lang) : '-'
          ])
        : [['-', '', '', '', '', '']]
    })
  })
  finalize(doc, 'umschulung', output)
}

const EXPORTERS = {
  dashboard: exportDashboardPdf,
  conversion: exportConversionPdf,
  capacity: exportCapacityPdf,
  trainers: exportTrainersPdf,
  planning: exportPlanningPdf,
  providers: exportProvidersPdf
}

// Dispatch by tab id. Returns a promise that resolves once the PDF is saved.
export function exportPagePdf(pageId, data, t, lang, output = 'save') {
  const fn = EXPORTERS[pageId]
  if (!fn) return Promise.reject(new Error('unknown page ' + pageId))
  return fn(data, t, lang, output)
}
