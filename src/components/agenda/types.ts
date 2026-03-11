export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// Re-export block types from context for convenience
export type {
  AgendaBlock,
  BlockType,
  RecurrencePattern
} from '@/context/AppointmentsContext'

export { BLOCK_TYPE_CONFIG } from '@/context/AppointmentsContext'

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

// ============================================
// ESTADOS DE VISITA DEL PACIENTE
// ============================================

// Estado de visita: dónde está el paciente físicamente en la clínica
export type VisitStatus =
  | 'scheduled' // Programada (no ha llegado aún)
  | 'waiting_room' // En sala de espera
  | 'call_patient' // Llamar
  | 'in_consultation' // En consulta
  | 'completed' // Realizada

export type VisitStatusLog = {
  status: VisitStatus
  timestamp: Date
}

// Timer duration fields (in milliseconds)
export type TimerDurations = {
  waitingDuration?: number // Time spent in waiting room
  consultationDuration?: number // Time spent in consultation
}

export const VISIT_STATUS_CONFIG: Record<
  VisitStatus,
  {
    label: string
    color: string // Color del borde
    bgColor: string // Fondo del badge/chip
    textColor: string // Color del texto
    icon: string // Nombre del icono MD3
  }
> = {
  scheduled: {
    label: 'Programada',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    textColor: '#6B7280',
    icon: 'CalendarMonthRounded'
  },
  waiting_room: {
    label: 'En sala espera',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    textColor: '#B45309',
    icon: 'PeopleRounded'
  },
  call_patient: {
    label: 'Llamar',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    textColor: '#1D4ED8',
    icon: 'CallRounded'
  },
  in_consultation: {
    label: 'En consulta',
    color: '#10B981',
    bgColor: '#D1FAE5',
    textColor: '#047857',
    icon: 'MonitorHeartRounded'
  },
  completed: {
    label: 'Realizada',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    textColor: '#6D28D9',
    icon: 'CheckCircleRounded'
  }
}

// Orden de los estados para el menú de selección
export const VISIT_STATUS_ORDER: VisitStatus[] = [
  'scheduled',
  'waiting_room',
  'call_patient',
  'in_consultation',
  'completed'
]

// ============================================
// DETALLES DE EVENTO
// ============================================

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
  invoiceNumber?: string // Número visible de factura (si existe)
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
  bgColorInline?: string // Inline background color from professional (hex pastel)
  borderClass?: string
  left?: string
  width?: string
  detail?: EventDetail
  professionalId?: string
  completed?: boolean // Indica si la cita ya se ha realizado
  confirmed?: boolean // Indica si el paciente confirmó la cita (independiente del estado)
  visitStatus?: VisitStatus // Estado de visita del paciente (dónde está en la clínica)
  visitStatusHistory?: VisitStatusLog[] // Historial de cambios de estado con timestamps
  waitingDuration?: number // Duración de espera en ms (para citas completadas)
  consultationDuration?: number // Duración de consulta en ms (para citas completadas)
  linkedTreatments?: {
    id: string
    description: string
    amount: string
  }[] // Tratamientos vinculados a esta cita
  // Campos para citas creadas por el agente de voz
  createdByVoiceAgent?: boolean // Marca que fue creada por IA
  voiceAgentCallId?: string // ID de la llamada vinculada
  voiceAgentData?: {
    callSummary: string
    patientSentiment:
      | 'aliviado'
      | 'nervioso'
      | 'enfadado'
      | 'contento'
      | 'preocupado'
    callDuration: string
    callIntent: string
    transcriptionAvailable: boolean
  }
}

export type DayColumn = {
  id: Weekday
  leftVar: string
  widthVar: string
  events: AgendaEvent[]
}

export type EventSelection = { event: AgendaEvent; column: DayColumn } | null

// ============================================
// TIPOS VISUALES PARA BLOQUEOS DE AGENDA
// ============================================

import type { BlockType } from '@/context/AppointmentsContext'

// Evento visual de bloqueo para el calendario (similar a AgendaEvent)
export type AgendaBlockEvent = {
  id: string
  top: string
  height: string
  blockType: BlockType
  description: string
  box?: string
  timeRange: string
  responsibleName?: string
  isRecurring?: boolean
  parentBlockId?: string
}
