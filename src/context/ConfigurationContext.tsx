'use client'

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  BUDGET_TYPES_DATA,
  type BudgetTypeData
} from '@/components/pacientes/shared/budgetTypeData'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ConfigExpense } from '@/types/configExpenses'
import type { ConfigPermission, ConfigRole } from '@/types/configRoles'
import type { ConfigCategory, ConfigDiscount } from '@/types/treatments'
import { useClinic } from './ClinicContext'

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
  professionalLicenseId?: string
  phone: string
  email: string
  colorLabel: string
  colorTone: ProfessionalColorTone
  employmentType?: EmploymentType
  commission: string
  salary?: string
  status: 'Activo' | 'Inactivo'
  photoUrl?: string
}

type StaffSchemaSupport = {
  employmentTypeColumn: 'employment_type' | null
  salaryColumn: 'salary_amount' | 'salary' | null
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
// DOCUMENT TEMPLATE TYPES
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

export const DEFAULT_DOCUMENT_TEMPLATES: Record<DocumentTemplateType, string> = {
  factura: '<h1>Factura</h1>',
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
  justificante: '<h1>Justificante</h1>',
  consentimiento: '<h1>Consentimiento</h1>',
  presupuesto: '<h1>Presupuesto</h1>',
  informe: '<h1>Informe</h1>'
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentTemplateType, string> = {
  factura: 'Factura',
  receta: 'Receta',
  presupuesto: 'Presupuesto',
  justificante: 'Justificante',
  consentimiento: 'Consentimiento',
  informe: 'Informe'
}

const DOCUMENT_TEMPLATE_TYPES: DocumentTemplateType[] = [
  'factura',
  'receta',
  'justificante',
  'consentimiento',
  'presupuesto',
  'informe'
]

function isDocumentTemplateType(value: string): value is DocumentTemplateType {
  return DOCUMENT_TEMPLATE_TYPES.includes(value as DocumentTemplateType)
}

function normalizeDocumentTemplateType(
  value: string | null | undefined
): DocumentTemplateType | null {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  if (isDocumentTemplateType(normalized)) return normalized

  if (normalized === 'invoice' || normalized === 'facturas') return 'factura'
  if (normalized === 'prescription' || normalized === 'recetas') return 'receta'
  if (
    normalized === 'quote' ||
    normalized === 'estimate' ||
    normalized === 'presupuestos'
  ) {
    return 'presupuesto'
  }
  if (
    normalized === 'attendance' ||
    normalized === 'attendance_certificate' ||
    normalized === 'justificantes'
  ) {
    return 'justificante'
  }
  if (normalized === 'consent' || normalized === 'consentimientos') {
    return 'consentimiento'
  }
  if (normalized === 'report' || normalized === 'informes') return 'informe'

  return null
}

// ============================================
// PROFESSIONAL SCHEDULE TYPES
// ============================================

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ScheduleBreak = {
  id: string
  name: string
  start: string
  end: string
}

export type DaySchedule = {
  isWorking: boolean
  shifts: TimeRange[]
  breaks: ScheduleBreak[]
}

export type WeeklySchedule = {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export type ScheduleExceptionType = 'vacation' | 'holiday' | 'absence' | 'special'

export type ScheduleException = {
  id: string
  professionalId: string
  date: string
  type: ScheduleExceptionType
  reason?: string
  customSchedule?: DaySchedule
}

export type ScheduleTemplate = {
  id: string
  name: string
  description?: string
  weeklySchedule: WeeklySchedule
  isDefault?: boolean
}

export type ProfessionalSchedule = {
  professionalId: string
  weeklySchedule: WeeklySchedule
  exceptions: ScheduleException[]
  appliedTemplateId?: string
}

export const WEEKDAY_LABELS: Record<WeekDay, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export const WEEKDAYS_ORDER: WeekDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

export const EXCEPTION_TYPE_LABELS: Record<ScheduleExceptionType, string> = {
  vacation: 'Vacaciones',
  holiday: 'Festivo',
  absence: 'Ausencia',
  special: 'Horario especial'
}

const createNonWorkingDay = (): DaySchedule => ({
  isWorking: false,
  shifts: [],
  breaks: []
})

const createWorkingDayFromConfig = (
  startHour: number,
  endHour: number
): DaySchedule => ({
  isWorking: true,
  shifts: [
    {
      start: `${String(startHour).padStart(2, '0')}:00`,
      end: `${String(endHour).padStart(2, '0')}:00`
    }
  ],
  breaks: []
})

const createDefaultWeeklySchedule = (
  cfg: WorkingHoursConfig
): WeeklySchedule => {
  const working = createWorkingDayFromConfig(cfg.defaultStartHour, cfg.defaultEndHour)
  return {
    monday: cfg.workingDays.includes('lunes') ? working : createNonWorkingDay(),
    tuesday: cfg.workingDays.includes('martes') ? working : createNonWorkingDay(),
    wednesday: cfg.workingDays.includes('miercoles') ? working : createNonWorkingDay(),
    thursday: cfg.workingDays.includes('jueves') ? working : createNonWorkingDay(),
    friday: cfg.workingDays.includes('viernes') ? working : createNonWorkingDay(),
    saturday: cfg.workingDays.includes('sabado') ? working : createNonWorkingDay(),
    sunday: cfg.workingDays.includes('domingo') ? working : createNonWorkingDay()
  }
}

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'clinic-default',
    name: 'Horario de clínica',
    description: 'Basado en la configuración de horario de clínica',
    isDefault: true,
    weeklySchedule: createDefaultWeeklySchedule({
      defaultStartHour: 9,
      defaultEndHour: 20,
      slotDurationMinutes: 15,
      workingDays: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      morningShift: { start: '09:00', end: '14:00' },
      afternoonShift: { start: '15:00', end: '20:00' }
    })
  },
  {
    id: 'morning',
    name: 'Media jornada mañana',
    weeklySchedule: {
      monday: { isWorking: true, shifts: [{ start: '09:00', end: '14:00' }], breaks: [] },
      tuesday: { isWorking: true, shifts: [{ start: '09:00', end: '14:00' }], breaks: [] },
      wednesday: { isWorking: true, shifts: [{ start: '09:00', end: '14:00' }], breaks: [] },
      thursday: { isWorking: true, shifts: [{ start: '09:00', end: '14:00' }], breaks: [] },
      friday: { isWorking: true, shifts: [{ start: '09:00', end: '14:00' }], breaks: [] },
      saturday: createNonWorkingDay(),
      sunday: createNonWorkingDay()
    }
  }
]

// ============================================
// DATOS INICIALES (MOCK)
// ============================================

const initialClinicInfo: ClinicInfo = {
  id: '',
  nombreComercial: '',
  razonSocial: '',
  cif: '',
  direccion: '',
  poblacion: '',
  codigoPostal: '',
  telefono: '',
  email: '',
  iban: '',
  emailBancario: ''
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
    commission: '30%',
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
    commission: '25%',
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

const initialProfessionalSchedules: ProfessionalSchedule[] = initialProfessionals.map(
  (professional) => ({
    professionalId: professional.id,
    weeklySchedule: createDefaultWeeklySchedule(initialWorkingHours),
    exceptions: [],
    appliedTemplateId: 'clinic-default'
  })
)

const DAY_INDEX_TO_NAME: Record<number, DayOfWeek> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado'
}

const DAY_NAME_TO_INDEX: Record<DayOfWeek, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0
}

function parseHexToTone(hex?: string | null): ProfessionalColorTone {
  const raw = String(hex || '').trim().toLowerCase()
  if (!raw) return 'morado'

  if (raw.includes('orange') || raw.includes('naranja')) return 'naranja'
  if (raw.includes('green') || raw.includes('verde') || raw.includes('teal'))
    return 'verde'
  if (raw.includes('blue') || raw.includes('azul')) return 'azul'
  if (raw.includes('red') || raw.includes('rojo') || raw.includes('coral'))
    return 'rojo'
  if (raw.includes('purple') || raw.includes('morado')) return 'morado'

  const normalizedHex = (() => {
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
    }
    if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw
    return ''
  })()

  const toneByHex: Record<string, ProfessionalColorTone> = {
    '#7725eb': 'morado',
    '#8b5cf6': 'morado',
    '#d97706': 'naranja',
    '#f59e0b': 'naranja',
    '#2e7d5b': 'verde',
    '#10b981': 'verde',
    '#51d6c7': 'verde',
    '#0369a1': 'azul',
    '#0ea5e9': 'azul',
    '#2563eb': 'azul',
    '#dc2626': 'rojo',
    '#ef4444': 'rojo'
  }
  if (normalizedHex && toneByHex[normalizedHex]) return toneByHex[normalizedHex]

  const parseRgbHex = (value: string): [number, number, number] | null => {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return null
    return [
      parseInt(value.slice(1, 3), 16),
      parseInt(value.slice(3, 5), 16),
      parseInt(value.slice(5, 7), 16)
    ]
  }

  const target = parseRgbHex(normalizedHex)
  if (!target) return 'morado'

  const palette = (
    Object.keys(professionalColorStyles) as ProfessionalColorTone[]
  ).map((tone) => ({
    tone,
    rgb: parseRgbHex(professionalColorStyles[tone].hex) || [0, 0, 0]
  }))

  let bestTone: ProfessionalColorTone = 'morado'
  let bestDistance = Number.POSITIVE_INFINITY
  for (const entry of palette) {
    const distance =
      (target[0] - entry.rgb[0]) ** 2 +
      (target[1] - entry.rgb[1]) ** 2 +
      (target[2] - entry.rgb[2]) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      bestTone = entry.tone
    }
  }

  return bestTone
}

function toneToLabel(tone: ProfessionalColorTone): string {
  switch (tone) {
    case 'naranja':
      return 'Naranja'
    case 'verde':
      return 'Verde'
    case 'azul':
      return 'Azul'
    case 'rojo':
      return 'Rojo'
    default:
      return 'Morado'
  }
}

function toneToHex(tone: ProfessionalColorTone): string {
  return professionalColorStyles[tone]?.hex || professionalColorStyles.morado.hex
}

function parseCommissionPercentage(commission: string): number | null {
  const parsed = Number(String(commission || '').replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function formatCommissionPercentage(value: unknown): string {
  if (value == null) return '0%'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? `${numeric}%` : '0%'
}

function parseEmploymentType(value: unknown): EmploymentType | undefined {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'autonomo' || normalized === 'autónomo') return 'autonomo'
  if (normalized === 'nomina' || normalized === 'nómina') return 'nomina'
  return undefined
}

function parseSalaryAmount(value: string | undefined): number | null {
  const numeric = Number(String(value || '').replace(',', '.').trim())
  return Number.isFinite(numeric) ? numeric : null
}

function formatSalaryAmount(value: unknown): string | undefined {
  if (value == null) return undefined
  const numeric = Number(value)
  return Number.isFinite(numeric) ? String(numeric) : undefined
}

type SupabaseLikeError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
} | null | undefined

function isMissingColumnError(error: SupabaseLikeError): boolean {
  if (!error) return false
  const code = String(error.code || '')
  const message = String(error.message || '').toLowerCase()
  const details = String(error.details || '').toLowerCase()
  const hint = String(error.hint || '').toLowerCase()
  if (code === '42703' || code === 'PGRST204') return true
  return (
    message.includes('does not exist') ||
    message.includes('could not find') ||
    details.includes('does not exist') ||
    hint.includes('does not exist')
  )
}

function mapProfessionalRoleToUserRole(
  role: string
): 'gerencia' | 'doctor' | 'higienista' | 'recepcion' {
  const normalized = role.toLowerCase()
  if (normalized.includes('higien')) return 'higienista'
  if (
    normalized.includes('recep') ||
    normalized.includes('admin') ||
    normalized.includes('auxiliar')
  ) {
    return 'recepcion'
  }
  if (normalized.includes('geren') || normalized.includes('manager')) {
    return 'gerencia'
  }
  return 'doctor'
}

function slugifyRoleName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
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
  professionalNames: string[]
  professionalNameOptions: Array<{ value: string; label: string }>

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
  getProfessionalSchedule: (professionalId: string) => ProfessionalSchedule | undefined
  updateProfessionalSchedule: (professionalId: string, schedule: WeeklySchedule) => void
  applyTemplateToProfessional: (professionalId: string, templateId: string) => void
  addScheduleException: (exception: Omit<ScheduleException, 'id'>) => void
  removeScheduleException: (exceptionId: string) => void
  copySchedule: (fromProfessionalId: string, toProfessionalId: string) => void
  isProfessionalAvailable: (professionalId: string, date: Date, time: string) => boolean
  getProfessionalScheduleForDate: (professionalId: string, date: Date) => DaySchedule | null
  getAvailableProfessionalsForDate: (date: Date) => Professional[]

  // Treatments, discounts, budget types
  treatmentCategories: ConfigCategory[]
  setTreatmentCategories: Dispatch<SetStateAction<ConfigCategory[]>>
  discounts: ConfigDiscount[]
  setDiscounts: Dispatch<SetStateAction<ConfigDiscount[]>>
  discountOptions: string[]
  budgetTypes: BudgetTypeData[]
  setBudgetTypes: Dispatch<SetStateAction<BudgetTypeData[]>>
  addBudgetType: (budgetType: Omit<BudgetTypeData, 'id'>) => BudgetTypeData
  updateBudgetType: (id: string, updates: Partial<BudgetTypeData>) => void
  deleteBudgetType: (id: string) => void

  // Finances
  expenses: ConfigExpense[]
  setExpenses: Dispatch<SetStateAction<ConfigExpense[]>>

  // Roles and permissions
  roles: ConfigRole[]
  setRoles: Dispatch<SetStateAction<ConfigRole[]>>
  toggleRolePermission: (roleId: string, permissionId: string) => void
  permissions: ConfigPermission[]
  setPermissions: Dispatch<SetStateAction<ConfigPermission[]>>
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
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [workingHours, setWorkingHours] =
    useState<WorkingHoursConfig>(initialWorkingHours)
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>(
    initialDocumentTemplates
  )
  const [professionalSchedules, setProfessionalSchedules] = useState<
    ProfessionalSchedule[]
  >(initialProfessionalSchedules)
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(
    null
  )
  const [scheduleTemplates] = useState<ScheduleTemplate[]>(
    DEFAULT_SCHEDULE_TEMPLATES
  )
  const [treatmentCategories, setTreatmentCategories] = useState<ConfigCategory[]>(
    []
  )
  const [discounts, setDiscountsState] = useState<ConfigDiscount[]>([])
  const [budgetTypesState, setBudgetTypesState] =
    useState<BudgetTypeData[]>(BUDGET_TYPES_DATA)
  const [expenses, setExpensesState] = useState<ConfigExpense[]>([])
  const [roles, setRolesState] = useState<ConfigRole[]>([])
  const [permissions, setPermissionsState] = useState<ConfigPermission[]>([])
  const [staffSchemaSupport, setStaffSchemaSupport] =
    useState<StaffSchemaSupport>({
      employmentTypeColumn: null,
      salaryColumn: null
    })
  const staffSchemaResolvedRef = useRef(true)
  const {
    activeClinicId,
    clinics: clinicOptions,
    isInitialized: isClinicInitialized
  } = useClinic()

  useEffect(() => {
    if (!Array.isArray(clinicOptions) || clinicOptions.length === 0) return
    setClinics((previous) => {
      if (previous.length > 0) return previous
      const fallbackClinic =
        clinicOptions.find((clinic) => clinic.id === activeClinicId) ||
        clinicOptions[0]
      if (!fallbackClinic) return previous
      return [
        {
          id: fallbackClinic.id,
          nombre: fallbackClinic.name || 'Clínica',
          direccion: fallbackClinic.address || 'Sin dirección',
          horario: `${String(initialWorkingHours.defaultStartHour).padStart(2, '0')}:00 - ${String(
            initialWorkingHours.defaultEndHour
          ).padStart(2, '0')}:00`,
          telefono: '',
          email: '',
          isActive: true
        }
      ]
    })
  }, [activeClinicId, clinicOptions])

  useEffect(() => {
    let isMounted = true

    async function hydrateConfigurationFromDb() {
      try {
        if (!isClinicInitialized || !activeClinicId) return

        const supabase = createSupabaseBrowserClient()

        const clinicIds = Array.from(
          new Set([activeClinicId, ...clinicOptions.map((clinic) => clinic.id)].filter(Boolean))
        )
        const selectedClinicId = activeClinicId

        const [
          { data: clinicRows, error: clinicRowsError },
          { data: boxRows, error: boxRowsError },
          { data: workingRows, error: workingRowsError },
          { data: staffLiteRows, error: staffLiteRowsError },
          { data: clinicPhoneRows, error: clinicPhoneRowsError },
          { data: documentTemplateRows, error: documentTemplateRowsError }
        ] =
          await Promise.all([
            supabase
              .from('clinics')
              .select(
                'id, organization_id, name, legal_name, tax_id, website, logo_url, address, contact_info'
              )
              .in('id', clinicIds)
              .order('name', { ascending: true }),
            supabase
              .from('boxes')
              .select('id, clinic_id, name_or_number')
              .eq('clinic_id', selectedClinicId),
            supabase
              .from('clinic_working_hours')
              .select('dow, start_time, end_time, is_open')
              .eq('clinic_id', selectedClinicId)
              .order('dow', { ascending: true }),
            supabase.rpc('get_clinic_staff', { clinic: selectedClinicId }),
            supabase
              .from('clinic_phone_numbers')
              .select('clinic_id, phone_e164, is_active, created_at')
              .in('clinic_id', clinicIds)
              .eq('is_active', true)
              .order('created_at', { ascending: false }),
            supabase
              .from('document_templates')
              .select('*')
              .or(`clinic_id.is.null,clinic_id.eq.${selectedClinicId}`)
              .eq('is_active', true)
              .order('created_at', { ascending: true })
          ])

        if (clinicRowsError) {
          console.warn('No se pudieron cargar clínicas en ConfigurationContext', clinicRowsError)
        }
        if (boxRowsError) {
          console.warn('No se pudieron cargar gabinetes en ConfigurationContext', boxRowsError)
        }
        if (workingRowsError) {
          console.warn(
            'No se pudieron cargar horarios de clínica en ConfigurationContext',
            workingRowsError
          )
        }
        if (staffLiteRowsError) {
          console.warn(
            'No se pudieron cargar especialistas de clínica en ConfigurationContext',
            staffLiteRowsError
          )
        }
        if (clinicPhoneRowsError) {
          console.warn(
            'No se pudieron cargar teléfonos de clínica en ConfigurationContext',
            clinicPhoneRowsError
          )
        }
        if (
          documentTemplateRowsError &&
          documentTemplateRowsError.code !== '42P01'
        ) {
          console.warn(
            'No se pudieron cargar plantillas de documentos en ConfigurationContext',
            documentTemplateRowsError
          )
        }

        const selectedClinicRow =
          (clinicRows || []).find((row) => String(row.id) === selectedClinicId) ||
          clinicRows?.[0]
        const selectedOrganizationId =
          typeof selectedClinicRow?.organization_id === 'string'
            ? selectedClinicRow.organization_id
            : null
        const sameOrganizationClinicRows =
          selectedOrganizationId && Array.isArray(clinicRows)
            ? clinicRows.filter(
                (row) => String(row.organization_id || '') === selectedOrganizationId
              )
            : clinicRows || []

        const { data: staffClinicRows, error: staffClinicRowsError } =
          selectedOrganizationId && sameOrganizationClinicRows.length > 0
            ? await supabase
                .from('staff_clinics')
                .select('staff_id')
                .in(
                  'clinic_id',
                  sameOrganizationClinicRows.map((row) => String(row.id))
                )
            : await supabase
                .from('staff_clinics')
                .select('staff_id')
                .eq('clinic_id', selectedClinicId)

        if (staffClinicRowsError) {
          console.warn(
            'No se pudieron cargar relaciones staff_clinics en ConfigurationContext',
            staffClinicRowsError
          )
        }

        const rpcStaffIds = Array.isArray(staffLiteRows)
          ? staffLiteRows
              .map((row) => String((row as { id?: string }).id || ''))
              .filter(Boolean)
          : []
        const relationStaffIds = Array.isArray(staffClinicRows)
          ? staffClinicRows
              .map((row) => String((row as { staff_id?: string }).staff_id || ''))
              .filter(Boolean)
          : []
        const staffIds = Array.from(new Set([...rpcStaffIds, ...relationStaffIds]))
        const staffBaseSelect =
          'id, full_name, specialties, professional_license_id, phone, email, calendar_color, commission_percentage, is_active, avatar_url'
        let detectedStaffSchemaSupport: StaffSchemaSupport = {
          employmentTypeColumn: null,
          salaryColumn: null
        }
        let staffRows: Array<Record<string, unknown>> = []
        let staffRowsError: { code?: string; message?: string } | null = null
        if (staffIds.length > 0) {
          const selectAttempts: Array<{
            select: string
            support: StaffSchemaSupport
          }> = [
            {
              select: [
                staffBaseSelect,
                staffSchemaSupport.employmentTypeColumn,
                staffSchemaSupport.salaryColumn
              ]
                .filter(Boolean)
                .join(', '),
              support: staffSchemaSupport
            }
          ]

          for (const attempt of selectAttempts) {
            const response = await supabase
              .from('staff')
              .select(attempt.select)
              .in('id', staffIds)
            if (response.error) {
              staffRowsError = {
                code: response.error.code,
                message: response.error.message
              }
              if (isMissingColumnError(response.error)) {
                continue
              }
            } else {
              staffRows = (response.data || []) as unknown as Array<
                Record<string, unknown>
              >
              detectedStaffSchemaSupport = attempt.support
              staffRowsError = null
              staffSchemaResolvedRef.current = true
              break
            }
          }
        }
        if (staffRowsError) {
          console.warn(
            'No se pudo cargar detalle de especialistas en ConfigurationContext',
            staffRowsError
          )
        }

        let resolvedBoxRows: Array<{
          id: unknown
          clinic_id?: unknown
          name_or_number?: unknown
        }> = Array.isArray(boxRows) ? (boxRows as Array<{ id: unknown; clinic_id?: unknown; name_or_number?: unknown }>) : []
        if (resolvedBoxRows.length === 0) {
          const { data: boxRpcRows } = await supabase.rpc('get_clinic_boxes', {
            clinic: selectedClinicId
          })
          if (Array.isArray(boxRpcRows)) {
            resolvedBoxRows = boxRpcRows.map((row) => ({
              id: (row as { id?: string }).id || '',
              name_or_number:
                (row as { name_or_number?: string; name?: string }).name_or_number ||
                (row as { name?: string }).name ||
                ''
            }))
          }
        }
        const workingRowsSafe = workingRows || []

        const phonesByClinicId = new Map<string, string>()
        if (Array.isArray(clinicPhoneRows)) {
          clinicPhoneRows.forEach((row) => {
            const clinicId = String(
              (row as { clinic_id?: string }).clinic_id || ''
            )
            const phone = String(
              (row as { phone_e164?: string }).phone_e164 || ''
            )
            if (!clinicId || !phone || phonesByClinicId.has(clinicId)) return
            phonesByClinicId.set(clinicId, phone)
          })
        }

        const mappedClinics: Clinic[] = Array.isArray(sameOrganizationClinicRows)
          ? sameOrganizationClinicRows.map((row) => {
              const address = (row.address as Record<string, unknown> | null) || {}
              const contact = (row.contact_info as Record<string, unknown> | null) || {}
              const city = String(address.city || '')
              const street = String(address.street || '')
              const line2 = String(address.line2 || '')
              const direction = [street, line2, city].filter(Boolean).join(', ')
              const openHour = Number(workingRowsSafe[0]?.start_time?.slice(0, 2) || 9)
              const closeHour = Number(
                workingRowsSafe[workingRowsSafe.length - 1]?.end_time?.slice(0, 2) ||
                  20
              )

              return {
                id: String(row.id),
                nombre: String(row.name || 'Clínica'),
                direccion: direction || 'Sin dirección',
                horario: `${String(openHour).padStart(2, '0')}:00 - ${String(
                  closeHour
                ).padStart(2, '0')}:00`,
                telefono:
                  phonesByClinicId.get(String(row.id)) ||
                  String(contact.phone || ''),
                email: String(contact.email || ''),
                isActive: true
              }
            })
          : []

        const selectedAddress =
          (selectedClinicRow?.address as Record<string, unknown> | null) || {}
        const selectedContact =
          (selectedClinicRow?.contact_info as Record<string, unknown> | null) || {}

        const staffRowsById = new Map<string, Record<string, unknown>>(
          Array.isArray(staffRows)
            ? staffRows.map((row) => [String(row.id), row as Record<string, unknown>])
            : []
        )

        const mappedProfessionalsFromStaffRows: Professional[] = Array.isArray(staffRows)
          ? staffRows.map((row) => {
              const tone = parseHexToTone(
                typeof row.calendar_color === 'string' ? row.calendar_color : null
              )
              const employmentRaw =
                detectedStaffSchemaSupport.employmentTypeColumn
                  ? row[detectedStaffSchemaSupport.employmentTypeColumn]
                  : undefined
              const salaryRaw =
                detectedStaffSchemaSupport.salaryColumn
                  ? row[detectedStaffSchemaSupport.salaryColumn]
                  : undefined
              const employmentType = parseEmploymentType(employmentRaw)
              const salaryAmount = formatSalaryAmount(salaryRaw)
              return {
                id: String(row.id),
                name: String(row.full_name || 'Profesional'),
                role: Array.isArray(row.specialties)
                  ? String(row.specialties[0] || 'Profesional')
                  : 'Profesional',
                professionalLicenseId:
                  typeof row.professional_license_id === 'string'
                    ? row.professional_license_id
                    : undefined,
                phone: String(row.phone || ''),
                email: String(row.email || ''),
                colorLabel: toneToLabel(tone),
                colorTone: tone,
                employmentType,
                commission:
                  row.commission_percentage != null
                    ? `${Number(row.commission_percentage)}%`
                    : '0%',
                salary: salaryAmount,
                status: row.is_active === false ? 'Inactivo' : 'Activo',
                photoUrl:
                  typeof row.avatar_url === 'string' ? row.avatar_url : undefined
              }
            })
          : []

        const mappedProfessionalsFromLiteRows: Professional[] = Array.isArray(staffLiteRows)
          ? staffLiteRows
              .filter((row) => {
                const staffId = String((row as { id?: string }).id || '')
                return staffId && !staffRowsById.has(staffId)
              })
              .map((row) => ({
                id: String((row as { id?: string }).id || ''),
                name: String((row as { full_name?: string }).full_name || 'Profesional'),
                role: 'Profesional',
                phone: '',
                email: '',
                colorLabel: 'Morado',
                colorTone: 'morado',
                commission: '0%',
                status: 'Activo'
              }))
          : []

        const mappedProfessionals: Professional[] =
          mappedProfessionalsFromStaffRows.length > 0 || mappedProfessionalsFromLiteRows.length > 0
            ? [...mappedProfessionalsFromStaffRows, ...mappedProfessionalsFromLiteRows]
            : []

        const mappedBoxes: Box[] = Array.isArray(resolvedBoxRows)
          ? resolvedBoxRows.map((row) => ({
              id: String(row.id),
              label: String(row.name_or_number || 'BOX'),
              tone: 'neutral' as const,
              isActive: true
            }))
          : []

        const mappedDocumentTemplates: DocumentTemplate[] = Array.isArray(
          documentTemplateRows
        )
          ? documentTemplateRows
              .map((row) => {
                const typedRow = row as {
                  id?: string
                  title?: string
                  type?: string
                  content?: string
                  content_html?: string
                  logo_url?: string | null
                  logo_position?: { x?: number; y?: number } | null
                  is_default?: boolean
                  updated_at?: string | null
                }
                const templateType = normalizeDocumentTemplateType(typedRow.type)
                if (!templateType) return null
                return {
                  id: String(typedRow.id || ''),
                  title: String(
                    typedRow.title || DOCUMENT_TYPE_LABELS[templateType]
                  ),
                  type: templateType,
                  content: String(
                    typedRow.content ||
                      typedRow.content_html ||
                      DEFAULT_DOCUMENT_TEMPLATES[templateType]
                  ),
                  logoUrl:
                    typeof typedRow.logo_url === 'string'
                      ? typedRow.logo_url
                      : undefined,
                  logoPosition:
                    typedRow.logo_position &&
                    typeof typedRow.logo_position === 'object'
                      ? {
                          x: Number(typedRow.logo_position.x ?? 20),
                          y: Number(typedRow.logo_position.y ?? 20)
                        }
                      : undefined,
                  isDefault: typedRow.is_default === true,
                  lastModified:
                    typeof typedRow.updated_at === 'string'
                      ? typedRow.updated_at
                      : undefined
                } as DocumentTemplate
              })
              .filter((template): template is DocumentTemplate => Boolean(template))
          : []

        const openWorkingRows = workingRowsSafe.filter((row) => row.is_open)
        const workingDays =
          openWorkingRows.length > 0
            ? openWorkingRows
                .map((row) => DAY_INDEX_TO_NAME[row.dow] || null)
                .filter(Boolean) as DayOfWeek[]
            : initialWorkingHours.workingDays

        const minStartHour =
          openWorkingRows.length > 0
            ? Math.min(...openWorkingRows.map((row) => Number(row.start_time.slice(0, 2))))
            : initialWorkingHours.defaultStartHour
        const maxEndHour =
          openWorkingRows.length > 0
            ? Math.max(...openWorkingRows.map((row) => Number(row.end_time.slice(0, 2))))
            : initialWorkingHours.defaultEndHour

        const morningRows = openWorkingRows.filter(
          (row) => Number(row.end_time.slice(0, 2)) <= 15
        )
        const afternoonRows = openWorkingRows.filter(
          (row) => Number(row.start_time.slice(0, 2)) >= 14
        )

        const newWorkingHours: WorkingHoursConfig = {
          defaultStartHour: minStartHour,
          defaultEndHour: maxEndHour,
          slotDurationMinutes: initialWorkingHours.slotDurationMinutes,
          workingDays,
          morningShift: {
            start: morningRows[0]?.start_time?.slice(0, 5) || '09:00',
            end:
              morningRows[morningRows.length - 1]?.end_time?.slice(0, 5) ||
              '14:00'
          },
          afternoonShift: {
            start: afternoonRows[0]?.start_time?.slice(0, 5) || '15:00',
            end:
              afternoonRows[afternoonRows.length - 1]?.end_time?.slice(0, 5) ||
              '20:00'
          }
        }

        if (isMounted) {
          if (mappedClinics.length > 0) setClinics(mappedClinics)
          setStaffSchemaSupport(detectedStaffSchemaSupport)
          setProfessionals(mappedProfessionals)
          setBoxes(mappedBoxes)
          setWorkingHours(newWorkingHours)
          if (!documentTemplateRowsError) {
            setDocumentTemplates(mappedDocumentTemplates)
          }

          if (selectedClinicRow) {
            setClinicInfo({
              id: String(selectedClinicRow.id),
              nombreComercial: String(selectedClinicRow.name || ''),
              razonSocial: String(selectedClinicRow.legal_name || ''),
              cif: String(selectedClinicRow.tax_id || ''),
              direccion: String(selectedAddress.street || ''),
              poblacion: String(selectedAddress.city || ''),
              codigoPostal: String(selectedAddress.postal_code || ''),
              telefono:
                phonesByClinicId.get(String(selectedClinicRow.id)) ||
                String(selectedContact.phone || ''),
              email: String(selectedContact.email || ''),
              iban: String(selectedContact.iban || ''),
              emailBancario: String(selectedContact.billing_email || ''),
              logo:
                typeof selectedClinicRow.logo_url === 'string'
                  ? selectedClinicRow.logo_url
                  : undefined,
              web:
                typeof selectedClinicRow.website === 'string'
                  ? selectedClinicRow.website
                  : undefined
            })
            const organizationId =
              typeof selectedClinicRow.organization_id === 'string'
                ? selectedClinicRow.organization_id
                : null
            setActiveOrganizationId(organizationId)
          }
        }
      } catch (error) {
        console.warn(
          'ConfigurationContext DB hydration failed; preserving current in-memory state',
          error
        )
      }
    }

    void hydrateConfigurationFromDb()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, clinicOptions, isClinicInitialized, staffSchemaSupport])

  useEffect(() => {
    setProfessionalSchedules((previous) => {
      const byId = new Map(previous.map((schedule) => [schedule.professionalId, schedule]))
      const next = professionals
        .filter((professional) => professional.status === 'Activo')
        .map((professional) => {
          const existing = byId.get(professional.id)
          return (
            existing || {
              professionalId: professional.id,
              weeklySchedule: createDefaultWeeklySchedule(workingHours),
              exceptions: [],
              appliedTemplateId: 'clinic-default'
            }
          )
        })
      return next
    })
  }, [professionals, workingHours])

  // ====== CLINIC INFO ======
  const updateClinicInfo = useCallback((updates: Partial<ClinicInfo>) => {
    const mergedClinicInfo: ClinicInfo = { ...clinicInfo, ...updates }
    setClinicInfo(mergedClinicInfo)

    if (!activeClinicId) return

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString()
        }

        if (updates.nombreComercial !== undefined) payload.name = updates.nombreComercial
        if (updates.razonSocial !== undefined) payload.legal_name = updates.razonSocial
        if (updates.cif !== undefined) payload.tax_id = updates.cif
        if (updates.web !== undefined) payload.website = updates.web || null
        if (updates.logo !== undefined) payload.logo_url = updates.logo || null

        payload.address = {
          street: mergedClinicInfo.direccion || null,
          city: mergedClinicInfo.poblacion || null,
          postal_code: mergedClinicInfo.codigoPostal || null
        }
        payload.contact_info = {
          phone: mergedClinicInfo.telefono || null,
          email: mergedClinicInfo.email || null,
          iban: mergedClinicInfo.iban || null,
          billing_email: mergedClinicInfo.emailBancario || null
        }

        const { error } = await supabase
          .from('clinics')
          .update(payload)
          .eq('id', activeClinicId)

        if (error) {
          console.warn('No se pudo persistir clinicInfo en DB', error)
        }
      } catch (error) {
        console.warn('Error persistiendo clinicInfo en DB', error)
      }
    })()
  }, [activeClinicId, clinicInfo])

  // ====== CLINICS ======
  const addClinic = useCallback((clinic: Omit<Clinic, 'id'>) => {
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        let organizationId = activeOrganizationId

        if (!organizationId && activeClinicId) {
          const { data: activeClinicRow } = await supabase
            .from('clinics')
            .select('organization_id')
            .eq('id', activeClinicId)
            .single()
          organizationId =
            typeof activeClinicRow?.organization_id === 'string'
              ? activeClinicRow.organization_id
              : null
          if (organizationId) {
            setActiveOrganizationId(organizationId)
          }
        }

        if (!organizationId) {
          console.warn(
            'No se pudo crear clínica: organización activa no disponible'
          )
          return
        }

        const { data: insertedRow, error } = await supabase
          .from('clinics')
          .insert({
            organization_id: organizationId,
            name: clinic.nombre || 'Nueva clínica',
            legal_name: clinic.nombre || null,
            address: {
              street: clinic.direccion || null
            },
            contact_info: {
              phone: clinic.telefono || null,
              email: clinic.email || null
            }
          })
          .select('id, name, address, contact_info')
          .single()

        if (error || !insertedRow) {
          console.warn('No se pudo crear clínica en DB', error)
          return
        }

        const address =
          (insertedRow.address as Record<string, unknown> | null) || {}
        const contact =
          (insertedRow.contact_info as Record<string, unknown> | null) || {}

        setClinics((prev) => [
          ...prev,
          {
            id: String(insertedRow.id),
            nombre: String(insertedRow.name || clinic.nombre || 'Clínica'),
            direccion: String(address.street || clinic.direccion || ''),
            horario: clinic.horario,
            telefono: String(contact.phone || clinic.telefono || ''),
            email: String(contact.email || clinic.email || ''),
            isActive: clinic.isActive
          }
        ])
      } catch (error) {
        console.warn('Error creando clínica en DB', error)
      }
    })()
  }, [activeClinicId, activeOrganizationId])

  const updateClinic = useCallback((id: string, updates: Partial<Clinic>) => {
    setClinics((prev) => {
      const current = prev.find((clinic) => clinic.id === id)
      if (!current) return prev
      const merged = { ...current, ...updates }

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase
            .from('clinics')
            .update({
              name: merged.nombre,
              legal_name: merged.nombre,
              address: { street: merged.direccion || null },
              contact_info: {
                phone: merged.telefono || null,
                email: merged.email || null
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
          if (error) {
            console.warn('No se pudo actualizar clínica en DB', error)
          }
        } catch (error) {
          console.warn('Error actualizando clínica en DB', error)
        }
      })()

      return prev.map((clinic) => (clinic.id === id ? merged : clinic))
    })
  }, [])

  const deleteClinic = useCallback((id: string) => {
    setClinics((prev) => prev.filter((c) => c.id !== id))
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.from('clinics').delete().eq('id', id)
        if (error) {
          console.warn('No se pudo eliminar clínica en DB', error)
        }
      } catch (error) {
        console.warn('Error eliminando clínica en DB', error)
      }
    })()
  }, [])

  // ====== PROFESSIONALS ======
  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.status === 'Activo'),
    [professionals]
  )

  const addProfessional = useCallback(
    (professional: Omit<Professional, 'id'>) => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const staffRole = mapProfessionalRoleToUserRole(professional.role)
          const roleSlug = slugifyRoleName(professional.role)
          let roleQuery = supabase.from('roles').select('id')
          if (activeClinicId && roleSlug) {
            roleQuery = roleQuery.or(
              `and(clinic_id.eq.${activeClinicId},name.eq.${roleSlug}),name.eq.${staffRole}`
            )
          } else {
            roleQuery = roleQuery.eq('name', staffRole)
          }

          const { data: roleRow } = await roleQuery
            .order('clinic_id', { ascending: false })
            .limit(1)
            .maybeSingle()

          const baseStaffPayload: Record<string, unknown> = {
            full_name: professional.name || 'Profesional',
            specialties: professional.role ? [professional.role] : [],
            phone: professional.phone || null,
            email: professional.email || null,
            calendar_color: toneToHex(professional.colorTone),
            commission_percentage: parseCommissionPercentage(
              professional.commission
            ),
            is_active: professional.status === 'Activo',
            avatar_url: professional.photoUrl || null
          }
          const payloadWithOptional: Record<string, unknown> = {
            ...baseStaffPayload
          }
          if (staffSchemaSupport.employmentTypeColumn) {
            payloadWithOptional[staffSchemaSupport.employmentTypeColumn] =
              professional.employmentType || null
          }
          if (staffSchemaSupport.salaryColumn) {
            payloadWithOptional[staffSchemaSupport.salaryColumn] =
              parseSalaryAmount(professional.salary)
          }

          const staffBaseSelect =
            'id, full_name, specialties, phone, email, calendar_color, commission_percentage, is_active, avatar_url'
          const selectWithOptional = [
            staffBaseSelect,
            staffSchemaSupport.employmentTypeColumn,
            staffSchemaSupport.salaryColumn
          ]
            .filter(Boolean)
            .join(', ')

          let insertResponse = await supabase
            .from('staff')
            .insert(payloadWithOptional)
            .select(selectWithOptional || staffBaseSelect)
            .single()

          let insertedStaff = insertResponse.data as Record<string, unknown> | null
          let staffError = insertResponse.error
          if (staffError?.code === '42703') {
            insertResponse = await supabase
              .from('staff')
              .insert(baseStaffPayload)
              .select(staffBaseSelect)
              .single()
            insertedStaff = insertResponse.data as Record<string, unknown> | null
            staffError = insertResponse.error
            if (!staffError) {
              setStaffSchemaSupport({
                employmentTypeColumn: null,
                salaryColumn: null
              })
            }
          }

          if (staffError || !insertedStaff) {
            console.warn('No se pudo crear profesional en DB', staffError)
            return
          }

          if (activeClinicId) {
            const { error: relationError } = await supabase
              .from('staff_clinics')
              .insert({
                staff_id: insertedStaff.id,
                clinic_id: activeClinicId,
                role: staffRole,
                role_id: Number(roleRow?.id || 3)
              })
            if (relationError) {
              console.warn(
                'No se pudo asociar profesional a la clínica en DB',
                relationError
              )
            }
          }

          const tone = parseHexToTone(
            typeof insertedStaff.calendar_color === 'string'
              ? insertedStaff.calendar_color
              : null
          )
          const persistedProfessional: Professional = {
            id: String(insertedStaff.id),
            name: String(insertedStaff.full_name || professional.name),
            role: Array.isArray(insertedStaff.specialties)
              ? String(insertedStaff.specialties[0] || professional.role)
              : professional.role,
            phone: String(insertedStaff.phone || professional.phone || ''),
            email: String(insertedStaff.email || professional.email || ''),
            colorLabel: toneToLabel(tone),
            colorTone: tone,
            employmentType:
              parseEmploymentType(
                staffSchemaSupport.employmentTypeColumn
                  ? insertedStaff[staffSchemaSupport.employmentTypeColumn]
                  : undefined
              ) || professional.employmentType,
            commission: formatCommissionPercentage(
              insertedStaff.commission_percentage
            ),
            salary:
              formatSalaryAmount(
                staffSchemaSupport.salaryColumn
                  ? insertedStaff[staffSchemaSupport.salaryColumn]
                  : undefined
              ) || professional.salary,
            status: insertedStaff.is_active === false ? 'Inactivo' : 'Activo',
            photoUrl:
              typeof insertedStaff.avatar_url === 'string'
                ? insertedStaff.avatar_url
                : undefined
          }

          setProfessionals((prev) => [...prev, persistedProfessional])
        } catch (error) {
          console.warn('Error creando profesional en DB', error)
        }
      })()
    },
    [activeClinicId, staffSchemaSupport]
  )

  const updateProfessional = useCallback(
    (id: string, updates: Partial<Professional>) => {
      const current = professionals.find((professional) => professional.id === id)
      if (!current) return
      const merged = { ...current, ...updates }

      setProfessionals((prev) =>
        prev.map((professional) => (professional.id === id ? merged : professional))
      )

      void (async () => {
        try {
          const response = await fetch(`/api/configuration/staff/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              updates: {
                name: merged.name,
                role: merged.role,
                phone: merged.phone,
                email: merged.email,
                colorTone: merged.colorTone,
                commission: merged.commission,
                status: merged.status,
                photoUrl: merged.photoUrl
              },
              previousRole: current.role
            })
          })
          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | {
                  error?: string
                  code?: string | null
                  details?: Record<string, unknown>
                }
              | null
            throw {
              code: payload?.code || null,
              details: payload?.details || null,
              message:
                payload?.error ||
                `update-professional failed with status ${response.status}`
            }
          }
        } catch (error) {
          console.warn('Error actualizando profesional en DB', error)
          setProfessionals((state) =>
            state.map((professional) =>
              professional.id === id ? current : professional
            )
          )
        }
      })()
    },
    [professionals]
  )

  const deleteProfessional = useCallback((id: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id))
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        if (activeClinicId) {
          await supabase
            .from('staff_clinics')
            .delete()
            .eq('clinic_id', activeClinicId)
            .eq('staff_id', id)
        }
        const { error } = await supabase.from('staff').delete().eq('id', id)
        if (error) {
          console.warn('No se pudo eliminar profesional en DB', error)
        }
      } catch (error) {
        console.warn('Error eliminando profesional en DB', error)
      }
    })()
  }, [activeClinicId])

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
  const professionalNames = useMemo(
    () => activeProfessionals.map((p) => p.name).filter(Boolean),
    [activeProfessionals]
  )
  const professionalNameOptions = useMemo(
    () => professionalNames.map((name) => ({ value: name, label: name })),
    [professionalNames]
  )
  const discountOptions = useMemo(
    () => discounts.filter((d) => d.isActive).map((d) => d.name),
    [discounts]
  )

  // ====== BOXES ======
  const activeBoxes = useMemo(() => boxes.filter((b) => b.isActive), [boxes])

  const addBox = useCallback((box: Omit<Box, 'id'>) => {
    if (!activeClinicId) return

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: insertedBox, error } = await supabase
          .from('boxes')
          .insert({
            clinic_id: activeClinicId,
            name_or_number: box.label,
            color_hex: box.tone === 'neutral' ? null : '#7725eb'
          })
          .select('id, name_or_number')
          .single()

        if (error || !insertedBox) {
          console.warn('No se pudo crear gabinete en DB', error)
          return
        }

        setBoxes((prev) => [
          ...prev,
          {
            id: String(insertedBox.id),
            label: String(insertedBox.name_or_number || box.label),
            tone: box.tone,
            isActive: box.isActive
          }
        ])
      } catch (error) {
        console.warn('Error creando gabinete en DB', error)
      }
    })()
  }, [activeClinicId])

  const updateBox = useCallback((id: string, updates: Partial<Box>) => {
    setBoxes((prev) => {
      const current = prev.find((box) => box.id === id)
      if (!current) return prev
      const merged = { ...current, ...updates }

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const payload: Record<string, unknown> = {}
          if (updates.label !== undefined) payload.name_or_number = merged.label
          if (Object.keys(payload).length === 0) return
          const { error } = await supabase
            .from('boxes')
            .update(payload)
            .eq('id', id)
          if (error) {
            console.warn('No se pudo actualizar gabinete en DB', error)
          }
        } catch (error) {
          console.warn('Error actualizando gabinete en DB', error)
        }
      })()

      return prev.map((box) => (box.id === id ? merged : box))
    })
  }, [])

  const deleteBox = useCallback((id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id))
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.from('boxes').delete().eq('id', id)
        if (error) {
          console.warn('No se pudo eliminar gabinete en DB', error)
        }
      } catch (error) {
        console.warn('Error eliminando gabinete en DB', error)
      }
    })()
  }, [])

  // Box options for agenda dropdowns
  const boxOptions = useMemo(
    () => activeBoxes.map((b) => ({ id: b.id, label: b.label })),
    [activeBoxes]
  )

  // ====== WORKING HOURS ======
  const updateWorkingHours = useCallback(
    (updates: Partial<WorkingHoursConfig>) => {
      const mergedConfig: WorkingHoursConfig = { ...workingHours, ...updates }
      setWorkingHours(mergedConfig)

      if (!activeClinicId) return

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const rows = mergedConfig.workingDays.flatMap((day) => {
            const dow = DAY_NAME_TO_INDEX[day]
            const blocks: Array<{
              clinic_id: string
              dow: number
              start_time: string
              end_time: string
              is_open: boolean
            }> = []

            if (mergedConfig.morningShift.start < mergedConfig.morningShift.end) {
              blocks.push({
                clinic_id: activeClinicId,
                dow,
                start_time: mergedConfig.morningShift.start,
                end_time: mergedConfig.morningShift.end,
                is_open: true
              })
            }
            if (mergedConfig.afternoonShift.start < mergedConfig.afternoonShift.end) {
              blocks.push({
                clinic_id: activeClinicId,
                dow,
                start_time: mergedConfig.afternoonShift.start,
                end_time: mergedConfig.afternoonShift.end,
                is_open: true
              })
            }

            return blocks
          })

          const { error: deleteError } = await supabase
            .from('clinic_working_hours')
            .delete()
            .eq('clinic_id', activeClinicId)

          if (deleteError) {
            console.warn('No se pudieron limpiar horarios de clínica', deleteError)
            return
          }

          if (rows.length > 0) {
            const { error: insertError } = await supabase
              .from('clinic_working_hours')
              .insert(rows)
            if (insertError) {
              console.warn('No se pudieron guardar horarios de clínica', insertError)
            }
          }
        } catch (error) {
          console.warn('Error persistiendo clinic_working_hours', error)
        }
      })()
    },
    [activeClinicId, workingHours]
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
      const optimisticTemplate: DocumentTemplate = {
        ...template,
        id: `doc-${Date.now()}`,
        lastModified: new Date().toISOString()
      }
      setDocumentTemplates((previous) => [...previous, optimisticTemplate])

      if (!activeClinicId) return

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          let insertResponse = await supabase
            .from('document_templates')
            .insert({
              clinic_id: activeClinicId,
              title: template.title,
              type: template.type,
              content: template.content,
              logo_url: template.logoUrl || null,
              logo_position: template.logoPosition || null,
              is_default: template.isDefault,
              is_active: true
            })
            .select('*')
            .single()

          if (insertResponse.error?.code === '42703') {
            insertResponse = await supabase
              .from('document_templates')
              .insert({
                clinic_id: activeClinicId,
                title: template.title,
                type: template.type,
                content_html: template.content,
                logo_url: template.logoUrl || null,
                logo_position: template.logoPosition || null,
                is_default: template.isDefault,
                is_active: true
              })
              .select('*')
              .single()
          }

          const { data: inserted, error } = insertResponse
          if (error || !inserted) {
            console.warn('No se pudo crear plantilla en DB', error)
            return
          }

          const dbType = normalizeDocumentTemplateType(
            (inserted as { type?: string }).type || ''
          )
          if (!dbType) return

          const persistedTemplate: DocumentTemplate = {
            id: String((inserted as { id?: string }).id || optimisticTemplate.id),
            title: String((inserted as { title?: string }).title || template.title),
            type: dbType,
            content: String(
              (inserted as { content?: string; content_html?: string }).content ||
                (inserted as { content_html?: string }).content_html ||
                template.content
            ),
            logoUrl:
              typeof (inserted as { logo_url?: string | null }).logo_url === 'string'
                ? String((inserted as { logo_url?: string }).logo_url)
                : undefined,
            logoPosition:
              ((inserted as { logo_position?: { x?: number; y?: number } | null })
                .logo_position &&
                typeof (inserted as { logo_position?: unknown }).logo_position ===
                  'object')
                ? {
                    x: Number(
                      (inserted as { logo_position?: { x?: number } }).logo_position
                        ?.x ?? 20
                    ),
                    y: Number(
                      (inserted as { logo_position?: { y?: number } }).logo_position
                        ?.y ?? 20
                    )
                  }
                : undefined,
            isDefault: (inserted as { is_default?: boolean }).is_default === true,
            lastModified:
              typeof (inserted as { updated_at?: string | null }).updated_at ===
              'string'
                ? String((inserted as { updated_at?: string }).updated_at)
                : optimisticTemplate.lastModified
          }

          setDocumentTemplates((previous) =>
            previous.map((item) =>
              item.id === optimisticTemplate.id ? persistedTemplate : item
            )
          )
        } catch (error) {
          console.warn('Error creando plantilla en DB', error)
        }
      })()
    },
    [activeClinicId]
  )

  const updateDocumentTemplate = useCallback(
    (id: string, updates: Partial<DocumentTemplate>) => {
      const lastModified = new Date().toISOString()
      setDocumentTemplates((previous) =>
        previous.map((template) =>
          template.id === id
            ? { ...template, ...updates, lastModified }
            : template
        )
      )

      if (!activeClinicId) return

      const payload: Record<string, unknown> = {
        updated_at: lastModified
      }
      if (updates.title !== undefined) payload.title = updates.title
      if (updates.type !== undefined) {
        payload.type = normalizeDocumentTemplateType(updates.type) || updates.type
      }
      if (updates.content !== undefined) payload.content = updates.content
      if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl || null
      if (updates.logoPosition !== undefined) {
        payload.logo_position = updates.logoPosition || null
      }
      if (updates.isDefault !== undefined) payload.is_default = updates.isDefault

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          let updateResponse = await supabase
            .from('document_templates')
            .update(payload)
            .eq('id', id)
            .eq('clinic_id', activeClinicId)
          if (updateResponse.error?.code === '42703') {
            const fallbackPayload = { ...payload }
            if (Object.prototype.hasOwnProperty.call(fallbackPayload, 'content')) {
              fallbackPayload.content_html = fallbackPayload.content
              delete fallbackPayload.content
            }
            updateResponse = await supabase
              .from('document_templates')
              .update(fallbackPayload)
              .eq('id', id)
              .eq('clinic_id', activeClinicId)
          }
          const { error } = updateResponse
          if (error) {
            console.warn('No se pudo actualizar plantilla en DB', error)
          }
        } catch (error) {
          console.warn('Error actualizando plantilla en DB', error)
        }
      })()
    },
    [activeClinicId]
  )

  const deleteDocumentTemplate = useCallback((id: string) => {
    setDocumentTemplates((previous) => previous.filter((template) => template.id !== id))

    if (!activeClinicId) return

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase
          .from('document_templates')
          .delete()
          .eq('id', id)
          .eq('clinic_id', activeClinicId)
        if (error) {
          console.warn('No se pudo eliminar plantilla en DB', error)
        }
      } catch (error) {
        console.warn('Error eliminando plantilla en DB', error)
      }
    })()
  }, [activeClinicId])

  const getDocumentTemplateById = useCallback(
    (id: string) => documentTemplates.find((template) => template.id === id),
    [documentTemplates]
  )

  const getDocumentTemplatesByType = useCallback(
    (type: DocumentTemplateType) =>
      documentTemplates.filter((template) => template.type === type),
    [documentTemplates]
  )

  const resetDocumentTemplate = useCallback((id: string) => {
    const resetTimestamp = new Date().toISOString()
    let resetContent: string | null = null
    setDocumentTemplates((previous) =>
      previous.map((template) => {
        if (template.id === id && template.isDefault) {
          resetContent = DEFAULT_DOCUMENT_TEMPLATES[template.type]
          return {
            ...template,
            content: resetContent,
            lastModified: resetTimestamp
          }
        }
        return template
      })
    )

    if (!activeClinicId || resetContent == null) return

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        let updateResponse = await supabase
          .from('document_templates')
          .update({
            content: resetContent,
            updated_at: resetTimestamp
          })
          .eq('id', id)
          .eq('clinic_id', activeClinicId)
        if (updateResponse.error?.code === '42703') {
          updateResponse = await supabase
            .from('document_templates')
            .update({
              content_html: resetContent,
              updated_at: resetTimestamp
            })
            .eq('id', id)
            .eq('clinic_id', activeClinicId)
        }
        const { error } = updateResponse
        if (error) {
          console.warn('No se pudo restablecer plantilla en DB', error)
        }
      } catch (error) {
        console.warn('Error restableciendo plantilla en DB', error)
      }
    })()
  }, [activeClinicId])

  // ====== PROFESSIONAL SCHEDULES ======
  const getProfessionalSchedule = useCallback(
    (professionalId: string) =>
      professionalSchedules.find((schedule) => schedule.professionalId === professionalId),
    [professionalSchedules]
  )

  const updateProfessionalSchedule = useCallback(
    (professionalId: string, schedule: WeeklySchedule) => {
      setProfessionalSchedules((previous) => {
        const exists = previous.some((item) => item.professionalId === professionalId)
        if (!exists) {
          return [
            ...previous,
            {
              professionalId,
              weeklySchedule: schedule,
              exceptions: [],
              appliedTemplateId: undefined
            }
          ]
        }
        return previous.map((item) =>
          item.professionalId === professionalId
            ? { ...item, weeklySchedule: schedule, appliedTemplateId: undefined }
            : item
        )
      })
    },
    []
  )

  const applyTemplateToProfessional = useCallback(
    (professionalId: string, templateId: string) => {
      const template = scheduleTemplates.find((item) => item.id === templateId)
      if (!template) return
      setProfessionalSchedules((previous) => {
        const exists = previous.some((item) => item.professionalId === professionalId)
        if (!exists) {
          return [
            ...previous,
            {
              professionalId,
              weeklySchedule: template.weeklySchedule,
              exceptions: [],
              appliedTemplateId: templateId
            }
          ]
        }
        return previous.map((item) =>
          item.professionalId === professionalId
            ? {
                ...item,
                weeklySchedule: template.weeklySchedule,
                appliedTemplateId: templateId
              }
            : item
        )
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
      setProfessionalSchedules((previous) =>
        previous.map((item) =>
          item.professionalId === exception.professionalId
            ? { ...item, exceptions: [...item.exceptions, newException] }
            : item
        )
      )
    },
    []
  )

  const removeScheduleException = useCallback((exceptionId: string) => {
    setProfessionalSchedules((previous) =>
      previous.map((item) => ({
        ...item,
        exceptions: item.exceptions.filter((exception) => exception.id !== exceptionId)
      }))
    )
  }, [])

  const copySchedule = useCallback(
    (fromProfessionalId: string, toProfessionalId: string) => {
      const source = professionalSchedules.find(
        (item) => item.professionalId === fromProfessionalId
      )
      if (!source) return
      setProfessionalSchedules((previous) => {
        const exists = previous.some((item) => item.professionalId === toProfessionalId)
        if (!exists) {
          return [
            ...previous,
            {
              professionalId: toProfessionalId,
              weeklySchedule: source.weeklySchedule,
              exceptions: [],
              appliedTemplateId: undefined
            }
          ]
        }
        return previous.map((item) =>
          item.professionalId === toProfessionalId
            ? {
                ...item,
                weeklySchedule: source.weeklySchedule,
                appliedTemplateId: undefined
              }
            : item
        )
      })
    },
    [professionalSchedules]
  )

  const getDayOfWeek = useCallback((date: Date): WeekDay => {
    const weekdays: WeekDay[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday'
    ]
    return weekdays[date.getDay()]
  }, [])

  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }, [])

  const getProfessionalScheduleForDate = useCallback(
    (professionalId: string, date: Date): DaySchedule | null => {
      const schedule = professionalSchedules.find(
        (item) => item.professionalId === professionalId
      )
      if (!schedule) return null

      const dateStr = date.toISOString().split('T')[0]
      const exception = schedule.exceptions.find((item) => item.date === dateStr)
      if (exception) {
        if (exception.type !== 'special' || !exception.customSchedule) {
          return createNonWorkingDay()
        }
        return exception.customSchedule
      }

      const dayOfWeek = getDayOfWeek(date)
      return schedule.weeklySchedule[dayOfWeek]
    },
    [getDayOfWeek, professionalSchedules]
  )

  const isProfessionalAvailable = useCallback(
    (professionalId: string, date: Date, time: string): boolean => {
      const daySchedule = getProfessionalScheduleForDate(professionalId, date)
      if (!daySchedule || !daySchedule.isWorking) return false

      const requestedMinutes = timeToMinutes(time)

      const inShift = daySchedule.shifts.some((shift) => {
        const start = timeToMinutes(shift.start)
        const end = timeToMinutes(shift.end)
        return requestedMinutes >= start && requestedMinutes < end
      })
      if (!inShift) return false

      const inBreak = daySchedule.breaks.some((pause) => {
        const start = timeToMinutes(pause.start)
        const end = timeToMinutes(pause.end)
        return requestedMinutes >= start && requestedMinutes < end
      })
      return !inBreak
    },
    [getProfessionalScheduleForDate, timeToMinutes]
  )

  const getAvailableProfessionalsForDate = useCallback(
    (date: Date): Professional[] =>
      activeProfessionals.filter((professional) => {
        const daySchedule = getProfessionalScheduleForDate(professional.id, date)
        return daySchedule?.isWorking === true
      }),
    [activeProfessionals, getProfessionalScheduleForDate]
  )

  const setDiscounts = useCallback(
    (discountsOrUpdater: SetStateAction<ConfigDiscount[]>) => {
      setDiscountsState(discountsOrUpdater)
    },
    []
  )

  const addBudgetType = useCallback((budgetType: Omit<BudgetTypeData, 'id'>) => {
    const created: BudgetTypeData = {
      ...budgetType,
      id: `bt-${Date.now()}`
    }
    setBudgetTypesState((prev) => [created, ...prev])
    return created
  }, [])

  const updateBudgetType = useCallback((id: string, updates: Partial<BudgetTypeData>) => {
    setBudgetTypesState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  const deleteBudgetType = useCallback((id: string) => {
    setBudgetTypesState((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const setExpenses = useCallback(
    (expensesOrUpdater: SetStateAction<ConfigExpense[]>) => {
      setExpensesState(expensesOrUpdater)
    },
    []
  )

  const setRoles = useCallback((rolesOrUpdater: SetStateAction<ConfigRole[]>) => {
    setRolesState(rolesOrUpdater)
  }, [])

  const toggleRolePermission = useCallback((roleId: string, permissionId: string) => {
    setRolesState((prev) =>
      prev.map((role) =>
        role.id !== roleId
          ? role
          : {
              ...role,
              permisos: role.permisos.includes(permissionId)
                ? role.permisos.filter((id) => id !== permissionId)
                : [...role.permisos, permissionId]
            }
      )
    )
  }, [])

  const setPermissions = useCallback(
    (permissionsOrUpdater: SetStateAction<ConfigPermission[]>) => {
      setPermissionsState(permissionsOrUpdater)
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
      professionalNames,
      professionalNameOptions,
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
      discounts,
      setDiscounts,
      discountOptions,
      budgetTypes: budgetTypesState,
      setBudgetTypes: setBudgetTypesState,
      addBudgetType,
      updateBudgetType,
      deleteBudgetType,
      expenses,
      setExpenses,
      roles,
      setRoles,
      toggleRolePermission,
      permissions,
      setPermissions
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
      professionalNames,
      professionalNameOptions,
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
      discounts,
      setDiscounts,
      discountOptions,
      budgetTypesState,
      addBudgetType,
      updateBudgetType,
      deleteBudgetType,
      expenses,
      setExpenses,
      roles,
      setRoles,
      toggleRolePermission,
      permissions,
      setPermissions
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
