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
  { id: 'in use', label: 'in use', color: '#2FA36B' },
  { id: 'no agreement', label: 'no agreement', color: '#C8102E' }
]

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
    authority: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    price: '',
    capacity: '',
    slots: '', // capacity as a number of seats/slots (for utilization)
    status: '',
    notes: ''
  }
}

// The names that should exist after the one-time prefill migration.
export const PREFILL_NAMES = PREFILL
