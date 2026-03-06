'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ============================================
// TIPOS PARA PACIENTES (Preparados para DB)
// ============================================

// Estado general del paciente en la clínica
export type PatientStatus = 'Activo' | 'Inactivo' | 'Alta'

// Estado de tratamientos individuales
export type TreatmentStatus = 'Pendiente' | 'En curso' | 'Completado' | 'Cancelado'

// Estado de pago de tratamientos
export type TreatmentPaymentStatus = 'Sin pagar' | 'Parcial' | 'Pagado'

// Tags para filtrado rápido
export type PatientTag = 'deuda' | 'activo' | 'recall' | 'vip' | 'nuevo'

// Género del paciente
export type PatientGender = 'Masculino' | 'Femenino' | 'Otro' | 'No especificado'

// Tipo de documento de identidad
export type DocumentType = 'DNI' | 'NIE' | 'Pasaporte' | 'Otro'

// ============================================
// INFORMACIÓN MÉDICA
// ============================================

// Severidad de alergias
export type AllergySeverity = 'leve' | 'moderada' | 'grave' | 'extrema'

// Tipo de alergia con severidad
export type Allergy = {
  id: string
  name: string
  severity: AllergySeverity
  notes?: string
  createdAt?: string
}

export type MedicalHistory = {
  allergies: Allergy[] // Alergias con severidad
  medications: string[] // Medicamentos actuales
  conditions: string[] // Condiciones médicas (diabetes, hipertensión, etc.)
  notes?: string // Notas adicionales
  lastUpdated?: string // Fecha última actualización (ISO)
}

// Helper para convertir severidad a color
export function getAllergySeverityColor(severity: AllergySeverity): string {
  switch (severity) {
    case 'leve':
      return 'var(--color-warning-200)'
    case 'moderada':
      return 'var(--color-warning-400)'
    case 'grave':
      return 'var(--color-error-400)'
    case 'extrema':
      return 'var(--color-error-600)'
    default:
      return 'var(--color-neutral-400)'
  }
}

// Helper para obtener texto de severidad
export function getAllergySeverityLabel(severity: AllergySeverity): string {
  switch (severity) {
    case 'leve':
      return 'Leve'
    case 'moderada':
      return 'Moderada'
    case 'grave':
      return 'Grave'
    case 'extrema':
      return 'Extrema'
    default:
      return severity
  }
}

// ============================================
// INFORMACIÓN FINANCIERA DEL PACIENTE
// ============================================

export type PatientFinance = {
  totalDebt: number // Deuda total pendiente
  hasFinancing: boolean // ¿Tiene plan de financiación?
  financingDetails?: {
    totalAmount: number // Monto total financiado
    paidAmount: number // Ya pagado
    remainingInstallments: number // Cuotas restantes
    monthlyAmount: number // Cuota mensual
    startDate: string // Inicio financiación (ISO)
    endDate: string // Fin financiación (ISO)
  }
  currency: string // Moneda (€)
}

// ============================================
// TRATAMIENTOS DEL PACIENTE
// ============================================

export type PatientTreatment = {
  id: string
  code: string // Código/acrónimo del tratamiento (ej: "LDE", "EMP", "END")
  description: string
  tooth?: string // Diente afectado (ej: "36", "11-21")
  toothFace?: string // Cara del diente (ej: "Vestibular")
  scheduledDate?: string // Fecha programada (ISO)
  completedDate?: string // Fecha realización (ISO)
  amount: number // Precio en céntimos o como número
  amountFormatted?: string // Precio formateado (ej: "72 €") — computed from amount, not required as input
  status: TreatmentStatus
  paymentStatus: TreatmentPaymentStatus
  paidAmount: number // Cantidad ya pagada
  professional?: string // Profesional asignado (opcional hasta que se agenda la cita)
  professionalId?: string // ID del profesional
  budgetId?: string // ID del presupuesto asociado
  notes?: string // Notas del tratamiento
  createdAt: string // Fecha creación (ISO)
  updatedAt?: string // Fecha última actualización (ISO)
  markedForNextAppointment?: boolean // Marcado para incluir en próxima cita
  appointmentId?: string // ID de la cita en la que se realizó el tratamiento
}

// ============================================
// CONSENTIMIENTOS
// ============================================

export type ConsentStatus = 'Pendiente' | 'Firmado' | 'Rechazado' | 'Caducado'

export type PatientConsent = {
  id: string
  type: string // Tipo de consentimiento (ej: "Tratamiento general", "Ortodoncia", "Cirugía")
  status: ConsentStatus
  signedDate?: string // Fecha firma (ISO)
  expiryDate?: string // Fecha caducidad (ISO)
  documentUrl?: string // URL del documento firmado
}

// ============================================
// HU-024: ALERTAS PERSONALIZADAS DEL PACIENTE
// ============================================

export type PatientAlertType = 
  | 'medical'      // Alertas médicas (alergias severas, condiciones)
  | 'financial'    // Alertas financieras (deuda, pagos pendientes)
  | 'administrative' // Alertas administrativas (documentos pendientes)
  | 'recall'       // Alertas de recall/seguimiento
  | 'custom'       // Alertas personalizadas

export type PatientAlertPriority = 'low' | 'medium' | 'high' | 'critical'

export type PatientAlert = {
  id: string
  type: PatientAlertType
  priority: PatientAlertPriority
  title: string
  message: string
  isActive: boolean
  showOnOpen: boolean          // Mostrar al abrir ficha del paciente
  showInAppointment: boolean   // Mostrar al crear/gestionar cita
  createdAt: string            // ISO date
  createdBy?: string           // Usuario que creó la alerta
  expiresAt?: string           // Fecha expiración (opcional)
  dismissedAt?: string         // Si fue descartada temporalmente
  dismissedBy?: string         // Usuario que descartó
}

// Helper para obtener color de prioridad de alerta
export function getAlertPriorityColor(priority: PatientAlertPriority): string {
  switch (priority) {
    case 'low':
      return 'var(--color-info-400)'
    case 'medium':
      return 'var(--color-warning-400)'
    case 'high':
      return 'var(--color-error-400)'
    case 'critical':
      return 'var(--color-error-600)'
    default:
      return 'var(--color-neutral-400)'
  }
}

// Helper para obtener icono de tipo de alerta
export function getAlertTypeIcon(type: PatientAlertType): string {
  switch (type) {
    case 'medical':
      return 'LocalHospitalRounded'
    case 'financial':
      return 'PaymentsRounded'
    case 'administrative':
      return 'DescriptionRounded'
    case 'recall':
      return 'NotificationsRounded'
    case 'custom':
      return 'InfoRounded'
    default:
      return 'WarningRounded'
  }
}

// Helper para obtener label de tipo de alerta
export function getAlertTypeLabel(type: PatientAlertType): string {
  switch (type) {
    case 'medical':
      return 'Médica'
    case 'financial':
      return 'Financiera'
    case 'administrative':
      return 'Administrativa'
    case 'recall':
      return 'Seguimiento'
    case 'custom':
      return 'Personalizada'
    default:
      return type
  }
}

// Helper para obtener label de prioridad
export function getAlertPriorityLabel(priority: PatientAlertPriority): string {
  switch (priority) {
    case 'low':
      return 'Baja'
    case 'medium':
      return 'Media'
    case 'high':
      return 'Alta'
    case 'critical':
      return 'Crítica'
    default:
      return priority
  }
}

// ============================================
// TIPO PRINCIPAL: PACIENTE
// ============================================

export type Patient = {
  // Identificación
  id: string
  clinicId?: string // ID de la clínica (para multi-tenant)

  // Información personal básica
  firstName: string
  lastName: string
  fullName: string // firstName + lastName (computed, pero guardado para búsquedas)
  documentType?: DocumentType
  documentNumber?: string // DNI, NIE, etc.
  gender?: PatientGender
  birthDate?: string // Fecha nacimiento (ISO: "1990-05-15")
  age?: number // Edad calculada

  // Contacto
  phone: string
  phoneSecondary?: string
  email?: string
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp' | 'sms'

  // Dirección
  address?: {
    street?: string
    city?: string
    postalCode?: string
    province?: string
    country?: string
  }

  // Información de emergencia
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }

  // Estado y clasificación
  status: PatientStatus
  tags: PatientTag[]
  isVIP?: boolean
  source?: string // Origen del paciente (ej: "Google", "Recomendación", "Redes sociales")

  // Información clínica
  medicalHistory: MedicalHistory
  treatments: PatientTreatment[]
  consents: PatientConsent[]

  // Información financiera
  finance: PatientFinance

  // Citas (referencias a AppointmentsContext)
  nextAppointmentId?: string
  nextAppointmentDate?: string // Fecha próxima cita (ISO) para ordenación rápida
  lastAppointmentDate?: string // Fecha última cita (ISO)
  totalAppointments?: number // Total citas realizadas

  // Pre-registro y onboarding
  preRegistrationComplete: boolean
  preRegistrationDate?: string // Fecha completado pre-registro (ISO)

  // Notas y observaciones
  notes?: string
  internalNotes?: string // Notas internas (no visibles para el paciente)
  
  // HU-024: Alertas personalizadas
  alerts?: PatientAlert[]

  // Auditoría
  createdAt: string // Fecha registro (ISO)
  createdBy?: string // ID usuario que lo creó
  updatedAt?: string // Fecha última actualización (ISO)
  updatedBy?: string // ID usuario que lo actualizó
}

// ============================================
// HELPERS DE FORMATO
// ============================================

// Calcular edad desde fecha de nacimiento
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Formatear fecha ISO a formato corto español
export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

// Formatear fecha ISO a formato largo español
export function formatDateLong(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

type DbPatientRow = {
  id: string
  clinic_id: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  email: string | null
  date_of_birth: string | null
  biological_sex: 'female' | 'male' | 'other' | 'undisclosed' | null
  national_id: string | null
  lead_source: string | null
  created_at: string | null
  updated_at: string | null
}

type DbPatientTreatmentRow = {
  id: string
  clinic_id: string
  patient_id: string
  treatment_code: string | null
  treatment_name: string | null
  tooth_number: string | null
  tooth_face: string | null
  amount: number | null
  final_amount: number | null
  paid_amount: number | null
  status: 'Pending' | 'In progress' | 'Completed' | 'Cancelled' | null
  payment_status: 'Unpaid' | 'Partial' | 'Paid' | null
  scheduled_date: string | null
  completed_at: string | null
  completed_by: string | null
  completed_by_name: string | null
  budget_id: number | null
  notes: string | null
  marked_for_next_appointment: boolean | null
  created_at: string | null
  updated_at: string | null
  appointment_id: number | null
}

function toIsoDate(input?: string | null): string | undefined {
  if (!input) return undefined
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().split('T')[0]
}

function eurosToCents(value?: number | null): number {
  return Math.round(Number(value || 0) * 100)
}

function centsToEuros(value?: number | null): number {
  return Number((Number(value || 0) / 100).toFixed(2))
}

function formatEuroAmount(valueInEuros?: number | null): string {
  const value = Number(valueInEuros || 0)
  return `${value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} €`
}

function toDbBudgetId(value?: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mapDbTreatmentRowToUi(row: DbPatientTreatmentRow): PatientTreatment {
  const finalAmountEuros = Number(row.final_amount ?? row.amount ?? 0)
  const paidAmountEuros = Number(row.paid_amount ?? 0)

  return {
    id: row.id,
    code:
      row.treatment_code ||
      (row.treatment_name || 'TRT')
        .trim()
        .slice(0, 3)
        .toUpperCase(),
    description: row.treatment_name || 'Tratamiento',
    tooth: row.tooth_number || undefined,
    toothFace: row.tooth_face || undefined,
    scheduledDate: row.scheduled_date || undefined,
    completedDate: toIsoDate(row.completed_at),
    amount: eurosToCents(finalAmountEuros),
    amountFormatted: formatEuroAmount(finalAmountEuros),
    status: mapDbTreatmentStatusToUi(row.status),
    paymentStatus: mapDbPaymentStatusToUi(row.payment_status),
    paidAmount: eurosToCents(paidAmountEuros),
    professional: row.completed_by_name || 'Sin asignar',
    professionalId: row.completed_by || undefined,
    budgetId: row.budget_id != null ? String(row.budget_id) : undefined,
    notes: row.notes || undefined,
    createdAt: toIsoDate(row.created_at) || new Date().toISOString().split('T')[0],
    updatedAt: toIsoDate(row.updated_at),
    markedForNextAppointment: Boolean(row.marked_for_next_appointment),
    appointmentId: row.appointment_id != null ? String(row.appointment_id) : undefined
  }
}

function mapDbTreatmentStatusToUi(
  status: DbPatientTreatmentRow['status']
): TreatmentStatus {
  switch (status) {
    case 'In progress':
      return 'En curso'
    case 'Completed':
      return 'Completado'
    case 'Cancelled':
      return 'Cancelado'
    case 'Pending':
    default:
      return 'Pendiente'
  }
}

function mapDbPaymentStatusToUi(
  status: DbPatientTreatmentRow['payment_status']
): TreatmentPaymentStatus {
  switch (status) {
    case 'Partial':
      return 'Parcial'
    case 'Paid':
      return 'Pagado'
    case 'Unpaid':
    default:
      return 'Sin pagar'
  }
}

function mapUiTreatmentStatusToDb(status: TreatmentStatus): DbPatientTreatmentRow['status'] {
  switch (status) {
    case 'En curso':
      return 'In progress'
    case 'Completado':
      return 'Completed'
    case 'Cancelado':
      return 'Cancelled'
    case 'Pendiente':
    default:
      return 'Pending'
  }
}

function mapUiPaymentStatusToDb(
  status: TreatmentPaymentStatus
): DbPatientTreatmentRow['payment_status'] {
  switch (status) {
    case 'Parcial':
      return 'Partial'
    case 'Pagado':
      return 'Paid'
    case 'Sin pagar':
    default:
      return 'Unpaid'
  }
}

function mapDbSexToUi(
  sex: DbPatientRow['biological_sex']
): PatientGender | undefined {
  switch (sex) {
    case 'female':
      return 'Femenino'
    case 'male':
      return 'Masculino'
    case 'other':
      return 'Otro'
    case 'undisclosed':
      return 'No especificado'
    default:
      return undefined
  }
}

// ============================================
// CONTEXTO
// ============================================

type PatientsContextType = {
  patients: Patient[]
  // Funciones CRUD
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => string
  updatePatient: (id: string, updates: Partial<Patient>) => void
  deletePatient: (id: string) => void
  // Funciones de consulta
  getPatientById: (id: string) => Patient | undefined
  getPatientByName: (name: string) => Patient | undefined
  getPatientsByStatus: (status: PatientStatus) => Patient[]
  getPatientsByTag: (tag: PatientTag) => Patient[]
  getPatientsWithDebt: () => Patient[]
  getPatientsWithFinancing: () => Patient[]
  // Funciones de tratamientos
  getTreatmentsByPatient: (patientId: string) => PatientTreatment[]
  getPendingTreatments: (patientId: string) => PatientTreatment[]
  addTreatment: (
    patientId: string,
    treatment: Omit<PatientTreatment, 'id' | 'createdAt'>
  ) => Promise<PatientTreatment | null>
  deleteTreatment: (patientId: string, treatmentId: string) => Promise<boolean>
  updateTreatment: (patientId: string, treatmentId: string, updates: Partial<PatientTreatment>) => void
  // Funciones para marcar tratamientos para próxima cita
  toggleTreatmentForNextAppointment: (patientId: string, treatmentId: string) => void
  resetTreatmentsForNextAppointment: (patientId: string) => void
  // Funciones para obtener lista formateada para SelectInput
  getPatientsForSelect: () => { value: string; label: string }[]
  // Funciones de búsqueda
  searchPatients: (query: string) => Patient[]
  // Estadísticas
  getPatientStats: () => {
    total: number
    active: number
    withDebt: number
    withFinancing: number
    newThisMonth: number
  }
}

const PatientsContext = createContext<PatientsContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

export function PatientsProvider({ children }: { children: ReactNode }) {
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [patients, setPatients] = useState<Patient[]>(
    []
  )

  useEffect(() => {
    let isMounted = true

    async function hydratePatientsFromDb() {
      try {
        if (!isClinicInitialized) return

        const supabase = createSupabaseBrowserClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session || !activeClinicId) {
          if (isMounted) setPatients([])
          return
        }

        const clinicId = activeClinicId

        const [{ data: patientRows, error: patientsError }, { data: treatmentRows, error: treatmentsError }, { data: healthProfileRows }] =
          await Promise.all([
            supabase
              .from('patients')
              .select(
                'id, clinic_id, first_name, last_name, phone_number, email, date_of_birth, biological_sex, national_id, lead_source, created_at, updated_at'
              )
              .eq('clinic_id', clinicId)
              .order('created_at', { ascending: false }),
            supabase
              .from('patient_treatments')
              .select(
                'id, clinic_id, patient_id, treatment_code, treatment_name, tooth_number, tooth_face, amount, final_amount, paid_amount, status, payment_status, scheduled_date, completed_at, completed_by, completed_by_name, budget_id, notes, marked_for_next_appointment, created_at, updated_at, appointment_id'
              )
              .eq('clinic_id', clinicId)
              .order('created_at', { ascending: false }),
            supabase
              .from('patient_health_profiles')
              .select('patient_id, allergies, medications, conditions, main_complaint')
          ])

        if (patientsError || !patientRows) return
        if (treatmentsError) {
          console.warn('No se pudieron cargar patient_treatments, se cargan pacientes sin tratamientos DB', treatmentsError)
        }

        const treatmentsByPatient = new Map<string, PatientTreatment[]>()
        const rawTreatments = (treatmentRows || []) as DbPatientTreatmentRow[]

        for (const row of rawTreatments) {
          const treatment = mapDbTreatmentRowToUi(row)

          const list = treatmentsByPatient.get(row.patient_id) || []
          list.push(treatment)
          treatmentsByPatient.set(row.patient_id, list)
        }

        // Map health profiles by patient_id
        const healthByPatient = new Map<string, { allergies?: string | null; medications?: string | null; conditions?: string | null }>()
        for (const hp of (healthProfileRows || []) as { patient_id: string; allergies?: string | null; medications?: string | null; conditions?: string | null }[]) {
          healthByPatient.set(hp.patient_id, hp)
        }

        const mappedPatients = (patientRows as DbPatientRow[]).map((row) => {
          const firstName = (row.first_name || '').trim()
          const lastName = (row.last_name || '').trim()
          const fullName = `${firstName} ${lastName}`.trim() || 'Paciente sin nombre'
          const treatments = treatmentsByPatient.get(row.id) || []

          const totalDebtCents = treatments.reduce((sum, treatment) => {
            const remaining = Math.max(treatment.amount - treatment.paidAmount, 0)
            return sum + remaining
          }, 0)

          const birthDate = row.date_of_birth || undefined

          return {
            id: row.id,
            clinicId: row.clinic_id,
            firstName: firstName || 'Paciente',
            lastName,
            fullName,
            documentNumber: row.national_id || undefined,
            gender: mapDbSexToUi(row.biological_sex),
            birthDate,
            age: birthDate ? calculateAge(birthDate) : undefined,
            phone: row.phone_number || '',
            email: row.email || undefined,
            status: 'Activo' as PatientStatus,
            tags: totalDebtCents > 0 ? (['activo', 'deuda'] as PatientTag[]) : (['activo'] as PatientTag[]),
            source: row.lead_source || undefined,
            medicalHistory: (() => {
              const hp = healthByPatient.get(row.id)
              const allergies: Allergy[] = hp?.allergies
                ? hp.allergies.split(',').map((name, i) => ({
                    id: `alg-${row.id}-${i}`,
                    name: name.trim(),
                    severity: 'moderada' as AllergySeverity
                  })).filter(a => a.name)
                : []
              const medications: string[] = hp?.medications
                ? hp.medications.split(',').map(m => m.trim()).filter(Boolean)
                : []
              const conditions: string[] = hp?.conditions
                ? hp.conditions.split(',').map(c => c.trim()).filter(Boolean)
                : []
              return { allergies, medications, conditions }
            })(),
            treatments,
            consents: [],
            finance: {
              totalDebt: totalDebtCents,
              hasFinancing: false,
              currency: '€'
            },
            preRegistrationComplete: true,
            createdAt: toIsoDate(row.created_at) || new Date().toISOString().split('T')[0],
            updatedAt: toIsoDate(row.updated_at)
          } as Patient
        })

        if (isMounted) setPatients(mappedPatients)
      } catch (error) {
        console.warn('PatientsContext DB hydration failed, using empty state', error)
        if (isMounted) setPatients([])
      }
    }

    void hydratePatientsFromDb()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized])

  // ============================================
  // FUNCIONES CRUD
  // ============================================

  // Añadir nuevo paciente
  const addPatient = useCallback(
    (patientData: Omit<Patient, 'id' | 'createdAt'>): string => {
      const newId = `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newPatient: Patient = {
        ...patientData,
        id: newId,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setPatients((prev) => [...prev, newPatient])
      console.log('✅ Paciente añadido:', newPatient.fullName)
      return newId
    },
    []
  )

  // Actualizar paciente existente
  const updatePatient = useCallback(
    (id: string, updates: Partial<Patient>) => {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
            : p
        )
      )
      console.log(`✅ Paciente ${id} actualizado`)
    },
    []
  )

  // Eliminar paciente
  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id))
    console.log(`✅ Paciente ${id} eliminado`)
  }, [])

  // ============================================
  // FUNCIONES DE CONSULTA
  // ============================================

  // Obtener paciente por ID
  const getPatientById = useCallback(
    (id: string): Patient | undefined => {
      return patients.find((p) => p.id === id)
    },
    [patients]
  )

  // Obtener paciente por nombre
  const getPatientByName = useCallback(
    (name: string): Patient | undefined => {
      return patients.find((p) => p.fullName.toLowerCase() === name.toLowerCase())
    },
    [patients]
  )

  // Obtener pacientes por estado
  const getPatientsByStatus = useCallback(
    (status: PatientStatus): Patient[] => {
      return patients.filter((p) => p.status === status)
    },
    [patients]
  )

  // Obtener pacientes por tag
  const getPatientsByTag = useCallback(
    (tag: PatientTag): Patient[] => {
      return patients.filter((p) => p.tags.includes(tag))
    },
    [patients]
  )

  // Obtener pacientes con deuda
  const getPatientsWithDebt = useCallback((): Patient[] => {
    return patients.filter((p) => p.finance.totalDebt > 0)
  }, [patients])

  // Obtener pacientes con financiación
  const getPatientsWithFinancing = useCallback((): Patient[] => {
    return patients.filter((p) => p.finance.hasFinancing)
  }, [patients])

  // ============================================
  // FUNCIONES DE TRATAMIENTOS
  // ============================================

  // Obtener todos los tratamientos de un paciente
  const getTreatmentsByPatient = useCallback(
    (patientId: string): PatientTreatment[] => {
      const patient = patients.find((p) => p.id === patientId)
      return patient?.treatments || []
    },
    [patients]
  )

  // Obtener solo tratamientos pendientes (no completados) de un paciente
  const getPendingTreatments = useCallback(
    (patientId: string): PatientTreatment[] => {
      const patient = patients.find((p) => p.id === patientId)
      if (!patient) return []
      return patient.treatments.filter(
        (t) => t.status === 'Pendiente' || t.status === 'En curso'
      )
    },
    [patients]
  )

  // Añadir tratamiento a un paciente
  const addTreatment = useCallback(
    async (
      patientId: string,
      treatmentData: Omit<PatientTreatment, 'id' | 'createdAt'>
    ): Promise<PatientTreatment | null> => {
      try {
        const patient = patients.find((p) => p.id === patientId)
        // Fall back to activeClinicId so treatments can be added to patients that were
        // just created and may not yet be reflected in the local patients state
        const effectiveClinicId = patient?.clinicId || activeClinicId
        if (!effectiveClinicId) {
          console.warn('No se pudo crear tratamiento: clínica no encontrada')
          return null
        }

        const supabase = createSupabaseBrowserClient()
        const amountEuros = centsToEuros(treatmentData.amount)
        const paidAmountEuros = centsToEuros(treatmentData.paidAmount)

        const payload = {
          clinic_id: effectiveClinicId,
          patient_id: patientId,
          treatment_code: treatmentData.code || null,
          treatment_name: treatmentData.description ?? 'Tratamiento',
          tooth_number: treatmentData.tooth || null,
          tooth_face: treatmentData.toothFace || null,
          amount: amountEuros,
          final_amount: amountEuros,
          paid_amount: paidAmountEuros,
          status: mapUiTreatmentStatusToDb(treatmentData.status),
          payment_status: mapUiPaymentStatusToDb(treatmentData.paymentStatus),
          scheduled_date: treatmentData.scheduledDate || null,
          completed_at: treatmentData.completedDate || null,
          completed_by: treatmentData.professionalId || null,
          completed_by_name: treatmentData.professional || null,
          budget_id: toDbBudgetId(treatmentData.budgetId),
          notes: treatmentData.notes || null,
          marked_for_next_appointment: Boolean(
            treatmentData.markedForNextAppointment
          )
        }

        const { data, error } = await supabase
          .from('patient_treatments')
          .insert(payload)
          .select(
            'id, clinic_id, patient_id, treatment_code, treatment_name, tooth_number, tooth_face, amount, final_amount, paid_amount, status, payment_status, scheduled_date, completed_at, completed_by, completed_by_name, budget_id, notes, marked_for_next_appointment, created_at, updated_at'
          )
          .single()

        if (error || !data) {
          console.warn('No se pudo persistir addTreatment en DB', error)
          return null
        }

        const createdTreatment = mapDbTreatmentRowToUi(
          data as DbPatientTreatmentRow
        )

        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  treatments: [...p.treatments, createdTreatment],
                  updatedAt: new Date().toISOString().split('T')[0]
                }
              : p
          )
        )

        return createdTreatment
      } catch (error) {
        console.warn('Error creando tratamiento en DB', error)
        return null
      }
    },
    [patients]
  )

  const deleteTreatment = useCallback(
    async (patientId: string, treatmentId: string): Promise<boolean> => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase
          .from('patient_treatments')
          .delete()
          .eq('id', treatmentId)
          .eq('patient_id', patientId)

        if (error) {
          console.warn('No se pudo eliminar tratamiento en DB', error)
          return false
        }

        setPatients((prev) =>
          prev.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  treatments: p.treatments.filter((t) => t.id !== treatmentId),
                  updatedAt: new Date().toISOString().split('T')[0]
                }
              : p
          )
        )

        return true
      } catch (error) {
        console.warn('Error eliminando tratamiento en DB', error)
        return false
      }
    },
    []
  )

  // Actualizar tratamiento de un paciente
  const updateTreatment = useCallback(
    (patientId: string, treatmentId: string, updates: Partial<PatientTreatment>) => {
      // Keep amountFormatted in sync whenever amount changes so that the useEffect
      // re-sync in Treatments.tsx shows the correct price after an optimistic update
      const enrichedUpdates: Partial<PatientTreatment> = { ...updates }
      if (updates.amount !== undefined) {
        enrichedUpdates.amountFormatted = formatEuroAmount(centsToEuros(updates.amount))
      }

      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                treatments: p.treatments.map((t) =>
                  t.id === treatmentId
                    ? { ...t, ...enrichedUpdates, updatedAt: new Date().toISOString().split('T')[0] }
                    : t
                ),
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : p
        )
      )

      // Skip DB update for temp IDs — they haven't been persisted yet
      const isTempId = treatmentId.startsWith('TR-EMPTY-') || treatmentId.startsWith('new-')
      if (isTempId) return

      console.log(`✅ Tratamiento ${treatmentId} actualizado`)

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const dbUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
          }

          if (updates.status !== undefined) {
            dbUpdates.status = mapUiTreatmentStatusToDb(updates.status)
          }
          if (updates.paymentStatus !== undefined) {
            dbUpdates.payment_status = mapUiPaymentStatusToDb(updates.paymentStatus)
          }
          if (updates.paidAmount !== undefined) {
            dbUpdates.paid_amount = updates.paidAmount / 100
          }
          if (updates.code !== undefined) {
            dbUpdates.treatment_code = updates.code || null
          }
          if (updates.description !== undefined) {
            dbUpdates.treatment_name = updates.description ?? 'Tratamiento'
          }
          if (updates.tooth !== undefined) {
            dbUpdates.tooth_number = updates.tooth || null
          }
          if (updates.toothFace !== undefined) {
            dbUpdates.tooth_face = updates.toothFace || null
          }
          if (updates.amount !== undefined) {
            const amountEuros = centsToEuros(updates.amount)
            dbUpdates.amount = amountEuros
            dbUpdates.final_amount = amountEuros
          }
          if (updates.scheduledDate !== undefined) {
            dbUpdates.scheduled_date = updates.scheduledDate || null
          }
          if (updates.completedDate !== undefined) {
            dbUpdates.completed_at = updates.completedDate || null
          }
          if (updates.professional !== undefined) {
            dbUpdates.completed_by_name = updates.professional || null
          }
          if (updates.budgetId !== undefined) {
            dbUpdates.budget_id = toDbBudgetId(updates.budgetId)
          }
          if (updates.notes !== undefined) {
            dbUpdates.notes = updates.notes || null
          }
          if (updates.markedForNextAppointment !== undefined) {
            dbUpdates.marked_for_next_appointment = updates.markedForNextAppointment
          }

          const { error } = await supabase
            .from('patient_treatments')
            .update(dbUpdates)
            .eq('id', treatmentId)
            .eq('patient_id', patientId)

          if (error) {
            console.warn('No se pudo persistir updateTreatment en DB', error)
          }
        } catch (error) {
          console.warn('Error persistiendo updateTreatment en DB', error)
        }
      })()
    },
    []
  )

  // Alternar el estado de "marcado para próxima cita" de un tratamiento
  const toggleTreatmentForNextAppointment = useCallback(
    (patientId: string, treatmentId: string) => {
      let nextMarkedValue = false
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                treatments: p.treatments.map((t) =>
                  t.id === treatmentId
                    ? (() => {
                        const newValue = !t.markedForNextAppointment
                        nextMarkedValue = newValue
                        return { ...t, markedForNextAppointment: newValue }
                      })()
                    : t
                )
              }
            : p
        )
      )

      // Only persist if treatmentId is a real DB UUID (not a temp TR-EMPTY- or new- id)
      const isTempId = treatmentId.startsWith('TR-EMPTY-') || treatmentId.startsWith('new-') || treatmentId.startsWith('pat-')
      if (!isTempId) {
        void (async () => {
          try {
            const supabase = createSupabaseBrowserClient()
            const { error } = await supabase
              .from('patient_treatments')
              .update({
                marked_for_next_appointment: nextMarkedValue,
                updated_at: new Date().toISOString()
              })
              .eq('id', treatmentId)
              .eq('patient_id', patientId)

            if (error) {
              console.warn('No se pudo persistir marcado de tratamiento en DB', error)
            }
          } catch (error) {
            console.warn('Error persistiendo marcado de tratamiento en DB', error)
          }
        })()
      }
    },
    []
  )

  // Resetear todos los tratamientos marcados para próxima cita (después de crear cita)
  const resetTreatmentsForNextAppointment = useCallback(
    (patientId: string) => {
      const treatmentIdsToReset: string[] = []
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                treatments: p.treatments.map((t) => {
                  if (t.markedForNextAppointment) {
                    treatmentIdsToReset.push(t.id)
                  }
                  return {
                    ...t,
                    markedForNextAppointment: false
                  }
                })
              }
            : p
        )
      )
      console.log(`✅ Tratamientos para próxima cita reseteados para paciente ${patientId}`)

      if (treatmentIdsToReset.length === 0) return

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase
            .from('patient_treatments')
            .update({
              marked_for_next_appointment: false,
              updated_at: new Date().toISOString()
            })
            .eq('patient_id', patientId)
            .in('id', treatmentIdsToReset)

          if (error) {
            console.warn('No se pudo resetear marcados en DB', error)
          }
        } catch (error) {
          console.warn('Error reseteando marcados en DB', error)
        }
      })()
    },
    []
  )

  // ============================================
  // FUNCIONES DE SELECCIÓN Y BÚSQUEDA
  // ============================================

  // Obtener lista de pacientes formateada para SelectInput
  const getPatientsForSelect = useCallback((): { value: string; label: string }[] => {
    return patients.map((p) => ({
      value: p.id,
      label: p.fullName
    }))
  }, [patients])

  // Buscar pacientes por nombre, teléfono o email
  const searchPatients = useCallback(
    (query: string): Patient[] => {
      if (!query.trim()) return patients
      const lowerQuery = query.toLowerCase()
      return patients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(lowerQuery) ||
          p.phone.includes(query) ||
          p.email?.toLowerCase().includes(lowerQuery) ||
          p.documentNumber?.toLowerCase().includes(lowerQuery)
      )
    },
    [patients]
  )

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  const getPatientStats = useCallback(() => {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]

    return {
      total: patients.length,
      active: patients.filter((p) => p.status === 'Activo').length,
      withDebt: patients.filter((p) => p.finance.totalDebt > 0).length,
      withFinancing: patients.filter((p) => p.finance.hasFinancing).length,
      newThisMonth: patients.filter((p) => p.createdAt >= firstDayOfMonth).length
    }
  }, [patients])

  // ============================================
  // VALUE DEL CONTEXTO
  // ============================================

  const value: PatientsContextType = {
    patients,
    // CRUD
    addPatient,
    updatePatient,
    deletePatient,
    // Consultas
    getPatientById,
    getPatientByName,
    getPatientsByStatus,
    getPatientsByTag,
    getPatientsWithDebt,
    getPatientsWithFinancing,
    // Tratamientos
    getTreatmentsByPatient,
    getPendingTreatments,
    addTreatment,
    deleteTreatment,
    updateTreatment,
    toggleTreatmentForNextAppointment,
    resetTreatmentsForNextAppointment,
    // Select y búsqueda
    getPatientsForSelect,
    searchPatients,
    // Stats
    getPatientStats
  }

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  )
}

// ============================================
// HOOK PARA USAR EL CONTEXTO
// ============================================

export function usePatients() {
  const context = useContext(PatientsContext)
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientsProvider')
  }
  return context
}
