import React from 'react'
import { exportPdf } from '../lib/exports.js'

// Per-page export controls. PDF always available (print → Save as PDF); Excel
// only when an onExcel handler is provided (tabular pages).
export default function ExportBar({ onExcel }) {
  return (
    <span className="export-bar no-print">
      <button className="btn btn-ghost btn-sm" onClick={exportPdf} title="PDF">⤓ PDF</button>
      {onExcel && (
        <button className="btn btn-ghost btn-sm" onClick={onExcel} title="Excel">⤓ Excel</button>
      )}
    </span>
  )
}
