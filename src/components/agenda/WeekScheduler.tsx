'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'
import { useAppointments } from '@/context/AppointmentsContext'
import { useConfiguration } from '@/context/ConfigurationContext'
import { useRouter, useSearchParams } from 'next/navigation'
import type {
  CSSProperties,
  ReactElement,
  MouseEvent as ReactMouseEvent
} from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import type {
  AppointmentFormData,
  BlockFormData
} from './modals/CreateAppointmentModal'

import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import RegisterPaymentModal from '@/components/pacientes/modals/patient-record/RegisterPaymentModal'
import type { BlockType } from '@/context/AppointmentsContext'
import { BLOCK_TYPE_CONFIG } from '@/context/AppointmentsContext'
import AgendaBlockCard from './AgendaBlockCard'
import AppointmentContextMenu, {
  type ContextMenuAction
} from './AppointmentContextMenu'
import AppointmentSummaryCard from './AppointmentSummaryCard'
import DayCalendar from './DayCalendar'
import AppointmentDetailOverlay from './modals/AppointmentDetailOverlay'
import AppointmentHoverOverlay from './modals/AppointmentHoverOverlay'
import CreateAppointmentModal from './modals/CreateAppointmentModal'
import MonthCalendar from './MonthCalendar'
import SlotDragSelection, {
  getSelectionBounds,
  type SlotDragState
} from './SlotDragSelection'
import { slotIndexToTime } from './TimeIndicator'
import type {
  AgendaEvent,
  DayColumn,
  EventDetail,
  EventSelection,
  VisitStatus,
  Weekday
} from './types'
import {
  VisitStatusCountersCompact,
  VisitStatusDropdown
} from './VisitStatusCounters'
import VoiceAgentPendingWidget from './VoiceAgentPendingWidget'

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

const JS_DAY_TO_WEEKDAY: Record<number, Weekday | null> = {
  0: null,
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: null
}

const normalizeTimeLabel = (label: string): string => {
  const [hoursPart = '00', minutesPart = '00'] = label.split(':')
  const hours = hoursPart.padStart(2, '0')
  const minutes = minutesPart.padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatDateInAgendaTimezone = (date: Date): string => {
  // Date keys in agenda are day-based identifiers (not absolute instants).
  // Using local date components avoids timezone-shift bugs when comparing YYYY-MM-DD.
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDateLocal = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return new Date(isoDate)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
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

// Box options are primarily provided via ConfigurationContext.
// Keep this as a safety fallback when configuration has not hydrated yet.

const DEFAULT_BOX_OPTIONS = [
  { id: 'box-1', label: 'Box 1' },
  { id: 'box-2', label: 'Box 2' },
  { id: 'box-3', label: 'Box 3' }
]

const BOX_COLUMN_LAYOUT: Record<string, { left: string; width: string }> = {
  'box 1': { left: '2%', width: '46%' },
  'box 2': { left: '52%', width: '46%' }
}

const normalizeBoxLabel = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ')

const extractBoxNumber = (value?: string | null): string | null => {
  if (!value) return null
  const match = value.match(/\b(\d+)\b/)
  return match ? match[1] : null
}

const resolveBoxLayoutKey = (
  value: string | undefined,
  layoutKeys: string[]
): string | null => {
  if (!value || layoutKeys.length === 0) return null
  const normalized = normalizeBoxLabel(value)
  if (layoutKeys.includes(normalized)) return normalized

  const valueNumber = extractBoxNumber(value)
  if (!valueNumber) return null

  const byNumber = layoutKeys.find(
    (key) => extractBoxNumber(key) === valueNumber
  )
  return byNumber || null
}

const toProfessionalOptionId = (name: string): string =>
  `prof-${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`

// Function to calculate dynamic box layout based on selected boxes
const getBoxLayout = (
  selectedBoxes: string[],
  boxOptions: Array<{ id: string; label: string }> = DEFAULT_BOX_OPTIONS
): Record<string, { left: string; width: string }> => {
  const validBoxes = selectedBoxes
    .map((id) => boxOptions.find((opt) => opt.id === id))
    .filter((opt): opt is { id: string; label: string } => Boolean(opt))

  if (validBoxes.length === 0) {
    return BOX_COLUMN_LAYOUT // fallback to default
  }

  const gap = 4 // 4% gap between boxes
  const totalGaps = validBoxes.length - 1
  const availableWidth = 96 - totalGaps * gap // 96% total (2% padding each side)
  const boxWidth = availableWidth / validBoxes.length

  const layout: Record<string, { left: string; width: string }> = {}

  validBoxes.forEach((box, index) => {
    const boxName = normalizeBoxLabel(box.label)
    const left = 2 + index * (boxWidth + gap)
    layout[boxName] = {
      left: `${left}%`,
      width: `${boxWidth}%`
    }
  })

  return layout
}

const OVERLAY_GUTTER = '0.75rem' // 12px - gap between event card and overlay
const AGENDA_TIMEZONE = 'Europe/Madrid'

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
  const getMadridHourMinute = useCallback((value: Date) => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: AGENDA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const [hoursRaw = '00', minutesRaw = '00'] = formatter
      .format(value)
      .split(':')
    return {
      hours: Number(hoursRaw),
      minutes: Number(minutesRaw)
    }
  }, [])

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

  const { hours, minutes } = getMadridHourMinute(currentTime)

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
// AGENDA DEFAULTS (runtime fallbacks only)
// ============================================

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

const INITIAL_DAY_COLUMNS: DayColumn[] = [
  {
    id: 'monday',
    leftVar: '--scheduler-day-left-mon',
    widthVar: '--scheduler-day-width-first',
    events: []
  },
  {
    id: 'tuesday',
    leftVar: '--scheduler-day-left-tue',
    widthVar: '--scheduler-day-width',
    events: []
  },
  {
    id: 'wednesday',
    leftVar: '--scheduler-day-left-wed',
    widthVar: '--scheduler-day-width',
    events: []
  },
  {
    id: 'thursday',
    leftVar: '--scheduler-day-left-thu',
    widthVar: '--scheduler-day-width',
    events: []
  },
  {
    id: 'friday',
    leftVar: '--scheduler-day-left-fri',
    widthVar: '--scheduler-day-width',
    events: []
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
  selectedBoxes,
  boxOptions
}: {
  cells: typeof HEADER_CELLS
  selectedBoxes: string[]
  boxOptions: Array<{ id: string; label: string }>
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

  const visibleBoxes = boxOptions.filter((opt) => selectedBoxes.includes(opt.id))
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
  boxOptions,
  selectedProfessionals,
  activeVisitStatusFilter,
  completedEvents,
  onToggleComplete,
  onEventContextMenu,
  visitStatusMap,
  visitStatusHistoryMap,
  onVisitStatusChange,
  confirmedEvents,
  showConfirmedOnly,
  showAIOnly,
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
  boxOptions: Array<{ id: string; label: string }>
  selectedProfessionals: string[]
  activeVisitStatusFilter?: VisitStatus[] | null
  completedEvents?: Record<string, boolean>
  onToggleComplete?: (eventId: string, completed: boolean) => void
  onEventContextMenu?: (
    e: React.MouseEvent<HTMLElement>,
    event: AgendaEvent
  ) => void
  visitStatusMap?: Record<string, VisitStatus>
  visitStatusHistoryMap?: Record<
    string,
    Array<{ status: VisitStatus; timestamp: Date }>
  >
  onVisitStatusChange?: (eventId: string, newStatus: VisitStatus) => void
  confirmedEvents?: Record<string, boolean>
  showConfirmedOnly?: boolean
  showAIOnly?: boolean // Filter for AI-created appointments
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
  onHoverSlotChange?: (
    slotIndex: number | null,
    columnId: string,
    boxId: string | null
  ) => void
  slotDragState?: SlotDragState | null
  onSlotDragStart?: (
    slotIndex: number,
    columnId: string,
    boxId: string,
    clientY: number
  ) => void
  onSlotDragMove?: (slotIndex: number) => void
  onSlotDragEnd?: () => void
}) {
  // Calculate dynamic box layout based on selected boxes
  const boxLayout = getBoxLayout(selectedBoxes, boxOptions)
  const selectedBoxLabels = new Set(
    boxOptions
      .filter((opt) => selectedBoxes.includes(opt.id))
      .map((opt) => normalizeBoxLabel(opt.label))
  )

  // Filter events to only show those in selected boxes, professionals and active status filters.
  const filteredEvents = column.events.filter((event) => {
    // Filter by box
    const boxName = normalizeBoxLabel(event.box || '')
    const boxMatch =
      selectedBoxLabels.size === 0 ? true : selectedBoxLabels.has(boxName)

    // Filter by professional (if event has professionalId)
    const professionalMatch =
      !event.professionalId ||
      selectedProfessionals.includes(event.professionalId)

    // Filter by confirmed status (if showConfirmedOnly is true)
    const isConfirmed = confirmedEvents?.[event.id] ?? event.confirmed ?? false
    const confirmedMatch = !showConfirmedOnly || isConfirmed

    // Filter by AI-created (if showAIOnly is true)
    const isAICreated = event.createdByVoiceAgent === true
    const aiMatch = !showAIOnly || isAICreated

    // Filter by visit status (if active)
    const currentVisitStatus =
      visitStatusMap?.[event.id] ?? event.visitStatus ?? 'scheduled'
    const visitStatusMatch =
      !activeVisitStatusFilter ||
      activeVisitStatusFilter.includes(currentVisitStatus)

    return (
      boxMatch &&
      professionalMatch &&
      confirmedMatch &&
      aiMatch &&
      visitStatusMatch
    )
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
  const showTimeIndicator =
    hoverSlotIndex !== null &&
    hoverSlotIndex !== undefined &&
    hoverBoxId !== null &&
    !slotDragState?.isDragging &&
    !draggingEventId

  // Show drag selection if dragging in this column
  const showDragSelection =
    slotDragState?.isDragging && slotDragState.columnId === column.id

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
      {showTimeIndicator &&
        hoverSlotIndex !== null &&
        hoverBoxId &&
        (() => {
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
      {showDragSelection &&
        slotDragState &&
        slotDragState.boxId &&
        (() => {
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
            isHovered={
              hoveredBlockId === block.id && activeBlockId !== block.id
            }
            onHover={() => onBlockHover?.(block.id)}
            onLeave={() => onBlockHover?.(null)}
            onActivate={() => onBlockActivate?.(block.id)}
            onEdit={() => onEditBlock?.(block.id)}
            onDelete={(deleteRecurrence) =>
              onDeleteBlock?.(block.id, deleteRecurrence)
            }
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
              visitStatusHistory:
                visitStatusHistoryMap?.[event.id] ?? event.visitStatusHistory
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

export default function WeekScheduler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Configuration context for professionals and boxes
  const {
    professionalOptions,
    boxOptions,
    getAvailableProfessionalsForDate,
    getProfessionalScheduleForDate
  } = useConfiguration()

  // Hook del contexto de citas compartido para sincronización con Parte Diario
  const {
    addAppointment,
    deleteAppointment,
    updateAppointment,
    getAppointmentsByDateRange,
    getBlocksByDateRange,
    getBlockById,
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
  const [inferredProfessionalOptions, setInferredProfessionalOptions] = useState<
    Array<{ id: string; label: string; color: string }>
  >([])

  // Use configuration context for professional and box options
  const effectiveProfessionalOptions = useMemo(
    () => {
      const byId = new Map<string, { id: string; label: string; color: string }>()
      for (const option of professionalOptions) byId.set(option.id, option)
      for (const option of inferredProfessionalOptions) {
        if (!byId.has(option.id)) byId.set(option.id, option)
      }
      return Array.from(byId.values())
    },
    [inferredProfessionalOptions, professionalOptions]
  )
  const effectiveBoxOptions = useMemo(
    () =>
      (boxOptions.length > 0 ? boxOptions : DEFAULT_BOX_OPTIONS).map((opt) => ({
        id: normalizeBoxLabel(opt.label),
        label: opt.label
      })),
    [boxOptions]
  )
  const professionalOptionIds = useMemo(
    () => effectiveProfessionalOptions.map((opt) => opt.id),
    [effectiveProfessionalOptions]
  )
  const boxOptionIds = useMemo(
    () => effectiveBoxOptions.map((opt) => opt.id),
    [effectiveBoxOptions]
  )

  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(
    () => effectiveProfessionalOptions.map((opt) => opt.id) // All professionals selected by default
  )
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>(() =>
    effectiveBoxOptions.map((option) => option.id)
  )
  const [showConfirmedOnly, setShowConfirmedOnly] = useState(false)
  const [showAIOnly, setShowAIOnly] = useState(false) // Filter for AI-created appointments
  const previousProfessionalOptionIdsRef = useRef<string[]>([])
  const initializedDefaultFiltersRef = useRef(false)

  useEffect(() => {
    setSelectedProfessionals((previous) => {
      const previousOptionIds = previousProfessionalOptionIdsRef.current
      const kept = previous.filter((id) => professionalOptionIds.includes(id))
      const hadAllPreviousSelected =
        previousOptionIds.length > 0 &&
        previousOptionIds.every((id) => previous.includes(id))

      let next = kept.length > 0 ? kept : professionalOptionIds
      if (hadAllPreviousSelected) {
        const addedIds = professionalOptionIds.filter(
          (id) => !previousOptionIds.includes(id)
        )
        if (addedIds.length > 0) {
          next = [...kept, ...addedIds]
        }
      }

      if (
        previous.length === next.length &&
        previous.every((id, index) => id === next[index])
      ) {
        return previous
      }
      return next
    })
    previousProfessionalOptionIdsRef.current = professionalOptionIds
  }, [professionalOptionIds])

  useEffect(() => {
    setSelectedBoxes((previous) => {
      const kept = previous.filter((id) => boxOptionIds.includes(id))
      const next = kept.length > 0 ? kept : boxOptionIds
      if (
        previous.length === next.length &&
        previous.every((id, index) => id === next[index])
      ) {
        return previous
      }
      return next
    })
  }, [boxOptionIds])

  // Ensure first render defaults to "all professionals" and "all boxes".
  useEffect(() => {
    if (initializedDefaultFiltersRef.current) return
    if (professionalOptionIds.length === 0 || boxOptionIds.length === 0) return
    setSelectedProfessionals(professionalOptionIds)
    setSelectedBoxes(boxOptionIds)
    initializedDefaultFiltersRef.current = true
  }, [boxOptionIds, professionalOptionIds])

  const resolveBoxLabel = useCallback(
    (value?: string | null): string => {
      if (!value) return effectiveBoxOptions[0]?.label || 'Box 1'
      const key = normalizeBoxLabel(value)
      const matched =
        effectiveBoxOptions.find((opt) => opt.id === key) ||
        effectiveBoxOptions.find((opt) => normalizeBoxLabel(opt.label) === key)
      return matched?.label || value
    },
    [effectiveBoxOptions]
  )

  // Estado para filtro de estado de visita (null = mostrar todos)
  const [activeVisitStatusFilter, setActiveVisitStatusFilter] = useState<
    VisitStatus[] | null
  >(null)

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
      professionalId?: string
      confirmed?: boolean
      createdByVoiceAgent?: boolean
      voiceAgentCallId?: string
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
    initialTab:
      | 'Resumen'
      | 'Información General'
      | 'Historial clínico'
      | 'Imágenes RX'
      | 'Finanzas'
      | 'Documentos'
      | 'Recetas'
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

  // Handle appointmentId from URL to auto-select an appointment (from Voice Agent "Ver cita")
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId')
    if (!appointmentId) return

    // Find the appointment in dayColumnsState
    for (const column of dayColumnsState) {
      const event = column.events.find((e) => e.id === appointmentId)
      if (event) {
        // Activate the appointment to show its overlay
        setActive({ event, column })
        // Clear the URL parameter to prevent re-triggering
        router.replace('/agenda', { scroll: false })
        console.log(`✅ Cita ${appointmentId} encontrada y activada`)
        return
      }
    }

    // Appointment not found - could be on a different week
    console.log(
      `⚠️ Cita ${appointmentId} no encontrada en la vista semanal actual`
    )
  }, [searchParams, dayColumnsState, router])

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

  // Hydrate weekly columns from appointments context (no mock bootstrap)
  useEffect(() => {
    const weekStart = new Date(currentWeekStart)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 4)

    const startIso = formatDateInAgendaTimezone(weekStart)
    const endIso = formatDateInAgendaTimezone(weekEnd)
    const weekAppointments = getAppointmentsByDateRange(startIso, endIso)
    const optionsStart = new Date(weekStart)
    optionsStart.setDate(optionsStart.getDate() - 180)
    const optionsEnd = new Date(weekEnd)
    optionsEnd.setDate(optionsEnd.getDate() + 180)
    const optionsStartIso = formatDateInAgendaTimezone(optionsStart)
    const optionsEndIso = formatDateInAgendaTimezone(optionsEnd)
    const appointmentsForOptions = getAppointmentsByDateRange(
      optionsStartIso,
      optionsEndIso
    )

    const toMinutes = (time: string): number => {
      const [hh = '09', mm = '00'] = time.split(':')
      return Number(hh) * 60 + Number(mm)
    }

    const toSlotIndex = (time: string): number => {
      const mins = toMinutes(time)
      const clamped = Math.max(START_HOUR * 60, Math.min(mins, END_HOUR * 60))
      return Math.floor((clamped - START_HOUR * 60) / MINUTES_STEP)
    }

    const toBackgroundClass = (
      bgColor?: string,
      createdByVoiceAgent?: boolean
    ): string => {
      if (createdByVoiceAgent) return 'bg-[var(--color-event-ai-bg)]'
      if (!bgColor) return 'bg-[var(--color-brand-100)]'
      if (bgColor.includes('coral')) return 'bg-[var(--color-event-coral)]'
      if (bgColor.includes('teal')) return 'bg-[var(--color-event-teal)]'
      if (bgColor.includes('purple')) return 'bg-[var(--color-event-purple)]'
      if (bgColor.includes('ai')) return 'bg-[var(--color-event-ai-bg)]'
      if (bgColor.includes('brand')) return 'bg-[var(--color-brand-100)]'
      return 'bg-[var(--color-brand-100)]'
    }

    const configuredProfessionalByName = new Map(
      professionalOptions.map((opt) => [opt.label.toLowerCase(), opt])
    )
    const inferredByName = new Map<
      string,
      { id: string; label: string; color: string }
    >()
    for (const apt of appointmentsForOptions) {
      const professionalName = (apt.professional || '').trim()
      if (!professionalName) continue
      const key = professionalName.toLowerCase()
      if (configuredProfessionalByName.has(key) || inferredByName.has(key)) continue
      inferredByName.set(key, {
        id: toProfessionalOptionId(professionalName),
        label: professionalName,
        color: 'var(--color-neutral-400)'
      })
    }
    const nextInferredOptions = Array.from(inferredByName.values())
    setInferredProfessionalOptions((previous) => {
      if (
        previous.length === nextInferredOptions.length &&
        previous.every((option, index) => {
          const next = nextInferredOptions[index]
          return (
            option.id === next.id &&
            option.label === next.label &&
            option.color === next.color
          )
        })
      ) {
        return previous
      }
      return nextInferredOptions
    })

    const professionalIdByName = new Map(
      effectiveProfessionalOptions.map((opt) => [opt.label.toLowerCase(), opt.id])
    )
    const fallbackBox = effectiveBoxOptions[0]?.label || 'Box 1'

    const freshColumns: DayColumn[] = INITIAL_DAY_COLUMNS.map((col) => ({
      ...col,
      events: []
    }))

    for (const apt of weekAppointments) {
      const jsDay = new Date(`${apt.date}T00:00:00`).getDay()
      const weekday = JS_DAY_TO_WEEKDAY[jsDay]
      if (!weekday) continue

      const column = freshColumns.find((col) => col.id === weekday)
      if (!column) continue

      const startSlot = toSlotIndex(apt.startTime)
      const durationMinutes = Math.max(
        MINUTES_STEP,
        toMinutes(apt.endTime) - toMinutes(apt.startTime)
      )
      const heightSlots = Math.max(1, Math.ceil(durationMinutes / MINUTES_STEP))

      const linkedLabel = apt.linkedTreatments
        ?.map((t) => t.description)
        .filter(Boolean)
        .join(', ')
      const eventTitle = linkedLabel || apt.reason || 'Consulta'
      const professionalName = (apt.professional || DEFAULT_PROFESSIONAL).trim()
      const professionalNameKey = professionalName.toLowerCase()
      const eventProfessionalId =
        professionalIdByName.get(professionalNameKey) ||
        toProfessionalOptionId(professionalName)
      const eventBoxLabel = resolveBoxLabel(apt.box || fallbackBox)
      const economicStatus =
        apt.paymentInfo && apt.paymentInfo.pendingAmount > 0
          ? 'Pago parcial'
          : apt.charge === 'Si'
          ? 'Pendiente de pago'
          : 'Pagado'
      const economicAmount = apt.paymentInfo
        ? `${apt.paymentInfo.pendingAmount.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} € pendiente`
        : apt.charge === 'Si'
        ? 'Pendiente'
        : '0 €'

      const agendaEvent: AgendaEvent = {
        id: apt.id,
        top: `${startSlot * SLOT_REM}rem`,
        height: `${heightSlots * SLOT_REM}rem`,
        title: eventTitle,
        patient: apt.patientName || 'Paciente',
        box: eventBoxLabel,
        timeRange: `${apt.startTime} - ${apt.endTime}`,
        backgroundClass: toBackgroundClass(apt.bgColor, apt.createdByVoiceAgent),
        detail: {
          title: eventTitle,
          date: apt.date,
          duration: `${apt.startTime} - ${apt.endTime} (${durationMinutes} minutos)`,
          patientFull: apt.patientName || 'Paciente',
          patientPhone: apt.patientPhone || DEFAULT_PATIENT_PHONE,
          professional: professionalName,
          economicAmount,
          economicStatus,
          notes: apt.notes || DEFAULT_NOTES,
          locationLabel: LOCATION_LABEL,
          patientLabel: PATIENT_LABEL,
          professionalLabel: PROFESSIONAL_LABEL,
          economicLabel: ECONOMIC_LABEL,
          notesLabel: NOTES_LABEL,
          patientId: apt.patientId,
          appointmentId: apt.id,
          treatmentDescription: apt.reason,
          paymentInfo: apt.paymentInfo,
          installmentPlan: apt.installmentPlan
        },
        professionalId: eventProfessionalId,
        completed: apt.completed,
        confirmed: apt.confirmed,
        visitStatus: apt.visitStatus,
        visitStatusHistory: apt.visitStatusHistory,
        waitingDuration: apt.waitingDuration,
        consultationDuration: apt.consultationDuration,
        linkedTreatments: apt.linkedTreatments?.map((t) => ({
          id: t.id,
          description: t.description,
          amount: t.amount
        })),
        createdByVoiceAgent: apt.createdByVoiceAgent,
        voiceAgentCallId: apt.voiceAgentCallId,
        voiceAgentData: apt.voiceAgentData
      }

      column.events.push(agendaEvent)
    }

    freshColumns.forEach((col) => {
      col.events.sort((a, b) => {
        const aStart = a.timeRange.split('-')[0]?.trim() || '09:00'
        const bStart = b.timeRange.split('-')[0]?.trim() || '09:00'
        return toMinutes(aStart) - toMinutes(bStart)
      })
    })

    setDayColumnsState(freshColumns)
  }, [
    currentWeekStart,
    effectiveBoxOptions,
    getAppointmentsByDateRange,
    professionalOptions,
    resolveBoxLabel
  ])

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
      const status =
        visitStatusMap[event.id] ?? event.visitStatus ?? 'scheduled'
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
    // Preserve week context when switching to day view.
    if (value === 'dia' && !selectedDate) {
      const weekDates = WEEKDAY_ORDER.map((_, index) => {
        const date = new Date(currentWeekStart)
        date.setDate(currentWeekStart.getDate() + index)
        date.setHours(0, 0, 0, 0)
        return date
      })
      const firstDateWithVisibleAppointments = weekDates.find((date) =>
        getAppointmentsForDate(date).some((apt) => {
          if (selectedProfessionals.length === 0) return true
          if (!apt.professionalId) return true
          return selectedProfessionals.includes(apt.professionalId)
        })
      )
      setSelectedDate(firstDateWithVisibleAppointments ?? currentWeekStart)
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
        `✅ Estado de visita actualizado: ${eventId} → ${newStatus} (${now.toLocaleTimeString(
          'es-ES'
        )})`
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

  const handleEditBlock = useCallback(
    (blockId: string) => {
      const block = getBlockById(blockId)
      if (!block) return

      const [startH = '09', startM = '00'] = block.startTime.split(':')
      const [endH = startH, endM = startM] = block.endTime.split(':')
      const startMinutes = Number(startH) * 60 + Number(startM)
      const endMinutes = Number(endH) * 60 + Number(endM)
      const duration = Math.max(MINUTES_STEP, endMinutes - startMinutes)
      const sourceRef = block.sourcePublicRef || `HOLD-${block.id}`

      openCreateAppointmentModal({
        paciente: block.patientName || '',
        pacienteId: block.patientId || '',
        observaciones: block.description || '',
        fecha: block.date,
        hora: block.startTime,
        duracion: String(duration),
        box: block.box ? resolveBoxLabel(block.box) : undefined,
        sourceHoldId: block.id,
        sourceHoldPublicRef: sourceRef
      })
    },
    [getBlockById, openCreateAppointmentModal, resolveBoxLabel]
  )

  // Handle action=create from URL to open CreateAppointmentModal with pre-filled data (from Voice Agent)
  useEffect(() => {
    const action = searchParams.get('action')
    if (action !== 'create') return

    // Extract pre-fill data from URL parameters
    const paciente = searchParams.get('paciente') || undefined
    const pacientePhone = searchParams.get('pacientePhone') || undefined
    const observaciones = searchParams.get('observaciones') || undefined
    const createdByVoiceAgent =
      searchParams.get('createdByVoiceAgent') === 'true'
    const voiceAgentCallId = searchParams.get('voiceAgentCallId') || undefined

    // Build prefill object - we'll store voiceAgent info for the form submission
    const prefill: Partial<AppointmentFormData> = {
      paciente: paciente || '',
      observaciones: observaciones || ''
    }

    // Open the modal with pre-filled data
    openCreateAppointmentModal(prefill)

    // Store voice agent info in a way that can be used when submitting
    // We'll add these fields to window temporarily to pass to the submit handler
    if (createdByVoiceAgent) {
      ;(window as unknown as Record<string, unknown>).__voiceAgentPrefill = {
        createdByVoiceAgent,
        voiceAgentCallId,
        pacientePhone
      }
    }

    // Clear the URL parameters to prevent re-triggering
    router.replace('/agenda', { scroll: false })
    console.log('✅ Abriendo modal de crear cita desde agente de voz', {
      paciente,
      observaciones
    })
  }, [searchParams, router, openCreateAppointmentModal])

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

        case 'view-voice-call':
          // Navegar al agente de voz con el ID de la llamada para abrir los detalles
          if (event.voiceAgentCallId) {
            router.push(`/agente-voz?callId=${event.voiceAgentCallId}`)
          }
          break
      }

      setContextMenu(null)
    },
    [contextMenu, dayColumnsState, openCreateAppointmentModal, router]
  )

  const timeToMinutes = (time: string): number => {
    const [hh = '09', mm = '00'] = time.split(':')
    return Number(hh) * 60 + Number(mm)
  }

  const mapAppointmentToDayView = useCallback(
    (apt: {
      id: string
      startTime: string
      endTime: string
      patientName: string
      reason: string
      linkedTreatments?: Array<{ description: string }>
      box?: string
      bgColor?: string
      date: string
      patientPhone: string
      professional: string
      notes?: string
      patientId?: string
      confirmed?: boolean
      createdByVoiceAgent?: boolean
      voiceAgentCallId?: string
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
    }) => {
      const linkedLabel = apt.linkedTreatments
        ?.map((t) => t.description)
        .filter(Boolean)
        .join(', ')
      const title = linkedLabel || apt.reason || 'Consulta'
      const bgColor = apt.createdByVoiceAgent
        ? 'var(--color-event-ai-bg)'
        : apt.bgColor?.includes('coral')
        ? 'var(--color-event-coral)'
        : apt.bgColor?.includes('brand') || apt.bgColor?.includes('purple')
        ? 'var(--color-event-purple)'
        : 'var(--color-event-teal)'
      const durationMinutes = Math.max(
        MINUTES_STEP,
        timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime)
      )
      const economicStatus =
        apt.paymentInfo && apt.paymentInfo.pendingAmount > 0
          ? 'Pago parcial'
          : 'Pendiente de pago'
      const economicAmount = apt.paymentInfo
        ? `${apt.paymentInfo.pendingAmount.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} € pendiente`
        : 'Pendiente'
      const professionalName = (apt.professional || DEFAULT_PROFESSIONAL).trim()
      const professionalKey = professionalName.toLowerCase()
      const professionalId =
        effectiveProfessionalOptions.find(
          (option) => option.label.toLowerCase() === professionalKey
        )?.id ?? toProfessionalOptionId(professionalName)

      return {
        id: apt.id,
        start: apt.startTime,
        end: apt.endTime,
        patient: apt.patientName || 'Paciente',
        title,
        box: resolveBoxLabel(apt.box),
        bgColor,
        professionalId,
        confirmed: apt.confirmed,
        createdByVoiceAgent: apt.createdByVoiceAgent,
        voiceAgentCallId: apt.voiceAgentCallId,
        detail: {
          title,
          date: apt.date,
          duration: `${apt.startTime} - ${apt.endTime} (${durationMinutes} minutos)`,
          patientFull: apt.patientName || 'Paciente',
          patientPhone: apt.patientPhone || DEFAULT_PATIENT_PHONE,
          professional: professionalName,
          economicAmount,
          economicStatus,
          notes: apt.notes || DEFAULT_NOTES,
          locationLabel: LOCATION_LABEL,
          patientLabel: PATIENT_LABEL,
          professionalLabel: PROFESSIONAL_LABEL,
          economicLabel: ECONOMIC_LABEL,
          notesLabel: NOTES_LABEL,
          patientId: apt.patientId,
          appointmentId: apt.id,
          treatmentDescription: apt.reason,
          paymentInfo: apt.paymentInfo,
          installmentPlan: apt.installmentPlan
        }
      }
    },
    [effectiveProfessionalOptions, resolveBoxLabel]
  )

  // Obtener appointments para una fecha específica usando fecha absoluta (DB/context).
  const getAppointmentsForDate = useCallback((date: Date | null) => {
    if (!date) return []

    const dateIso = formatDateInAgendaTimezone(date)
    const dayAppointments = getAppointmentsByDateRange(dateIso, dateIso)

    return dayAppointments
      .map((apt) => mapAppointmentToDayView(apt))
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
  }, [getAppointmentsByDateRange, mapAppointmentToDayView])

  // Obtener bandas de profesionales para una fecha específica
  // Basado en citas reales de la fecha y colores de opciones dinámicas.
  const getDayBands = useCallback((date: Date | null) => {
    if (!date) return []

    const dateIso = formatDateInAgendaTimezone(date)
    const dayAppointments = getAppointmentsByDateRange(dateIso, dateIso)
    if (dayAppointments.length === 0) return []

    const optionsByLabel = new Map(
      effectiveProfessionalOptions.map((opt) => [opt.label.toLowerCase(), opt])
    )
    const selectedSet = new Set(selectedProfessionals)
    const uniqueProfessionalNames: string[] = []

    for (const apt of dayAppointments) {
      const professionalName = (apt.professional || '').trim()
      if (!professionalName) continue
      if (uniqueProfessionalNames.includes(professionalName)) continue

      const option =
        optionsByLabel.get(professionalName.toLowerCase()) ||
        ({
          id: toProfessionalOptionId(professionalName),
          label: professionalName,
          color: 'var(--color-neutral-400)'
        } as const)

      if (selectedSet.size > 0 && !selectedSet.has(option.id)) continue
      uniqueProfessionalNames.push(professionalName)
    }

    return uniqueProfessionalNames.slice(0, 2).map((name, idx) => {
      const option = optionsByLabel.get(name.toLowerCase())
      return {
        id: `band-${idx}-${toProfessionalOptionId(name)}`,
        label: name,
        background: option?.color || 'var(--color-neutral-400)'
      }
    })
  }, [
    effectiveProfessionalOptions,
    getAppointmentsByDateRange,
    selectedProfessionals
  ])

  // Sync day view appointments whenever we are in day view or data changes.
  useEffect(() => {
    if (viewOption !== 'dia') return
    const targetDate = selectedDate ?? currentWeekStart
    const appointments = getAppointmentsForDate(targetDate)
    setSelectedDayAppointments(appointments)
  }, [currentWeekStart, getAppointmentsForDate, selectedDate, viewOption])

  // Listen for month -> day navigation
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ date?: string }>
      const isoDate = custom.detail?.date
      if (!isoDate) return
      const target = parseIsoDateLocal(isoDate)
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

      // Load day appointments by absolute date.
      setSelectedDayAppointments(getAppointmentsForDate(target))
    }

    window.addEventListener('agenda:open-day-view', handler)
    return () => window.removeEventListener('agenda:open-day-view', handler)
  }, [getAppointmentsForDate])

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
      (selectedDate && formatDateInAgendaTimezone(selectedDate)) ||
      formatDateInAgendaTimezone(currentWeekStart)
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

    updateAppointment(id, {
      date: targetDate,
      startTime: start,
      endTime: end,
      box
    })
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

  const monthEvents = useMemo(() => {
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    )
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    )

    const startIso = formatDateInAgendaTimezone(monthStart)
    const endIso = formatDateInAgendaTimezone(monthEnd)
    const appointmentsForMonth = getAppointmentsByDateRange(startIso, endIso)

    return appointmentsForMonth.map((apt) => {
      const linkedLabel = apt.linkedTreatments
        ?.map((t) => t.description)
        .filter(Boolean)
        .join(', ')
      const title = linkedLabel || apt.reason || 'Consulta'
      return {
        id: apt.id,
        date: apt.date,
        title,
        patient: apt.patientName || 'Paciente',
        timeRange: `${apt.startTime} - ${apt.endTime}`,
        box: apt.box || 'Box 1',
        bgColor: apt.createdByVoiceAgent
          ? 'var(--color-event-ai-bg)'
          : apt.bgColor || 'var(--color-event-teal)'
      }
    })
  }, [currentMonth, getAppointmentsByDateRange])

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

  const getSpecialistsForDate = useCallback(
    (date: Date): SpecialistAvailability[] => {
      const availableProfessionals = getAvailableProfessionalsForDate(date)
      const visibleProfessionals =
        selectedProfessionals.length > 0
          ? availableProfessionals.filter((professional) =>
              selectedProfessionals.includes(professional.id)
            )
          : availableProfessionals

      return visibleProfessionals.slice(0, 2).map((professional) => {
        const daySchedule = getProfessionalScheduleForDate(professional.id, date)
        const timeRange =
          daySchedule?.isWorking && daySchedule.shifts.length > 0
            ? daySchedule.shifts
                .map((shift) => `${shift.start} - ${shift.end}`)
                .join(', ')
            : ''
        const color =
          effectiveProfessionalOptions.find((opt) => opt.id === professional.id)
            ?.color || 'var(--color-neutral-400)'

        return {
          id: professional.id,
          name: professional.name,
          timeRange,
          color
        }
      })
    },
    [
      effectiveProfessionalOptions,
      getAvailableProfessionalsForDate,
      getProfessionalScheduleForDate,
      selectedProfessionals
    ]
  )

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
    const blocksForDay = allBlocks.filter((block) => block.date === dateStr)

    // Convert to visual format with position calculation
    return blocksForDay
      .filter((block) => {
        // Filter by selected boxes
        if (block.box) {
          const selectedBoxLabels = new Set<string>(
            effectiveBoxOptions
              .filter((opt) => selectedBoxes.includes(opt.id))
              .map((opt) => normalizeBoxLabel(opt.label))
          )
          const selectedBoxNumbers = new Set<string>(
            Array.from(selectedBoxLabels)
              .map((label) => extractBoxNumber(label))
              .filter((value): value is string => Boolean(value))
          )
          const blockBoxLabel = normalizeBoxLabel(block.box)
          const blockBoxNumber = extractBoxNumber(block.box)

          if (
            selectedBoxLabels.size > 0 &&
            !selectedBoxLabels.has(blockBoxLabel) &&
            (!blockBoxNumber || !selectedBoxNumbers.has(blockBoxNumber))
          ) {
            return false
          }
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

        const startSlot = Math.floor(
          (startMinutes - START_HOUR * 60) / MINUTES_STEP
        )
        const heightSlots = Math.max(
          1,
          Math.ceil(durationMinutes / MINUTES_STEP)
        )

        const top = `${startSlot * SLOT_REM}rem`
        const height = `${heightSlots * SLOT_REM}rem`

        // Calculate left/width based on box layout
        const boxLayout = getBoxLayout(selectedBoxes, effectiveBoxOptions)
        const layoutKeys = Object.keys(boxLayout)
        const layoutKey =
          resolveBoxLayoutKey(block.box, layoutKeys) || layoutKeys[0] || null
        const layout = layoutKey ? boxLayout[layoutKey] : undefined

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
        specialists: getSpecialistsForDate(date)
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
  const dragPersistRef = useRef<{
    eventId: string
    date: string
    startTime: string
    endTime: string
    box: string
  } | null>(null)

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
      return formatDateInAgendaTimezone(date)
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
    dragPersistRef.current = null
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
        const validBoxes = effectiveBoxOptions.filter((opt) =>
          selectedBoxes.includes(opt.id)
        )
        const numBoxes = validBoxes.length || 1
        const boxWidthPx = rect.width / numBoxes
        const relX = x - rect.left
        const boxIndex = Math.min(
          numBoxes - 1,
          Math.max(0, Math.floor(relX / boxWidthPx))
        )
        const targetBox =
          validBoxes[boxIndex]?.label || effectiveBoxOptions[0]?.label || 'Box 1'

        const startTime = slotToTime(newSlot)
        const endTime = slotToTime(newSlot + newHeightSlots)
        const durationMinutes = newHeightSlots * MINUTES_STEP
        const targetDate = getDateFromWeekday(targetColumnId)
        dragPersistRef.current = {
          eventId: dragState.eventId,
          date: targetDate,
          startTime,
          endTime,
          box: normalizeBoxLabel(targetBox)
        }

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
      const pendingPersist = dragPersistRef.current
      if (pendingPersist) {
        updateAppointment(pendingPersist.eventId, {
          date: pendingPersist.date,
          startTime: pendingPersist.startTime,
          endTime: pendingPersist.endTime,
          box: pendingPersist.box
        })
      }
      dragPersistRef.current = null
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
  }, [
    dragState,
    effectiveBoxOptions,
    getDateFromWeekday,
    selectedBoxes,
    updateAppointment
  ])

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
    const endTime = `${endH.toString().padStart(2, '0')}:${endM
      .toString()
      .padStart(2, '0')}`

    const slotIndex = getSlotIndexFromTime(data.hora)
    const topRem = slotIndex * 2.5 // matches --scheduler-slot-height-quarter
    const heightSlots = Math.ceil(durationMinutes / 15) // 15 min per slot
    const heightRem = heightSlots * 2.5
    const eventId = `new-${Date.now()}`

    // Build event title: if there are linked treatments, show them; otherwise use servicio
    const eventTreatments = data.linkedTreatments
      ?.map((t) => t.description)
      .join(', ')
    const eventTitle = eventTreatments || data.servicio || 'Nueva cita'
    const eventBoxLabel = resolveBoxLabel(data.box)

    // Check for voice agent prefill data from URL navigation
    const voiceAgentPrefill = (window as unknown as Record<string, unknown>)
      .__voiceAgentPrefill as
      | {
          createdByVoiceAgent?: boolean
          voiceAgentCallId?: string
          pacientePhone?: string
        }
      | undefined

    // Clean up the temporary storage
    if (voiceAgentPrefill) {
      delete (window as unknown as Record<string, unknown>).__voiceAgentPrefill
    }

    const newEvent: AgendaEvent = {
      id: eventId,
      top: `${topRem}rem`,
      height: `${heightRem}rem`,
      title: eventTitle,
      patient: data.paciente || 'Paciente',
      box: eventBoxLabel,
      timeRange: `${data.hora} - ${endTime}`,
      backgroundClass: voiceAgentPrefill?.createdByVoiceAgent
        ? 'bg-[var(--color-event-ai-bg)]'
        : 'bg-[var(--color-brand-100)]',
      linkedTreatments: data.linkedTreatments,
      // Voice agent fields
      createdByVoiceAgent: voiceAgentPrefill?.createdByVoiceAgent,
      voiceAgentCallId: voiceAgentPrefill?.voiceAgentCallId,
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
    const treatmentDescriptions = data.linkedTreatments
      ?.map((t) => t.description)
      .join(', ')
    const reason = treatmentDescriptions || data.servicio || 'Nueva cita'
    const sourceHoldRef = data.sourceHoldPublicRef?.trim()
    const mergedNotes = [data.observaciones?.trim(), sourceHoldRef ? `Origen: ${sourceHoldRef}` : null]
      .filter((value): value is string => Boolean(value))
      .join('\n')

    addAppointment({
      date: data.fecha, // formato ISO: "2026-01-08"
      startTime: data.hora,
      endTime: endTime,
      patientName: data.paciente || 'Paciente',
      patientId: data.pacienteId || undefined,
      patientPhone: voiceAgentPrefill?.pacientePhone || '', // From voice agent or empty
      professional: data.responsable || 'Profesional',
      reason: reason,
      status: voiceAgentPrefill?.createdByVoiceAgent
        ? 'Pendiente IA'
        : 'No confirmada',
      box: normalizeBoxLabel(eventBoxLabel),
      charge: 'No',
      bgColor: voiceAgentPrefill?.createdByVoiceAgent
        ? 'var(--color-event-ai-bg)'
        : 'var(--color-brand-100)',
      notes: mergedNotes,
      linkedTreatments: data.linkedTreatments?.map((t) => ({
        ...t,
        status: 'pending' as const
      })),
      // Voice agent fields
      createdByVoiceAgent: voiceAgentPrefill?.createdByVoiceAgent,
      voiceAgentCallId: voiceAgentPrefill?.voiceAgentCallId,
      sourceHoldId: data.sourceHoldId || undefined,
      sourceHoldPublicRef: sourceHoldRef || undefined
    })

    if (data.sourceHoldId) {
      deleteBlock(data.sourceHoldId, false)
    }

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
    const endTime = `${endH.toString().padStart(2, '0')}:${endM
      .toString()
      .padStart(2, '0')}`

    // Add the block via context
    addBlock({
      date: data.fecha,
      startTime: data.hora,
      endTime: endTime,
      blockType: data.blockType,
      description:
        data.observaciones || BLOCK_TYPE_CONFIG[data.blockType].label,
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
        fecha: formatDateInAgendaTimezone(slotDate),
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
      // If there's an active overlay (appointment details), only close it
      // Don't start drag selection to create a new appointment
      if (active) {
        setActive(null)
        setHovered(null)
        return
      }

      setSlotDragState({
        startSlot: slotIndex,
        currentSlot: slotIndex,
        columnId,
        boxId,
        isDragging: true,
        startY: clientY
      })
    },
    [active]
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
      fecha: formatDateInAgendaTimezone(slotDate),
      hora: startTime,
      duracion: durationMinutes.toString(),
      box: boxId || undefined
    })

    // Clear drag state
    setSlotDragState(null)
    setHoverSlotInfo(null)
  }, [
    slotDragState,
    dayColumnsState,
    currentWeekStart,
    openCreateAppointmentModal
  ])

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
                  options={effectiveProfessionalOptions}
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
                  options={effectiveBoxOptions}
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
                showConfirmedOnly
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[var(--color-neutral-300)]'
              ].join(' ')}
            >
              {showConfirmedOnly && <MD3Icon name='CheckRounded' size={0.75} />}
            </span>
            <span className='hidden xl:inline'>Confirmadas</span>
          </button>

          {/* Toggle IA (AI-created appointments) */}
          <button
            type='button'
            aria-pressed={showAIOnly}
            onClick={() => setShowAIOnly((prev) => !prev)}
            className={[
              'inline-flex h-[2.25rem] items-center gap-2 rounded-full border px-3 text-body-sm font-medium transition-all duration-150',
              showAIOnly
                ? 'border-[#EC4899] bg-[#FDF2F8] text-[#BE185D]'
                : 'border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-600)] hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            title='Mostrar solo citas creadas por IA'
          >
            <span
              className={[
                'flex h-4 w-4 items-center justify-center rounded-full text-xs transition-colors',
                showAIOnly
                  ? 'bg-[#EC4899] text-white'
                  : 'bg-[var(--color-neutral-300)]'
              ].join(' ')}
            >
              {showAIOnly ? (
                <span className='material-symbols-rounded text-xs'>
                  smart_toy
                </span>
              ) : null}
            </span>
            <span className='hidden xl:inline'>IA</span>
          </button>

          {/* Voice Agent Pending Calls Widget */}
          <VoiceAgentPendingWidget />

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
            monthEvents={monthEvents}
            disableMockFallback
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
            currentDate={
              formatDateInAgendaTimezone(selectedDate ?? currentWeekStart)
            }
            bands={getDayBands(selectedDate ?? currentWeekStart)}
            onAppointmentMove={handleDayAppointmentMove}
            selectedBoxes={selectedBoxes}
            selectedProfessionals={selectedProfessionals}
            onOpenCreateAppointment={(prefill) =>
              openCreateAppointmentModal(prefill)
            }
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
            showConfirmedOnly={showConfirmedOnly}
            showAIOnly={showAIOnly}
          />
        </div>
      ) : (
        /* Vista Semanal */
        <>
          {/* Fixed Header Labels (Days of week) */}
          <HeaderLabels
            cells={getHeaderCells()}
            selectedBoxes={selectedBoxes}
            boxOptions={effectiveBoxOptions}
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
                  boxOptions={effectiveBoxOptions}
                  selectedProfessionals={selectedProfessionals}
                  activeVisitStatusFilter={activeVisitStatusFilter}
                  completedEvents={completedEvents}
                  onToggleComplete={handleToggleComplete}
                  onEventContextMenu={handleEventContextMenu}
                  visitStatusMap={visitStatusMap}
                  visitStatusHistoryMap={visitStatusHistoryMap}
                  onVisitStatusChange={handleVisitStatusChange}
                  confirmedEvents={confirmedEvents}
                  showConfirmedOnly={showConfirmedOnly}
                  showAIOnly={showAIOnly}
                  // Block-related props
                  blocks={getBlocksForWeekday(index)}
                  activeBlockId={activeBlockId}
                  hoveredBlockId={hoveredBlockId}
                  onBlockHover={setHoveredBlockId}
                  onBlockActivate={setActiveBlockId}
                  onEditBlock={handleEditBlock}
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
                  const overlayHeight = 'auto'
                  const position = getSmartOverlayPosition(
                    hovered.event.top,
                    hovered.column,
                    overlayHeight,
                    hovered.event
                  )
                  return (
                    <AppointmentHoverOverlay
                      detail={hovered.event.detail}
                      box={hovered.event.box}
                      position={position}
                      backgroundClass={hovered.event.backgroundClass}
                      createdByVoiceAgent={hovered.event.createdByVoiceAgent}
                    />
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
                  // Voice agent props
                  createdByVoiceAgent={
                    freshEvent?.createdByVoiceAgent ??
                    overlaySource.event.createdByVoiceAgent
                  }
                  voiceAgentCallId={
                    freshEvent?.voiceAgentCallId ??
                    overlaySource.event.voiceAgentCallId
                  }
                  voiceAgentData={
                    freshEvent?.voiceAgentData ??
                    overlaySource.event.voiceAgentData
                  }
                  onViewVoiceCall={(callId) => {
                    router.push(`/agente-voz?callId=${callId}`)
                  }}
                  onClose={() => setActive(null)}
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
          currentVisitStatus={
            visitStatusMap[contextMenu.event.id] ??
            contextMenu.event.visitStatus ??
            'scheduled'
          }
          onVisitStatusChange={(newStatus) =>
            handleVisitStatusChange(contextMenu.event.id, newStatus)
          }
          isConfirmed={
            confirmedEvents[contextMenu.event.id] ??
            contextMenu.event.confirmed ??
            false
          }
          onToggleConfirmed={(confirmed) =>
            handleToggleConfirmed(contextMenu.event.id, confirmed)
          }
          createdByVoiceAgent={contextMenu.event.createdByVoiceAgent}
          voiceAgentCallId={contextMenu.event.voiceAgentCallId}
        />
      )}
    </section>
  )
}
