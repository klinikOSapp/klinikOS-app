'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

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
    professional: 'Dr. Francisco Moreno',
    reason: 'Endodoncia (2ª sesión)',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-4',
    date: '2026-01-07',
    startTime: '10:30',
    endTime: '11:00',
    patientName: 'Pablo López García',
    patientPhone: '645 678 901',
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
    professional: 'Dra. Carmen Díaz',
    reason: 'Tratamiento periodontal',
    status: 'No confirmada',
    box: 'box 2',
    charge: 'No',
    tags: ['deuda'],
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'apt-9',
    date: '2026-01-07',
    startTime: '13:00',
    endTime: '13:30',
    patientName: 'Carmen Ruiz Jiménez',
    patientPhone: '690 123 456',
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
    professional: 'Dr. Miguel Á. Torres',
    reason: 'Implante dental',
    status: 'Confirmada',
    box: 'box 1',
    charge: 'No',
    tags: ['confirmada'],
    bgColor: 'var(--color-brand-0)'
  },
  {
    id: 'apt-11',
    date: '2026-01-07',
    startTime: '16:30',
    endTime: '17:30',
    patientName: 'Elena Vega Castillo',
    patientPhone: '612 345 678',
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
    patientName: 'Lucía Martín (8 años)',
    patientPhone: '612 987 654',
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
// CONTEXTO
// ============================================

type AppointmentsContextType = {
  appointments: Appointment[]
  // Funciones CRUD
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  // Funciones de consulta
  getAppointmentsByDate: (date: string) => Appointment[]
  getAppointmentsByDateRange: (startDate: string, endDate: string) => Appointment[]
  getAppointmentById: (id: string) => Appointment | undefined
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)

  // Agregar una nueva cita
  const addAppointment = useCallback((appointmentData: Omit<Appointment, 'id'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setAppointments(prev => [...prev, newAppointment])
  }, [])

  // Actualizar una cita existente
  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
    )
  }, [])

  // Eliminar una cita
  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id))
  }, [])

  // Obtener citas por fecha
  const getAppointmentsByDate = useCallback((date: string) => {
    return appointments.filter(apt => apt.date === date)
  }, [appointments])

  // Obtener citas por rango de fechas
  const getAppointmentsByDateRange = useCallback((startDate: string, endDate: string) => {
    return appointments.filter(apt => apt.date >= startDate && apt.date <= endDate)
  }, [appointments])

  // Obtener una cita por ID
  const getAppointmentById = useCallback((id: string) => {
    return appointments.find(apt => apt.id === id)
  }, [appointments])

  const value: AppointmentsContextType = {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
    getAppointmentsByDateRange,
    getAppointmentById
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
    throw new Error('useAppointments must be used within an AppointmentsProvider')
  }
  return context
}

// ============================================
// HELPERS DE FORMATO
// ============================================

// Formatear fecha ISO a formato "7 Ene"
export function formatDateToShort(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' })
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1).replace('.', '')
  return `${day} ${monthCapitalized}`
}

// Formatear fecha a ISO desde Date
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


