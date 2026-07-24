import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
import { fteFromPartTime, normalizeAuthority } from './format.js'
import { translate } from './i18n.js'

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
function migrateStage(s) {
  return { id: s.id, label: s.label ?? s.de ?? s.en ?? s.id, color: s.color || '#AF1E65' }
}

// Provider forward-compat: single `location` -> `locations[]`; ensure `courses[]`.
function normalizeProvider(p) {
  const base = emptyProvider(p.id || newId('prov'))
  return {
    ...base,
    ...p,
    locations: Array.isArray(p.locations) ? p.locations : p.location ? [p.location] : [],
    courses: Array.isArray(p.courses) ? p.courses : [],
    simVersions: Array.isArray(p.simVersions) ? p.simVersions : []
  }
}

function freshData(lang = 'de') {
  return {
    schema: SCHEMA,
    lang,
    theme: 'light',
    trainers: SEED_TRAINERS.map((t) => withConvDefaults({ ...t })),
    providers: SEED_PROVIDERS.map((p) => ({ ...p })),
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    quals: DEFAULT_QUALS.map((q) => ({ ...q })),
    assignmentSteps: ASSIGNMENT_STEPS.map((s) => ({ ...s })),
    providerCourses: DEFAULT_PROVIDER_COURSES.map((x) => ({ ...x })),
    providerStatus: DEFAULT_PROVIDER_STATUS.map((x) => ({ ...x })),
    simVersions: DEFAULT_SIM_VERSIONS.map((x) => ({ ...x })),
    conversionFrom: 'A320',
    conversionTo: 'B737',
    dashboard: { order: {} },
    _provSeeded: true,
    _courseSeed2: true,
    _provStatus2: true,
    _qualMerge: true,
    _roleSeed: true,
    updatedAt: nowIso()
  }
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
    providerCourses: Array.isArray(obj.providerCourses)
      ? obj.providerCourses.map((x) => ({ ...x }))
      : base.providerCourses,
    providerStatus: Array.isArray(obj.providerStatus)
      ? obj.providerStatus.map((x) => ({ ...x }))
      : base.providerStatus,
    simVersions: Array.isArray(obj.simVersions)
      ? obj.simVersions.map((x) => ({ ...x }))
      : base.simVersions,
    conversionFrom: obj.conversionFrom || 'A320',
    conversionTo: obj.conversionTo || 'B737',
    dashboard:
      obj.dashboard && typeof obj.dashboard === 'object' && obj.dashboard.order && typeof obj.dashboard.order === 'object'
        ? { order: obj.dashboard.order }
        : base.dashboard,
    theme: obj.theme === 'dark' ? 'dark' : 'light',
    _provSeeded: obj._provSeeded === true,
    _courseSeed2: obj._courseSeed2 === true,
    _provStatus2: obj._provStatus2 === true,
    _qualMerge: obj._qualMerge === true,
    _roleSeed: obj._roleSeed === true,
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
  return result
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

  const lang = data.lang
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const theme = data.theme || 'light'
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const api = useMemo(() => {
    const patch = (mut) => {
      dirtyRef.current = true
      setData((d) => {
        const next = typeof mut === 'function' ? mut(d) : mut
        return { ...next, updatedAt: nowIso() }
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
          })
        })),

      // Persist the user's dashboard widget order for one zone (kpi/chart group).
      setDashboardOrder: (zone, ids) =>
        patch((d) => ({
          ...d,
          dashboard: { ...(d.dashboard || { order: {} }), order: { ...((d.dashboard && d.dashboard.order) || {}), [zone]: ids } }
        })),

      setStages: (stages) => patch((d) => ({ ...d, stages })),
      setQuals: (quals) => patch((d) => ({ ...d, quals })),
      setAssignmentSteps: (assignmentSteps) => patch((d) => ({ ...d, assignmentSteps })),
      setConversionAircraft: (from, to) =>
        patch((d) => ({ ...d, conversionFrom: from, conversionTo: to })),
      setProviderCourses: (providerCourses) => patch((d) => ({ ...d, providerCourses })),
      setProviderStatus: (providerStatus) => patch((d) => ({ ...d, providerStatus })),
      setSimVersions: (simVersions) => patch((d) => ({ ...d, simVersions })),

      // Validate the shape before replacing everything: an arbitrary JSON file
      // would otherwise be silently accepted, wiping the roster with the seed
      // and clearing providers while still reporting success. Returns whether
      // the payload was accepted so the UI can show a real error. Also runs the
      // one-time provider prefill (loadData does; importData used to skip it).
      importData: (obj) => {
        if (!obj || typeof obj !== 'object' || !Array.isArray(obj.trainers)) return false
        dirtyRef.current = true
        setData(seedMissingProviders(normalize(obj)))
        return true
      },

      exportData: () => data,

      resetData: () => {
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
      t: (key) => translate(lang, key),
      newId,
      ...api
    }),
    [data, lang, saveError, api]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
