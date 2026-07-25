// Export branding (PDF + Excel), so the two report formats never drift apart.
// The colours come from the documented palette rather than a second copy –
// this file used to carry its own hexes with a comment asking future readers to
// keep them in sync by hand, which is exactly how palettes drift.
import { APP_VERSION } from '../version.js'
import { BRAND, OVERFLOW } from './palette.js'

export const BRAND_NAME = '737 TRAINER'

export const BRAND_HEX = {
  burg: BRAND.burgundy,
  burgDark: BRAND.burgundyDark,
  grey: OVERFLOW
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// Footer line shown on every PDF page and at the bottom of every Excel sheet.
//
// No copyright notice: these reports are handed on, and a personal byline has
// no place on them. The version stays – on a printed page it is the only way to
// tell which build produced the numbers. Keep it matched by `isExportBanner()`
// in importExcel.js, or re-importing our own export adds it as a trainer.
export function footerLine() {
  return `v${APP_VERSION}`
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
