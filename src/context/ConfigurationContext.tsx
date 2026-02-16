'use client'

import { initialCategories as defaultCategories } from '@/components/configuracion/TreatmentsPage'
import {
  BUDGET_TYPES_DATA,
  type BudgetTypeData
} from '@/components/pacientes/shared/budgetTypeData'
import { initialExpenses as defaultExpenses } from '@/data/expensesData'
import {
  initialPermissions as defaultPermissions,
  initialRoles as defaultRoles
} from '@/data/rolesData'
import { initialDiscounts as defaultDiscounts } from '@/data/treatmentConfigData'
import type { ConfigExpense } from '@/types/configExpenses'
import type { ConfigPermission, ConfigRole } from '@/types/configRoles'
import type { ConfigCategory, ConfigDiscount } from '@/types/treatments'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react'

// ============================================
// TIPOS PARA PLANTILLAS DE DOCUMENTOS
// ============================================

export type DocumentTemplateType =
  | 'factura'
  | 'receta'
  | 'justificante'
  | 'consentimiento'
  | 'presupuesto'
  | 'informe'

export type DocumentTemplate = {
  id: string
  title: string
  type: DocumentTemplateType
  content: string
  logoUrl?: string
  logoPosition?: { x: number; y: number }
  isDefault: boolean
  lastModified?: string
}

// ============================================
// TIPOS PARA CONFIGURACIÓN DE CLÍNICA
// ============================================

export type ClinicInfo = {
  id: string
  nombreComercial: string
  razonSocial: string
  cif: string
  direccion: string
  poblacion: string
  codigoPostal: string
  telefono: string
  email: string
  iban: string
  emailBancario: string
  logo?: string // Base64 or URL of the clinic logo
  web?: string // Website URL
}

export type Clinic = {
  id: string
  nombre: string
  direccion: string
  horario: string
  telefono: string
  email: string
  isActive: boolean
}

// ============================================
// TIPOS PARA PROFESIONALES/ESPECIALISTAS
// ============================================

export type ProfessionalColorTone =
  | 'morado'
  | 'naranja'
  | 'verde'
  | 'azul'
  | 'rojo'

export type EmploymentType = 'autonomo' | 'nomina'

export type Professional = {
  id: string
  name: string
  role: string // Especialidad: Odontólogo, Ortodoncista, Higienista, etc.
  phone: string
  email: string
  colorLabel: string
  colorTone: ProfessionalColorTone
  employmentType: EmploymentType
  commission?: string // Solo para autónomos (ej: "30%")
  salary?: string // Solo para nómina (mensual bruto, ej: "2.500")
  status: 'Activo' | 'Inactivo'
  photoUrl?: string
}

// Color styles for professionals
export const professionalColorStyles: Record<
  ProfessionalColorTone,
  { bg: string; text: string; hex: string }
> = {
  morado: { bg: 'bg-[#f3eaff]', text: 'text-[#7725eb]', hex: '#7725eb' },
  naranja: { bg: 'bg-[#fff7e8]', text: 'text-[#d97706]', hex: '#d97706' },
  verde: { bg: 'bg-[#e9f8f1]', text: 'text-[#2e7d5b]', hex: '#2e7d5b' },
  azul: { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]', hex: '#0369a1' },
  rojo: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', hex: '#dc2626' }
}

// ============================================
// TIPOS PARA BOXES/GABINETES
// ============================================

export type Box = {
  id: string
  label: string
  tone: 'neutral' | 'brand' | 'success' | 'warning' | 'error'
  isActive: boolean
}

// ============================================
// TIPOS PARA HORARIOS DE TRABAJO
// ============================================

export type DayOfWeek =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

export type TimeRange = {
  start: string // HH:MM format
  end: string // HH:MM format
}

export type WorkingHoursConfig = {
  defaultStartHour: number // e.g., 9 for 9:00
  defaultEndHour: number // e.g., 20 for 20:00
  slotDurationMinutes: number // e.g., 15
  workingDays: DayOfWeek[]
  morningShift: TimeRange
  afternoonShift: TimeRange
}

// ============================================
// TIPOS PARA HORARIOS DE PROFESIONALES
// ============================================

// Día de la semana en inglés (para WeeklySchedule keys)
export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// Pausa/descanso dentro del horario
export type ScheduleBreak = {
  id: string
  name: string // "Comida", "Descanso", "Reunión"
  start: string // "14:00"
  end: string // "15:00"
}

// Horario de un día específico
export type DaySchedule = {
  isWorking: boolean
  shifts: TimeRange[] // Puede tener turno mañana + tarde
  breaks: ScheduleBreak[] // Pausas dentro del horario
}

// Horario semanal de un profesional
export type WeeklySchedule = {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

// Tipo de excepción de horario
export type ScheduleExceptionType =
  | 'vacation'
  | 'holiday'
  | 'absence'
  | 'special'

// Excepción de horario (vacaciones, festivos, ausencias)
export type ScheduleException = {
  id: string
  professionalId: string
  date: string // "2026-02-10" ISO format
  type: ScheduleExceptionType
  reason?: string
  customSchedule?: DaySchedule // Si tiene horario especial ese día
}

// Plantilla de horario predefinida
export type ScheduleTemplate = {
  id: string
  name: string // "Jornada completa 9-18h"
  description?: string
  weeklySchedule: WeeklySchedule
  isDefault?: boolean
}

// Horario completo de un profesional
export type ProfessionalSchedule = {
  professionalId: string
  weeklySchedule: WeeklySchedule
  exceptions: ScheduleException[]
  appliedTemplateId?: string
}

// Mapeo de días español a inglés
export const DAY_MAP_ES_TO_EN: Record<DayOfWeek, WeekDay> = {
  lunes: 'monday',
  martes: 'tuesday',
  miercoles: 'wednesday',
  jueves: 'thursday',
  viernes: 'friday',
  sabado: 'saturday',
  domingo: 'sunday'
}

// Mapeo de días inglés a español
export const DAY_MAP_EN_TO_ES: Record<WeekDay, DayOfWeek> = {
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miercoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sabado',
  sunday: 'domingo'
}

// Labels para días de la semana
export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

// Labels cortos para días de la semana
export const WEEKDAY_LABELS_SHORT: Record<WeekDay, string> = {
  monday: 'L',
  tuesday: 'M',
  wednesday: 'X',
  thursday: 'J',
  friday: 'V',
  saturday: 'S',
  sunday: 'D'
}

// Orden de días de la semana
export const WEEKDAYS_ORDER: WeekDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

// Labels para tipos de excepción
export const EXCEPTION_TYPE_LABELS: Record<ScheduleExceptionType, string> = {
  vacation: 'Vacaciones',
  holiday: 'Festivo',
  absence: 'Ausencia',
  special: 'Horario especial'
}

// Helper para crear un DaySchedule no laborable
const createNonWorkingDay = (): DaySchedule => ({
  isWorking: false,
  shifts: [],
  breaks: []
})

// Helper para crear un DaySchedule con turno completo (mañana + tarde)
const createFullDaySchedule = (): DaySchedule => ({
  isWorking: true,
  shifts: [
    { start: '09:00', end: '14:00' },
    { start: '15:00', end: '18:00' }
  ],
  breaks: [{ id: 'lunch-1', name: 'Comida', start: '14:00', end: '15:00' }]
})

// Helper para crear un DaySchedule solo mañana
const createMorningSchedule = (): DaySchedule => ({
  isWorking: true,
  shifts: [{ start: '09:00', end: '14:00' }],
  breaks: []
})

// Helper para crear un DaySchedule solo tarde
const createAfternoonSchedule = (): DaySchedule => ({
  isWorking: true,
  shifts: [{ start: '15:00', end: '20:00' }],
  breaks: []
})

// Helper para crear un DaySchedule con horario de clínica (9-20 con pausa)
const createClinicDaySchedule = (): DaySchedule => ({
  isWorking: true,
  shifts: [
    { start: '09:00', end: '14:00' },
    { start: '15:00', end: '20:00' }
  ],
  breaks: [{ id: 'lunch-clinic', name: 'Comida', start: '14:00', end: '15:00' }]
})

// ============================================
// PLANTILLAS DE HORARIOS PREDEFINIDAS
// ============================================

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'full-day',
    name: 'Jornada completa 9-18h',
    description:
      'Lunes a viernes, 9:00-14:00 y 15:00-18:00 con pausa para comer',
    isDefault: true,
    weeklySchedule: {
      monday: createFullDaySchedule(),
      tuesday: createFullDaySchedule(),
      wednesday: createFullDaySchedule(),
      thursday: createFullDaySchedule(),
      friday: createFullDaySchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    }
  },
  {
    id: 'morning',
    name: 'Media jornada mañana',
    description: 'Lunes a viernes, 9:00-14:00',
    isDefault: true,
    weeklySchedule: {
      monday: createMorningSchedule(),
      tuesday: createMorningSchedule(),
      wednesday: createMorningSchedule(),
      thursday: createMorningSchedule(),
      friday: createMorningSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    }
  },
  {
    id: 'afternoon',
    name: 'Media jornada tarde',
    description: 'Lunes a viernes, 15:00-20:00',
    isDefault: true,
    weeklySchedule: {
      monday: createAfternoonSchedule(),
      tuesday: createAfternoonSchedule(),
      wednesday: createAfternoonSchedule(),
      thursday: createAfternoonSchedule(),
      friday: createAfternoonSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    }
  },
  {
    id: 'clinic-default',
    name: 'Horario de clínica',
    description:
      'Lunes a viernes, según horario configurado de la clínica (9:00-20:00)',
    isDefault: true,
    weeklySchedule: {
      monday: createClinicDaySchedule(),
      tuesday: createClinicDaySchedule(),
      wednesday: createClinicDaySchedule(),
      thursday: createClinicDaySchedule(),
      friday: createClinicDaySchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    }
  },
  {
    id: 'alternating',
    name: 'Semana alternada',
    description: 'Lunes, miércoles y viernes mañana; martes y jueves tarde',
    isDefault: true,
    weeklySchedule: {
      monday: createMorningSchedule(),
      tuesday: createAfternoonSchedule(),
      wednesday: createMorningSchedule(),
      thursday: createAfternoonSchedule(),
      friday: createMorningSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    }
  }
]

// ============================================
// DATOS INICIALES (MOCK)
// ============================================

const initialClinicInfo: ClinicInfo = {
  id: 'clinic-main',
  nombreComercial: 'Clínica Morales',
  razonSocial: 'Clínica Morales S.L.',
  cif: 'B12345678',
  direccion: 'C/ Universidad, 2',
  poblacion: 'Valencia',
  codigoPostal: '46001',
  telefono: '608020203',
  email: 'clinicamorales@morales.es',
  iban: 'ES12 1234 5678 9012 3456 7890',
  emailBancario: 'facturacion@morales.es'
}

const initialClinics: Clinic[] = [
  {
    id: 'clinic-1',
    nombre: 'Clínica Morales Ruzafa',
    direccion: 'C/ Universidad, 2, Valencia',
    horario: '08:00 - 20:00',
    telefono: '608020203',
    email: 'clinicamorales@morales.es',
    isActive: true
  },
  {
    id: 'clinic-2',
    nombre: 'Clínica Morales Albal',
    direccion: 'C/ Madrid, 12, Catarroja',
    horario: '09:30 - 20:00',
    telefono: '608020203',
    email: 'clinicamorales@morales.es',
    isActive: true
  },
  {
    id: 'clinic-3',
    nombre: 'Clínica Morales Centro',
    direccion: 'C/ Colón, 45, Valencia',
    horario: '09:00 - 21:00',
    telefono: '608020204',
    email: 'centro@morales.es',
    isActive: true
  }
]

const initialProfessionals: Professional[] = [
  {
    id: 'prof-1',
    name: 'Dr. Antonio Ruiz',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'antonio@clinicamorales.es',
    colorLabel: 'Morado',
    colorTone: 'morado',
    employmentType: 'autonomo',
    commission: '30%',
    status: 'Activo'
  },
  {
    id: 'prof-2',
    name: 'Dra. María García',
    role: 'Ortodoncista',
    phone: '608020204',
    email: 'maria@clinicamorales.es',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    employmentType: 'nomina',
    salary: '3.200',
    status: 'Activo'
  },
  {
    id: 'prof-3',
    name: 'Carlos Pérez',
    role: 'Higienista',
    phone: '608020205',
    email: 'carlos@clinicamorales.es',
    colorLabel: 'Verde',
    colorTone: 'verde',
    employmentType: 'nomina',
    salary: '1.800',
    status: 'Activo'
  },
  {
    id: 'prof-4',
    name: 'Dra. Laura Martínez',
    role: 'Implantólogo',
    phone: '608020206',
    email: 'laura@clinicamorales.es',
    colorLabel: 'Azul',
    colorTone: 'azul',
    employmentType: 'autonomo',
    commission: '35%',
    status: 'Activo'
  },
  {
    id: 'prof-5',
    name: 'Javier Herrera',
    role: 'Higienista',
    phone: '608020207',
    email: 'javier@clinicamorales.es',
    colorLabel: 'Rojo',
    colorTone: 'rojo',
    employmentType: 'autonomo',
    commission: '25%',
    status: 'Inactivo'
  }
]

const initialBoxes: Box[] = [
  { id: 'box-1', label: 'BOX 1', tone: 'neutral', isActive: true },
  { id: 'box-2', label: 'BOX 2', tone: 'neutral', isActive: true },
  { id: 'box-3', label: 'BOX 3', tone: 'neutral', isActive: true }
]

const initialWorkingHours: WorkingHoursConfig = {
  defaultStartHour: 9,
  defaultEndHour: 20,
  slotDurationMinutes: 15,
  workingDays: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
  morningShift: { start: '09:00', end: '14:00' },
  afternoonShift: { start: '15:00', end: '20:00' }
}

// Initial professional schedules (mock data matching initialProfessionals)
const initialProfessionalSchedules: ProfessionalSchedule[] = [
  {
    professionalId: 'prof-1', // Dr. Antonio Ruiz - Odontólogo
    weeklySchedule: {
      monday: createClinicDaySchedule(),
      tuesday: createClinicDaySchedule(),
      wednesday: createClinicDaySchedule(),
      thursday: createClinicDaySchedule(),
      friday: createMorningSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    },
    exceptions: [],
    appliedTemplateId: undefined
  },
  {
    professionalId: 'prof-2', // Dra. María García - Ortodoncista
    weeklySchedule: {
      monday: createMorningSchedule(),
      tuesday: createAfternoonSchedule(),
      wednesday: createMorningSchedule(),
      thursday: createAfternoonSchedule(),
      friday: createMorningSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    },
    exceptions: [],
    appliedTemplateId: 'alternating'
  },
  {
    professionalId: 'prof-3', // Carlos Pérez - Higienista
    weeklySchedule: {
      monday: createMorningSchedule(),
      tuesday: createMorningSchedule(),
      wednesday: createMorningSchedule(),
      thursday: createMorningSchedule(),
      friday: createMorningSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    },
    exceptions: [],
    appliedTemplateId: 'morning'
  },
  {
    professionalId: 'prof-4', // Dra. Laura Martínez - Implantólogo
    weeklySchedule: {
      monday: createAfternoonSchedule(),
      tuesday: createAfternoonSchedule(),
      wednesday: createAfternoonSchedule(),
      thursday: createAfternoonSchedule(),
      friday: createAfternoonSchedule(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    },
    exceptions: [],
    appliedTemplateId: 'afternoon'
  },
  {
    professionalId: 'prof-5', // Javier Herrera - Higienista (Inactivo)
    weeklySchedule: {
      monday: createNonWorkingDay(),
      tuesday: createNonWorkingDay(),
      wednesday: createNonWorkingDay(),
      thursday: createNonWorkingDay(),
      friday: createNonWorkingDay(),
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    },
    exceptions: [],
    appliedTemplateId: undefined
  }
]

// ============================================
// PLANTILLAS DE DOCUMENTOS POR DEFECTO
// ============================================

export const DEFAULT_DOCUMENT_TEMPLATES: Record<DocumentTemplateType, string> =
  {
    factura: `
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 24px; color: #1E4947; margin: 0;">FACTURA</h1>
      <p style="color: #535C66; margin: 4px 0 0 0;">Nº {{documento.numero}}</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <p style="font-weight: bold; color: #1E4947;">{{clinica.nombre}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.nif}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.direccion}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.telefono}}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #535C66; font-size: 13px;">Fecha: {{documento.fecha}}</p>
      </div>
    </div>
    
    <div style="background: #F5F7F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="font-weight: bold; color: #24282C; margin: 0 0 8px 0;">Datos del paciente</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">Nombre: {{paciente.nombre}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">DNI: {{paciente.dni}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">Dirección: {{paciente.direccion}}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #1E4947; color: white;">
          <th style="padding: 12px; text-align: left;">Concepto</th>
          <th style="padding: 12px; text-align: right;">Importe</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px;">{{tratamiento.nombre}}</td>
          <td style="padding: 12px; text-align: right;">{{tratamiento.precio}}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="text-align: right; margin-bottom: 32px;">
      <p style="font-size: 18px; font-weight: bold; color: #1E4947;">Total: {{presupuesto.total}}</p>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; text-align: center; color: #535C66; font-size: 12px;">
      <p>{{clinica.nombre}} • {{clinica.email}} • {{clinica.web}}</p>
    </div>
  `,
    receta: `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div>
        <h1 style="font-size: 20px; color: #1E4947; margin: 0;">RECETA MÉDICA</h1>
        <p style="color: #535C66; font-size: 13px; margin: 4px 0 0 0;">{{clinica.nombre}}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #535C66; font-size: 13px;">Fecha: {{documento.fecha}}</p>
        <p style="color: #535C66; font-size: 13px;">Nº: {{documento.numero}}</p>
      </div>
    </div>
    
    <div style="background: #F5F7F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Paciente</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.nombre}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">DNI</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.dni}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Sexo</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.sexo}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Edad</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.edad}} años</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #1E4947; margin: 0 0 16px 0; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Prescripción</h2>
      
      <div style="background: #F0FDF4; border-left: 4px solid #22C55E; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
        <p style="font-weight: bold; color: #24282C; margin: 0 0 8px 0;">{{receta.medicamento}}</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px;">
          <div>
            <span style="color: #6B7280;">Dosis:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.dosis}}</span>
          </div>
          <div>
            <span style="color: #6B7280;">Frecuencia:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.frecuencia}}</span>
          </div>
          <div>
            <span style="color: #6B7280;">Duración:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.duracion}}</span>
          </div>
          <div>
            <span style="color: #6B7280;">Vía:</span>
            <span style="color: #24282C; margin-left: 4px;">{{receta.via}}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: #92400E; font-size: 13px; margin: 0;"><strong>Notas del caso:</strong> {{receta.notas}}</p>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; display: flex; justify-content: space-between;">
      <div>
        <p style="color: #6B7280; font-size: 12px; margin: 0;">Doctor/a</p>
        <p style="color: #24282C; font-weight: bold; margin: 4px 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 13px; margin: 2px 0;">{{profesional.especialidad}}</p>
        <p style="color: #535C66; font-size: 13px; margin: 2px 0;">Nº Colegiado: {{profesional.num_colegiado}}</p>
      </div>
      <div style="text-align: center;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0;">Firma</p>
        <div style="width: 150px; height: 60px; border-bottom: 1px solid #24282C;"></div>
      </div>
    </div>
  `,
    presupuesto: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; color: #1E4947; margin: 0;">PRESUPUESTO</h1>
      <p style="color: #535C66; margin: 4px 0 0 0;">Nº {{documento.numero}}</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <p style="font-weight: bold; color: #1E4947; font-size: 16px;">{{clinica.nombre}}</p>
        <p style="color: #535C66; font-size: 13px;">{{clinica.direccion}}</p>
        <p style="color: #535C66; font-size: 13px;">Tel: {{clinica.telefono}}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #535C66; font-size: 13px;">Fecha: {{documento.fecha}}</p>
        <p style="color: #535C66; font-size: 13px;">Validez: {{presupuesto.validez}}</p>
      </div>
    </div>
    
    <div style="background: #F5F7F9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="font-weight: bold; color: #24282C; margin: 0 0 8px 0;">Datos del paciente</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">{{paciente.nombre}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0;">DNI: {{paciente.dni}}</p>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #1E4947; color: white;">
          <th style="padding: 12px; text-align: left;">Pieza</th>
          <th style="padding: 12px; text-align: left;">Tratamiento</th>
          <th style="padding: 12px; text-align: right;">Precio</th>
          <th style="padding: 12px; text-align: right;">Dto.</th>
          <th style="padding: 12px; text-align: right;">Importe</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px;">{{tratamiento.pieza}}</td>
          <td style="padding: 12px;">{{tratamiento.nombre}}</td>
          <td style="padding: 12px; text-align: right;">{{tratamiento.precio}}</td>
          <td style="padding: 12px; text-align: right;">-</td>
          <td style="padding: 12px; text-align: right;">{{tratamiento.precio}}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
      <div style="width: 250px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
          <span style="color: #535C66;">Subtotal:</span>
          <span style="color: #24282C;">{{presupuesto.subtotal}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
          <span style="color: #535C66;">Descuento:</span>
          <span style="color: #22C55E;">-{{presupuesto.descuento}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold;">
          <span style="color: #1E4947;">TOTAL:</span>
          <span style="color: #1E4947;">{{presupuesto.total}}</span>
        </div>
      </div>
    </div>
    
    <div style="background: #FEF3C7; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
      <p style="color: #92400E; font-size: 12px; margin: 0;">
        * Este presupuesto tiene una validez de {{presupuesto.validez}}. Los precios pueden variar sin previo aviso.
      </p>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; text-align: center; color: #535C66; font-size: 12px;">
      <p>{{clinica.nombre}} • {{clinica.email}} • {{clinica.web}}</p>
    </div>
  `,
    consentimiento: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 22px; color: #1E4947; margin: 0;">CONSENTIMIENTO INFORMADO</h1>
      <p style="color: #535C66; font-size: 14px; margin: 8px 0 0 0;">{{clinica.nombre}}</p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        Yo, <strong>{{paciente.nombre}}</strong>, con DNI <strong>{{paciente.dni}}</strong>, 
        declaro que he sido informado/a de manera clara, comprensible y satisfactoria sobre 
        el procedimiento que se me va a realizar, sus beneficios, riesgos y alternativas.
      </p>
    </div>
    
    <div style="background: #F5F7F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #1E4947; margin: 0 0 12px 0;">Procedimiento</h2>
      <p style="color: #535C66; line-height: 1.6; margin: 0;">
        {{tratamiento.nombre}}: {{tratamiento.descripcion}}
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #1E4947; margin: 0 0 12px 0;">Declaraciones</h2>
      <ul style="color: #535C66; line-height: 2; padding-left: 20px;">
        <li>He comprendido la información proporcionada sobre el procedimiento.</li>
        <li>He tenido la oportunidad de realizar las preguntas que he considerado necesarias.</li>
        <li>Todas mis dudas han sido resueltas satisfactoriamente.</li>
        <li>Entiendo que puedo revocar este consentimiento en cualquier momento.</li>
        <li>Autorizo la realización del procedimiento descrito.</li>
      </ul>
    </div>
    
    <div style="margin-bottom: 32px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        He leído y comprendido este documento de consentimiento informado y acepto 
        voluntariamente someterme al procedimiento indicado.
      </p>
    </div>
    
    <div style="display: flex; justify-content: space-between; padding-top: 24px; border-top: 1px solid #E5E7EB;">
      <div style="text-align: center; width: 45%;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma del paciente</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{paciente.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">DNI: {{paciente.dni}}</p>
      </div>
      <div style="text-align: center; width: 45%;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma del profesional</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">Nº Col: {{profesional.num_colegiado}}</p>
      </div>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <p style="color: #535C66; font-size: 12px;">En {{clinica.direccion}}, a {{documento.fecha}}</p>
    </div>
  `,
    justificante: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 22px; color: #1E4947; margin: 0;">JUSTIFICANTE DE ASISTENCIA</h1>
      <p style="color: #535C66; margin: 8px 0 0 0;">{{clinica.nombre}}</p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        Se hace constar que <strong>{{paciente.nombre}}</strong>, con DNI <strong>{{paciente.dni}}</strong>, 
        ha acudido a nuestra clínica el día <strong>{{documento.fecha}}</strong> para recibir atención médica.
      </p>
    </div>
    
    <div style="background: #F5F7F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Paciente</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.nombre}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">DNI</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{paciente.dni}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Fecha de asistencia</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{documento.fecha}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Motivo</p>
          <p style="color: #24282C; font-weight: 500; margin: 4px 0 0 0;">{{tratamiento.nombre}}</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 32px;">
      <p style="color: #24282C; line-height: 1.8; text-align: justify;">
        Y para que conste a los efectos oportunos, se expide el presente justificante 
        en {{clinica.direccion}}, a {{documento.fecha}}.
      </p>
    </div>
    
    <div style="display: flex; justify-content: flex-end; padding-top: 24px; border-top: 1px solid #E5E7EB;">
      <div style="text-align: center; width: 250px;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma y sello</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">{{profesional.especialidad}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 2px 0 0 0;">Nº Col: {{profesional.num_colegiado}}</p>
      </div>
    </div>
    
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; text-align: center;">
      <p style="color: #535C66; font-size: 12px; margin: 0;">{{clinica.nombre}} • {{clinica.direccion}}</p>
      <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">Tel: {{clinica.telefono}} • {{clinica.email}}</p>
    </div>
  `,
    informe: `
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 22px; color: #1E4947; margin: 0;">INFORME CLÍNICO</h1>
      <p style="color: #535C66; margin: 8px 0 0 0;">{{clinica.nombre}}</p>
      <p style="color: #535C66; font-size: 13px; margin: 4px 0 0 0;">Nº Informe: {{documento.numero}}</p>
    </div>
    
    <div style="background: #F5F7F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase;">Datos del paciente</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Nombre completo</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.nombre}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">DNI</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.dni}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Fecha de nacimiento</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.fecha_nacimiento}}</p>
        </div>
        <div>
          <p style="color: #6B7280; font-size: 12px; margin: 0;">Edad</p>
          <p style="color: #24282C; margin: 4px 0 0 0;">{{paciente.edad}} años</p>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Motivo de consulta</h2>
      <p style="color: #535C66; line-height: 1.8;">
        {{tratamiento.descripcion}}
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Exploración clínica</h2>
      <p style="color: #535C66; line-height: 1.8;">
        [Describir hallazgos de la exploración]
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Diagnóstico</h2>
      <p style="color: #535C66; line-height: 1.8;">
        [Indicar diagnóstico]
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Plan de tratamiento</h2>
      <p style="color: #535C66; line-height: 1.8;">
        {{tratamiento.nombre}}
      </p>
    </div>
    
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 14px; color: #1E4947; margin: 0 0 12px 0; text-transform: uppercase; border-bottom: 2px solid #1E4947; padding-bottom: 8px;">Recomendaciones</h2>
      <p style="color: #535C66; line-height: 1.8;">
        [Indicar recomendaciones al paciente]
      </p>
    </div>
    
    <div style="display: flex; justify-content: space-between; padding-top: 24px; border-top: 1px solid #E5E7EB; margin-top: 32px;">
      <div>
        <p style="color: #535C66; font-size: 13px;">{{clinica.direccion}}</p>
        <p style="color: #535C66; font-size: 13px;">{{documento.fecha}}</p>
      </div>
      <div style="text-align: center; width: 200px;">
        <p style="color: #6B7280; font-size: 12px; margin: 0 0 40px 0;">Firma del profesional</p>
        <div style="border-bottom: 1px solid #24282C; margin-bottom: 8px;"></div>
        <p style="color: #24282C; font-size: 13px; margin: 0;">{{profesional.nombre}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 4px 0 0 0;">{{profesional.especialidad}}</p>
        <p style="color: #535C66; font-size: 12px; margin: 2px 0 0 0;">Nº Col: {{profesional.num_colegiado}}</p>
      </div>
    </div>
  `
  }

// Initial document templates
const initialDocumentTemplates: DocumentTemplate[] = [
  {
    id: 'd1',
    title: 'Facturas',
    type: 'factura',
    content: DEFAULT_DOCUMENT_TEMPLATES.factura,
    isDefault: true
  },
  {
    id: 'd2',
    title: 'Recetas',
    type: 'receta',
    content: DEFAULT_DOCUMENT_TEMPLATES.receta,
    isDefault: true
  },
  {
    id: 'd3',
    title: 'Presupuestos',
    type: 'presupuesto',
    content: DEFAULT_DOCUMENT_TEMPLATES.presupuesto,
    isDefault: true
  },
  {
    id: 'd4',
    title: 'Justificantes de asistencia',
    type: 'justificante',
    content: DEFAULT_DOCUMENT_TEMPLATES.justificante,
    isDefault: true
  },
  {
    id: 'd5',
    title: 'Consentimiento Protección de datos (RGPD)',
    type: 'consentimiento',
    content: DEFAULT_DOCUMENT_TEMPLATES.consentimiento,
    isDefault: true
  },
  {
    id: 'd6',
    title: 'Consentimiento Tratamiento con sedación',
    type: 'consentimiento',
    content: DEFAULT_DOCUMENT_TEMPLATES.consentimiento,
    isDefault: true
  },
  {
    id: 'd7',
    title: 'Consentimiento Extracción dental',
    type: 'consentimiento',
    content: DEFAULT_DOCUMENT_TEMPLATES.consentimiento,
    isDefault: true
  },
  {
    id: 'd8',
    title: 'Informes clínicos',
    type: 'informe',
    content: DEFAULT_DOCUMENT_TEMPLATES.informe,
    isDefault: true
  }
]

// Type labels for document templates
export const DOCUMENT_TYPE_LABELS: Record<DocumentTemplateType, string> = {
  factura: 'Factura',
  receta: 'Receta',
  presupuesto: 'Presupuesto',
  justificante: 'Justificante',
  consentimiento: 'Consentimiento',
  informe: 'Informe'
}

// ============================================
// CONTEXT TYPE
// ============================================

type ConfigurationContextType = {
  // Clinic Info
  clinicInfo: ClinicInfo
  updateClinicInfo: (updates: Partial<ClinicInfo>) => void

  // Clinics List
  clinics: Clinic[]
  addClinic: (clinic: Omit<Clinic, 'id'>) => void
  updateClinic: (id: string, updates: Partial<Clinic>) => void
  deleteClinic: (id: string) => void

  // Professionals
  professionals: Professional[]
  activeProfessionals: Professional[]
  addProfessional: (professional: Omit<Professional, 'id'>) => void
  updateProfessional: (id: string, updates: Partial<Professional>) => void
  deleteProfessional: (id: string) => void
  getProfessionalById: (id: string) => Professional | undefined
  getProfessionalByName: (name: string) => Professional | undefined

  // Professional options for dropdowns (agenda)
  professionalOptions: Array<{ id: string; label: string; color: string }>

  // Professional options for patient module dropdowns (value/label format)
  professionalNameOptions: Array<{ value: string; label: string }>
  // Professional names as simple string array (for simple dropdowns)
  professionalNames: string[]

  // Boxes
  boxes: Box[]
  activeBoxes: Box[]
  addBox: (box: Omit<Box, 'id'>) => void
  updateBox: (id: string, updates: Partial<Box>) => void
  deleteBox: (id: string) => void

  // Box options for dropdowns (agenda)
  boxOptions: Array<{ id: string; label: string }>

  // Working Hours
  workingHours: WorkingHoursConfig
  updateWorkingHours: (updates: Partial<WorkingHoursConfig>) => void

  // Period helpers for calendar
  getPeriodConfig: (period: 'full' | 'morning' | 'afternoon') => {
    startHour: number
    endHour: number
  }

  // Document Templates
  documentTemplates: DocumentTemplate[]
  addDocumentTemplate: (
    template: Omit<DocumentTemplate, 'id' | 'lastModified'>
  ) => void
  updateDocumentTemplate: (
    id: string,
    updates: Partial<DocumentTemplate>
  ) => void
  deleteDocumentTemplate: (id: string) => void
  getDocumentTemplateById: (id: string) => DocumentTemplate | undefined
  getDocumentTemplatesByType: (type: DocumentTemplateType) => DocumentTemplate[]
  resetDocumentTemplate: (id: string) => void

  // Professional Schedules
  professionalSchedules: ProfessionalSchedule[]
  scheduleTemplates: ScheduleTemplate[]
  getProfessionalSchedule: (
    professionalId: string
  ) => ProfessionalSchedule | undefined
  updateProfessionalSchedule: (
    professionalId: string,
    schedule: WeeklySchedule
  ) => void
  applyTemplateToProfessional: (
    professionalId: string,
    templateId: string
  ) => void
  addScheduleException: (exception: Omit<ScheduleException, 'id'>) => void
  removeScheduleException: (exceptionId: string) => void
  copySchedule: (fromProfessionalId: string, toProfessionalId: string) => void
  isProfessionalAvailable: (
    professionalId: string,
    date: Date,
    time: string
  ) => boolean
  getProfessionalScheduleForDate: (
    professionalId: string,
    date: Date
  ) => DaySchedule | null
  getAvailableProfessionalsForDate: (date: Date) => Professional[]

  // Treatment Catalog (categories + treatments)
  treatmentCategories: ConfigCategory[]
  setTreatmentCategories: Dispatch<SetStateAction<ConfigCategory[]>>
  addTreatmentCategory: (category: Omit<ConfigCategory, 'id'>) => void
  updateTreatmentCategory: (
    id: string,
    updates: Partial<ConfigCategory>
  ) => void
  deleteTreatmentCategory: (id: string) => void

  // Discounts
  discounts: ConfigDiscount[]
  setDiscounts: Dispatch<SetStateAction<ConfigDiscount[]>>
  addDiscount: (discount: Omit<ConfigDiscount, 'id'>) => void
  updateDiscount: (id: string, updates: Partial<ConfigDiscount>) => void
  deleteDiscount: (id: string) => void
  activeDiscounts: ConfigDiscount[]

  // Discount options for dropdowns (formatted for patient module)
  discountOptions: string[]

  // Budget Types
  budgetTypes: BudgetTypeData[]
  setBudgetTypes: Dispatch<SetStateAction<BudgetTypeData[]>>
  addBudgetType: (bt: Omit<BudgetTypeData, 'id'>) => void
  updateBudgetType: (id: string, updates: Partial<BudgetTypeData>) => void
  deleteBudgetType: (id: string) => void

  // Expenses
  expenses: ConfigExpense[]
  setExpenses: Dispatch<SetStateAction<ConfigExpense[]>>
  addExpense: (expense: Omit<ConfigExpense, 'id'>) => void
  updateExpense: (id: string, updates: Partial<ConfigExpense>) => void
  deleteExpense: (id: string) => void

  // Roles & Permissions
  roles: ConfigRole[]
  setRoles: Dispatch<SetStateAction<ConfigRole[]>>
  addRole: (role: Omit<ConfigRole, 'id'>) => void
  updateRole: (id: string, updates: Partial<ConfigRole>) => void
  deleteRole: (id: string) => void
  toggleRolePermission: (roleId: string, permissionId: string) => void
  permissions: ConfigPermission[]
  setPermissions: Dispatch<SetStateAction<ConfigPermission[]>>
  updatePermission: (id: string, updates: Partial<ConfigPermission>) => void
}

// ============================================
// CONTEXT
// ============================================

const ConfigurationContext = createContext<
  ConfigurationContextType | undefined
>(undefined)

// ============================================
// PROVIDER
// ============================================

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  // State
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(initialClinicInfo)
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics)
  const [professionals, setProfessionals] =
    useState<Professional[]>(initialProfessionals)
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes)
  const [workingHours, setWorkingHours] =
    useState<WorkingHoursConfig>(initialWorkingHours)
  const [documentTemplates, setDocumentTemplates] = useState<
    DocumentTemplate[]
  >(initialDocumentTemplates)
  const [professionalSchedules, setProfessionalSchedules] = useState<
    ProfessionalSchedule[]
  >(initialProfessionalSchedules)
  const [scheduleTemplates] = useState<ScheduleTemplate[]>(
    DEFAULT_SCHEDULE_TEMPLATES
  )

  // Treatment catalog, discounts, budget types
  const [treatmentCategories, setTreatmentCategories] =
    useState<ConfigCategory[]>(defaultCategories)
  const [discounts, setDiscountsState] =
    useState<ConfigDiscount[]>(defaultDiscounts)
  const [budgetTypesState, setBudgetTypesState] =
    useState<BudgetTypeData[]>(BUDGET_TYPES_DATA)

  // Expenses, roles, permissions
  const [expenses, setExpensesState] =
    useState<ConfigExpense[]>(defaultExpenses)
  const [roles, setRolesState] = useState<ConfigRole[]>(defaultRoles)
  const [permissions, setPermissionsState] =
    useState<ConfigPermission[]>(defaultPermissions)

  // ====== CLINIC INFO ======
  const updateClinicInfo = useCallback((updates: Partial<ClinicInfo>) => {
    setClinicInfo((prev) => ({ ...prev, ...updates }))
  }, [])

  // ====== CLINICS ======
  const addClinic = useCallback((clinic: Omit<Clinic, 'id'>) => {
    const newClinic: Clinic = {
      ...clinic,
      id: `clinic-${Date.now()}`
    }
    setClinics((prev) => [...prev, newClinic])
  }, [])

  const updateClinic = useCallback((id: string, updates: Partial<Clinic>) => {
    setClinics((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }, [])

  const deleteClinic = useCallback((id: string) => {
    setClinics((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // ====== PROFESSIONALS ======
  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.status === 'Activo'),
    [professionals]
  )

  const addProfessional = useCallback(
    (professional: Omit<Professional, 'id'>) => {
      const newProfessional: Professional = {
        ...professional,
        id: `prof-${Date.now()}`
      }
      setProfessionals((prev) => [...prev, newProfessional])
    },
    []
  )

  const updateProfessional = useCallback(
    (id: string, updates: Partial<Professional>) => {
      setProfessionals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      )
    },
    []
  )

  const deleteProfessional = useCallback((id: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getProfessionalById = useCallback(
    (id: string) => professionals.find((p) => p.id === id),
    [professionals]
  )

  const getProfessionalByName = useCallback(
    (name: string) => professionals.find((p) => p.name === name),
    [professionals]
  )

  // Professional options for agenda dropdowns
  const professionalOptions = useMemo(
    () =>
      activeProfessionals.map((p) => ({
        id: p.id,
        label: p.name,
        color: professionalColorStyles[p.colorTone]?.hex || '#6b7280'
      })),
    [activeProfessionals]
  )

  // Professional options for patient module dropdowns (value/label format)
  const professionalNameOptions = useMemo(
    () =>
      activeProfessionals.map((p) => ({
        value: p.name,
        label: p.name
      })),
    [activeProfessionals]
  )

  // Professional names as simple string array
  const professionalNames = useMemo(
    () => activeProfessionals.map((p) => p.name),
    [activeProfessionals]
  )

  // ====== BOXES ======
  const activeBoxes = useMemo(() => boxes.filter((b) => b.isActive), [boxes])

  const addBox = useCallback((box: Omit<Box, 'id'>) => {
    const newBox: Box = {
      ...box,
      id: `box-${Date.now()}`
    }
    setBoxes((prev) => [...prev, newBox])
  }, [])

  const updateBox = useCallback((id: string, updates: Partial<Box>) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
  }, [])

  const deleteBox = useCallback((id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id))
  }, [])

  // Box options for agenda dropdowns
  const boxOptions = useMemo(
    () => activeBoxes.map((b) => ({ id: b.id, label: b.label })),
    [activeBoxes]
  )

  // ====== WORKING HOURS ======
  const updateWorkingHours = useCallback(
    (updates: Partial<WorkingHoursConfig>) => {
      setWorkingHours((prev) => ({ ...prev, ...updates }))
    },
    []
  )

  // Period config helper for calendar views
  const getPeriodConfig = useCallback(
    (period: 'full' | 'morning' | 'afternoon') => {
      switch (period) {
        case 'morning':
          return {
            startHour: parseInt(
              workingHours.morningShift.start.split(':')[0],
              10
            ),
            endHour: parseInt(workingHours.morningShift.end.split(':')[0], 10)
          }
        case 'afternoon':
          return {
            startHour: parseInt(
              workingHours.afternoonShift.start.split(':')[0],
              10
            ),
            endHour: parseInt(workingHours.afternoonShift.end.split(':')[0], 10)
          }
        case 'full':
        default:
          return {
            startHour: workingHours.defaultStartHour,
            endHour: workingHours.defaultEndHour
          }
      }
    },
    [workingHours]
  )

  // ====== DOCUMENT TEMPLATES ======
  const addDocumentTemplate = useCallback(
    (template: Omit<DocumentTemplate, 'id' | 'lastModified'>) => {
      const newTemplate: DocumentTemplate = {
        ...template,
        id: `doc-${Date.now()}`,
        lastModified: new Date().toISOString()
      }
      setDocumentTemplates((prev) => [...prev, newTemplate])
    },
    []
  )

  const updateDocumentTemplate = useCallback(
    (id: string, updates: Partial<DocumentTemplate>) => {
      setDocumentTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...updates, lastModified: new Date().toISOString() }
            : t
        )
      )
    },
    []
  )

  const deleteDocumentTemplate = useCallback((id: string) => {
    setDocumentTemplates((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const getDocumentTemplateById = useCallback(
    (id: string) => documentTemplates.find((t) => t.id === id),
    [documentTemplates]
  )

  const getDocumentTemplatesByType = useCallback(
    (type: DocumentTemplateType) =>
      documentTemplates.filter((t) => t.type === type),
    [documentTemplates]
  )

  const resetDocumentTemplate = useCallback((id: string) => {
    setDocumentTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id && t.isDefault) {
          return {
            ...t,
            content: DEFAULT_DOCUMENT_TEMPLATES[t.type],
            lastModified: new Date().toISOString()
          }
        }
        return t
      })
    )
  }, [])

  // ====== PROFESSIONAL SCHEDULES ======
  const getProfessionalSchedule = useCallback(
    (professionalId: string) =>
      professionalSchedules.find((s) => s.professionalId === professionalId),
    [professionalSchedules]
  )

  const updateProfessionalSchedule = useCallback(
    (professionalId: string, schedule: WeeklySchedule) => {
      setProfessionalSchedules((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.professionalId === professionalId
        )
        if (existingIndex >= 0) {
          return prev.map((s) =>
            s.professionalId === professionalId
              ? { ...s, weeklySchedule: schedule, appliedTemplateId: undefined }
              : s
          )
        }
        // Create new schedule if doesn't exist
        return [
          ...prev,
          {
            professionalId,
            weeklySchedule: schedule,
            exceptions: [],
            appliedTemplateId: undefined
          }
        ]
      })
    },
    []
  )

  const applyTemplateToProfessional = useCallback(
    (professionalId: string, templateId: string) => {
      const template = scheduleTemplates.find((t) => t.id === templateId)
      if (!template) return

      setProfessionalSchedules((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.professionalId === professionalId
        )
        if (existingIndex >= 0) {
          return prev.map((s) =>
            s.professionalId === professionalId
              ? {
                  ...s,
                  weeklySchedule: template.weeklySchedule,
                  appliedTemplateId: templateId
                }
              : s
          )
        }
        return [
          ...prev,
          {
            professionalId,
            weeklySchedule: template.weeklySchedule,
            exceptions: [],
            appliedTemplateId: templateId
          }
        ]
      })
    },
    [scheduleTemplates]
  )

  const addScheduleException = useCallback(
    (exception: Omit<ScheduleException, 'id'>) => {
      const newException: ScheduleException = {
        ...exception,
        id: `exc-${Date.now()}`
      }
      setProfessionalSchedules((prev) =>
        prev.map((s) =>
          s.professionalId === exception.professionalId
            ? { ...s, exceptions: [...s.exceptions, newException] }
            : s
        )
      )
    },
    []
  )

  const removeScheduleException = useCallback((exceptionId: string) => {
    setProfessionalSchedules((prev) =>
      prev.map((s) => ({
        ...s,
        exceptions: s.exceptions.filter((e) => e.id !== exceptionId)
      }))
    )
  }, [])

  const copySchedule = useCallback(
    (fromProfessionalId: string, toProfessionalId: string) => {
      const sourceSchedule = professionalSchedules.find(
        (s) => s.professionalId === fromProfessionalId
      )
      if (!sourceSchedule) return

      setProfessionalSchedules((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.professionalId === toProfessionalId
        )
        if (existingIndex >= 0) {
          return prev.map((s) =>
            s.professionalId === toProfessionalId
              ? {
                  ...s,
                  weeklySchedule: sourceSchedule.weeklySchedule,
                  appliedTemplateId: undefined
                }
              : s
          )
        }
        return [
          ...prev,
          {
            professionalId: toProfessionalId,
            weeklySchedule: sourceSchedule.weeklySchedule,
            exceptions: [],
            appliedTemplateId: undefined
          }
        ]
      })
    },
    [professionalSchedules]
  )

  // Helper to get day of week from Date
  const getDayOfWeek = (date: Date): WeekDay => {
    const days: WeekDay[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ]
    return days[date.getDay()]
  }

  // Helper to parse time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const getProfessionalScheduleForDate = useCallback(
    (professionalId: string, date: Date): DaySchedule | null => {
      const schedule = professionalSchedules.find(
        (s) => s.professionalId === professionalId
      )
      if (!schedule) return null

      // Check for exceptions on this date
      const dateStr = date.toISOString().split('T')[0]
      const exception = schedule.exceptions.find((e) => e.date === dateStr)

      if (exception) {
        // If exception is vacation/holiday/absence without custom schedule, return non-working
        if (exception.type !== 'special' || !exception.customSchedule) {
          return { isWorking: false, shifts: [], breaks: [] }
        }
        // Return custom schedule for special exceptions
        return exception.customSchedule
      }

      // Return regular schedule for the day of week
      const dayOfWeek = getDayOfWeek(date)
      return schedule.weeklySchedule[dayOfWeek]
    },
    [professionalSchedules]
  )

  const isProfessionalAvailable = useCallback(
    (professionalId: string, date: Date, time: string): boolean => {
      const daySchedule = getProfessionalScheduleForDate(professionalId, date)
      if (!daySchedule || !daySchedule.isWorking) return false

      const requestedMinutes = timeToMinutes(time)

      // Check if time falls within any shift
      const inShift = daySchedule.shifts.some((shift) => {
        const shiftStart = timeToMinutes(shift.start)
        const shiftEnd = timeToMinutes(shift.end)
        return requestedMinutes >= shiftStart && requestedMinutes < shiftEnd
      })

      if (!inShift) return false

      // Check if time falls within any break
      const inBreak = daySchedule.breaks.some((breakPeriod) => {
        const breakStart = timeToMinutes(breakPeriod.start)
        const breakEnd = timeToMinutes(breakPeriod.end)
        return requestedMinutes >= breakStart && requestedMinutes < breakEnd
      })

      return !inBreak
    },
    [getProfessionalScheduleForDate]
  )

  const getAvailableProfessionalsForDate = useCallback(
    (date: Date): Professional[] => {
      return activeProfessionals.filter((professional) => {
        const daySchedule = getProfessionalScheduleForDate(
          professional.id,
          date
        )
        return daySchedule?.isWorking === true
      })
    },
    [activeProfessionals, getProfessionalScheduleForDate]
  )

  // ====== TREATMENT CATEGORIES ======
  const addTreatmentCategory = useCallback(
    (category: Omit<ConfigCategory, 'id'>) => {
      const newCategory: ConfigCategory = {
        ...category,
        id: `cat-${Date.now()}`
      }
      setTreatmentCategories((prev) => [...prev, newCategory])
    },
    []
  )

  const updateTreatmentCategory = useCallback(
    (id: string, updates: Partial<ConfigCategory>) => {
      setTreatmentCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      )
    },
    []
  )

  const deleteTreatmentCategory = useCallback((id: string) => {
    setTreatmentCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // ====== DISCOUNTS ======
  const setDiscounts = useCallback(
    (discountsOrUpdater: SetStateAction<ConfigDiscount[]>) => {
      setDiscountsState(discountsOrUpdater)
    },
    []
  )

  const activeDiscounts = useMemo(
    () => discounts.filter((d) => d.isActive),
    [discounts]
  )

  const discountOptions = useMemo(
    () => [
      'Sin descuento',
      ...activeDiscounts.map((d) =>
        d.type === 'percentage'
          ? `${d.value}% ${d.name}`
          : `${d.value}€ ${d.name}`
      )
    ],
    [activeDiscounts]
  )

  const addDiscount = useCallback((discount: Omit<ConfigDiscount, 'id'>) => {
    const newDiscount: ConfigDiscount = {
      ...discount,
      id: `disc-${Date.now()}`
    }
    setDiscountsState((prev) => [...prev, newDiscount])
  }, [])

  const updateDiscount = useCallback(
    (id: string, updates: Partial<ConfigDiscount>) => {
      setDiscountsState((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      )
    },
    []
  )

  const deleteDiscount = useCallback((id: string) => {
    setDiscountsState((prev) => prev.filter((d) => d.id !== id))
  }, [])

  // ====== BUDGET TYPES ======
  const setBudgetTypes = useCallback(
    (typesOrUpdater: SetStateAction<BudgetTypeData[]>) => {
      setBudgetTypesState(typesOrUpdater)
    },
    []
  )

  const addBudgetTypeCtx = useCallback((bt: Omit<BudgetTypeData, 'id'>) => {
    const newBt: BudgetTypeData = {
      ...bt,
      id: `bt-${Date.now()}`
    }
    setBudgetTypesState((prev) => [...prev, newBt])
  }, [])

  const updateBudgetTypeCtx = useCallback(
    (id: string, updates: Partial<BudgetTypeData>) => {
      setBudgetTypesState((prev) =>
        prev.map((bt) => (bt.id === id ? { ...bt, ...updates } : bt))
      )
    },
    []
  )

  const deleteBudgetTypeCtx = useCallback((id: string) => {
    setBudgetTypesState((prev) => prev.filter((bt) => bt.id !== id))
  }, [])

  // ====== EXPENSES ======
  const setExpenses = useCallback(
    (expensesOrUpdater: SetStateAction<ConfigExpense[]>) => {
      setExpensesState(expensesOrUpdater)
    },
    []
  )

  const addExpense = useCallback((expense: Omit<ConfigExpense, 'id'>) => {
    const newExpense: ConfigExpense = {
      ...expense,
      id: `exp-${Date.now()}`
    }
    setExpensesState((prev) => [...prev, newExpense])
  }, [])

  const updateExpense = useCallback(
    (id: string, updates: Partial<ConfigExpense>) => {
      setExpensesState((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      )
    },
    []
  )

  const deleteExpense = useCallback((id: string) => {
    setExpensesState((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // ====== ROLES & PERMISSIONS ======
  const setRoles = useCallback(
    (rolesOrUpdater: SetStateAction<ConfigRole[]>) => {
      setRolesState(rolesOrUpdater)
    },
    []
  )

  const addRole = useCallback((role: Omit<ConfigRole, 'id'>) => {
    const newRole: ConfigRole = {
      ...role,
      id: `role-${Date.now()}`
    }
    setRolesState((prev) => [...prev, newRole])
  }, [])

  const updateRole = useCallback((id: string, updates: Partial<ConfigRole>) => {
    setRolesState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }, [])

  const deleteRole = useCallback((id: string) => {
    setRolesState((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const toggleRolePermission = useCallback(
    (roleId: string, permissionId: string) => {
      setRolesState((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r
          const has = r.permisos.includes(permissionId)
          return {
            ...r,
            permisos: has
              ? r.permisos.filter((p) => p !== permissionId)
              : [...r.permisos, permissionId]
          }
        })
      )
    },
    []
  )

  const setPermissions = useCallback(
    (permissionsOrUpdater: SetStateAction<ConfigPermission[]>) => {
      setPermissionsState(permissionsOrUpdater)
    },
    []
  )

  const updatePermission = useCallback(
    (id: string, updates: Partial<ConfigPermission>) => {
      setPermissionsState((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      )
    },
    []
  )

  // ====== CONTEXT VALUE ======
  const value = useMemo<ConfigurationContextType>(
    () => ({
      clinicInfo,
      updateClinicInfo,
      clinics,
      addClinic,
      updateClinic,
      deleteClinic,
      professionals,
      activeProfessionals,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      getProfessionalById,
      getProfessionalByName,
      professionalOptions,
      professionalNameOptions,
      professionalNames,
      boxes,
      activeBoxes,
      addBox,
      updateBox,
      deleteBox,
      boxOptions,
      workingHours,
      updateWorkingHours,
      getPeriodConfig,
      documentTemplates,
      addDocumentTemplate,
      updateDocumentTemplate,
      deleteDocumentTemplate,
      getDocumentTemplateById,
      getDocumentTemplatesByType,
      resetDocumentTemplate,
      professionalSchedules,
      scheduleTemplates,
      getProfessionalSchedule,
      updateProfessionalSchedule,
      applyTemplateToProfessional,
      addScheduleException,
      removeScheduleException,
      copySchedule,
      isProfessionalAvailable,
      getProfessionalScheduleForDate,
      getAvailableProfessionalsForDate,
      treatmentCategories,
      setTreatmentCategories,
      addTreatmentCategory,
      updateTreatmentCategory,
      deleteTreatmentCategory,
      discounts,
      setDiscounts,
      addDiscount,
      updateDiscount,
      deleteDiscount,
      activeDiscounts,
      discountOptions,
      budgetTypes: budgetTypesState,
      setBudgetTypes,
      addBudgetType: addBudgetTypeCtx,
      updateBudgetType: updateBudgetTypeCtx,
      deleteBudgetType: deleteBudgetTypeCtx,
      expenses,
      setExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      roles,
      setRoles,
      addRole,
      updateRole,
      deleteRole,
      toggleRolePermission,
      permissions,
      setPermissions,
      updatePermission
    }),
    [
      clinicInfo,
      updateClinicInfo,
      clinics,
      addClinic,
      updateClinic,
      deleteClinic,
      professionals,
      activeProfessionals,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      getProfessionalById,
      getProfessionalByName,
      professionalOptions,
      professionalNameOptions,
      professionalNames,
      boxes,
      activeBoxes,
      addBox,
      updateBox,
      deleteBox,
      boxOptions,
      workingHours,
      updateWorkingHours,
      getPeriodConfig,
      documentTemplates,
      addDocumentTemplate,
      updateDocumentTemplate,
      deleteDocumentTemplate,
      getDocumentTemplateById,
      getDocumentTemplatesByType,
      resetDocumentTemplate,
      professionalSchedules,
      scheduleTemplates,
      getProfessionalSchedule,
      updateProfessionalSchedule,
      applyTemplateToProfessional,
      addScheduleException,
      removeScheduleException,
      copySchedule,
      isProfessionalAvailable,
      getProfessionalScheduleForDate,
      getAvailableProfessionalsForDate,
      treatmentCategories,
      setTreatmentCategories,
      addTreatmentCategory,
      updateTreatmentCategory,
      deleteTreatmentCategory,
      discounts,
      setDiscounts,
      addDiscount,
      updateDiscount,
      deleteDiscount,
      activeDiscounts,
      discountOptions,
      budgetTypesState,
      setBudgetTypes,
      addBudgetTypeCtx,
      updateBudgetTypeCtx,
      deleteBudgetTypeCtx,
      expenses,
      setExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      roles,
      setRoles,
      addRole,
      updateRole,
      deleteRole,
      toggleRolePermission,
      permissions,
      setPermissions,
      updatePermission
    ]
  )

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useConfiguration() {
  const context = useContext(ConfigurationContext)
  if (!context) {
    throw new Error(
      'useConfiguration must be used within a ConfigurationProvider'
    )
  }
  return context
}

// Export default for convenience
export default ConfigurationContext
