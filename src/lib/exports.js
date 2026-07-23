// Per-page exports.
// PDF: the browser's print dialog ("Save as PDF"); print CSS scopes it to the
//   visible tab. Excel: an HTML-table .xls blob (opens natively in Excel with
//   correct columns, no dependency).

export function exportPdf() {
  window.print()
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

// columns: [{ label, value(row) }]. rows: array.
export function downloadExcel(filenameBase, columns, rows) {
  const head = '<tr>' + columns.map((c) => `<th>${esc(c.label)}</th>`).join('') + '</tr>'
  const body = rows
    .map((r) => '<tr>' + columns.map((c) => `<td>${esc(c.value(r))}</td>`).join('') + '</tr>')
    .join('')
  const html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
    '<head><meta charset="utf-8"><style>th{background:#AF1E65;color:#fff;text-align:left}td,th{border:1px solid #ccc;padding:4px 8px}</style></head>' +
    `<body><table>${head}${body}</table></body></html>`
  const stamp = new Date().toISOString().slice(0, 10)
  download(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' }), `${filenameBase}-${stamp}.xls`)
}
