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
    fte: typeof trainer.fte === 'number' ? trainer.fte : 1,
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

// The first stage ("Nominierung") = not yet started; everyone else is in/after
// conversion. Aircraft follows automatically: first stage -> "from" (A320),
// any other stage -> "to" (B737).
function firstStageId(stages) {
  return (stages && stages[0] && stages[0].id) || 'nominated'
}
function deriveAircraft(conv, stages, from, to) {
  const stage = (conv && conv.stage) || firstStageId(stages)
  return stage === firstStageId(stages) ? from : to
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

function applyAircraft(d) {
  const from = d.conversionFrom || 'A320'
  const to = d.conversionTo || 'B737'
  return {
    ...d,
    trainers: d.trainers.map((t) => ({ ...t, aircraft: deriveAircraft(t.conv, d.stages, from, to) }))
  }
}

function freshData(lang = 'de') {
  return {
    schema: SCHEMA,
    lang,
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
    updatedAt: nowIso()
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshData()
    const parsed = JSON.parse(raw)
    // One-time migration when upgrading from an older schema: set all FTE to 1.
    const resetFte = parsed.schema !== SCHEMA
    let data = normalize(parsed)
    if (resetFte) {
      data = { ...data, trainers: data.trainers.map((t) => ({ ...t, fte: 1 })) }
    }
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
    _provSeeded: obj._provSeeded === true,
    updatedAt: obj.updatedAt || nowIso()
  }
  // Aircraft is derived from the conversion stage (automatic).
  return applyAircraft(result)
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData)
  const saveTimer = useRef(null)

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

  const lang = data.lang
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const api = useMemo(() => {
    const patch = (mut) =>
      setData((d) => {
        const next = typeof mut === 'function' ? mut(d) : mut
        return { ...next, updatedAt: nowIso() }
      })

    return {
      setLang: (l) => patch((d) => ({ ...d, lang: l })),

      upsertTrainer: (trainer) =>
        patch((d) => {
          const from = d.conversionFrom || 'A320'
          const to = d.conversionTo || 'B737'
          const t = withConvDefaults(trainer)
          t.aircraft = deriveAircraft(t.conv, d.stages, from, to)
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

      setConversion: (id, convPatch) =>
        patch((d) => {
          const from = d.conversionFrom || 'A320'
          const to = d.conversionTo || 'B737'
          return {
            ...d,
            trainers: d.trainers.map((x) => {
              if (x.id !== id) return x
              const conv = { ...x.conv, ...convPatch }
              return { ...x, conv, aircraft: deriveAircraft(conv, d.stages, from, to) }
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

      deleteProvider: (id) =>
        patch((d) => ({ ...d, providers: d.providers.filter((x) => x.id !== id) })),

      setStages: (stages) => patch((d) => applyAircraft({ ...d, stages })),
      setQuals: (quals) => patch((d) => ({ ...d, quals })),
      setAssignmentSteps: (assignmentSteps) => patch((d) => ({ ...d, assignmentSteps })),
      setConversionAircraft: (from, to) =>
        patch((d) => applyAircraft({ ...d, conversionFrom: from, conversionTo: to })),
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
