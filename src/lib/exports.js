// Excel export: a branded HTML-table .xls blob (opens natively in Excel with
// the correct columns, no dependency). Header carries the 737 TRAINER brand,
// the report title and the localized date (date only, no time).
import { BRAND_NAME, BRAND_HEX, footerLine, fileStamp, reportDate } from './brand.js'
import { translate } from './i18n.js'

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// columns: [{ label, value(row) }]. rows: array. title: report name. lang: DE/EN.
export function downloadExcel(filenameBase, columns, rows, title, lang) {
  const n = columns.length
  const asOf = translate(lang === 'en' ? 'en' : 'de', 'asOf')
  const brandRow =
    `<tr><td colspan="${n}" style="background:${BRAND_HEX.burg};color:#ffffff;font-size:15px;font-weight:bold;padding:8px 10px">` +
    `${BRAND_NAME}${title ? ' — ' + esc(title) : ''}</td></tr>`
  const dateRow =
    `<tr><td colspan="${n}" style="background:${BRAND_HEX.burgDark};color:#ffffff;font-size:11px;padding:3px 10px">` +
    `${esc(asOf)}: ${esc(reportDate(lang))}</td></tr>`
  const head = '<tr>' + columns.map((c) => `<th>${esc(c.label)}</th>`).join('') + '</tr>'
  const body = rows
    .map((r) => '<tr>' + columns.map((c) => `<td>${esc(c.value(r))}</td>`).join('') + '</tr>')
    .join('')
  const footRow =
    `<tr><td colspan="${n}" style="color:${BRAND_HEX.grey};font-size:10px;padding:6px 10px;border:0">` +
    `${esc(footerLine())}</td></tr>`
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
    `<head><meta charset="utf-8"><style>th{background:${BRAND_HEX.burg};color:#fff;text-align:left}td,th{border:1px solid #ccc;padding:4px 8px}</style></head>` +
    `<body><table>${brandRow}${dateRow}${head}${body}${footRow}</table></body></html>`
  download(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' }), `${filenameBase}-${fileStamp()}.xls`)
}
