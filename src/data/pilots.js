import { STATUS } from '../lib/palette.js'

// "Other pilots": company line pilots who are NOT trainers/examiners, tracked
// only for their relationship to Boeing types. Deliberately a separate
// collection from `trainers`, so they never leak into the trainer KPIs.
//
// A person can hold SEVERAL type ratings with different expiry dates, so the
// ratings are a list rather than one field. Whether a rating is valid is not
// stored anywhere: it is worked out against today every time it is drawn. A
// stored "valid" flag is wrong the morning after somebody writes it, and this
// is a list whose whole purpose is to say who may fly what now.

export function pilotRole(p) {
  return p && p.role === 'fo' ? 'fo' : 'captain'
}

// Local midnight, so "expires today" counts as still valid for the whole day.
function startOfToday(today) {
  const d = today || new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d) ? null : d
}

/** true / false / null (no date, so nothing to judge). */
export function ratingValid(rating, today) {
  const due = parseDay(rating && rating.until)
  if (!due) return null
  return due >= startOfToday(today)
}

// Per person: does anything still hold, and is anything past its date. Both can
// be true at once – that is exactly the case the spreadsheet marks with an x in
// each column for somebody with two ratings.
export function pilotValidity(pilot, today) {
  const list = (pilot && pilot.ratings) || []
  let valid = false
  let expired = false
  for (const r of list) {
    const v = ratingValid(r, today)
    if (v === true) valid = true
    else if (v === false) expired = true
  }
  return { valid, expired }
}

export function emptyRating(id) {
  return { id, type: '', until: '' }
}

export function emptyPilot(id) {
  return {
    id,
    base: '',
    tlc: '',
    name: '',
    role: 'captain',
    ratings: [],
    boeingExp: false,
    remark: ''
  }
}

// Three characters, upper case – the roster convention, and the reason the
// column is a fixed width everywhere it is printed.
export function normalizeTlc(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)
}

// Fill gaps on stored / imported records so the table never sees undefined.
// Also carries the old single-rating shape forward: a record with `status` and
// `b737Until` becomes one 737 rating plus the Boeing-experience flag.
export function withPilotDefaults(p) {
  const base = emptyPilot(p && p.id ? p.id : 'plt-' + Math.random().toString(36).slice(2, 9))
  const out = { ...base, ...p, role: pilotRole(p), tlc: normalizeTlc(p && p.tlc) }
  if (!Array.isArray(out.ratings)) out.ratings = []
  if (!out.ratings.length && p && (p.b737Until || p.status)) {
    if (p.status === 'experience') out.boeingExp = true
    else out.ratings = [{ id: out.id + '-r1', type: '737', until: p.b737Until || '' }]
  }
  out.ratings = out.ratings
    .filter((r) => r && (r.type || r.until))
    .map((r, i) => ({ id: r.id || out.id + '-r' + (i + 1), type: r.type || '', until: r.until || '' }))
  out.boeingExp = out.boeingExp === true
  delete out.status
  delete out.b737Until
  return out
}

// Kept for the colour of the two derived columns; they are a status, so they
// take the reserved status tokens rather than a category colour.
export const VALID_COLOR = STATUS.good
export const EXPIRED_COLOR = STATUS.critical
