'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRounded from '@mui/icons-material/ArrowForwardIosRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import PrintRounded from '@mui/icons-material/PrintRounded'
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactElement
} from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { useUserRole } from '@/context/role-context'
import AppointmentDetailOverlay from './AppointmentDetailOverlay'
import AppointmentSummaryCard from './AppointmentSummaryCard'
import CreateAppointmentModal from './CreateAppointmentModal'
import DayCalendar from './DayCalendar'
import MonthCalendar from './MonthCalendar'
import ParteDiarioModal from './ParteDiarioModal'
import type {
  AgendaEvent,
  ClinicalNoteDisplay,
  DayColumn,
  EventDetail,
  EventSelection,
  Weekday
} from './types'

// Database types for appointments (from RPC get_appointments_calendar)
type RpcAppointment = {
  id: number
  scheduled_start_time: string
  scheduled_end_time: string | null
  duration_minutes: number
  status: string
  public_ref: string | null
  notes: string | null
  source: string | null
  // Box info
  box_id: string | null
  box_name: string | null
  // Patient info
  patient_id: string
  patient_name: string | null
  patient_phone: string | null
  patient_email: string | null
  patient_lead_source: string | null
  // Service info
  service_id: number | null
  service_name: string | null
  // Staff assignments as JSONB array
  staff_assigned: Array<{ staff_id: string; full_name: string }> | null
  // Clinical notes as JSONB array (includes SOAP data)
  clinical_notes: Array<{
    id: number
    note_type: string
    content: string
    content_json?: { S?: string; O?: string; A?: string; P?: string } | null
    created_at: string
    staff_full_name: string | null
  }> | null
}

// Legacy type kept for holds which don't use RPC yet
type DbAppointment = {
  id: number
  clinic_id: string
  patient_id: string
  box_id: string | null
  service_id: number | null
  scheduled_start_time: string
  scheduled_end_time: string | null
  status: string
  public_ref: string | null
  notes: string | null
  source: string | null
  patients?: { 
    first_name: string
    last_name: string
    phone_number: string | null
    email: string | null
    lead_source: string | null
    // Primary contact info via patient_contacts join
    patient_contacts?: Array<{
      is_primary: boolean
      contacts?: {
        phone_primary: string | null
        email: string | null
      } | null
    }> | null
  } | null
  boxes?: { name_or_number: string } | null
  service_catalog?: { name: string } | null
  appointment_staff?: Array<{ staff_id: string; staff?: { id: string; full_name: string } | null }> | null
  appointment_notes?: Array<{ 
    id: number
    note_type: string
    content: string
    content_json?: { S?: string; O?: string; A?: string; P?: string } | null
    created_at: string
    staff?: { full_name: string } | null
  }> | null
  clinical_notes?: Array<{ 
    id: number
    note_type: string
    content: string
    created_at: string
    staff?: { full_name: string } | null
  }> | null
}

type DbAppointmentHold = {
  id: number
  clinic_id: string
  patient_id: string | null
  box_id: string
  suggested_service_id: number | null
  start_time: string
  end_time: string
  status: string
  public_ref: string | null
  patients?: { first_name: string; last_name: string } | null
  boxes?: { name_or_number: string } | null
  service_catalog?: { name: string } | null
}

type DbBox = {
  id: string
  name_or_number: string
  clinic_id: string
}

type DbStaff = {
  id: string
  full_name: string
}

type HeaderCell = {
  id: Weekday
  label: string
  leftVar: string
  widthVar: string
  tone: 'neutral' | 'primary' | 'brand'
}

const WEEK_RANGE = '13 - 19, oct 2025'

const TIME_LABELS = [
  '9:00',
  '9:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00'
]

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
  },
  {
    id: 'saturday',
    label: '18 Sábado',
    leftVar: '--scheduler-header-left-sat',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'sunday',
    label: '19 Domingo',
    leftVar: '--scheduler-header-left-sun',
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

// These will be populated from database
const DEFAULT_PROFESSIONAL_OPTIONS = [
  { id: 'profesional-1', label: 'Profesional 1' }
]

const DEFAULT_BOX_OPTIONS = [
  { id: 'box-1', label: 'Box 1' }
]

// Color palette for appointments based on service or status
const APPOINTMENT_COLORS: Record<string, string> = {
  confirmed: 'bg-[var(--color-brand-100)]',
  scheduled: 'bg-[rgba(86,145,255,0.2)]',
  hold: 'bg-[#fbf3e9]',
  completed: 'bg-[#e8f5e9]',
  cancelled: 'bg-[#fbe9e9]',
  no_show: 'bg-[#fff3e0]',
  default: 'bg-[#f5f5f5]'
}

// Helper to convert time to slot position (based on 9:00 start, 30min slots)
function timeToSlotPosition(timeStr: string): string {
  const date = new Date(timeStr)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  
  // Calculate slots from 9:00 (each slot is 30 min = 2.875rem height)
  const slotHeight = 2.875 // rem per 30 min slot
  const startHour = 9
  const totalMinutesFrom9 = (hours - startHour) * 60 + minutes
  const slots = totalMinutesFrom9 / 30
  
  // Add base offset (header area)
  const baseOffset = 1.4375 // rem - matches original mock data
  return `${baseOffset + slots * slotHeight}rem`
}

// Helper to calculate event height based on duration
function durationToHeight(startStr: string, endStr: string | null): string {
  if (!endStr) return '2.875rem' // Default 30 min
  
  const start = new Date(startStr)
  const end = new Date(endStr)
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
  
  // Each 30 min = 2.875rem
  const slotHeight = 2.875
  const slots = durationMinutes / 30
  return `${Math.max(2.875, slots * slotHeight)}rem`
}

// Helper to get weekday from date
function getWeekdayFromDate(date: Date): Weekday {
  const days: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

// Helper to format time range
function formatTimeRange(startStr: string, endStr: string | null): string {
  const start = new Date(startStr)
  const startTime = start.toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE
  })
  
  if (!endStr) return startTime
  
  const end = new Date(endStr)
  const endTime = end.toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE
  })
  
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  return `${startTime} - ${endTime} (${durationMinutes} min)`
}

// Helper to format date for display
function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(DEFAULT_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DEFAULT_TIMEZONE
  })
}

const DATE_BY_DAY: Record<Weekday, string> = {
  monday: 'Lunes, 14 de Octubre 2024',
  tuesday: 'Lunes, 14 de Octubre 2024',
  wednesday: 'Lunes, 14 de Octubre 2024',
  thursday: 'Lunes, 14 de Octubre 2024',
  friday: 'Lunes, 14 de Octubre 2024',
  saturday: 'Lunes, 14 de Octubre 2024',
  sunday: 'Lunes, 14 de Octubre 2024'
}

const OVERLAY_GUTTER = '0.5rem' // 8px - gap between event card and overlay
const DEFAULT_PATIENT_FULL = 'Juan Pérez González'
const DEFAULT_PATIENT_PHONE = '+34 666 777 888'
const DEFAULT_PATIENT_EMAIL = 'juan.perez@gmail.com'
const DEFAULT_REFERRED_BY = 'Familiar de Xus'
const DEFAULT_PROFESSIONAL = 'Nombre apellidos'
const DEFAULT_ECONOMIC_AMOUNT = '100 €'
const DEFAULT_ECONOMIC_STATUS = 'Pendiente de pago'
const DEFAULT_NOTES = 'Primera limpieza del paciente'
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

function getOverlayTop(relativeTop: string): string {
  const trimmed = relativeTop.trim()
  if (trimmed.startsWith('calc(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(5, -1).trim()
    return `calc(var(--scheduler-body-offset-y) + ${inner})`
  }
  return `calc(var(--scheduler-body-offset-y) + ${trimmed})`
}

function getOverlayLeft(column: DayColumn): string {
  // Smart positioning: place overlay to the right of the event when possible
  // If event is in the last 4 columns (thu/fri/sat/sun), place overlay to the LEFT
  // This prevents the overlay from appearing too far right or off-screen
  const isRightColumn = ['thursday', 'friday', 'saturday', 'sunday'].includes(
    column.id
  )

  if (isRightColumn) {
    // Place overlay to the LEFT of the column
    // column.left - overlay.width - gutter, but ensure it doesn't go off-screen
    return `max(1rem, calc(var(${column.leftVar}) - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER}))`
  }

  // For left/middle columns (mon/tue/wed), place overlay to the RIGHT
  // column.left + column.width + gutter
  return `calc(var(${column.leftVar}) + var(${column.widthVar}) + ${OVERLAY_GUTTER})`
}

function getSmartOverlayPosition(
  relativeTop: string,
  column: DayColumn,
  overlayHeight: string = 'var(--scheduler-overlay-height)'
) {
  // Calculate base positions
  const baseTop = getOverlayTop(relativeTop)
  const baseLeft = getOverlayLeft(column)

  // Return position with constraint to prevent overflow
  // Using CSS max() and min() functions to clamp the overlay within viewport
  return {
    top: `max(0rem, min(${baseTop}, calc(100vh - ${overlayHeight} - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 1rem)))`,
    left: baseLeft,
    maxHeight: `min(${overlayHeight}, calc(100vh - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 2rem))`
  }
}

const EVENT_DATA: Record<Weekday, AgendaEvent[]> = {
  monday: [
    {
      id: 'mon-1',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    },
    {
      id: 'mon-2',
      top: '6.4375rem', // 103px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[rgba(86,145,255,0.2)]',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    },
    {
      id: 'mon-3',
      top: '11.4375rem', // 183px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[rgba(86,145,255,0.2)]',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    }
  ],
  tuesday: [
    {
      id: 'tue-1',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      borderClass: 'border-2 border-brand-500',
      detail: createDetail('tuesday', 'Limpieza dental', '12:30')
    },
    {
      id: 'tue-2',
      top: 'calc(var(--scheduler-box-top-second) + 1.625rem)', // 26px inside Box 2
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('tuesday', 'Limpieza dental', '12:30')
    },
    {
      id: 'tue-3',
      top: 'calc(var(--scheduler-box-top-second) + 7.625rem)', // 122px inside Box 2
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('tuesday', 'Limpieza dental', '12:30')
    }
  ],
  wednesday: [
    {
      id: 'wed-1',
      top: '17.375rem', // 278px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('wednesday', 'Limpieza dental', '12:30')
    }
  ],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
}

const DAY_COLUMNS: DayColumn[] = [
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
    widthVar: '--scheduler-day-width-first',
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
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.friday
  },
  {
    id: 'saturday',
    leftVar: '--scheduler-day-left-sat',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.saturday
  },
  {
    id: 'sunday',
    leftVar: '--scheduler-day-left-sun',
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.sunday
  }
]


const frameStyle: CSSProperties = {
  width: '100%',
  height: 'calc(100dvh - var(--spacing-topbar))',
  '--scheduler-width': '100%',
  '--scheduler-height': 'calc(100dvh - var(--spacing-topbar))'
} as CSSProperties

// Calcular altura dinámica basada en número de slots de media hora
const getContentHeight = (numSlots: number): string => {
  return `calc(${numSlots} * var(--scheduler-slot-height-half))`
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
        <ArrowBackIosNewRounded fontSize='small' />
      ) : (
        <ArrowForwardIosRounded fontSize='small' />
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
  const iconNode =
    icon ??
    (
      <ArrowForwardIosRounded
        className='text-[var(--color-neutral-400)]'
        fontSize='inherit'
      />
    )

  return (
    <button
      type='button'
      className={[
        'inline-flex h-[var(--nav-chip-height)] items-center gap-[var(--spacing-gapsm)] rounded-full border px-4 text-body-md font-medium transition-colors duration-150',
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
    <div className='flex items-center overflow-hidden rounded-[var(--day-segmented-radius)] border border-[var(--color-border-default)]'>
      {options.map((option, index) => {
        const isActive = option.id === selected
        return (
          <button
            key={option.id}
            type='button'
            className={[
              'flex items-center justify-center px-[var(--day-segmented-padding-x)] py-[var(--day-segmented-padding-y)] text-body-md font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isActive
                ? 'bg-[var(--color-neutral-200)]'
                : 'bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)]',
              index === 1 ? 'border-x border-[var(--color-border-default)]' : ''
            ].join(' ')}
            style={{
              height: 'var(--day-segmented-height)',
              width:
                index === 0
                  ? 'var(--day-segmented-btn1-width)'
                  : index === 1
                  ? 'var(--day-segmented-btn2-width)'
                  : 'var(--day-segmented-btn3-width)'
            }}
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
      className='absolute left-0 top-[calc(100%+0.5rem)] z-20 flex w-[min(9.3125rem,30vw)] flex-col rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
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
      className='absolute left-0 top-[calc(100%+0.5rem)] z-20 flex w-[min(9.3125rem,30vw)] flex-col rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
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
              {isChecked ? (
                <CheckRounded sx={{ fontSize: '1rem' }} />
              ) : null}
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

function HeaderLabels({ cells }: { cells: typeof HEADER_CELLS }) {
  return (
    <div className='relative h-[var(--scheduler-day-header-height)] w-full shrink-0 border-b border-[var(--color-border-default)] bg-[var(--color-neutral-200)]'>
      {cells.map((cell) => (
        <span
          key={cell.id}
          className={[
            'absolute flex h-full items-center justify-center text-body-md font-medium',
            cell.tone === 'neutral'
              ? 'text-[var(--color-neutral-600)]'
              : cell.tone === 'brand'
              ? 'text-[var(--color-brand-500)]'
              : 'text-[var(--color-neutral-900)]'
          ].join(' ')}
          style={{
            left: `var(${cell.leftVar})`,
            width: `var(${cell.widthVar})`
          }}
        >
          {cell.label}
        </span>
      ))}
    </div>
  )
}

function TimeColumn() {
  return (
    <div
      className='absolute left-0 top-0 flex flex-col bg-[var(--color-neutral-100)]'
      style={{
        width: 'var(--scheduler-time-width)',
        height: '100%'
      }}
    >
      {TIME_LABELS.map((time, index) => (
        <div
          key={index}
          className='flex flex-1 items-center justify-center border-b border-r border-[var(--color-border-default)] p-2'
        >
          <p className='text-body-md font-normal text-[var(--color-neutral-600)]'>
            {time}
          </p>
        </div>
      ))}
    </div>
  )
}


function DayGrid({
  column,
  activeSelection,
  hoveredId,
  onHover,
  onActivate
}: {
  column: DayColumn
  activeSelection: EventSelection
  hoveredId?: string | null
  onHover: (selection: EventSelection) => void
  onActivate: (selection: EventSelection) => void
}) {
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

  return (
    <div
      className={`absolute border-r border-[var(--color-border-default)] ${isSunday ? '' : 'bg-[var(--color-neutral-0)]'}`}
      style={{
        left: `var(${column.leftVar})`,
        top: '0',
        width: `var(${column.widthVar})`,
        height: '100%',
        ...sundayStyle
      }}
    >
      {/* Líneas horizontales para cada media hora */}
      <div
        className='absolute inset-0 grid'
        style={{
          gridTemplateRows: `repeat(${TIME_LABELS.length}, var(--scheduler-slot-height-half))`
        }}
      >
        {TIME_LABELS.map((_, index) => (
          <div
            key={index}
            className='border-b border-[var(--color-border-default)]'
          />
        ))}
      </div>

      {/* Eventos */}
      <div className='absolute inset-0'>
        {column.events.map((event) => (
          <AppointmentSummaryCard
            key={event.id}
            event={event}
            onHover={() => onHover({ event, column })}
            onLeave={() => onHover(null)}
            onActivate={() => onActivate({ event, column })}
            isActive={activeSelection?.event.id === event.id}
            isHovered={
              hoveredId === event.id && activeSelection?.event.id !== event.id
            }
          />
        ))}
      </div>
    </div>
  )
}

// Eventos de ejemplo para la vista mensual
const MONTH_EVENTS = [
  { id: 'm1', date: new Date(2024, 9, 7), title: '13:00 Consulta médica', bgColor: 'var(--color-event-purple)' },
  { id: 'm2', date: new Date(2024, 9, 9), title: '13:00 Consulta médica', bgColor: 'var(--color-event-purple)' },
  { id: 'm3', date: new Date(2024, 9, 10), title: '13:00 Consulta médica', bgColor: 'var(--color-event-teal)' },
  { id: 'm4', date: new Date(2024, 9, 13), title: '13:00 Consulta médica', bgColor: 'var(--color-event-teal)' },
  { id: 'm5', date: new Date(2024, 9, 14), title: '13:00 Consulta médica', bgColor: 'var(--color-event-teal)' },
  { id: 'm6', date: new Date(2024, 9, 15), title: '13:00 Consulta médica', bgColor: 'var(--color-event-teal)' },
  { id: 'm7', date: new Date(2024, 9, 17), title: '13:00 Consulta médica', bgColor: 'var(--color-event-purple)' },
  { id: 'm8', date: new Date(2024, 9, 22), title: '13:00 Consulta médica', bgColor: 'var(--color-event-coral)' }
]

export default function WeekScheduler() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { canManageAppointments, canAssignStaff } = useUserRole()
  
  const [hovered, setHovered] = useState<EventSelection>(null)
  const [active, setActive] = useState<EventSelection>(null)
  const [viewOption, setViewOption] = useState<ViewOption>('semana')
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('full')
  const [openDropdown, setOpenDropdown] = useState<
    null | 'view' | 'professional' | 'box'
  >(null)
  const [isParteDiarioModalOpen, setIsParteDiarioModalOpen] = useState(false)
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] = useState(false)
  
  // Data state
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<RpcAppointment[]>([])
  const [holds, setHolds] = useState<DbAppointmentHold[]>([])
  const [boxes, setBoxes] = useState<DbBox[]>([])
  const [staff, setStaff] = useState<DbStaff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0) // Used to trigger re-fetch
  
  // Filter state - populated from real data
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([])
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>([])

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
  
  // Compute week end date
  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart)
    end.setDate(currentWeekStart.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }, [currentWeekStart])
  
  // Fetch clinic and initial data
  useEffect(() => {
    async function init() {
      setIsLoading(true)
      try {
        // Get clinic ID
        const { data: clinics } = await supabase.rpc('get_my_clinics')
        const cId = Array.isArray(clinics) && clinics.length > 0 ? clinics[0] : null
        setClinicId(cId)
        
        if (cId) {
          // Fetch boxes - note: column is 'name_or_number' not 'name'
          const { data: boxData, error: boxError } = await supabase
            .from('boxes')
            .select('id, name_or_number, clinic_id')
            .eq('clinic_id', cId)
          
          if (boxError) {
            console.error('Error fetching boxes:', boxError)
          }
          
          setBoxes(boxData ?? [])
          setSelectedBoxes((boxData ?? []).map(b => b.id))
          
          // Fetch staff using RPC function (bypasses RLS)
          const { data: staffData, error: staffError } = await supabase
            .rpc('get_clinic_staff', { clinic: cId })
          
          if (staffError) {
            console.error('Error fetching staff:', staffError)
          }
          
          // RPC returns array of { id, full_name } directly
          const staffList: DbStaff[] = (staffData ?? []).map((s: { id: string; full_name: string }) => ({
            id: s.id,
            full_name: s.full_name
          }))
          
          setStaff(staffList)
          // Include "unassigned" option in initial selection
          setSelectedProfessionals(['__unassigned__', ...staffList.map(s => s.id)])
        }
      } catch (error) {
        console.error('Error initializing agenda:', error)
      }
      setIsLoading(false)
    }
    void init()
  }, [supabase])
  
  // Fetch appointments when week changes using RPC for optimized query
  useEffect(() => {
    async function fetchAppointments() {
      if (!clinicId) return
      
      // Format dates as YYYY-MM-DD in local timezone (not UTC!) to avoid date shift
      const formatLocalDate = (d: Date) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const startDate = formatLocalDate(currentWeekStart)
      const endDate = formatLocalDate(currentWeekEnd)
      
      // Use optimized RPC function - returns all data in a single call
      const { data: apptData, error: apptError } = await supabase
        .rpc('get_appointments_calendar', {
          p_clinic_id: clinicId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_staff_id: null,  // No server-side filter, we filter in frontend
          p_box_id: null     // No server-side filter, we filter in frontend
        })
      
      if (apptError) {
        console.error('Error fetching appointments:', apptError)
      }
      
      setAppointments((apptData as RpcAppointment[]) ?? [])
      
      // Fetch holds (still using direct query as they're simpler)
      const startIso = currentWeekStart.toISOString()
      const endIso = currentWeekEnd.toISOString()
      
      const { data: holdData } = await supabase
        .from('appointment_holds')
        .select(`
          id, clinic_id, patient_id, box_id, suggested_service_id,
          start_time, end_time, status, public_ref,
          patients (first_name, last_name),
          boxes (name_or_number),
          service_catalog:suggested_service_id (name)
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'held')
        .gte('start_time', startIso)
        .lte('start_time', endIso)
        .order('start_time', { ascending: true })
      
      setHolds((holdData as unknown as DbAppointmentHold[]) ?? [])
    }
    
    void fetchAppointments()
  }, [supabase, clinicId, currentWeekStart, currentWeekEnd, refreshKey])
  
  // Convert appointments to AgendaEvents grouped by day
  const eventsByDay = useMemo((): Record<Weekday, AgendaEvent[]> => {
    const result: Record<Weekday, AgendaEvent[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
    
    // Filter by selected boxes and professionals
    const UNASSIGNED_ID = '__unassigned__'
    const filteredAppointments = appointments.filter(appt => {
      // Box filter
      const boxMatch = !appt.box_id || selectedBoxes.includes(appt.box_id)
      
      // Check if appointment has no staff assigned (RPC returns staff_assigned as array)
      const hasNoStaff = !appt.staff_assigned || appt.staff_assigned.length === 0
      
      // Professional filter logic:
      // - If no professionals selected, show nothing (user unchecked all)
      // - If "unassigned" is selected and appointment has no staff, show it
      // - If a staff member is selected and appointment has that staff, show it
      let professionalMatch = false
      
      if (selectedProfessionals.length === 0) {
        // No filters selected - show nothing
        professionalMatch = false
      } else {
        // Check if "unassigned" filter is selected and appointment has no staff
        if (selectedProfessionals.includes(UNASSIGNED_ID) && hasNoStaff) {
          professionalMatch = true
        }
        // Check if any selected staff member is assigned to this appointment (RPC format)
        if (appt.staff_assigned && appt.staff_assigned.some(
          s => s.staff_id && selectedProfessionals.includes(s.staff_id)
        )) {
          professionalMatch = true
        }
      }
      
      return boxMatch && professionalMatch
    })
    
    // Convert appointments to events (using RPC data structure)
    for (const appt of filteredAppointments) {
      const startDate = new Date(appt.scheduled_start_time)
      const weekday = getWeekdayFromDate(startDate)
      
      // RPC returns patient_name directly
      const patientName = appt.patient_name ?? 'Paciente'
      const serviceName = appt.service_name ?? 'Cita'
      const boxName = appt.box_name ?? 'Sin box'
      const colorClass = APPOINTMENT_COLORS[appt.status] ?? APPOINTMENT_COLORS.default
      
      // Get assigned staff names (RPC format)
      const assignedStaff = appt.staff_assigned
        ?.map(s => s.full_name)
        .filter(Boolean)
        .join(', ') || 'Por asignar'
      
      // Format start and end times
      const startTime = new Date(appt.scheduled_start_time).toLocaleTimeString(DEFAULT_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: DEFAULT_TIMEZONE
      })
      const endTime = appt.scheduled_end_time 
        ? new Date(appt.scheduled_end_time).toLocaleTimeString(DEFAULT_LOCALE, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: DEFAULT_TIMEZONE
          })
        : undefined
      
      // RPC returns patient_lead_source directly
      const leadSource = appt.patient_lead_source ?? undefined
      
      // RPC returns patient_phone and patient_email directly (already resolved from contacts)
      const patientPhone = appt.patient_phone ?? undefined
      const patientEmail = appt.patient_email ?? undefined
      
      // Get clinical notes from RPC (already aggregated)
      const allNotes = appt.clinical_notes ?? []
      
      // Build structured clinical notes for display
      const clinicalNotesStructured: ClinicalNoteDisplay[] = allNotes.map(n => {
        const createdAt = n.created_at 
          ? new Date(n.created_at).toLocaleDateString(DEFAULT_LOCALE, { 
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
              timeZone: DEFAULT_TIMEZONE 
            })
          : undefined
        const createdBy = n.staff_full_name ?? undefined
        
        // Check if it's a SOAP note - either by note_type OR by having content_json with S/O/A/P fields
        const contentJson = n.content_json
        const isSoapNoteType = n.note_type === 'SOAP' || n.note_type === 'soap'
        const hasSoapStructure = contentJson && (contentJson.S || contentJson.O || contentJson.A || contentJson.P)
        
        // If it's a SOAP note type but no content_json, try to parse from content text
        // Format might be "S: xxx O: xxx A: xxx P: xxx"
        let soapData: { S?: string; O?: string; A?: string; P?: string } | null = null
        if (isSoapNoteType) {
          if (hasSoapStructure) {
            soapData = contentJson
          } else if (n.content) {
            // Try to parse SOAP from text content
            const sMatch = n.content.match(/S:\s*([^OAP]+?)(?=\s*[OAP]:|$)/i)
            const oMatch = n.content.match(/O:\s*([^SAP]+?)(?=\s*[SAP]:|$)/i)
            const aMatch = n.content.match(/A:\s*([^SOP]+?)(?=\s*[SOP]:|$)/i)
            const pMatch = n.content.match(/P:\s*(.+?)$/i)
            if (sMatch || oMatch || aMatch || pMatch) {
              soapData = {
                S: sMatch?.[1]?.trim(),
                O: oMatch?.[1]?.trim(),
                A: aMatch?.[1]?.trim(),
                P: pMatch?.[1]?.trim()
              }
            }
          }
        }
        
        if (soapData) {
          return {
            type: 'SOAP',
            content: n.content,
            createdAt,
            createdBy,
            soap: {
              S: soapData.S,
              O: soapData.O,
              A: soapData.A,
              P: soapData.P,
              createdAt,
              createdBy
            }
          }
        }
        
        return {
          type: n.note_type,
          content: n.content,
          createdAt,
          createdBy
        }
      })
      
      // Legacy string format for backward compatibility
      const clinicalNotes = allNotes.length > 0
        ? allNotes.map(n => `[${n.note_type}] ${n.content}`).join('\n')
        : undefined
      
      const event: AgendaEvent = {
        id: `appt-${appt.id}`,
        top: timeToSlotPosition(appt.scheduled_start_time),
        height: durationToHeight(appt.scheduled_start_time, appt.scheduled_end_time),
        title: serviceName,
        patient: patientName,
        box: boxName,
        timeRange: formatTimeRange(appt.scheduled_start_time, appt.scheduled_end_time),
        backgroundClass: colorClass,
        borderClass: appt.status === 'confirmed' ? 'border-2 border-brand-500' : undefined,
        detail: {
          title: `${serviceName} · ${appt.public_ref ?? ''}`,
          date: formatDateForDisplay(appt.scheduled_start_time),
          duration: formatTimeRange(appt.scheduled_start_time, appt.scheduled_end_time),
          startTime,
          endTime,
          patientFull: patientName,
          patientPhone, // From primary contact or patient table
          patientEmail, // From primary contact or patient table
          referredBy: leadSource, // Patient's lead_source as referral
          professional: assignedStaff,
          notes: appt.notes ?? undefined, // Appointment notes field
          clinicalNotes, // Legacy string format
          clinicalNotesStructured: clinicalNotesStructured.length > 0 ? clinicalNotesStructured : undefined,
          locationLabel: 'Fecha y ubicación',
          patientLabel: 'Paciente',
          professionalLabel: 'Profesional',
          economicLabel: 'Económico',
          notesLabel: 'Notas',
          // Add appointment data for action buttons
          appointmentId: appt.id,
          appointmentStatus: appt.status
        }
      }
      
      result[weekday].push(event)
    }
    
    // Convert holds to events
    const filteredHolds = holds.filter(
      hold => selectedBoxes.includes(hold.box_id)
    )
    
    for (const hold of filteredHolds) {
      const startDate = new Date(hold.start_time)
      const weekday = getWeekdayFromDate(startDate)
      
      const patientName = hold.patients
        ? `${hold.patients.first_name} ${hold.patients.last_name}`
        : 'Pendiente confirmar'
      const serviceName = hold.service_catalog?.name ?? 'Reserva'
      const boxName = hold.boxes?.name_or_number ?? 'Sin box'
      
      const event: AgendaEvent = {
        id: `hold-${hold.id}`,
        top: timeToSlotPosition(hold.start_time),
        height: durationToHeight(hold.start_time, hold.end_time),
        title: `${serviceName} (Reserva)`,
        patient: patientName,
        box: boxName,
        timeRange: formatTimeRange(hold.start_time, hold.end_time),
        backgroundClass: APPOINTMENT_COLORS.hold,
        detail: {
          title: `${serviceName} · Reserva · ${hold.public_ref ?? ''}`,
          date: formatDateForDisplay(hold.start_time),
          duration: formatTimeRange(hold.start_time, hold.end_time),
          patientFull: patientName,
          professional: 'Por asignar',
          locationLabel: 'Fecha y ubicación',
          patientLabel: 'Paciente',
          professionalLabel: 'Profesional'
        }
      }
      
      result[weekday].push(event)
    }
    
    return result
  }, [appointments, holds, selectedBoxes, selectedProfessionals])
  
  // Dynamic box options from real data
  const BOX_OPTIONS = useMemo(() => {
    return boxes.map(box => ({ id: box.id, label: box.name_or_number }))
  }, [boxes])
  
  // Dynamic professional options from real data
  // Include a special "unassigned" option for appointments without staff
  const UNASSIGNED_STAFF_ID = '__unassigned__'
  const PROFESSIONAL_OPTIONS = useMemo(() => {
    return [
      { id: UNASSIGNED_STAFF_ID, label: '🚫 Sin asignar' },
      ...staff.map(s => ({ id: s.id, label: s.full_name }))
    ]
  }, [staff])
  
  // Dynamic day columns with real events
  const dayColumns = useMemo((): DayColumn[] => {
    return [
      { id: 'monday', leftVar: '--scheduler-day-left-mon', widthVar: '--scheduler-day-width-first', events: eventsByDay.monday },
      { id: 'tuesday', leftVar: '--scheduler-day-left-tue', widthVar: '--scheduler-day-width', events: eventsByDay.tuesday },
      { id: 'wednesday', leftVar: '--scheduler-day-left-wed', widthVar: '--scheduler-day-width-first', events: eventsByDay.wednesday },
      { id: 'thursday', leftVar: '--scheduler-day-left-thu', widthVar: '--scheduler-day-width', events: eventsByDay.thursday },
      { id: 'friday', leftVar: '--scheduler-day-left-fri', widthVar: '--scheduler-day-width', events: eventsByDay.friday },
      { id: 'saturday', leftVar: '--scheduler-day-left-sat', widthVar: '--scheduler-day-width', events: eventsByDay.saturday },
      { id: 'sunday', leftVar: '--scheduler-day-left-sun', widthVar: '--scheduler-day-width', events: eventsByDay.sunday }
    ]
  }, [eventsByDay])
  
  // Dynamic header cells with current week dates
  // Use explicit Spanish day names to avoid locale inconsistencies
  const SPANISH_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  
  const headerCells = useMemo((): HeaderCell[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return [
      { id: 'monday', leftVar: '--scheduler-header-left-mon', widthVar: '--scheduler-header-width-first' },
      { id: 'tuesday', leftVar: '--scheduler-header-left-tue', widthVar: '--scheduler-header-width' },
      { id: 'wednesday', leftVar: '--scheduler-header-left-wed', widthVar: '--scheduler-header-width' },
      { id: 'thursday', leftVar: '--scheduler-header-left-thu', widthVar: '--scheduler-header-width' },
      { id: 'friday', leftVar: '--scheduler-header-left-fri', widthVar: '--scheduler-header-width' },
      { id: 'saturday', leftVar: '--scheduler-header-left-sat', widthVar: '--scheduler-header-width' },
      { id: 'sunday', leftVar: '--scheduler-header-left-sun', widthVar: '--scheduler-header-width' }
    ].map((cell, index) => {
      // Create date for this day of the week (Monday = index 0, Sunday = index 6)
      const date = new Date(currentWeekStart.getTime())
      date.setDate(currentWeekStart.getDate() + index)
      
      const isToday = date.toDateString() === today.toDateString()
      const dayNum = date.getDate()
      const dayName = SPANISH_DAYS[index]
      
      return {
        ...cell,
        label: `${dayNum} ${dayName}`,
        tone: isToday ? 'brand' : 'primary'
      } as HeaderCell
    })
  }, [currentWeekStart])

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

  // Only show overlay on click (active), not on hover
  const overlaySource = active
  const activeDetail = overlaySource?.event.detail
  const overlayPosition =
    overlaySource && activeDetail
      ? activeDetail.overlayOffsets?.top && activeDetail.overlayOffsets?.left
        ? {
            top: activeDetail.overlayOffsets.top,
            left: activeDetail.overlayOffsets.left
          }
        : getSmartOverlayPosition(overlaySource.event.top, overlaySource.column)
      : null

  const currentViewLabel =
    VIEW_OPTIONS.find((option) => option.id === viewOption)?.label ?? ''

  const handleViewChipClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'view' ? null : 'view'))
  }

  const handleProfessionalChipClick = (
    event: ReactMouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'professional' ? null : 'professional'))
  }

  const handleBoxChipClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'box' ? null : 'box'))
  }

  const handleViewSelect = (value: ViewOption) => {
    setViewOption(value)
    setOpenDropdown(null)
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

  // Generate week range string "13 - 19, oct 2025"
  const getWeekRangeString = () => {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(currentWeekStart.getDate() + 6) // Sunday

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
    const day = currentWeekStart.getDate()
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'short' })
    const year = currentWeekStart.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Use the memoized headerCells instead of recalculating
  const getHeaderCells = () => headerCells

  const handleHover = (state: EventSelection) => {
    setHovered(state)
  }

  const handleActivate = (state: EventSelection) => {
    if (!state) return
    const isSame = active?.event.id === state.event.id
    setActive(isSame ? null : state)
    setHovered(isSame ? null : state)
  }

  const handleRootClick = () => {
    setActive(null)
    setOpenDropdown(null)
  }

  // Action handlers for appointment overlay
  const handleModifyAppointment = useCallback((appointmentId: number) => {
    // For now, show a confirmation and navigate to edit
    // In the future, this could open a modal
    const confirmed = window.confirm('¿Desea modificar esta cita? Se abrirá el formulario de edición.')
    if (confirmed) {
      // TODO: Implement modify appointment modal or navigation
      console.log('Modify appointment:', appointmentId)
      alert('Funcionalidad de modificación en desarrollo. Por favor, use el panel de administración.')
    }
  }, [])

  const handleCancelAppointment = useCallback(async (appointmentId: number) => {
    const confirmed = window.confirm('¿Está seguro de que desea cancelar esta cita?')
    if (confirmed) {
      try {
        // Use RPC function to avoid CORS issues with direct PATCH
        const { data, error } = await supabase
          .rpc('cancel_appointment', { p_appointment_id: appointmentId })
        
        if (error) {
          console.error('Error cancelling appointment:', error)
          alert('Error al cancelar la cita: ' + error.message)
        } else if (data && !data.success) {
          alert('Error al cancelar la cita: ' + (data.error || 'Unknown error'))
        } else {
          // Close overlay and refresh
          setActive(null)
          setRefreshKey(k => k + 1)
        }
      } catch (err) {
        console.error('Error cancelling appointment:', err)
        alert('Error al cancelar la cita')
      }
    }
  }, [supabase])

  const handleAssignStaff = useCallback((appointmentId: number) => {
    // For now, show a message
    // In the future, this could open a staff assignment modal
    console.log('Assign staff to appointment:', appointmentId)
    alert('Funcionalidad de asignación de personal en desarrollo. Por favor, use el panel de administración.')
  }, [])

  return (
    <section
      className='relative flex h-full w-full flex-col rounded-tl-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{ ...frameStyle, overflow: 'visible' }}
      onClick={handleRootClick}
    >
      {/* Fixed Header - Compartido entre todas las vistas */}
      <header className='flex h-[var(--scheduler-toolbar-height)] w-full shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-neutral-100)] px-[var(--scheduler-grid-gutter)]'>
        <div className='flex items-center gap-4'>
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
              widthRem={5.9375} // 95px ÷ 16
              onPrevious={goToPreviousMonth}
              onNext={goToNextMonth}
            />
          ) : viewOption === 'dia' ? (
            <NavigationControl
              label={getDayString()}
              widthRem={10.0625} // Empatado con vista semanal (161px ÷ 16)
              onPrevious={goToPreviousWeek}
              onNext={goToNextWeek}
            />
          ) : (
            <NavigationControl
              label={getWeekRangeString()}
              widthRem={10.0625} // 161px ÷ 16
              onPrevious={goToPreviousWeek}
              onNext={goToNextWeek}
            />
          )}
          <div className='flex items-center gap-3'>
            <div ref={viewDropdownRef} className='relative'>
              <ToolbarChip
                label={currentViewLabel}
                onClick={handleViewChipClick}
                isActive={openDropdown === 'view'}
                icon={
                  <KeyboardArrowDownRounded
                    className='text-[var(--color-neutral-400)]'
                    fontSize='inherit'
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
                  <KeyboardArrowDownRounded
                    className='text-[var(--color-neutral-400)]'
                    fontSize='inherit'
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
            {viewOption !== 'dia' ? (
              <div ref={boxDropdownRef} className='relative'>
                <ToolbarChip
                  label='Box'
                  onClick={handleBoxChipClick}
                  isActive={openDropdown === 'box'}
                  icon={
                    <KeyboardArrowDownRounded
                      className='text-[var(--color-neutral-400)]'
                      fontSize='inherit'
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
            ) : null}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <ToolbarAction
            label='Parte diario'
            icon={
              <DescriptionRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='small'
              />
            }
            onClick={() => setIsParteDiarioModalOpen(true)}
          />
          <ToolbarAction
            label='Imprimir'
            icon={
              <PrintRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='small'
              />
            }
          />
          {/* Only show "Añadir cita" button for roles that can manage appointments (recepcion, gerencia) */}
          {canManageAppointments && (
            <button
              onClick={() => setIsCreateAppointmentModalOpen(true)}
              className='flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 transition-all hover:bg-brand-600 active:scale-95'
            >
              <span className='material-symbols-rounded text-xl text-brand-900'>
                add
              </span>
              <span className='font-medium text-sm text-brand-900'>
                Añadir cita
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Contenido condicional según la vista */}
      {viewOption === 'mes' ? (
        /* Vista Mensual */
        <div className='relative flex-1 overflow-hidden bg-[var(--color-neutral-0)]'>
          <MonthCalendar 
            currentMonth={currentMonth} 
            clinicId={clinicId}
            selectedBoxes={selectedBoxes}
          />
        </div>
      ) : viewOption === 'dia' ? (
        /* Vista Diaria - Con scroll vertical */
        <div className='relative flex-1 overflow-x-visible overflow-y-auto bg-[var(--color-neutral-0)]'>
          <DayCalendar 
            period={dayPeriod} 
            currentDate={currentWeekStart}
            clinicId={clinicId}
            selectedBoxes={selectedBoxes}
            boxes={boxes}
          />
        </div>
      ) : (
        /* Vista Semanal */
        <>
          {/* Fixed Header Labels (Days of week) */}
          <HeaderLabels cells={getHeaderCells()} />

          {/* Scrollable Content Area */}
          <div className='relative flex-1 overflow-y-auto bg-[var(--color-neutral-0)]'>
            {isLoading ? (
              <div className='flex h-full items-center justify-center'>
                <p className='text-body-md text-neutral-500'>Cargando agenda...</p>
              </div>
            ) : (
            <div className='relative' style={{ height: getContentHeight(TIME_LABELS.length) }}>
              <TimeColumn />

          {dayColumns.map((column) => (
            <DayGrid
              key={column.id}
              column={column}
              onHover={handleHover}
              onActivate={handleActivate}
              activeSelection={active}
              hoveredId={hovered?.event.id}
            />
          ))}

          {/* Hover overlay - Simplified detail view */}
          {hovered &&
            !active &&
            hovered.event.detail &&
            (() => {
              const position = getSmartOverlayPosition(
                hovered.event.top,
                hovered.column,
                '14rem'
              )
              return (
                <div
                  className='pointer-events-none absolute z-10 flex flex-col overflow-hidden overflow-y-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)]'
                  style={{
                    top: position.top,
                    left: position.left,
                    width: 'var(--scheduler-overlay-width)',
                    maxHeight: position.maxHeight
                  }}
                >
                  {/* Header */}
                  <div className='flex items-center justify-between bg-[var(--color-brand-100)] px-4 py-2'>
                    <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                      {hovered.event.detail.title}
                    </p>
                    <p className='text-body-md font-bold text-[var(--color-neutral-900)]'>
                      {hovered.event.box}
                    </p>
                  </div>

                  {/* Body */}
                  <div className='flex flex-col gap-4 bg-[var(--color-neutral-0)] px-4 py-4'>
                    {/* Fecha y ubicación */}
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <CalendarMonthRounded
                          className='text-[var(--color-neutral-600)]'
                          sx={{ fontSize: '1rem' }}
                        />
                        <p className='text-label-md font-normal text-[var(--color-neutral-600)]'>
                          Fecha y ubicación
                        </p>
                      </div>
                      <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                        {hovered.event.detail.date}
                      </p>
                    </div>

                    {/* Paciente */}
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <AccountCircleRounded
                          className='text-[var(--color-neutral-600)]'
                          sx={{ fontSize: '1rem' }}
                        />
                        <p className='text-label-md font-normal text-[var(--color-neutral-600)]'>
                          Paciente
                        </p>
                      </div>
                      <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                        {hovered.event.detail.patientFull}
                      </p>
                    </div>

                    {/* Profesional */}
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <MonitorHeartRounded
                          className='text-[var(--color-neutral-600)]'
                          sx={{ fontSize: '1rem' }}
                        />
                        <p className='text-label-md font-normal text-[var(--color-neutral-600)]'>
                          Profesional
                        </p>
                      </div>
                      <div className='flex items-center gap-4'>
                        <span
                          className='inline-flex shrink-0 rounded-full bg-[var(--color-neutral-700)]'
                          style={{
                            width: '2rem',
                            height: '2rem'
                          }}
                        />
                        <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                          {hovered.event.detail.professional}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

              {/* Click overlay - AppointmentDetailOverlay */}
              {overlaySource && activeDetail && overlayPosition ? (
                <AppointmentDetailOverlay
                  detail={activeDetail}
                  box={overlaySource.event.box}
                  position={overlayPosition}
                  canModify={canManageAppointments}
                  canCancel={canManageAppointments}
                  canAssignStaff={canAssignStaff}
                  onModify={handleModifyAppointment}
                  onCancel={handleCancelAppointment}
                  onAssignStaff={handleAssignStaff}
                />
              ) : null}
            </div>
            )}
          </div>
        </>
      )}

      {/* Parte Diario Modal */}
      <ParteDiarioModal
        isOpen={isParteDiarioModalOpen}
        onClose={() => setIsParteDiarioModalOpen(false)}
      />

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={() => setIsCreateAppointmentModalOpen(false)}
        clinicId={clinicId}
        onSubmit={() => {
          setIsCreateAppointmentModalOpen(false)
          // Trigger re-fetch of appointments
          setRefreshKey(k => k + 1)
        }}
      />
    </section>
  )
}
