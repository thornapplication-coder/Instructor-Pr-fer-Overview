import { CATEGORICAL, OVERFLOW } from '../lib/palette.js'
// Trainer qualifications ("Berechtigungen"). User-editable list (rename / recolor
// / add / delete / reorder). The ORDER of this list defines the sort order used
// everywhere in the app. Default order per spec: SEN, TRE, TRI, LTC, SFI, TKI.
// `id` is what is stored on each trainer (trainer.qual); `label` is what is shown.
export const DEFAULT_QUALS = [
  { id: 'SEN',     label: 'SEN',     color: CATEGORICAL[0] },
  { id: 'TRE',     label: 'TRE',     color: CATEGORICAL[1] },
  { id: 'TRI',     label: 'TRI',     color: CATEGORICAL[2] },
  { id: 'LTC',     label: 'LTC',     color: CATEGORICAL[3] },
  { id: 'SFI',     label: 'SFI',     color: CATEGORICAL[4] },
  { id: 'TKI',     label: 'TKI',     color: CATEGORICAL[5] },
  // The order of this list IS the ranking: it drives the sort in the trainer
  // table and the row order of every chart. So the six trainer grades stay
  // first, the two external grades follow them, and the two entries that are
  // not a trainer grade at all come last.
  //
  // Colours: the palette stops at eight on purpose (see palette.js - a ninth
  // category is never a generated hue). The last two colours go to the external
  // grades, because those are real identities somebody reads off a chip. "No
  // Trainer" and "EIS Pilot" share the overflow grey, which is exactly what it
  // documents itself as: the honest colour for the long tail.
  { id: 'TREX',    label: 'TRE extern', color: CATEGORICAL[6] },
  { id: 'TRIX',    label: 'TRI extern', color: CATEGORICAL[7] },
  { id: 'NOTR',    label: 'No Trainer', color: OVERFLOW },
  { id: 'EIS',     label: 'EIS Pilot',  color: OVERFLOW }
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

// An external trainer is somebody else's employee, already qualified on the
// type. We do not convert them, so they take no seat, no course date and no
// place in any conversion figure. Kept as a predicate of its own because two
// places ask the question and "internal unless it says otherwise" is the rule
// the whole app reads staffType by.
// The two qualification grades that say "external" in their own name. They are
// not conversion qualifications, so nothing counts them - but the trainer dialog
// also has no business ASKING about a conversion for somebody on one of them.
export const EXTERNAL_QUALS = ['TREX', 'TRIX']

// Is this person one of ours? Both ways of being external answer no: the
// affiliation, and a qualification grade that says "extern" in its own name.
//
// This is the predicate behind every field that only a Eurowings employee can
// have. A conversion is one of them - so is an ORE tier and a seniority date:
// they are positions in OUR pipeline and OUR list, and somebody else's employee
// simply does not have one. Printing "–" there is not missing data, it is the
// correct answer, and asking for it in the dialog invites a wrong one.
export function isOwnStaff(trainer) {
  return isInternal(trainer) && !EXTERNAL_QUALS.includes(String(trainer?.qual || '').trim())
}

// Named for the question the conversion asks. Same rule - deliberately the same
// function - because "do we convert them" and "are they ours" are one question
// asked twice, and two copies of it would drift.
export const convertsAtAll = isOwnStaff

export function isInternal(trainer) {
  return (trainer?.staffType || 'internal') !== 'external'
}

// The trainers the conversion actually applies to: a converting qualification
// AND one of ours. The single choke point - the board, the dashboard, the
// capacity figures and all three conversion PDFs go through here, so the rule
// cannot be right in one view and wrong in the next.
export function conversionTrainers(trainers) {
  return (trainers || []).filter((t) => isConversionQual(t.qual) && isInternal(t))
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
