// Single source of truth for the export branding (PDF + Excel), so the two
// report formats never drift apart. The CSS keeps its own --burg/--burg-dark
// variables in styles.css; keep those hex values in sync with BRAND_HEX below.
import { APP_VERSION, COPYRIGHT } from '../version.js'

export const BRAND_NAME = '737 TRAINER'

export const BRAND_HEX = {
  burg: '#AF1E65',
  burgDark: '#871C54',
  grey: '#787878'
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// Footer line shown on every PDF page and at the bottom of every Excel sheet.
export function footerLine() {
  return `${COPYRIGHT} · v${APP_VERSION}`
}

// Local (not UTC) YYYY-MM-DD for filenames, so a file's name matches the date
// printed on the report (they used to disagree across midnight).
export function fileStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Localized date, no time, for the report header ("Stand" / "as of").
export function reportDate(lang) {
  return new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB')
}
