'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState
} from 'react'

import type { VisitStatus, VisitStatusLog } from '@/components/agenda/types'
import { calculateFinalDurations } from '@/hooks/useWaitTimer'

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

export type ToothFace = 'mesial' | 'distal' | 'oclusal' | 'vestibular' | 'lingual' | 'palatino'

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
  other: { label: 'Otro', icon: 'BlockRounded' }
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
}

// ============================================
// TIPOS UNIFICADOS PARA CITAS
// ============================================

export type AppointmentStatus = 'Confirmada' | 'No confirmada' | 'Reagendar'

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
  reason: string // motivo de consulta
  status: AppointmentStatus
  // Para vista de día (box)
  box?: string // "box 1", "box 2", "box 3"
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
}

// ============================================
// DATOS INICIALES (MOCK DATA)
// Estructura preparada para conexión directa a Supabase
// IDs consistentes: apt-{patId}-{seq} para trazabilidad
// ============================================

const INITIAL_APPOINTMENTS: Appointment[] = [
  // ============================================
  // CITAS PASADAS COMPLETADAS (3-27 Enero 2026)
  // Con historial clínico, SOAP notes y pagos
  // ============================================
  
  // --- María García López (pat-001) - 4 citas pasadas ---
  {
    id: 'apt-001-01',
    date: '2026-01-08',
    startTime: '09:30',
    endTime: '10:00',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    patientId: 'pat-001',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión general y diagnóstico',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 480000,
    consultationDuration: 1560000,
    soapNotes: {
      subjective: 'Paciente refiere sensibilidad al frío en zona posterior derecha desde hace 2 semanas. Dolor 4/10.',
      objective: 'Exploración revela caries oclusal en pieza 16. Sensibilidad positiva al frío. RX: sin afectación pulpar.',
      assessment: 'Caries oclusal pieza 16. Pronóstico favorable con tratamiento conservador.',
      plan: 'Obturación composite pieza 16 programada. Indicaciones de higiene.',
      updatedAt: '2026-01-08T10:15:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-001-01', treatmentCode: 'REV', description: 'Revisión general', amount: '45 €', status: 'completed', completedAt: '2026-01-08T10:00:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ],
    attachments: [
      { id: 'att-001-01', name: 'RX-panoramica-08ene.jpg', type: 'xray', url: '/attachments/rx-001-01.jpg', uploadedAt: '2026-01-08T09:45:00Z', uploadedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-001-02',
    date: '2026-01-15',
    startTime: '11:00',
    endTime: '12:00',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    patientId: 'pat-001',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Obturación composite pieza 16',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 360000,
    consultationDuration: 2700000,
    soapNotes: {
      subjective: 'Paciente acude para tratamiento programado. Sin sintomatología actual.',
      objective: 'Anestesia infiltrativa. Remoción de caries. Obturación con composite A2.',
      assessment: 'Tratamiento completado sin complicaciones. Oclusión correcta.',
      plan: 'Control en 2 semanas si molestias. Próxima revisión en 6 meses.',
      updatedAt: '2026-01-15T12:00:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-001-02', treatmentCode: 'OBC', description: 'Obturación composite', amount: '85 €', pieceNumber: 16, toothFace: 'oclusal', status: 'completed', completedAt: '2026-01-15T11:50:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-001-03',
    date: '2026-01-22',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    patientId: 'pat-001',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza dental',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 300000,
    consultationDuration: 1800000,
    soapNotes: {
      subjective: 'Paciente sin molestias. Revisión rutinaria.',
      objective: 'Limpieza ultrasónica. Eliminación de cálculo supragingival leve.',
      assessment: 'Buena higiene general. Leve acumulación en lingual de incisivos inferiores.',
      plan: 'Refuerzo técnica de cepillado zona lingual inferior.',
      updatedAt: '2026-01-22T09:30:00Z',
      updatedBy: 'Laura Sánchez'
    },
    linkedTreatments: [
      { id: 'treat-001-03', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'completed', completedAt: '2026-01-22T09:25:00Z', completedBy: 'Laura Sánchez' }
    ]
  },
  {
    id: 'apt-001-04',
    date: '2026-01-28',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    patientId: 'pat-001',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Control post-obturación',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 420000,
    consultationDuration: 900000,
    soapNotes: {
      subjective: 'Sin molestias tras tratamiento.',
      objective: 'Obturación en buen estado. Oclusión correcta. Sin sensibilidad.',
      assessment: 'Evolución favorable.',
      plan: 'Alta. Próxima revisión en 6 meses.',
      updatedAt: '2026-01-28T10:30:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-001-04', treatmentCode: 'CTR', description: 'Control post-operatorio', amount: '0 €', status: 'completed', completedAt: '2026-01-28T10:25:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },

  // --- Carlos Rodríguez (pat-002) - 3 citas pasadas ---
  {
    id: 'apt-002-01',
    date: '2026-01-10',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    patientId: 'pat-002',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión y presupuesto',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 600000,
    consultationDuration: 1500000,
    soapNotes: {
      subjective: 'Paciente refiere dolor intermitente en molar inferior derecho.',
      objective: 'Caries profunda en 36 con compromiso pulpar. RX confirma lesión periapical.',
      assessment: 'Pulpitis irreversible 36. Requiere endodoncia.',
      plan: 'Endodoncia 36 programada. Presupuesto entregado y aceptado con financiación.',
      updatedAt: '2026-01-10T10:30:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-002-01', treatmentCode: 'REV', description: 'Revisión y diagnóstico', amount: '45 €', status: 'completed', completedAt: '2026-01-10T10:25:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-002-02',
    date: '2026-01-17',
    startTime: '16:00',
    endTime: '17:30',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    patientId: 'pat-002',
    professional: 'Dr. Francisco Moreno',
    reason: 'Endodoncia 36 - 1ª sesión',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 480000,
    consultationDuration: 4500000,
    paymentInfo: { totalAmount: 320, paidAmount: 106.67, pendingAmount: 213.33, currency: '€' },
    installmentPlan: { totalInstallments: 3, currentInstallment: 1, amountPerInstallment: 106.67 },
    soapNotes: {
      subjective: 'Paciente nervioso pero colaborador.',
      objective: 'Anestesia troncular. Apertura cameral. Conductometría: 3 conductos. Instrumentación.',
      assessment: 'Primera fase completada. Medicación intraconducto.',
      plan: 'Segunda sesión en 1 semana para obturación.',
      updatedAt: '2026-01-17T17:30:00Z',
      updatedBy: 'Dr. Francisco Moreno'
    },
    linkedTreatments: [
      { id: 'treat-002-02', treatmentCode: 'END', description: 'Endodoncia 36 - Fase 1', amount: '160 €', pieceNumber: 36, status: 'completed', completedAt: '2026-01-17T17:20:00Z', completedBy: 'Dr. Francisco Moreno' }
    ]
  },
  {
    id: 'apt-002-03',
    date: '2026-01-24',
    startTime: '16:00',
    endTime: '17:00',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    patientId: 'pat-002',
    professional: 'Dr. Francisco Moreno',
    reason: 'Endodoncia 36 - 2ª sesión',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 300000,
    consultationDuration: 3000000,
    paymentInfo: { totalAmount: 320, paidAmount: 213.34, pendingAmount: 106.66, currency: '€' },
    installmentPlan: { totalInstallments: 3, currentInstallment: 2, amountPerInstallment: 106.67 },
    soapNotes: {
      subjective: 'Sin dolor desde última sesión.',
      objective: 'Obturación de conductos con gutapercha. Sellado provisional.',
      assessment: 'Endodoncia completada satisfactoriamente.',
      plan: 'Corona definitiva en 2-3 semanas. Reconstrucción previa.',
      updatedAt: '2026-01-24T17:00:00Z',
      updatedBy: 'Dr. Francisco Moreno'
    },
    linkedTreatments: [
      { id: 'treat-002-03', treatmentCode: 'END', description: 'Endodoncia 36 - Fase 2', amount: '160 €', pieceNumber: 36, status: 'completed', completedAt: '2026-01-24T16:55:00Z', completedBy: 'Dr. Francisco Moreno' }
    ]
  },

  // --- Ana Martínez VIP (pat-003) - 3 citas pasadas ---
  {
    id: 'apt-003-01',
    date: '2026-01-06',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Ana Martínez Sánchez',
    patientPhone: '634 567 890',
    patientAge: 28,
    patientId: 'pat-003',
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign mensual',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 180000,
    consultationDuration: 1200000,
    soapNotes: {
      subjective: 'Tratamiento progresando bien. Sin molestias.',
      objective: 'Cambio a alineador #8. Ajuste perfecto. IPR realizado en 12-22.',
      assessment: 'Progreso según planificación.',
      plan: 'Siguiente revisión en 4 semanas. Continuar con alineadores.',
      updatedAt: '2026-01-06T09:30:00Z',
      updatedBy: 'Dra. Elena Navarro'
    },
    linkedTreatments: [
      { id: 'treat-003-01', treatmentCode: 'INV', description: 'Revisión Invisalign', amount: '0 €', status: 'completed', completedAt: '2026-01-06T09:25:00Z', completedBy: 'Dra. Elena Navarro', notes: 'Incluido en tratamiento' }
    ]
  },
  {
    id: 'apt-003-02',
    date: '2026-01-13',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Ana Martínez Sánchez',
    patientPhone: '634 567 890',
    patientAge: 28,
    patientId: 'pat-003',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza dental',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 240000,
    consultationDuration: 1500000,
    soapNotes: {
      subjective: 'Paciente VIP. Limpieza rutinaria durante ortodoncia.',
      objective: 'Limpieza supragingival. Eliminación de placa en zonas de ataches.',
      assessment: 'Higiene excelente.',
      plan: 'Continuar con rutina de higiene. Uso de cepillo interdental.',
      updatedAt: '2026-01-13T09:30:00Z',
      updatedBy: 'Laura Sánchez'
    },
    linkedTreatments: [
      { id: 'treat-003-02', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'completed', completedAt: '2026-01-13T09:25:00Z', completedBy: 'Laura Sánchez' }
    ]
  },
  {
    id: 'apt-003-03',
    date: '2026-01-27',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Ana Martínez Sánchez',
    patientPhone: '634 567 890',
    patientAge: 28,
    patientId: 'pat-003',
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign mensual',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 120000,
    consultationDuration: 1200000,
    soapNotes: {
      subjective: 'Progreso excelente. Muy contenta con resultados.',
      objective: 'Cambio a alineador #10. Tracking perfecto.',
      assessment: 'Tratamiento al 50%. Evolución muy favorable.',
      plan: 'Continuar plan. Próxima en 4 semanas.',
      updatedAt: '2026-01-27T09:30:00Z',
      updatedBy: 'Dra. Elena Navarro'
    },
    linkedTreatments: [
      { id: 'treat-003-03', treatmentCode: 'INV', description: 'Revisión Invisalign', amount: '0 €', status: 'completed', completedAt: '2026-01-27T09:25:00Z', completedBy: 'Dra. Elena Navarro' }
    ]
  },

  // --- Pablo López - Pediátrico (pat-004) - 2 citas pasadas ---
  {
    id: 'apt-004-01',
    date: '2026-01-09',
    startTime: '17:00',
    endTime: '17:30',
    patientName: 'Pablo López García',
    patientPhone: '645 678 901',
    patientAge: 12,
    patientId: 'pat-004',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión pediátrica',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 600000,
    consultationDuration: 1200000,
    soapNotes: {
      subjective: 'Acompañado por madre. Sin molestias.',
      objective: 'Dentición mixta completa. Molares permanentes erupcionados. Sin caries.',
      assessment: 'Desarrollo normal. Candidato a selladores.',
      plan: 'Selladores en 16, 26, 36, 46. Aplicación de flúor.',
      updatedAt: '2026-01-09T17:30:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-004-01', treatmentCode: 'REV', description: 'Revisión pediátrica', amount: '35 €', status: 'completed', completedAt: '2026-01-09T17:25:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-004-02',
    date: '2026-01-23',
    startTime: '17:00',
    endTime: '17:45',
    patientName: 'Pablo López García',
    patientPhone: '645 678 901',
    patientAge: 12,
    patientId: 'pat-004',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Selladores molares',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 420000,
    consultationDuration: 2100000,
    soapNotes: {
      subjective: 'Paciente colaborador.',
      objective: 'Selladores de fisuras en 16, 26, 36, 46. Técnica adhesiva.',
      assessment: 'Tratamiento completado. Buena retención.',
      plan: 'Control en 6 meses. Aplicación de flúor en próxima visita.',
      updatedAt: '2026-01-23T17:45:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-004-02', treatmentCode: 'SEL', description: 'Selladores molares x4', amount: '60 €', status: 'completed', completedAt: '2026-01-23T17:40:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },

  // --- Laura Fernández - Ortodoncia (pat-005) - 2 citas pasadas ---
  {
    id: 'apt-005-01',
    date: '2026-01-07',
    startTime: '11:00',
    endTime: '11:30',
    patientName: 'Laura Fernández Ruiz',
    patientPhone: '656 789 012',
    patientAge: 23,
    patientId: 'pat-005',
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 300000,
    consultationDuration: 1200000,
    soapNotes: {
      subjective: 'Paciente satisfecha con progreso.',
      objective: 'Cambio de alineadores. Tracking correcto.',
      assessment: 'Evolución según plan.',
      plan: 'Continuar tratamiento.',
      updatedAt: '2026-01-07T11:30:00Z',
      updatedBy: 'Dra. Elena Navarro'
    },
    linkedTreatments: [
      { id: 'treat-005-01', treatmentCode: 'INV', description: 'Revisión Invisalign', amount: '0 €', status: 'completed', completedAt: '2026-01-07T11:25:00Z', completedBy: 'Dra. Elena Navarro' }
    ]
  },
  {
    id: 'apt-005-02',
    date: '2026-01-21',
    startTime: '11:00',
    endTime: '11:30',
    patientName: 'Laura Fernández Ruiz',
    patientPhone: '656 789 012',
    patientAge: 23,
    patientId: 'pat-005',
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 240000,
    consultationDuration: 1200000,
    soapNotes: {
      subjective: 'Sin problemas con alineadores.',
      objective: 'Progreso favorable. IPR adicional realizado.',
      assessment: 'Tratamiento en fase media.',
      plan: 'Próxima revisión en 2 semanas.',
      updatedAt: '2026-01-21T11:30:00Z',
      updatedBy: 'Dra. Elena Navarro'
    },
    linkedTreatments: [
      { id: 'treat-005-02', treatmentCode: 'INV', description: 'Revisión Invisalign', amount: '0 €', status: 'completed', completedAt: '2026-01-21T11:25:00Z', completedBy: 'Dra. Elena Navarro' }
    ]
  },

  // --- Javier Moreno - Con deuda (pat-006) - 2 citas pasadas ---
  {
    id: 'apt-006-01',
    date: '2026-01-14',
    startTime: '12:00',
    endTime: '12:30',
    patientName: 'Javier Moreno Torres',
    patientPhone: '667 890 123',
    patientAge: 56,
    patientId: 'pat-006',
    professional: 'Dra. Carmen Díaz',
    reason: 'Valoración periodontal',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 540000,
    consultationDuration: 1500000,
    soapNotes: {
      subjective: 'Sangrado de encías al cepillado. Sensibilidad.',
      objective: 'Periodontitis moderada generalizada. Bolsas de 4-5mm.',
      assessment: 'Requiere tratamiento periodontal por cuadrantes.',
      plan: 'Presupuesto periodontal. Inicio con cuadrante 1.',
      updatedAt: '2026-01-14T12:30:00Z',
      updatedBy: 'Dra. Carmen Díaz'
    },
    linkedTreatments: [
      { id: 'treat-006-01', treatmentCode: 'VAL', description: 'Valoración periodontal', amount: '50 €', status: 'completed', completedAt: '2026-01-14T12:25:00Z', completedBy: 'Dra. Carmen Díaz' }
    ]
  },
  {
    id: 'apt-006-02',
    date: '2026-01-28',
    startTime: '11:30',
    endTime: '12:30',
    patientName: 'Javier Moreno Torres',
    patientPhone: '667 890 123',
    patientAge: 56,
    patientId: 'pat-006',
    professional: 'Dra. Carmen Díaz',
    reason: 'Raspado cuadrante 1',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 480000,
    consultationDuration: 3000000,
    soapNotes: {
      subjective: 'Paciente motivado para tratamiento.',
      objective: 'Raspado y alisado radicular Q1. Irrigación con clorhexidina.',
      assessment: 'Primera fase completada.',
      plan: 'Continuar con Q2 en 2 semanas. Mantener higiene estricta.',
      updatedAt: '2026-01-28T12:30:00Z',
      updatedBy: 'Dra. Carmen Díaz'
    },
    linkedTreatments: [
      { id: 'treat-006-02', treatmentCode: 'RAR', description: 'Raspado cuadrante 1', amount: '120 €', status: 'completed', completedAt: '2026-01-28T12:25:00Z', completedBy: 'Dra. Carmen Díaz' }
    ]
  },

  // --- Sofía Navarro - Implante (pat-007) - 2 citas pasadas ---
  {
    id: 'apt-007-01',
    date: '2026-01-08',
    startTime: '12:00',
    endTime: '12:30',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    patientId: 'pat-007',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Consulta implante',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 360000,
    consultationDuration: 1500000,
    soapNotes: {
      subjective: 'Pérdida de pieza 36 por fractura. Desea implante.',
      objective: 'Zona edéntula 36 cicatrizada. Hueso aparentemente suficiente.',
      assessment: 'Candidata a implante unitario.',
      plan: 'TAC previo. Planificación quirúrgica.',
      updatedAt: '2026-01-08T12:30:00Z',
      updatedBy: 'Dr. Miguel Á. Torres'
    },
    linkedTreatments: [
      { id: 'treat-007-01', treatmentCode: 'CON', description: 'Consulta implantes', amount: '45 €', status: 'completed', completedAt: '2026-01-08T12:25:00Z', completedBy: 'Dr. Miguel Á. Torres' }
    ]
  },
  {
    id: 'apt-007-02',
    date: '2026-01-22',
    startTime: '16:00',
    endTime: '17:30',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    patientId: 'pat-007',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Colocación implante 36',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 480000,
    consultationDuration: 4500000,
    soapNotes: {
      subjective: 'Paciente algo nerviosa pero colaboradora.',
      objective: 'Implante Straumann 4.1x10mm insertado en posición 36. Torque 35Ncm.',
      assessment: 'Cirugía sin complicaciones. Estabilidad primaria excelente.',
      plan: 'Control a 7 días. Osteointegración 3 meses.',
      updatedAt: '2026-01-22T17:30:00Z',
      updatedBy: 'Dr. Miguel Á. Torres'
    },
    linkedTreatments: [
      { id: 'treat-007-02', treatmentCode: 'IMP', description: 'Implante dental', amount: '800 €', pieceNumber: 36, status: 'completed', completedAt: '2026-01-22T17:20:00Z', completedBy: 'Dr. Miguel Á. Torres', fromBudgetId: 'budget-007-01' }
    ],
    attachments: [
      { id: 'att-007-01', name: 'TAC-implante-36.jpg', type: 'xray', url: '/attachments/tac-007-01.jpg', uploadedAt: '2026-01-15T10:00:00Z', uploadedBy: 'Dr. Miguel Á. Torres' }
    ]
  },

  // --- Miguel Gómez - Implantes múltiples (pat-008) - 3 citas pasadas ---
  {
    id: 'apt-008-01',
    date: '2026-01-03',
    startTime: '10:00',
    endTime: '11:30',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    patientId: 'pat-008',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Implante 46 - Fase 1',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 420000,
    consultationDuration: 4200000,
    paymentInfo: { totalAmount: 1200, paidAmount: 400, pendingAmount: 800, currency: '€' },
    installmentPlan: { totalInstallments: 12, currentInstallment: 4, amountPerInstallment: 100 },
    soapNotes: {
      subjective: 'Segunda fase de tratamiento implantológico.',
      objective: 'Implante 46 colocado. Torque 40Ncm.',
      assessment: 'Procedimiento exitoso.',
      plan: 'Osteointegración. Segunda cirugía en 3-4 meses.',
      updatedAt: '2026-01-03T11:30:00Z',
      updatedBy: 'Dr. Miguel Á. Torres'
    },
    linkedTreatments: [
      { id: 'treat-008-01', treatmentCode: 'IMP', description: 'Implante 46 - Fase 1', amount: '800 €', pieceNumber: 46, status: 'completed', completedAt: '2026-01-03T11:20:00Z', completedBy: 'Dr. Miguel Á. Torres' }
    ]
  },
  {
    id: 'apt-008-02',
    date: '2026-01-10',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    patientId: 'pat-008',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Control post-implante',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 300000,
    consultationDuration: 900000,
    soapNotes: {
      subjective: 'Sin dolor. Ligera inflamación.',
      objective: 'Cicatrización correcta. Sin signos de infección.',
      assessment: 'Evolución favorable.',
      plan: 'Continuar con cuidados. Control en 2 semanas.',
      updatedAt: '2026-01-10T10:30:00Z',
      updatedBy: 'Dr. Miguel Á. Torres'
    },
    linkedTreatments: [
      { id: 'treat-008-02', treatmentCode: 'CTR', description: 'Control post-implante', amount: '0 €', status: 'completed', completedAt: '2026-01-10T10:25:00Z', completedBy: 'Dr. Miguel Á. Torres' }
    ]
  },
  {
    id: 'apt-008-03',
    date: '2026-01-24',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    patientId: 'pat-008',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Control osteointegración',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 360000,
    consultationDuration: 1200000,
    paymentInfo: { totalAmount: 1200, paidAmount: 500, pendingAmount: 700, currency: '€' },
    installmentPlan: { totalInstallments: 12, currentInstallment: 5, amountPerInstallment: 100 },
    soapNotes: {
      subjective: 'Sin molestias.',
      objective: 'Osteointegración en progreso. RX control satisfactoria.',
      assessment: 'Evolución correcta.',
      plan: 'Segunda fase en 2 meses.',
      updatedAt: '2026-01-24T10:30:00Z',
      updatedBy: 'Dr. Miguel Á. Torres'
    },
    linkedTreatments: [
      { id: 'treat-008-03', treatmentCode: 'CTR', description: 'Control osteointegración', amount: '0 €', status: 'completed', completedAt: '2026-01-24T10:25:00Z', completedBy: 'Dr. Miguel Á. Torres' }
    ]
  },

  // --- Elena Vega - Nueva (pat-009) - 1 cita pasada ---
  {
    id: 'apt-009-01',
    date: '2026-01-20',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
    patientAge: 29,
    patientId: 'pat-009',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Primera visita - Consulta blanqueamiento',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 480000,
    consultationDuration: 1500000,
    soapNotes: {
      subjective: 'Desea blanqueamiento. Dientes amarillentos por café.',
      objective: 'Tinciones extrínsecas moderadas. Color A3.',
      assessment: 'Candidata a blanqueamiento LED.',
      plan: 'Limpieza previa + blanqueamiento LED 2 sesiones.',
      updatedAt: '2026-01-20T09:30:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-009-01', treatmentCode: 'CON', description: 'Primera consulta', amount: '0 €', status: 'completed', completedAt: '2026-01-20T09:25:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },

  // --- Carmen Ruiz - Mayor (pat-012) - 2 citas pasadas ---
  {
    id: 'apt-012-01',
    date: '2026-01-16',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'Carmen Ruiz Jiménez',
    patientPhone: '690 123 456',
    patientAge: 67,
    patientId: 'pat-012',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Control post-endodoncia',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 360000,
    consultationDuration: 1200000,
    soapNotes: {
      subjective: 'Sin molestias en pieza tratada.',
      objective: 'RX control: periápice en resolución. Corona estable.',
      assessment: 'Evolución favorable.',
      plan: 'Siguiente control en 6 meses.',
      updatedAt: '2026-01-16T10:30:00Z',
      updatedBy: 'Dr. Antonio Ruiz'
    },
    linkedTreatments: [
      { id: 'treat-012-01', treatmentCode: 'CTR', description: 'Control endodoncia', amount: '0 €', pieceNumber: 25, status: 'completed', completedAt: '2026-01-16T10:25:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },

  // --- Más citas pasadas para otros pacientes ---
  {
    id: 'apt-010-01',
    date: '2026-01-15',
    startTime: '17:00',
    endTime: '17:30',
    patientName: 'Antonio Pérez Molina',
    patientPhone: '623 456 789',
    patientAge: 51,
    patientId: 'pat-010',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza dental',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 540000,
    consultationDuration: 1800000,
    linkedTreatments: [
      { id: 'treat-010-01', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'completed', completedAt: '2026-01-15T17:25:00Z', completedBy: 'Laura Sánchez' }
    ]
  },
  {
    id: 'apt-011-01',
    date: '2026-01-20',
    startTime: '12:00',
    endTime: '13:00',
    patientName: 'David Sánchez Martín',
    patientPhone: '689 012 345',
    patientAge: 42,
    patientId: 'pat-011',
    professional: 'Dra. Carmen Díaz',
    reason: 'Tratamiento periodontal - Fase 1',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 420000,
    consultationDuration: 3000000,
    paymentInfo: { totalAmount: 180, paidAmount: 50, pendingAmount: 130, currency: '€' },
    linkedTreatments: [
      { id: 'treat-011-01', treatmentCode: 'PER', description: 'Periodontal fase 1', amount: '180 €', status: 'completed', completedAt: '2026-01-20T12:55:00Z', completedBy: 'Dra. Carmen Díaz' }
    ]
  },
  {
    id: 'apt-013-01',
    date: '2026-01-27',
    startTime: '18:00',
    endTime: '18:30',
    patientName: 'Marta Alonso Blanco',
    patientPhone: '634 567 890',
    patientAge: 36,
    patientId: 'pat-013',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión pre-empaste',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 300000,
    consultationDuration: 1200000,
    linkedTreatments: [
      { id: 'treat-013-01', treatmentCode: 'REV', description: 'Revisión', amount: '40 €', status: 'completed', completedAt: '2026-01-27T18:25:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-014-01',
    date: '2026-01-13',
    startTime: '18:30',
    endTime: '19:00',
    patientName: 'Fernando Díaz Ortega',
    patientPhone: '645 678 901',
    patientAge: 44,
    patientId: 'pat-014',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Toma impresiones férula',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 360000,
    consultationDuration: 1500000,
    linkedTreatments: [
      { id: 'treat-014-01', treatmentCode: 'IMP', description: 'Impresiones férula', amount: '50 €', status: 'completed', completedAt: '2026-01-13T18:55:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-015-01',
    date: '2026-01-06',
    startTime: '19:00',
    endTime: '19:30',
    patientName: 'Beatriz Muñoz Serrano',
    patientPhone: '656 789 012',
    patientAge: 33,
    patientId: 'pat-015',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza semestral',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 420000,
    consultationDuration: 1500000,
    linkedTreatments: [
      { id: 'treat-015-01', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'completed', completedAt: '2026-01-06T19:25:00Z', completedBy: 'Laura Sánchez' }
    ]
  },

  // ============================================
  // HOY - 31 de enero de 2026
  // 15 citas con diferentes estados de visita
  // ============================================
  
  // Completadas (3)
  {
    id: 'apt-today-01',
    date: '2026-01-31',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    patientId: 'pat-001',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza semestral',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 420000,
    consultationDuration: 1800000,
    linkedTreatments: [
      { id: 'treat-today-01', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'completed', completedAt: '2026-01-31T09:25:00Z', completedBy: 'Laura Sánchez' }
    ]
  },
  {
    id: 'apt-today-02',
    date: '2026-01-31',
    startTime: '09:00',
    endTime: '09:45',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    patientId: 'pat-002',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Reconstrucción post-endodoncia',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 360000,
    consultationDuration: 2400000,
    paymentInfo: { totalAmount: 320, paidAmount: 320, pendingAmount: 0, currency: '€' },
    installmentPlan: { totalInstallments: 3, currentInstallment: 3, amountPerInstallment: 106.67 },
    linkedTreatments: [
      { id: 'treat-today-02', treatmentCode: 'REC', description: 'Reconstrucción composite', amount: '120 €', pieceNumber: 36, status: 'completed', completedAt: '2026-01-31T09:40:00Z', completedBy: 'Dr. Antonio Ruiz' }
    ]
  },
  {
    id: 'apt-today-03',
    date: '2026-01-31',
    startTime: '09:30',
    endTime: '10:00',
    patientName: 'Pablo López García',
    patientPhone: '645 678 901',
    patientAge: 12,
    patientId: 'pat-004',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Aplicación de flúor',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'completed',
    completed: true,
    confirmed: true,
    waitingDuration: 300000,
    consultationDuration: 1200000,
    linkedTreatments: [
      { id: 'treat-today-03', treatmentCode: 'FLU', description: 'Aplicación flúor', amount: '35 €', status: 'completed', completedAt: '2026-01-31T09:55:00Z', completedBy: 'Laura Sánchez' }
    ]
  },

  // En consulta (2)
  {
    id: 'apt-today-04',
    date: '2026-01-31',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'Ana Martínez Sánchez',
    patientPhone: '634 567 890',
    patientAge: 28,
    patientId: 'pat-003',
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'in_consultation',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-04', treatmentCode: 'INV', description: 'Revisión Invisalign', amount: '0 €', status: 'in_progress' }
    ]
  },
  {
    id: 'apt-today-05',
    date: '2026-01-31',
    startTime: '10:00',
    endTime: '11:00',
    patientName: 'Laura Fernández Ruiz',
    patientPhone: '656 789 012',
    patientAge: 23,
    patientId: 'pat-005',
    professional: 'Dra. Elena Navarro',
    reason: 'Ajuste Invisalign',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'in_consultation',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-05', treatmentCode: 'INV', description: 'Ajuste Invisalign', amount: '0 €', status: 'in_progress' }
    ]
  },

  // Llamar paciente (2)
  {
    id: 'apt-today-06',
    date: '2026-01-31',
    startTime: '10:30',
    endTime: '11:00',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    patientId: 'pat-007',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Control post-implante 7 días',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'call_patient',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-06', treatmentCode: 'CTR', description: 'Control implante', amount: '0 €', pieceNumber: 36, status: 'pending' }
    ]
  },
  {
    id: 'apt-today-07',
    date: '2026-01-31',
    startTime: '11:00',
    endTime: '11:30',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
    patientAge: 29,
    patientId: 'pat-009',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza pre-blanqueamiento',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'call_patient',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-07', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'pending' }
    ]
  },

  // En sala de espera (4)
  {
    id: 'apt-today-08',
    date: '2026-01-31',
    startTime: '11:30',
    endTime: '12:30',
    patientName: 'Javier Moreno Torres',
    patientPhone: '667 890 123',
    patientAge: 56,
    patientId: 'pat-006',
    professional: 'Dra. Carmen Díaz',
    reason: 'Raspado cuadrante 2',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'waiting_room',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-08', treatmentCode: 'RAR', description: 'Raspado cuadrante 2', amount: '120 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-today-09',
    date: '2026-01-31',
    startTime: '12:00',
    endTime: '12:30',
    patientName: 'Carmen Ruiz Jiménez',
    patientPhone: '690 123 456',
    patientAge: 67,
    patientId: 'pat-012',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión semestral',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'waiting_room',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-09', treatmentCode: 'REV', description: 'Revisión', amount: '40 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-today-10',
    date: '2026-01-31',
    startTime: '12:00',
    endTime: '13:00',
    patientName: 'David Sánchez Martín',
    patientPhone: '689 012 345',
    patientAge: 42,
    patientId: 'pat-011',
    professional: 'Dra. Carmen Díaz',
    reason: 'Periodontal fase 2',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'waiting_room',
    confirmed: true,
    paymentInfo: { totalAmount: 180, paidAmount: 50, pendingAmount: 130, currency: '€' },
    linkedTreatments: [
      { id: 'treat-today-10', treatmentCode: 'PER', description: 'Periodontal fase 2', amount: '180 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-today-11',
    date: '2026-01-31',
    startTime: '12:30',
    endTime: '13:00',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    patientId: 'pat-008',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Control implante + Pago cuota',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'waiting_room',
    confirmed: true,
    paymentInfo: { totalAmount: 1200, paidAmount: 500, pendingAmount: 700, currency: '€' },
    installmentPlan: { totalInstallments: 12, currentInstallment: 6, amountPerInstallment: 100 },
    linkedTreatments: [
      { id: 'treat-today-11', treatmentCode: 'CTR', description: 'Control implante', amount: '0 €', pieceNumber: 46, status: 'pending' }
    ]
  },

  // Programadas - tarde (4)
  {
    id: 'apt-today-12',
    date: '2026-01-31',
    startTime: '16:00',
    endTime: '17:00',
    patientName: 'Marta Alonso Blanco',
    patientPhone: '634 567 890',
    patientAge: 36,
    patientId: 'pat-013',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Empaste molar 16',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    visitStatus: 'scheduled',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-12', treatmentCode: 'EMP', description: 'Empaste composite', amount: '85 €', pieceNumber: 16, status: 'pending' }
    ]
  },
  {
    id: 'apt-today-13',
    date: '2026-01-31',
    startTime: '17:00',
    endTime: '17:30',
    patientName: 'Fernando Díaz Ortega',
    patientPhone: '645 678 901',
    patientAge: 44,
    patientId: 'pat-014',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Entrega férula de descarga',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    visitStatus: 'scheduled',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-13', treatmentCode: 'FER', description: 'Entrega férula', amount: '300 €', status: 'pending', fromBudgetId: 'budget-014-01' }
    ]
  },
  {
    id: 'apt-today-14',
    date: '2026-01-31',
    startTime: '17:30',
    endTime: '18:00',
    patientName: 'Beatriz Muñoz Serrano',
    patientPhone: '656 789 012',
    patientAge: 33,
    patientId: 'pat-015',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión anual',
    status: 'No confirmada',
    box: 'box 2',
    charge: 'Si',
    bgColor: 'var(--color-event-coral)',
    visitStatus: 'scheduled',
    linkedTreatments: [
      { id: 'treat-today-14', treatmentCode: 'REV', description: 'Revisión anual', amount: '40 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-today-15',
    date: '2026-01-31',
    startTime: '18:00',
    endTime: '19:00',
    patientName: 'Antonio Pérez Molina',
    patientPhone: '623 456 789',
    patientAge: 51,
    patientId: 'pat-010',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Extracción molar 47',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-purple)',
    visitStatus: 'scheduled',
    confirmed: true,
    linkedTreatments: [
      { id: 'treat-today-15', treatmentCode: 'EXT', description: 'Extracción molar', amount: '90 €', pieceNumber: 47, status: 'pending' }
    ]
  },

  // ============================================
  // CITAS FUTURAS (1-7 Febrero 2026)
  // ============================================
  
  // 1 Feb
  {
    id: 'apt-fut-01',
    date: '2026-02-01',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Ana Martínez Sánchez',
    patientPhone: '634 567 890',
    patientAge: 28,
    patientId: 'pat-003',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza mensual (ortodoncia)',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    linkedTreatments: [
      { id: 'treat-fut-01', treatmentCode: 'LDE', description: 'Limpieza dental', amount: '72 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-02',
    date: '2026-02-02',
    startTime: '10:00',
    endTime: '11:00',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
    patientAge: 29,
    patientId: 'pat-009',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Blanqueamiento LED - Sesión 1',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    linkedTreatments: [
      { id: 'treat-fut-02', treatmentCode: 'BLA', description: 'Blanqueamiento LED', amount: '250 €', status: 'pending', fromBudgetId: 'budget-009-01' }
    ]
  },
  
  // 3 Feb
  {
    id: 'apt-fut-03',
    date: '2026-02-03',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Laura Fernández Ruiz',
    patientPhone: '656 789 012',
    patientAge: 23,
    patientId: 'pat-005',
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    linkedTreatments: [
      { id: 'treat-fut-03', treatmentCode: 'INV', description: 'Revisión Invisalign', amount: '0 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-04',
    date: '2026-02-03',
    startTime: '11:00',
    endTime: '12:00',
    patientName: 'Javier Moreno Torres',
    patientPhone: '667 890 123',
    patientAge: 56,
    patientId: 'pat-006',
    professional: 'Dra. Carmen Díaz',
    reason: 'Raspado cuadrante 3',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    linkedTreatments: [
      { id: 'treat-fut-04', treatmentCode: 'RAR', description: 'Raspado cuadrante 3', amount: '120 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-05',
    date: '2026-02-03',
    startTime: '16:00',
    endTime: '17:00',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    patientId: 'pat-002',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Corona 36 - Toma impresiones',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    linkedTreatments: [
      { id: 'treat-fut-05', treatmentCode: 'COR', description: 'Impresiones corona', amount: '50 €', pieceNumber: 36, status: 'pending', fromBudgetId: 'budget-002-01' }
    ]
  },

  // 4 Feb
  {
    id: 'apt-fut-06',
    date: '2026-02-04',
    startTime: '10:00',
    endTime: '10:30',
    patientName: 'Pablo López García',
    patientPhone: '645 678 901',
    patientAge: 12,
    patientId: 'pat-004',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Aplicación de flúor',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)',
    linkedTreatments: [
      { id: 'treat-fut-06', treatmentCode: 'FLU', description: 'Flúor tópico', amount: '35 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-07',
    date: '2026-02-04',
    startTime: '11:00',
    endTime: '12:00',
    patientName: 'David Sánchez Martín',
    patientPhone: '689 012 345',
    patientAge: 42,
    patientId: 'pat-011',
    professional: 'Dra. Carmen Díaz',
    reason: 'Periodontal fase 3',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    linkedTreatments: [
      { id: 'treat-fut-07', treatmentCode: 'PER', description: 'Periodontal fase 3', amount: '180 €', status: 'pending' }
    ]
  },

  // 5 Feb
  {
    id: 'apt-fut-08',
    date: '2026-02-05',
    startTime: '09:00',
    endTime: '10:00',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    patientId: 'pat-007',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Control cicatrización implante',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    linkedTreatments: [
      { id: 'treat-fut-08', treatmentCode: 'CTR', description: 'Control implante', amount: '0 €', pieceNumber: 36, status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-09',
    date: '2026-02-05',
    startTime: '16:00',
    endTime: '17:00',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    patientId: 'pat-008',
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Control osteointegración + Pago',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    paymentInfo: { totalAmount: 1200, paidAmount: 600, pendingAmount: 600, currency: '€' },
    installmentPlan: { totalInstallments: 12, currentInstallment: 7, amountPerInstallment: 100 },
    linkedTreatments: [
      { id: 'treat-fut-09', treatmentCode: 'CTR', description: 'Control implante', amount: '0 €', pieceNumber: 46, status: 'pending' }
    ]
  },

  // 6 Feb
  {
    id: 'apt-fut-10',
    date: '2026-02-06',
    startTime: '10:00',
    endTime: '11:00',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
    patientAge: 29,
    patientId: 'pat-009',
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Blanqueamiento LED - Sesión 2',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)',
    linkedTreatments: [
      { id: 'treat-fut-10', treatmentCode: 'BLA', description: 'Blanqueamiento sesión 2', amount: '0 €', status: 'pending', notes: 'Incluido en presupuesto' }
    ]
  },
  {
    id: 'apt-fut-11',
    date: '2026-02-06',
    startTime: '17:00',
    endTime: '18:00',
    patientName: 'Fernando Díaz Ortega',
    patientPhone: '645 678 901',
    patientAge: 44,
    patientId: 'pat-014',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Control férula + Ajuste',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    linkedTreatments: [
      { id: 'treat-fut-11', treatmentCode: 'CTR', description: 'Control férula', amount: '0 €', status: 'pending' }
    ]
  },

  // 7 Feb
  {
    id: 'apt-fut-12',
    date: '2026-02-07',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    patientId: 'pat-001',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión 6 meses',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)',
    linkedTreatments: [
      { id: 'treat-fut-12', treatmentCode: 'REV', description: 'Revisión semestral', amount: '45 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-13',
    date: '2026-02-07',
    startTime: '11:00',
    endTime: '12:00',
    patientName: 'Javier Moreno Torres',
    patientPhone: '667 890 123',
    patientAge: 56,
    patientId: 'pat-006',
    professional: 'Dra. Carmen Díaz',
    reason: 'Raspado cuadrante 4',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada', 'deuda'],
    bgColor: 'var(--color-event-coral)',
    linkedTreatments: [
      { id: 'treat-fut-13', treatmentCode: 'RAR', description: 'Raspado cuadrante 4', amount: '120 €', status: 'pending' }
    ]
  },
  {
    id: 'apt-fut-14',
    date: '2026-02-07',
    startTime: '16:00',
    endTime: '17:30',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    patientId: 'pat-002',
    professional: 'Dr. Antonio Ruiz',
    reason: 'Cementado corona 36',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    linkedTreatments: [
      { id: 'treat-fut-14', treatmentCode: 'COR', description: 'Corona zirconio', amount: '450 €', pieceNumber: 36, status: 'pending', fromBudgetId: 'budget-002-01' }
    ]
  }
]

// ============================================
// DATOS INICIALES DE BLOQUEOS (MOCK DATA)
// ============================================

const INITIAL_BLOCKS: AgendaBlock[] = [
  {
    id: 'block-1',
    date: '2026-01-28',
    startTime: '14:00',
    endTime: '15:00',
    blockType: 'break',
    description: 'Descanso equipo',
    box: 'box 1'
  },
  {
    id: 'block-2',
    date: '2026-01-28',
    startTime: '14:00',
    endTime: '14:30',
    blockType: 'cleaning',
    description: 'Limpieza gabinete 2',
    box: 'box 2',
    responsibleName: 'Personal limpieza'
  },
  {
    id: 'block-3',
    date: '2026-01-29',
    startTime: '13:00',
    endTime: '14:00',
    blockType: 'meeting',
    description: 'Reunión equipo semanal',
    responsibleName: 'Dr. Antonio Ruiz'
  },
  {
    id: 'block-4',
    date: '2026-01-30',
    startTime: '08:30',
    endTime: '09:00',
    blockType: 'cleaning',
    description: 'Limpieza matutina',
    box: 'box 1',
    recurrence: {
      type: 'daily',
      endDate: '2026-01-31'
    }
  },
  {
    id: 'block-5',
    date: '2026-01-31',
    startTime: '14:00',
    endTime: '14:30',
    blockType: 'maintenance',
    description: 'Revisión equipo RX',
    box: 'box 3',
    responsibleName: 'Técnico externo'
  }
]

// ============================================
// CONTEXTO
// ============================================

type RegisterPaymentData = {
  appointmentId: string
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
  getAppointmentsByPatient: (patientId?: string, patientName?: string) => Appointment[]
  updateSOAPNotes: (appointmentId: string, notes: VisitSOAPNotes) => void
  updateLinkedTreatmentStatus: (
    appointmentId: string,
    treatmentId: string,
    status: LinkedTreatmentStatus,
    completedBy?: string
  ) => void
  addAttachment: (appointmentId: string, attachment: Omit<VisitAttachment, 'id'>) => void
  removeAttachment: (appointmentId: string, attachmentId: string) => void
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(
  undefined
)

// ============================================
// PROVIDER
// ============================================

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [blocks, setBlocks] = useState<AgendaBlock[]>(INITIAL_BLOCKS)

  // Agregar una nueva cita
  const addAppointment = useCallback(
    (appointmentData: Omit<Appointment, 'id'>) => {
      const newAppointment: Appointment = {
        ...appointmentData,
        id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      setAppointments((prev) => [...prev, newAppointment])
    },
    []
  )

  // Actualizar una cita existente
  const updateAppointment = useCallback(
    (id: string, updates: Partial<Appointment>) => {
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt))
      )
    },
    []
  )

  // Eliminar una cita
  const deleteAppointment = useCallback((id: string) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== id))
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
  }, [])

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
    },
    []
  )

  // Marcar cita como confirmada/no confirmada
  const toggleAppointmentConfirmed = useCallback(
    (id: string, confirmed: boolean) => {
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, confirmed } : apt))
      )
      console.log(
        `✅ Cita ${id} ${confirmed ? 'confirmada' : 'desconfirmada'}`
      )
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
                `⏱️ Duraciones finales registradas: Espera=${waitingDuration ? Math.round(waitingDuration / 60000) + 'min' : 'N/A'}, Consulta=${consultationDuration ? Math.round(consultationDuration / 60000) + 'min' : 'N/A'}`
              )
            }

            console.log(
              `✅ Estado de visita actualizado: ${apt.patientName} → ${newStatus} (${now.toLocaleTimeString('es-ES')})`
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
    },
    []
  )

  // Obtener conteo de citas por estado de visita para una fecha
  const getVisitStatusCounts = useCallback(
    (date: string): Record<VisitStatus, number> => {
      const appointmentsForDate = appointments.filter((apt) => apt.date === date)

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
    const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newBlock: AgendaBlock = {
      ...blockData,
      id: newId
    }
    setBlocks((prev) => [...prev, newBlock])

    // Si tiene recurrencia, generar bloques recurrentes
    if (blockData.recurrence && blockData.recurrence.type !== 'none') {
      const generatedBlocks = generateRecurringBlocks(newBlock)
      setBlocks((prev) => [...prev, ...generatedBlocks])
    }

    console.log('✅ Bloqueo creado:', newBlock)
    return newId
  }, [])

  // Actualizar un bloqueo existente
  const updateBlock = useCallback(
    (id: string, updates: Partial<AgendaBlock>) => {
      setBlocks((prev) =>
        prev.map((block) =>
          block.id === id ? { ...block, ...updates } : block
        )
      )
      console.log(`✅ Bloqueo ${id} actualizado`)
    },
    []
  )

  // Eliminar un bloqueo (opcionalmente eliminar toda la recurrencia)
  const deleteBlock = useCallback(
    (id: string, deleteRecurrence: boolean = false) => {
      setBlocks((prev) => {
        const blockToDelete = prev.find((b) => b.id === id)
        if (!blockToDelete) return prev

        if (deleteRecurrence && blockToDelete.parentBlockId) {
          // Eliminar todos los bloques con el mismo parentBlockId
          return prev.filter(
            (b) =>
              b.id !== id &&
              b.parentBlockId !== blockToDelete.parentBlockId &&
              b.id !== blockToDelete.parentBlockId
          )
        } else if (deleteRecurrence && !blockToDelete.parentBlockId) {
          // Este es el bloque padre, eliminar todos los hijos
          return prev.filter(
            (b) => b.id !== id && b.parentBlockId !== id
          )
        }

        // Solo eliminar este bloqueo
        return prev.filter((b) => b.id !== id)
      })
      console.log(
        `✅ Bloqueo ${id} eliminado${deleteRecurrence ? ' (con recurrencia)' : ''}`
      )
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
        if (patientName && apt.patientName.toLowerCase() === patientName.toLowerCase()) return true
        return false
      })
    },
    [appointments]
  )

  // Actualizar notas SOAP de una cita
  const updateSOAPNotes = useCallback(
    (appointmentId: string, notes: VisitSOAPNotes) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                soapNotes: {
                  ...apt.soapNotes,
                  ...notes,
                  updatedAt: new Date().toISOString()
                }
              }
            : apt
        )
      )
      console.log(`✅ Notas SOAP actualizadas para cita ${appointmentId}`)
    },
    []
  )

  // Actualizar estado de un tratamiento vinculado
  const updateLinkedTreatmentStatus = useCallback(
    (
      appointmentId: string,
      treatmentId: string,
      status: LinkedTreatmentStatus,
      completedBy?: string
    ) => {
      setAppointments((prev) =>
        prev.map((apt) => {
          if (apt.id !== appointmentId) return apt
          
          const updatedTreatments = apt.linkedTreatments?.map((t) =>
            t.id === treatmentId
              ? {
                  ...t,
                  status,
                  completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt,
                  completedBy: status === 'completed' ? completedBy : t.completedBy
                }
              : t
          )
          
          return { ...apt, linkedTreatments: updatedTreatments }
        })
      )
      console.log(`✅ Estado de tratamiento ${treatmentId} actualizado a ${status}`)
    },
    []
  )

  // Añadir archivo adjunto a una cita
  const addAttachment = useCallback(
    (appointmentId: string, attachment: Omit<VisitAttachment, 'id'>) => {
      const newAttachment: VisitAttachment = {
        ...attachment,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, attachments: [...(apt.attachments || []), newAttachment] }
            : apt
        )
      )
      console.log(`✅ Archivo adjunto añadido a cita ${appointmentId}`)
    },
    []
  )

  // Eliminar archivo adjunto de una cita
  const removeAttachment = useCallback(
    (appointmentId: string, attachmentId: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, attachments: apt.attachments?.filter((a) => a.id !== attachmentId) }
            : apt
        )
      )
      console.log(`✅ Archivo adjunto ${attachmentId} eliminado de cita ${appointmentId}`)
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
    removeAttachment
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
