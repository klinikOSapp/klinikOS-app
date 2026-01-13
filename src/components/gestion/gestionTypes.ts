// Types for the Gestion (Management) dashboard

// Specialties offered by the clinic
export type Specialty = 'Conservadora' | 'Ortodoncia' | 'Implantes' | 'Estética'

// All available specialties (for iteration and validation)
export const SPECIALTIES: Specialty[] = [
  'Conservadora',
  'Ortodoncia',
  'Implantes',
  'Estética'
]

// Filter state for the dashboard
export type SpecialtyFilter = Specialty | null
