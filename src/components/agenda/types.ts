export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// Información de pagos parciales
export type PaymentInfo = {
  totalAmount: number // Monto total del tratamiento (ej: 600)
  paidAmount: number // Ya pagado (ej: 200)
  pendingAmount: number // Pendiente (ej: 400)
  currency: string // "€"
}

// Plan de cuotas (opcional)
export type InstallmentPlan = {
  totalInstallments: number // Total de cuotas (ej: 6)
  currentInstallment: number // Cuota actual a pagar (ej: 2)
  amountPerInstallment: number // Monto por cuota (ej: 100)
}

export type EventDetail = {
  title: string
  date: string
  duration?: string
  patientFull: string
  patientPhone?: string
  patientEmail?: string
  referredBy?: string
  professional: string
  professionalAvatar?: string
  economicAmount?: string
  economicStatus?: string
  notes?: string
  locationLabel: string
  patientLabel: string
  professionalLabel: string
  economicLabel?: string
  notesLabel?: string
  overlayOffsets?: {
    top?: string
    left?: string
  }
  // Campos para integración de cobros
  patientId?: string // ID del paciente para navegación
  appointmentId?: string // ID de la cita para tracking
  invoiceId?: string // ID de factura si existe
  treatmentDescription?: string // Descripción del tratamiento para el modal de cobro
  // Información de pagos parciales
  paymentInfo?: PaymentInfo
  // Plan de cuotas (opcional)
  installmentPlan?: InstallmentPlan
}

export type AgendaEvent = {
  id: string
  top: string
  height: string
  title: string
  patient: string
  box: string
  timeRange: string
  backgroundClass: string
  borderClass?: string
  left?: string
  width?: string
  detail?: EventDetail
  professionalId?: string
  completed?: boolean // Indica si la cita ya se ha realizado
}

export type DayColumn = {
  id: Weekday
  leftVar: string
  widthVar: string
  events: AgendaEvent[]
}

export type EventSelection = { event: AgendaEvent; column: DayColumn } | null

