// ============================================
// Shared types for treatment configuration
// Used by ConfigurationContext, TreatmentsPage, and patient module
// ============================================

export type ConfigTreatment = {
  id: string
  name: string
  code: string
  basePrice: number
  estimatedTime: string
  iva: string
  selected: boolean
}

export type ConfigCategory = {
  id: string
  name: string
  treatments: ConfigTreatment[]
}

export type DiscountType = 'percentage' | 'fixed'

export type ConfigDiscount = {
  id: string
  name: string
  type: DiscountType
  value: number
  notes: string
  isActive: boolean
}
