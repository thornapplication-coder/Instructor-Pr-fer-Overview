// External provider directory (Type Rating / TRI / TRE / SIM providers).
// Ships EMPTY on purpose — the user fills it inside the app via "Add provider".
export const PROVIDER_TYPES = ['TR', 'TRI', 'TRE', 'SIM', 'CCQ', 'Other']

export const PROVIDER_STATUS = {
  approved:  { de: 'freigegeben', en: 'approved',  color: '#2FA36B' },
  candidate: { de: 'Kandidat',    en: 'candidate', color: '#E8A33D' },
  onhold:    { de: 'zurückgestellt', en: 'on hold', color: '#787878' },
  rejected:  { de: 'abgelehnt',   en: 'rejected',  color: '#C8102E' }
}

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
