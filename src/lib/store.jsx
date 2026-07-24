import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SEED_TRAINERS } from '../data/seed.js'
import {
  SEED_PROVIDERS,
  DEFAULT_PROVIDER_COURSES,
  DEFAULT_PROVIDER_STATUS,
  PREFILL_NAMES,
  emptyProvider
} from '../data/providers.js'
import { DEFAULT_STAGES, ASSIGNMENT_STEPS, mergeAssignments } from '../data/pipeline.js'
import { DEFAULT_QUALS, normalizeQual } from '../data/qualifications.js'
import { fteFromPartTime } from './format.js'
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
function withConvDefaults(trainer) {
  return {
    staffType: 'internal',
    aircraft: 'A320',
    ...trainer,
    // FTE is editable; default it from the part-time workload only when unset.
    fte: typeof trainer.fte === 'number' ? trainer.fte : fteFromPartTime(trainer.partTime),
    qual: normalizeQual(trainer.qual),
    conv: {
      stage: 'nominated',
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
    courses: Array.isArray(p.courses) ? p.courses : []
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
    conversionFrom: 'A320',
    conversionTo: 'B737',
    _provSeeded: true,
    _courseSeed2: true,
    _provStatus2: true,
    _qualMerge: true,
    updatedAt: nowIso()
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshData()
    const parsed = JSON.parse(raw)
    let data = normalize(parsed)
    // One-time: ensure the standard providers exist (add missing ones by name).
    if (!data._provSeeded) {
      const have = new Set(data.providers.map((p) => (p.name || '').trim().toLowerCase()))
      const add = PREFILL_NAMES.filter((n) => !have.has(n.toLowerCase())).map((n) => ({
        ...emptyProvider('prov-' + n.toLowerCase()),
        name: n
      }))
      data = { ...data, providers: [...data.providers, ...add], _provSeeded: true }
    }
    return data
  } catch (e) {
    console.warn('Failed to load stored data, using seed.', e)
    return freshData()
  }
}

// Accept partial / older payloads (also used by Import) and fill gaps.
function normalize(obj) {
  const base = freshData(obj?.lang === 'en' ? 'en' : 'de')
  if (!obj || typeof obj !== 'object') return base
  const result = {
    schema: SCHEMA,
    lang: obj.lang === 'en' ? 'en' : 'de',
    trainers: Array.isArray(obj.trainers)
      ? obj.trainers.map((t) => withConvDefaults({ ...t }))
      : base.trainers,
    providers: Array.isArray(obj.providers) ? obj.providers.map(normalizeProvider) : [],
    stages:
      Array.isArray(obj.stages) && obj.stages.length
        ? obj.stages.map(migrateStage)
        : base.stages,
    quals: Array.isArray(obj.quals) && obj.quals.length ? obj.quals.map((q) => ({ ...q })) : base.quals,
    assignmentSteps:
      Array.isArray(obj.assignmentSteps) && obj.assignmentSteps.length
        ? obj.assignmentSteps.map((s) => ({ ...s }))
        : base.assignmentSteps,
    providerCourses:
      Array.isArray(obj.providerCourses) && obj.providerCourses.length
        ? obj.providerCourses.map((x) => ({ ...x }))
        : base.providerCourses,
    providerStatus:
      Array.isArray(obj.providerStatus) && obj.providerStatus.length
        ? obj.providerStatus.map((x) => ({ ...x }))
        : base.providerStatus,
    conversionFrom: obj.conversionFrom || 'A320',
    conversionTo: obj.conversionTo || 'B737',
    theme: obj.theme === 'dark' ? 'dark' : 'light',
    _provSeeded: obj._provSeeded === true,
    _courseSeed2: obj._courseSeed2 === true,
    _provStatus2: obj._provStatus2 === true,
    _qualMerge: obj._qualMerge === true,
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
  return result
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const saveTimer = useRef(null)
  const dataRef = useRef(data)
  dataRef.current = data

  // Debounced persistence to localStorage. (Cloud sync will hook in here later.)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (e) {
        console.warn('Persist failed', e)
      }
    }, 250)
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [data])

  // Synchronous flush on page exit so an edit made within the 250ms debounce
  // window survives the reload/update buttons and tab closes.
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current))
      } catch (e) {
        /* ignore */
      }
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
    const patch = (mut) =>
      setData((d) => {
        const next = typeof mut === 'function' ? mut(d) : mut
        return { ...next, updatedAt: nowIso() }
      })

    return {
      setLang: (l) => patch((d) => ({ ...d, lang: l })),
      setTheme: (th) => patch((d) => ({ ...d, theme: th })),
      // Force an immediate persist (the explicit Save button); returns success.
      saveNow: () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current))
          return true
        } catch (e) {
          return false
        }
      },

      upsertTrainer: (trainer) =>
        patch((d) => {
          const t = withConvDefaults(trainer)
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
        patch((d) => ({ ...d, trainers: trainers.map((t) => withConvDefaults(t)) })),

      setConversion: (id, convPatch) =>
        patch((d) => ({
          ...d,
          trainers: d.trainers.map((x) =>
            x.id === id ? { ...x, conv: { ...x.conv, ...convPatch } } : x
          )
        })),

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

      deleteProvider: (id) =>
        patch((d) => ({ ...d, providers: d.providers.filter((x) => x.id !== id) })),

      setStages: (stages) => patch((d) => ({ ...d, stages })),
      setQuals: (quals) => patch((d) => ({ ...d, quals })),
      setAssignmentSteps: (assignmentSteps) => patch((d) => ({ ...d, assignmentSteps })),
      setConversionAircraft: (from, to) =>
        patch((d) => ({ ...d, conversionFrom: from, conversionTo: to })),
      setProviderCourses: (providerCourses) => patch((d) => ({ ...d, providerCourses })),
      setProviderStatus: (providerStatus) => patch((d) => ({ ...d, providerStatus })),

      importData: (obj) => {
        const next = normalize(obj)
        setData(next)
      },

      exportData: () => data,

      resetData: () => setData(freshData(data.lang))
    }
  }, [data])

  const value = useMemo(
    () => ({
      data,
      lang,
      t: (key) => translate(lang, key),
      newId,
      ...api
    }),
    [data, lang, api]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
