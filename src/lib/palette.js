// The app's colour system – one documented source, no colours invented at the
// call site. Every value here was measured, not eyeballed; the numbers in the
// comments come from the OKLab/WCAG checks (see CHANGELOG 1.18.0).
//
// Colour does exactly one job at a time:
//
//   CATEGORICAL  identity   – which qualification / base / authority
//   ORDINAL      progress   – how far along the conversion a stage is
//   STATUS       state      – on track / at risk / blocked / done
//
// The rule that keeps it readable: a status colour NEVER doubles as a series
// colour. Green used to mean "TKI", "on track", "released", "provider in use"
// and "rating valid" all at once, so green stopped meaning anything.

// ---------------------------------------------------------------- brand ----
// Eurowings burgundy leads; the sky accent is the second voice. The sky is a
// darker step than the marketing cyan (#00A6CF) because that one only reached
// 2.78:1 on white – below the 3:1 a chart mark needs.
export const BRAND = {
  burgundy: '#AF1E65',
  burgundyDark: '#871C54',
  sky: '#0D8FB4'
}

// ---------------------------------------------------------- categorical ----
// Eight slots, fixed order, assigned in sequence and NEVER cycled. Burgundy and
// sky sit first because most charts here have two series (A320/B737,
// Captain/FO, intern/extern) and then read as pure Eurowings.
//
// Light, on white:  worst adjacent CVD ΔE 12.6 · normal-vision ΔE 22.2 · all ≥ 3:1
// Dark,  on #171c22: worst adjacent CVD ΔE  9.8 · normal-vision ΔE 17.9 · all ≥ 3:1
// (target ≥ 8 / ≥ 15 – the previous palette scored 4.2 and 5.6.)
export const CATEGORICAL = [
  '#AF1E65', // 1 burgundy  – brand
  '#0D8FB4', // 2 sky       – brand accent
  '#845300', // 3 ochre
  '#0250AE', // 4 blue
  '#009387', // 5 teal
  '#682DAC', // 6 violet
  '#09672E', // 7 green
  '#8A1586'  // 8 magenta
]
export const CATEGORICAL_DARK = [
  '#E0619A', '#0DA4CF', '#CB8315', '#4A93FE',
  '#10AA9D', '#A875F4', '#14B254', '#CD69C6'
]

// A 9th category is never a generated hue – past slot 8 everything folds into
// one neutral, which is honest about "these are the long tail".
export const OVERFLOW = '#5E666E'
export const OVERFLOW_DARK = '#98A1AA'

// -------------------------------------------------------------- ordinal ----
// The conversion stages are a progression, not a set of names: swapping two of
// them changes the meaning. So they take a single-hue ramp – the reader sees
// the order in the colour – and that hue is the brand's.
// Light: monotone L, every gap ≥ 0.06, light end 2.06:1 on white.
// Dark:  own steps (not a flipped copy), light end 2.90:1 on #171c22.
export const STAGE_RAMP = ['#FD95BC', '#FE67A6', '#E74C91', '#CE337C', '#B61168', '#970054']
export const STAGE_RAMP_DARK = ['#FEC6D8', '#FDA1C2', '#FE75AC', '#EF5397', '#D63A82', '#BD1D6D']

// Interpolate the ramp to n stages – the stage list is user-editable, so the
// ramp cannot be a fixed list of six.
export function stageRamp(n, dark = false) {
  const src = dark ? STAGE_RAMP_DARK : STAGE_RAMP
  if (n <= 1) return [src[src.length - 1]]
  return Array.from({ length: n }, (_, i) => src[Math.round((i * (src.length - 1)) / (n - 1))])
}

// Headcount against FTE is not two identities – FTE is a PART of the heads, so
// it is drawn nested inside them: a muted band for the whole, the brand
// burgundy for the part. One hue keeps the card in the Eurowings family, and
// one coloured mark per row means nothing here can be mistaken for the A320 /
// B737 colours the way a second series colour was.
//
// The band is deliberately low-chroma: a saturated light burgundy would land
// within dE 2.2 of the conversion stage ramp, i.e. the same colour. At this
// chroma the distance is 6.3 (light) / 11.1 (dark), and it still clears the
// 2:1 an ordinal light end needs (2.07:1 on white, 3.34:1 on the dark card).
export const MEASURE_WHOLE = '#DDA5B8'
export const MEASURE_WHOLE_DARK = '#9B5A72'
export const MEASURE_PART = BRAND.burgundy
export const MEASURE_PART_DARK = CATEGORICAL_DARK[0]

// --------------------------------------------------------------- status ----
// Reserved meanings, never used for identity. These are the CHIP fills: they
// carry white text, so they are stepped for that (≥ 5.3:1) and stay the same in
// both themes – a filled chip is self-contained. The old amber gave white text
// 2.16:1, i.e. barely legible.
export const STATUS = {
  good: '#1F7A4D',     // 5.32:1 with white
  warn: '#8A5A00',     // 5.93:1
  critical: '#B3122C', // 6.91:1
  neutral: '#5E666E'   // 5.83:1
}

// Same meanings drawn as a dot or as text directly on the page. On a dark
// surface the chip steps would sink into the background, so this set is stepped
// against #171c22 (≥ 5.1:1) instead.
export const STATUS_DARK = {
  good: '#4FBE85',
  warn: '#D39A2E',
  critical: '#EE5A6F',
  neutral: '#98A1AA'
}

// ------------------------------------------------------------ resolution ----
const DARK_OF = new Map()
CATEGORICAL.forEach((hex, i) => DARK_OF.set(hex.toLowerCase(), CATEGORICAL_DARK[i]))
STAGE_RAMP.forEach((hex, i) => DARK_OF.set(hex.toLowerCase(), STAGE_RAMP_DARK[i]))
DARK_OF.set(MEASURE_WHOLE.toLowerCase(), MEASURE_WHOLE_DARK)
Object.keys(STATUS).forEach((k) => DARK_OF.set(STATUS[k].toLowerCase(), STATUS_DARK[k]))
DARK_OF.set(OVERFLOW.toLowerCase(), OVERFLOW_DARK)

/**
 * Map a stored colour to its dark-mode step.
 *
 * Category colours (stages, qualifications, courses …) are user-editable and
 * therefore persisted as plain hex, which cannot re-step itself per theme. Any
 * value from the documented set above gets its dark twin; a colour the user
 * picked themselves is passed through untouched – their choice wins.
 */
export function themed(hex, dark) {
  if (!dark || !hex) return hex
  return DARK_OF.get(String(hex).toLowerCase()) || hex
}

// ------------------------------------------------------------- migration ----
// What the shipped defaults used to be, per list id. Stored data is migrated
// only where the colour still equals its old default – a colour the user picked
// in the category manager is never touched.
export const LEGACY_DEFAULTS = {
  stages: {
    nominated: '#871C54', groundschool: '#AF1E65', simulator: '#D41370',
    baselifus: '#00A6CF', linecheck: '#6BCCE0', released: '#2FA36B'
  },
  quals: {
    SEN: '#701745', TRE: '#AF1E65', TRI: '#00A6CF',
    LTC: '#871C54', SFI: '#D41370', TKI: '#2FA36B'
  },
  assignmentSteps: { tr: '#D41370', tri: '#AF1E65', lifus: '#00A6CF', tre: '#871C54' },
  providerStatus: { 'in use': '#2FA36B', 'no agreement': '#C8102E' }
}

/**
 * Re-colour one stored list onto the new defaults.
 * `defaults` is the shipped list; entries the user recoloured keep their value.
 */
export function migrateColors(list, listKey, defaults) {
  const legacy = LEGACY_DEFAULTS[listKey]
  if (!Array.isArray(list) || !legacy) return list
  const now = new Map((defaults || []).map((d) => [d.id, d.color]))
  return list.map((item) => {
    if (!item || !item.id) return item
    const wasDefault = String(item.color || '').toLowerCase() === String(legacy[item.id] || '').toLowerCase()
    return wasDefault && now.has(item.id) ? { ...item, color: now.get(item.id) } : item
  })
}

/** Slot i of the categorical scale. Past slot 8 -> the neutral overflow. */
export function colorAt(i, dark = false) {
  const list = dark ? CATEGORICAL_DARK : CATEGORICAL
  return i < list.length ? list[i] : dark ? OVERFLOW_DARK : OVERFLOW
}
