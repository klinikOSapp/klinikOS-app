import type { BudgetInstallmentPlan, BudgetPayment } from '@/types/payments'

// === PRESUPUESTOS TYPES (shared across budget components) ===
export type BudgetStatusType = 'Aceptado' | 'Pendiente' | 'Rechazado'

export const BUDGET_STATUS_OPTIONS: BudgetStatusType[] = [
  'Aceptado',
  'Pendiente',
  'Rechazado'
]

// Tipo para tratamientos incluidos en un presupuesto
export type BudgetTreatment = {
  pieza?: number
  cara?: string
  codigo?: string
  tratamiento: string
  precio: string
  porcentajeDescuento?: number
  descuento: string
  importe: string
  doctor?: string
}

// Tipo para historial de cambios del presupuesto
export type BudgetHistoryEntry = {
  date: string
  action: string
  user?: string
}

// Tipo para descuento general
export type BudgetGeneralDiscount = {
  type: 'percentage' | 'fixed'
  value: number
}

export type BudgetRow = {
  id: string
  description: string
  amount: string
  date: string
  status: BudgetStatusType
  professional: string
  insurer?: string
  // Referencias para conexión a DB
  patientId?: string
  patientName?: string
  quoteId?: number
  planId?: number
  // Campos extendidos para detalles
  treatments?: BudgetTreatment[]
  generalDiscount?: BudgetGeneralDiscount
  subtotal?: number
  validUntil?: string
  history?: BudgetHistoryEntry[]
  // Campos para pagos fraccionados
  installmentPlan?: BudgetInstallmentPlan
  payments?: BudgetPayment[]
}
