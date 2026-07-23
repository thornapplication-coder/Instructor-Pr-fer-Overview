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
  { id: 'approved', label: 'freigegeben', color: '#2FA36B' },
  { id: 'candidate', label: 'Kandidat', color: '#E8A33D' },
  { id: 'onhold', label: 'zurückgestellt', color: '#787878' },
  { id: 'rejected', label: 'abgelehnt', color: '#C8102E' }
]

// Prefilled providers (names only – fill courses / ICAO locations in the app).
const PREFILL = ['BAA', 'CAE', 'CATC', 'LAT', 'SunEx', 'TUI']
export const SEED_PROVIDERS = PREFILL.map((name) => ({
  ...emptyProvider('prov-' + name.toLowerCase()),
  name
}))

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
    status: 'candidate',
    notes: ''
  }
}

// The names that should exist after the one-time prefill migration.
export const PREFILL_NAMES = PREFILL
