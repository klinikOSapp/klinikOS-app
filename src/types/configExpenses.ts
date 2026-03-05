// ============================================
// Shared types for expense configuration
// Used by ConfigurationContext and FinancesExpensesPage
// ============================================

export type ExpenseStatus = 'activo' | 'inactivo'

export type ExpenseCategory = string

export type ConfigExpense = {
  id: string
  nombre: string
  importe: number
  frecuencia: string
  categoria: ExpenseCategory
  fechaInicio: string
  fechaFin: string
  notas: string
  estado: ExpenseStatus
}
