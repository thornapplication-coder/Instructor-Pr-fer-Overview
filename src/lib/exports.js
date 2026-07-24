// Excel export: a branded HTML-table .xls blob (opens natively in Excel with
// the correct columns, no dependency). Header carries the 737 TRAINER brand,
// the report title and the date (date only, no time).
import { APP_VERSION, COPYRIGHT } from '../version.js'

// Date only, no time (DD.MM.YYYY).
function dateOnly() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

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

// columns: [{ label, value(row) }]. rows: array. title: report name for the brand row.
export function downloadExcel(filenameBase, columns, rows, title) {
  const n = columns.length
  const brandRow =
    `<tr><td colspan="${n}" style="background:#AF1E65;color:#ffffff;font-size:15px;font-weight:bold;padding:8px 10px">` +
    `737 TRAINER${title ? ' — ' + esc(title) : ''}</td></tr>`
  const dateRow =
    `<tr><td colspan="${n}" style="background:#871C54;color:#ffffff;font-size:11px;padding:3px 10px">Stand: ${dateOnly()}</td></tr>`
  const head = '<tr>' + columns.map((c) => `<th>${esc(c.label)}</th>`).join('') + '</tr>'
  const body = rows
    .map((r) => '<tr>' + columns.map((c) => `<td>${esc(c.value(r))}</td>`).join('') + '</tr>')
    .join('')
  const footRow =
    `<tr><td colspan="${n}" style="color:#787878;font-size:10px;padding:6px 10px;border:0">` +
    `${esc(COPYRIGHT + ' · v' + APP_VERSION)}</td></tr>`
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
    '<head><meta charset="utf-8"><style>th{background:#AF1E65;color:#fff;text-align:left}td,th{border:1px solid #ccc;padding:4px 8px}</style></head>' +
    `<body><table>${brandRow}${dateRow}${head}${body}${footRow}</table></body></html>`
  const stamp = new Date().toISOString().slice(0, 10)
  download(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' }), `${filenameBase}-${stamp}.xls`)
}
