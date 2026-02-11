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
  scheduledDate?: string // Fecha programada (ISO)
  completedDate?: string // Fecha realización (ISO)
  amount: number // Precio en céntimos o como número
  amountFormatted: string // Precio formateado (ej: "72 €")
  status: TreatmentStatus
  paymentStatus: TreatmentPaymentStatus
  paidAmount: number // Cantidad ya pagada
  professional: string // Profesional asignado
  professionalId?: string // ID del profesional
  budgetId?: string // ID del presupuesto asociado
  notes?: string // Notas del tratamiento
  createdAt: string // Fecha creación (ISO)
  updatedAt?: string // Fecha última actualización (ISO)
  markedForNextAppointment?: boolean // Marcado para incluir en próxima cita
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
  patient_id: string
  treatment_code: string | null
  treatment_name: string | null
  tooth_number: string | null
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

function formatEuroAmount(valueInEuros?: number | null): string {
  const value = Number(valueInEuros || 0)
  return `${value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} €`
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
// DATOS MOCK (Preparados para DB)
// ============================================

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    firstName: 'María',
    lastName: 'García López',
    fullName: 'María García López',
    documentType: 'DNI',
    documentNumber: '12345678A',
    gender: 'Femenino',
    birthDate: '1992-03-15',
    age: 34,
    phone: '612 345 678',
    email: 'maria.garcia@email.com',
    preferredContactMethod: 'whatsapp',
    address: {
      street: 'Calle Mayor 23, 2ºB',
      city: 'Madrid',
      postalCode: '28013',
      province: 'Madrid',
      country: 'España'
    },
    status: 'Activo',
    tags: ['activo'],
    medicalHistory: {
      allergies: [
        { id: 'alg-001-1', name: 'Penicilina', severity: 'grave', createdAt: '2024-06-15' }
      ],
      medications: [],
      conditions: [],
      lastUpdated: '2025-12-01'
    },
    treatments: [
      {
        id: 't1-pat-001',
        code: 'LDE',
        description: 'Limpieza dental',
        scheduledDate: '2025-12-22',
        completedDate: '2025-12-22',
        amount: 7200,
        amountFormatted: '72 €',
        status: 'Completado',
        paymentStatus: 'Pagado',
        paidAmount: 7200,
        professional: 'Laura Sánchez (Higienista)',
        createdAt: '2025-12-01'
      },
      {
        id: 't2-pat-001',
        code: 'BLD',
        description: 'Blanqueamiento dental',
        amount: 20000,
        amountFormatted: '200 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Laura Sánchez (Higienista)',
        createdAt: '2025-12-22'
      }
    ],
    consents: [
      {
        id: 'con-001-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2024-06-15'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-02-15',
    lastAppointmentDate: '2025-12-22',
    totalAppointments: 8,
    preRegistrationComplete: true,
    preRegistrationDate: '2024-06-10',
    // HU-024: Sample patient alerts
    alerts: [
      {
        id: 'alert-001-1',
        type: 'medical',
        priority: 'high',
        title: 'Alergia grave a Penicilina',
        message: 'No prescribir antibióticos del grupo de las penicilinas. Alternativas recomendadas: azitromicina, clindamicina.',
        isActive: true,
        showOnOpen: true,
        showInAppointment: true,
        createdAt: '2024-06-15'
      },
      {
        id: 'alert-001-2',
        type: 'recall',
        priority: 'medium',
        title: 'Revisión periódica pendiente',
        message: 'Paciente debe realizar revisión semestral. Última limpieza: diciembre 2025.',
        isActive: true,
        showOnOpen: false,
        showInAppointment: true,
        createdAt: '2025-12-22',
        expiresAt: '2026-06-22'
      }
    ],
    createdAt: '2024-06-10',
    updatedAt: '2025-12-22'
  },
  {
    id: 'pat-002',
    firstName: 'Carlos',
    lastName: 'Rodríguez Fernández',
    fullName: 'Carlos Rodríguez Fernández',
    documentType: 'DNI',
    documentNumber: '23456789B',
    gender: 'Masculino',
    birthDate: '1981-07-22',
    age: 45,
    phone: '623 456 789',
    email: 'carlos.rodriguez@email.com',
    preferredContactMethod: 'phone',
    address: {
      street: 'Avenida de la Constitución 45',
      city: 'Madrid',
      postalCode: '28028',
      province: 'Madrid',
      country: 'España'
    },
    status: 'Activo',
    tags: ['activo', 'deuda'],
    medicalHistory: {
      allergies: [],
      medications: ['Omeprazol'],
      conditions: ['Hipertensión'],
      notes: 'Control de tensión antes de procedimientos largos',
      lastUpdated: '2025-11-15'
    },
    treatments: [
      {
        id: 't1-pat-002',
        code: 'EMP',
        description: 'Empaste molar 36',
        tooth: '36',
        amount: 8500,
        amountFormatted: '85 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        createdAt: '2026-01-10'
      },
      {
        id: 't2-pat-002',
        code: 'END',
        description: 'Endodoncia premolar',
        tooth: '24',
        amount: 32000,
        amountFormatted: '320 €',
        status: 'Pendiente',
        paymentStatus: 'Parcial',
        paidAmount: 10000,
        professional: 'Dr. Francisco Moreno',
        createdAt: '2026-01-10'
      },
      {
        id: 't3-pat-002',
        code: 'REV',
        description: 'Revisión anual',
        scheduledDate: '2026-01-28',
        amount: 4000,
        amountFormatted: '40 €',
        status: 'En curso',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        createdAt: '2025-12-15'
      }
    ],
    consents: [
      {
        id: 'con-002-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2023-03-20'
      },
      {
        id: 'con-002-2',
        type: 'Consentimiento endodoncia',
        status: 'Pendiente'
      }
    ],
    finance: {
      totalDebt: 34500,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-11-15',
    totalAppointments: 12,
    preRegistrationComplete: true,
    preRegistrationDate: '2023-03-15',
    createdAt: '2023-03-15',
    updatedAt: '2026-01-10'
  },
  {
    id: 'pat-003',
    firstName: 'Ana',
    lastName: 'Martínez Sánchez',
    fullName: 'Ana Martínez Sánchez',
    documentType: 'DNI',
    documentNumber: '34567890C',
    gender: 'Femenino',
    birthDate: '1998-01-08',
    age: 28,
    phone: '634 567 890',
    email: 'ana.martinez@email.com',
    preferredContactMethod: 'email',
    status: 'Activo',
    tags: ['activo', 'vip'],
    isVIP: true,
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2025-09-01'
    },
    treatments: [
      {
        id: 't1-pat-003',
        code: 'ORT',
        description: 'Ortodoncia Invisalign - Tratamiento completo',
        scheduledDate: '2026-01-10',
        amount: 350000,
        amountFormatted: '3.500 €',
        status: 'En curso',
        paymentStatus: 'Parcial',
        paidAmount: 175000,
        professional: 'Dra. Elena Navarro',
        notes: 'Revisiones mensuales programadas',
        createdAt: '2025-09-01'
      }
    ],
    consents: [
      {
        id: 'con-003-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2025-09-01'
      },
      {
        id: 'con-003-2',
        type: 'Consentimiento ortodoncia',
        status: 'Firmado',
        signedDate: '2025-09-01'
      }
    ],
    finance: {
      totalDebt: 175000,
      hasFinancing: true,
      financingDetails: {
        totalAmount: 350000,
        paidAmount: 175000,
        remainingInstallments: 10,
        monthlyAmount: 17500,
        startDate: '2025-09-01',
        endDate: '2026-07-01'
      },
      currency: '€'
    },
    nextAppointmentDate: '2026-02-10',
    lastAppointmentDate: '2026-01-10',
    totalAppointments: 5,
    preRegistrationComplete: true,
    preRegistrationDate: '2025-08-25',
    createdAt: '2025-08-25',
    updatedAt: '2026-01-10'
  },
  {
    id: 'pat-004',
    firstName: 'Pablo',
    lastName: 'López García',
    fullName: 'Pablo López García',
    gender: 'Masculino',
    birthDate: '2014-04-20',
    age: 12,
    phone: '645 678 901',
    phoneSecondary: '645 111 222',
    email: 'familia.lopez@email.com',
    preferredContactMethod: 'whatsapp',
    emergencyContact: {
      name: 'Carmen García (Madre)',
      relationship: 'Madre',
      phone: '645 111 222'
    },
    status: 'Activo',
    tags: ['activo', 'recall'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      notes: 'Paciente pediátrico - Acompañado por tutor',
      lastUpdated: '2025-10-01'
    },
    treatments: [
      {
        id: 't1-pat-004',
        code: 'SEL',
        description: 'Selladores molares permanentes',
        tooth: '16, 26, 36, 46',
        amount: 6000,
        amountFormatted: '60 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        createdAt: '2026-01-15'
      },
      {
        id: 't2-pat-004',
        code: 'FLU',
        description: 'Aplicación de flúor',
        amount: 3500,
        amountFormatted: '35 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Laura Sánchez (Higienista)',
        createdAt: '2026-01-15'
      }
    ],
    consents: [
      {
        id: 'con-004-1',
        type: 'Consentimiento general (menor)',
        status: 'Firmado',
        signedDate: '2024-01-10'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-10-01',
    totalAppointments: 4,
    preRegistrationComplete: true,
    preRegistrationDate: '2024-01-05',
    createdAt: '2024-01-05',
    updatedAt: '2026-01-15'
  },
  {
    id: 'pat-005',
    firstName: 'Laura',
    lastName: 'Fernández Ruiz',
    fullName: 'Laura Fernández Ruiz',
    documentType: 'DNI',
    documentNumber: '45678901D',
    gender: 'Femenino',
    birthDate: '2003-06-12',
    age: 23,
    phone: '656 789 012',
    email: 'laura.fernandez@email.com',
    preferredContactMethod: 'whatsapp',
    status: 'Activo',
    tags: ['activo'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2025-06-01'
    },
    treatments: [
      {
        id: 't1-pat-005',
        code: 'INV',
        description: 'Revisión Invisalign mensual',
        scheduledDate: '2026-01-28',
        amount: 0,
        amountFormatted: '0 €',
        status: 'En curso',
        paymentStatus: 'Pagado',
        paidAmount: 0,
        professional: 'Dra. Elena Navarro',
        notes: 'Incluido en tratamiento de ortodoncia',
        createdAt: '2025-06-01'
      }
    ],
    consents: [
      {
        id: 'con-005-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2025-06-01'
      },
      {
        id: 'con-005-2',
        type: 'Consentimiento ortodoncia',
        status: 'Firmado',
        signedDate: '2025-06-01'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: true,
      financingDetails: {
        totalAmount: 280000,
        paidAmount: 196000,
        remainingInstallments: 4,
        monthlyAmount: 21000,
        startDate: '2025-06-01',
        endDate: '2026-05-01'
      },
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-12-20',
    totalAppointments: 8,
    preRegistrationComplete: true,
    preRegistrationDate: '2025-05-25',
    createdAt: '2025-05-25',
    updatedAt: '2025-12-20'
  },
  {
    id: 'pat-006',
    firstName: 'Javier',
    lastName: 'Moreno Torres',
    fullName: 'Javier Moreno Torres',
    documentType: 'DNI',
    documentNumber: '56789012E',
    gender: 'Masculino',
    birthDate: '1970-11-03',
    age: 56,
    phone: '667 890 123',
    email: 'javier.moreno@email.com',
    preferredContactMethod: 'phone',
    address: {
      street: 'Plaza de España 7, 4ºA',
      city: 'Madrid',
      postalCode: '28008',
      province: 'Madrid',
      country: 'España'
    },
    status: 'Activo',
    tags: ['activo', 'deuda'],
    medicalHistory: {
      allergies: [
        { id: 'alg-006-1', name: 'Ibuprofeno', severity: 'moderada', createdAt: '2022-05-10' }
      ],
      medications: ['Atorvastatina', 'Enalapril'],
      conditions: ['Hipertensión', 'Colesterol alto'],
      notes: 'Profilaxis antibiótica antes de procedimientos invasivos',
      lastUpdated: '2025-12-01'
    },
    treatments: [
      {
        id: 't1-pat-006',
        code: 'LPR',
        description: 'Limpieza profunda cuadrante 1',
        tooth: 'Q1',
        amount: 12000,
        amountFormatted: '120 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Laura Sánchez (Higienista)',
        createdAt: '2026-01-20'
      },
      {
        id: 't2-pat-006',
        code: 'PER',
        description: 'Tratamiento periodontal completo',
        amount: 45000,
        amountFormatted: '450 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dra. Carmen Díaz',
        notes: 'Requiere 4 sesiones',
        createdAt: '2026-01-20'
      }
    ],
    consents: [
      {
        id: 'con-006-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2022-05-10'
      },
      {
        id: 'con-006-2',
        type: 'Consentimiento periodontal',
        status: 'Pendiente'
      }
    ],
    finance: {
      totalDebt: 57000,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-12-01',
    totalAppointments: 15,
    preRegistrationComplete: true,
    preRegistrationDate: '2022-05-05',
    createdAt: '2022-05-05',
    updatedAt: '2026-01-20'
  },
  {
    id: 'pat-007',
    firstName: 'Sofía',
    lastName: 'Navarro Díaz',
    fullName: 'Sofía Navarro Díaz',
    documentType: 'DNI',
    documentNumber: '67890123F',
    gender: 'Femenino',
    birthDate: '1995-09-28',
    age: 31,
    phone: '678 901 234',
    email: 'sofia.navarro@email.com',
    preferredContactMethod: 'email',
    status: 'Activo',
    tags: ['activo'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2025-11-01'
    },
    treatments: [
      {
        id: 't1-pat-007',
        code: 'RAD',
        description: 'Radiografía panorámica',
        completedDate: '2025-11-15',
        amount: 4500,
        amountFormatted: '45 €',
        status: 'Completado',
        paymentStatus: 'Pagado',
        paidAmount: 4500,
        professional: 'Dr. Antonio Ruiz',
        createdAt: '2025-11-01'
      },
      {
        id: 't2-pat-007',
        code: 'IMP',
        description: 'Implante dental pieza 36',
        tooth: '36',
        amount: 120000,
        amountFormatted: '1.200 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Miguel Á. Torres',
        notes: 'Valorar TAC previo',
        createdAt: '2025-11-15'
      }
    ],
    consents: [
      {
        id: 'con-007-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2025-11-01'
      },
      {
        id: 'con-007-2',
        type: 'Consentimiento implantología',
        status: 'Pendiente'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-11-15',
    totalAppointments: 3,
    preRegistrationComplete: true,
    preRegistrationDate: '2025-10-28',
    createdAt: '2025-10-28',
    updatedAt: '2025-11-15'
  },
  {
    id: 'pat-008',
    firstName: 'Miguel',
    lastName: 'Gómez Hernández',
    fullName: 'Miguel Gómez Hernández',
    documentType: 'DNI',
    documentNumber: '78901234G',
    gender: 'Masculino',
    birthDate: '1988-02-14',
    age: 38,
    phone: '601 234 567',
    email: 'miguel.gomez@email.com',
    preferredContactMethod: 'whatsapp',
    status: 'Activo',
    tags: ['activo', 'deuda'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2025-06-01'
    },
    treatments: [
      {
        id: 't1-pat-008',
        code: 'IMP',
        description: 'Implante dental (2ª fase) - Pieza 46',
        tooth: '46',
        scheduledDate: '2026-01-28',
        amount: 80000,
        amountFormatted: '800 €',
        status: 'En curso',
        paymentStatus: 'Parcial',
        paidAmount: 50000,
        professional: 'Dr. Miguel Á. Torres',
        createdAt: '2025-06-01'
      },
      {
        id: 't2-pat-008',
        code: 'COR',
        description: 'Corona sobre implante pieza 46',
        tooth: '46',
        amount: 65000,
        amountFormatted: '650 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Miguel Á. Torres',
        createdAt: '2025-06-01'
      }
    ],
    consents: [
      {
        id: 'con-008-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2025-06-01'
      },
      {
        id: 'con-008-2',
        type: 'Consentimiento implantología',
        status: 'Firmado',
        signedDate: '2025-06-01'
      }
    ],
    finance: {
      totalDebt: 95000,
      hasFinancing: true,
      financingDetails: {
        totalAmount: 145000,
        paidAmount: 50000,
        remainingInstallments: 9,
        monthlyAmount: 10556,
        startDate: '2025-06-01',
        endDate: '2026-03-01'
      },
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-12-15',
    totalAppointments: 6,
    preRegistrationComplete: true,
    preRegistrationDate: '2025-05-20',
    createdAt: '2025-05-20',
    updatedAt: '2025-12-15'
  },
  {
    id: 'pat-009',
    firstName: 'Elena',
    lastName: 'Vega Castillo',
    fullName: 'Elena Vega Castillo',
    documentType: 'DNI',
    documentNumber: '89012345H',
    gender: 'Femenino',
    birthDate: '1997-08-05',
    age: 29,
    phone: '612 345 678',
    email: 'elena.vega@email.com',
    preferredContactMethod: 'whatsapp',
    status: 'Activo',
    tags: ['activo', 'nuevo'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2026-01-15'
    },
    treatments: [
      {
        id: 't1-pat-009',
        code: 'BLA',
        description: 'Blanqueamiento LED',
        scheduledDate: '2026-01-28',
        amount: 25000,
        amountFormatted: '250 €',
        status: 'En curso',
        paymentStatus: 'Pagado',
        paidAmount: 25000,
        professional: 'Laura Sánchez (Higienista)',
        createdAt: '2026-01-15'
      }
    ],
    consents: [
      {
        id: 'con-009-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2026-01-15'
      },
      {
        id: 'con-009-2',
        type: 'Consentimiento blanqueamiento',
        status: 'Firmado',
        signedDate: '2026-01-15'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2026-01-15',
    totalAppointments: 2,
    preRegistrationComplete: true,
    preRegistrationDate: '2026-01-10',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-15'
  },
  {
    id: 'pat-010',
    firstName: 'Antonio',
    lastName: 'Pérez Molina',
    fullName: 'Antonio Pérez Molina',
    documentType: 'DNI',
    documentNumber: '90123456I',
    gender: 'Masculino',
    birthDate: '1975-12-30',
    age: 51,
    phone: '623 456 789',
    email: 'antonio.perez@email.com',
    preferredContactMethod: 'phone',
    status: 'Activo',
    tags: ['activo', 'deuda'],
    medicalHistory: {
      allergies: [],
      medications: ['Metformina'],
      conditions: ['Diabetes tipo 2'],
      notes: 'Paciente diabético - Control glucemia',
      lastUpdated: '2025-09-01'
    },
    treatments: [
      {
        id: 't1-pat-010',
        code: 'LDE',
        description: 'Limpieza dental',
        completedDate: '2025-09-15',
        amount: 7200,
        amountFormatted: '72 €',
        status: 'Completado',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Laura Sánchez (Higienista)',
        createdAt: '2025-09-01'
      },
      {
        id: 't2-pat-010',
        code: 'EXT',
        description: 'Extracción molar 47',
        tooth: '47',
        amount: 9000,
        amountFormatted: '90 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        notes: 'Valorar estado periodontal previo',
        createdAt: '2025-09-15'
      }
    ],
    consents: [
      {
        id: 'con-010-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2023-08-01'
      },
      {
        id: 'con-010-2',
        type: 'Consentimiento extracción',
        status: 'Pendiente'
      }
    ],
    finance: {
      totalDebt: 16200,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-09-15',
    totalAppointments: 10,
    preRegistrationComplete: true,
    preRegistrationDate: '2023-07-25',
    createdAt: '2023-07-25',
    updatedAt: '2025-09-15'
  },
  {
    id: 'pat-011',
    firstName: 'David',
    lastName: 'Sánchez Martín',
    fullName: 'David Sánchez Martín',
    documentType: 'DNI',
    documentNumber: '01234567J',
    gender: 'Masculino',
    birthDate: '1984-05-18',
    age: 42,
    phone: '689 012 345',
    email: 'david.sanchez@email.com',
    preferredContactMethod: 'email',
    status: 'Activo',
    tags: ['activo', 'deuda'],
    medicalHistory: {
      allergies: [
        { id: 'alg-011-1', name: 'Látex', severity: 'grave', notes: 'Usar guantes sin látex', createdAt: '2025-09-25' }
      ],
      medications: [],
      conditions: [],
      notes: 'Usar guantes sin látex',
      lastUpdated: '2025-10-01'
    },
    treatments: [
      {
        id: 't1-pat-011',
        code: 'PER',
        description: 'Tratamiento periodontal - Fase 1',
        amount: 18000,
        amountFormatted: '180 €',
        status: 'En curso',
        paymentStatus: 'Parcial',
        paidAmount: 5000,
        professional: 'Dra. Carmen Díaz',
        createdAt: '2025-10-01'
      }
    ],
    consents: [
      {
        id: 'con-011-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2025-10-01'
      },
      {
        id: 'con-011-2',
        type: 'Consentimiento periodontal',
        status: 'Firmado',
        signedDate: '2025-10-01'
      }
    ],
    finance: {
      totalDebt: 13000,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-12-15',
    totalAppointments: 4,
    preRegistrationComplete: true,
    preRegistrationDate: '2025-09-25',
    createdAt: '2025-09-25',
    updatedAt: '2025-12-15'
  },
  {
    id: 'pat-012',
    firstName: 'Carmen',
    lastName: 'Ruiz Jiménez',
    fullName: 'Carmen Ruiz Jiménez',
    documentType: 'DNI',
    documentNumber: '12345678K',
    gender: 'Femenino',
    birthDate: '1959-03-22',
    age: 67,
    phone: '690 123 456',
    email: 'carmen.ruiz@email.com',
    preferredContactMethod: 'phone',
    emergencyContact: {
      name: 'Pedro Ruiz (Hijo)',
      relationship: 'Hijo',
      phone: '690 111 222'
    },
    status: 'Activo',
    tags: ['activo'],
    medicalHistory: {
      allergies: [
        { id: 'alg-012-1', name: 'Aspirina', severity: 'extrema', notes: 'Reacción anafiláctica documentada', createdAt: '2020-02-15' }
      ],
      medications: ['Sintrom', 'Atorvastatina', 'Omeprazol'],
      conditions: ['Fibrilación auricular', 'Colesterol'],
      notes: 'Paciente anticoagulada - Requiere control INR antes de extracciones. Suspender Sintrom 3 días antes con supervisión médica.',
      lastUpdated: '2026-01-10'
    },
    treatments: [
      {
        id: 't1-pat-012',
        code: 'CTR',
        description: 'Control post-endodoncia pieza 25',
        tooth: '25',
        scheduledDate: '2026-01-28',
        amount: 0,
        amountFormatted: '0 €',
        status: 'En curso',
        paymentStatus: 'Pagado',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        notes: 'Control a los 6 meses',
        createdAt: '2025-07-28'
      }
    ],
    consents: [
      {
        id: 'con-012-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2020-02-15'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-07-28',
    totalAppointments: 25,
    preRegistrationComplete: true,
    preRegistrationDate: '2020-02-10',
    createdAt: '2020-02-10',
    updatedAt: '2026-01-10'
  },
  {
    id: 'pat-013',
    firstName: 'Marta',
    lastName: 'Alonso Blanco',
    fullName: 'Marta Alonso Blanco',
    documentType: 'DNI',
    documentNumber: '23456789L',
    gender: 'Femenino',
    birthDate: '1990-10-12',
    age: 36,
    phone: '634 567 890',
    email: 'marta.alonso@email.com',
    preferredContactMethod: 'whatsapp',
    status: 'Activo',
    tags: ['activo'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2025-11-01'
    },
    treatments: [
      {
        id: 't1-pat-013',
        code: 'EMP',
        description: 'Empaste molar 16',
        tooth: '16',
        scheduledDate: '2026-01-28',
        amount: 8500,
        amountFormatted: '85 €',
        status: 'En curso',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        createdAt: '2026-01-20'
      }
    ],
    consents: [
      {
        id: 'con-013-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2024-03-15'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-11-20',
    totalAppointments: 7,
    preRegistrationComplete: true,
    preRegistrationDate: '2024-03-10',
    createdAt: '2024-03-10',
    updatedAt: '2026-01-20'
  },
  {
    id: 'pat-014',
    firstName: 'Fernando',
    lastName: 'Díaz Ortega',
    fullName: 'Fernando Díaz Ortega',
    documentType: 'DNI',
    documentNumber: '34567890M',
    gender: 'Masculino',
    birthDate: '1982-07-08',
    age: 44,
    phone: '645 678 901',
    email: 'fernando.diaz@email.com',
    preferredContactMethod: 'email',
    status: 'Activo',
    tags: ['activo'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: ['Bruxismo'],
      notes: 'Paciente bruxista - Uso de férula nocturna',
      lastUpdated: '2025-08-01'
    },
    treatments: [
      {
        id: 't1-pat-014',
        code: 'FER',
        description: 'Férula de descarga Michigan',
        scheduledDate: '2026-01-28',
        amount: 35000,
        amountFormatted: '350 €',
        status: 'En curso',
        paymentStatus: 'Pagado',
        paidAmount: 35000,
        professional: 'Dr. Antonio Ruiz',
        notes: 'Entrega y ajuste',
        createdAt: '2026-01-10'
      }
    ],
    consents: [
      {
        id: 'con-014-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2025-08-01'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2026-01-10',
    totalAppointments: 5,
    preRegistrationComplete: true,
    preRegistrationDate: '2025-07-25',
    createdAt: '2025-07-25',
    updatedAt: '2026-01-10'
  },
  {
    id: 'pat-015',
    firstName: 'Beatriz',
    lastName: 'Muñoz Serrano',
    fullName: 'Beatriz Muñoz Serrano',
    documentType: 'DNI',
    documentNumber: '45678901N',
    gender: 'Femenino',
    birthDate: '1993-04-25',
    age: 33,
    phone: '656 789 012',
    email: 'beatriz.munoz@email.com',
    preferredContactMethod: 'whatsapp',
    status: 'Activo',
    tags: ['activo', 'recall'],
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      lastUpdated: '2025-06-01'
    },
    treatments: [
      {
        id: 't1-pat-015',
        code: 'REV',
        description: 'Revisión anual completa',
        scheduledDate: '2026-01-28',
        amount: 4000,
        amountFormatted: '40 €',
        status: 'Pendiente',
        paymentStatus: 'Sin pagar',
        paidAmount: 0,
        professional: 'Dr. Antonio Ruiz',
        createdAt: '2026-01-05'
      }
    ],
    consents: [
      {
        id: 'con-015-1',
        type: 'Consentimiento general',
        status: 'Firmado',
        signedDate: '2024-06-15'
      }
    ],
    finance: {
      totalDebt: 0,
      hasFinancing: false,
      currency: '€'
    },
    nextAppointmentDate: '2026-01-28',
    lastAppointmentDate: '2025-06-15',
    totalAppointments: 3,
    preRegistrationComplete: true,
    preRegistrationDate: '2024-06-10',
    notes: 'Paciente con recall anual',
    createdAt: '2024-06-10',
    updatedAt: '2026-01-05'
  }
]

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
  addTreatment: (patientId: string, treatment: Omit<PatientTreatment, 'id' | 'createdAt'>) => void
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
    () => INITIAL_PATIENTS.slice(0, 0)
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

        const [{ data: patientRows, error: patientsError }, { data: treatmentRows, error: treatmentsError }] =
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
                'id, patient_id, treatment_code, treatment_name, tooth_number, amount, final_amount, paid_amount, status, payment_status, scheduled_date, completed_at, completed_by, completed_by_name, budget_id, notes, marked_for_next_appointment, created_at, updated_at'
              )
              .eq('clinic_id', clinicId)
              .order('created_at', { ascending: false })
          ])

        if (patientsError || !patientRows) return
        if (treatmentsError) {
          console.warn('No se pudieron cargar patient_treatments, se cargan pacientes sin tratamientos DB', treatmentsError)
        }

        const treatmentsByPatient = new Map<string, PatientTreatment[]>()
        const rawTreatments = (treatmentRows || []) as DbPatientTreatmentRow[]

        for (const row of rawTreatments) {
          const finalAmountEuros = Number(row.final_amount ?? row.amount ?? 0)
          const paidAmountEuros = Number(row.paid_amount ?? 0)
          const treatment: PatientTreatment = {
            id: row.id,
            code:
              row.treatment_code ||
              (row.treatment_name || 'TRT')
                .trim()
                .slice(0, 3)
                .toUpperCase(),
            description: row.treatment_name || 'Tratamiento',
            tooth: row.tooth_number || undefined,
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
            markedForNextAppointment: Boolean(row.marked_for_next_appointment)
          }

          const list = treatmentsByPatient.get(row.patient_id) || []
          list.push(treatment)
          treatmentsByPatient.set(row.patient_id, list)
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
            medicalHistory: {
              allergies: [],
              medications: [],
              conditions: []
            },
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
    (patientId: string, treatmentData: Omit<PatientTreatment, 'id' | 'createdAt'>) => {
      const newTreatment: PatientTreatment = {
        ...treatmentData,
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                treatments: [...p.treatments, newTreatment],
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : p
        )
      )
      console.log(`✅ Tratamiento añadido a paciente ${patientId}`)
    },
    []
  )

  // Actualizar tratamiento de un paciente
  const updateTreatment = useCallback(
    (patientId: string, treatmentId: string, updates: Partial<PatientTreatment>) => {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? {
                ...p,
                treatments: p.treatments.map((t) =>
                  t.id === treatmentId
                    ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
                    : t
                ),
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : p
        )
      )
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
          if (updates.scheduledDate !== undefined) {
            dbUpdates.scheduled_date = updates.scheduledDate || null
          }
          if (updates.completedDate !== undefined) {
            dbUpdates.completed_at = updates.completedDate || null
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
