// Trainer qualifications ("Berechtigungen"). User-editable list (rename / recolor
// / add / delete / reorder). The ORDER of this list defines the sort order used
// everywhere in the app. Default order per spec: SEN, TRE, TRI, LTC, SFI, TKI.
// `id` is what is stored on each trainer (trainer.qual); `label` is what is shown.
export const DEFAULT_QUALS = [
  { id: 'SEN',     label: 'SEN',     color: '#701745' },
  { id: 'TRE',     label: 'TRE',     color: '#AF1E65' },
  { id: 'TRI',     label: 'TRI',     color: '#00A6CF' },
  { id: 'LTC',     label: 'LTC',     color: '#871C54' },
  { id: 'SFI',     label: 'SFI',     color: '#D41370' },
  { id: 'TKI',     label: 'TKI',     color: '#2FA36B' }
]

// Map legacy / imported qualification strings onto the canonical ids.
export function normalizeQual(q) {
  const s = String(q || '').trim()
  if (!s) return ''
  // Custom category ids (cat-xxxxxxx) pass through untouched – never re-classify.
  if (/^cat-/i.test(s)) return s
  if (/new\s*tri/i.test(s)) return 'TRI' // legacy "new TRI" is now plain TRI
  // Only genuine senior-examiner spellings collapse to SEN – anchored so that
  // strings merely CONTAINING "sen" (e.g. "Senior LTC") keep their own value.
  if (/^sen$/i.test(s) || /^tre\s*[/\\-]\s*sen$/i.test(s)) return 'SEN'
  return s
}

// Only these qualifications take part in the A320 -> B737 conversion. SFI and
// TKI do not convert, so they are excluded from the conversion board and from
// every conversion KPI / timeline (they still count as head-count elsewhere).
export const CONVERSION_QUALS = ['SEN', 'TRE', 'TRI', 'LTC']

export function isConversionQual(qual) {
  return CONVERSION_QUALS.includes(String(qual || '').trim())
}

// The trainers the conversion actually applies to.
export function conversionTrainers(trainers) {
  return (trainers || []).filter((t) => isConversionQual(t.qual))
}

// Index for sorting; unknown values sort last (stable, alphabetical among them).
export function qualIndex(quals, id) {
  const i = quals.findIndex((q) => q.id === id)
  return i < 0 ? quals.length + 1 : i
}

// Reverse of qualLabel: turn whatever a spreadsheet cell holds back into a
// stored qual id. Exports write LABELS, so re-importing the app's own export
// must map "TRI (MAX)" back to the id "TRI" instead of storing the label.
export function resolveQualId(quals, value) {
  const s = String(value == null ? '' : value).trim()
  if (!s) return ''
  const list = quals || []
  const byId = list.find((q) => q.id === s)
  if (byId) return byId.id
  const lower = s.toLowerCase()
  const byLabel = list.find((q) => String(q.label || '').trim().toLowerCase() === lower)
  if (byLabel) return byLabel.id
  const byIdCase = list.find((q) => String(q.id).toLowerCase() === lower)
  return byIdCase ? byIdCase.id : s
}

// Resolve a stored qualification id to its display label. Custom categories are
// stored on the trainer by their (random) id, so every UI/export site must
// resolve through this rather than printing the raw id. Falls back to the id.
export function qualLabel(quals, id) {
  if (id == null || id === '') return ''
  const q = (quals || []).find((x) => x.id === id)
  return q ? q.label : id
}
