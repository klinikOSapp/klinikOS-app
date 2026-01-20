'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState
} from 'react'

import type { VisitStatus, VisitStatusLog } from '@/components/agenda/types'

// Re-exportar tipos de visita para uso en otros componentes
export type { VisitStatus, VisitStatusLog }

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
}

// ============================================
// DATOS INICIALES (MOCK DATA)
// ============================================

const INITIAL_APPOINTMENTS: Appointment[] = [
  // 7 de enero de 2026
  {
    id: 'apt-1',
    date: '2026-01-07',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza dental',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'apt-2',
    date: '2026-01-07',
    startTime: '09:30',
    endTime: '10:00',
    patientName: 'Carlos Rodríguez Fernández',
    patientPhone: '623 456 789',
    patientAge: 45,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Empaste molar 36',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'apt-3',
    date: '2026-01-07',
    startTime: '10:00',
    endTime: '11:00',
    patientName: 'Ana Martínez Sánchez',
    patientPhone: '634 567 890',
    patientAge: 28,
    professional: 'Dr. Francisco Moreno',
    reason: 'Endodoncia (2ª sesión)',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    // Pago parcial: 1 de 3 cuotas pagadas
    paymentInfo: {
      totalAmount: 320,
      paidAmount: 106.67,
      pendingAmount: 213.33,
      currency: '€'
    },
    installmentPlan: {
      totalInstallments: 3,
      currentInstallment: 2,
      amountPerInstallment: 106.67
    }
  },
  {
    id: 'apt-4',
    date: '2026-01-07',
    startTime: '10:30',
    endTime: '11:00',
    patientName: 'Pablo López García',
    patientPhone: '645 678 901',
    patientAge: 12,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión anual',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'apt-5',
    date: '2026-01-07',
    startTime: '11:00',
    endTime: '11:30',
    patientName: 'Laura Fernández Ruiz',
    patientPhone: '656 789 012',
    patientAge: 23,
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'apt-6',
    date: '2026-01-07',
    startTime: '11:30',
    endTime: '12:00',
    patientName: 'Javier Moreno Torres',
    patientPhone: '667 890 123',
    patientAge: 56,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza profunda',
    status: 'No confirmada',
    box: 'box 2',
    charge: 'Si',
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'apt-7',
    date: '2026-01-07',
    startTime: '12:00',
    endTime: '12:30',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Radiografía panorámica',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-8',
    date: '2026-01-07',
    startTime: '12:00',
    endTime: '13:00',
    patientName: 'David Sánchez Martín',
    patientPhone: '689 012 345',
    patientAge: 42,
    professional: 'Dra. Carmen Díaz',
    reason: 'Tratamiento periodontal',
    status: 'No confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['deuda'],
    bgColor: 'var(--color-event-purple)',
    // Pago parcial SIN plan de cuotas (flexible)
    paymentInfo: {
      totalAmount: 180,
      paidAmount: 50,
      pendingAmount: 130,
      currency: '€'
    }
  },
  {
    id: 'apt-9',
    date: '2026-01-07',
    startTime: '13:00',
    endTime: '13:30',
    patientName: 'Carmen Ruiz Jiménez',
    patientPhone: '690 123 456',
    patientAge: 67,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Control post-endodoncia',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'apt-10',
    date: '2026-01-07',
    startTime: '16:00',
    endTime: '17:00',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Implante dental',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)',
    // Pago parcial: 5 de 12 cuotas pagadas
    paymentInfo: {
      totalAmount: 1200,
      paidAmount: 500,
      pendingAmount: 700,
      currency: '€'
    },
    installmentPlan: {
      totalInstallments: 12,
      currentInstallment: 6,
      amountPerInstallment: 100
    }
  },
  {
    id: 'apt-11',
    date: '2026-01-07',
    startTime: '16:30',
    endTime: '17:30',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
    patientAge: 29,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Blanqueamiento LED',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'apt-12',
    date: '2026-01-07',
    startTime: '17:30',
    endTime: '18:00',
    patientName: 'Antonio Pérez Molina',
    patientPhone: '623 456 789',
    patientAge: 51,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza dental',
    status: 'No confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['deuda'],
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'apt-13',
    date: '2026-01-07',
    startTime: '18:00',
    endTime: '18:30',
    patientName: 'Marta Alonso Blanco',
    patientPhone: '634 567 890',
    patientAge: 36,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Empaste molar 16',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'apt-14',
    date: '2026-01-07',
    startTime: '18:30',
    endTime: '19:00',
    patientName: 'Fernando Díaz Ortega',
    patientPhone: '645 678 901',
    patientAge: 44,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Férula de descarga',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-15',
    date: '2026-01-07',
    startTime: '19:00',
    endTime: '19:30',
    patientName: 'Beatriz Muñoz Serrano',
    patientPhone: '656 789 012',
    patientAge: 33,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Revisión anual',
    status: 'No confirmada',
    box: 'box 2',
    charge: 'Si',
    bgColor: 'var(--color-event-coral)'
  },
  // 8 de enero de 2026
  {
    id: 'apt-16',
    date: '2026-01-08',
    startTime: '09:00',
    endTime: '10:00',
    patientName: 'Ramón Castro Vidal',
    patientPhone: '667 890 123',
    patientAge: 15,
    professional: 'Dra. Elena Navarro',
    reason: 'Colocación brackets',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'apt-17',
    date: '2026-01-08',
    startTime: '09:30',
    endTime: '10:00',
    patientName: 'Patricia Romero Nieto',
    patientPhone: '678 901 234',
    patientAge: 17,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza (ortodoncia)',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-18',
    date: '2026-01-08',
    startTime: '10:30',
    endTime: '12:00',
    patientName: 'María García López',
    patientPhone: '612 345 678',
    patientAge: 34,
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Cirugía cordales',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'apt-19',
    date: '2026-01-08',
    startTime: '11:30',
    endTime: '12:00',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    professional: 'Dra. Elena Navarro',
    reason: 'Revisión Invisalign',
    status: 'No confirmada',
    box: 'box 2',
    charge: 'No',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'apt-20',
    date: '2026-01-08',
    startTime: '16:30',
    endTime: '18:00',
    patientName: 'Miguel Gómez Hernández',
    patientPhone: '601 234 567',
    patientAge: 38,
    professional: 'Dr. Francisco Moreno',
    reason: 'Endodoncia molar 36',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-21',
    date: '2026-01-08',
    startTime: '18:30',
    endTime: '19:30',
    patientName: 'Beatriz Muñoz Serrano',
    patientPhone: '656 789 012',
    patientAge: 33,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Carillas estéticas',
    status: 'Confirmada',
    box: 'box 3',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)'
  },
  // 9 de enero de 2026
  {
    id: 'apt-22',
    date: '2026-01-09',
    startTime: '09:00',
    endTime: '09:30',
    patientName: 'Marta Alonso Blanco',
    patientPhone: '634 567 890',
    patientAge: 36,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Limpieza rutinaria',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'apt-23',
    date: '2026-01-09',
    startTime: '10:30',
    endTime: '11:30',
    patientName: 'Ramón Castro Vidal',
    patientPhone: '667 890 123',
    patientAge: 15,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Corona zirconio',
    status: 'Reagendar',
    box: 'box 2',
    charge: 'No',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'apt-24',
    date: '2026-01-09',
    startTime: '12:00',
    endTime: '12:30',
    patientName: 'Lucía Martín',
    patientPhone: '612 987 654',
    patientAge: 8,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Selladores molares',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'Si',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-25',
    date: '2026-01-09',
    startTime: '16:00',
    endTime: '17:30',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Implante dental',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-event-teal)'
  },
  // 10 de enero de 2026
  {
    id: 'apt-26',
    date: '2026-01-10',
    startTime: '09:00',
    endTime: '10:00',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
    patientAge: 29,
    professional: 'Laura Sánchez (Higienista)',
    reason: 'Blanqueamiento (1ª)',
    status: 'No confirmada',
    box: 'box 1',
    charge: 'Si',
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'apt-27',
    date: '2026-01-10',
    startTime: '16:00',
    endTime: '17:00',
    patientName: 'Sofía Navarro Díaz',
    patientPhone: '678 901 234',
    patientAge: 31,
    professional: 'Dr. Antonio Ruiz',
    reason: 'Carillas (preparación)',
    status: 'Confirmada',
    box: 'box 2',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  }
]

// ============================================
// DATOS INICIALES DE BLOQUEOS (MOCK DATA)
// ============================================

const INITIAL_BLOCKS: AgendaBlock[] = [
  {
    id: 'block-1',
    date: '2026-01-07',
    startTime: '14:00',
    endTime: '15:00',
    blockType: 'break',
    description: 'Descanso equipo',
    box: 'box 1'
  },
  {
    id: 'block-2',
    date: '2026-01-07',
    startTime: '14:00',
    endTime: '14:30',
    blockType: 'cleaning',
    description: 'Limpieza gabinete 2',
    box: 'box 2',
    responsibleName: 'Personal limpieza'
  },
  {
    id: 'block-3',
    date: '2026-01-08',
    startTime: '13:00',
    endTime: '14:00',
    blockType: 'meeting',
    description: 'Reunión equipo semanal',
    responsibleName: 'Dr. Antonio Ruiz'
  },
  {
    id: 'block-4',
    date: '2026-01-09',
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
    date: '2026-01-10',
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
            const isCompleted = newStatus === 'completed'

            console.log(
              `✅ Estado de visita actualizado: ${apt.patientName} → ${newStatus} (${now.toLocaleTimeString('es-ES')})`
            )

            return {
              ...apt,
              visitStatus: newStatus,
              visitStatusHistory: updatedHistory,
              completed: isCompleted ? true : apt.completed
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
    isTimeSlotBlocked
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
