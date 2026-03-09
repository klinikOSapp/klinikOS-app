'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import type { VisitStatus, VisitStatusLog } from '@/components/agenda/types'
import { useClinic } from '@/context/ClinicContext'
import { calculateFinalDurations } from '@/hooks/useWaitTimer'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Re-exportar tipos de visita para uso en otros componentes
export type { VisitStatus, VisitStatusLog }

// ============================================
// TIPOS PARA NOTAS SOAP POR VISITA
// ============================================

export type VisitSOAPNotes = {
  subjective?: string // Síntomas reportados por el paciente
  objective?: string // Hallazgos clínicos del doctor
  assessment?: string // Diagnóstico/evaluación
  plan?: string // Plan de tratamiento
  isDraft?: boolean // True si las notas están en borrador
  updatedAt?: string // Fecha última modificación
  updatedBy?: string // Doctor que actualizó
  finalizedAt?: string // Fecha de finalización (inmutabilidad)
  finalizedBy?: string // Doctor que finalizó las notas
}

// ============================================
// TIPOS PARA ARCHIVOS ADJUNTOS DE VISITA
// ============================================

export type VisitAttachment = {
  id: string
  name: string
  type: 'image' | 'document' | 'xray'
  url: string
  uploadedAt: string
  uploadedBy: string
}

// ============================================
// TIPOS PARA TRATAMIENTOS VINCULADOS
// ============================================

export type LinkedTreatmentStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type ToothFace =
  | 'mesial'
  | 'distal'
  | 'oclusal'
  | 'vestibular'
  | 'lingual'
  | 'palatino'

export type LinkedTreatment = {
  id: string
  treatmentCode?: string // Código del catálogo (CZ, LDE, etc.)
  description: string
  amount: string
  pieceNumber?: number // Pieza dental (11-48)
  toothFace?: ToothFace // Cara del diente
  status: LinkedTreatmentStatus
  completedAt?: string // Fecha de realización
  completedBy?: string // Doctor que lo realizó
  notes?: string // Notas del tratamiento
  fromBudgetId?: string // ID del presupuesto origen (si aplica)
}

// ============================================
// TIPOS UNIFICADOS PARA PAGOS
// ============================================

export type PaymentInfo = {
  totalAmount: number // Monto total del tratamiento
  paidAmount: number // Ya pagado
  pendingAmount: number // Pendiente
  currency: string // "€"
}

export type InstallmentPlan = {
  totalInstallments: number // Total de cuotas
  currentInstallment: number // Cuota actual a pagar
  amountPerInstallment: number // Monto por cuota
}

export type PaymentRecord = {
  id: string
  appointmentId: string
  patientId: string
  patientName: string
  treatment: string
  amount: number
  currency: string
  paymentMethod: string
  paymentDate: Date
  reference?: string
  createdAt: Date
}

// ============================================
// TIPOS PARA BLOQUEOS DE AGENDA
// ============================================

export type BlockType =
  | 'cleaning' // Limpieza
  | 'repair' // Reparación
  | 'break' // Descanso
  | 'meeting' // Reunión
  | 'maintenance' // Mantenimiento
  | 'other' // Otro

export const BLOCK_TYPE_CONFIG: Record<
  BlockType,
  { label: string; icon: string }
> = {
  cleaning: { label: 'Limpieza', icon: 'CleaningServicesRounded' },
  repair: { label: 'Reparación', icon: 'BuildRounded' },
  break: { label: 'Descanso', icon: 'FreeBreakfastRounded' },
  meeting: { label: 'Reunión', icon: 'GroupsRounded' },
  maintenance: { label: 'Mantenimiento', icon: 'EngineeringRounded' },
  other: { label: 'Bloqueo agenda', icon: 'BlockRounded' }
}

export type RecurrencePattern = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
  daysOfWeek?: number[] // 0=domingo, 1=lunes, etc.
  interval?: number // cada X días/semanas/meses
  endDate?: string // fecha fin de recurrencia (formato ISO)
}

export type AgendaBlock = {
  id: string
  date: string // formato ISO: "2026-01-08"
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  blockType: BlockType
  description: string // ej: "Limpiar gabinete", "Descanso"
  responsibleId?: string // doctor/higienista asignado (opcional)
  responsibleName?: string
  box?: string // "box 1", "box 2", etc.
  recurrence?: RecurrencePattern
  parentBlockId?: string // para bloques generados por recurrencia
  patientId?: string
  patientName?: string
  sourcePublicRef?: string
}

// ============================================
// TIPOS UNIFICADOS PARA CITAS
// ============================================

export type AppointmentStatus =
  | 'Confirmada'
  | 'No confirmada'
  | 'Reagendar'
  | 'Pendiente IA'

// ============================================
// TIPOS PARA CITAS CREADAS POR AGENTE DE VOZ
// ============================================

export type VoiceAgentSentiment =
  | 'aliviado'
  | 'nervioso'
  | 'enfadado'
  | 'contento'
  | 'preocupado'

export type VoiceAgentCallIntent =
  | 'pedir_cita_higiene'
  | 'consulta_financiacion'
  | 'urgencia_dolor'
  | 'cancelar_cita'
  | 'confirmar_cita'
  | 'consulta_general'

export type VoiceAgentData = {
  callSummary: string // Resumen de la llamada
  patientSentiment: VoiceAgentSentiment // Sentimiento detectado
  callDuration: string // Duración de la llamada (MM:SS)
  callIntent: VoiceAgentCallIntent // Intención detectada
  transcriptionAvailable: boolean // Si hay transcripción disponible
}

export type Appointment = {
  id: string
  // Fecha y hora
  date: string // formato ISO: "2026-01-08"
  startTime: string // formato "HH:MM" ej: "09:00"
  endTime: string // formato "HH:MM" ej: "09:30"
  // Información del paciente
  patientName: string
  patientPhone: string
  patientId?: string // ID único del paciente
  patientAge?: number // Edad del paciente
  // Información de la cita
  professional: string
  professionalId?: string
  serviceId?: number | null
  invoiceId?: string
  invoiceNumber?: string
  reason: string // motivo de consulta
  status: AppointmentStatus
  // Para vista de día (box)
  box?: string // "box 1", "box 2", "box 3"
  boxId?: string // DB UUID of the box (preferred for insert; avoids label-lookup fragility)
  // Información adicional
  charge: 'Si' | 'No' // ¿hay algo a cobrar?
  tags?: Array<'deuda' | 'confirmada'>
  // Color para el calendario
  bgColor?: string
  // Notas adicionales
  notes?: string
  // Información de pagos parciales
  paymentInfo?: PaymentInfo
  installmentPlan?: InstallmentPlan
  // Estado de la cita
  completed?: boolean // Si la cita ya se realizó
  confirmed?: boolean // Si el paciente confirmó que asistirá (independiente del estado de visita)
  // Estado de visita del paciente (flujo en consulta)
  visitStatus?: VisitStatus // Estado actual (default: 'scheduled')
  visitStatusHistory?: VisitStatusLog[] // Historial de cambios con timestamps
  // Tratamientos vinculados a esta cita (estructura extendida)
  linkedTreatments?: LinkedTreatment[]
  // Timer durations (in milliseconds) - recorded when appointment is completed
  waitingDuration?: number // Time spent in waiting room
  consultationDuration?: number // Time spent in consultation
  // Notas SOAP por visita
  soapNotes?: VisitSOAPNotes
  // Archivos adjuntos de la visita
  attachments?: VisitAttachment[]
  // Estado del odontograma en esa visita (snapshot)
  odontogramSnapshot?: string
  // Campos para citas creadas por el agente de voz
  createdByVoiceAgent?: boolean // Marca que fue creada por IA
  voiceAgentCallId?: string // ID de la llamada vinculada
  voiceAgentData?: VoiceAgentData // Datos de la llamada
  sourceHoldId?: string
  sourceHoldPublicRef?: string
}


// ============================================
// Mock bootstrap data removed.
// Provider hydration is Supabase-first and starts from empty local state.
// ============================================

type DbCalendarAppointmentRow = {
  id: number
  scheduled_start_time: string
  scheduled_end_time: string
  status: string
  notes: string | null
  box_name: string | null
  patient_id: string
  patient_name: string | null
  patient_phone: string | null
  service_name: string | null
  service_id?: number | null
  staff_assigned: Array<{ staff_id?: string; full_name?: string }> | null
  clinical_notes: Array<{
    note_type?: string
    content?: string
    content_json?: Record<string, unknown> | unknown[]
  }> | null
}

type DbInvoiceDebtRow = {
  id: number
  patient_id: string
  invoice_number?: string | null
  issue_timestamp?: string | null
  total_amount: number | string | null
  amount_paid: number | string | null
}

type DbAppointmentHoldRow = {
  id: number
  start_time: string
  end_time: string
  box_id: string | null
  status: string
  summary_text: string | null
  summary_json: Record<string, unknown> | null
  patient_id?: string | null
  patient_name?: string | null
  public_ref?: string | null
}

type DbClinicalAttachmentRow = {
  id: number
  appointment_id: number | null
  file_name: string
  file_type: string | null
  storage_path: string
  created_at: string
  staff_id: string
}

const AGENDA_TIMEZONE = 'Europe/Madrid'

const normalizeBoxLookupKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const parseShortOffsetToMinutes = (value: string): number => {
  const normalized = value.replace('UTC', 'GMT')
  const match = normalized.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] || '0')
  const minutes = Number(match[3] || '0')
  return sign * (hours * 60 + minutes)
}

const getTimezoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset'
  })
  const tzName =
    formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')
      ?.value || 'GMT+0'
  return parseShortOffsetToMinutes(tzName)
}

const parseDbDateValue = (dateValue: string | Date): Date => {
  if (dateValue instanceof Date) return dateValue
  const raw = String(dateValue || '').trim()
  if (!raw) return new Date(NaN)

  let normalized = raw
  // Normalize Postgres style timestamps: "2026-02-11 08:00:00+00"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(normalized)) {
    normalized = normalized.replace(' ', 'T')
  }
  // Normalize timezone offset "+00" -> "+00:00"
  normalized = normalized.replace(/([+-]\d{2})$/, '$1:00')

  const parsed = new Date(normalized)
  if (!Number.isNaN(parsed.getTime())) return parsed
  return new Date(raw)
}

const formatDateInTimezone = (
  dateValue: string | Date,
  timeZone: string
): string => {
  const date = parseDbDateValue(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

const formatTimeInTimezone = (
  dateValue: string | Date,
  timeZone: string
): string => {
  const date = parseDbDateValue(dateValue)
  if (Number.isNaN(date.getTime())) return '09:00'
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  return formatter.format(date)
}

const zonedDateTimeToUtcIso = (
  date: string,
  time: string,
  timeZone: string
): string => {
  const [yearRaw, monthRaw, dayRaw] = date.split('-')
  const [hourRaw, minuteRaw] = time.split(':')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return new Date(`${date}T${time.length === 5 ? time : '09:00'}:00`).toISOString()
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0)
  const offsetFirst = getTimezoneOffsetMinutes(new Date(utcGuess), timeZone)
  let utcMillis = utcGuess - offsetFirst * 60_000
  const offsetSecond = getTimezoneOffsetMinutes(new Date(utcMillis), timeZone)
  if (offsetSecond !== offsetFirst) {
    utcMillis = utcGuess - offsetSecond * 60_000
  }
  return new Date(utcMillis).toISOString()
}

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function toIsoDate(dateValue: string | Date): string {
  return formatDateInTimezone(dateValue, AGENDA_TIMEZONE)
}

function toTimeHHMM(dateValue: string | Date): string {
  return formatTimeInTimezone(dateValue, AGENDA_TIMEZONE)
}

function buildLocalIso(date: string, time: string): string {
  const hhmm = time.length === 5 ? time : '09:00'
  return zonedDateTimeToUtcIso(date, hhmm, AGENDA_TIMEZONE)
}

function mapDbAppointmentStatusToUi(
  status: string
): { status: AppointmentStatus; confirmed: boolean; completed: boolean } {
  switch (status) {
    case 'confirmed':
      return { status: 'Confirmada', confirmed: true, completed: false }
    case 'completed':
      return { status: 'Confirmada', confirmed: true, completed: true }
    case 'not_accepted':
      return { status: 'Pendiente IA', confirmed: false, completed: false }
    case 'cancelled':
      return { status: 'Reagendar', confirmed: false, completed: false }
    case 'checked_in':
    case 'in_progress':
      return { status: 'Confirmada', confirmed: true, completed: false }
    case 'no_show':
      return { status: 'No confirmada', confirmed: false, completed: false }
    case 'scheduled':
    default:
      return { status: 'No confirmada', confirmed: false, completed: false }
  }
}

function mapUiStatusToDb(status: AppointmentStatus): string {
  switch (status) {
    case 'Confirmada':
      return 'confirmed'
    case 'Reagendar':
      return 'cancelled'
    case 'Pendiente IA':
      return 'not_accepted'
    case 'No confirmada':
    default:
      return 'scheduled'
  }
}

function mapDbToVisitStatus(status: string): VisitStatus {
  switch (status) {
    case 'checked_in':
      return 'waiting_room'
    case 'in_progress':
      return 'in_consultation'
    case 'completed':
      return 'completed'
    case 'confirmed':
    case 'scheduled':
    case 'not_accepted':
    case 'cancelled':
    case 'no_show':
    default:
      return 'scheduled'
  }
}

function mapVisitStatusToDb(status: VisitStatus): string {
  switch (status) {
    case 'waiting_room':
      return 'checked_in'
    case 'call_patient':
      return 'checked_in'
    case 'in_consultation':
      return 'in_progress'
    case 'completed':
      return 'completed'
    case 'scheduled':
    default:
      return 'scheduled'
  }
}

// ============================================
// CONTEXTO
// ============================================

type RegisterPaymentData = {
  appointmentId: string
  patientId: string
  patientName: string
  treatment: string
  amount: number
  paymentMethod: string
  paymentDate: Date
  reference?: string
}

type AppointmentsContextType = {
  appointments: Appointment[]
  payments: PaymentRecord[]
  blocks: AgendaBlock[]
  // Funciones CRUD de citas
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  // Funciones de consulta de citas
  getAppointmentsByDate: (date: string) => Appointment[]
  getAppointmentsByDateRange: (
    startDate: string,
    endDate: string
  ) => Appointment[]
  getAppointmentById: (id: string) => Appointment | undefined
  // Funciones de pagos
  registerPayment: (data: RegisterPaymentData) => void
  getPaymentsByAppointment: (appointmentId: string) => PaymentRecord[]
  getPaymentsByDateRange: (startDate: Date, endDate: Date) => PaymentRecord[]
  getPaymentsByPatient: (patientName: string) => PaymentRecord[]
  getTotalPaymentsForDate: (date: Date) => number
  // Funciones de estado de cita
  toggleAppointmentComplete: (id: string, completed: boolean) => void
  toggleAppointmentConfirmed: (id: string, confirmed: boolean) => void
  // Funciones de estado de visita
  updateVisitStatus: (appointmentId: string, newStatus: VisitStatus) => void
  getVisitStatusCounts: (date: string) => Record<VisitStatus, number>
  // Funciones CRUD de bloqueos
  addBlock: (block: Omit<AgendaBlock, 'id'>) => string
  updateBlock: (id: string, updates: Partial<AgendaBlock>) => void
  deleteBlock: (id: string, deleteRecurrence?: boolean) => void
  // Funciones de consulta de bloqueos
  getBlocksByDate: (date: string) => AgendaBlock[]
  getBlocksByDateRange: (startDate: string, endDate: string) => AgendaBlock[]
  getBlockById: (id: string) => AgendaBlock | undefined
  // Validación de conflictos
  isTimeSlotBlocked: (
    date: string,
    startTime: string,
    endTime: string,
    box?: string
  ) => boolean
  // Funciones para historial clínico
  getAppointmentsByPatient: (
    patientId?: string,
    patientName?: string
  ) => Appointment[]
  updateSOAPNotes: (appointmentId: string, notes: VisitSOAPNotes) => void
  updateLinkedTreatmentStatus: (
    appointmentId: string,
    treatmentId: string,
    status: LinkedTreatmentStatus,
    completedBy?: string
  ) => void
  addAttachment: (
    appointmentId: string,
    attachment: Omit<VisitAttachment, 'id'>,
    options?: { persistToDb?: boolean }
  ) => void
  removeAttachment: (appointmentId: string, attachmentId: string) => void
  loadAttachments: (appointmentId: string) => Promise<void>
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(
  undefined
)

// ============================================
// PROVIDER
// ============================================

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [blocks, setBlocks] = useState<AgendaBlock[]>([])
  const clinicIdRef = useRef<string | null>(null)
  const staffIdRef = useRef<string | null>(null)
  const boxIdByLabelRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let isMounted = true

    async function hydrateFromDb() {
      try {
        if (!isClinicInitialized) return

        const supabase = createSupabaseBrowserClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session || !activeClinicId) {
          if (isMounted) {
            setAppointments([])
            setPayments([])
            setBlocks([])
          }
          return
        }

        staffIdRef.current = session.user.id
        const clinicId = activeClinicId
        clinicIdRef.current = clinicId

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 365)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 365)

        const dateFrom = startDate.toISOString().slice(0, 10)
        const dateTo = endDate.toISOString().slice(0, 10)

        // Fetch calendar appointments with pagination to bypass PostgREST max-rows (1000)
        async function fetchAllCalendarRows() {
          const PAGE_SIZE = 1000
          const allRows: DbCalendarAppointmentRow[] = []
          let offset = 0
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { data, error } = await supabase
              .rpc('get_appointments_calendar', {
                p_clinic_id: clinicId,
                p_start_date: dateFrom,
                p_end_date: dateTo,
                p_staff_id: null,
                p_box_id: null
              })
              .range(offset, offset + PAGE_SIZE - 1)
            if (error) {
              console.error('Error fetching calendar page:', error)
              break
            }
            const rows = (data || []) as DbCalendarAppointmentRow[]
            allRows.push(...rows)
            if (rows.length < PAGE_SIZE) break
            offset += PAGE_SIZE
          }
          return allRows
        }

        const [
          calendarRows,
          { data: boxRows },
          { data: holdRows },
          { data: paymentRows },
          { data: debtInvoiceRows }
        ] =
          await Promise.all([
            fetchAllCalendarRows(),
            supabase
              .from('boxes')
              .select('id, name_or_number')
              .eq('clinic_id', clinicId),
            supabase
              .from('appointment_holds')
              .select(
                'id, start_time, end_time, box_id, status, summary_text, summary_json, patient_id, public_ref'
              )
              .eq('clinic_id', clinicId)
              .neq('status', 'cancelled')
              .order('start_time', { ascending: true }),
            supabase
              .from('payments')
              .select('id, invoice_id, amount, payment_method, transaction_date, notes')
              .eq('clinic_id', clinicId)
              .order('transaction_date', { ascending: false })
              .limit(500),
            supabase
              .from('invoices')
              .select(
                'id, patient_id, invoice_number, issue_timestamp, total_amount, amount_paid'
              )
              .eq('clinic_id', clinicId)
              .in('status', ['open', 'overdue'])
              .order('issue_timestamp', { ascending: false })
          ])

        const roundCurrency = (value: number): number =>
          Number(value.toFixed(2))

        const patientDebtMap = new Map<
          string,
          { totalAmount: number; paidAmount: number; pendingAmount: number }
        >()
        const invoiceMetaByPatient = new Map<
          string,
          { invoiceId: string; invoiceNumber?: string }
        >()
        for (const row of (debtInvoiceRows || []) as DbInvoiceDebtRow[]) {
          const patientId = String(row.patient_id || '').trim()
          if (!patientId) continue
          const totalAmount = Number(row.total_amount || 0)
          const paidAmount = Number(row.amount_paid || 0)
          const pendingAmount = Math.max(0, totalAmount - paidAmount)
          if (pendingAmount <= 0) continue

          const previous = patientDebtMap.get(patientId) || {
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0
          }
          patientDebtMap.set(patientId, {
            totalAmount: previous.totalAmount + totalAmount,
            paidAmount: previous.paidAmount + paidAmount,
            pendingAmount: previous.pendingAmount + pendingAmount
          })

          if (!invoiceMetaByPatient.has(patientId)) {
            invoiceMetaByPatient.set(patientId, {
              invoiceId: String(row.id),
              invoiceNumber: row.invoice_number || undefined
            })
          }

        }

        const boxMapById = new Map<string, string>()
        const boxMapByLabel = new Map<string, string>()
        for (const row of boxRows || []) {
          const id = String(row.id)
          const label = String(row.name_or_number || 'Box').trim()
          boxMapById.set(id, label)
          boxMapByLabel.set(label.toLowerCase(), id)
          boxMapByLabel.set(label.replace(/\s+/g, '').toLowerCase(), id)
          boxMapByLabel.set(normalizeBoxLookupKey(label), id)
        }
        boxIdByLabelRef.current = Object.fromEntries(boxMapByLabel.entries())

        // Attachments are loaded lazily per-appointment via loadAttachments()
        // to avoid a bulk .in() query that breaks PostgREST URL limits for large clinics.

        const mappedAppointments: Appointment[] = (
          (calendarRows || []) as DbCalendarAppointmentRow[]
        ).map((row) => {
          const startIso = row.scheduled_start_time
          const endIso = row.scheduled_end_time
          const statusInfo = mapDbAppointmentStatusToUi(row.status)
          const firstStaff = Array.isArray(row.staff_assigned)
            ? row.staff_assigned[0]
            : undefined
          const reason = row.service_name || 'Consulta'

          let soapNotes: VisitSOAPNotes | undefined
          let linkedTreatments: LinkedTreatment[] | undefined
          const notesRows = Array.isArray(row.clinical_notes)
            ? row.clinical_notes
            : []

          for (const noteRow of notesRows) {
            if (noteRow.note_type === 'soap') {
              const contentJson =
                noteRow.content_json && typeof noteRow.content_json === 'object'
                  ? (noteRow.content_json as VisitSOAPNotes)
                  : undefined
              soapNotes =
                contentJson ||
                ({
                  subjective: noteRow.content || ''
                } as VisitSOAPNotes)
            }
            if (
              noteRow.note_type === 'linked_treatments' &&
              Array.isArray(noteRow.content_json)
            ) {
              linkedTreatments = (noteRow.content_json as unknown[]).map(
                (item, index) => {
                  const rowData = (item || {}) as Record<string, unknown>
                  return {
                    id: String(rowData.id || `lt-${row.id}-${index}`),
                    treatmentCode:
                      typeof rowData.treatmentCode === 'string'
                        ? rowData.treatmentCode
                        : undefined,
                    description: String(rowData.description || 'Tratamiento'),
                    amount: String(rowData.amount || '0'),
                    status:
                      (rowData.status as LinkedTreatmentStatus) || 'pending',
                    notes:
                      typeof rowData.notes === 'string'
                        ? rowData.notes
                        : undefined
                  }
                }
              )
            }
          }

          const patientDebt =
            row.patient_id ? patientDebtMap.get(row.patient_id) : undefined
          const paymentInfo = patientDebt
            ? {
                totalAmount: roundCurrency(patientDebt.totalAmount),
                paidAmount: roundCurrency(patientDebt.paidAmount),
                pendingAmount: roundCurrency(patientDebt.pendingAmount),
                currency: '€'
              }
            : undefined
          const invoiceMeta =
            row.patient_id ? invoiceMetaByPatient.get(row.patient_id) : undefined

          return {
            id: String(row.id),
            date: toIsoDate(startIso),
            startTime: toTimeHHMM(startIso),
            endTime: toTimeHHMM(endIso),
            patientName: row.patient_name || 'Paciente',
            patientPhone: row.patient_phone || '',
            patientId: row.patient_id,
            professional: firstStaff?.full_name || 'Profesional',
            professionalId: firstStaff?.staff_id || undefined,
            serviceId: row.service_id ?? null,
            invoiceId: invoiceMeta?.invoiceId,
            invoiceNumber: invoiceMeta?.invoiceNumber,
            reason,
            status: statusInfo.status,
            box: row.box_name || undefined,
            charge:
              paymentInfo && paymentInfo.pendingAmount > 0 ? 'Si' : 'No',
            notes: row.notes || undefined,
            completed: statusInfo.completed,
            confirmed: statusInfo.confirmed,
            visitStatus: mapDbToVisitStatus(row.status),
            paymentInfo,
            linkedTreatments,
            soapNotes,
            attachments: []
          }
        })

        const invoiceIds = Array.from(
          new Set(
            ((paymentRows || []) as Array<{ invoice_id: number | null }>)
              .map((row) => row.invoice_id)
              .filter((id): id is number => typeof id === 'number')
          )
        )

        const { data: invoiceRows } =
          invoiceIds.length > 0
            ? await supabase
                .from('invoices')
                .select('id, patient_id')
                .in('id', invoiceIds)
            : { data: [] as Array<{ id: number; patient_id: string }> }

        const patientIds = Array.from(
          new Set((invoiceRows || []).map((row) => row.patient_id))
        )

        const { data: patientRows } =
          patientIds.length > 0
            ? await supabase
                .from('patients')
                .select('id, first_name, last_name')
                .in('id', patientIds)
            : {
                data: [] as Array<{
                  id: string
                  first_name: string | null
                  last_name: string | null
                }>
              }

        const invoicePatientMap = new Map<number, string>()
        for (const row of invoiceRows || []) {
          invoicePatientMap.set(row.id, row.patient_id)
        }

        const patientNameMap = new Map<string, string>()
        for (const row of patientRows || []) {
          patientNameMap.set(
            row.id,
            `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Paciente'
          )
        }

        const mappedPayments: PaymentRecord[] = (
          paymentRows || []
        ).map((row) => {
          const patientId =
            row.invoice_id != null
              ? invoicePatientMap.get(row.invoice_id) || ''
              : ''
          return {
            id: String(row.id),
            appointmentId: '',
            patientId,
            patientName: patientNameMap.get(patientId) || 'Paciente',
            treatment: row.notes || 'Pago',
            amount: Number(row.amount || 0),
            currency: '€',
            paymentMethod: row.payment_method || 'efectivo',
            paymentDate: new Date(row.transaction_date),
            createdAt: new Date(row.transaction_date)
          }
        })

        const mappedBlocks: AgendaBlock[] = ((holdRows || []) as DbAppointmentHoldRow[])
          .filter((row) => row.status !== 'cancelled')
          .map((row) => {
            const summary = (row.summary_json || {}) as Record<string, unknown>
            const start = new Date(row.start_time)
            const end = new Date(row.end_time)
            const blockType = String(summary.block_type || 'other') as BlockType
            const summaryBox =
              typeof summary.box === 'string'
                ? summary.box
                : typeof summary.box_name === 'string'
                ? summary.box_name
                : undefined
            const fallbackBox = boxRows?.[0]?.name_or_number || undefined
            const resolvedBox =
              (row.box_id ? boxMapById.get(row.box_id) : undefined) ||
              summaryBox ||
              fallbackBox
            return {
              id: String(row.id),
              date: toIsoDate(start),
              startTime: toTimeHHMM(start),
              endTime: toTimeHHMM(end),
              blockType: BLOCK_TYPE_CONFIG[blockType] ? blockType : 'other',
              description:
                row.summary_text || String(summary.description || 'Bloqueo agenda'),
              responsibleName:
                typeof summary.responsible_name === 'string'
                  ? summary.responsible_name
                  : undefined,
              box: resolvedBox,
              recurrence:
                summary.recurrence && typeof summary.recurrence === 'object'
                  ? (summary.recurrence as RecurrencePattern)
                  : undefined,
              parentBlockId:
                typeof summary.parent_block_id === 'string'
                  ? summary.parent_block_id
                  : undefined,
              patientId:
                row.patient_id ||
                (typeof summary.patient_id === 'string'
                  ? summary.patient_id
                  : undefined),
              patientName:
                row.patient_name ||
                (typeof summary.patient_name === 'string'
                  ? summary.patient_name
                  : undefined),
              sourcePublicRef:
                row.public_ref ||
                (typeof summary.public_ref === 'string'
                  ? summary.public_ref
                  : undefined)
            }
          })

        if (process.env.NODE_ENV !== 'production') {
          const sampleBlock = mappedBlocks[0]
          console.debug('[Agenda][Hydrate] holds', {
            count: mappedBlocks.length,
            sample: sampleBlock
              ? {
                  id: sampleBlock.id,
                  date: sampleBlock.date,
                  startTime: sampleBlock.startTime,
                  endTime: sampleBlock.endTime,
                  box: sampleBlock.box
                }
              : null
          })
        }

        if (isMounted) {
          setAppointments(mappedAppointments)
          setPayments(mappedPayments)
          setBlocks(mappedBlocks)
        }
      } catch (error) {
        console.error('AppointmentsContext DB hydration FAILED:', error)
        if (isMounted) {
          setAppointments([])
          setPayments([])
          setBlocks([])
        }
      }
    }

    void hydrateFromDb()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized])

  const persistAppointmentNote = useCallback(
    async (
      appointmentId: string,
      patientId: string | undefined,
      noteType: string,
      content: string,
      contentJson?: Record<string, unknown> | unknown[]
    ): Promise<boolean> => {
      const numericAppointmentId = Number(appointmentId)
      const staffId = staffIdRef.current
      if (!patientId || !staffId || Number.isNaN(numericAppointmentId)) return false

      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase
          .from('appointment_notes')
          .upsert(
            {
              appointment_id: numericAppointmentId,
              patient_id: patientId,
              staff_id: staffId,
              note_type: noteType,
              content,
              content_json: contentJson ?? null
            },
            { onConflict: 'appointment_id,note_type' }
          )

        if (error) {
          console.warn(`No se pudo persistir nota ${noteType} en DB`, error)
          return false
        }
        return true
      } catch (error) {
        console.warn(`Error persistiendo nota ${noteType} en DB`, error)
        return false
      }
    },
    []
  )

  const ensureInvoiceAndInsertPayment = useCallback(
    async (data: RegisterPaymentData): Promise<string | null> => {
      const clinicId = clinicIdRef.current
      const staffId = staffIdRef.current
      if (!clinicId || !staffId || !data.patientId) return null

      try {
        const supabase = createSupabaseBrowserClient()
        const { data: invoiceNumberData } = await supabase.rpc(
          'get_next_invoice_number',
          {
            p_clinic_id: clinicId,
            p_series_id: null
          }
        )

        const payload = (invoiceNumberData || {}) as Record<string, unknown>
        const invoiceNumber =
          typeof payload.invoice_number === 'string'
            ? payload.invoice_number
            : `TMP-${Date.now()}`
        const seriesId =
          typeof payload.series_id === 'number' ? payload.series_id : null

        const { data: invoiceRow, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            patient_id: data.patientId,
            clinic_id: clinicId,
            invoice_number: invoiceNumber,
            total_amount: data.amount,
            amount_paid: data.amount,
            status: 'open',
            issue_timestamp: data.paymentDate.toISOString(),
            series_id: seriesId
          })
          .select('id')
          .single()

        if (invoiceError || !invoiceRow) {
          console.warn('No se pudo crear invoice para pago', invoiceError)
          return null
        }

        const { error: paymentError } = await supabase.from('payments').insert({
          invoice_id: invoiceRow.id,
          clinic_id: clinicId,
          staff_id: staffId,
          payment_method: data.paymentMethod,
          amount: data.amount,
          transaction_date: data.paymentDate.toISOString(),
          transaction_id: data.reference || null,
          notes: data.treatment
        })

        if (paymentError) {
          console.warn('No se pudo persistir payment en DB', paymentError)
        }

        return String(invoiceRow.id)
      } catch (error) {
        console.warn('Error persistiendo payment/invoice en DB', error)
        return null
      }
    },
    []
  )

  // Agregar una nueva cita
  const addAppointment = useCallback(
    (appointmentData: Omit<Appointment, 'id'>) => {
      const tempId = `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newAppointment: Appointment = {
        ...appointmentData,
        id: tempId
      }
      setAppointments((prev) => [...prev, newAppointment])

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId || !appointmentData.patientId) return

        try {
          const supabase = createSupabaseBrowserClient()
          const boxLabel = (appointmentData.box || '').trim().toLowerCase()
          const normalizedBoxLabel = boxLabel.replace(/\s+/g, '')
          const lookupBoxLabel = normalizeBoxLookupKey(appointmentData.box || '')
          // Prefer direct UUID from caller (avoids label-lookup fragility)
          const boxId =
            appointmentData.boxId ||
            boxIdByLabelRef.current[boxLabel] ||
            boxIdByLabelRef.current[normalizedBoxLabel] ||
            boxIdByLabelRef.current[lookupBoxLabel] ||
            null
          let resolvedServiceId =
            appointmentData.serviceId != null &&
            Number.isFinite(Number(appointmentData.serviceId))
              ? Number(appointmentData.serviceId)
              : null

          if (!resolvedServiceId && appointmentData.sourceHoldId) {
            const sourceHoldNumericId = Number(appointmentData.sourceHoldId)
            if (Number.isFinite(sourceHoldNumericId)) {
              const { data: sourceHoldRow, error: sourceHoldError } =
                await supabase
                  .from('appointment_holds')
                  .select('suggested_service_id')
                  .eq('id', sourceHoldNumericId)
                  .eq('clinic_id', clinicId)
                  .maybeSingle()

              if (sourceHoldError) {
                console.warn(
                  'No se pudo obtener suggested_service_id desde appointment_holds',
                  sourceHoldError
                )
              } else if (
                sourceHoldRow?.suggested_service_id != null &&
                Number.isFinite(Number(sourceHoldRow.suggested_service_id))
              ) {
                resolvedServiceId = Number(sourceHoldRow.suggested_service_id)
              }
            }
          }

          if (!resolvedServiceId && appointmentData.reason?.trim()) {
            const firstReason = appointmentData.reason
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)[0]

            if (firstReason) {
              const { data: exactServiceMatch, error: exactServiceError } =
                await supabase
                  .from('service_catalog')
                  .select('id')
                  .ilike('name', firstReason)
                  .limit(1)
                  .maybeSingle()

              if (exactServiceError) {
                console.warn(
                  'No se pudo resolver service_id exacto por nombre',
                  exactServiceError
                )
              } else if (
                exactServiceMatch?.id != null &&
                Number.isFinite(Number(exactServiceMatch.id))
              ) {
                resolvedServiceId = Number(exactServiceMatch.id)
              }

              if (!resolvedServiceId) {
                const { data: partialServiceMatch, error: partialServiceError } =
                  await supabase
                    .from('service_catalog')
                    .select('id')
                    .ilike('name', `%${firstReason}%`)
                    .limit(1)
                    .maybeSingle()

                if (partialServiceError) {
                  console.warn(
                    'No se pudo resolver service_id parcial por nombre',
                    partialServiceError
                  )
                } else if (
                  partialServiceMatch?.id != null &&
                  Number.isFinite(Number(partialServiceMatch.id))
                ) {
                  resolvedServiceId = Number(partialServiceMatch.id)
                }
              }
            }
          }

          const { data: inserted, error } = await supabase
            .from('appointments')
            .insert({
              clinic_id: clinicId,
              patient_id: appointmentData.patientId,
              box_id: boxId,
              status: mapUiStatusToDb(appointmentData.status),
              scheduled_start_time: buildLocalIso(
                appointmentData.date,
                appointmentData.startTime
              ),
              scheduled_end_time: buildLocalIso(
                appointmentData.date,
                appointmentData.endTime
              ),
              notes: appointmentData.notes || null,
              source: appointmentData.createdByVoiceAgent ? 'call' : 'manual',
              service_id: resolvedServiceId,
              service_type: appointmentData.reason,
              source_hold_id:
                appointmentData.sourceHoldId &&
                Number.isFinite(Number(appointmentData.sourceHoldId))
                  ? Number(appointmentData.sourceHoldId)
                  : null
            })
            .select('id')
            .single()

          if (error || !inserted) {
            console.warn('No se pudo crear cita en DB', error)
            return
          }

          const persistedId = String(inserted.id)
          setAppointments((prev) =>
            prev.map((apt) =>
              apt.id === tempId
                ? {
                    ...apt,
                    id: persistedId
                  }
                : apt
            )
          )

          if (appointmentData.professionalId) {
            const assignmentPayload = [
              {
                staff_id: appointmentData.professionalId,
                role: null as string | null,
                role_in_appointment: null as string | null
              }
            ]

            const hasPersistedAssignment = async (): Promise<boolean> => {
              try {
                const { data: existingAssignment, error: verifyError } = await supabase
                  .from('appointment_staff')
                  .select('staff_id')
                  .eq('appointment_id', Number(inserted.id))
                  .eq('staff_id', appointmentData.professionalId as string)
                  .maybeSingle()

                if (verifyError) {
                  console.warn(
                    'No se pudo verificar assignment en appointment_staff',
                    verifyError
                  )
                  return false
                }

                return Boolean(existingAssignment?.staff_id)
              } catch (verifyCatchError) {
                console.warn(
                  'Error verificando assignment en appointment_staff',
                  verifyCatchError
                )
                return false
              }
            }

            let staffPersisted = false
            try {
              await supabase.rpc('assign_staff_to_appointment', {
                appointment_id: Number(inserted.id),
                assignments: assignmentPayload
              })
              staffPersisted = await hasPersistedAssignment()
            } catch (staffRpcError) {
              console.warn('No se pudo asignar staff con RPC', staffRpcError)
            }

            if (!staffPersisted) {
              console.warn(
                'assign_staff_to_appointment terminó sin persistir assignment',
                {
                  appointmentId: Number(inserted.id),
                  professionalId: appointmentData.professionalId
                }
              )
            }
          }

          if (appointmentData.linkedTreatments?.length) {
            await persistAppointmentNote(
              persistedId,
              appointmentData.patientId,
              'linked_treatments',
              'Linked treatments',
              appointmentData.linkedTreatments as unknown as unknown[]
            )
          }
        } catch (error) {
          console.warn('Error creando cita en DB', error)
        }
      })()
    },
    [persistAppointmentNote]
  )

  // Actualizar una cita existente
  const updateAppointment = useCallback(
    (id: string, updates: Partial<Appointment>) => {
      const currentAppointment = appointments.find((apt) => apt.id === id)
      setAppointments((prev) => {
        const updatedAppointments = prev.map((apt) => {
          if (apt.id !== id) return apt

          const updatedApt = { ...apt, ...updates }

          // Sync with Voice Agent: Dispatch event if this appointment
          // was created by the voice agent and status changed
          if (
            apt.voiceAgentCallId &&
            updates.status &&
            apt.status !== updates.status
          ) {
            // Dispatch custom event for voice agent to listen
            const event = new CustomEvent('appointment:status-change', {
              detail: {
                appointmentId: apt.id,
                voiceAgentCallId: apt.voiceAgentCallId,
                oldStatus: apt.status,
                newStatus: updates.status,
                appointment: updatedApt
              }
            })
            window.dispatchEvent(event)
            console.log(
              `📡 Voice Agent Sync: Appointment ${apt.id} status changed from ${apt.status} to ${updates.status}`
            )
          }

          // Sync with Voice Agent: Dispatch event if visit status changed
          if (
            apt.voiceAgentCallId &&
            updates.visitStatus &&
            apt.visitStatus !== updates.visitStatus
          ) {
            const event = new CustomEvent('appointment:visit-status-change', {
              detail: {
                appointmentId: apt.id,
                voiceAgentCallId: apt.voiceAgentCallId,
                oldVisitStatus: apt.visitStatus,
                newVisitStatus: updates.visitStatus,
                appointment: updatedApt
              }
            })
            window.dispatchEvent(event)
            console.log(
              `📡 Voice Agent Sync: Appointment ${apt.id} visit status changed to ${updates.visitStatus}`
            )
          }

          return updatedApt
        })

        return updatedAppointments
      })

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId) return

        const numericId = Number(id)
        if (Number.isNaN(numericId)) return

        try {
          const supabase = createSupabaseBrowserClient()
          const dbUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
          }

          if (updates.status !== undefined) {
            dbUpdates.status = mapUiStatusToDb(updates.status)
          }
          if (updates.notes !== undefined) {
            dbUpdates.notes = updates.notes || null
          }

          const nextDate = updates.date ?? currentAppointment?.date
          const nextStart = updates.startTime ?? currentAppointment?.startTime
          const nextEnd = updates.endTime ?? currentAppointment?.endTime

          if (nextDate && nextStart) {
            dbUpdates.scheduled_start_time = buildLocalIso(nextDate, nextStart)
          }
          if (nextDate && nextEnd) {
            dbUpdates.scheduled_end_time = buildLocalIso(nextDate, nextEnd)
          }
          if (updates.reason !== undefined) {
            dbUpdates.service_type = updates.reason
          }
          if (updates.box !== undefined) {
            const boxLabel = updates.box.trim().toLowerCase()
            const normalized = boxLabel.replace(/\s+/g, '')
            const lookupBoxLabel = normalizeBoxLookupKey(updates.box)
            dbUpdates.box_id =
              boxIdByLabelRef.current[boxLabel] ||
              boxIdByLabelRef.current[normalized] ||
              boxIdByLabelRef.current[lookupBoxLabel] ||
              null
          }

          const shouldTryPostFallback = (error: unknown): boolean => {
            const errorText = JSON.stringify(error || {}).toLowerCase()
            return (
              errorText.includes('failed to fetch') ||
              errorText.includes('cors') ||
              errorText.includes('method patch is not allowed')
            )
          }

          let updateError: unknown = null

          try {
            const { error } = await supabase
              .from('appointments')
              .update(dbUpdates)
              .eq('id', numericId)
              .eq('clinic_id', clinicId)

            if (error) {
              updateError = error
            }
          } catch (error) {
            updateError = error
          }

          if (
            updateError &&
            shouldTryPostFallback(updateError) &&
            currentAppointment?.patientId
          ) {
            const fallbackStartIso =
              (dbUpdates.scheduled_start_time as string | undefined) ||
              (currentAppointment.date && currentAppointment.startTime
                ? buildLocalIso(currentAppointment.date, currentAppointment.startTime)
                : undefined)
            const fallbackEndIso =
              (dbUpdates.scheduled_end_time as string | undefined) ||
              (currentAppointment.date && currentAppointment.endTime
                ? buildLocalIso(currentAppointment.date, currentAppointment.endTime)
                : undefined)

            if (fallbackStartIso && fallbackEndIso) {
              const fallbackPayload: Record<string, unknown> = {
                id: numericId,
                clinic_id: clinicId,
                patient_id: currentAppointment.patientId,
                status:
                  (dbUpdates.status as string | undefined) ||
                  mapUiStatusToDb(currentAppointment.status),
                scheduled_start_time: fallbackStartIso,
                scheduled_end_time: fallbackEndIso,
                updated_at:
                  (dbUpdates.updated_at as string | undefined) ||
                  new Date().toISOString()
              }

              if ('notes' in dbUpdates) {
                fallbackPayload.notes = dbUpdates.notes ?? null
              }
              if ('service_type' in dbUpdates) {
                fallbackPayload.service_type = dbUpdates.service_type
              }
              if ('box_id' in dbUpdates) {
                fallbackPayload.box_id = dbUpdates.box_id
              }

              const { error: fallbackError } = await supabase
                .from('appointments')
                .upsert(fallbackPayload, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                })

              if (!fallbackError) {
                updateError = null
              } else {
                updateError = fallbackError
              }
            }
          }

          if (updateError) {
            console.warn('No se pudo actualizar cita en DB', updateError)
            if (currentAppointment) {
              setAppointments((prev) =>
                prev.map((apt) => (apt.id === id ? currentAppointment : apt))
              )
            }
            return
          }

          const notePatientId = updates.patientId ?? currentAppointment?.patientId

          if (updates.soapNotes) {
            await persistAppointmentNote(
              id,
              notePatientId,
              'soap',
              'SOAP note',
              updates.soapNotes as unknown as Record<string, unknown>
            )
          }

          if (updates.linkedTreatments) {
            await persistAppointmentNote(
              id,
              notePatientId,
              'linked_treatments',
              'Linked treatments',
              updates.linkedTreatments as unknown as unknown[]
            )
          }
        } catch (error) {
          console.warn('Error actualizando cita en DB', error)
        }
      })()
    },
    [appointments, persistAppointmentNote]
  )

  // Eliminar una cita
  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== id))
    void (async () => {
      const clinicId = clinicIdRef.current
      if (!clinicId) return
      const numericId = Number(id)
      if (Number.isNaN(numericId)) return

      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase
          .from('appointments')
          .delete()
          .eq('id', numericId)
          .eq('clinic_id', clinicId)
        if (error) {
          console.warn('No se pudo eliminar cita en DB', error)
        }
      } catch (error) {
        console.warn('Error eliminando cita en DB', error)
      }
    })()
  }, [])

  // Obtener citas por fecha
  const getAppointmentsByDate = useCallback(
    (date: string) => {
      return appointments.filter((apt) => apt.date === date)
    },
    [appointments]
  )

  // Obtener citas por rango de fechas
  const getAppointmentsByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      return appointments.filter(
        (apt) => apt.date >= startDate && apt.date <= endDate
      )
    },
    [appointments]
  )

  // Obtener una cita por ID
  const getAppointmentById = useCallback(
    (id: string) => {
      return appointments.find((apt) => apt.id === id)
    },
    [appointments]
  )

  // ============================================
  // FUNCIONES DE PAGOS
  // ============================================

  // Registrar un pago y actualizar la cita correspondiente
  const registerPayment = useCallback((data: RegisterPaymentData) => {
    // Crear el registro de pago
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.patientName,
      treatment: data.treatment,
      amount: data.amount,
      currency: '€',
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      reference: data.reference,
      createdAt: new Date()
    }

    // Añadir al historial de pagos
    setPayments((prev) => [...prev, paymentRecord])

    // Actualizar la cita con el nuevo estado de pago
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === data.appointmentId) {
          const currentPaymentInfo = apt.paymentInfo
          const totalAmount = currentPaymentInfo?.totalAmount ?? 0
          const previouslyPaid = currentPaymentInfo?.paidAmount ?? 0
          const newPaidAmount = previouslyPaid + data.amount
          const newPendingAmount = Math.max(0, totalAmount - newPaidAmount)
          const isFullyPaid = newPendingAmount === 0

          // Actualizar installmentPlan si existe
          const newInstallmentPlan =
            apt.installmentPlan && !isFullyPaid
              ? {
                  ...apt.installmentPlan,
                  currentInstallment: apt.installmentPlan.currentInstallment + 1
                }
              : apt.installmentPlan

          return {
            ...apt,
            charge: isFullyPaid ? 'No' : 'Si',
            paymentInfo: {
              totalAmount,
              paidAmount: newPaidAmount,
              pendingAmount: newPendingAmount,
              currency: '€'
            },
            installmentPlan: newInstallmentPlan
          }
        }
        return apt
      })
    )

    console.log('✅ Pago registrado en contexto:', paymentRecord)
    void ensureInvoiceAndInsertPayment(data)
  }, [ensureInvoiceAndInsertPayment])

  // Obtener pagos por cita
  const getPaymentsByAppointment = useCallback(
    (appointmentId: string) => {
      return payments.filter((p) => p.appointmentId === appointmentId)
    },
    [payments]
  )

  // Obtener pagos por rango de fechas
  const getPaymentsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return payments.filter((p) => {
        const paymentDate = new Date(p.paymentDate)
        return paymentDate >= startDate && paymentDate <= endDate
      })
    },
    [payments]
  )

  // Obtener pagos por paciente
  const getPaymentsByPatient = useCallback(
    (patientName: string) => {
      return payments.filter((p) =>
        p.patientName.toLowerCase().includes(patientName.toLowerCase())
      )
    },
    [payments]
  )

  // Obtener total de pagos para una fecha
  const getTotalPaymentsForDate = useCallback(
    (date: Date) => {
      const dateStr = formatDateToISO(date)
      return payments
        .filter((p) => formatDateToISO(new Date(p.paymentDate)) === dateStr)
        .reduce((sum, p) => sum + p.amount, 0)
    },
    [payments]
  )

  // Marcar cita como completada/pendiente
  const toggleAppointmentComplete = useCallback(
    (id: string, completed: boolean) => {
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, completed } : apt))
      )

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId) return
        const numericId = Number(id)
        if (Number.isNaN(numericId)) return

        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase
            .from('appointments')
            .update({
              status: completed ? 'completed' : 'scheduled',
              updated_at: new Date().toISOString()
            })
            .eq('id', numericId)
            .eq('clinic_id', clinicId)
          if (error) {
            console.warn('No se pudo actualizar completed en DB', error)
          }
        } catch (error) {
          console.warn('Error actualizando completed en DB', error)
        }
      })()
    },
    []
  )

  // Marcar cita como confirmada/no confirmada
  const toggleAppointmentConfirmed = useCallback(
    (id: string, confirmed: boolean) => {
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, confirmed } : apt))
      )
      console.log(`✅ Cita ${id} ${confirmed ? 'confirmada' : 'desconfirmada'}`)

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId) return
        const numericId = Number(id)
        if (Number.isNaN(numericId)) return

        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase
            .from('appointments')
            .update({
              status: confirmed ? 'confirmed' : 'scheduled',
              updated_at: new Date().toISOString()
            })
            .eq('id', numericId)
            .eq('clinic_id', clinicId)
          if (error) {
            console.warn('No se pudo actualizar confirmed en DB', error)
          }
        } catch (error) {
          console.warn('Error actualizando confirmed en DB', error)
        }
      })()
    },
    []
  )

  // ============================================
  // FUNCIONES DE ESTADO DE VISITA
  // ============================================

  // Actualizar estado de visita del paciente (con timestamp automático)
  const updateVisitStatus = useCallback(
    (appointmentId: string, newStatus: VisitStatus) => {
      setAppointments((prev) =>
        prev.map((apt) => {
          if (apt.id === appointmentId) {
            const now = new Date()
            const newLog: VisitStatusLog = {
              status: newStatus,
              timestamp: now
            }
            const updatedHistory = [...(apt.visitStatusHistory || []), newLog]

            // Si el estado es 'completed', también marcar completed como true
            // y calcular las duraciones finales
            const isCompleted = newStatus === 'completed'

            // Calculate final durations when completing the appointment
            let waitingDuration = apt.waitingDuration
            let consultationDuration = apt.consultationDuration

            if (isCompleted) {
              const durations = calculateFinalDurations(updatedHistory)
              waitingDuration = durations.waitingDuration ?? undefined
              consultationDuration = durations.consultationDuration ?? undefined

              console.log(
                `⏱️ Duraciones finales registradas: Espera=${
                  waitingDuration
                    ? Math.round(waitingDuration / 60000) + 'min'
                    : 'N/A'
                }, Consulta=${
                  consultationDuration
                    ? Math.round(consultationDuration / 60000) + 'min'
                    : 'N/A'
                }`
              )
            }

            console.log(
              `✅ Estado de visita actualizado: ${
                apt.patientName
              } → ${newStatus} (${now.toLocaleTimeString('es-ES')})`
            )

            return {
              ...apt,
              visitStatus: newStatus,
              visitStatusHistory: updatedHistory,
              completed: isCompleted ? true : apt.completed,
              waitingDuration,
              consultationDuration
            }
          }
          return apt
        })
      )

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId) return
        const numericId = Number(appointmentId)
        if (Number.isNaN(numericId)) return

        try {
          const supabase = createSupabaseBrowserClient()
          const dbStatus = mapVisitStatusToDb(newStatus)
          const { error } = await supabase
            .from('appointments')
            .update({
              status: dbStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', numericId)
            .eq('clinic_id', clinicId)
          if (error) {
            console.warn('No se pudo persistir visitStatus en DB', error)
          }
        } catch (error) {
          console.warn('Error persistiendo visitStatus en DB', error)
        }
      })()
    },
    []
  )

  // Obtener conteo de citas por estado de visita para una fecha
  const getVisitStatusCounts = useCallback(
    (date: string): Record<VisitStatus, number> => {
      const appointmentsForDate = appointments.filter(
        (apt) => apt.date === date
      )

      const counts: Record<VisitStatus, number> = {
        scheduled: 0,
        waiting_room: 0,
        call_patient: 0,
        in_consultation: 0,
        completed: 0
      }

      appointmentsForDate.forEach((apt) => {
        const status = apt.visitStatus || 'scheduled'
        counts[status]++
      })

      return counts
    },
    [appointments]
  )

  // ============================================
  // FUNCIONES DE BLOQUEOS DE AGENDA
  // ============================================

  // Agregar un nuevo bloqueo
  const addBlock = useCallback((blockData: Omit<AgendaBlock, 'id'>): string => {
    const newId = `block-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`
    const newBlock: AgendaBlock = {
      ...blockData,
      id: newId
    }
    const generatedBlocks =
      blockData.recurrence && blockData.recurrence.type !== 'none'
        ? generateRecurringBlocks(newBlock)
        : []
    const allBlocks = [newBlock, ...generatedBlocks]

    setBlocks((prev) => [...prev, ...allBlocks])

    console.log('✅ Bloqueo creado:', newBlock)

    void (async () => {
      const clinicId = clinicIdRef.current
      if (!clinicId) return

      try {
        const supabase = createSupabaseBrowserClient()
        for (const block of allBlocks) {
          const boxLabel = (block.box || '').trim().toLowerCase()
          const normalizedBoxLabel = boxLabel.replace(/\s+/g, '')
          const lookupBoxLabel = normalizeBoxLookupKey(block.box || '')
          const boxId =
            boxIdByLabelRef.current[boxLabel] ||
            boxIdByLabelRef.current[normalizedBoxLabel] ||
            boxIdByLabelRef.current[lookupBoxLabel] ||
            null

          const { data: inserted, error } = await supabase
            .from('appointment_holds')
            .insert({
              clinic_id: clinicId,
              box_id: boxId,
              start_time: buildLocalIso(block.date, block.startTime),
              end_time: buildLocalIso(block.date, block.endTime),
              status: 'held',
              hold_expires_at: buildLocalIso(block.date, block.endTime),
              notes: block.description || null,
              summary_text: block.description || null,
              summary_json: {
                kind: 'ui_block',
                block_type: block.blockType,
                description: block.description,
                responsible_name: block.responsibleName || null,
                recurrence: block.recurrence || null,
                parent_block_id: block.parentBlockId || null
              }
            })
            .select('id')
            .single()

          if (error || !inserted) {
            console.warn('No se pudo persistir bloqueo en DB', error)
            continue
          }

          setBlocks((prev) =>
            prev.map((item) =>
              item.id === block.id ? { ...item, id: String(inserted.id) } : item
            )
          )
        }
      } catch (error) {
        console.warn('Error creando bloqueo en DB', error)
      }
    })()

    return newId
  }, [])

  // Actualizar un bloqueo existente
  const updateBlock = useCallback(
    (id: string, updates: Partial<AgendaBlock>) => {
      const currentBlock = blocks.find((block) => block.id === id)
      setBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== id) return block
          return { ...block, ...updates }
        })
      )
      console.log(`✅ Bloqueo ${id} actualizado`)

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId || !currentBlock) return

        const numericId = Number(id)
        if (Number.isNaN(numericId)) return

        try {
          const supabase = createSupabaseBrowserClient()
          const mergedBlock = { ...currentBlock, ...updates }
          const boxLabel = (mergedBlock.box || '').trim().toLowerCase()
          const normalizedBoxLabel = boxLabel.replace(/\s+/g, '')
          const lookupBoxLabel = normalizeBoxLookupKey(mergedBlock.box || '')
          const boxId =
            boxIdByLabelRef.current[boxLabel] ||
            boxIdByLabelRef.current[normalizedBoxLabel] ||
            boxIdByLabelRef.current[lookupBoxLabel] ||
            null

          const { error } = await supabase
            .from('appointment_holds')
            .update({
              box_id: boxId,
              start_time: buildLocalIso(mergedBlock.date, mergedBlock.startTime),
              end_time: buildLocalIso(mergedBlock.date, mergedBlock.endTime),
              hold_expires_at: buildLocalIso(
                mergedBlock.date,
                mergedBlock.endTime
              ),
              summary_text: mergedBlock.description || null,
              notes: mergedBlock.description || null,
              summary_json: {
                kind: 'ui_block',
                block_type: mergedBlock.blockType,
                description: mergedBlock.description,
                responsible_name: mergedBlock.responsibleName || null,
                recurrence: mergedBlock.recurrence || null,
                parent_block_id: mergedBlock.parentBlockId || null
              }
            })
            .eq('id', numericId)
            .eq('clinic_id', clinicId)

          if (error) {
            console.warn('No se pudo actualizar bloqueo en DB', error)
          }
        } catch (error) {
          console.warn('Error actualizando bloqueo en DB', error)
        }
      })()
    },
    [blocks]
  )

  // Eliminar un bloqueo (opcionalmente eliminar toda la recurrencia)
  const deleteBlock = useCallback(
    (id: string, deleteRecurrence: boolean = false) => {
      let idsToCancel: string[] = []
      setBlocks((prev) => {
        const blockToDelete = prev.find((b) => b.id === id)
        if (!blockToDelete) return prev

        if (deleteRecurrence && blockToDelete.parentBlockId) {
          // Eliminar todos los bloques con el mismo parentBlockId
          idsToCancel = prev
            .filter(
              (b) =>
                b.id === id ||
                b.parentBlockId === blockToDelete.parentBlockId ||
                b.id === blockToDelete.parentBlockId
            )
            .map((b) => b.id)
          return prev.filter(
            (b) =>
              b.id !== id &&
              b.parentBlockId !== blockToDelete.parentBlockId &&
              b.id !== blockToDelete.parentBlockId
          )
        } else if (deleteRecurrence && !blockToDelete.parentBlockId) {
          // Este es el bloque padre, eliminar todos los hijos
          idsToCancel = prev
            .filter((b) => b.id === id || b.parentBlockId === id)
            .map((b) => b.id)
          return prev.filter((b) => b.id !== id && b.parentBlockId !== id)
        }

        // Solo eliminar este bloqueo
        idsToCancel = [id]
        return prev.filter((b) => b.id !== id)
      })
      console.log(
        `✅ Bloqueo ${id} eliminado${
          deleteRecurrence ? ' (con recurrencia)' : ''
        }`
      )

      void (async () => {
        const clinicId = clinicIdRef.current
        if (!clinicId || idsToCancel.length === 0) return

        const numericIds = idsToCancel
          .map((value) => Number(value))
          .filter((value) => !Number.isNaN(value))
        if (numericIds.length === 0) return

        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase
            .from('appointment_holds')
            .update({ status: 'cancelled' })
            .eq('clinic_id', clinicId)
            .in('id', numericIds)
          if (error) {
            console.warn('No se pudo cancelar bloqueo en DB', error)
          }
        } catch (error) {
          console.warn('Error cancelando bloqueo en DB', error)
        }
      })()
    },
    []
  )

  // Obtener bloqueos por fecha
  const getBlocksByDate = useCallback(
    (date: string): AgendaBlock[] => {
      return blocks.filter((block) => block.date === date)
    },
    [blocks]
  )

  // Obtener bloqueos por rango de fechas
  const getBlocksByDateRange = useCallback(
    (startDate: string, endDate: string): AgendaBlock[] => {
      return blocks.filter(
        (block) => block.date >= startDate && block.date <= endDate
      )
    },
    [blocks]
  )

  // Obtener un bloqueo por ID
  const getBlockById = useCallback(
    (id: string): AgendaBlock | undefined => {
      return blocks.find((block) => block.id === id)
    },
    [blocks]
  )

  // Verificar si un horario está bloqueado
  const isTimeSlotBlocked = useCallback(
    (
      date: string,
      startTime: string,
      endTime: string,
      box?: string
    ): boolean => {
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)

      return blocks.some((block) => {
        // Debe ser la misma fecha
        if (block.date !== date) return false

        // Si se especifica box, debe coincidir (o el bloqueo no tiene box = bloquea todo)
        if (box && block.box && block.box !== box) return false

        // Verificar solapamiento de horarios
        const blockStart = timeToMinutes(block.startTime)
        const blockEnd = timeToMinutes(block.endTime)

        // Hay solapamiento si: start < blockEnd AND end > blockStart
        return startMinutes < blockEnd && endMinutes > blockStart
      })
    },
    [blocks]
  )

  // ============================================
  // FUNCIONES PARA HISTORIAL CLÍNICO
  // ============================================

  // Obtener citas por paciente (por ID o por nombre)
  const getAppointmentsByPatient = useCallback(
    (patientId?: string, patientName?: string): Appointment[] => {
      return appointments.filter((apt) => {
        if (patientId && apt.patientId === patientId) return true
        if (
          patientName &&
          apt.patientName.toLowerCase() === patientName.toLowerCase()
        )
          return true
        return false
      })
    },
    [appointments]
  )

  // Actualizar notas SOAP de una cita
  const updateSOAPNotes = useCallback(
    (appointmentId: string, notes: VisitSOAPNotes) => {
      let patientId: string | undefined
      setAppointments((prev) => {
        return prev.map((apt) => {
          if (apt.id !== appointmentId) return apt
          patientId = apt.patientId
          return {
            ...apt,
            soapNotes: {
              ...apt.soapNotes,
              ...notes,
              updatedAt: new Date().toISOString()
            }
          }
        })
      })

      void (async () => {
        const ok = await persistAppointmentNote(
          appointmentId,
          patientId,
          'soap',
          'SOAP note',
          notes as unknown as Record<string, unknown>
        )
        if (!ok) {
          console.error(
            `❌ Notas SOAP de cita ${appointmentId} no se guardaron en DB. ` +
              'Los cambios son visibles localmente pero se perderán al recargar.'
          )
        }
      })()
    },
    [persistAppointmentNote]
  )

  // Actualizar estado de un tratamiento vinculado
  const updateLinkedTreatmentStatus = useCallback(
    (
      appointmentId: string,
      treatmentId: string,
      status: LinkedTreatmentStatus,
      completedBy?: string
    ) => {
      let patientId: string | undefined
      let nextTreatments: LinkedTreatment[] | undefined
      setAppointments((prev) =>
        prev.map((apt) => {
          if (apt.id !== appointmentId) return apt

          const updatedTreatments = apt.linkedTreatments?.map((t) =>
            t.id === treatmentId
              ? {
                  ...t,
                  status,
                  completedAt:
                    status === 'completed'
                      ? new Date().toISOString()
                      : t.completedAt,
                  completedBy:
                    status === 'completed' ? completedBy : t.completedBy
                }
              : t
          )

          patientId = apt.patientId
          nextTreatments = updatedTreatments
          return { ...apt, linkedTreatments: updatedTreatments }
        })
      )
      console.log(
        `✅ Estado de tratamiento ${treatmentId} actualizado a ${status}`
      )

      if (nextTreatments) {
        void persistAppointmentNote(
          appointmentId,
          patientId,
          'linked_treatments',
          'Linked treatments',
          nextTreatments as unknown as unknown[]
        )
      }
    },
    [persistAppointmentNote]
  )

  // Añadir archivo adjunto a una cita
  const addAttachment = useCallback(
    (
      appointmentId: string,
      attachment: Omit<VisitAttachment, 'id'>,
      options?: { persistToDb?: boolean }
    ) => {
      const shouldPersist = options?.persistToDb !== false
      let patientId: string | undefined
      const newAttachment: VisitAttachment = {
        ...attachment,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      setAppointments((prev) => {
        return prev.map((apt) => {
          if (apt.id !== appointmentId) return apt
          patientId = apt.patientId
          return {
            ...apt,
            attachments: [...(apt.attachments || []), newAttachment]
          }
        })
      })
      console.log(`✅ Archivo adjunto añadido a cita ${appointmentId}`)

      if (!shouldPersist) return

      void (async () => {
        const staffId = staffIdRef.current
        const numericAppointmentId = Number(appointmentId)
        if (!patientId || !staffId || Number.isNaN(numericAppointmentId)) return

        try {
          const supabase = createSupabaseBrowserClient()
          const fileType =
            attachment.type === 'image'
              ? 'image/jpeg'
              : attachment.type === 'xray'
              ? 'image/xray'
              : 'application/octet-stream'

          const { data: inserted, error } = await supabase
            .from('clinical_attachments')
            .insert({
              patient_id: patientId,
              appointment_id: numericAppointmentId,
              staff_id: staffId,
              file_name: attachment.name,
              file_type: fileType,
              storage_path: attachment.url
            })
            .select('id')
            .single()

          if (error || !inserted) {
            console.warn('No se pudo persistir attachment en DB', error)
            return
          }

          setAppointments((prev) =>
            prev.map((apt) =>
              apt.id === appointmentId
                ? {
                    ...apt,
                    attachments: (apt.attachments || []).map((item) =>
                      item.id === newAttachment.id
                        ? { ...item, id: String(inserted.id) }
                        : item
                    )
                  }
                : apt
            )
          )
        } catch (error) {
          console.warn('Error persistiendo attachment en DB', error)
        }
      })()
    },
    []
  )

  // Eliminar archivo adjunto de una cita
  const removeAttachment = useCallback(
    (appointmentId: string, attachmentId: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                attachments: apt.attachments?.filter(
                  (a) => a.id !== attachmentId
                )
              }
            : apt
        )
      )
      console.log(
        `✅ Archivo adjunto ${attachmentId} eliminado de cita ${appointmentId}`
      )

      void (async () => {
        const numericAttachmentId = Number(attachmentId)
        if (Number.isNaN(numericAttachmentId)) return
        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase
            .from('clinical_attachments')
            .delete()
            .eq('id', numericAttachmentId)
          if (error) {
            console.warn('No se pudo eliminar attachment en DB', error)
          }
        } catch (error) {
          console.warn('Error eliminando attachment en DB', error)
        }
      })()
    },
    []
  )

  const loadAttachments = useCallback(
    async (appointmentId: string) => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('clinical_attachments')
          .select(
            'id, appointment_id, file_name, file_type, storage_path, created_at, staff_id'
          )
          .eq('appointment_id', appointmentId)
        if (error) {
          console.warn('Error loading attachments for appointment', appointmentId, error)
          return
        }
        const attachments: VisitAttachment[] = ((data || []) as DbClinicalAttachmentRow[]).map(
          (row) => ({
            id: String(row.id),
            name: row.file_name,
            type: (row.file_type?.startsWith('image/')
              ? 'image'
              : row.file_type?.includes('xray')
              ? 'xray'
              : 'document') as VisitAttachment['type'],
            url: row.storage_path,
            uploadedAt: row.created_at,
            uploadedBy: row.staff_id
          })
        )
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId ? { ...apt, attachments } : apt
          )
        )
      } catch (err) {
        console.warn('Error loading attachments', err)
      }
    },
    []
  )

  const value: AppointmentsContextType = {
    appointments,
    payments,
    blocks,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    getAppointmentsByDateRange,
    getAppointmentById,
    registerPayment,
    getPaymentsByAppointment,
    getPaymentsByDateRange,
    getPaymentsByPatient,
    getTotalPaymentsForDate,
    toggleAppointmentComplete,
    toggleAppointmentConfirmed,
    updateVisitStatus,
    getVisitStatusCounts,
    // Block functions
    addBlock,
    updateBlock,
    deleteBlock,
    getBlocksByDate,
    getBlocksByDateRange,
    getBlockById,
    isTimeSlotBlocked,
    // Clinical history functions
    getAppointmentsByPatient,
    updateSOAPNotes,
    updateLinkedTreatmentStatus,
    addAttachment,
    removeAttachment,
    loadAttachments
  }

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  )
}

// ============================================
// HOOK PARA USAR EL CONTEXTO
// ============================================

export function useAppointments() {
  const context = useContext(AppointmentsContext)
  if (context === undefined) {
    throw new Error(
      'useAppointments must be used within an AppointmentsProvider'
    )
  }
  return context
}

// ============================================
// HELPERS DE FORMATO
// ============================================

// Convertir tiempo HH:MM a minutos desde medianoche
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Generar bloques recurrentes basados en el patrón de recurrencia
function generateRecurringBlocks(parentBlock: AgendaBlock): AgendaBlock[] {
  const { recurrence, date } = parentBlock
  if (!recurrence || recurrence.type === 'none') return []

  const generatedBlocks: AgendaBlock[] = []
  const startDate = new Date(date + 'T00:00:00')
  const endDate = recurrence.endDate
    ? new Date(recurrence.endDate + 'T00:00:00')
    : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 días por defecto

  const interval = recurrence.interval || 1
  const currentDate = new Date(startDate)

  // Avanzar desde la fecha inicial según el tipo de recurrencia
  while (currentDate <= endDate) {
    // Avanzar a la siguiente fecha según el tipo
    switch (recurrence.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval)
        break
      case 'custom':
        // Para custom, usamos daysOfWeek
        if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
          currentDate.setDate(currentDate.getDate() + 1)
          // Buscar el siguiente día que coincida
          let attempts = 0
          while (
            !recurrence.daysOfWeek.includes(currentDate.getDay()) &&
            attempts < 7
          ) {
            currentDate.setDate(currentDate.getDate() + 1)
            attempts++
          }
        } else {
          currentDate.setDate(currentDate.getDate() + 1)
        }
        break
    }

    // Si excede la fecha fin, salir
    if (currentDate > endDate) break

    // Crear el bloque recurrente
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const newDate = `${year}-${month}-${day}`

    const newBlock: AgendaBlock = {
      ...parentBlock,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: newDate,
      parentBlockId: parentBlock.id
    }

    generatedBlocks.push(newBlock)
  }

  return generatedBlocks
}

// Formatear fecha ISO a formato "7 Ene"
export function formatDateToShort(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' })
  const monthCapitalized =
    month.charAt(0).toUpperCase() + month.slice(1).replace('.', '')
  return `${day} ${monthCapitalized}`
}

// Formatear fecha a ISO desde Date
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
