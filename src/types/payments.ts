// ============================================
// TIPOS PARA PAGOS FRACCIONADOS DE PRESUPUESTOS
// ============================================

// Estado de una cuota individual
export type InstallmentStatus = 'pending' | 'partial' | 'paid'

// Cuota individual de un plan de pagos
export type BudgetInstallment = {
  id: string
  installmentNumber: number // 1, 2, 3...
  amount: number // Monto de la cuota
  status: InstallmentStatus
  paidAmount: number // Cantidad ya pagada de esta cuota
  dueDate?: string // Fecha de vencimiento opcional (formato: YYYY-MM-DD)
}

// Plan de cuotas a nivel de presupuesto
export type BudgetInstallmentPlan = {
  totalInstallments: number // Ej: 6 cuotas
  amountPerInstallment: number // Ej: 150€
  installments: BudgetInstallment[]
  createdAt: string // Fecha de creación del plan
  totalAmount: number // Total del presupuesto
}

// Métodos de pago disponibles
export type PaymentMethod =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'financiacion'
  | 'otros'

// Pago vinculado a presupuesto
export type BudgetPayment = {
  id: string
  budgetId: string
  date: string // Formato: YYYY-MM-DD
  amount: number
  paymentMethod: PaymentMethod
  installmentIds: string[] // IDs de las cuotas que cubre este pago
  reference?: string // Referencia de pago (número de transacción, etc.)
  receiptGenerated: boolean
  invoiceId?: string // Si se generó factura
  notes?: string
  createdAt: string
  createdBy?: string // Usuario que registró el pago
}

// Resumen de estado de pago de un presupuesto
export type BudgetPaymentSummary = {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  totalInstallments: number
  paidInstallments: number
  pendingInstallments: number
  nextInstallment?: BudgetInstallment
}

// Configuración para crear plan de cuotas
export type InstallmentPlanConfig = {
  budgetId: string
  totalAmount: number
  numberOfInstallments: number
  startDate?: string
  frequency?: 'monthly' | 'biweekly' | 'weekly' | 'custom'
}

// Datos para registrar un pago
export type RegisterBudgetPaymentData = {
  budgetId: string
  amount: number
  paymentMethod: PaymentMethod
  installmentIds: string[]
  reference?: string
  notes?: string
  generateReceipt?: boolean
  generateInvoice?: boolean
}

// Helper para crear un plan de cuotas
export function createInstallmentPlan(
  config: InstallmentPlanConfig
): BudgetInstallmentPlan {
  const { totalAmount, numberOfInstallments, startDate } = config
  const amountPerInstallment = Math.round((totalAmount / numberOfInstallments) * 100) / 100
  
  // Ajustar la última cuota para evitar errores de redondeo
  const regularAmount = amountPerInstallment
  const lastAmount = totalAmount - (regularAmount * (numberOfInstallments - 1))
  
  const installments: BudgetInstallment[] = []
  const baseDate = startDate ? new Date(startDate) : new Date()
  
  for (let i = 1; i <= numberOfInstallments; i++) {
    const dueDate = new Date(baseDate)
    dueDate.setMonth(dueDate.getMonth() + (i - 1))
    
    installments.push({
      id: `inst-${Date.now()}-${i}`,
      installmentNumber: i,
      amount: i === numberOfInstallments ? lastAmount : regularAmount,
      status: 'pending',
      paidAmount: 0,
      dueDate: dueDate.toISOString().split('T')[0]
    })
  }
  
  return {
    totalInstallments: numberOfInstallments,
    amountPerInstallment: regularAmount,
    installments,
    createdAt: new Date().toISOString(),
    totalAmount
  }
}

// Helper para calcular resumen de pagos
export function calculatePaymentSummary(
  installmentPlan: BudgetInstallmentPlan | undefined,
  payments: BudgetPayment[] | undefined
): BudgetPaymentSummary | null {
  if (!installmentPlan) return null
  
  const { installments, totalAmount } = installmentPlan
  
  const paidInstallments = installments.filter(i => i.status === 'paid').length
  const pendingInstallments = installments.filter(i => i.status === 'pending' || i.status === 'partial').length
  
  const paidAmount = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0
  const pendingAmount = totalAmount - paidAmount
  
  const nextInstallment = installments.find(i => i.status === 'pending' || i.status === 'partial')
  
  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    totalInstallments: installments.length,
    paidInstallments,
    pendingInstallments,
    nextInstallment
  }
}

// Helper para formatear método de pago
export function formatPaymentMethod(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    financiacion: 'Financiación',
    otros: 'Otros'
  }
  return labels[method]
}

// Helper para formatear estado de cuota
export function formatInstallmentStatus(status: InstallmentStatus): string {
  const labels: Record<InstallmentStatus, string> = {
    pending: 'Pendiente',
    partial: 'Parcial',
    paid: 'Pagada'
  }
  return labels[status]
}

// Helper para obtener color de estado de cuota
export function getInstallmentStatusColor(status: InstallmentStatus): {
  bg: string
  text: string
} {
  const colors: Record<InstallmentStatus, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    partial: { bg: '#DBEAFE', text: '#2563EB' },
    paid: { bg: '#E9FBF9', text: '#0D9488' }
  }
  return colors[status]
}

// ============================================
// TIPOS PARA RECIBOS DE CAJA
// ============================================

// Recibo de pago generado
export type Receipt = {
  id: string
  receiptNumber: string // Ej: "REC-2026-0001"
  date: string // Fecha de emisión del recibo
  patientId: string
  patientName: string
  concept: string
  amount: number
  paymentMethod: PaymentMethod
  paymentReference?: string
  transactionId: string // ID de la transacción de caja asociada
  createdAt: string
  // Datos de la clínica
  clinicName?: string
  clinicNIF?: string
  clinicAddress?: string
}

// Datos para generar un recibo
export type GenerateReceiptData = {
  transactionId: string
  patientId: string
  patientName: string
  concept: string
  amount: number
  paymentMethod: PaymentMethod
  paymentReference?: string
}

// ============================================
// TIPOS PARA REGISTRO DE PAGOS SIMPLES
// ============================================

// Datos para registrar un pago simple (no de presupuesto)
export type RegisterSimplePaymentData = {
  patientId: string
  patientName: string
  concept: string
  amount: number
  paymentMethod: PaymentMethod
  originalTransactionId?: string // Referencia al movimiento original (para pagos parciales)
  reference?: string
  generateReceipt?: boolean
  generateInvoice?: boolean
}

// ============================================
// HELPERS ADICIONALES
// ============================================

// Generar número de recibo único
let receiptCounter = 1
export function generateReceiptNumber(): string {
  const year = new Date().getFullYear()
  const number = String(receiptCounter++).padStart(4, '0')
  return `REC-${year}-${number}`
}

// Resetear contador de recibos (útil para testing)
export function resetReceiptCounter(value = 1): void {
  receiptCounter = value
}
