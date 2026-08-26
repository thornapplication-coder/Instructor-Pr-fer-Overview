import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SEED_TRAINERS } from '../data/seed.js'
import {
  SEED_PROVIDERS,
  DEFAULT_PROVIDER_COURSES,
  DEFAULT_PROVIDER_STATUS,
  DEFAULT_SIM_VERSIONS,
  PREFILL_NAMES,
  emptyProvider
} from '../data/providers.js'
import { DEFAULT_STAGES, ASSIGNMENT_STEPS, mergeAssignments, releasedStageId, firstStageId } from '../data/pipeline.js'
import { DEFAULT_QUALS, normalizeQual } from '../data/qualifications.js'
import { withPilotDefaults } from '../data/pilots.js'
import { SEED_PILOTS } from '../data/pilotsSeed.js'
import { SENIORITY_BY_TLC } from '../data/senioritySeed.js'
import { fteFromPartTime, normalizeAuthority } from './format.js'
import { translate } from './i18n.js'
import { useCloudSync } from './cloudSync.js'
import { backfillStamps, stampChanges } from './merge.js'
import { normalizeCourseRun } from './courses.js'
import { isMonth, DEFAULT_CAPACITY_TO } from './months.js'
import {
  defaultAircraftTypes,
  defaultAssignStatus,
  defaultConvStatus,
  defaultOreTiers,
  defaultBases,
  defaultPilotTypes,
  defaultStaffTypes,
  defaultExtCompanies
} from '../data/lists.js'
import { BRAND, migrateColors, stageRamp } from './palette.js'

const STORAGE_KEY = 'ewl737:data:v1'
const SCHEMA = 2

const StoreContext = createContext(null)

function nowIso() {
  return new Date().toISOString()
}

function newId(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9)
}

// Ensure every trainer has conversion, staff type and assignment objects
// (forward-compatible migration for older / imported payloads).
// `firstStage` is the id of the pipeline's first stage; stages are user-editable,
// so the literal 'nominated' may not exist any more.
function withConvDefaults(trainer, firstStage) {
  const stage0 = firstStage || 'nominated'
  return {
    staffType: 'internal',
    aircraft: 'A320',
    ...trainer,
    // Guarantee a stable unique id: imported/trimmed payloads may omit it, and an
    // undefined id makes upsert/delete match EVERY id-less record at once.
    id: trainer.id || newId('trn'),
    // Cockpit role: everyone defaults to Captain; First Officers are marked 'fo'.
    role: trainer.role === 'fo' ? 'fo' : 'captain',
    // FTE is editable; default it from the part-time workload only when unset.
    fte: typeof trainer.fte === 'number' ? trainer.fte : fteFromPartTime(trainer.partTime),
    qual: normalizeQual(trainer.qual),
    // Only the country is shown, not the "EASA -" prefix.
    authority: normalizeAuthority(trainer.authority),
    // Free-text notes. Nothing derives from this – unlike `remark`, which the
    // "Funktion" chart counts – so it can hold whatever the planner needs.
    note: typeof trainer.note === 'string' ? trainer.note : '',
    // Company seniority, ISO like every other date here. Free to stay empty:
    // three people on the roster are not in the company list at all, and a
    // guessed date would be worse than a blank one - it would sort.
    seniority: typeof trainer.seniority === 'string' ? trainer.seniority : '',
    // Which company an external trainer comes from. Only meaningful together
    // with staffType 'external'; kept rather than cleared when somebody is
    // switched back to internal, so switching by accident loses nothing.
    extCompany: typeof trainer.extCompany === 'string' ? trainer.extCompany : '',
    conv: {
      stage: stage0,
      status: 'on_track',
      target: '',
      note: '',
      ...(trainer.conv || {})
    },
    assignments: mergeAssignments(trainer.assignments)
  }
}

// Older stage shape was { id, de, en, color }; new shape is { id, label, color }.
//
// SPREAD, do not whitelist. This returned only the three keys it names, so it
// dropped `_at` - and `stages` is in MERGE_LISTS, where `_at` is the whole
// basis of the record-level merge. What followed was worse than a missing
// field: `backfillStamps` refills a list wholesale as soon as ANY member lacks
// a stamp, so every phase came out stamped with the blob's `updatedAt`, i.e.
// "when this device last changed anything at all".
//
// The effect was that `stages` merged as whole-list, last-device-to-touch-
// anything-wins: rename a phase on the laptop, then merely OPEN the app on the
// iPad, and the iPad's untouched list outranks the rename and erases it. A
// deleted phase came back the same way. Every other record normalizer here
// spreads; this one was the exception, and the coverage test could not see it
// because the list IS registered - its stamps were destroyed upstream.
//
// `de` / `en` are pulled out on purpose: they are the old shape's label and
// have become `label`, so carrying them on would keep dead keys in the blob
// for ever.
function migrateStage(s) {
  const { de, en, ...rest } = s || {}
  return { ...rest, id: s.id, label: s.label ?? de ?? en ?? s.id, color: s.color || BRAND.burgundy }
}

// Provider forward-compat: single `location` -> `locations[]`; ensure `courses[]`.
function normalizeProvider(p) {
  const base = emptyProvider(p.id || newId('prov'))
  return {
    ...base,
    ...p,
    locations: Array.isArray(p.locations) ? p.locations : p.location ? [p.location] : [],
    courses: Array.isArray(p.courses) ? p.courses : [],
    simVersions: Array.isArray(p.simVersions) ? p.simVersions : [],
    slotsByStep: seatMap(p.slotsByStep),
    // { 'YYYY-MM': { stepId: seats } }. Unusable month keys are dropped – they
    // would sort into the middle of the timeline and never be editable, because
    // the editor only ever offers real months. Months whose entries are all zero
    // are kept: an explicit "nothing in March" is an answer, not an empty row.
    slotsByMonth:
      p.slotsByMonth && typeof p.slotsByMonth === 'object' && !Array.isArray(p.slotsByMonth)
        ? Object.fromEntries(
            Object.entries(p.slotsByMonth)
              .filter(([k]) => isMonth(k))
              .map(([k, v]) => [k, seatMap(v)])
          )
        : {}
  }
}

// Whole seats only, and never negative. Values for course types that no longer
// exist are simply carried – deleting them here would lose the number if the
// column comes back under the same id.
function seatMap(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Math.max(0, Math.round(Number(v) || 0))]))
}

function freshData(lang = 'de') {
  const at = nowIso()
  // Stamp the seed as well: loadData() returns this directly on a fresh
  // install, without going through normalize(), and unstamped records lose
  // every merge against a device that has stamps.
  return backfillStamps({
    schema: SCHEMA,
    lang,
    theme: 'light',
    // Seniority comes from the company list, not from the trainer sheet, so it
    // is folded in here. A fresh install never runs the migration below -
    // loadData() returns freshData() directly - so without this the column
    // would be empty on every new device while an existing one had it.
    // `...t` last: a value already on the record outranks the lookup.
    trainers: SEED_TRAINERS.map((t) => withConvDefaults({ seniority: SENIORITY_BY_TLC[t.tlc] || '', ...t })),
    providers: SEED_PROVIDERS.map((p) => ({ ...p })),
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    quals: DEFAULT_QUALS.map((q) => ({ ...q })),
    assignmentSteps: ASSIGNMENT_STEPS.map((s) => ({ ...s })),
    // Scheduled course dates. Empty on a fresh install: inventing a course
    // nobody booked would put a made-up period into the duration figures.
    courseRuns: [],
    providerCourses: DEFAULT_PROVIDER_COURSES.map((x) => ({ ...x })),
    providerStatus: DEFAULT_PROVIDER_STATUS.map((x) => ({ ...x })),
    simVersions: DEFAULT_SIM_VERSIONS.map((x) => ({ ...x })),
    // The remaining pick lists, as data so the settings page can edit them.
    // Their ids are what records store and what the code branches on; only
    // labels and colours are meant to change (see data/lists.js).
    aircraftTypes: defaultAircraftTypes(),
    oreTiers: defaultOreTiers(),
    convStatus: defaultConvStatus(lang),
    assignStatus: defaultAssignStatus(lang),
    bases: defaultBases(),
    pilotTypes: defaultPilotTypes(),
    staffTypes: defaultStaffTypes(lang),
    extCompanies: defaultExtCompanies(),
    otherPilots: SEED_PILOTS.map((p) => withPilotDefaults({ ...p })),
    conversionFrom: 'A320',
    conversionTo: 'B737',
    // The window the provider capacity plan covers. An empty start means "the
    // month we are in", so the plan follows the calendar without anybody having
    // to edit it every January.
    capacityFrom: '',
    capacityTo: DEFAULT_CAPACITY_TO,
    dashboard: { order: {} },
    // Deletions, per merged list: { list: { id: iso } }. See merge.js.
    _tomb: {},
    _palette3: true,
    _provSeeded: true,
    _courseSeed2: true,
    _provStatus2: true,
    _qualMerge: true,
    _roleSeed: true,
    _oreNoRente: true,
    _capNotes: true,
    _pilotSeed: true,
    _pilotSeed2: true,
    _senioritySeed: true,
    _qualExtra2: true,
    updatedAt: at
  }, at)
}

// One-time: ensure the standard providers exist (add missing ones by name).
// Shared by loadData and importData so both paths seed identically.
function seedMissingProviders(data) {
  if (data._provSeeded) return data
  const have = new Set(data.providers.map((p) => (p.name || '').trim().toLowerCase()))
  const add = PREFILL_NAMES.filter((n) => !have.has(n.toLowerCase())).map((n) => ({
    ...emptyProvider('prov-' + n.toLowerCase()),
    name: n
  }))
  return { ...data, providers: [...data.providers, ...add], _provSeeded: true }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshData()
    const parsed = JSON.parse(raw)
    return seedMissingProviders(normalize(parsed))
  } catch (e) {
    console.warn('Failed to load stored data, using seed.', e)
    return freshData()
  }
}

// Accept partial / older payloads (also used by Import) and fill gaps.
function normalize(obj) {
  const base = freshData(obj?.lang === 'en' ? 'en' : 'de')
  if (!obj || typeof obj !== 'object') return base
  // Resolve the pipeline first so trainers can default to its first stage.
  const stages = Array.isArray(obj.stages) ? obj.stages.map(migrateStage) : base.stages
  const stage0 = firstStageId(stages)
  const result = {
    schema: SCHEMA,
    lang: obj.lang === 'en' ? 'en' : 'de',
    trainers: Array.isArray(obj.trainers)
      ? obj.trainers.map((t) => withConvDefaults({ ...t }, stage0))
      : base.trainers,
    providers: Array.isArray(obj.providers) ? obj.providers.map(normalizeProvider) : base.providers,
    // A user-managed list that is present but EMPTY is a deliberate choice (the
    // category manager lets you empty it); only a missing key falls back to the
    // shipped defaults. `&& length` wrongly resurrected defaults the user deleted.
    stages,
    quals: Array.isArray(obj.quals) ? obj.quals.map((q) => ({ ...q })) : base.quals,
    assignmentSteps: Array.isArray(obj.assignmentSteps)
      ? obj.assignmentSteps.map((s) => ({ ...s }))
      : base.assignmentSteps,
    // Drop records with no id: they cannot be merged, referenced by an
    // assignment or deleted again, so they would sit there forever.
    courseRuns: Array.isArray(obj.courseRuns)
      ? obj.courseRuns.filter((r) => r && r.id).map(normalizeCourseRun)
      : base.courseRuns,
    providerCourses: Array.isArray(obj.providerCourses)
      ? obj.providerCourses.map((x) => ({ ...x }))
      : base.providerCourses,
    providerStatus: Array.isArray(obj.providerStatus)
      ? obj.providerStatus.map((x) => ({ ...x }))
      : base.providerStatus,
    simVersions: Array.isArray(obj.simVersions)
      ? obj.simVersions.map((x) => ({ ...x }))
      : base.simVersions,
    aircraftTypes: Array.isArray(obj.aircraftTypes) ? obj.aircraftTypes.map((x) => ({ ...x })) : base.aircraftTypes,
    oreTiers: Array.isArray(obj.oreTiers) ? obj.oreTiers.map((x) => ({ ...x })) : base.oreTiers,
    convStatus: Array.isArray(obj.convStatus) ? obj.convStatus.map((x) => ({ ...x })) : base.convStatus,
    assignStatus: Array.isArray(obj.assignStatus) ? obj.assignStatus.map((x) => ({ ...x })) : base.assignStatus,
    bases: Array.isArray(obj.bases) ? obj.bases.map((x) => ({ ...x })) : base.bases,
    pilotTypes: Array.isArray(obj.pilotTypes) ? obj.pilotTypes.map((x) => ({ ...x })) : base.pilotTypes,
    staffTypes: Array.isArray(obj.staffTypes) ? obj.staffTypes.map((x) => ({ ...x })) : base.staffTypes,
    extCompanies: Array.isArray(obj.extCompanies) ? obj.extCompanies.map((x) => ({ ...x })) : base.extCompanies,
    otherPilots: Array.isArray(obj.otherPilots) ? obj.otherPilots.map(withPilotDefaults) : base.otherPilots,
    conversionFrom: obj.conversionFrom || 'A320',
    conversionTo: obj.conversionTo || 'B737',
    // '' is a legitimate stored value for the start (= the current month), so it
    // is kept rather than filled in; only a malformed one is discarded.
    capacityFrom: isMonth(obj.capacityFrom) ? obj.capacityFrom : '',
    capacityTo: isMonth(obj.capacityTo) ? obj.capacityTo : DEFAULT_CAPACITY_TO,
    dashboard:
      obj.dashboard && typeof obj.dashboard === 'object' && obj.dashboard.order && typeof obj.dashboard.order === 'object'
        ? { order: obj.dashboard.order }
        : base.dashboard,
    theme: obj.theme === 'dark' ? 'dark' : 'light',
    _tomb: obj._tomb && typeof obj._tomb === 'object' && !Array.isArray(obj._tomb) ? obj._tomb : {},
    _palette3: obj._palette3 === true,
    _provSeeded: obj._provSeeded === true,
    _courseSeed2: obj._courseSeed2 === true,
    _provStatus2: obj._provStatus2 === true,
    _qualMerge: obj._qualMerge === true,
    _roleSeed: obj._roleSeed === true,
    _oreNoRente: obj._oreNoRente === true,
    _capNotes: obj._capNotes === true,
    _pilotSeed: obj._pilotSeed === true,
    _pilotSeed2: obj._pilotSeed2 === true,
    _senioritySeed: obj._senioritySeed === true,
    _qualExtra2: obj._qualExtra2 === true,
    updatedAt: obj.updatedAt || nowIso()
  }
  // One-time: merge newly shipped default courses (e.g. "SIM only") into stored
  // data by id. Gated by a flag so courses a user deliberately deleted in the
  // course manager stay deleted afterwards.
  if (!result._courseSeed2) {
    const have = new Set(result.providerCourses.map((c) => c.id))
    const missing = DEFAULT_PROVIDER_COURSES.filter((c) => !have.has(c.id))
    result.providerCourses = [...result.providerCourses, ...missing.map((c) => ({ ...c }))]
    result._courseSeed2 = true
  }
  // One-time: replace the old provider-status list with the new one
  // (in use / no agreement) and clear provider statuses that no longer exist.
  if (!result._provStatus2) {
    result.providerStatus = DEFAULT_PROVIDER_STATUS.map((x) => ({ ...x }))
    const valid = new Set(result.providerStatus.map((s) => s.id))
    result.providers = result.providers.map((p) => (valid.has(p.status) ? p : { ...p, status: '' }))
    result._provStatus2 = true
  }
  // One-time: "new TRI" was merged into "TRI" – drop the obsolete category from
  // the stored list. (Trainer quals are migrated by normalizeQual on load.)
  if (!result._qualMerge) {
    result.quals = result.quals.filter((q) => q.id !== 'new TRI')
    result._qualMerge = true
  }
  // One-time: everyone defaults to Captain (done in withConvDefaults); the two
  // known First Officers (by TLC) are flipped to 'fo'. Gated so that later
  // manual role edits are preserved on subsequent loads.
  if (!result._roleSeed) {
    const FO = new Set(['m7h', 't9j'])
    result.trainers = result.trainers.map((t) =>
      FO.has((t.tlc || '').toLowerCase()) || FO.has((t.id || '').toLowerCase()) ? { ...t, role: 'fo' } : t
    )
    result._roleSeed = true
  }
  // One-time: the "Rente" ORE tier is gone. Anyone still carrying it keeps
  // their record and simply loses the marker – deleting the people would throw
  // away a roster entry nobody asked to remove. Their FTE now counts towards
  // capacity like everyone else's, which is the whole point of dropping it.
  if (!result._oreNoRente) {
    result.trainers = result.trainers.map((t) => ((t.ore || '') === 'Rente' ? { ...t, ore: '' } : t))
    result._oreNoRente = true
  }
  // One-time: the free-text "Kapazität / Konditionen" field is gone – the
  // numeric seats-per-month field and "Preis / Konditionen" cover it between
  // them. Whatever was typed there is self-written information, so it moves
  // into the notes instead of being deleted.
  if (!result._capNotes) {
    result.providers = result.providers.map((p) => {
      const txt = String(p.capacity || '').trim()
      if (!txt) return p.capacity === undefined ? p : { ...p, capacity: undefined }
      const notes = String(p.notes || '').trim()
      return { ...p, capacity: undefined, notes: notes ? notes + '\n' + txt : txt }
    })
    result._capNotes = true
  }
  // One-time: bring in the Boeing roster. Only while the list is still empty –
  // a planner who has already typed their own must not get 65 duplicates.
  if (!result._pilotSeed) {
    if (!result.otherPilots.length) result.otherPilots = SEED_PILOTS.map((p) => withPilotDefaults({ ...p }))
    result._pilotSeed = true
  }
  // One-time: that first roster (1.33.0) went out with the wrong bases, no
  // TLCs and no cockpit role, and _pilotSeed was already set – so the corrected
  // list could never reach a device that had taken the wrong one. A blank TLC
  // is what marks a record as still carrying it: every person on the corrected
  // roster has a three-letter code, and nobody types an empty one. Records
  // edited since keep whatever was typed.
  //
  // Stamped with NOW on purpose, unlike the other migrations here: an untouched
  // record still carries the stamp of the day it was seeded, and a correction
  // that keeps the old stamp ties with the wrong record in the cloud and comes
  // back on the next pull.
  if (!result._pilotSeed2) {
    const at = nowIso()
    const seedById = new Map(SEED_PILOTS.map((p) => [p.id, p]))
    const blank = (p) => !String(p.tlc || '').trim()
    // The first seed's own ids, and only those: a person added by hand gets a
    // random suffix, and a TLC is optional on a record typed here – without
    // this an added pilot with no TLC would be swept away with the rest.
    const firstSeed = (p) => blank(p) && /^plt-\d{1,2}$/.test(p.id || '')
    const buried = result._tomb.otherPilots || {}
    if (result.otherPilots.length && result.otherPilots.every(firstSeed)) {
      // Nothing was edited: take the corrected roster whole. It has one person
      // fewer, and that delete needs a tombstone or the other device's copy
      // would simply hand them back.
      const live = new Set(SEED_PILOTS.map((p) => p.id))
      const tomb = { ...buried }
      result.otherPilots.forEach((p) => { if (p.id && !live.has(p.id)) tomb[p.id] = at })
      if (Object.keys(tomb).length) result._tomb = { ...result._tomb, otherPilots: tomb }
      // Somebody deleted stays deleted: re-adding them with a fresh stamp would
      // undo the delete on every device.
      result.otherPilots = SEED_PILOTS.filter((p) => !buried[p.id]).map((p) => withPilotDefaults({ ...p, _at: at }))
    } else {
      result.otherPilots = result.otherPilots.map((p) => {
        const s = blank(p) ? seedById.get(p.id) : null
        return s
          ? withPilotDefaults({ ...p, base: s.base, tlc: s.tlc, role: s.role, boeingExp: s.boeingExp, ratings: s.ratings.map((r) => ({ ...r })), _at: at })
          : p
      })
    }
    result._pilotSeed2 = true
  }
  // One-time: fill the seniority date from the company list (Stand 03.07.2026).
  //
  // Only people already on the trainer list, matched by TLC, and only where the
  // field is still empty - a date typed by hand outranks the document, and the
  // three trainers the document does not contain stay blank rather than being
  // guessed at. Nobody is ever added: this is a lookup, not an import.
  if (!result._senioritySeed) {
    const at = nowIso()
    result.trainers = result.trainers.map((t) => {
      const d = SENIORITY_BY_TLC[String(t.tlc || '').toUpperCase()]
      return d && !String(t.seniority || '').trim() ? { ...t, seniority: d, _at: at } : t
    })
    result._senioritySeed = true
  }
  // One-time: add the two non-trainer qualifications at the END of the list.
  // Appended, never inserted: this list's ORDER is the ranking every chart and
  // every sort uses, and a reordering somebody made by hand has to survive.
  // Matched by id, so a renamed entry is left alone rather than duplicated.
  if (!result._qualExtra2) {
    const have = new Set(result.quals.map((q) => q.id))
    const EXTRA = ['TREX', 'TRIX', 'NOTR', 'EIS']
    const add = DEFAULT_QUALS.filter((q) => EXTRA.includes(q.id) && !have.has(q.id))
    if (add.length) result.quals = [...result.quals, ...add.map((q) => ({ ...q }))]
    result._qualExtra2 = true
  }
  // One-time: move the stored category colours onto the documented palette.
  // Only entries still carrying their OLD shipped default are touched, so a
  // colour picked in the category manager survives.
  if (!result._palette3) {
    result.stages = migrateColors(result.stages, 'stages', DEFAULT_STAGES)
    result.quals = migrateColors(result.quals, 'quals', DEFAULT_QUALS)
    result.assignmentSteps = migrateColors(result.assignmentSteps, 'assignmentSteps', ASSIGNMENT_STEPS)
    result.providerStatus = migrateColors(result.providerStatus, 'providerStatus', DEFAULT_PROVIDER_STATUS)
    result._palette3 = true
  }
  // Records from before the record-level merge, or from an Excel/JSON import,
  // carry no stamp – give them the blob's own timestamp.
  return backfillStamps(result, result.updatedAt)
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const [saveError, setSaveError] = useState(false)
  const saveTimer = useRef(null)
  const dataRef = useRef(data)
  dataRef.current = data
  // The exact JSON we last persisted, and whether THIS tab holds edits not yet
  // flushed. Together they stop a stale tab from clobbering a newer one and let
  // us adopt another tab's writes instead of racing them.
  const lastSavedRef = useRef(null)
  const dirtyRef = useRef(false)

  // Write to localStorage unless the bytes are unchanged; report success so the
  // UI can surface a real failure (quota/private mode) instead of a false check.
  const persist = (d) => {
    const json = JSON.stringify(d)
    if (json === lastSavedRef.current) {
      dirtyRef.current = false
      return true
    }
    try {
      localStorage.setItem(STORAGE_KEY, json)
      lastSavedRef.current = json
      dirtyRef.current = false
      return true
    } catch (e) {
      return false
    }
  }

  // Debounced persistence to localStorage. (Cloud sync will hook in here later.)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSaveError(!persist(data))
    }, 250)
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [data])

  // Cross-tab sync: when ANOTHER tab writes our key, adopt its state instead of
  // keeping (and later flushing) a stale snapshot over it. Skip while this tab
  // has unsaved edits, and ignore the echo of our own write.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return
      if (dirtyRef.current || e.newValue === lastSavedRef.current) return
      try {
        const next = seedMissingProviders(normalize(JSON.parse(e.newValue)))
        lastSavedRef.current = JSON.stringify(next)
        setData(next)
      } catch (_) {
        /* ignore malformed cross-tab payloads */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Synchronous flush on page exit so an edit made within the 250ms debounce
  // window survives the reload/update buttons and tab closes. Only flush when
  // THIS tab actually has unsaved edits, so a stale tab closing writes nothing.
  useEffect(() => {
    const flush = () => {
      if (dirtyRef.current) persist(dataRef.current)
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [])

  // A blob pulled from the cloud goes through the very same normalize path as a
  // JSON import, so migrations and defaults apply. It is NOT a local edit, so
  // the dirty flag stays untouched and the debounced writer just persists it.
  const applyRemote = useCallback((blob) => {
    if (!blob || typeof blob !== 'object' || !Array.isArray(blob.trainers)) return
    setData(seedMissingProviders(normalize(blob)))
  }, [])
  const sync = useCloudSync(data, applyRemote)

  const lang = data.lang
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const theme = data.theme || 'light'
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    // The iOS status bar reads <meta name="theme-color">, and index.html
    // carries a light/dark pair keyed on the SYSTEM setting. That pair cannot
    // see the choice made in this app, so a reader on a light phone who turns
    // the app dark kept a bright bar above a dark page. Rewrite the plain meta
    // (the one with no media attribute) to follow the stored choice; the two
    // media-keyed ones stay as the fallback for a browser that ignores it.
    const bar = theme === 'dark' ? '#0f1216' : '#AF1E65'
    let tag = document.querySelector('meta[name="theme-color"]:not([media])')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'theme-color')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', bar)
  }, [theme])

  // Viewer mode: the cloud is configured and nobody is signed in, so this
  // device is looking at somebody else's shared state. Kept in a ref as well,
  // because `patch` is built inside a memo that must not be rebuilt on every
  // auth tick - a new api object would remount half the app.
  // Also settable per device: `localStorage['ewl737:viewOnly'] = '1'`. It is how
  // the browser checks reach this mode at all - the sandbox cannot talk to the
  // cloud - and it doubles as a way to hand somebody a machine that cannot
  // change anything. It only ever ADDS the restriction, never lifts one.
  const readOnly = !!sync.readOnly || (() => {
    try { return localStorage.getItem('ewl737:viewOnly') === '1' } catch (_) { return false }
  })()
  const readOnlyRef = useRef(readOnly)
  readOnlyRef.current = readOnly

  const api = useMemo(() => {
    const patch = (mut) => {
      // The single choke point, so the block is complete: every mutation in the
      // app goes through here. Refusing at the source means no screen can be
      // half-guarded, and a control somebody forgets to hide can do nothing.
      if (readOnlyRef.current) return
      dirtyRef.current = true
      setData((d) => {
        const next = typeof mut === 'function' ? mut(d) : mut
        const now = nowIso()
        // Single choke point for the per-record stamps and the delete
        // tombstones the cloud merge runs on – no mutation has to remember it.
        return { ...stampChanges(d, next, now), updatedAt: now }
      })
    }

    return {
      setLang: (l) => patch((d) => ({ ...d, lang: l })),
      setTheme: (th) => patch((d) => ({ ...d, theme: th })),
      // Force an immediate persist (the explicit Save button); returns success.
      saveNow: () => {
        const ok = persist(dataRef.current)
        setSaveError(!ok)
        return ok
      },

      upsertTrainer: (trainer) =>
        patch((d) => {
          const t = withConvDefaults(trainer, firstStageId(d.stages))
          const exists = d.trainers.some((x) => x.id === t.id)
          return {
            ...d,
            trainers: exists
              ? d.trainers.map((x) => (x.id === t.id ? t : x))
              : [...d.trainers, { ...t, id: t.id || newId('trn') }]
          }
        }),

      deleteTrainer: (id) =>
        patch((d) => ({ ...d, trainers: d.trainers.filter((x) => x.id !== id) })),

      // Replace the whole trainer list (used by the Excel/CSV import after the
      // merge). Applies conv defaults; aircraft & FTE are preserved as given.
      setTrainers: (trainers) =>
        patch((d) => {
          const stage0 = firstStageId(d.stages)
          return { ...d, trainers: trainers.map((t) => withConvDefaults(t, stage0)) }
        }),

      // Central place for the stage<->status coupling so EVERY editor (board
      // drag, Kapazität inline editor, detail modal) stays consistent: reaching
      // the final (released) stage marks status 'done'; leaving it clears the
      // auto 'done' back to 'on_track'.
      setConversion: (id, convPatch) =>
        patch((d) => {
          const releasedId = releasedStageId(d.stages)
          return {
            ...d,
            trainers: d.trainers.map((x) => {
              if (x.id !== id) return x
              const prev = x.conv || {}
              const conv = { ...prev, ...convPatch }
              const nowReleased = conv.stage === releasedId
              const wasReleased = prev.stage === releasedId
              if (nowReleased) conv.status = 'done'
              else if (wasReleased && conv.status === 'done') conv.status = 'on_track'
              return { ...x, conv }
            })
          }
        }),

      setAssignment: (id, stepId, changes) =>
        patch((d) => ({
          ...d,
          trainers: d.trainers.map((x) =>
            x.id === id
              ? {
                  ...x,
                  assignments: {
                    ...x.assignments,
                    [stepId]: { ...(x.assignments?.[stepId] || {}), ...changes }
                  }
                }
              : x
          )
        })),

      upsertProvider: (provider) =>
        patch((d) => {
          const exists = d.providers.some((x) => x.id === provider.id)
          return {
            ...d,
            providers: exists
              ? d.providers.map((x) => (x.id === provider.id ? provider : x))
              : [...d.providers, { ...provider, id: provider.id || newId('prov') }]
          }
        }),

      // Delete the provider AND scrub the now-dangling providerId from every
      // trainer assignment so planning cells don't silently blank out (and
      // exports don't print an orphaned status with no provider name).
      deleteProvider: (id) =>
        patch((d) => ({
          ...d,
          providers: d.providers.filter((x) => x.id !== id),
          trainers: d.trainers.map((tr) => {
            if (!tr.assignments) return tr
            let touched = false
            const next = {}
            for (const [k, a] of Object.entries(tr.assignments)) {
              if (a && a.providerId === id) {
                next[k] = { ...a, providerId: '' }
                touched = true
              } else next[k] = a
            }
            return touched ? { ...tr, assignments: next } : tr
          }),
          // Same reasoning for the course dates: a run pointing at a provider
          // that no longer exists would print a blank where a name belongs.
          courseRuns: d.courseRuns.map((r) => (r.providerId === id ? { ...r, providerId: '' } : r))
        })),

      // ---- course dates ("Kurstermine")
      upsertCourseRun: (run) =>
        patch((d) => {
          const r = normalizeCourseRun({ ...run, id: run.id || newId('crs') })
          const exists = d.courseRuns.some((x) => x.id === r.id)
          return {
            ...d,
            courseRuns: exists ? d.courseRuns.map((x) => (x.id === r.id ? r : x)) : [...d.courseRuns, r]
          }
        }),
      // Deleting a course must not leave assignments pointing at a record that
      // is gone: those would silently lose their period and show as undated.
      deleteCourseRun: (id) =>
        patch((d) => ({
          ...d,
          courseRuns: d.courseRuns.filter((x) => x.id !== id),
          trainers: d.trainers.map((tr) => {
            if (!tr.assignments) return tr
            let touched = false
            const next = {}
            for (const [k, a] of Object.entries(tr.assignments)) {
              if (a && a.courseId === id) {
                next[k] = { ...a, courseId: '' }
                touched = true
              } else next[k] = a
            }
            return touched ? { ...tr, assignments: next } : tr
          })
        })),

      // Persist the user's dashboard widget order for one zone (kpi/chart group).
      setDashboardOrder: (zone, ids) =>
        patch((d) => ({
          ...d,
          dashboard: { ...(d.dashboard || { order: {} }), order: { ...((d.dashboard && d.dashboard.order) || {}), [zone]: ids } }
        })),

      // A stage's colour is not a free choice, it is its POSITION: the ramp
      // runs light to dark so the order can be read off the board without
      // reading the labels. The list is user-editable, so the ramp has to be
      // re-spread every time its length or order changes - a seventh stage used
      // to come out plain burgundy and sit anywhere in the sequence, which is
      // the ordinal reading gone. `stageRamp` was written for exactly this and
      // was wired to nothing.
      setStages: (stages) => {
        const ramp = stageRamp(stages.length)
        patch((d) => ({ ...d, stages: stages.map((s, i) => ({ ...s, color: ramp[i] })) }))
      },
      setQuals: (quals) => patch((d) => ({ ...d, quals })),
      setAssignmentSteps: (assignmentSteps) => patch((d) => ({ ...d, assignmentSteps })),
      setConversionAircraft: (from, to) =>
        patch((d) => ({ ...d, conversionFrom: from, conversionTo: to })),
      // Guarded BEFORE the call, not inside the mutation: patch() dirties the
      // store and schedules a cloud push whatever the mutation returns, and a
      // month field fires on every keystroke while a year is being typed.
      setCapacityRange: (from, to) => {
        const d = dataRef.current
        if (d.capacityFrom === from && d.capacityTo === to) return
        patch((x) => ({ ...x, capacityFrom: from, capacityTo: to }))
      },
      setProviderCourses: (providerCourses) => patch((d) => ({ ...d, providerCourses })),
      setProviderStatus: (providerStatus) => patch((d) => ({ ...d, providerStatus })),
      setSimVersions: (simVersions) => patch((d) => ({ ...d, simVersions })),
      // One setter for every pick list the settings page edits – twelve named
      // setters would be twelve places to forget when a list is added.
      setList: (key, items) => patch((d) => ({ ...d, [key]: items })),

      // ---- other pilots (company line pilots, kept apart from `trainers`)
      upsertPilot: (pilot) =>
        patch((d) => {
          const p = withPilotDefaults({ ...pilot, id: pilot.id || newId('plt') })
          const exists = d.otherPilots.some((x) => x.id === p.id)
          return {
            ...d,
            otherPilots: exists ? d.otherPilots.map((x) => (x.id === p.id ? p : x)) : [...d.otherPilots, p]
          }
        }),
      deletePilot: (id) => patch((d) => ({ ...d, otherPilots: d.otherPilots.filter((x) => x.id !== id) })),
      setPilots: (otherPilots) => patch((d) => ({ ...d, otherPilots: otherPilots.map(withPilotDefaults) })),

      // Validate the shape before replacing everything: an arbitrary JSON file
      // would otherwise be silently accepted, wiping the roster with the seed
      // and clearing providers while still reporting success. Returns whether
      // the payload was accepted so the UI can show a real error. Also runs the
      // one-time provider prefill (loadData does; importData used to skip it).
      importData: (obj) => {
        // Guarded like patch(): import does not go through it, so without this
        // a viewer could replace the shared state with a file from disk.
        if (readOnlyRef.current) return false
        if (!obj || typeof obj !== 'object' || !Array.isArray(obj.trainers)) return false
        dirtyRef.current = true
        // Stamp it like any other change, and tombstone what the file drops.
        //
        // This used to write the file's own timestamps straight into the store,
        // which made a restore not a restore. The blob kept the backup's old
        // `updatedAt`, every record kept the `_at` it had when the backup was
        // written, and nothing that the file REMOVED left a tombstone. Two
        // seconds later the cloud sync merged - and against a row that had
        // moved on since, the server won nearly every contest: records edited
        // since the backup reverted to the server, deletions made since stayed
        // deleted, records added since stayed, and the settings came back.
        // The screen had already said "Daten erfolgreich importiert."
        //
        // stampChanges against the CURRENT data is exactly the right tool: it
        // stamps only what actually differs (so restoring a file identical to
        // the present state stamps nothing and starts no fight), and it turns
        // every record the file leaves out into a tombstone - which is what
        // makes a removal travel to the other devices instead of being undone
        // by them. `updatedAt: now` does the same for the blob-level settings.
        //
        // This is what the confirmation has always promised: "Import ersetzt
        // alle aktuellen Daten."
        const now = nowIso()
        setData((d) => ({
          ...stampChanges(d, seedMissingProviders(normalize(obj)), now),
          updatedAt: now
        }))
        return true
      },

      exportData: () => data,

      readOnly,
      resetData: () => {
        if (readOnlyRef.current) return
        dirtyRef.current = true
        setData(freshData(data.lang))
      }
    }
  }, [data])

  const value = useMemo(
    () => ({
      data,
      lang,
      saveError,
      sync,
      t: (key) => translate(lang, key),
      newId,
      ...api
    }),
    [data, lang, saveError, sync, api]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
