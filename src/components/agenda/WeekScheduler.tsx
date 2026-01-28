'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'
import { useAppointments } from '@/context/AppointmentsContext'
import { useRouter } from 'next/navigation'
import type {
  CSSProperties,
  ReactElement,
  MouseEvent as ReactMouseEvent
} from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import type { AppointmentFormData, BlockFormData } from './modals/CreateAppointmentModal'

import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import RegisterPaymentModal from '@/components/pacientes/modals/patient-record/RegisterPaymentModal'
import AppointmentContextMenu, {
  type ContextMenuAction
} from './AppointmentContextMenu'
import AgendaBlockCard from './AgendaBlockCard'
import AppointmentSummaryCard from './AppointmentSummaryCard'
import DayCalendar from './DayCalendar'
import MonthCalendar from './MonthCalendar'
import AppointmentDetailOverlay from './modals/AppointmentDetailOverlay'
import CreateAppointmentModal from './modals/CreateAppointmentModal'
import type {
  AgendaEvent,
  DayColumn,
  EventDetail,
  EventSelection,
  VisitStatus,
  Weekday,
  AgendaBlock
} from './types'
import type { BlockType } from '@/context/AppointmentsContext'
import { BLOCK_TYPE_CONFIG } from '@/context/AppointmentsContext'
import { VISIT_STATUS_CONFIG, VISIT_STATUS_ORDER } from './types'
import VisitStatusMenu from './VisitStatusMenu'
import { VisitStatusCountersCompact, VisitStatusDropdown } from './VisitStatusCounters'
import TimeIndicator, { slotIndexToTime } from './TimeIndicator'
import SlotDragSelection, { type SlotDragState, getSelectionBounds } from './SlotDragSelection'

type SpecialistAvailability = {
  id: string
  name: string
  timeRange: string
  color: string
}

type HeaderCell = {
  id: Weekday
  label: string
  leftVar: string
  widthVar: string
  tone: 'neutral' | 'primary' | 'brand'
  specialists?: SpecialistAvailability[]
}

const WEEK_RANGE = '13 - 19, oct 2025'

const START_HOUR = 9
const END_HOUR = 20 // exclusive upper bound for slots (lines stop at 20:00)
const MINUTES_STEP = 15
const SLOTS_PER_HOUR = 60 / MINUTES_STEP // 4
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR // 44 slots (9:00 → 20:00)
const HOUR_LABELS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
  const hour = START_HOUR + i
  return `${hour.toString().padStart(2, '0')}:00`
})

const WEEKDAY_ORDER: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday'
]

const normalizeTimeLabel = (label: string): string => {
  const [hoursPart = '00', minutesPart = '00'] = label.split(':')
  const hours = hoursPart.padStart(2, '0')
  const minutes = minutesPart.padStart(2, '0')
  return `${hours}:${minutes}`
}

const HEADER_CELLS: HeaderCell[] = [
  {
    id: 'monday',
    label: '13 Lunes',
    leftVar: '--scheduler-header-left-mon',
    widthVar: '--scheduler-header-width-first',
    tone: 'neutral'
  },
  {
    id: 'tuesday',
    label: '14 Martes',
    leftVar: '--scheduler-header-left-tue',
    widthVar: '--scheduler-header-width',
    tone: 'brand'
  },
  {
    id: 'wednesday',
    label: '15 Miércoles',
    leftVar: '--scheduler-header-left-wed',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'thursday',
    label: '16 Jueves',
    leftVar: '--scheduler-header-left-thu',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'friday',
    label: '17 Viernes',
    leftVar: '--scheduler-header-left-fri',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  }
]

type ViewOption = 'dia' | 'semana' | 'mes'

const VIEW_OPTIONS: { id: ViewOption; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' }
]

// PROFESSIONAL_OPTIONS is defined after CLINIC_PROFESSIONALS below

const BOX_OPTIONS = [
  { id: 'box-1', label: 'Box 1' },
  { id: 'box-2', label: 'Box 2' },
  { id: 'box-3', label: 'Box 3' }
]

const BOX_COLUMN_LAYOUT: Record<string, { left: string; width: string }> = {
  'box 1': { left: '2%', width: '46%' },
  'box 2': { left: '52%', width: '46%' }
}

// Helper to convert box id to box name (e.g., 'box-1' -> 'box 1')
const boxIdToName = (boxId: string): string => boxId.replace('-', ' ')

// Function to calculate dynamic box layout based on selected boxes
const getBoxLayout = (
  selectedBoxes: string[]
): Record<string, { left: string; width: string }> => {
  // Filter to only include boxes that exist in BOX_OPTIONS
  const validBoxes = selectedBoxes.filter((id) =>
    BOX_OPTIONS.some((opt) => opt.id === id)
  )

  if (validBoxes.length === 0) {
    return BOX_COLUMN_LAYOUT // fallback to default
  }

  const gap = 4 // 4% gap between boxes
  const totalGaps = validBoxes.length - 1
  const availableWidth = 96 - totalGaps * gap // 96% total (2% padding each side)
  const boxWidth = availableWidth / validBoxes.length

  const layout: Record<string, { left: string; width: string }> = {}

  validBoxes.forEach((boxId, index) => {
    const boxName = boxIdToName(boxId)
    const left = 2 + index * (boxWidth + gap)
    layout[boxName] = {
      left: `${left}%`,
      width: `${boxWidth}%`
    }
  })

  return layout
}

// Specialist availability for week view (same style as MonthCalendar)
const SAMPLE_SPECIALISTS: SpecialistAvailability[] = [
  {
    id: 'sp1',
    name: 'Odontólogo',
    timeRange: '10:00 - 16:00',
    color: 'var(--color-info-200)'
  },
  {
    id: 'sp2',
    name: 'Higienista dental',
    timeRange: '09:00 - 14:00',
    color: 'var(--color-event-teal)'
  },
  {
    id: 'sp3',
    name: 'Pediatra',
    timeRange: '11:00 - 18:00',
    color: 'var(--color-event-purple)'
  }
]

// Specialists by weekday
const SPECIALISTS_BY_WEEKDAY: Record<Weekday, SpecialistAvailability[]> = {
  monday: [SAMPLE_SPECIALISTS[0]],
  tuesday: [SAMPLE_SPECIALISTS[1], SAMPLE_SPECIALISTS[0]],
  wednesday: [SAMPLE_SPECIALISTS[2]],
  thursday: [],
  friday: [SAMPLE_SPECIALISTS[0], SAMPLE_SPECIALISTS[2]],
  saturday: [],
  sunday: []
}

const DATE_BY_DAY: Record<Weekday, string> = {
  monday: 'Lunes, 5 de Enero 2026',
  tuesday: 'Martes, 6 de Enero 2026',
  wednesday: 'Miércoles, 7 de Enero 2026',
  thursday: 'Jueves, 8 de Enero 2026',
  friday: 'Viernes, 9 de Enero 2026',
  saturday: 'Sábado, 10 de Enero 2026',
  sunday: 'Domingo, 11 de Enero 2026'
}

const OVERLAY_GUTTER = '0.75rem' // 12px - gap between event card and overlay

// ==========================================
// CURRENT TIME INDICATOR COMPONENT
// ==========================================

/**
 * Componente que muestra una línea roja horizontal indicando la hora actual.
 * Solo se muestra si la hora actual está dentro del rango visible (9:00 - 20:00).
 * Se actualiza cada minuto para mantener la posición sincronizada.
 */
function CurrentTimeIndicator({
  startHour,
  endHour,
  timeColumnWidth = 'var(--scheduler-time-width)'
}: {
  startHour: number
  endHour: number
  timeColumnWidth?: string
}) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Actualizar cada minuto
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date())

    // Calcular milisegundos hasta el próximo minuto
    const now = new Date()
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds()

    // Primer timeout para sincronizar con el inicio del minuto
    const initialTimeout = setTimeout(() => {
      updateTime()
      // Después, actualizar cada minuto exacto
      const interval = setInterval(updateTime, 60000)
      return () => clearInterval(interval)
    }, msUntilNextMinute)

    return () => clearTimeout(initialTimeout)
  }, [])

  const hours = currentTime.getHours()
  const minutes = currentTime.getMinutes()

  // Solo mostrar si estamos dentro del rango de horas (9:00 - 20:00)
  const totalMinutes = hours * 60 + minutes
  const rangeStart = startHour * 60
  const rangeEnd = endHour * 60

  if (totalMinutes < rangeStart || totalMinutes >= rangeEnd) {
    return null
  }

  // Calcular posición: minutos desde las 9:00 / minutos totales del rango
  const minutesFromStart = totalMinutes - rangeStart
  const totalRangeMinutes = rangeEnd - rangeStart // 660 minutos (11 horas)
  const positionPercent = (minutesFromStart / totalRangeMinutes) * 100

  // Formatear hora actual
  const timeLabel = `${hours}:${minutes.toString().padStart(2, '0')}`

  return (
    <div
      className='pointer-events-none absolute left-0 z-[5] flex w-full items-center'
      style={{
        top: `${positionPercent}%`
      }}
    >
      {/* Badge con la hora */}
      <div
        className='flex items-center justify-center rounded-[0.25rem] bg-[#EF4444] px-[0.375rem] py-[0.125rem]'
        style={{
          width: timeColumnWidth,
          minWidth: timeColumnWidth,
          maxWidth: timeColumnWidth
        }}
      >
        <span className='text-[0.75rem] font-medium leading-[1rem] text-white'>
          {timeLabel}
        </span>
      </div>

      {/* Línea roja */}
      <div className='h-[2px] flex-1 bg-[#EF4444]' />
    </div>
  )
}

// ============================================
// DATOS REALISTAS DE CLÍNICA DENTAL
// ============================================

// Profesionales de la clínica
const PROFESSIONALS = {
  antonioRuiz: 'Dr. Antonio Ruiz García',
  elenaNava: 'Dra. Elena Navarro Pérez',
  miguelTorres: 'Dr. Miguel Á. Torres',
  lauraSanchez: 'Laura Sánchez (Higienista)',
  franciscoMoreno: 'Dr. Francisco Moreno',
  carmenDiaz: 'Dra. Carmen Díaz López'
}

// Pacientes con datos realistas
const PATIENTS = {
  mariaGarcia: {
    name: 'María García López',
    phone: '+34 612 345 678',
    email: 'maria.garcia@gmail.com'
  },
  carlosRodriguez: {
    name: 'Carlos Rodríguez Fernández',
    phone: '+34 623 456 789',
    email: 'carlos.rodriguez@hotmail.com'
  },
  anaMartinez: {
    name: 'Ana Martínez Sánchez',
    phone: '+34 634 567 890',
    email: 'ana.martinez@yahoo.es'
  },
  pabloLopez: {
    name: 'Pablo López García',
    phone: '+34 645 678 901',
    email: 'pablo.lopez@gmail.com'
  },
  lauraFernandez: {
    name: 'Laura Fernández Ruiz',
    phone: '+34 656 789 012',
    email: 'laura.fernandez@outlook.com'
  },
  javierMoreno: {
    name: 'Javier Moreno Torres',
    phone: '+34 667 890 123',
    email: 'javier.moreno@gmail.com'
  },
  sofiaNavarro: {
    name: 'Sofía Navarro Díaz',
    phone: '+34 678 901 234',
    email: 'sofia.navarro@icloud.com'
  },
  davidSanchez: {
    name: 'David Sánchez Martín',
    phone: '+34 689 012 345',
    email: 'david.sanchez@gmail.com'
  },
  carmenRuiz: {
    name: 'Carmen Ruiz Jiménez',
    phone: '+34 690 123 456',
    email: 'carmen.ruiz@hotmail.com'
  },
  miguelGomez: {
    name: 'Miguel Gómez Hernández',
    phone: '+34 601 234 567',
    email: 'miguel.gomez@gmail.com'
  },
  elenaVega: {
    name: 'Elena Vega Castillo',
    phone: '+34 612 345 678',
    email: 'elena.vega@yahoo.es'
  },
  antonioPerez: {
    name: 'Antonio Pérez Molina',
    phone: '+34 623 456 789',
    email: 'antonio.perez@gmail.com'
  },
  martaAlonso: {
    name: 'Marta Alonso Blanco',
    phone: '+34 634 567 890',
    email: 'marta.alonso@outlook.com'
  },
  fernandoDiaz: {
    name: 'Fernando Díaz Ortega',
    phone: '+34 645 678 901',
    email: 'fernando.diaz@gmail.com'
  },
  beatrizMuñoz: {
    name: 'Beatriz Muñoz Serrano',
    phone: '+34 656 789 012',
    email: 'beatriz.munoz@icloud.com'
  },
  ramonCastro: {
    name: 'Ramón Castro Vidal',
    phone: '+34 667 890 123',
    email: 'ramon.castro@hotmail.com'
  },
  patriciaRomero: {
    name: 'Patricia Romero Nieto',
    phone: '+34 678 901 234',
    email: 'patricia.romero@gmail.com'
  },
  albertoGil: {
    name: 'Alberto Gil Ramos',
    phone: '+34 689 012 345',
    email: 'alberto.gil@yahoo.es'
  }
}

// Profesionales de la clínica dental (para bandas dinámicas)
export const CLINIC_PROFESSIONALS = {
  drRuiz: {
    id: 'drRuiz',
    name: 'Dr. Antonio Ruiz García',
    specialty: 'Odontólogo General',
    bandLabel: 'Dr. Ruiz (Odontología)',
    bandColor: '#f0fafa',
    scheduleStart: '09:00',
    scheduleEnd: '14:00'
  },
  draLopez: {
    id: 'draLopez',
    name: 'Dra. María López Fernández',
    specialty: 'Endodoncista',
    bandLabel: 'Dra. López (Endodoncia)',
    bandColor: '#fbe9fb',
    scheduleStart: '09:00',
    scheduleEnd: '14:00'
  },
  drMartinez: {
    id: 'drMartinez',
    name: 'Dr. Carlos Martínez Soto',
    specialty: 'Cirujano Oral',
    bandLabel: 'Dr. Martínez (Cirugía)',
    bandColor: '#fff4e6',
    scheduleStart: '10:00',
    scheduleEnd: '18:00'
  },
  draGarcia: {
    id: 'draGarcia',
    name: 'Dra. Laura García Vidal',
    specialty: 'Ortodoncista',
    bandLabel: 'Dra. García (Ortodoncia)',
    bandColor: '#e6f4ff',
    scheduleStart: '15:00',
    scheduleEnd: '20:00'
  },
  drSanchez: {
    id: 'drSanchez',
    name: 'Dr. Pedro Sánchez Ruiz',
    specialty: 'Periodoncista',
    bandLabel: 'Dr. Sánchez (Periodoncia)',
    bandColor: '#e6ffe6',
    scheduleStart: '09:00',
    scheduleEnd: '13:00'
  },
  draPeña: {
    id: 'draPeña',
    name: 'Dra. Ana Peña Moreno',
    specialty: 'Odontopediatra',
    bandLabel: 'Dra. Peña (Pediatría)',
    bandColor: '#ffe6f0',
    scheduleStart: '16:00',
    scheduleEnd: '20:00'
  },
  anestesistaJimenez: {
    id: 'anestesistaJimenez',
    name: 'Dr. Roberto Jiménez Blanco',
    specialty: 'Anestesista',
    bandLabel: 'Dr. Jiménez (Anestesia)',
    bandColor: '#f5e6ff',
    scheduleStart: '10:00',
    scheduleEnd: '16:00'
  }
} as const

export type ProfessionalId = keyof typeof CLINIC_PROFESSIONALS

// Professional options derived from CLINIC_PROFESSIONALS
const PROFESSIONAL_OPTIONS = Object.entries(CLINIC_PROFESSIONALS).map(
  ([key, prof]) => ({
    id: key,
    label: prof.name
  })
)

// Función para obtener las bandas de profesionales de un día específico
export function getBandsForDate(
  date: Date,
  events: typeof MONTH_EVENTS_EXTENDED
): { id: string; label: string; background: string }[] {
  const dayEvents = events.filter(
    (e) => e.date.toDateString() === date.toDateString()
  )

  // Obtener profesionales únicos del día
  const professionalIds = new Set<ProfessionalId>()
  dayEvents.forEach((e) => {
    if (e.professionalId) {
      professionalIds.add(e.professionalId)
    }
  })

  // Convertir a bandas
  return Array.from(professionalIds).map((profId) => {
    const prof = CLINIC_PROFESSIONALS[profId]
    return {
      id: prof.id,
      label: `${prof.bandLabel} ${prof.scheduleStart} - ${prof.scheduleEnd}`,
      background: prof.bandColor
    }
  })
}

// Tratamientos dentales
const TREATMENTS = {
  limpieza: 'Limpieza dental',
  revision: 'Revisión general',
  empaste: 'Empaste / Obturación',
  endodoncia: 'Endodoncia',
  extraccion: 'Extracción dental',
  corona: 'Corona dental',
  implante: 'Implante dental',
  ortodoncia: 'Revisión ortodoncia',
  blanqueamiento: 'Blanqueamiento',
  ferula: 'Férula de descarga',
  cordales: 'Cirugía cordales',
  periodoncia: 'Tratamiento periodontal',
  protesis: 'Ajuste prótesis',
  carillas: 'Carillas estéticas',
  radiografia: 'Radiografía panorámica',
  urgencia: 'Urgencia dental',
  sensibilidad: 'Tratamiento sensibilidad',
  brackets: 'Colocación brackets',
  invisalign: 'Revisión Invisalign',
  sellador: 'Sellador de fisuras'
}

const DEFAULT_PATIENT_FULL = 'Juan Pérez González'
const DEFAULT_PATIENT_PHONE = '+34 666 777 888'
const DEFAULT_PATIENT_EMAIL = 'juan.perez@gmail.com'
const DEFAULT_REFERRED_BY = 'Recomendación familiar'
const DEFAULT_PROFESSIONAL = 'Dr. Antonio Ruiz García'
const DEFAULT_ECONOMIC_AMOUNT = '85 €'
const DEFAULT_ECONOMIC_STATUS = 'Pendiente de pago'
const DEFAULT_NOTES = 'Paciente con sensibilidad moderada'
const LOCATION_LABEL = 'Fecha y ubicación'
const PATIENT_LABEL = 'Paciente'
const PROFESSIONAL_LABEL = 'Profesional'
const ECONOMIC_LABEL = 'Económico'
const NOTES_LABEL = 'Notas'

function createDetail(
  day: Weekday,
  title: string,
  startTime: string,
  overrides?: Partial<EventDetail>
): EventDetail {
  return {
    title: `${title} ${startTime}`,
    date: DATE_BY_DAY[day],
    duration: '12:30 - 13:00 (30 minutos)',
    patientFull: DEFAULT_PATIENT_FULL,
    patientPhone: DEFAULT_PATIENT_PHONE,
    patientEmail: DEFAULT_PATIENT_EMAIL,
    referredBy: DEFAULT_REFERRED_BY,
    professional: DEFAULT_PROFESSIONAL,
    economicAmount: DEFAULT_ECONOMIC_AMOUNT,
    economicStatus: DEFAULT_ECONOMIC_STATUS,
    notes: DEFAULT_NOTES,
    locationLabel: LOCATION_LABEL,
    patientLabel: PATIENT_LABEL,
    professionalLabel: PROFESSIONAL_LABEL,
    economicLabel: ECONOMIC_LABEL,
    notesLabel: NOTES_LABEL,
    ...overrides
  }
}

const parsePercent = (value?: string | number): number => {
  if (typeof value === 'number') return value
  if (!value) return 0
  const num = parseFloat(value)
  return Number.isFinite(num) ? num : 0
}

function getOverlayTop(
  relativeTop: string,
  overlayHeight: string,
  eventHeight?: string
): string {
  const trimmed = relativeTop.trim()
  const base =
    trimmed.startsWith('calc(') && trimmed.endsWith(')')
      ? trimmed.slice(5, -1).trim()
      : trimmed
  if (eventHeight) {
    return `calc(var(--scheduler-body-offset-y) + ${base} + (${eventHeight}) / 2 - (${overlayHeight}) / 2)`
  }
  return `calc(var(--scheduler-body-offset-y) + ${base})`
}

function getOverlayLeft(
  column: DayColumn,
  event?: Pick<AgendaEvent, 'left' | 'width' | 'height' | 'box'>
): string {
  // Place the overlay in the adjacent box within the same day column.
  const halfColumn = `calc(var(${column.widthVar}) / 2)`
  const isBox1 = (event?.box ?? '').toLowerCase().includes('box 1')
  const isFirstDay = column.id === 'monday'
  const isLastDay = column.id === 'friday'

  if (isBox1) {
    // Event en Box 1 → overlay en Box 2 (derecha de la mitad del día),
    // salvo en el último día, donde lo sacamos hacia la izquierda para no invadir día siguiente.
    if (isLastDay) {
      return `calc(var(${column.leftVar}) + ${halfColumn} - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER})`
    }
    return `calc(var(${column.leftVar}) + ${halfColumn} + ${OVERLAY_GUTTER})`
  }

  // Event en Box 2 → overlay en Box 1 (izquierda de la mitad del día),
  // salvo en el primer día, donde lo sacamos hacia la derecha para no invadir día anterior.
  if (isFirstDay) {
    return `calc(var(${column.leftVar}) + ${halfColumn} + ${OVERLAY_GUTTER})`
  }

  return `calc(var(${column.leftVar}) + ${halfColumn} - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER})`
}

function getSmartOverlayPosition(
  relativeTop: string,
  column: DayColumn,
  overlayHeight: string = 'var(--scheduler-overlay-height)',
  event?: Pick<AgendaEvent, 'left' | 'width' | 'height' | 'box'>
) {
  // Calculate base positions
  const baseTop = getOverlayTop(
    relativeTop,
    overlayHeight,
    event?.height ?? '0rem'
  )
  const baseLeft = getOverlayLeft(column, event)

  // Return position with constraint to prevent overflow
  // Using CSS max() and min() functions to clamp the overlay within viewport
  return {
    top: `max(0rem, min(${baseTop}, calc(100vh - ${overlayHeight} - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 1rem)))`,
    left: baseLeft,
    maxHeight: `min(${overlayHeight}, calc(100vh - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 2rem))`
  }
}

// Helper para calcular top basado en hora (9:00 = 0rem, cada 15min = 2.5rem)
const timeToTop = (hour: number, minutes: number): string => {
  const slotsFromStart = (hour - 9) * 4 + Math.floor(minutes / 15)
  return `${slotsFromStart * 2.5}rem`
}

// Helper para calcular altura basada en duración en minutos
const durationToHeight = (minutes: number): string => {
  const slots = Math.ceil(minutes / 15)
  return `${slots * 2.5}rem`
}

const EVENT_DATA: Record<Weekday, AgendaEvent[]> = {
  monday: [
    // LUNES - Día ocupado con muchas limpiezas y revisiones
    {
      id: 'mon-1',
      top: timeToTop(9, 0),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.mariaGarcia.name,
      box: 'Box 1',
      timeRange: '09:00 - 09:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', TREATMENTS.limpieza, '09:00', {
        patientFull: PATIENTS.mariaGarcia.name,
        patientPhone: PATIENTS.mariaGarcia.phone,
        patientEmail: PATIENTS.mariaGarcia.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza rutinaria semestral. Sin problemas previos.',
        duration: '09:00 - 09:30 (30 minutos)'
      })
    },
    {
      id: 'mon-2',
      top: timeToTop(9, 30),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.carlosRodriguez.name,
      box: 'Box 2',
      timeRange: '09:30 - 10:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('monday', TREATMENTS.empaste, '09:30', {
        patientFull: PATIENTS.carlosRodriguez.name,
        patientPhone: PATIENTS.carlosRodriguez.phone,
        patientEmail: PATIENTS.carlosRodriguez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '95 €',
        economicStatus: 'Pendiente de pago',
        notes: 'Caries en molar inferior derecho (36). Empaste composite.',
        duration: '09:30 - 10:15 (45 minutos)'
      })
    },
    {
      id: 'mon-3',
      top: timeToTop(10, 0),
      height: durationToHeight(60),
      title: TREATMENTS.endodoncia,
      patient: PATIENTS.anaMartinez.name,
      box: 'Box 1',
      timeRange: '10:00 - 11:00',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('monday', TREATMENTS.endodoncia, '10:00', {
        patientFull: PATIENTS.anaMartinez.name,
        patientPhone: PATIENTS.anaMartinez.phone,
        patientEmail: PATIENTS.anaMartinez.email,
        professional: PROFESSIONALS.franciscoMoreno,
        economicAmount: '320 €',
        economicStatus: 'Financiado (3 pagos)',
        notes:
          'Endodoncia pieza 15. Segunda sesión. Paciente con ansiedad leve.',
        duration: '10:00 - 11:00 (60 minutos)',
        // Pagos parciales: 1 de 3 cuotas pagadas
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
      })
    },
    {
      id: 'mon-4',
      top: timeToTop(10, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.pabloLopez.name,
      box: 'Box 2',
      timeRange: '10:30 - 11:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', TREATMENTS.revision, '10:30', {
        patientFull: PATIENTS.pabloLopez.name,
        patientPhone: PATIENTS.pabloLopez.phone,
        patientEmail: PATIENTS.pabloLopez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión anual. Última visita hace 11 meses.',
        duration: '10:30 - 11:00 (30 minutos)'
      })
    },
    {
      id: 'mon-5',
      top: timeToTop(11, 0),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.lauraFernandez.name,
      box: 'Box 2',
      timeRange: '11:00 - 11:45',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('monday', TREATMENTS.ortodoncia, '11:00', {
        patientFull: PATIENTS.lauraFernandez.name,
        patientPhone: PATIENTS.lauraFernandez.phone,
        patientEmail: PATIENTS.lauraFernandez.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido en tratamiento)',
        economicStatus: 'Plan activo',
        notes: 'Revisión mensual Invisalign. Cambio de alineadores semana 18.',
        duration: '11:00 - 11:45 (45 minutos)'
      })
    },
    {
      id: 'mon-6',
      top: timeToTop(11, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.javierMoreno.name,
      box: 'Box 1',
      timeRange: '11:30 - 12:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', TREATMENTS.limpieza, '11:30', {
        patientFull: PATIENTS.javierMoreno.name,
        patientPhone: PATIENTS.javierMoreno.phone,
        patientEmail: PATIENTS.javierMoreno.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza profunda. Acumulación de sarro zona inferior.',
        duration: '11:30 - 12:00 (30 minutos)'
      })
    },
    {
      id: 'mon-7',
      top: timeToTop(12, 0),
      height: durationToHeight(30),
      title: TREATMENTS.radiografia,
      patient: PATIENTS.sofiaNavarro.name,
      box: 'Box 1',
      timeRange: '12:00 - 12:30',
      backgroundClass: 'bg-[#f0e9fb]',
      detail: createDetail('monday', TREATMENTS.radiografia, '12:00', {
        patientFull: PATIENTS.sofiaNavarro.name,
        patientPhone: PATIENTS.sofiaNavarro.phone,
        patientEmail: PATIENTS.sofiaNavarro.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '35 €',
        economicStatus: 'Pagado',
        notes: 'Radiografía panorámica previa a valoración de implantes.',
        duration: '12:00 - 12:30 (30 minutos)'
      })
    },
    {
      id: 'mon-8',
      top: timeToTop(12, 0),
      height: durationToHeight(45),
      title: TREATMENTS.periodoncia,
      patient: PATIENTS.davidSanchez.name,
      box: 'Box 2',
      timeRange: '12:00 - 12:45',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('monday', TREATMENTS.periodoncia, '12:00', {
        patientFull: PATIENTS.davidSanchez.name,
        patientPhone: PATIENTS.davidSanchez.phone,
        patientEmail: PATIENTS.davidSanchez.email,
        professional: PROFESSIONALS.carmenDiaz,
        economicAmount: '180 €',
        economicStatus: 'Pendiente de pago',
        notes:
          'Tratamiento periodontal cuadrante superior derecho. Gingivitis avanzada.',
        duration: '12:00 - 12:45 (45 minutos)',
        // Pago parcial SIN plan de cuotas (flexible)
        paymentInfo: {
          totalAmount: 180,
          paidAmount: 50,
          pendingAmount: 130,
          currency: '€'
        }
        // Sin installmentPlan - el paciente paga lo que puede
      })
    },
    {
      id: 'mon-9',
      top: timeToTop(13, 0),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.carmenRuiz.name,
      box: 'Box 1',
      timeRange: '13:00 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', TREATMENTS.revision, '13:00', {
        patientFull: PATIENTS.carmenRuiz.name,
        patientPhone: PATIENTS.carmenRuiz.phone,
        patientEmail: PATIENTS.carmenRuiz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión post-tratamiento endodoncia. Evolución favorable.',
        duration: '13:00 - 13:30 (30 minutos)'
      })
    },
    // Tarde
    {
      id: 'mon-10',
      top: timeToTop(16, 0),
      height: durationToHeight(90),
      title: TREATMENTS.implante,
      patient: PATIENTS.miguelGomez.name,
      box: 'Box 1',
      timeRange: '16:00 - 17:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('monday', TREATMENTS.implante, '16:00', {
        patientFull: PATIENTS.miguelGomez.name,
        patientPhone: PATIENTS.miguelGomez.phone,
        patientEmail: PATIENTS.miguelGomez.email,
        professional: PROFESSIONALS.miguelTorres,
        economicAmount: '1.200 €',
        economicStatus: 'Financiado (12 pagos)',
        notes:
          'Colocación implante pieza 46. Paciente sin patologías previas. Antibiótico preventivo.',
        duration: '16:00 - 17:30 (90 minutos)',
        // Pagos parciales: 5 de 12 cuotas pagadas
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
      })
    },
    {
      id: 'mon-11',
      top: timeToTop(16, 30),
      height: durationToHeight(60),
      title: TREATMENTS.blanqueamiento,
      patient: PATIENTS.elenaVega.name,
      box: 'Box 2',
      timeRange: '16:30 - 17:30',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('monday', TREATMENTS.blanqueamiento, '16:30', {
        patientFull: PATIENTS.elenaVega.name,
        patientPhone: PATIENTS.elenaVega.phone,
        patientEmail: PATIENTS.elenaVega.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '250 €',
        economicStatus: 'Pagado',
        notes: 'Blanqueamiento LED segunda sesión. Evitar café y vino 48h.',
        duration: '16:30 - 17:30 (60 minutos)'
      })
    },
    {
      id: 'mon-12',
      top: timeToTop(17, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.antonioPerez.name,
      box: 'Box 2',
      timeRange: '17:30 - 18:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', TREATMENTS.limpieza, '17:30', {
        patientFull: PATIENTS.antonioPerez.name,
        patientPhone: PATIENTS.antonioPerez.phone,
        patientEmail: PATIENTS.antonioPerez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pendiente de pago',
        notes: 'Primera visita. Derivado por médico de cabecera.',
        duration: '17:30 - 18:00 (30 minutos)'
      })
    },
    {
      id: 'mon-13',
      top: timeToTop(18, 0),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.martaAlonso.name,
      box: 'Box 1',
      timeRange: '18:00 - 18:45',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('monday', TREATMENTS.empaste, '18:00', {
        patientFull: PATIENTS.martaAlonso.name,
        patientPhone: PATIENTS.martaAlonso.phone,
        patientEmail: PATIENTS.martaAlonso.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '85 €',
        economicStatus: 'Pagado',
        notes:
          'Empaste molar 16. Caries interproximal detectada en radiografía.',
        duration: '18:00 - 18:45 (45 minutos)'
      })
    },
    {
      id: 'mon-14',
      top: timeToTop(18, 30),
      height: durationToHeight(45),
      title: TREATMENTS.ferula,
      patient: PATIENTS.fernandoDiaz.name,
      box: 'Box 2',
      timeRange: '18:30 - 19:15',
      backgroundClass: 'bg-[#f0e9fb]',
      detail: createDetail('monday', TREATMENTS.ferula, '18:30', {
        patientFull: PATIENTS.fernandoDiaz.name,
        patientPhone: PATIENTS.fernandoDiaz.phone,
        patientEmail: PATIENTS.fernandoDiaz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '180 €',
        economicStatus: 'Pagado',
        notes: 'Entrega férula de descarga. Bruxismo nocturno severo.',
        duration: '18:30 - 19:15 (45 minutos)'
      })
    },
    {
      id: 'mon-15',
      top: timeToTop(19, 0),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.beatrizMuñoz.name,
      box: 'Box 1',
      timeRange: '19:00 - 19:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', TREATMENTS.revision, '19:00', {
        patientFull: PATIENTS.beatrizMuñoz.name,
        patientPhone: PATIENTS.beatrizMuñoz.phone,
        patientEmail: PATIENTS.beatrizMuñoz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión anual. Paciente con implante hace 3 años.',
        duration: '19:00 - 19:30 (30 minutos)'
      })
    }
  ],
  tuesday: [
    // MARTES - Día de ortodoncia y cirugía
    {
      id: 'tue-1',
      top: timeToTop(9, 0),
      height: durationToHeight(60),
      title: TREATMENTS.brackets,
      patient: PATIENTS.ramonCastro.name,
      box: 'Box 1',
      timeRange: '09:00 - 10:00',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('tuesday', TREATMENTS.brackets, '09:00', {
        patientFull: PATIENTS.ramonCastro.name,
        patientPhone: PATIENTS.ramonCastro.phone,
        patientEmail: PATIENTS.ramonCastro.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '2.800 € (total tratamiento)',
        economicStatus: 'Financiado (24 pagos)',
        notes:
          'Colocación brackets metálicos arcada superior. Clase II división 1.',
        duration: '09:00 - 10:00 (60 minutos)',
        // Pagos parciales: 3 de 24 cuotas pagadas (inicio del tratamiento)
        paymentInfo: {
          totalAmount: 2800,
          paidAmount: 350,
          pendingAmount: 2450,
          currency: '€'
        },
        installmentPlan: {
          totalInstallments: 24,
          currentInstallment: 4,
          amountPerInstallment: 116.67
        }
      })
    },
    {
      id: 'tue-2',
      top: timeToTop(9, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.patriciaRomero.name,
      box: 'Box 2',
      timeRange: '09:30 - 10:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('tuesday', TREATMENTS.limpieza, '09:30', {
        patientFull: PATIENTS.patriciaRomero.name,
        patientPhone: PATIENTS.patriciaRomero.phone,
        patientEmail: PATIENTS.patriciaRomero.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza trimestral. Paciente con ortodoncia.',
        duration: '09:30 - 10:00 (30 minutos)'
      })
    },
    {
      id: 'tue-3',
      top: timeToTop(10, 0),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.albertoGil.name,
      box: 'Box 2',
      timeRange: '10:00 - 10:45',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('tuesday', TREATMENTS.ortodoncia, '10:00', {
        patientFull: PATIENTS.albertoGil.name,
        patientPhone: PATIENTS.albertoGil.phone,
        patientEmail: PATIENTS.albertoGil.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Ajuste de arcos. Mes 8 de tratamiento.',
        duration: '10:00 - 10:45 (45 minutos)'
      })
    },
    {
      id: 'tue-4',
      top: timeToTop(10, 30),
      height: durationToHeight(90),
      title: TREATMENTS.cordales,
      patient: PATIENTS.mariaGarcia.name,
      box: 'Box 1',
      timeRange: '10:30 - 12:00',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('tuesday', TREATMENTS.cordales, '10:30', {
        patientFull: PATIENTS.mariaGarcia.name,
        patientPhone: PATIENTS.mariaGarcia.phone,
        patientEmail: PATIENTS.mariaGarcia.email,
        professional: PROFESSIONALS.miguelTorres,
        economicAmount: '380 €',
        economicStatus: 'Pendiente de pago',
        notes:
          'Extracción cordales inferiores (38 y 48). Impactados. Sedación consciente.',
        duration: '10:30 - 12:00 (90 minutos)'
      })
    },
    {
      id: 'tue-5',
      top: timeToTop(11, 0),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.carlosRodriguez.name,
      box: 'Box 2',
      timeRange: '11:00 - 11:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('tuesday', TREATMENTS.revision, '11:00', {
        patientFull: PATIENTS.carlosRodriguez.name,
        patientPhone: PATIENTS.carlosRodriguez.phone,
        patientEmail: PATIENTS.carlosRodriguez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión empaste realizado la semana pasada.',
        duration: '11:00 - 11:30 (30 minutos)'
      })
    },
    {
      id: 'tue-6',
      top: timeToTop(11, 30),
      height: durationToHeight(45),
      title: TREATMENTS.invisalign,
      patient: PATIENTS.sofiaNavarro.name,
      box: 'Box 2',
      timeRange: '11:30 - 12:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('tuesday', TREATMENTS.invisalign, '11:30', {
        patientFull: PATIENTS.sofiaNavarro.name,
        patientPhone: PATIENTS.sofiaNavarro.phone,
        patientEmail: PATIENTS.sofiaNavarro.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Revisión Invisalign semana 24. Refinamiento fase 2.',
        duration: '11:30 - 12:15 (45 minutos)'
      })
    },
    {
      id: 'tue-7',
      top: timeToTop(12, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.javierMoreno.name,
      box: 'Box 1',
      timeRange: '12:30 - 13:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('tuesday', TREATMENTS.limpieza, '12:30', {
        patientFull: PATIENTS.javierMoreno.name,
        patientPhone: PATIENTS.javierMoreno.phone,
        patientEmail: PATIENTS.javierMoreno.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza de mantenimiento.',
        duration: '12:30 - 13:00 (30 minutos)'
      })
    },
    {
      id: 'tue-8',
      top: timeToTop(12, 30),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.lauraFernandez.name,
      box: 'Box 2',
      timeRange: '12:30 - 13:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('tuesday', TREATMENTS.ortodoncia, '12:30', {
        patientFull: PATIENTS.lauraFernandez.name,
        patientPhone: PATIENTS.lauraFernandez.phone,
        patientEmail: PATIENTS.lauraFernandez.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Activación brackets. Colocación elásticos clase II.',
        duration: '12:30 - 13:15 (45 minutos)'
      })
    },
    // Tarde
    {
      id: 'tue-9',
      top: timeToTop(16, 0),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.davidSanchez.name,
      box: 'Box 1',
      timeRange: '16:00 - 16:45',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('tuesday', TREATMENTS.empaste, '16:00', {
        patientFull: PATIENTS.davidSanchez.name,
        patientPhone: PATIENTS.davidSanchez.phone,
        patientEmail: PATIENTS.davidSanchez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '95 €',
        economicStatus: 'Pagado',
        notes: 'Empaste premolar 24. Caries oclusal.',
        duration: '16:00 - 16:45 (45 minutos)'
      })
    },
    {
      id: 'tue-10',
      top: timeToTop(16, 30),
      height: durationToHeight(60),
      title: TREATMENTS.endodoncia,
      patient: PATIENTS.miguelGomez.name,
      box: 'Box 2',
      timeRange: '16:30 - 17:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('tuesday', TREATMENTS.endodoncia, '16:30', {
        patientFull: PATIENTS.miguelGomez.name,
        patientPhone: PATIENTS.miguelGomez.phone,
        patientEmail: PATIENTS.miguelGomez.email,
        professional: PROFESSIONALS.franciscoMoreno,
        economicAmount: '280 €',
        economicStatus: 'Financiado (2 pagos)',
        notes: 'Endodoncia molar 36. Necrosis pulpar.',
        duration: '16:30 - 17:30 (60 minutos)'
      })
    },
    {
      id: 'tue-11',
      top: timeToTop(17, 0),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.elenaVega.name,
      box: 'Box 1',
      timeRange: '17:00 - 17:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('tuesday', TREATMENTS.revision, '17:00', {
        patientFull: PATIENTS.elenaVega.name,
        patientPhone: PATIENTS.elenaVega.phone,
        patientEmail: PATIENTS.elenaVega.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '0 € (control incluido)',
        economicStatus: 'Incluido en blanqueamiento',
        notes: 'Control post-blanqueamiento. Valorar sensibilidad.',
        duration: '17:00 - 17:30 (30 minutos)'
      })
    },
    {
      id: 'tue-12',
      top: timeToTop(17, 30),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.carmenRuiz.name,
      box: 'Box 1',
      timeRange: '17:30 - 18:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('tuesday', TREATMENTS.ortodoncia, '17:30', {
        patientFull: PATIENTS.carmenRuiz.name,
        patientPhone: PATIENTS.carmenRuiz.phone,
        patientEmail: PATIENTS.carmenRuiz.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Revisión brackets mes 14. Cierre de espacios.',
        duration: '17:30 - 18:15 (45 minutos)'
      })
    },
    {
      id: 'tue-13',
      top: timeToTop(18, 0),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.antonioPerez.name,
      box: 'Box 2',
      timeRange: '18:00 - 18:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('tuesday', TREATMENTS.limpieza, '18:00', {
        patientFull: PATIENTS.antonioPerez.name,
        patientPhone: PATIENTS.antonioPerez.phone,
        patientEmail: PATIENTS.antonioPerez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza semestral.',
        duration: '18:00 - 18:30 (30 minutos)'
      })
    },
    {
      id: 'tue-14',
      top: timeToTop(18, 30),
      height: durationToHeight(45),
      title: TREATMENTS.carillas,
      patient: PATIENTS.beatrizMuñoz.name,
      box: 'Box 1',
      timeRange: '18:30 - 19:15',
      backgroundClass: 'bg-[#f0e9fb]',
      detail: createDetail('tuesday', TREATMENTS.carillas, '18:30', {
        patientFull: PATIENTS.beatrizMuñoz.name,
        patientPhone: PATIENTS.beatrizMuñoz.phone,
        patientEmail: PATIENTS.beatrizMuñoz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '2.400 € (6 carillas)',
        economicStatus: 'Financiado (12 pagos)',
        notes: 'Cementado carillas definitivas 11, 12, 13, 21, 22, 23.',
        duration: '18:30 - 19:15 (45 minutos)',
        // Pagos parciales: 10 de 12 cuotas pagadas (casi terminado)
        paymentInfo: {
          totalAmount: 2400,
          paidAmount: 2000,
          pendingAmount: 400,
          currency: '€'
        },
        installmentPlan: {
          totalInstallments: 12,
          currentInstallment: 11,
          amountPerInstallment: 200
        }
      })
    },
    {
      id: 'tue-15',
      top: timeToTop(19, 0),
      height: durationToHeight(30),
      title: TREATMENTS.urgencia,
      patient: PATIENTS.fernandoDiaz.name,
      box: 'Box 2',
      timeRange: '19:00 - 19:30',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('tuesday', TREATMENTS.urgencia, '19:00', {
        patientFull: PATIENTS.fernandoDiaz.name,
        patientPhone: PATIENTS.fernandoDiaz.phone,
        patientEmail: PATIENTS.fernandoDiaz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '60 €',
        economicStatus: 'Pendiente de pago',
        notes: 'Dolor agudo molar inferior. Valorar posible pulpitis.',
        duration: '19:00 - 19:30 (30 minutos)'
      })
    }
  ],
  wednesday: [
    // MIÉRCOLES - Día variado
    {
      id: 'wed-1',
      top: timeToTop(9, 0),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.martaAlonso.name,
      box: 'Box 1',
      timeRange: '09:00 - 09:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('wednesday', TREATMENTS.limpieza, '09:00', {
        patientFull: PATIENTS.martaAlonso.name,
        patientPhone: PATIENTS.martaAlonso.phone,
        patientEmail: PATIENTS.martaAlonso.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza rutinaria.',
        duration: '09:00 - 09:30 (30 minutos)'
      })
    },
    {
      id: 'wed-2',
      top: timeToTop(9, 30),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.pabloLopez.name,
      box: 'Box 1',
      timeRange: '09:30 - 10:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('wednesday', TREATMENTS.empaste, '09:30', {
        patientFull: PATIENTS.pabloLopez.name,
        patientPhone: PATIENTS.pabloLopez.phone,
        patientEmail: PATIENTS.pabloLopez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '95 €',
        economicStatus: 'Pagado',
        notes: 'Empaste composite estético 11.',
        duration: '09:30 - 10:15 (45 minutos)'
      })
    },
    {
      id: 'wed-3',
      top: timeToTop(9, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.anaMartinez.name,
      box: 'Box 2',
      timeRange: '09:30 - 10:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('wednesday', TREATMENTS.revision, '09:30', {
        patientFull: PATIENTS.anaMartinez.name,
        patientPhone: PATIENTS.anaMartinez.phone,
        patientEmail: PATIENTS.anaMartinez.email,
        professional: PROFESSIONALS.franciscoMoreno,
        economicAmount: '0 € (control incluido)',
        economicStatus: 'Incluido en endodoncia',
        notes: 'Control post-endodoncia 2 semanas.',
        duration: '09:30 - 10:00 (30 minutos)'
      })
    },
    {
      id: 'wed-4',
      top: timeToTop(10, 30),
      height: durationToHeight(60),
      title: TREATMENTS.corona,
      patient: PATIENTS.ramonCastro.name,
      box: 'Box 1',
      timeRange: '10:30 - 11:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('wednesday', TREATMENTS.corona, '10:30', {
        patientFull: PATIENTS.ramonCastro.name,
        patientPhone: PATIENTS.ramonCastro.phone,
        patientEmail: PATIENTS.ramonCastro.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '450 €',
        economicStatus: 'Financiado (4 pagos)',
        notes: 'Cementado corona zirconio pieza 36.',
        duration: '10:30 - 11:30 (60 minutos)'
      })
    },
    {
      id: 'wed-5',
      top: timeToTop(10, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.patriciaRomero.name,
      box: 'Box 2',
      timeRange: '10:30 - 11:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('wednesday', TREATMENTS.limpieza, '10:30', {
        patientFull: PATIENTS.patriciaRomero.name,
        patientPhone: PATIENTS.patriciaRomero.phone,
        patientEmail: PATIENTS.patriciaRomero.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza con ultrasonidos.',
        duration: '10:30 - 11:00 (30 minutos)'
      })
    },
    {
      id: 'wed-6',
      top: timeToTop(11, 30),
      height: durationToHeight(45),
      title: TREATMENTS.periodoncia,
      patient: PATIENTS.albertoGil.name,
      box: 'Box 2',
      timeRange: '11:30 - 12:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('wednesday', TREATMENTS.periodoncia, '11:30', {
        patientFull: PATIENTS.albertoGil.name,
        patientPhone: PATIENTS.albertoGil.phone,
        patientEmail: PATIENTS.albertoGil.email,
        professional: PROFESSIONALS.carmenDiaz,
        economicAmount: '180 €',
        economicStatus: 'Pendiente de pago',
        notes: 'Curetaje cuadrante inferior izquierdo.',
        duration: '11:30 - 12:15 (45 minutos)'
      })
    },
    {
      id: 'wed-7',
      top: timeToTop(12, 0),
      height: durationToHeight(30),
      title: TREATMENTS.sellador,
      patient: 'Lucía Martín (8 años)',
      box: 'Box 1',
      timeRange: '12:00 - 12:30',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('wednesday', TREATMENTS.sellador, '12:00', {
        patientFull: 'Lucía Martín Vega',
        patientPhone: '+34 612 987 654',
        patientEmail: 'padres.lucia@gmail.com',
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '40 € (por molar)',
        economicStatus: 'Pagado',
        notes:
          'Selladores en primeros molares definitivos. Paciente pediátrico.',
        duration: '12:00 - 12:30 (30 minutos)'
      })
    },
    {
      id: 'wed-8',
      top: timeToTop(12, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.mariaGarcia.name,
      box: 'Box 1',
      timeRange: '12:30 - 13:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('wednesday', TREATMENTS.revision, '12:30', {
        patientFull: PATIENTS.mariaGarcia.name,
        patientPhone: PATIENTS.mariaGarcia.phone,
        patientEmail: PATIENTS.mariaGarcia.email,
        professional: PROFESSIONALS.miguelTorres,
        economicAmount: '0 € (control incluido)',
        economicStatus: 'Incluido en cirugía',
        notes: 'Control post-extracción cordales. Verificar cicatrización.',
        duration: '12:30 - 13:00 (30 minutos)'
      })
    },
    // Tarde
    {
      id: 'wed-9',
      top: timeToTop(16, 0),
      height: durationToHeight(90),
      title: TREATMENTS.implante,
      patient: PATIENTS.sofiaNavarro.name,
      box: 'Box 1',
      timeRange: '16:00 - 17:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('wednesday', TREATMENTS.implante, '16:00', {
        patientFull: PATIENTS.sofiaNavarro.name,
        patientPhone: PATIENTS.sofiaNavarro.phone,
        patientEmail: PATIENTS.sofiaNavarro.email,
        professional: PROFESSIONALS.miguelTorres,
        economicAmount: '1.200 €',
        economicStatus: 'Financiado (12 pagos)',
        notes: 'Colocación implante pieza 14. Elevación de seno leve.',
        duration: '16:00 - 17:30 (90 minutos)'
      })
    },
    {
      id: 'wed-10',
      top: timeToTop(16, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.carlosRodriguez.name,
      box: 'Box 2',
      timeRange: '16:30 - 17:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('wednesday', TREATMENTS.limpieza, '16:30', {
        patientFull: PATIENTS.carlosRodriguez.name,
        patientPhone: PATIENTS.carlosRodriguez.phone,
        patientEmail: PATIENTS.carlosRodriguez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza semestral.',
        duration: '16:30 - 17:00 (30 minutos)'
      })
    },
    {
      id: 'wed-11',
      top: timeToTop(17, 30),
      height: durationToHeight(60),
      title: TREATMENTS.endodoncia,
      patient: PATIENTS.fernandoDiaz.name,
      box: 'Box 1',
      timeRange: '17:30 - 18:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('wednesday', TREATMENTS.endodoncia, '17:30', {
        patientFull: PATIENTS.fernandoDiaz.name,
        patientPhone: PATIENTS.fernandoDiaz.phone,
        patientEmail: PATIENTS.fernandoDiaz.email,
        professional: PROFESSIONALS.franciscoMoreno,
        economicAmount: '280 €',
        economicStatus: 'Pendiente de pago',
        notes: 'Endodoncia urgente molar 46. Pulpitis irreversible.',
        duration: '17:30 - 18:30 (60 minutos)'
      })
    },
    {
      id: 'wed-12',
      top: timeToTop(17, 30),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.lauraFernandez.name,
      box: 'Box 2',
      timeRange: '17:30 - 18:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('wednesday', TREATMENTS.ortodoncia, '17:30', {
        patientFull: PATIENTS.lauraFernandez.name,
        patientPhone: PATIENTS.lauraFernandez.phone,
        patientEmail: PATIENTS.lauraFernandez.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Emergencia: bracket despegado. Recementar 23.',
        duration: '17:30 - 18:15 (45 minutos)'
      })
    },
    {
      id: 'wed-13',
      top: timeToTop(18, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.javierMoreno.name,
      box: 'Box 1',
      timeRange: '18:30 - 19:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('wednesday', TREATMENTS.revision, '18:30', {
        patientFull: PATIENTS.javierMoreno.name,
        patientPhone: PATIENTS.javierMoreno.phone,
        patientEmail: PATIENTS.javierMoreno.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión general anual.',
        duration: '18:30 - 19:00 (30 minutos)'
      })
    },
    {
      id: 'wed-14',
      top: timeToTop(18, 30),
      height: durationToHeight(45),
      title: TREATMENTS.protesis,
      patient: PATIENTS.carmenRuiz.name,
      box: 'Box 2',
      timeRange: '18:30 - 19:15',
      backgroundClass: 'bg-[#f0e9fb]',
      detail: createDetail('wednesday', TREATMENTS.protesis, '18:30', {
        patientFull: PATIENTS.carmenRuiz.name,
        patientPhone: PATIENTS.carmenRuiz.phone,
        patientEmail: PATIENTS.carmenRuiz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '80 €',
        economicStatus: 'Pagado',
        notes: 'Ajuste prótesis removible inferior. Molestias en zona 35.',
        duration: '18:30 - 19:15 (45 minutos)'
      })
    }
  ],
  thursday: [
    // JUEVES - Día de estética y periodoncia
    {
      id: 'thu-1',
      top: timeToTop(9, 0),
      height: durationToHeight(60),
      title: TREATMENTS.blanqueamiento,
      patient: PATIENTS.elenaVega.name,
      box: 'Box 1',
      timeRange: '09:00 - 10:00',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('thursday', TREATMENTS.blanqueamiento, '09:00', {
        patientFull: PATIENTS.elenaVega.name,
        patientPhone: PATIENTS.elenaVega.phone,
        patientEmail: PATIENTS.elenaVega.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '250 €',
        economicStatus: 'Pagado',
        notes: 'Blanqueamiento LED. Primera sesión.',
        duration: '09:00 - 10:00 (60 minutos)'
      })
    },
    {
      id: 'thu-2',
      top: timeToTop(9, 30),
      height: durationToHeight(45),
      title: TREATMENTS.periodoncia,
      patient: PATIENTS.davidSanchez.name,
      box: 'Box 2',
      timeRange: '09:30 - 10:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('thursday', TREATMENTS.periodoncia, '09:30', {
        patientFull: PATIENTS.davidSanchez.name,
        patientPhone: PATIENTS.davidSanchez.phone,
        patientEmail: PATIENTS.davidSanchez.email,
        professional: PROFESSIONALS.carmenDiaz,
        economicAmount: '180 €',
        economicStatus: 'Pagado',
        notes: 'Mantenimiento periodontal. Bolsas estables.',
        duration: '09:30 - 10:15 (45 minutos)'
      })
    },
    {
      id: 'thu-3',
      top: timeToTop(10, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.miguelGomez.name,
      box: 'Box 1',
      timeRange: '10:30 - 11:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('thursday', TREATMENTS.limpieza, '10:30', {
        patientFull: PATIENTS.miguelGomez.name,
        patientPhone: PATIENTS.miguelGomez.phone,
        patientEmail: PATIENTS.miguelGomez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza previa a cirugía de implante.',
        duration: '10:30 - 11:00 (30 minutos)'
      })
    },
    {
      id: 'thu-4',
      top: timeToTop(10, 30),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.antonioPerez.name,
      box: 'Box 2',
      timeRange: '10:30 - 11:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('thursday', TREATMENTS.empaste, '10:30', {
        patientFull: PATIENTS.antonioPerez.name,
        patientPhone: PATIENTS.antonioPerez.phone,
        patientEmail: PATIENTS.antonioPerez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '95 €',
        economicStatus: 'Pagado',
        notes: 'Empaste premolar 25.',
        duration: '10:30 - 11:15 (45 minutos)'
      })
    },
    {
      id: 'thu-5',
      top: timeToTop(11, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.martaAlonso.name,
      box: 'Box 1',
      timeRange: '11:30 - 12:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('thursday', TREATMENTS.revision, '11:30', {
        patientFull: PATIENTS.martaAlonso.name,
        patientPhone: PATIENTS.martaAlonso.phone,
        patientEmail: PATIENTS.martaAlonso.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión semestral.',
        duration: '11:30 - 12:00 (30 minutos)'
      })
    },
    {
      id: 'thu-6',
      top: timeToTop(11, 30),
      height: durationToHeight(45),
      title: TREATMENTS.sensibilidad,
      patient: PATIENTS.beatrizMuñoz.name,
      box: 'Box 2',
      timeRange: '11:30 - 12:15',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('thursday', TREATMENTS.sensibilidad, '11:30', {
        patientFull: PATIENTS.beatrizMuñoz.name,
        patientPhone: PATIENTS.beatrizMuñoz.phone,
        patientEmail: PATIENTS.beatrizMuñoz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '60 €',
        economicStatus: 'Pagado',
        notes:
          'Aplicación barniz desensibilizante. Hipersensibilidad generalizada.',
        duration: '11:30 - 12:15 (45 minutos)'
      })
    },
    {
      id: 'thu-7',
      top: timeToTop(12, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.pabloLopez.name,
      box: 'Box 1',
      timeRange: '12:30 - 13:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('thursday', TREATMENTS.limpieza, '12:30', {
        patientFull: PATIENTS.pabloLopez.name,
        patientPhone: PATIENTS.pabloLopez.phone,
        patientEmail: PATIENTS.pabloLopez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza de mantenimiento.',
        duration: '12:30 - 13:00 (30 minutos)'
      })
    },
    // Tarde
    {
      id: 'thu-8',
      top: timeToTop(16, 0),
      height: durationToHeight(60),
      title: TREATMENTS.carillas,
      patient: PATIENTS.sofiaNavarro.name,
      box: 'Box 1',
      timeRange: '16:00 - 17:00',
      backgroundClass: 'bg-[#f0e9fb]',
      detail: createDetail('thursday', TREATMENTS.carillas, '16:00', {
        patientFull: PATIENTS.sofiaNavarro.name,
        patientPhone: PATIENTS.sofiaNavarro.phone,
        patientEmail: PATIENTS.sofiaNavarro.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '1.600 € (4 carillas)',
        economicStatus: 'Financiado (8 pagos)',
        notes: 'Preparación carillas 11, 12, 21, 22. Toma de impresiones.',
        duration: '16:00 - 17:00 (60 minutos)'
      })
    },
    {
      id: 'thu-9',
      top: timeToTop(16, 30),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.ramonCastro.name,
      box: 'Box 2',
      timeRange: '16:30 - 17:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('thursday', TREATMENTS.ortodoncia, '16:30', {
        patientFull: PATIENTS.ramonCastro.name,
        patientPhone: PATIENTS.ramonCastro.phone,
        patientEmail: PATIENTS.ramonCastro.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Revisión mensual brackets. Mes 2.',
        duration: '16:30 - 17:15 (45 minutos)'
      })
    },
    {
      id: 'thu-10',
      top: timeToTop(17, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.anaMartinez.name,
      box: 'Box 1',
      timeRange: '17:30 - 18:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('thursday', TREATMENTS.revision, '17:30', {
        patientFull: PATIENTS.anaMartinez.name,
        patientPhone: PATIENTS.anaMartinez.phone,
        patientEmail: PATIENTS.anaMartinez.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión general.',
        duration: '17:30 - 18:00 (30 minutos)'
      })
    },
    {
      id: 'thu-11',
      top: timeToTop(17, 30),
      height: durationToHeight(45),
      title: TREATMENTS.invisalign,
      patient: PATIENTS.patriciaRomero.name,
      box: 'Box 2',
      timeRange: '17:30 - 18:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('thursday', TREATMENTS.invisalign, '17:30', {
        patientFull: PATIENTS.patriciaRomero.name,
        patientPhone: PATIENTS.patriciaRomero.phone,
        patientEmail: PATIENTS.patriciaRomero.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Inicio tratamiento Invisalign. Entrega primeros alineadores.',
        duration: '17:30 - 18:15 (45 minutos)'
      })
    },
    {
      id: 'thu-12',
      top: timeToTop(18, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.albertoGil.name,
      box: 'Box 1',
      timeRange: '18:30 - 19:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('thursday', TREATMENTS.limpieza, '18:30', {
        patientFull: PATIENTS.albertoGil.name,
        patientPhone: PATIENTS.albertoGil.phone,
        patientEmail: PATIENTS.albertoGil.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza post-tratamiento periodontal.',
        duration: '18:30 - 19:00 (30 minutos)'
      })
    },
    {
      id: 'thu-13',
      top: timeToTop(18, 30),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.carmenRuiz.name,
      box: 'Box 2',
      timeRange: '18:30 - 19:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('thursday', TREATMENTS.empaste, '18:30', {
        patientFull: PATIENTS.carmenRuiz.name,
        patientPhone: PATIENTS.carmenRuiz.phone,
        patientEmail: PATIENTS.carmenRuiz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '85 €',
        economicStatus: 'Pagado',
        notes: 'Empaste incisivo 21. Fractura de borde incisal.',
        duration: '18:30 - 19:15 (45 minutos)'
      })
    }
  ],
  friday: [
    // VIERNES - Día más relajado
    {
      id: 'fri-1',
      top: timeToTop(9, 0),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.lauraFernandez.name,
      box: 'Box 1',
      timeRange: '09:00 - 09:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('friday', TREATMENTS.limpieza, '09:00', {
        patientFull: PATIENTS.lauraFernandez.name,
        patientPhone: PATIENTS.lauraFernandez.phone,
        patientEmail: PATIENTS.lauraFernandez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza trimestral (paciente con brackets).',
        duration: '09:00 - 09:30 (30 minutos)'
      })
    },
    {
      id: 'fri-2',
      top: timeToTop(9, 30),
      height: durationToHeight(45),
      title: TREATMENTS.revision,
      patient: PATIENTS.javierMoreno.name,
      box: 'Box 1',
      timeRange: '09:30 - 10:15',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('friday', TREATMENTS.revision, '09:30', {
        patientFull: PATIENTS.javierMoreno.name,
        patientPhone: PATIENTS.javierMoreno.phone,
        patientEmail: PATIENTS.javierMoreno.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Primera visita. Evaluación general y plan de tratamiento.',
        duration: '09:30 - 10:15 (45 minutos)'
      })
    },
    {
      id: 'fri-3',
      top: timeToTop(9, 30),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.fernandoDiaz.name,
      box: 'Box 2',
      timeRange: '09:30 - 10:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('friday', TREATMENTS.limpieza, '09:30', {
        patientFull: PATIENTS.fernandoDiaz.name,
        patientPhone: PATIENTS.fernandoDiaz.phone,
        patientEmail: PATIENTS.fernandoDiaz.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Limpieza semestral.',
        duration: '09:30 - 10:00 (30 minutos)'
      })
    },
    {
      id: 'fri-4',
      top: timeToTop(10, 30),
      height: durationToHeight(60),
      title: TREATMENTS.extraccion,
      patient: PATIENTS.miguelGomez.name,
      box: 'Box 1',
      timeRange: '10:30 - 11:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('friday', TREATMENTS.extraccion, '10:30', {
        patientFull: PATIENTS.miguelGomez.name,
        patientPhone: PATIENTS.miguelGomez.phone,
        patientEmail: PATIENTS.miguelGomez.email,
        professional: PROFESSIONALS.miguelTorres,
        economicAmount: '120 €',
        economicStatus: 'Pagado',
        notes: 'Extracción resto radicular 26. Preparación para implante.',
        duration: '10:30 - 11:30 (60 minutos)'
      })
    },
    {
      id: 'fri-5',
      top: timeToTop(10, 30),
      height: durationToHeight(45),
      title: TREATMENTS.ortodoncia,
      patient: PATIENTS.sofiaNavarro.name,
      box: 'Box 2',
      timeRange: '10:30 - 11:15',
      backgroundClass: 'bg-[#e9fbf9]',
      detail: createDetail('friday', TREATMENTS.ortodoncia, '10:30', {
        patientFull: PATIENTS.sofiaNavarro.name,
        patientPhone: PATIENTS.sofiaNavarro.phone,
        patientEmail: PATIENTS.sofiaNavarro.email,
        professional: PROFESSIONALS.elenaNava,
        economicAmount: '0 € (incluido)',
        economicStatus: 'Plan activo',
        notes: 'Revisión Invisalign. Última fase de tratamiento.',
        duration: '10:30 - 11:15 (45 minutos)'
      })
    },
    {
      id: 'fri-6',
      top: timeToTop(11, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.elenaVega.name,
      box: 'Box 2',
      timeRange: '11:30 - 12:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('friday', TREATMENTS.revision, '11:30', {
        patientFull: PATIENTS.elenaVega.name,
        patientPhone: PATIENTS.elenaVega.phone,
        patientEmail: PATIENTS.elenaVega.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '45 €',
        economicStatus: 'Pagado',
        notes: 'Revisión post-blanqueamiento final.',
        duration: '11:30 - 12:00 (30 minutos)'
      })
    },
    {
      id: 'fri-7',
      top: timeToTop(12, 0),
      height: durationToHeight(30),
      title: TREATMENTS.limpieza,
      patient: PATIENTS.davidSanchez.name,
      box: 'Box 1',
      timeRange: '12:00 - 12:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('friday', TREATMENTS.limpieza, '12:00', {
        patientFull: PATIENTS.davidSanchez.name,
        patientPhone: PATIENTS.davidSanchez.phone,
        patientEmail: PATIENTS.davidSanchez.email,
        professional: PROFESSIONALS.lauraSanchez,
        economicAmount: '65 €',
        economicStatus: 'Pagado',
        notes: 'Mantenimiento periodontal.',
        duration: '12:00 - 12:30 (30 minutos)'
      })
    },
    {
      id: 'fri-8',
      top: timeToTop(12, 30),
      height: durationToHeight(45),
      title: TREATMENTS.empaste,
      patient: PATIENTS.beatrizMuñoz.name,
      box: 'Box 1',
      timeRange: '12:30 - 13:15',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('friday', TREATMENTS.empaste, '12:30', {
        patientFull: PATIENTS.beatrizMuñoz.name,
        patientPhone: PATIENTS.beatrizMuñoz.phone,
        patientEmail: PATIENTS.beatrizMuñoz.email,
        professional: PROFESSIONALS.antonioRuiz,
        economicAmount: '95 €',
        economicStatus: 'Pagado',
        notes: 'Empaste molar 47.',
        duration: '12:30 - 13:15 (45 minutos)'
      })
    },
    {
      id: 'fri-9',
      top: timeToTop(12, 30),
      height: durationToHeight(30),
      title: TREATMENTS.revision,
      patient: PATIENTS.anaMartinez.name,
      box: 'Box 2',
      timeRange: '12:30 - 13:00',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('friday', TREATMENTS.revision, '12:30', {
        patientFull: PATIENTS.anaMartinez.name,
        patientPhone: PATIENTS.anaMartinez.phone,
        patientEmail: PATIENTS.anaMartinez.email,
        professional: PROFESSIONALS.franciscoMoreno,
        economicAmount: '0 € (control incluido)',
        economicStatus: 'Incluido',
        notes: 'Control final endodoncia. Alta.',
        duration: '12:30 - 13:00 (30 minutos)'
      })
    }
  ],
  saturday: [],
  sunday: []
}

const INITIAL_DAY_COLUMNS: DayColumn[] = [
  {
    id: 'monday',
    leftVar: '--scheduler-day-left-mon',
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.monday
  },
  {
    id: 'tuesday',
    leftVar: '--scheduler-day-left-tue',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.tuesday
  },
  {
    id: 'wednesday',
    leftVar: '--scheduler-day-left-wed',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.wednesday
  },
  {
    id: 'thursday',
    leftVar: '--scheduler-day-left-thu',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.thursday
  },
  {
    id: 'friday',
    leftVar: '--scheduler-day-left-fri',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.friday
  }
]

const DAYS_COUNT = INITIAL_DAY_COLUMNS.length

// Calcular altura dinámica basada en número de slots de 15 minutos
const getContentHeight = (numSlots: number): string => {
  return `calc(${numSlots} * var(--scheduler-slot-height-quarter))`
}

function NavigationArrow({
  direction,
  onClick
}: {
  direction: 'previous' | 'next'
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={
        direction === 'previous' ? 'Semana anterior' : 'Semana siguiente'
      }
      className='h-[2.5rem] w-[3.5rem] rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-600)] transition-colors duration-150 hover:bg-[var(--color-brand-0)]'
    >
      {direction === 'previous' ? (
        <MD3Icon name='ArrowBackIosNewRounded' size='sm' />
      ) : (
        <MD3Icon name='ArrowForwardIosRounded' size='sm' />
      )}
    </button>
  )
}

function NavigationControl({
  label,
  widthRem,
  onPrevious,
  onNext
}: {
  label: string
  widthRem: number
  onPrevious: () => void
  onNext: () => void
}) {
  const widthStyle = `min(${widthRem}rem, 45vw)`

  return (
    <div className='flex items-center gap-2'>
      <NavigationArrow direction='previous' onClick={onPrevious} />
      <div
        className='flex h-[2.5rem] flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'
        style={{ minWidth: `${widthRem}rem`, maxWidth: '45vw' }}
      >
        {label}
      </div>
      <NavigationArrow direction='next' onClick={onNext} />
    </div>
  )
}

type ToolbarChipProps = {
  label: string
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void
  isActive?: boolean
  icon?: ReactElement
  ariaExpanded?: boolean
  ariaHaspopup?: boolean
  ariaControls?: string
}

function ToolbarChip({
  label,
  onClick,
  isActive = false,
  icon,
  ariaExpanded,
  ariaHaspopup,
  ariaControls
}: ToolbarChipProps) {
  const iconNode = icon ?? (
    <MD3Icon
      name='ArrowForwardIosRounded'
      size='inherit'
      className='text-[var(--color-neutral-400)]'
    />
  )

  return (
    <button
      type='button'
      className={[
        'inline-flex h-[var(--nav-chip-height)] shrink-0 items-center gap-[var(--spacing-gapsm)] whitespace-nowrap rounded-full border px-3 text-body-md font-medium transition-colors duration-150',
        isActive
          ? 'border-[var(--color-brand-200)] bg-[var(--color-brand-50)] text-[var(--color-neutral-900)]'
          : 'border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-0)]'
      ].join(' ')}
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-controls={ariaControls}
    >
      <span>{label}</span>
      {iconNode}
    </button>
  )
}

type DayPeriod = 'full' | 'morning' | 'afternoon'

function DayPeriodSegmentedControl({
  selected,
  onSelect
}: {
  selected: DayPeriod
  onSelect: (period: DayPeriod) => void
}) {
  const options: { id: DayPeriod; label: string }[] = [
    { id: 'full', label: 'Día completo' },
    { id: 'morning', label: 'Mañana' },
    { id: 'afternoon', label: 'Tarde' }
  ]

  return (
    <div className='flex shrink-0 items-center overflow-hidden rounded-[var(--day-segmented-radius)] border border-[var(--color-border-default)]'>
      {options.map((option, index) => {
        const isActive = option.id === selected
        return (
          <button
            key={option.id}
            type='button'
            className={[
              'flex items-center justify-center whitespace-nowrap px-2 py-1.5 text-body-sm font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isActive
                ? 'bg-[var(--color-neutral-200)]'
                : 'bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)]',
              index === 1 ? 'border-x border-[var(--color-border-default)]' : ''
            ].join(' ')}
            onClick={() => onSelect(option.id)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ViewDropdown({
  id,
  selected,
  onSelect
}: {
  id: string
  selected: ViewOption
  onSelect: (value: ViewOption) => void
}) {
  return (
    <div
      id={id}
      role='menu'
      aria-orientation='vertical'
      className='absolute left-0 top-[calc(100%+0.5rem)] z-50 flex w-[min(9.3125rem,30vw)] flex-col rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
      onClick={(event) => event.stopPropagation()}
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = option.id === selected
        return (
          <button
            key={option.id}
            type='button'
            role='menuitemradio'
            aria-checked={isActive}
            className={[
              'flex w-full items-center gap-[0.5rem] px-[0.5rem] py-[0.25rem] text-left text-title-sm font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isActive
                ? 'bg-[var(--color-brand-50)]'
                : 'bg-transparent hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(option.id)
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

type MultiSelectOption = {
  id: string
  label: string
}

function MultiSelectDropdown({
  id,
  selected,
  options,
  onToggle
}: {
  id: string
  selected: string[]
  options: MultiSelectOption[]
  onToggle: (value: string) => void
}) {
  return (
    <div
      id={id}
      role='menu'
      aria-orientation='vertical'
      className='absolute left-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[min(20rem,50vh)] w-max min-w-[9.3125rem] flex-col overflow-y-auto rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
      onClick={(event) => event.stopPropagation()}
    >
      {options.map((option) => {
        const isChecked = selected.includes(option.id)
        return (
          <button
            key={option.id}
            type='button'
            role='menuitemcheckbox'
            aria-checked={isChecked}
            className={[
              'flex w-full items-center gap-[0.5rem] px-[0.5rem] py-[0.25rem] text-left text-title-sm font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isChecked
                ? 'bg-[var(--color-brand-50)]'
                : 'bg-transparent hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(option.id)
            }}
          >
            <span
              aria-hidden
              className={[
                'flex size-[1.5rem] items-center justify-center rounded-[0.25rem] border',
                isChecked
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-600)]'
                  : 'border-[var(--color-neutral-400)] text-transparent'
              ].join(' ')}
            >
              {isChecked ? <MD3Icon name='CheckRounded' size={1} /> : null}
            </span>
            <span className='text-nowrap'>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ToolbarAction({
  label,
  icon,
  onClick
}: {
  label: string
  icon: ReactElement
  onClick?: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='inline-flex h-[2.5rem] items-center gap-[var(--spacing-gapsm)] rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 text-body-md font-medium text-[var(--color-neutral-900)] transition-colors duration-150 hover:bg-[var(--color-brand-0)]'
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function HeaderLabels({
  cells,
  selectedBoxes
}: {
  cells: typeof HEADER_CELLS
  selectedBoxes: string[]
}) {
  const [activeSpecId, setActiveSpecId] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<Weekday | null>(null)

  const handleSpecialistClick = (
    e: ReactMouseEvent,
    specId: string,
    dayId: Weekday
  ) => {
    e.stopPropagation()
    if (activeSpecId === specId && activeDay === dayId) {
      setActiveSpecId(null)
      setActiveDay(null)
    } else {
      setActiveSpecId(specId)
      setActiveDay(dayId)
    }
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveSpecId(null)
      setActiveDay(null)
    }
    if (activeSpecId) {
      window.addEventListener('click', handleClickOutside)
      return () => window.removeEventListener('click', handleClickOutside)
    }
  }, [activeSpecId])

  // Get visible boxes sorted by their original order
  const visibleBoxes = BOX_OPTIONS.filter((opt) =>
    selectedBoxes.includes(opt.id)
  )
  const boxCount = visibleBoxes.length || 1

  return (
    <div className='relative h-[var(--scheduler-day-header-total)] w-full shrink-0 border-b border-[var(--color-border-default)] bg-[var(--color-neutral-200)]'>
      {cells.map((cell) => {
        const specialists = cell.specialists || []
        const activeSpec =
          activeDay === cell.id
            ? specialists.find((s) => s.id === activeSpecId)
            : null

        return (
          <div
            key={cell.id}
            className='absolute inset-y-0 flex flex-col'
            style={{
              left: `var(${cell.leftVar})`,
              width: `var(${cell.widthVar})`
            }}
          >
            <div className='relative flex h-[var(--scheduler-day-header-height)] items-center justify-center gap-2'>
              <span
                className={[
                  'text-body-md font-medium',
                  cell.tone === 'neutral'
                    ? 'text-[var(--color-neutral-600)]'
                    : cell.tone === 'brand'
                    ? 'text-[var(--color-brand-500)]'
                    : 'text-[var(--color-neutral-900)]'
                ].join(' ')}
              >
                {cell.label}
              </span>
              {specialists.length > 0 && (
                <div className='flex items-center gap-[0.375rem]'>
                  {specialists.map((spec) => (
                    <button
                      key={spec.id}
                      type='button'
                      onClick={(e) =>
                        handleSpecialistClick(e, spec.id, cell.id)
                      }
                      className='shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-300)] cursor-pointer transition-transform hover:scale-110'
                      title={`${spec.name} · ${spec.timeRange}`}
                      aria-label={`${spec.name} ${spec.timeRange}`}
                      style={{
                        width: '0.75rem', // 12px dot (slightly smaller for week view header)
                        height: '0.75rem',
                        backgroundColor: spec.color
                      }}
                    />
                  ))}
                </div>
              )}
              {/* Specialist popup */}
              {activeSpec && (
                <div
                  className='pointer-events-auto absolute left-1/2 z-[10] flex -translate-x-1/2 items-center gap-2 rounded-[var(--radius-xl)] bg-[var(--color-neutral-50)] px-3 py-2 text-label-md font-medium text-[var(--color-neutral-900)] shadow-[0px_2px_6px_rgba(0,0,0,0.12)]'
                  style={{
                    top: 'calc(100% + 0.25rem)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className='inline-flex h-[0.625rem] w-[0.625rem] rounded-full'
                    style={{ backgroundColor: activeSpec.color }}
                  />
                  <span className='whitespace-nowrap'>{activeSpec.name}</span>
                  <span className='whitespace-nowrap text-[var(--color-neutral-600)]'>
                    {activeSpec.timeRange}
                  </span>
                </div>
              )}
            </div>
            <div
              className='grid h-[var(--scheduler-box-header-height)] border-t border-[var(--color-border-default)] bg-[var(--color-neutral-100)] shadow-[0px_4px_8px_0px_rgba(0,0,0,0.05)]'
              style={{
                gridTemplateColumns: `repeat(${boxCount}, 1fr)`
              }}
            >
              {visibleBoxes.map((box, index) => (
                <div
                  key={box.id}
                  className={[
                    'flex items-center justify-center px-2 text-body-md font-normal',
                    index === 0
                      ? 'text-[var(--color-neutral-600)]'
                      : 'text-[var(--color-neutral-900)]'
                  ].join(' ')}
                >
                  {box.label.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimeColumn() {
  return (
    <div
      className='absolute left-0 top-0 z-[5] bg-[var(--color-neutral-100)]'
      style={{
        width: 'var(--scheduler-time-width)',
        height: '100%'
      }}
    >
      <div
        className='grid overflow-visible'
        style={{
          gridTemplateRows: `repeat(${TOTAL_SLOTS}, var(--scheduler-slot-height-quarter))`
        }}
      >
        {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
          // Primera celda: mostrar la primera hora al inicio
          const isFirstCell = index === 0
          // Resto: mostrar etiqueta cuando el borde inferior es una hora en punto
          const isHourBorder = (index + 1) % SLOTS_PER_HOUR === 0

          // Calcular la hora para el borde inferior
          const hourIndex = (index + 1) / SLOTS_PER_HOUR
          const hourLabel = isHourBorder ? HOUR_LABELS[hourIndex] : null

          return (
            <div
              key={index}
              className='relative flex justify-center overflow-visible border-r border-[var(--color-neutral-200)]'
            >
              {/* Primera hora al inicio de la primera celda */}
              {isFirstCell && HOUR_LABELS[0] && (
                <p
                  className='absolute left-1/2 z-10 text-body-md font-normal text-[var(--color-neutral-600)]'
                  style={{
                    top: 0,
                    transform: 'translate(-50%, 0)'
                  }}
                >
                  {HOUR_LABELS[0]}
                </p>
              )}
              {/* Etiquetas de las demás horas en el borde inferior, alineadas con las líneas */}
              {hourLabel && (
                <p
                  className='absolute left-1/2 z-10 text-body-md font-normal text-[var(--color-neutral-600)]'
                  style={{
                    bottom: 0,
                    transform: 'translate(-50%, 50%)'
                  }}
                >
                  {hourLabel}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DaySlotSelection = {
  column: DayColumn
  slotIndex: number
}

// Visual block type for week view
type WeekBlock = {
  id: string
  top: string
  height: string
  blockType: BlockType
  description: string
  box?: string
  timeRange: string
  responsibleName?: string
  isRecurring?: boolean
  left?: string
  width?: string
}

function DayGrid({
  column,
  activeSelection,
  hoveredId,
  onHover,
  onActivate,
  onSlotSelect,
  columnRef,
  onEventDragStart,
  draggingEventId,
  onClearSelection,
  selectedBoxes,
  selectedProfessionals,
  completedEvents,
  onToggleComplete,
  onEventContextMenu,
  visitStatusMap,
  visitStatusHistoryMap,
  onVisitStatusChange,
  confirmedEvents,
  showConfirmedOnly,
  // Block-related props
  blocks = [],
  activeBlockId,
  hoveredBlockId,
  onBlockHover,
  onBlockActivate,
  onEditBlock,
  onDeleteBlock,
  // Quick appointment creation props
  hoverSlotIndex,
  hoverBoxId,
  onHoverSlotChange,
  slotDragState,
  onSlotDragStart,
  onSlotDragMove,
  onSlotDragEnd
}: {
  column: DayColumn
  activeSelection: EventSelection
  hoveredId?: string | null
  onHover: (selection: EventSelection) => void
  onActivate: (selection: EventSelection) => void
  onSlotSelect?: (selection: DaySlotSelection) => void
  columnRef?: (el: HTMLDivElement | null) => void
  onEventDragStart?: (
    type: 'move' | 'resize',
    event: AgendaEvent,
    column: DayColumn,
    clientX: number,
    clientY: number
  ) => void
  draggingEventId?: string | null
  onClearSelection: () => void
  selectedBoxes: string[]
  selectedProfessionals: string[]
  completedEvents?: Record<string, boolean>
  onToggleComplete?: (eventId: string, completed: boolean) => void
  onEventContextMenu?: (
    e: React.MouseEvent<HTMLElement>,
    event: AgendaEvent
  ) => void
  visitStatusMap?: Record<string, VisitStatus>
  visitStatusHistoryMap?: Record<string, Array<{ status: VisitStatus; timestamp: Date }>>
  onVisitStatusChange?: (eventId: string, newStatus: VisitStatus) => void
  confirmedEvents?: Record<string, boolean>
  showConfirmedOnly?: boolean
  // Block-related props
  blocks?: WeekBlock[]
  activeBlockId?: string | null
  hoveredBlockId?: string | null
  onBlockHover?: (blockId: string | null) => void
  onBlockActivate?: (blockId: string | null) => void
  onEditBlock?: (blockId: string) => void
  onDeleteBlock?: (blockId: string, deleteRecurrence?: boolean) => void
  // Quick appointment creation props
  hoverSlotIndex?: number | null
  hoverBoxId?: string | null
  onHoverSlotChange?: (slotIndex: number | null, columnId: string, boxId: string | null) => void
  slotDragState?: SlotDragState | null
  onSlotDragStart?: (slotIndex: number, columnId: string, boxId: string, clientY: number) => void
  onSlotDragMove?: (slotIndex: number) => void
  onSlotDragEnd?: () => void
}) {
  // Calculate dynamic box layout based on selected boxes
  const boxLayout = getBoxLayout(selectedBoxes)

  // Filter events to only show those in selected boxes AND selected professionals AND confirmed (if filter active)
  const filteredEvents = column.events.filter((event) => {
    // Filter by box
    const boxName = event.box?.toLowerCase() ?? ''
    const boxId = boxName.replace(' ', '-')
    const boxMatch = selectedBoxes.includes(boxId)

    // Filter by professional (if event has professionalId)
    const professionalMatch =
      !event.professionalId ||
      selectedProfessionals.includes(event.professionalId)

    // Filter by confirmed status (if showConfirmedOnly is true)
    const isConfirmed = confirmedEvents?.[event.id] ?? event.confirmed ?? false
    const confirmedMatch = !showConfirmedOnly || isConfirmed

    return boxMatch && professionalMatch && confirmedMatch
  })
  // Domingo con patrón de puntos SVG
  const isSunday = column.id === 'sunday'
  const sundayStyle = isSunday
    ? {
        backgroundColor: 'var(--color-neutral-0)',
        backgroundImage: 'var(--sunday-bg-pattern)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'var(--sunday-dot-spacing) var(--sunday-dot-spacing)',
        backgroundPosition: '0 0'
      }
    : {}

  // Local ref for grid dimensions
  const gridRef = useRef<HTMLDivElement | null>(null)

  // Get sorted list of visible box names for position calculation
  const visibleBoxNames = Object.keys(boxLayout).sort()
  const boxCount = visibleBoxNames.length || 1

  // Calculate slot index from mouse Y position
  const getSlotFromY = (clientY: number): number => {
    if (!gridRef.current) return 0
    const rect = gridRef.current.getBoundingClientRect()
    if (rect.height <= 0) return 0
    const relativeY = clientY - rect.top
    const slotHeight = rect.height / TOTAL_SLOTS
    if (slotHeight <= 0) return 0
    const rawIndex = Math.floor(relativeY / slotHeight)
    return Math.max(0, Math.min(rawIndex, TOTAL_SLOTS - 1))
  }

  // Calculate which box the mouse is in based on X position
  const getBoxFromX = (clientX: number): string | null => {
    if (!gridRef.current || visibleBoxNames.length === 0) return null
    const rect = gridRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const columnWidth = rect.width

    // Find which box contains this X position
    for (const boxName of visibleBoxNames) {
      const layout = boxLayout[boxName]
      if (!layout) continue
      
      // Parse percentage values
      const leftPercent = parseFloat(layout.left) / 100
      const widthPercent = parseFloat(layout.width) / 100
      const boxLeft = leftPercent * columnWidth
      const boxRight = boxLeft + widthPercent * columnWidth

      if (relativeX >= boxLeft && relativeX < boxRight) {
        return boxName
      }
    }
    
    // Fallback to first box
    return visibleBoxNames[0] || null
  }

  // Handle mouse move for time indicator
  const handleGridMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    // Don't update hover if dragging an existing appointment
    if (draggingEventId) return
    
    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-appointment-card="true"]')) {
      onHoverSlotChange?.(null, column.id, null)
      return
    }

    const slotIndex = getSlotFromY(event.clientY)
    const boxId = getBoxFromX(event.clientX)
    onHoverSlotChange?.(slotIndex, column.id, boxId)

    // If dragging to select, update the current slot
    if (slotDragState?.isDragging && slotDragState.columnId === column.id) {
      onSlotDragMove?.(slotIndex)
    }
  }

  // Handle mouse leave to hide time indicator
  const handleGridMouseLeave = () => {
    if (!slotDragState?.isDragging) {
      onHoverSlotChange?.(null, column.id, null)
    }
  }

  // Handle mouse down to start drag selection
  const handleGridMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    // Only handle left click
    if (event.button !== 0) return
    
    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-appointment-card="true"]')) {
      return
    }
    if (target && target.closest('[data-block-card="true"]')) {
      return
    }

    const slotIndex = getSlotFromY(event.clientY)
    const boxId = getBoxFromX(event.clientX)
    if (boxId) {
      onSlotDragStart?.(slotIndex, column.id, boxId, event.clientY)
    }
    
    // Clear any existing selection
    onClearSelection()
    event.preventDefault()
  }

  const handleGridClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-appointment-card="true"]')) {
      return
    }
    // Click is now handled by mousedown/mouseup for drag selection
    event.stopPropagation()
  }

  const handleGridContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!onSlotSelect) return
    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-appointment-card="true"]')) {
      return
    }

    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.height <= 0) return

    const relativeY = event.clientY - rect.top
    const slotHeight = rect.height / TOTAL_SLOTS
    if (slotHeight <= 0) return

    const rawIndex = Math.floor(relativeY / slotHeight)
    const slotIndex = Math.min(Math.max(rawIndex, 0), TOTAL_SLOTS - 1)

    onSlotSelect({ column, slotIndex })
  }

  // Calculate slot height for visual components
  const slotHeightRem = 2.5 // var(--scheduler-slot-height-quarter)

  // Show time indicator if hovering this column and not dragging
  const showTimeIndicator = hoverSlotIndex !== null && 
    hoverSlotIndex !== undefined && 
    hoverBoxId !== null &&
    !slotDragState?.isDragging &&
    !draggingEventId

  // Show drag selection if dragging in this column
  const showDragSelection = slotDragState?.isDragging && slotDragState.columnId === column.id

  // Get layout for the hovered/dragged box
  const getBoxLayoutStyle = (boxId: string | null | undefined) => {
    if (!boxId) return { left: '0', width: '100%' }
    const layout = boxLayout[boxId]
    return layout || { left: '0', width: '100%' }
  }

  return (
    <div
      className={`absolute border-r border-[var(--color-border-default)] ${
        isSunday ? '' : 'bg-[var(--color-neutral-0)]'
      }`}
      ref={(el) => {
        gridRef.current = el
        columnRef?.(el)
      }}
      style={{
        left: `var(${column.leftVar})`,
        top: '0',
        width: `var(${column.widthVar})`,
        height: '100%',
        ...sundayStyle
      }}
      onClick={handleGridClick}
      onContextMenu={handleGridContextMenu}
      onMouseMove={handleGridMouseMove}
      onMouseLeave={handleGridMouseLeave}
      onMouseDown={handleGridMouseDown}
    >
      {/* Time indicator on hover - positioned within the hovered box */}
      {showTimeIndicator && hoverSlotIndex !== null && hoverBoxId && (() => {
        const hoverLayout = getBoxLayoutStyle(hoverBoxId)
        return (
          <div
            className='pointer-events-none absolute z-[3]'
            style={{
              top: `${hoverSlotIndex * slotHeightRem}rem`,
              left: hoverLayout.left,
              width: hoverLayout.width,
              transform: 'translateY(-50%)'
            }}
          >
            {/* Time badge */}
            <div className='flex items-center'>
              <div className='flex items-center justify-center rounded-[0.25rem] bg-[var(--color-brand-500)] px-[0.5rem] py-[0.125rem]'>
                <span className='text-[0.75rem] font-medium leading-[1rem] text-white'>
                  {slotIndexToTime(hoverSlotIndex, START_HOUR, MINUTES_STEP)}
                </span>
              </div>
              <div className='h-[2px] flex-1 border-t-2 border-dashed border-[var(--color-brand-400)]' />
            </div>
          </div>
        )
      })()}

      {/* Drag selection overlay - positioned within the selected box */}
      {showDragSelection && slotDragState && slotDragState.boxId && (() => {
        const { minSlot, maxSlot, slotCount } = getSelectionBounds(
          slotDragState.startSlot,
          slotDragState.currentSlot
        )
        const durationMinutes = slotCount * MINUTES_STEP
        const dragLayout = getBoxLayoutStyle(slotDragState.boxId)
        return (
          <SlotDragSelection
            top={`${minSlot * slotHeightRem}rem`}
            height={`${slotCount * slotHeightRem}rem`}
            left={dragLayout.left}
            width={dragLayout.width}
            startTime={slotIndexToTime(minSlot, START_HOUR, MINUTES_STEP)}
            endTime={slotIndexToTime(maxSlot + 1, START_HOUR, MINUTES_STEP)}
            durationMinutes={durationMinutes}
            visible
          />
        )
      })()}

      {/* Líneas horizontales para cada 15 min */}
      <div
        className='absolute inset-0 grid'
        style={{
          gridTemplateRows: `repeat(${TOTAL_SLOTS}, var(--scheduler-slot-height-quarter))`
        }}
      >
        {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
          // El borde inferior de la celda `index` está en el tiempo:
          // 9:00 + (index + 1) * 15min
          // Para que la línea oscura esté en las horas en punto (10:00, 11:00, etc.),
          // necesitamos que (index + 1) sea múltiplo de 4 (SLOTS_PER_HOUR)
          const isHourLine = (index + 1) % SLOTS_PER_HOUR === 0
          return (
            <div
              key={index}
              className={`border-b ${
                isHourLine
                  ? 'border-[var(--color-neutral-300)]'
                  : 'border-[var(--color-neutral-200)]'
              }`}
            />
          )
        })}
      </div>

      {/* Bloques (debajo de eventos) */}
      <div className='absolute inset-0'>
        {blocks.map((block) => (
          <AgendaBlockCard
            key={block.id}
            id={block.id}
            blockType={block.blockType}
            description={block.description}
            box={block.box}
            timeRange={block.timeRange}
            responsibleName={block.responsibleName}
            isRecurring={block.isRecurring}
            top={block.top}
            height={block.height}
            left={block.left}
            width={block.width}
            isActive={activeBlockId === block.id}
            isHovered={hoveredBlockId === block.id && activeBlockId !== block.id}
            onHover={() => onBlockHover?.(block.id)}
            onLeave={() => onBlockHover?.(null)}
            onActivate={() => onBlockActivate?.(block.id)}
            onEdit={() => onEditBlock?.(block.id)}
            onDelete={(deleteRecurrence) => onDeleteBlock?.(block.id, deleteRecurrence)}
          />
        ))}
      </div>

      {/* Eventos */}
      <div className='absolute inset-0'>
        {filteredEvents.map((event) => (
          <AppointmentSummaryCard
            key={event.id}
            event={{
              ...event,
              ...(boxLayout[event.box?.toLowerCase() ?? ''] ?? {}),
              completed: completedEvents?.[event.id] ?? event.completed,
              confirmed: confirmedEvents?.[event.id] ?? event.confirmed,
              visitStatus: visitStatusMap?.[event.id] ?? event.visitStatus,
              visitStatusHistory: visitStatusHistoryMap?.[event.id] ?? event.visitStatusHistory
            }}
            onHover={() => onHover({ event, column })}
            onLeave={() => onHover(null)}
            onActivate={() => onActivate({ event, column })}
            isActive={activeSelection?.event.id === event.id}
            isHovered={
              hoveredId === event.id && activeSelection?.event.id !== event.id
            }
            isDragging={draggingEventId === event.id}
            onDragStart={(type, evt, clientX, clientY) =>
              onEventDragStart?.(type, evt, column, clientX, clientY)
            }
            onToggleComplete={onToggleComplete}
            onContextMenu={onEventContextMenu}
            onVisitStatusChange={onVisitStatusChange}
          />
        ))}
      </div>
    </div>
  )
}

// Eventos del calendario mensual - Enero 2026 con info completa
// Incluye professionalId para generar bandas dinámicas por día
const MONTH_EVENTS_EXTENDED = [
  // === SEMANA 1 (5-10 Enero) ===
  // Lunes 5
  {
    id: 'm1',
    date: new Date(2026, 0, 5),
    start: '09:00',
    end: '09:30',
    title: 'Limpieza dental',
    patient: PATIENTS.mariaGarcia.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm2',
    date: new Date(2026, 0, 5),
    start: '10:00',
    end: '11:00',
    title: 'Endodoncia',
    patient: PATIENTS.anaMartinez.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm3',
    date: new Date(2026, 0, 5),
    start: '11:30',
    end: '12:00',
    title: 'Revisión ortodoncia',
    patient: PATIENTS.lauraFernandez.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  {
    id: 'm4',
    date: new Date(2026, 0, 5),
    start: '16:00',
    end: '17:30',
    title: 'Implante dental',
    patient: PATIENTS.miguelGomez.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 3'
  },
  // Martes 6
  {
    id: 'm5',
    date: new Date(2026, 0, 6),
    start: '09:00',
    end: '10:00',
    title: 'Colocación brackets',
    patient: PATIENTS.ramonCastro.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  {
    id: 'm6',
    date: new Date(2026, 0, 6),
    start: '10:30',
    end: '12:00',
    title: 'Cirugía cordales',
    patient: PATIENTS.mariaGarcia.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 2'
  },
  {
    id: 'm7',
    date: new Date(2026, 0, 6),
    start: '10:30',
    end: '11:00',
    title: 'Anestesia cirugía',
    patient: PATIENTS.mariaGarcia.name,
    professionalId: 'anestesistaJimenez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm8',
    date: new Date(2026, 0, 6),
    start: '18:00',
    end: '19:00',
    title: 'Carillas estéticas',
    patient: PATIENTS.beatrizMuñoz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  // Miércoles 7
  {
    id: 'm9',
    date: new Date(2026, 0, 7),
    start: '09:00',
    end: '09:30',
    title: 'Limpieza dental',
    patient: PATIENTS.martaAlonso.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm10',
    date: new Date(2026, 0, 7),
    start: '10:30',
    end: '11:30',
    title: 'Corona dental',
    patient: PATIENTS.ramonCastro.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm11',
    date: new Date(2026, 0, 7),
    start: '12:00',
    end: '12:30',
    title: 'Periodoncia',
    patient: PATIENTS.davidSanchez.name,
    professionalId: 'drSanchez' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm12',
    date: new Date(2026, 0, 7),
    start: '16:00',
    end: '17:30',
    title: 'Implante dental',
    patient: PATIENTS.sofiaNavarro.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 3'
  },
  // Jueves 8
  {
    id: 'm13',
    date: new Date(2026, 0, 8),
    start: '09:00',
    end: '10:00',
    title: 'Blanqueamiento',
    patient: PATIENTS.elenaVega.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm14',
    date: new Date(2026, 0, 8),
    start: '11:30',
    end: '12:00',
    title: 'Sensibilidad dental',
    patient: PATIENTS.beatrizMuñoz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm15',
    date: new Date(2026, 0, 8),
    start: '16:00',
    end: '17:00',
    title: 'Carillas estéticas',
    patient: PATIENTS.sofiaNavarro.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  {
    id: 'm16',
    date: new Date(2026, 0, 8),
    start: '17:00',
    end: '17:30',
    title: 'Revisión infantil',
    patient: 'Lucas (8 años)',
    professionalId: 'draPeña' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 3'
  },
  // Viernes 9
  {
    id: 'm17',
    date: new Date(2026, 0, 9),
    start: '09:00',
    end: '09:30',
    title: 'Limpieza dental',
    patient: PATIENTS.lauraFernandez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm18',
    date: new Date(2026, 0, 9),
    start: '10:30',
    end: '11:30',
    title: 'Extracción dental',
    patient: PATIENTS.miguelGomez.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 2'
  },
  {
    id: 'm19',
    date: new Date(2026, 0, 9),
    start: '12:00',
    end: '12:30',
    title: 'Periodoncia',
    patient: PATIENTS.davidSanchez.name,
    professionalId: 'drSanchez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  // Sábado 10
  {
    id: 'm20',
    date: new Date(2026, 0, 10),
    start: '10:00',
    end: '10:30',
    title: 'Urgencia dental',
    patient: PATIENTS.antonioPerez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  {
    id: 'm21',
    date: new Date(2026, 0, 10),
    start: '11:30',
    end: '12:30',
    title: 'Periodoncia profunda',
    patient: PATIENTS.davidSanchez.name,
    professionalId: 'drSanchez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },

  // === SEMANA 2 (12-17 Enero) ===
  // Lunes 12
  {
    id: 'm22',
    date: new Date(2026, 0, 12),
    start: '09:00',
    end: '09:30',
    title: 'Revisión general',
    patient: PATIENTS.pabloLopez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm23',
    date: new Date(2026, 0, 12),
    start: '10:00',
    end: '10:45',
    title: 'Endodoncia',
    patient: PATIENTS.carmenRuiz.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm24',
    date: new Date(2026, 0, 12),
    start: '11:00',
    end: '12:00',
    title: 'Ortodoncia revisión',
    patient: PATIENTS.lauraFernandez.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  {
    id: 'm25',
    date: new Date(2026, 0, 12),
    start: '17:00',
    end: '17:45',
    title: 'Empaste',
    patient: PATIENTS.martaAlonso.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  // Martes 13
  {
    id: 'm26',
    date: new Date(2026, 0, 13),
    start: '09:30',
    end: '10:00',
    title: 'Limpieza dental',
    patient: PATIENTS.carlosRodriguez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm27',
    date: new Date(2026, 0, 13),
    start: '12:00',
    end: '13:00',
    title: 'Periodoncia',
    patient: PATIENTS.albertoGil.name,
    professionalId: 'drSanchez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm28',
    date: new Date(2026, 0, 13),
    start: '16:30',
    end: '17:30',
    title: 'Endodoncia',
    patient: PATIENTS.miguelGomez.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  // Miércoles 14
  {
    id: 'm29',
    date: new Date(2026, 0, 14),
    start: '10:00',
    end: '10:30',
    title: 'Invisalign revisión',
    patient: PATIENTS.sofiaNavarro.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm30',
    date: new Date(2026, 0, 14),
    start: '11:00',
    end: '11:45',
    title: 'Empaste',
    patient: PATIENTS.javierMoreno.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm31',
    date: new Date(2026, 0, 14),
    start: '16:00',
    end: '17:00',
    title: 'Corona dental',
    patient: PATIENTS.carmenRuiz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  // Jueves 15 - DÍA CON PEDIATRA
  {
    id: 'm32',
    date: new Date(2026, 0, 15),
    start: '09:00',
    end: '09:30',
    title: 'Limpieza dental',
    patient: PATIENTS.javierMoreno.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm33',
    date: new Date(2026, 0, 15),
    start: '10:00',
    end: '10:45',
    title: 'Endodoncia',
    patient: PATIENTS.elenaVega.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm34',
    date: new Date(2026, 0, 15),
    start: '11:30',
    end: '12:00',
    title: 'Revisión general',
    patient: PATIENTS.antonioPerez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  {
    id: 'm35',
    date: new Date(2026, 0, 15),
    start: '16:00',
    end: '16:30',
    title: 'Revisión infantil',
    patient: 'María (6 años)',
    professionalId: 'draPeña' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 3'
  },
  {
    id: 'm36',
    date: new Date(2026, 0, 15),
    start: '17:00',
    end: '17:30',
    title: 'Selladores infantil',
    patient: 'Pablo (9 años)',
    professionalId: 'draPeña' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 3'
  },
  {
    id: 'm37',
    date: new Date(2026, 0, 15),
    start: '17:30',
    end: '18:30',
    title: 'Férula descarga',
    patient: PATIENTS.fernandoDiaz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  // Viernes 16
  {
    id: 'm38',
    date: new Date(2026, 0, 16),
    start: '09:30',
    end: '10:00',
    title: 'Limpieza dental',
    patient: PATIENTS.patriciaRomero.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm39',
    date: new Date(2026, 0, 16),
    start: '10:30',
    end: '11:15',
    title: 'Empaste',
    patient: PATIENTS.anaMartinez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 2'
  },
  {
    id: 'm40',
    date: new Date(2026, 0, 16),
    start: '12:00',
    end: '12:30',
    title: 'Selladores',
    patient: 'Sara (7 años)',
    professionalId: 'draPeña' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 3'
  },

  // === SEMANA 3 (19-24 Enero) ===
  // Lunes 19
  {
    id: 'm41',
    date: new Date(2026, 0, 19),
    start: '09:00',
    end: '09:30',
    title: 'Limpieza dental',
    patient: PATIENTS.mariaGarcia.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm42',
    date: new Date(2026, 0, 19),
    start: '10:30',
    end: '11:30',
    title: 'Ortodoncia ajuste',
    patient: PATIENTS.ramonCastro.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm43',
    date: new Date(2026, 0, 19),
    start: '16:00',
    end: '16:30',
    title: 'Implante control',
    patient: PATIENTS.miguelGomez.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  // Martes 20
  {
    id: 'm44',
    date: new Date(2026, 0, 20),
    start: '09:30',
    end: '10:30',
    title: 'Brackets ajuste',
    patient: PATIENTS.ramonCastro.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm45',
    date: new Date(2026, 0, 20),
    start: '11:00',
    end: '11:30',
    title: 'Revisión general',
    patient: PATIENTS.carlosRodriguez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm46',
    date: new Date(2026, 0, 20),
    start: '17:00',
    end: '18:00',
    title: 'Blanqueamiento',
    patient: PATIENTS.elenaVega.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  // Miércoles 21
  {
    id: 'm47',
    date: new Date(2026, 0, 21),
    start: '09:00',
    end: '10:00',
    title: 'Periodoncia profunda',
    patient: PATIENTS.davidSanchez.name,
    professionalId: 'drSanchez' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm48',
    date: new Date(2026, 0, 21),
    start: '10:30',
    end: '11:30',
    title: 'Endodoncia',
    patient: PATIENTS.fernandoDiaz.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm49',
    date: new Date(2026, 0, 21),
    start: '12:30',
    end: '13:00',
    title: 'Revisión general',
    patient: PATIENTS.mariaGarcia.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  // Jueves 22
  {
    id: 'm50',
    date: new Date(2026, 0, 22),
    start: '10:00',
    end: '10:45',
    title: 'Empaste',
    patient: PATIENTS.pabloLopez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm51',
    date: new Date(2026, 0, 22),
    start: '11:00',
    end: '12:00',
    title: 'Cirugía menor',
    patient: PATIENTS.albertoGil.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 2'
  },
  {
    id: 'm52',
    date: new Date(2026, 0, 22),
    start: '16:30',
    end: '17:00',
    title: 'Invisalign revisión',
    patient: PATIENTS.patriciaRomero.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  // Viernes 23
  {
    id: 'm53',
    date: new Date(2026, 0, 23),
    start: '09:00',
    end: '09:30',
    title: 'Limpieza dental',
    patient: PATIENTS.beatrizMuñoz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm54',
    date: new Date(2026, 0, 23),
    start: '10:00',
    end: '10:45',
    title: 'Endodoncia',
    patient: PATIENTS.javierMoreno.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm55',
    date: new Date(2026, 0, 23),
    start: '11:00',
    end: '12:00',
    title: 'Prótesis ajuste',
    patient: PATIENTS.carmenRuiz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },

  // === SEMANA 4 (26-31 Enero) ===
  // Lunes 26
  {
    id: 'm56',
    date: new Date(2026, 0, 26),
    start: '09:30',
    end: '10:00',
    title: 'Revisión general',
    patient: PATIENTS.anaMartinez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm57',
    date: new Date(2026, 0, 26),
    start: '11:00',
    end: '11:30',
    title: 'Limpieza dental',
    patient: PATIENTS.sofiaNavarro.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm58',
    date: new Date(2026, 0, 26),
    start: '16:00',
    end: '17:30',
    title: 'Carillas cementado',
    patient: PATIENTS.beatrizMuñoz.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  // Martes 27
  {
    id: 'm59',
    date: new Date(2026, 0, 27),
    start: '09:00',
    end: '10:00',
    title: 'Endodoncia',
    patient: PATIENTS.fernandoDiaz.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm60',
    date: new Date(2026, 0, 27),
    start: '10:30',
    end: '11:00',
    title: 'Periodoncia',
    patient: PATIENTS.albertoGil.name,
    professionalId: 'drSanchez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm61',
    date: new Date(2026, 0, 27),
    start: '12:00',
    end: '13:00',
    title: 'Ortodoncia revisión',
    patient: PATIENTS.lauraFernandez.name,
    professionalId: 'draGarcia' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  // Miércoles 28
  {
    id: 'm62',
    date: new Date(2026, 0, 28),
    start: '10:30',
    end: '12:00',
    title: 'Implante 2ª fase',
    patient: PATIENTS.sofiaNavarro.name,
    professionalId: 'drMartinez' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  },
  {
    id: 'm63',
    date: new Date(2026, 0, 28),
    start: '10:30',
    end: '11:00',
    title: 'Anestesia implante',
    patient: PATIENTS.sofiaNavarro.name,
    professionalId: 'anestesistaJimenez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  {
    id: 'm64',
    date: new Date(2026, 0, 28),
    start: '16:00',
    end: '16:30',
    title: 'Limpieza dental',
    patient: PATIENTS.albertoGil.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 2'
  },
  // Jueves 29
  {
    id: 'm65',
    date: new Date(2026, 0, 29),
    start: '09:00',
    end: '09:30',
    title: 'Revisión general',
    patient: PATIENTS.javierMoreno.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 1'
  },
  {
    id: 'm66',
    date: new Date(2026, 0, 29),
    start: '10:00',
    end: '10:45',
    title: 'Empaste',
    patient: PATIENTS.pabloLopez.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 2'
  },
  {
    id: 'm67',
    date: new Date(2026, 0, 29),
    start: '11:30',
    end: '12:15',
    title: 'Empaste',
    patient: PATIENTS.elenaVega.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  // Viernes 30
  {
    id: 'm68',
    date: new Date(2026, 0, 30),
    start: '10:00',
    end: '10:30',
    title: 'Limpieza dental',
    patient: PATIENTS.martaAlonso.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-teal)',
    box: 'BOX 1'
  },
  {
    id: 'm69',
    date: new Date(2026, 0, 30),
    start: '11:00',
    end: '11:45',
    title: 'Endodoncia',
    patient: PATIENTS.carmenRuiz.name,
    professionalId: 'draLopez' as ProfessionalId,
    bgColor: 'var(--color-event-purple)',
    box: 'BOX 2'
  },
  {
    id: 'm70',
    date: new Date(2026, 0, 30),
    start: '16:30',
    end: '17:30',
    title: 'Corona cementado',
    patient: PATIENTS.ramonCastro.name,
    professionalId: 'drRuiz' as ProfessionalId,
    bgColor: 'var(--color-event-coral)',
    box: 'BOX 1'
  }
]

// Alias para compatibilidad (vista mensual solo necesita date, title, bgColor)
const MONTH_EVENTS = MONTH_EVENTS_EXTENDED.map((e) => ({
  id: e.id,
  date: e.date,
  title: `${e.start} ${e.title} - ${e.patient.split(' ')[0].charAt(0)}. ${
    e.patient.split(' ').slice(-1)[0]
  }`,
  bgColor: e.bgColor
}))

// Datos de ejemplo para la vista diaria con casos realistas de clínica dental
const DAY_VIEW_FALLBACK_APPOINTMENTS = [
  // MAÑANA
  {
    id: 'day-fallback-1',
    start: '09:00',
    end: '09:30',
    title: TREATMENTS.limpieza,
    patient: PATIENTS.mariaGarcia.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'day-fallback-2',
    start: '09:30',
    end: '10:15',
    title: TREATMENTS.empaste,
    patient: PATIENTS.carlosRodriguez.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'day-fallback-3',
    start: '10:00',
    end: '11:00',
    title: TREATMENTS.endodoncia,
    patient: PATIENTS.anaMartinez.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'day-fallback-4',
    start: '10:30',
    end: '11:00',
    title: TREATMENTS.revision,
    patient: PATIENTS.pabloLopez.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'day-fallback-5',
    start: '11:00',
    end: '11:45',
    title: TREATMENTS.ortodoncia,
    patient: PATIENTS.lauraFernandez.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'day-fallback-6',
    start: '11:30',
    end: '12:00',
    title: TREATMENTS.limpieza,
    patient: PATIENTS.javierMoreno.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'day-fallback-7',
    start: '12:00',
    end: '12:30',
    title: TREATMENTS.radiografia,
    patient: PATIENTS.sofiaNavarro.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'day-fallback-8',
    start: '12:00',
    end: '12:45',
    title: TREATMENTS.periodoncia,
    patient: PATIENTS.davidSanchez.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'day-fallback-9',
    start: '13:00',
    end: '13:30',
    title: TREATMENTS.revision,
    patient: PATIENTS.carmenRuiz.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-teal)'
  },
  // TARDE
  {
    id: 'day-fallback-10',
    start: '16:00',
    end: '17:30',
    title: TREATMENTS.implante,
    patient: PATIENTS.miguelGomez.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'day-fallback-11',
    start: '16:30',
    end: '17:30',
    title: TREATMENTS.blanqueamiento,
    patient: PATIENTS.elenaVega.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'day-fallback-12',
    start: '17:30',
    end: '18:00',
    title: TREATMENTS.limpieza,
    patient: PATIENTS.antonioPerez.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'day-fallback-13',
    start: '18:00',
    end: '18:45',
    title: TREATMENTS.empaste,
    patient: PATIENTS.martaAlonso.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-coral)'
  },
  {
    id: 'day-fallback-14',
    start: '18:30',
    end: '19:15',
    title: TREATMENTS.ferula,
    patient: PATIENTS.fernandoDiaz.name,
    box: 'BOX 2',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'day-fallback-15',
    start: '19:00',
    end: '19:30',
    title: TREATMENTS.revision,
    patient: PATIENTS.beatrizMuñoz.name,
    box: 'BOX 1',
    bgColor: 'var(--color-event-teal)'
  }
]

export default function WeekScheduler() {
  const router = useRouter()

  // Hook del contexto de citas compartido para sincronización con Parte Diario
  const {
    addAppointment,
    deleteAppointment,
    updateAppointment,
    getAppointmentsByDateRange,
    getBlocksByDateRange,
    deleteBlock,
    addBlock,
    updateVisitStatus,
    getAppointmentById
  } = useAppointments()

  const [hovered, setHovered] = useState<EventSelection>(null)
  const [active, setActive] = useState<EventSelection>(null)
  
  // Block-related state
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [viewOption, setViewOption] = useState<ViewOption>('semana')
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('full')
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(
    PROFESSIONAL_OPTIONS.map((opt) => opt.id) // All professionals selected by default
  )
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>(
    BOX_OPTIONS.map((option) => option.id)
  )
  const [showConfirmedOnly, setShowConfirmedOnly] = useState(false)

  // Estado para filtro de estado de visita (null = mostrar todos)
  const [activeVisitStatusFilter, setActiveVisitStatusFilter] = useState<VisitStatus[] | null>(null)

  const isDraggingRef = useRef(false)
  const [openDropdown, setOpenDropdown] = useState<
    null | 'view' | 'professional' | 'box'
  >(null)
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] =
    useState(false)
  const [appointmentPrefill, setAppointmentPrefill] =
    useState<Partial<AppointmentFormData> | null>(null)
  const [dayColumnsState, setDayColumnsState] =
    useState<DayColumn[]>(INITIAL_DAY_COLUMNS)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<
    {
      id: string
      start: string
      end: string
      patient?: string
      title?: string
      box?: string
      bgColor?: string
    }[]
  >([])

  // Payment modal state for quick actions
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedEventForPayment, setSelectedEventForPayment] = useState<{
    id: string
    patientName: string
    treatment: string
    amount: string
    paymentInfo?: {
      totalAmount: number
      paidAmount: number
      pendingAmount: number
      currency: string
    }
    installmentPlan?: {
      totalInstallments: number
      currentInstallment: number
      amountPerInstallment: number
    }
  } | null>(null)

  // Patient record modal state for "Ver ficha" action and context menu actions
  const [patientRecordConfig, setPatientRecordConfig] = useState<{
    open: boolean
    initialTab: 'Resumen' | 'Información General' | 'Historial clínico' | 'Imágenes RX' | 'Finanzas' | 'Consentimientos' | 'Recetas'
    openBudgetCreation?: boolean
    openPrescriptionCreation?: boolean
    openClinicalHistoryEdit?: boolean
    patientId?: string
    patientName?: string
  }>({
    open: false,
    initialTab: 'Resumen'
  })

  // Estado para citas completadas (ID del evento -> completado)
  const [completedEvents, setCompletedEvents] = useState<
    Record<string, boolean>
  >({})

  // Estado para citas confirmadas (ID del evento -> confirmado)
  const [confirmedEvents, setConfirmedEvents] = useState<
    Record<string, boolean>
  >({})

  // Estado para el estado de visita de cada cita (ID del evento -> VisitStatus)
  const [visitStatusMap, setVisitStatusMap] = useState<
    Record<string, VisitStatus>
  >({})

  // Estado para el historial de estados de visita (ID del evento -> array de logs)
  // Esto permite que los timers funcionen en tiempo real
  const [visitStatusHistoryMap, setVisitStatusHistoryMap] = useState<
    Record<string, Array<{ status: VisitStatus; timestamp: Date }>>
  >({})

  // Context menu state for right-click actions on appointments
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
    event: AgendaEvent
  } | null>(null)

  // Quick appointment creation state - hover and drag
  const [hoverSlotInfo, setHoverSlotInfo] = useState<{
    slotIndex: number
    columnId: string
    boxId: string | null
  } | null>(null)
  const [slotDragState, setSlotDragState] = useState<SlotDragState | null>(null)

  // Week navigation state - starts with current week
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 (Sunday) to 6 (Saturday)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  // Month navigation state - starts with current month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const viewDropdownRef = useRef<HTMLDivElement | null>(null)
  const professionalDropdownRef = useRef<HTMLDivElement | null>(null)
  const boxDropdownRef = useRef<HTMLDivElement | null>(null)
  const viewDropdownId = useId()
  const professionalDropdownId = useId()
  const boxDropdownId = useId()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(null)
        setOpenDropdown(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!openDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        viewDropdownRef.current?.contains(target) ||
        professionalDropdownRef.current?.contains(target) ||
        boxDropdownRef.current?.contains(target)
      ) {
        return
      }
      setOpenDropdown(null)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Sync day view appointments whenever we are in day view or data changes
  // Usa MONTH_EVENTS_EXTENDED directamente para obtener los eventos del día seleccionado
  useEffect(() => {
    if (viewOption !== 'dia') return
    const targetDate = selectedDate ?? currentWeekStart
    const appointments = getAppointmentsForDate(targetDate)
    setSelectedDayAppointments(appointments)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewOption, selectedDate, currentWeekStart])

  // Only show overlay on click (active), not on hover
  // IMPORTANTE: Buscar el evento actualizado en dayColumnsState para obtener datos frescos
  const overlaySource = active
  const freshEvent = active
    ? dayColumnsState
        .flatMap((col) => col.events)
        .find((e) => e.id === active.event.id)
    : null
  const activeDetail = freshEvent?.detail ?? overlaySource?.event.detail
  const overlayPosition =
    overlaySource && activeDetail
      ? activeDetail.overlayOffsets?.top && activeDetail.overlayOffsets?.left
        ? {
            top: activeDetail.overlayOffsets.top,
            left: activeDetail.overlayOffsets.left
          }
        : getSmartOverlayPosition(
            overlaySource.event.top,
            overlaySource.column,
            'var(--scheduler-overlay-height)',
            overlaySource.event
          )
      : null

  const currentViewLabel =
    VIEW_OPTIONS.find((option) => option.id === viewOption)?.label ?? ''

  // Calcular conteos de estado de visita para la vista actual
  const visitStatusCounts: Record<VisitStatus, number> = (() => {
    const counts: Record<VisitStatus, number> = {
      scheduled: 0,
      waiting_room: 0,
      call_patient: 0,
      in_consultation: 0,
      completed: 0
    }

    // Obtener todos los eventos de la vista actual
    const allEvents = dayColumnsState.flatMap((col) => col.events)
    allEvents.forEach((event) => {
      const status = visitStatusMap[event.id] ?? event.visitStatus ?? 'scheduled'
      counts[status]++
    })

    return counts
  })()

  const handleViewChipClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'view' ? null : 'view'))
  }

  const handleProfessionalChipClick = (
    event: ReactMouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()
    setOpenDropdown((current) =>
      current === 'professional' ? null : 'professional'
    )
  }

  const handleBoxChipClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'box' ? null : 'box'))
  }

  const handleViewSelect = (value: ViewOption) => {
    setViewOption(value)
    setOpenDropdown(null)
    // Initialize selectedDate to today when switching to day view
    if (value === 'dia' && !selectedDate) {
      setSelectedDate(new Date())
    }
  }

  // Handler para abrir modal de pago desde acciones rápidas
  const handlePaymentAction = useCallback(() => {
    if (!active?.event) return

    const event = active.event
    const detail = event.detail

    setSelectedEventForPayment({
      id: detail?.appointmentId ?? event.id,
      patientName: detail?.patientFull ?? event.patient,
      treatment: detail?.treatmentDescription ?? event.title,
      amount: detail?.economicAmount ?? '0,00 €',
      // Pasar información de pagos parciales si existe
      paymentInfo: detail?.paymentInfo,
      installmentPlan: detail?.installmentPlan
    })
    setShowPaymentModal(true)
    setActive(null) // Cerrar overlay
  }, [active])

  // Handler para registrar pago (soporta pagos parciales)
  const handleRegisterPayment = useCallback(
    (data: {
      paymentMethod: string
      paymentDate: Date | null
      reference: string
      amountToPay: number
    }) => {
      if (selectedEventForPayment) {
        const paymentInfo = selectedEventForPayment.paymentInfo
        const installmentPlan = selectedEventForPayment.installmentPlan
        const isFullyPaid = paymentInfo
          ? data.amountToPay >= paymentInfo.pendingAmount
          : true

        // Solo marcar como "No" cobro si se pagó completamente
        if (isFullyPaid) {
          updateAppointment(selectedEventForPayment.id, {
            charge: 'No' // Ya cobrado completamente
          })
        }

        // ✅ ACTUALIZAR LA AGENDA EN TIEMPO REAL
        const eventIdToUpdate = selectedEventForPayment.id
        console.log('🔄 Buscando evento para actualizar:', eventIdToUpdate)

        setDayColumnsState((prevColumns) => {
          const updatedColumns = prevColumns.map((column) => ({
            ...column,
            events: column.events.map((event) => {
              // Encontrar el evento que se actualizó
              const isMatch =
                event.id === eventIdToUpdate ||
                event.detail?.appointmentId === eventIdToUpdate

              if (!isMatch) return event

              console.log(
                '✅ Evento encontrado:',
                event.id,
                'Actualizando paymentInfo...'
              )

              // Obtener el monto total del tratamiento
              const currentPaymentInfo = event.detail?.paymentInfo
              const totalAmount =
                currentPaymentInfo?.totalAmount ??
                parseFloat(
                  event.detail?.economicAmount
                    ?.replace(/[^\d,.-]/g, '')
                    .replace(',', '.') || '0'
                )

              // Calcular nuevos valores de pago
              const previouslyPaid = currentPaymentInfo?.paidAmount ?? 0
              const newPaidAmount = previouslyPaid + data.amountToPay
              const newPendingAmount = Math.max(0, totalAmount - newPaidAmount)
              const fullyPaid = newPendingAmount === 0

              // Actualizar plan de cuotas si existe
              const currentInstallmentPlan = event.detail?.installmentPlan
              const newInstallmentPlan =
                currentInstallmentPlan && !fullyPaid
                  ? {
                      ...currentInstallmentPlan,
                      currentInstallment:
                        currentInstallmentPlan.currentInstallment + 1
                    }
                  : currentInstallmentPlan

              // Crear el nuevo paymentInfo
              const newPaymentInfo = {
                totalAmount: totalAmount,
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                currency: currentPaymentInfo?.currency ?? '€'
              }

              // Determinar el nuevo economicStatus
              const newEconomicStatus = fullyPaid
                ? 'Pagado'
                : `Pago parcial (${newPaidAmount.toLocaleString('es-ES', {
                    minimumFractionDigits: 2
                  })} € de ${totalAmount.toLocaleString('es-ES', {
                    minimumFractionDigits: 2
                  })} €)`

              console.log('📊 Nuevo paymentInfo:', newPaymentInfo)
              console.log('📊 Nuevo economicStatus:', newEconomicStatus)

              // Retornar el evento actualizado
              const updatedEvent = {
                ...event,
                detail: {
                  ...event.detail!,
                  paymentInfo: newPaymentInfo,
                  installmentPlan: newInstallmentPlan,
                  economicStatus: newEconomicStatus,
                  economicAmount: fullyPaid
                    ? `${totalAmount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2
                      })} € (Pagado)`
                    : `${newPendingAmount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2
                      })} € pendiente`
                }
              }

              return updatedEvent
            })
          }))

          return updatedColumns
        })

        // TODO: Cuando el backend esté listo:
        // - Guardar el pago en la tabla de pagos
        // - Sincronizar con base de datos
        console.log('✅ Pago registrado y agenda actualizada:', {
          appointmentId: selectedEventForPayment.id,
          amountPaid: data.amountToPay,
          isFullyPaid,
          remainingAfterPayment: paymentInfo
            ? paymentInfo.pendingAmount - data.amountToPay
            : 0,
          ...data
        })
      }

      setShowPaymentModal(false)
      setSelectedEventForPayment(null)
    },
    [selectedEventForPayment, updateAppointment]
  )

  // Handler para ver ficha del paciente - Abre el modal directamente
  const handleViewPatient = useCallback(() => {
    if (!active?.event?.detail) return

    // Abrir el modal de ficha del paciente
    setPatientRecordConfig({
      open: true,
      initialTab: 'Resumen'
    })
    setActive(null) // Cerrar overlay
  }, [active])

  // Handler para marcar cita como completada/pendiente
  const handleToggleComplete = useCallback(
    (eventId: string, completed: boolean) => {
      setCompletedEvents((prev) => ({
        ...prev,
        [eventId]: completed
      }))
      // TODO: Aquí se podría sincronizar con el backend
      console.log(
        `✅ Cita ${eventId} marcada como ${
          completed ? 'completada' : 'pendiente'
        }`
      )
    },
    []
  )

  // Handler para marcar cita como confirmada/no confirmada
  const handleToggleConfirmed = useCallback(
    (eventId: string, confirmed: boolean) => {
      setConfirmedEvents((prev) => ({
        ...prev,
        [eventId]: confirmed
      }))
      console.log(
        `✅ Cita ${eventId} ${confirmed ? 'confirmada' : 'desconfirmada'}`
      )
    },
    []
  )

  // Handler para cambiar el estado de visita
  const handleVisitStatusChange = useCallback(
    (eventId: string, newStatus: VisitStatus) => {
      const now = new Date()

      // Actualizar estado local para feedback visual inmediato
      setVisitStatusMap((prev) => ({
        ...prev,
        [eventId]: newStatus
      }))

      // Actualizar historial de estados localmente (para timers en tiempo real)
      setVisitStatusHistoryMap((prev) => {
        const currentHistory = prev[eventId] || []
        return {
          ...prev,
          [eventId]: [...currentHistory, { status: newStatus, timestamp: now }]
        }
      })

      // Si el estado es 'completed', también marcar como completado
      if (newStatus === 'completed') {
        setCompletedEvents((prev) => ({
          ...prev,
          [eventId]: true
        }))
      }

      // Sincronizar con el contexto global (actualiza visitStatusHistory y calcula duraciones finales si es 'completed')
      updateVisitStatus(eventId, newStatus)

      console.log(
        `✅ Estado de visita actualizado: ${eventId} → ${newStatus} (${now.toLocaleTimeString('es-ES')})`
      )
    },
    [updateVisitStatus]
  )

  // Handler para abrir menú contextual (clic derecho en cita)
  const handleEventContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>, event: AgendaEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Cerrar cualquier overlay activo
      setActive(null)
      setHovered(null)
      // Abrir menú contextual
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        event
      })
    },
    []
  )

  // Handler para cerrar menú contextual
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Callback para abrir modal de nueva cita (definido antes de handleContextMenuAction que lo usa)
  const openCreateAppointmentModal = useCallback(
    (prefill?: Partial<AppointmentFormData>) => {
      setAppointmentPrefill(prefill ?? null)
      setIsCreateAppointmentModalOpen(true)
    },
    []
  )

  // Handler para acciones del menú contextual
  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextMenu?.event) return

      const event = contextMenu.event
      const detail = event.detail

      switch (action) {
        case 'view-appointment':
          // Abrir overlay de detalle de la cita - encontrar la columna correspondiente
          const column = dayColumnsState.find((col) =>
            col.events.some((e) => e.id === event.id)
          )
          if (column) {
            setActive({ event, column })
          }
          break

        case 'new-appointment':
          // Abrir modal de nueva cita con datos pre-rellenados del paciente
          openCreateAppointmentModal({
            paciente: detail?.patientFull || ''
          })
          break

        case 'new-budget':
          // Abrir modal de ficha del paciente en tab Finanzas con creación abierta
          setPatientRecordConfig({
            open: true,
            initialTab: 'Finanzas',
            openBudgetCreation: true,
            patientId: event.id, // Mock: usando event.id como patientId
            patientName: detail?.patientFull || 'Paciente'
          })
          break

        case 'new-prescription':
          // Abrir modal de ficha del paciente en tab Recetas con creación abierta
          setPatientRecordConfig({
            open: true,
            initialTab: 'Recetas',
            openPrescriptionCreation: true,
            patientId: event.id,
            patientName: detail?.patientFull || 'Paciente'
          })
          break

        case 'report':
          // Abrir modal de ficha del paciente en Historial clínico en modo edición
          setPatientRecordConfig({
            open: true,
            initialTab: 'Historial clínico',
            openClinicalHistoryEdit: true,
            patientId: event.id,
            patientName: detail?.patientFull || 'Paciente'
          })
          break
      }

      setContextMenu(null)
    },
    [contextMenu, dayColumnsState, openCreateAppointmentModal]
  )

  const timeToMinutes = (time: string): number => {
    const [hh = '09', mm = '00'] = time.split(':')
    return Number(hh) * 60 + Number(mm)
  }

  // Obtener appointments para una fecha específica
  // Siempre usa dayColumnsState basándose en el día de la semana para mostrar los mismos datos que la vista semanal
  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return []

    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ...
    const weekdayMapping: Record<number, Weekday | null> = {
      0: null, // Sunday - no hay citas
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: null // Saturday - no hay citas
    }
    const weekday = weekdayMapping[dayOfWeek]

    // Si es un día laboral (lunes-viernes), usar los datos de dayColumnsState
    if (weekday) {
      const dayColumn = dayColumnsState.find((c) => c.id === weekday)
      if (dayColumn && dayColumn.events.length > 0) {
        return mapColumnToDayAppointments(dayColumn, false)
      }
    }

    // Si es fin de semana o no hay eventos, retornar array vacío
    return []
  }

  // Obtener bandas de profesionales para una fecha específica
  // Siempre usa dayColumnsState basándose en el día de la semana
  // Limitado a 2 especialistas como máximo
  const getDayBands = (date: Date | null) => {
    if (!date) return []

    const dayOfWeek = date.getDay()
    const weekdayMapping: Record<number, Weekday | null> = {
      0: null,
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: null
    }
    const weekday = weekdayMapping[dayOfWeek]

    if (weekday) {
      const dayColumn = dayColumnsState.find((c) => c.id === weekday)
      if (dayColumn && dayColumn.events.length > 0) {
        // Extraer profesionales únicos de los eventos del día
        const professionals = new Set<string>()
        dayColumn.events.forEach((ev) => {
          if (ev.detail?.professional) {
            professionals.add(ev.detail.professional)
          }
        })

        // Generar bandas para cada profesional con colores asignados
        const profColors: Record<string, string> = {
          'Laura Sánchez (Higienista)': '#f0fafa',
          'Dr. Antonio Ruiz García': '#fbe9fb',
          'Dr. Francisco Moreno': '#fff4e6',
          'Dra. Elena Navarro Pérez': '#e6f4ff',
          'Dr. Miguel Á. Torres': '#ffe6f0',
          'Dra. Carmen Díaz López': '#e6ffe6'
        }

        // Solo mostrar 2 especialistas como máximo
        return Array.from(professionals)
          .slice(0, 2)
          .map((prof, idx) => ({
            id: `band-${idx}`,
            label: prof,
            background: profColors[prof] || '#f0fafa'
          }))
      }
    }

    // Si es fin de semana, retornar array vacío
    return []
  }

  const mapColumnToDayAppointments = (
    column?: DayColumn,
    useFallback = true
  ) => {
    if (!column || column.events.length === 0) {
      return useFallback ? DAY_VIEW_FALLBACK_APPOINTMENTS : []
    }
    return column.events.map((ev, idx) => {
      const [startRaw, endRaw] = (ev.timeRange ?? '').split('-')
      const start = startRaw?.trim() || '09:00'
      const end = endRaw?.trim() || '09:30'
      const bgColor = ev.backgroundClass?.includes('coral')
        ? 'var(--color-event-coral)'
        : ev.backgroundClass?.includes('brand')
        ? 'var(--color-event-purple)'
        : 'var(--color-event-teal)'

      return {
        id: ev.id ?? `day-${column.id}-${idx}`,
        start,
        end,
        patient: ev.patient,
        title: ev.title,
        box: ev.box,
        bgColor,
        // Pasar el detail completo con notas para la vista diaria
        detail: ev.detail
      }
    })
  }

  // Listen for month -> day navigation
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ date?: string }>
      const isoDate = custom.detail?.date
      if (!isoDate) return
      const target = new Date(isoDate)
      if (Number.isNaN(target.getTime())) return

      // Set week anchored to Monday of target date
      const dayOfWeekNum = target.getDay() // 0 Sunday
      const diff = dayOfWeekNum === 0 ? -6 : 1 - dayOfWeekNum
      const monday = new Date(target)
      monday.setDate(target.getDate() + diff)
      monday.setHours(0, 0, 0, 0)

      setCurrentWeekStart(monday)
      setSelectedDate(target)
      setViewOption('dia')
      setDayPeriod('full')

      // Obtener appointments basándose en el día de la semana (mismos datos que vista semanal)
      const weekdayMap: Record<number, Weekday | null> = {
        0: null,
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: null
      }
      const weekday = weekdayMap[dayOfWeekNum]

      if (weekday) {
        const dayColumn = dayColumnsState.find((c) => c.id === weekday)
        if (dayColumn && dayColumn.events.length > 0) {
          setSelectedDayAppointments(
            mapColumnToDayAppointments(dayColumn, false)
          )
          return
        }
      }

      // Si es fin de semana o no hay datos, mostrar array vacío
      setSelectedDayAppointments([])
    }

    window.addEventListener('agenda:open-day-view', handler)
    return () => window.removeEventListener('agenda:open-day-view', handler)
  }, [dayColumnsState])

  const handleDayAppointmentMove = ({
    id,
    start,
    end,
    box
  }: {
    id: string
    start: string
    end: string
    box: string
  }) => {
    const targetDate =
      selectedDate?.toLocaleDateString('en-CA') ??
      currentWeekStart.toLocaleDateString('en-CA')
    const targetWeekday = getWeekdayFromDate(targetDate)

    const startSlot = getSlotIndexFromTime(start)
    const endSlot = getSlotIndexFromTime(end)
    const durationSlots = Math.max(1, endSlot - startSlot)

    const top = `${startSlot * SLOT_REM}rem`
    const height = `${durationSlots * SLOT_REM}rem`
    const timeRange = `${start} - ${end}`

    setDayColumnsState((prev) => {
      const found = findEventById(prev, id)
      if (!found) return prev

      const targetColumnId = targetWeekday ?? found.originId

      const baseDetail: EventDetail = found.event.detail ?? {
        title: found.event.title,
        date: targetDate,
        patientFull: found.event.patient,
        professional: DEFAULT_PROFESSIONAL,
        locationLabel: LOCATION_LABEL,
        patientLabel: PATIENT_LABEL,
        professionalLabel: PROFESSIONAL_LABEL
      }

      const updatedEvent: AgendaEvent = {
        ...found.event,
        box,
        top,
        height,
        timeRange,
        detail: {
          ...baseDetail,
          date: targetDate,
          duration: `${start} - ${end} (${Math.max(
            MINUTES_STEP,
            timeToMinutes(end) - timeToMinutes(start)
          )} minutos)`
        }
      }

      const cleaned = prev.map((col) => ({
        ...col,
        events: col.events.filter((ev) => ev.id !== id)
      }))

      return cleaned.map((col) =>
        col.id === targetColumnId
          ? { ...col, events: [...col.events, updatedEvent] }
          : col
      )
    })

    setSelectedDayAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, start, end, box } : appt))
    )
  }

  const handleProfessionalToggle = (value: string) => {
    setSelectedProfessionals((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value)
      }
      return [...previous, value]
    })
  }

  const handleBoxToggle = (value: string) => {
    setSelectedBoxes((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value)
      }
      return [...previous, value]
    })
  }

  // Week navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 7)
      return newDate
    })
  }

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 7)
      return newDate
    })
  }

  // Day navigation functions (for daily view)
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const base = prev ?? new Date()
      const newDate = new Date(base)
      newDate.setDate(base.getDate() - 1)
      return newDate
    })
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const base = prev ?? new Date()
      const newDate = new Date(base)
      newDate.setDate(base.getDate() + 1)
      return newDate
    })
  }

  // Generate week range string "13 - 19, oct 2025"
  const getWeekRangeString = () => {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(currentWeekStart.getDate() + 4) // Friday (no weekends)

    const startDay = currentWeekStart.getDate()
    const endDay = endDate.getDate()
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'short' })
    const year = currentWeekStart.getFullYear()

    return `${startDay} - ${endDay}, ${month} ${year}`
  }

  // Month navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // Get month name "Octubre 2025"
  const getMonthString = () => {
    const month = currentMonth.toLocaleString('es-ES', { month: 'long' })
    const year = currentMonth.getFullYear()
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
  }

  // Get day date string "19 oct 2025"
  const getDayString = () => {
    const date = selectedDate ?? new Date()
    const day = date.getDate()
    const month = date.toLocaleString('es-ES', { month: 'short' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const capitalize = (value: string): string =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value

  const formatHeaderLabel = (date: Date): string => {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    const parts = formatter.formatToParts(date)
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
    const day = parts.find((part) => part.type === 'day')?.value ?? ''
    const month = parts.find((part) => part.type === 'month')?.value ?? ''
    const year = parts.find((part) => part.type === 'year')?.value ?? ''

    const formattedMonth = month
      ? `${capitalize(month)}${month.endsWith('.') ? '' : '.'}`
      : ''

    return `${capitalize(weekday)} ${day} ${formattedMonth} ${year}`.trim()
  }

  // Helper to get ISO date string for a weekday
  const getDateForWeekday = (weekdayIndex: number): string => {
    const date = new Date(currentWeekStart)
    date.setDate(currentWeekStart.getDate() + weekdayIndex)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get blocks for the current week and convert to visual format
  const getBlocksForWeekday = (weekdayIndex: number): WeekBlock[] => {
    const dateStr = getDateForWeekday(weekdayIndex)
    const startDate = getDateForWeekday(0) // Monday
    const endDate = getDateForWeekday(4) // Friday
    
    const allBlocks = getBlocksByDateRange(startDate, endDate)
    const blocksForDay = allBlocks.filter(block => block.date === dateStr)
    
    // Convert to visual format with position calculation
    return blocksForDay
      .filter((block) => {
        // Filter by selected boxes
        if (block.box) {
          const boxFilterId = block.box.replace(' ', '-')
          if (!selectedBoxes.includes(boxFilterId)) return false
        }
        return true
      })
      .map((block) => {
        // Calculate position based on time (same logic as events)
        const [startH, startM] = block.startTime.split(':').map(Number)
        const [endH, endM] = block.endTime.split(':').map(Number)
        const startMinutes = startH * 60 + startM
        const endMinutes = endH * 60 + endM
        const durationMinutes = endMinutes - startMinutes
        
        // Calculate slot position (15 min slots, starting at 9:00)
        const START_HOUR = 9
        const MINUTES_STEP = 15
        const SLOT_REM = 2.5
        
        const startSlot = Math.floor((startMinutes - START_HOUR * 60) / MINUTES_STEP)
        const heightSlots = Math.max(1, Math.ceil(durationMinutes / MINUTES_STEP))
        
        const top = `${startSlot * SLOT_REM}rem`
        const height = `${heightSlots * SLOT_REM}rem`
        
        // Calculate left/width based on box layout
        const boxLayout = getBoxLayout(selectedBoxes)
        const boxName = block.box?.toLowerCase() ?? ''
        const layout = boxLayout[boxName]
        
        return {
          id: block.id,
          top,
          height,
          blockType: block.blockType,
          description: block.description,
          box: block.box,
          timeRange: `${block.startTime} - ${block.endTime}`,
          responsibleName: block.responsibleName,
          isRecurring: !!block.recurrence && block.recurrence.type !== 'none',
          left: layout?.left,
          width: layout?.width ? `calc(${layout.width} - 0.5rem)` : undefined
        }
      })
  }

  // Handler for block deletion
  const handleDeleteBlock = useCallback(
    (blockId: string, deleteRecurrence?: boolean) => {
      deleteBlock(blockId, deleteRecurrence)
      setActiveBlockId(null)
    },
    [deleteBlock]
  )

  // Generate header cells with actual dates
  const getHeaderCells = (): typeof HEADER_CELLS => {
    const weekdayIds: Weekday[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday'
    ]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return weekdayIds.map((weekdayId, index) => {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + index)

      // Determine tone based on date comparison
      let tone: 'neutral' | 'primary' | 'brand' = 'primary'
      if (date.getTime() === today.getTime()) {
        tone = 'brand' // Today
      } else if (date < today) {
        tone = 'neutral' // Past
      }

      return {
        ...HEADER_CELLS[index],
        label: formatHeaderLabel(date),
        id: weekdayId,
        tone,
        specialists: SPECIALISTS_BY_WEEKDAY[weekdayId] || []
      }
    })
  }

  const handleHover = (state: EventSelection) => {
    if (isDraggingRef.current) return
    setHovered(state)
  }

  const handleActivate = (state: EventSelection) => {
    if (isDraggingRef.current) return
    if (!state) return
    const isSame = active?.event.id === state.event.id
    setActive(isSame ? null : state)
    setHovered(isSame ? null : state)
  }

  const handleRootClick = () => {
    setActive(null)
    setOpenDropdown(null)
  }

  useEffect(() => {
    const handleExternalOpen = (event: Event) => {
      const detail = (
        event as CustomEvent<Partial<AppointmentFormData> | undefined>
      ).detail
      openCreateAppointmentModal(detail ?? undefined)
    }

    window.addEventListener(
      'agenda:open-create-appointment',
      handleExternalOpen
    )

    return () => {
      window.removeEventListener(
        'agenda:open-create-appointment',
        handleExternalOpen
      )
    }
  }, [openCreateAppointmentModal])

  const handleCreateModalClose = useCallback(() => {
    setIsCreateAppointmentModalOpen(false)
    setAppointmentPrefill(null)
  }, [])

  // Drag/resize state
  type DragState = {
    eventId: string
    originColumnId: Weekday
    type: 'move' | 'resize'
    startClientY: number
    startSlot: number
    startHeightSlots: number
  } | null

  const SLOT_REM = 2.5
  const columnRefs = useRef<Record<Weekday, HTMLDivElement | null>>({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  })
  const [dragState, setDragState] = useState<DragState>(null)
  const dragPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRafRef = useRef<number | null>(null)

  const toSlots = (value: string | undefined): number => {
    const num = value ? parseFloat(value) : 0
    return Number.isFinite(num) ? num / SLOT_REM : 0
  }

  const findEventById = (
    columns: DayColumn[],
    eventId: string
  ): { event: AgendaEvent; originId: Weekday } | null => {
    for (const col of columns) {
      const found = col.events.find((e) => e.id === eventId)
      if (found) return { event: found, originId: col.id }
    }
    return null
  }

  const slotToTime = (slotIndex: number): string => {
    const totalMinutes = START_HOUR * 60 + Math.max(0, slotIndex) * MINUTES_STEP
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const getDateFromWeekday = useCallback(
    (weekday: Weekday): string => {
      const idx = WEEKDAY_ORDER.indexOf(weekday)
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + Math.max(0, idx))
      return date.toLocaleDateString('en-CA')
    },
    [currentWeekStart]
  )

  const handleEventDragStart = (
    type: 'move' | 'resize',
    event: AgendaEvent,
    column: DayColumn,
    clientX: number,
    clientY: number
  ) => {
    // Oculta overlays/hover mientras se inicia el drag para no tapar el evento.
    isDraggingRef.current = true
    setHovered(null)
    setActive(null)
    setDragState({
      eventId: event.id,
      originColumnId: column.id,
      type,
      startClientY: clientY,
      startSlot: toSlots(event.top),
      startHeightSlots: Math.max(1, toSlots(event.height))
    })
  }

  useEffect(() => {
    if (!dragState) return

    const handleMove = (e: MouseEvent) => {
      dragPointerRef.current = { x: e.clientX, y: e.clientY }
      if (dragRafRef.current !== null) return

      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null
        const { x, y } = dragPointerRef.current

        const targetColumnEntry = Object.entries(columnRefs.current).find(
          ([, ref]) => {
            if (!ref) return false
            const rect = ref.getBoundingClientRect()
            return x >= rect.left && x <= rect.right
          }
        )

        const targetColumnId =
          (targetColumnEntry?.[0] as Weekday | undefined) ??
          dragState.originColumnId
        const targetRef = columnRefs.current[targetColumnId]
        if (!targetRef) return
        const rect = targetRef.getBoundingClientRect()
        const slotHeightPx = rect.height / TOTAL_SLOTS
        if (slotHeightPx <= 0) return

        const deltaSlots = (y - dragState.startClientY) / slotHeightPx
        const moveSlot = Math.max(
          0,
          Math.min(
            Math.round(dragState.startSlot + deltaSlots),
            TOTAL_SLOTS - dragState.startHeightSlots
          )
        )
        const resizeHeightSlots = Math.max(
          1,
          Math.min(
            Math.round(dragState.startHeightSlots + deltaSlots),
            TOTAL_SLOTS - dragState.startSlot
          )
        )
        const newSlot =
          dragState.type === 'resize' ? dragState.startSlot : moveSlot
        const newHeightSlots =
          dragState.type === 'resize'
            ? resizeHeightSlots
            : dragState.startHeightSlots

        // Calcular el box objetivo dinámicamente basándose en los boxes seleccionados
        const validBoxes = selectedBoxes
          .filter((id) => BOX_OPTIONS.some((opt) => opt.id === id))
          .sort() // Ordenar para mantener consistencia (box-1, box-2, box-3)
        const numBoxes = validBoxes.length || 1
        const boxWidthPx = rect.width / numBoxes
        const relX = x - rect.left
        const boxIndex = Math.min(
          numBoxes - 1,
          Math.max(0, Math.floor(relX / boxWidthPx))
        )
        const targetBoxId = validBoxes[boxIndex] ?? 'box-1'
        // Convertir 'box-1' a 'Box 1' (formato usado en los eventos)
        const targetBox = targetBoxId.replace('box-', 'Box ')

        const startTime = slotToTime(newSlot)
        const endTime = slotToTime(newSlot + newHeightSlots)
        const durationMinutes = newHeightSlots * MINUTES_STEP
        const targetDate = getDateFromWeekday(targetColumnId)

        setDayColumnsState((prev: DayColumn[]) => {
          const found = findEventById(prev, dragState.eventId)
          if (!found) return prev
          const { event: evt } = found

          const detail: EventDetail = {
            title: evt.detail?.title ?? evt.title,
            date: targetDate,
            duration: `${startTime} - ${endTime} (${durationMinutes} minutos)`,
            patientFull: evt.detail?.patientFull ?? evt.patient,
            patientPhone: evt.detail?.patientPhone ?? DEFAULT_PATIENT_PHONE,
            patientEmail: evt.detail?.patientEmail ?? DEFAULT_PATIENT_EMAIL,
            referredBy: evt.detail?.referredBy ?? DEFAULT_REFERRED_BY,
            professional: evt.detail?.professional ?? DEFAULT_PROFESSIONAL,
            economicAmount:
              evt.detail?.economicAmount ?? DEFAULT_ECONOMIC_AMOUNT,
            economicStatus:
              evt.detail?.economicStatus ?? DEFAULT_ECONOMIC_STATUS,
            notes: evt.detail?.notes ?? evt.patient,
            locationLabel: evt.detail?.locationLabel ?? LOCATION_LABEL,
            patientLabel: evt.detail?.patientLabel ?? PATIENT_LABEL,
            professionalLabel:
              evt.detail?.professionalLabel ?? PROFESSIONAL_LABEL,
            economicLabel: evt.detail?.economicLabel ?? ECONOMIC_LABEL
          }

          const updatedEvent: AgendaEvent = {
            ...evt,
            box: targetBox,
            top: `${newSlot * SLOT_REM}rem`,
            height: `${newHeightSlots * SLOT_REM}rem`,
            timeRange: `${startTime} - ${endTime}`,
            detail
          }

          const cleaned = prev.map((col) => ({
            ...col,
            events: col.events.filter((ev) => ev.id !== dragState.eventId)
          }))

          return cleaned.map((col) =>
            col.id === targetColumnId
              ? { ...col, events: [...col.events, updatedEvent] }
              : col
          )
        })
      })
    }

    const handleUp = () => {
      isDraggingRef.current = false
      setDragState(null)
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current)
        dragRafRef.current = null
      }
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp, { once: true })
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragState, getDateFromWeekday, selectedBoxes])

  const getSlotIndexFromTime = (time: string): number => {
    const [h = '09', m = '00'] = time.split(':')
    const hours = Number(h)
    const minutes = Number(m)
    const clampedHour = Math.max(START_HOUR, Math.min(hours, END_HOUR - 1))
    const slotFromHour = (clampedHour - START_HOUR) * SLOTS_PER_HOUR
    const slotFromMinutes = Math.floor(minutes / MINUTES_STEP)
    return Math.max(
      0,
      Math.min(slotFromHour + slotFromMinutes, TOTAL_SLOTS - 1)
    )
  }

  const getWeekdayFromDate = (dateString: string): Weekday | null => {
    const parsed = new Date(dateString)
    if (Number.isNaN(parsed.getTime())) return null
    // Use actual day of week: 0=Sunday, 1=Monday, ...6=Saturday
    const dayOfWeek = parsed.getDay()
    const mapping: (Weekday | null)[] = [
      null, // Sunday
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      null // Saturday
    ]
    return mapping[dayOfWeek] ?? null
  }

  const formatEndTime = (time: string, durationMinutes = 60): string => {
    const [h = '09', m = '00'] = time.split(':')
    const startMinutes = Number(h) * 60 + Number(m)
    const endMinutes = startMinutes + durationMinutes
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60
    return `${endH.toString().padStart(2, '0')}:${endM
      .toString()
      .padStart(2, '0')}`
  }

  const handleCreateAppointmentSubmit = (data: AppointmentFormData) => {
    const weekday = getWeekdayFromDate(data.fecha)
    if (!weekday) {
      handleCreateModalClose()
      return
    }

    // Calculate duration and end time from form data
    const durationMinutes = parseInt(data.duracion || '30', 10)
    const [startH, startM] = data.hora.split(':').map(Number)
    const endMinutes = startH * 60 + startM + durationMinutes
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`

    const slotIndex = getSlotIndexFromTime(data.hora)
    const topRem = slotIndex * 2.5 // matches --scheduler-slot-height-quarter
    const heightSlots = Math.ceil(durationMinutes / 15) // 15 min per slot
    const heightRem = heightSlots * 2.5
    const eventId = `new-${Date.now()}`

    // Build event title: if there are linked treatments, show them; otherwise use servicio
    const eventTreatments = data.linkedTreatments?.map(t => t.description).join(', ')
    const eventTitle = eventTreatments || data.servicio || 'Nueva cita'
    
    const newEvent: AgendaEvent = {
      id: eventId,
      top: `${topRem}rem`,
      height: `${heightRem}rem`,
      title: eventTitle,
      patient: data.paciente || 'Paciente',
      box: data.box || 'Box 1',
      timeRange: `${data.hora} - ${endTime}`,
      backgroundClass: 'bg-[var(--color-brand-100)]',
      linkedTreatments: data.linkedTreatments,
      detail: {
        title: eventTitle,
        date: data.fecha,
        duration: `${data.hora} - ${endTime} (${durationMinutes} minutos)`,
        patientFull: data.paciente || 'Paciente',
        professional: data.responsable || 'Profesional',
        notes: data.observaciones || 'Sin notas',
        locationLabel: 'Fecha y ubicación',
        patientLabel: 'Paciente',
        professionalLabel: 'Profesional',
        economicLabel: 'Económico'
      }
    }

    // Actualizar el estado local del scheduler
    setDayColumnsState((prev) =>
      prev.map((col) =>
        col.id === weekday ? { ...col, events: [...col.events, newEvent] } : col
      )
    )

    // Sincronizar con el contexto global para que aparezca en el Parte Diario
    // Build reason: if there are linked treatments, show them; otherwise use servicio
    const treatmentDescriptions = data.linkedTreatments?.map(t => t.description).join(', ')
    const reason = treatmentDescriptions || data.servicio || 'Nueva cita'
    
    addAppointment({
      date: data.fecha, // formato ISO: "2026-01-08"
      startTime: data.hora,
      endTime: endTime,
      patientName: data.paciente || 'Paciente',
      patientId: data.pacienteId || undefined,
      patientPhone: '', // No disponible en el formulario actual
      professional: data.responsable || 'Profesional',
      reason: reason,
      status: 'No confirmada',
      box: data.box || 'box 1',
      charge: 'No',
      bgColor: 'var(--color-brand-100)',
      notes: data.observaciones || '',
      linkedTreatments: data.linkedTreatments
    })

    handleCreateModalClose()
  }

  // Handler para crear un bloqueo de agenda
  const handleCreateBlockSubmit = (data: BlockFormData) => {
    // Calculate end time based on duration
    const [startH, startM] = data.hora.split(':').map(Number)
    const durationMinutes = parseInt(data.duracion, 10)
    const endMinutes = startH * 60 + startM + durationMinutes
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`

    // Add the block via context
    addBlock({
      date: data.fecha,
      startTime: data.hora,
      endTime: endTime,
      blockType: data.blockType,
      description: data.observaciones || BLOCK_TYPE_CONFIG[data.blockType].label,
      responsibleName: data.responsable || undefined,
      box: data.box,
      recurrence: data.recurrence.type !== 'none' ? data.recurrence : undefined
    })

    console.log('✅ Bloqueo creado:', {
      fecha: data.fecha,
      hora: `${data.hora} - ${endTime}`,
      tipo: data.blockType,
      box: data.box
    })

    handleCreateModalClose()
  }

  const handleDaySlotSelect = useCallback(
    ({ column, slotIndex }: DaySlotSelection) => {
      const dayOffset = WEEKDAY_ORDER.indexOf(column.id)
      const safeOffset = dayOffset >= 0 ? dayOffset : 0
      const safeSlot = Math.min(Math.max(slotIndex, 0), TOTAL_SLOTS - 1)

      const totalMinutes = START_HOUR * 60 + safeSlot * MINUTES_STEP
      const hour = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const normalizedTime = `${hour.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`

      const slotDate = new Date(currentWeekStart)
      slotDate.setDate(currentWeekStart.getDate() + safeOffset)

      openCreateAppointmentModal({
        fecha: slotDate.toLocaleDateString('en-CA'),
        hora: normalizedTime
      })
    },
    [currentWeekStart, openCreateAppointmentModal]
  )

  // === Quick appointment creation handlers ===
  
  // Handle hover slot change (time indicator)
  const handleHoverSlotChange = useCallback(
    (slotIndex: number | null, columnId: string, boxId: string | null) => {
      if (slotIndex === null) {
        setHoverSlotInfo(null)
      } else {
        setHoverSlotInfo({ slotIndex, columnId, boxId })
      }
    },
    []
  )

  // Handle slot drag start
  const handleSlotDragStart = useCallback(
    (slotIndex: number, columnId: string, boxId: string, clientY: number) => {
      setSlotDragState({
        startSlot: slotIndex,
        currentSlot: slotIndex,
        columnId,
        boxId,
        isDragging: true,
        startY: clientY
      })
    },
    []
  )

  // Handle slot drag move
  const handleSlotDragMove = useCallback((slotIndex: number) => {
    setSlotDragState((prev) => {
      if (!prev) return null
      return { ...prev, currentSlot: slotIndex }
    })
  }, [])

  // Handle slot drag end - opens appointment modal with selected time range
  const handleSlotDragEnd = useCallback(() => {
    if (!slotDragState) return

    const { startSlot, currentSlot, columnId, boxId } = slotDragState
    const { minSlot, slotCount } = getSelectionBounds(startSlot, currentSlot)
    
    // Find the column to get the date
    const column = dayColumnsState.find((col) => col.id === columnId)
    if (!column) {
      setSlotDragState(null)
      return
    }

    // Calculate start time
    const startTime = slotIndexToTime(minSlot, START_HOUR, MINUTES_STEP)
    
    // Calculate duration in minutes
    const durationMinutes = slotCount * MINUTES_STEP

    // Get the date for this column
    const dayOffset = WEEKDAY_ORDER.indexOf(column.id as Weekday)
    const safeOffset = dayOffset >= 0 ? dayOffset : 0
    const slotDate = new Date(currentWeekStart)
    slotDate.setDate(currentWeekStart.getDate() + safeOffset)

    // Open modal with pre-filled data including box
    openCreateAppointmentModal({
      fecha: slotDate.toLocaleDateString('en-CA'),
      hora: startTime,
      duracion: durationMinutes.toString(),
      box: boxId || undefined
    })

    // Clear drag state
    setSlotDragState(null)
    setHoverSlotInfo(null)
  }, [slotDragState, dayColumnsState, currentWeekStart, openCreateAppointmentModal])

  // Window mouseup listener for ending drag
  useEffect(() => {
    if (!slotDragState?.isDragging) return

    const handleMouseUp = () => {
      handleSlotDragEnd()
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [slotDragState?.isDragging, handleSlotDragEnd])

  // Calcula anchos/posiciones de columnas en función del espacio disponible
  const schedulerBaseWidth = '100%'
  const schedulerTimeWidth = '5rem'
  const schedulerContentWidth = `calc(${schedulerBaseWidth} - var(--scheduler-time-width))`
  const schedulerDayWidth = `calc(${schedulerContentWidth} / ${DAYS_COUNT})`
  const getDayLeft = (index: number) =>
    index === 0
      ? 'var(--scheduler-time-width)'
      : `calc(var(--scheduler-time-width) + ${index} * ${schedulerDayWidth})`

  const schedulerStyle: CSSProperties = {
    width: schedulerBaseWidth,
    height: 'calc(100dvh - var(--spacing-topbar))',
    '--scheduler-width': schedulerBaseWidth,
    '--scheduler-height': 'calc(100dvh - var(--spacing-topbar))',
    '--scheduler-time-width': schedulerTimeWidth,
    // Aumenta la altura de cada bloque de 15 minutos para dar más espacio al contenido
    '--scheduler-slot-height-quarter': '2.5rem',
    '--scheduler-box-header-height': '4.5rem',
    '--scheduler-day-header-total':
      'calc(var(--scheduler-day-header-height) + var(--scheduler-box-header-height))',
    '--scheduler-header-width-first': schedulerDayWidth,
    '--scheduler-header-width': schedulerDayWidth,
    '--scheduler-day-width-first': schedulerDayWidth,
    '--scheduler-day-width': schedulerDayWidth,
    '--scheduler-header-left-mon': getDayLeft(0),
    '--scheduler-header-left-tue': getDayLeft(1),
    '--scheduler-header-left-wed': getDayLeft(2),
    '--scheduler-header-left-thu': getDayLeft(3),
    '--scheduler-header-left-fri': getDayLeft(4),
    '--scheduler-day-left-mon': getDayLeft(0),
    '--scheduler-day-left-tue': getDayLeft(1),
    '--scheduler-day-left-wed': getDayLeft(2),
    '--scheduler-day-left-thu': getDayLeft(3),
    '--scheduler-day-left-fri': getDayLeft(4)
  } as CSSProperties

  return (
    <section
      className='relative flex h-full w-full flex-col rounded-tl-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{ ...schedulerStyle, overflow: 'visible' }}
      onClick={handleRootClick}
    >
      {/* Fixed Header - Compartido entre todas las vistas */}
      <header className='relative z-30 flex h-[var(--scheduler-toolbar-height)] w-full shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-neutral-100)] px-3 lg:px-4'>
        {/* Grupo izquierdo: Navegación */}
        <div className='flex items-center gap-3'>
          {/* Segmented control solo para vista diaria */}
          {viewOption === 'dia' && (
            <DayPeriodSegmentedControl
              selected={dayPeriod}
              onSelect={setDayPeriod}
            />
          )}
          {/* Selector de fecha condicional según la vista */}
          {viewOption === 'mes' ? (
            <NavigationControl
              label={getMonthString()}
              widthRem={5.9375}
              onPrevious={goToPreviousMonth}
              onNext={goToNextMonth}
            />
          ) : viewOption === 'dia' ? (
            <NavigationControl
              label={getDayString()}
              widthRem={8}
              onPrevious={goToPreviousDay}
              onNext={goToNextDay}
            />
          ) : (
            <NavigationControl
              label={getWeekRangeString()}
              widthRem={10.0625}
              onPrevious={goToPreviousWeek}
              onNext={goToNextWeek}
            />
          )}
        </div>

        {/* Grupo central: Filtros */}
        <div className='flex items-center gap-2'>
          {/* Filtros de vista */}
          <div className='flex items-center gap-1.5'>
            <div ref={viewDropdownRef} className='relative'>
              <ToolbarChip
                label={currentViewLabel}
                onClick={handleViewChipClick}
                isActive={openDropdown === 'view'}
                icon={
                  <MD3Icon
                    name='KeyboardArrowDownRounded'
                    size='inherit'
                    className='text-[var(--color-neutral-400)]'
                  />
                }
                ariaExpanded={openDropdown === 'view'}
                ariaHaspopup
                ariaControls={viewDropdownId}
              />
              {openDropdown === 'view' ? (
                <ViewDropdown
                  id={viewDropdownId}
                  selected={viewOption}
                  onSelect={handleViewSelect}
                />
              ) : null}
            </div>
            <div ref={professionalDropdownRef} className='relative'>
              <ToolbarChip
                label='Profesional'
                onClick={handleProfessionalChipClick}
                isActive={openDropdown === 'professional'}
                icon={
                  <MD3Icon
                    name='KeyboardArrowDownRounded'
                    size='inherit'
                    className='text-[var(--color-neutral-400)]'
                  />
                }
                ariaExpanded={openDropdown === 'professional'}
                ariaHaspopup
                ariaControls={professionalDropdownId}
              />
              {openDropdown === 'professional' ? (
                <MultiSelectDropdown
                  id={professionalDropdownId}
                  selected={selectedProfessionals}
                  options={PROFESSIONAL_OPTIONS}
                  onToggle={handleProfessionalToggle}
                />
              ) : null}
            </div>
            <div ref={boxDropdownRef} className='relative'>
              <ToolbarChip
                label='Box'
                onClick={handleBoxChipClick}
                isActive={openDropdown === 'box'}
                icon={
                  <MD3Icon
                    name='KeyboardArrowDownRounded'
                    size='inherit'
                    className='text-[var(--color-neutral-400)]'
                  />
                }
                ariaExpanded={openDropdown === 'box'}
                ariaHaspopup
                ariaControls={boxDropdownId}
              />
              {openDropdown === 'box' ? (
                <MultiSelectDropdown
                  id={boxDropdownId}
                  selected={selectedBoxes}
                  options={BOX_OPTIONS}
                  onToggle={handleBoxToggle}
                />
              ) : null}
            </div>
          </div>

          {/* Separador sutil */}
          <div className='h-5 w-px bg-[var(--color-neutral-300)]' />

          {/* Toggle Confirmadas */}
          <button
            type='button'
            aria-pressed={showConfirmedOnly}
            onClick={() => setShowConfirmedOnly((prev) => !prev)}
            className={[
              'inline-flex h-[2.25rem] items-center gap-2 rounded-full border px-3 text-body-sm font-medium transition-all duration-150',
              showConfirmedOnly
                ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]'
                : 'border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-600)] hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            title='Mostrar solo confirmadas'
          >
            <span
              className={[
                'flex h-4 w-4 items-center justify-center rounded-full text-xs transition-colors',
                showConfirmedOnly ? 'bg-[#3B82F6] text-white' : 'bg-[var(--color-neutral-300)]'
              ].join(' ')}
            >
              {showConfirmedOnly && <MD3Icon name='CheckRounded' size={0.75} />}
            </span>
            <span className='hidden xl:inline'>Confirmadas</span>
          </button>

          {/* Separador sutil */}
          <div className='h-5 w-px bg-[var(--color-neutral-300)]' />

          {/* Estados de visita */}
          <div className='hidden 2xl:block'>
            <VisitStatusCountersCompact
              counts={visitStatusCounts}
              activeFilters={activeVisitStatusFilter}
              onFilterChange={(status) => {
                if (status === null) {
                  setActiveVisitStatusFilter(null)
                } else {
                  setActiveVisitStatusFilter([status])
                }
              }}
            />
          </div>
          <div className='2xl:hidden'>
            <VisitStatusDropdown
              counts={visitStatusCounts}
              activeFilters={activeVisitStatusFilter}
              onFilterChange={(status) => {
                if (status === null) {
                  setActiveVisitStatusFilter(null)
                } else {
                  setActiveVisitStatusFilter([status])
                }
              }}
            />
          </div>
        </div>

        {/* Grupo derecho: Acción principal */}
        <button
          onClick={() => openCreateAppointmentModal()}
          className='inline-flex h-[2.5rem] items-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-medium text-brand-900 shadow-sm transition-all duration-150 hover:bg-brand-600 hover:shadow active:scale-[0.98]'
          title='Añadir cita'
        >
          <MD3Icon name='AddRounded' size='sm' />
          <span className='hidden lg:inline'>Añadir cita</span>
        </button>
      </header>

      {/* Contenido condicional según la vista */}
      {viewOption === 'mes' ? (
        /* Vista Mensual */
        <div className='relative flex-1 overflow-hidden bg-[var(--color-neutral-0)]'>
          <MonthCalendar
            currentMonth={currentMonth}
            currentWeekStart={currentWeekStart}
            weekEvents={dayColumnsState.flatMap((col) =>
              col.events.map((ev) => ({
                id: ev.id,
                weekday: col.id as
                  | 'monday'
                  | 'tuesday'
                  | 'wednesday'
                  | 'thursday'
                  | 'friday',
                title: ev.title,
                patient: ev.patient,
                timeRange: ev.timeRange,
                box: ev.box,
                bgColor: ev.backgroundClass?.includes('coral')
                  ? 'var(--color-event-coral)'
                  : ev.backgroundClass?.includes('brand')
                  ? 'var(--color-event-purple)'
                  : 'var(--color-event-teal)'
              }))
            )}
          />
        </div>
      ) : viewOption === 'dia' ? (
        /* Vista Diaria - Con scroll vertical */
        <div className='relative flex-1 overflow-x-visible overflow-y-auto bg-[var(--color-neutral-0)]'>
          <DayCalendar
            period={dayPeriod}
            appointments={selectedDayAppointments}
            currentDate={(selectedDate ?? currentWeekStart).toISOString().split('T')[0]}
            bands={getDayBands(selectedDate ?? currentWeekStart)}
            onAppointmentMove={handleDayAppointmentMove}
            selectedBoxes={selectedBoxes}
            selectedProfessionals={selectedProfessionals}
            onOpenCreateAppointment={(prefill) =>
              openCreateAppointmentModal(prefill)
            }
            showConfirmedOnly={showConfirmedOnly}
          />
        </div>
      ) : (
        /* Vista Semanal */
        <>
          {/* Fixed Header Labels (Days of week) */}
          <HeaderLabels
            cells={getHeaderCells()}
            selectedBoxes={selectedBoxes}
          />

          {/* Scrollable Content Area */}
          <div className='relative flex-1 overflow-y-auto bg-[var(--color-neutral-0)]'>
            <div
              className='relative'
              style={{ height: getContentHeight(TOTAL_SLOTS) }}
            >
              <TimeColumn />

              {dayColumnsState.map((column, index) => (
                <DayGrid
                  key={column.id}
                  column={column}
                  onHover={handleHover}
                  onActivate={handleActivate}
                  activeSelection={active}
                  hoveredId={hovered?.event.id}
                  onSlotSelect={handleDaySlotSelect}
                  columnRef={(el) => {
                    columnRefs.current[column.id] = el
                  }}
                  onEventDragStart={handleEventDragStart}
                  draggingEventId={dragState?.eventId ?? null}
                  onClearSelection={() => {
                    setHovered(null)
                    setActive(null)
                  }}
                  selectedBoxes={selectedBoxes}
                  selectedProfessionals={selectedProfessionals}
                  completedEvents={completedEvents}
                  onToggleComplete={handleToggleComplete}
                  onEventContextMenu={handleEventContextMenu}
                  visitStatusMap={visitStatusMap}
                  visitStatusHistoryMap={visitStatusHistoryMap}
                  onVisitStatusChange={handleVisitStatusChange}
                  confirmedEvents={confirmedEvents}
                  showConfirmedOnly={showConfirmedOnly}
                  // Block-related props
                  blocks={getBlocksForWeekday(index)}
                  activeBlockId={activeBlockId}
                  hoveredBlockId={hoveredBlockId}
                  onBlockHover={setHoveredBlockId}
                  onBlockActivate={setActiveBlockId}
                  onDeleteBlock={handleDeleteBlock}
                  // Quick appointment creation props
                  hoverSlotIndex={
                    hoverSlotInfo?.columnId === column.id
                      ? hoverSlotInfo.slotIndex
                      : null
                  }
                  hoverBoxId={
                    hoverSlotInfo?.columnId === column.id
                      ? hoverSlotInfo.boxId
                      : null
                  }
                  onHoverSlotChange={handleHoverSlotChange}
                  slotDragState={
                    slotDragState?.columnId === column.id ? slotDragState : null
                  }
                  onSlotDragStart={handleSlotDragStart}
                  onSlotDragMove={handleSlotDragMove}
                  onSlotDragEnd={handleSlotDragEnd}
                />
              ))}

              {/* Indicador de hora actual - línea roja horizontal */}
              <CurrentTimeIndicator
                startHour={START_HOUR}
                endHour={END_HOUR}
                timeColumnWidth='var(--scheduler-time-width)'
              />

              {/* Hover overlay - Simplified detail view */}
              {hovered &&
                !active &&
                hovered.event.detail &&
                (() => {
                  const overlayHeight = '21.875rem' // 350px (44px header + 306px body) from Figma
                  const position = getSmartOverlayPosition(
                    hovered.event.top,
                    hovered.column,
                    overlayHeight,
                    hovered.event
                  )
                  // Extraer color de backgroundClass (ej: 'bg-[#fbe9f0]' -> '#fbe9f0')
                  const bgMatch =
                    hovered.event.backgroundClass?.match(/bg-\[([^\]]+)\]/)
                  const headerBgColor = bgMatch
                    ? bgMatch[1]
                    : 'var(--color-brand-100)'
                  return (
                    <div
                      className='pointer-events-none absolute z-10 flex flex-col overflow-hidden rounded-t-[0.5rem] rounded-b-none border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)]'
                      style={{
                        top: position.top,
                        left: position.left,
                        width: 'var(--scheduler-overlay-width)',
                        maxHeight: position.maxHeight,
                        height: overlayHeight
                      }}
                    >
                      {/* Header - Color dinámico según la cita */}
                      <div
                        className='flex items-center justify-between px-[1rem] py-[0.5rem]'
                        style={{ backgroundColor: headerBgColor }}
                      >
                        <p className='font-medium text-[1.125rem] leading-[1.75rem] text-[var(--color-neutral-900)]'>
                          {hovered.event.detail.title}
                        </p>
                        <p className='font-bold text-[1rem] leading-[1.5rem] text-[var(--color-neutral-900)]'>
                          {hovered.event.box}
                        </p>
                      </div>

                      {/* Body: absolute layout to mirror Figma */}
                      <div
                        className='relative bg-[var(--color-neutral-0)]'
                        style={{ height: '19.125rem' }} // 306px
                      >
                        {/* Notas (prioridad) */}
                        <div className='absolute left-[1rem] right-[1rem] top-[1rem] flex flex-col gap-[0.375rem]'>
                          <div className='flex items-center gap-[0.25rem]'>
                            <MD3Icon
                              name='DescriptionRounded'
                              size={1}
                              className='text-[var(--color-neutral-600)]'
                            />
                            <p
                              className='font-normal text-[var(--color-neutral-600)]'
                              style={{
                                fontSize: '0.75rem',
                                lineHeight: '1rem'
                              }}
                            >
                              {hovered.event.detail.notesLabel ?? NOTES_LABEL}
                            </p>
                          </div>
                          <p
                            className='font-normal text-[var(--color-neutral-900)]'
                            style={{
                              fontSize: '0.875rem',
                              lineHeight: '1.25rem'
                            }}
                          >
                            {hovered.event.detail.notes ?? DEFAULT_NOTES}
                          </p>
                        </div>

                        {/* Económico */}
                        {(hovered.event.detail.economicAmount ||
                          hovered.event.detail.economicStatus) && (
                          <div className='absolute left-[1rem] top-[4.75rem] flex flex-col gap-[0.375rem]'>
                            <div className='flex items-center gap-[0.25rem]'>
                              <MD3Icon
                                name='EuroRounded'
                                size={1}
                                className='text-[var(--color-neutral-600)]'
                              />
                              <p
                                className='font-normal text-[var(--color-neutral-600)]'
                                style={{
                                  fontSize: '0.75rem',
                                  lineHeight: '1rem'
                                }}
                              >
                                {hovered.event.detail.economicLabel ??
                                  'Económico'}
                              </p>
                            </div>
                            {hovered.event.detail.economicAmount && (
                              <p
                                className='font-normal text-[var(--color-neutral-900)]'
                                style={{
                                  fontSize: '0.875rem',
                                  lineHeight: '1.25rem'
                                }}
                              >
                                {hovered.event.detail.economicAmount}
                              </p>
                            )}
                            {hovered.event.detail.economicStatus && (
                              <p
                                className='font-normal text-[var(--color-neutral-900)]'
                                style={{
                                  fontSize: '0.875rem',
                                  lineHeight: '1.25rem'
                                }}
                              >
                                {hovered.event.detail.economicStatus}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Profesional */}
                        <div className='absolute left-[1rem] top-[8.75rem] flex items-center gap-[0.25rem]'>
                          <MD3Icon
                            name='MonitorHeartRounded'
                            size={1}
                            className='text-[var(--color-neutral-600)]'
                          />
                          <p
                            className='font-normal text-[var(--color-neutral-600)]'
                            style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
                          >
                            {hovered.event.detail.professionalLabel ??
                              PROFESSIONAL_LABEL}
                          </p>
                        </div>
                        <div
                          className='absolute left-[1rem] top-[10.25rem] flex items-center gap-4'
                          style={{ gap: '1rem' }}
                        >
                          <span
                            className='inline-flex shrink-0 rounded-full bg-[var(--color-neutral-700)]'
                            style={{ width: '2rem', height: '2rem' }} // 32px
                          />
                          <p
                            className='font-normal text-[var(--color-neutral-900)]'
                            style={{
                              fontSize: '0.875rem',
                              lineHeight: '1.25rem'
                            }}
                          >
                            {hovered.event.detail.professional}
                          </p>
                        </div>

                        {/* Paciente */}
                        <div className='absolute left-[1rem] top-[13.75rem] flex items-center gap-[0.25rem]'>
                          <MD3Icon
                            name='AccountCircleRounded'
                            size={1}
                            className='text-[var(--color-neutral-600)]'
                          />
                          <p
                            className='font-normal text-[var(--color-neutral-600)]'
                            style={{ fontSize: '0.75rem', lineHeight: '1rem' }}
                          >
                            {hovered.event.detail.patientLabel ?? PATIENT_LABEL}
                          </p>
                        </div>
                        <p
                          className='absolute left-[1rem] font-normal text-[var(--color-neutral-900)]'
                          style={{
                            top: '15.25rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.25rem'
                          }}
                        >
                          {hovered.event.detail.patientFull}
                        </p>

                        {/* Fecha y ubicación */}
                        <div className='absolute left-[1rem] top-[17.25rem] flex items-center gap-[0.25rem]'>
                          <MD3Icon
                            name='CalendarMonthRounded'
                            size={1}
                            className='text-[var(--color-neutral-600)]'
                          />
                          <p
                            className='font-normal text-[var(--color-neutral-600)]'
                            style={{ fontSize: '0.75rem', lineHeight: '1rem' }} // 12/16px
                          >
                            {hovered.event.detail.locationLabel ??
                              LOCATION_LABEL}
                          </p>
                        </div>
                        <p
                          className='absolute left-[1rem] font-normal text-[var(--color-neutral-900)]'
                          style={{
                            top: '18.75rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.25rem'
                          }} // 14/20px
                        >
                          {hovered.event.detail.date}
                        </p>
                      </div>
                    </div>
                  )
                })()}

              {/* Click overlay - AppointmentDetailOverlay */}
              {overlaySource && activeDetail && overlayPosition ? (
                <AppointmentDetailOverlay
                  detail={activeDetail}
                  box={freshEvent?.box ?? overlaySource.event.box}
                  position={overlayPosition}
                  backgroundClass={
                    freshEvent?.backgroundClass ??
                    overlaySource.event.backgroundClass
                  }
                  onPaymentAction={handlePaymentAction}
                  onViewPatient={handleViewPatient}
                  isConfirmed={
                    confirmedEvents[overlaySource.event.id] ??
                    overlaySource.event.confirmed ??
                    false
                  }
                  onToggleConfirmed={(confirmed) =>
                    handleToggleConfirmed(overlaySource.event.id, confirmed)
                  }
                />
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={handleCreateModalClose}
        initialData={appointmentPrefill ?? undefined}
        onSubmit={handleCreateAppointmentSubmit}
        onSubmitBlock={handleCreateBlockSubmit}
      />

      {/* Register Payment Modal - Quick action from agenda */}
      {showPaymentModal && selectedEventForPayment && (
        <RegisterPaymentModal
          open={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedEventForPayment(null)
          }}
          onSubmit={handleRegisterPayment}
          invoiceId={selectedEventForPayment.id}
          treatment={selectedEventForPayment.treatment}
          amount={selectedEventForPayment.amount}
          paymentInfo={selectedEventForPayment.paymentInfo}
          installmentPlan={selectedEventForPayment.installmentPlan}
        />
      )}

      {/* Patient Record Modal - Quick action "Ver ficha" from agenda */}
      <PatientRecordModal
        open={patientRecordConfig.open}
        onClose={() =>
          setPatientRecordConfig((prev) => ({ ...prev, open: false }))
        }
        initialTab={patientRecordConfig.initialTab}
        openBudgetCreation={patientRecordConfig.openBudgetCreation}
        openPrescriptionCreation={patientRecordConfig.openPrescriptionCreation}
        openClinicalHistoryEdit={patientRecordConfig.openClinicalHistoryEdit}
        patientId={patientRecordConfig.patientId}
        patientName={patientRecordConfig.patientName}
      />

      {/* Context Menu - Right-click actions on appointments */}
      {contextMenu && (
        <AppointmentContextMenu
          position={contextMenu.position}
          eventDetail={contextMenu.event.detail}
          onAction={handleContextMenuAction}
          onClose={handleCloseContextMenu}
          currentVisitStatus={visitStatusMap[contextMenu.event.id] ?? contextMenu.event.visitStatus ?? 'scheduled'}
          onVisitStatusChange={(newStatus) => handleVisitStatusChange(contextMenu.event.id, newStatus)}
          isConfirmed={confirmedEvents[contextMenu.event.id] ?? contextMenu.event.confirmed ?? false}
          onToggleConfirmed={(confirmed) => handleToggleConfirmed(contextMenu.event.id, confirmed)}
        />
      )}
    </section>
  )
}
