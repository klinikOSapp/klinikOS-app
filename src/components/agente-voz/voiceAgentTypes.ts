// Voice Agent Types - Extracted from Figma design

// Re-export VoiceAgentTier from context for convenience
export type { VoiceAgentTier } from '@/context/SubscriptionContext'

export type CallStatus =
  | 'nueva'
  | 'pendiente'
  | 'en_curso'
  | 'resuelta'
  | 'urgente'

export type CallIntent =
  | 'pedir_cita_higiene'
  | 'consulta_financiacion'
  | 'urgencia_dolor'
  | 'cancelar_cita'
  | 'confirmar_cita'
  | 'consulta_general'

export type Sentiment =
  | 'aliviado'
  | 'nervioso'
  | 'enfadado'
  | 'contento'
  | 'preocupado'

export interface CallRecord {
  id: string
  externalCallId?: string | null
  status: CallStatus
  time: string
  startedAt?: string | null
  patient: string | null // null = "Pendiente de asignar"
  phone: string
  intent: CallIntent
  duration: string // Format: "MM:SS"
  summary: string
  transcript?: string | null
  recordingUrl?: string | null
  sentiment: Sentiment
  appointmentId?: string // ID de la cita vinculada en la agenda (si se creó)
}

export interface VoiceAgentKPI {
  label: string
  value: string | number
  changePercent: string
  changeDirection: 'up' | 'down'
  comparisonValue: string | number
  comparisonLabel: string
}

export interface CallDistribution {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export interface CallVolumeDataPoint {
  day: string
  volumeTotal: number
  citasPropuestas: number
  citasAceptadas: number
  urgentes: number
}

export interface VoiceAgentAnalyticsResponse {
  weekStart: string
  distribution: {
    advanced: CallDistribution[]
    basic: CallDistribution[]
  }
  volume: CallVolumeDataPoint[]
}

export type CallFilter = 'todos' | 'pendientes' | 'urgentes'

/**
 * Time threshold (in hours) for auto-transitioning calls from 'nueva' to 'pendiente'
 * in basic voice agent mode
 */
export const AUTO_PENDING_HOURS = 2

// Mapping for display labels
export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  nueva: 'Nueva',
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  resuelta: 'Resuelta',
  urgente: 'Urgente'
}

export const CALL_INTENT_LABELS: Record<CallIntent, string> = {
  pedir_cita_higiene: 'Pedir cita higiene',
  consulta_financiacion: 'Consulta financiación',
  urgencia_dolor: 'Urgencia dolor',
  cancelar_cita: 'Cancelar cita',
  confirmar_cita: 'Confirmar cita',
  consulta_general: 'Consulta general'
}

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  aliviado: 'Aliviado',
  nervioso: 'Nervioso',
  enfadado: 'Enfadado',
  contento: 'Contento',
  preocupado: 'Preocupado'
}

// Helper: Intents that imply the caller wants to create/schedule an appointment
// Used to determine if "Crear cita" button should be shown
export const APPOINTMENT_CREATING_INTENTS: CallIntent[] = [
  'pedir_cita_higiene', // Requesting hygiene appointment
  'urgencia_dolor', // Emergency - needs an appointment
  'consulta_general' // General consultation - may need appointment
]

// Helper function to check if intent is for creating an appointment
export function isAppointmentIntent(intent: CallIntent): boolean {
  return APPOINTMENT_CREATING_INTENTS.includes(intent)
}
