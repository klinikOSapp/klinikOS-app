// ============================================
// Initial data for treatment configuration
// Imported by ConfigurationContext as default state
// ============================================

import type { ConfigDiscount } from '@/types/treatments'

// ============================================
// INITIAL DISCOUNTS
// ============================================

export const initialDiscounts: ConfigDiscount[] = [
  {
    id: 'disc-001',
    name: 'Descuento familiar',
    type: 'percentage',
    value: 15,
    notes: 'Aplicable a familiares directos de pacientes existentes',
    isActive: true
  },
  {
    id: 'disc-002',
    name: 'Convenio empresa ABC',
    type: 'fixed',
    value: 100,
    notes: 'Precio fijo para empleados de empresa ABC',
    isActive: false
  },
  {
    id: 'disc-003',
    name: 'Descuento estudiantes',
    type: 'percentage',
    value: 10,
    notes: 'Para estudiantes universitarios con carnet vigente',
    isActive: true
  },
  {
    id: 'disc-004',
    name: 'Descuento tercera edad',
    type: 'percentage',
    value: 20,
    notes: 'Para mayores de 65 años',
    isActive: true
  },
  {
    id: 'disc-005',
    name: 'Convenio Mutua Salud',
    type: 'percentage',
    value: 25,
    notes: 'Aplicable a afiliados de Mutua Salud',
    isActive: true
  },
  {
    id: 'disc-006',
    name: 'Pack tratamiento completo',
    type: 'fixed',
    value: 200,
    notes: 'Descuento fijo al contratar tratamiento completo',
    isActive: false
  },
  {
    id: 'disc-007',
    name: 'Primera visita gratis',
    type: 'fixed',
    value: 50,
    notes: 'Descuento en primera visita para nuevos pacientes',
    isActive: true
  },
  {
    id: 'disc-008',
    name: 'Referido por paciente',
    type: 'percentage',
    value: 10,
    notes: 'Descuento para pacientes referidos',
    isActive: true
  }
]

// ============================================
// INITIAL CATEGORIES
// This is a reference to the data exported from TreatmentsPage
// to avoid duplicating ~3700 lines of mock treatment data.
// The actual data remains in TreatmentsPage.tsx as `initialCategories`.
// ============================================

// NOTE: initialCategories is exported from TreatmentsPage.tsx
// and imported separately where needed to avoid circular dependencies.
