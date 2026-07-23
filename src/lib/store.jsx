import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SEED_TRAINERS } from '../data/seed.js'
import { SEED_PROVIDERS } from '../data/providers.js'
import { DEFAULT_STAGES } from '../data/pipeline.js'
import { translate } from './i18n.js'

const STORAGE_KEY = 'ewl737:data:v1'
const SCHEMA = 1

const StoreContext = createContext(null)

function nowIso() {
  return new Date().toISOString()
}

function newId(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9)
}

// Ensure every trainer has a conversion object (forward-compatible migration).
function withConvDefaults(trainer) {
  return {
    ...trainer,
    conv: {
      stage: 'nominated',
      status: 'on_track',
      target: '',
      note: '',
      ...(trainer.conv || {})
    }
  }
}

function freshData(lang = 'de') {
  return {
    schema: SCHEMA,
    lang,
    trainers: SEED_TRAINERS.map((t) => withConvDefaults({ ...t })),
    providers: SEED_PROVIDERS.map((p) => ({ ...p })),
    stages: DEFAULT_STAGES.map((s) => ({ ...s })),
    updatedAt: nowIso()
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshData()
    const parsed = JSON.parse(raw)
    return normalize(parsed)
  } catch (e) {
    console.warn('Failed to load stored data, using seed.', e)
    return freshData()
  }
}

// Accept partial / older payloads (also used by Import) and fill gaps.
function normalize(obj) {
  const base = freshData(obj?.lang === 'en' ? 'en' : 'de')
  if (!obj || typeof obj !== 'object') return base
  return {
    schema: SCHEMA,
    lang: obj.lang === 'en' ? 'en' : 'de',
    trainers: Array.isArray(obj.trainers)
      ? obj.trainers.map((t) => withConvDefaults({ ...t }))
      : base.trainers,
    providers: Array.isArray(obj.providers) ? obj.providers.map((p) => ({ ...p })) : [],
    stages:
      Array.isArray(obj.stages) && obj.stages.length ? obj.stages.map((s) => ({ ...s })) : base.stages,
    updatedAt: obj.updatedAt || nowIso()
  }
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

      setConversion: (id, convPatch) =>
        patch((d) => ({
          ...d,
          trainers: d.trainers.map((x) =>
            x.id === id ? { ...x, conv: { ...x.conv, ...convPatch } } : x
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
