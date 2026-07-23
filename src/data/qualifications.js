// Trainer qualifications ("Berechtigungen"). User-editable list (rename / recolor
// / add / delete / reorder). The ORDER of this list defines the sort order used
// everywhere in the app. Default order per spec: SEN, TRE, TRI, new TRI, LTC, SFI, TKI.
// `id` is what is stored on each trainer (trainer.qual); `label` is what is shown.
export const DEFAULT_QUALS = [
  { id: 'SEN',     label: 'SEN',     color: '#701745' },
  { id: 'TRE',     label: 'TRE',     color: '#AF1E65' },
  { id: 'TRI',     label: 'TRI',     color: '#00A6CF' },
  { id: 'new TRI', label: 'new TRI', color: '#6BCCE0' },
  { id: 'LTC',     label: 'LTC',     color: '#871C54' },
  { id: 'SFI',     label: 'SFI',     color: '#D41370' },
  { id: 'TKI',     label: 'TKI',     color: '#2FA36B' }
]

// Map legacy / imported qualification strings onto the canonical ids.
export function normalizeQual(q) {
  const s = String(q || '').trim()
  if (!s) return ''
  if (/sen/i.test(s)) return 'SEN' // "TRE/SEN", "TRE /SEN" -> senior examiner
  return s
}

// Index for sorting; unknown values sort last (stable, alphabetical among them).
export function qualIndex(quals, id) {
  const i = quals.findIndex((q) => q.id === id)
  return i < 0 ? quals.length + 1 : i
}
