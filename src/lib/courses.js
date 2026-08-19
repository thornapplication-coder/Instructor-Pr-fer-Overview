// Course dates ("Kurstermine"): a scheduled run of one course type at one
// provider, from one day to another, with a number of seats.
//
// This is the record the planning grid was missing. A TR course runs from the
// 3rd to the 20th of March and eight people sit in it – so the period belongs
// to the COURSE, not to each of the eight. Typed once, it cannot drift between
// the people who attended the same thing.
//
// Nothing is forced: an assignment may still carry its own provider, location
// and dates and no course at all. That is the fallback for everything that was
// entered before this existed, and for a one-off that is not worth a record.
// Where both exist, the person's own value wins per field – that is how
// "started two days late" is expressed without inventing a second course.

import { formatDate } from './format.js'

const DAY = 86400000

// 'YYYY-MM-DD' -> epoch ms at UTC midnight, or null. Parsed by hand: the
// browser reads a bare date as UTC but a date with a time as local, and mixing
// the two shifts a span by a day around a DST boundary.
export function dayValue(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const t = Date.UTC(y, mo - 1, d)
  const back = new Date(t)
  // Rejects the 31st of a 30-day month instead of rolling it into the next one.
  if (back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null
  return t
}

// Inclusive length in days: Monday to Friday is five days, not four. That is
// how a course is sold and how a roster reads it. null when the pair is
// unusable – a missing half, or an end before its start.
export function spanDays(from, to) {
  const a = dayValue(from)
  const b = dayValue(to)
  if (a == null || b == null) return null
  const days = Math.round((b - a) / DAY) + 1
  return days > 0 ? days : null
}

// "03.03.2026 – 20.03.2026", or just the start while no end is known. One
// implementation: the grid cell, the board chip, the PDF and the Excel export
// all print the same period, and four private copies had already drifted (one
// of them printed a raw ISO date).
export function spanText(from, to, lang) {
  if (!from) return ''
  return to ? formatDate(from, lang) + ' – ' + formatDate(to, lang) : formatDate(from, lang)
}

export function emptyCourseRun(id) {
  return { id, stepId: '', providerId: '', location: '', from: '', to: '', seats: 0, note: '' }
}

export function normalizeCourseRun(r) {
  const seats = Math.max(0, Math.round(Number(r && r.seats) || 0))
  return {
    ...emptyCourseRun(''),
    ...r,
    id: String((r && r.id) || ''),
    stepId: String((r && r.stepId) || ''),
    seats
  }
}

// A run whose end is before its start is a typo, not a negative course. It is
// kept (the user is mid-typing) but never counted as a real period.
export function runIsValid(run) {
  return !!run && spanDays(run.from, run.to) != null
}

// Chronological: this feeds a dropdown of dates, and a list of dates that is
// not in date order is unreadable. Undated entries (still being typed) go last.
export function runsForStep(runs, stepId) {
  return (runs || [])
    .filter((r) => r.stepId === stepId)
    .sort((a, b) => {
      if (!a.from && !b.from) return 0
      if (!a.from) return 1
      if (!b.from) return -1
      return a.from.localeCompare(b.from)
    })
}

export function findRun(runs, id) {
  if (!id) return null
  return (runs || []).find((r) => r.id === id) || null
}

// What a step assignment ACTUALLY says once its course date is folded in.
// Per field: the person's own value wins, the course fills the rest.
// `overridden` marks the case worth showing – the person's period differs from
// the course everyone else attended.
export function resolveAssignment(a, run) {
  const own = a || {}
  const from = own.date || (run && run.from) || ''
  const to = own.end || (run && run.to) || ''
  const overridden = !!run && !!((own.date && own.date !== run.from) || (own.end && own.end !== run.to))
  return {
    courseId: own.courseId || '',
    providerId: own.providerId || (run && run.providerId) || '',
    location: own.location || (run && run.location) || '',
    from,
    to,
    days: spanDays(from, to),
    overridden
  }
}

// How many people are booked onto each course date. "n/a" does not occupy a
// seat – it is the marker for "this person does not do this step at all".
export function seatUsage(trainers, steps) {
  const used = new Map()
  for (const tr of trainers || []) {
    for (const s of steps || []) {
      const a = tr.assignments?.[s.id]
      if (!a || !a.courseId || a.status === 'na') continue
      used.set(a.courseId, (used.get(a.courseId) || 0) + 1)
    }
  }
  return used
}

// Seats are a warning, never a block: a course really can take a ninth person,
// and an app that refuses the entry just gets worked around in a note field.
// 0 seats means "not stated", which cannot be overbooked.
export function isOverbooked(run, usedCount) {
  const seats = Math.max(0, Math.round(Number(run && run.seats) || 0))
  return seats > 0 && usedCount > seats
}

// ------------------------------------------------------------ target date ---
//
// When the last booked step ends, and how that sits against the person's target
// date. This is what makes a target date more than a wish: it can now be
// checked against the courses that are actually booked.
//
// Only steps with a known end count. A plan that is half-entered forecasts an
// early finish, so `complete` says whether every step is accounted for and the
// UI can hold back a verdict that would only be flattering.
export function finishForecast(trainer, steps, runs) {
  let last = null
  let known = 0
  let relevant = 0
  for (const s of steps || []) {
    const a = trainer?.assignments?.[s.id]
    if (a && a.status === 'na') continue
    relevant += 1
    const r = resolveAssignment(a, findRun(runs, a?.courseId))
    // The PERIOD has to hold, not just the end date.
    //
    // This read `r.to` on its own, so a course whose end was typed before its
    // start still produced a finish date - one in the past - and every person
    // booked onto it got a green "target met" chip. conflictsFor two blocks
    // down already guards with the same `days == null`; this one did not, and
    // it is the one that renders a verdict.
    //
    // A broken period is not a known end: it drops out of `known`, so
    // `complete` turns false and the UI holds back the verdict instead of
    // flattering it.
    const v = r.days == null ? null : dayValue(r.to)
    if (v == null) continue
    known += 1
    if (last == null || v > last.v) last = { v, iso: r.to }
  }
  if (!last) return { to: '', days: null, over: null, complete: false, known: 0, of: relevant }
  const target = dayValue(trainer?.conv?.target)
  const over = target == null ? null : Math.round((last.v - target) / DAY)
  return { to: last.iso, days: over, over, complete: known === relevant, known, of: relevant }
}

// Two periods overlap when neither ends before the other begins. Used to catch
// the one thing the grid cannot show: the same person booked into two courses
// running at the same time.
export function overlaps(aFrom, aTo, bFrom, bTo) {
  const a1 = dayValue(aFrom)
  const a2 = dayValue(aTo)
  const b1 = dayValue(bFrom)
  const b2 = dayValue(bTo)
  if (a1 == null || a2 == null || b1 == null || b2 == null) return false
  return a1 <= b2 && b1 <= a2
}

// Per trainer: the pairs of steps whose periods run into each other.
export function conflictsFor(trainer, steps, runs) {
  const spans = []
  for (const s of steps || []) {
    const a = trainer.assignments?.[s.id]
    if (!a || a.status === 'na') continue
    const r = resolveAssignment(a, findRun(runs, a.courseId))
    if (r.days == null) continue
    spans.push({ step: s, from: r.from, to: r.to })
  }
  const out = []
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      if (overlaps(spans[i].from, spans[i].to, spans[j].from, spans[j].to)) out.push([spans[i], spans[j]])
    }
  }
  return out
}
