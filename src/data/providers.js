import { STATUS } from '../lib/palette.js'
// External provider directory (courses providers offer, at one or more airport
// locations given as ICAO codes). Courses and statuses are user-editable.

// Courses a provider can offer (multi-select). User-editable defaults:
export const DEFAULT_PROVIDER_COURSES = [
  { id: 'LIFUS flying', label: 'LIFUS flying' },
  { id: 'SFI Kurs', label: 'SFI Kurs' },
  { id: 'SIM only', label: 'SIM only' },
  { id: 'TRE Kurs', label: 'TRE Kurs' },
  { id: 'TRI Kurs', label: 'TRI Kurs' },
  { id: 'Type Rating + Base Training', label: 'Type Rating + Base Training' },
  { id: 'Type Rating + ZFTT', label: 'Type Rating + ZFTT' }
]

export const DEFAULT_PROVIDER_STATUS = [
  { id: 'in use', label: 'in use', color: STATUS.good },
  { id: 'no agreement', label: 'no agreement', color: STATUS.critical }
]

// Simulator versions a provider can offer (multi-select). User-editable.
export const DEFAULT_SIM_VERSIONS = [
  { id: 'NG', label: 'NG' },
  { id: 'MAX', label: 'MAX' }
]

// Resolve a stored SIM-version id to its display label.
export function simVersionLabel(defs, id) {
  if (id == null || id === '') return ''
  const s = (defs || []).find((x) => x.id === id)
  return s ? s.label : id
}

// Prefilled providers (names only – fill courses / ICAO locations in the app).
const PREFILL = ['BAA', 'CAE', 'CATC', 'LAT', 'SunEx', 'TUI']
export const SEED_PROVIDERS = PREFILL.map((name) => ({
  ...emptyProvider('prov-' + name.toLowerCase()),
  name
}))

// Resolve a stored provider-course id to its display label. Custom courses are
// stored by their (random) id, so tables/exports must resolve through this.
export function courseLabel(courseDefs, id) {
  if (id == null || id === '') return ''
  const c = (courseDefs || []).find((x) => x.id === id)
  return c ? c.label : id
}

export function emptyProvider(id) {
  return {
    id,
    name: '',
    courses: [],
    locations: [], // ICAO codes
    simVersions: [], // e.g. NG / MAX (multi-select)
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    price: '',
    // Seats the provider can take PER MONTH. `slots` is the overall figure,
    // `slotsByStep` the same thing broken down by course type ({stepId: n}) -
    // a provider that runs six type ratings a month may only run two TRI
    // courses, and a single total hides exactly that.
    slots: '',
    slotsByStep: {},
    status: '',
    notes: ''
  }
}

// The names that should exist after the one-time prefill migration.
export const PREFILL_NAMES = PREFILL
