// External provider directory (Type Rating / TRI / TRE / SIM providers).
// Ships EMPTY on purpose — the user fills it inside the app via "Add provider".
//
// Provider offering-types and statuses are USER-EDITABLE (managed in the
// Providers tab). These are just the shipped defaults.
export const DEFAULT_PROVIDER_TYPES = [
  { id: 'TR', label: 'TR' },
  { id: 'TRI', label: 'TRI' },
  { id: 'TRE', label: 'TRE' },
  { id: 'SIM', label: 'SIM' },
  { id: 'CCQ', label: 'CCQ' },
  { id: 'Other', label: 'Other' }
]

export const DEFAULT_PROVIDER_STATUS = [
  { id: 'approved', label: 'freigegeben', color: '#2FA36B' },
  { id: 'candidate', label: 'Kandidat', color: '#E8A33D' },
  { id: 'onhold', label: 'zurückgestellt', color: '#787878' },
  { id: 'rejected', label: 'abgelehnt', color: '#C8102E' }
]

export const SEED_PROVIDERS = []

export function emptyProvider(id) {
  return {
    id,
    name: '',
    types: [],
    location: '',
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
