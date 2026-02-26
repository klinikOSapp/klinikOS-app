'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from 'react'

import { professionalColorStyles, useConfiguration } from '@/context/ConfigurationContext'
import AppointmentDetailOverlay from './modals/AppointmentDetailOverlay'
import AppointmentHoverOverlay from './modals/AppointmentHoverOverlay'
import type { EventDetail } from './types'

const WEEKDAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
]
const OVERLAY_GUTTER = '1rem'

// Positioning functions for smart overlay placement
function getOverlayTop(dayIndex: number, totalWeeks: number): string {
  // Calculate which week this day is in (0-4 typically)
  const weekIndex = Math.floor(dayIndex / 7)
  const weekPercentage = (weekIndex / totalWeeks) * 100

  // Position in the middle of the cell vertically
  return `calc(var(--scheduler-day-header-height) + ${weekPercentage}%)`
}

function getOverlayLeft(dayIndex: number): string {
  // Calculate which column (0-6 for Mon-Sun)
  const dayOfWeek = dayIndex % 7

  // If in the last 3 days of week (Fri, Sat, Sun = 4, 5, 6), place overlay to the LEFT
  const isRightColumn = dayOfWeek >= 4

  if (isRightColumn) {
    // Place overlay to the LEFT
    // Calculate column position as percentage: dayOfWeek / 7 * 100
    const columnPercent = (dayOfWeek / 7) * 100
    return `max(1rem, calc(${columnPercent}% - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER}))`
  }

  // For left/middle columns, place overlay to the RIGHT
  const columnPercent = (dayOfWeek / 7) * 100
  const columnWidth = (1 / 7) * 100 // ~14.28%
  return `calc(${columnPercent}% + ${columnWidth}% + ${OVERLAY_GUTTER})`
}

function getSmartOverlayPosition(
  dayIndex: number,
  totalWeeks: number,
  overlayHeight: string = 'var(--scheduler-overlay-height)'
) {
  const baseTop = getOverlayTop(dayIndex, totalWeeks)
  const baseLeft = getOverlayLeft(dayIndex)

  return {
    top: `max(0rem, min(${baseTop}, calc(100vh - ${overlayHeight} - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 1rem)))`,
    left: baseLeft,
    maxHeight: `min(${overlayHeight}, calc(100vh - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 2rem))`
  }
}

type MonthEvent = {
  id: string
  label: string
  bgColor: string
  detail?: EventDetail
  box?: string
  professional?: string
  professionalId?: string
  confirmed?: boolean
  createdByVoiceAgent?: boolean
}

type SpecialistAvailability = {
  id: string
  name: string
  timeRange: string
  color: string
}

type MonthEventSelection = {
  event: MonthEvent
  dayIndex: number
  date?: Date
} | null

// Helper function to create event details
function createEventDetail(
  title: string,
  box: string,
  patientFullOverride?: string,
  durationOverride?: string
): EventDetail {
  return {
    title,
    date: 'Lunes, 20 de Noviembre 2025',
    duration: durationOverride || '13:00 - 13:30 (30 minutos)',
    patientFull: patientFullOverride || 'Juan Pérez González',
    patientPhone: '+34 666 777 888',
    patientEmail: 'juan.perez@gmail.com',
    referredBy: 'Familiar de Xus',
    professional: 'Nombre apellidos',
    economicAmount: '100 €',
    economicStatus: 'Pendiente de pago',
    notes: 'Primera limpieza del paciente',
    locationLabel: 'Fecha y ubicación',
    patientLabel: 'Paciente',
    professionalLabel: 'Profesional',
    economicLabel: 'Económico',
    notesLabel: 'Notas'
  }
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutesToAdd
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  const pad = (v: number) => v.toString().padStart(2, '0')
  return `${pad(hh)}:${pad(mm)}`
}

function buildSampleEvent(
  id: string,
  patientFull: string,
  bgColor: string,
  box: string,
  startTime: string
): MonthEvent {
  const endTime = addMinutesToTime(startTime, 30)
  const title = `${startTime} Consulta médica`
  const duration = `${startTime} - ${endTime} (30 minutos)`
  return {
    id,
    label: title,
    bgColor,
    detail: createEventDetail(title, box, patientFull, duration),
    box
  }
}

// Sample events for demonstration (single-event days)
const SAMPLE_EVENTS: MonthEvent[] = [
  {
    id: 'e1',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-purple)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 1'),
    box: 'Box 1'
  },
  {
    id: 'e2',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-purple)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 2'),
    box: 'Box 2'
  },
  {
    id: 'e3',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 1'),
    box: 'Box 1'
  },
  {
    id: 'e4',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 2'),
    box: 'Box 2'
  },
  {
    id: 'e5',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 1'),
    box: 'Box 1'
  },
  {
    id: 'e6',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 2'),
    box: 'Box 2'
  },
  {
    id: 'e7',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-purple)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 1'),
    box: 'Box 1'
  },
  {
    id: 'e8',
    label: '13:00 Consulta médica',
    bgColor: 'var(--color-event-coral)',
    detail: createEventDetail('13:00 Consulta médica', 'Box 2'),
    box: 'Box 2'
  }
]

// Patient samples for multi-event days
const PATIENT_NAMES = [
  'Ana Pérez',
  'Luis Martínez',
  'Carla Gómez',
  'Diego Torres',
  'Marta Ruiz',
  'Javier López',
  'Sara Navarro',
  'Pablo Castillo',
  'Elena Vega',
  'Raúl Ortega',
  'Noa Sánchez',
  'Tomás Vidal'
]

// Helper to build chronological sample slots
const TIME_SLOTS_10 = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30'
]
const TIME_SLOTS_6 = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
const TIME_SLOTS_5 = ['10:00', '10:30', '11:00', '11:30', '12:00']
const TIME_SLOTS_3 = ['12:00', '12:30', '13:00']

// Note: Specialist availability is now fetched dynamically from ConfigurationContext

type DayCell = {
  day: number | string
  isCurrentMonth: boolean
  isToday: boolean
  isSunday: boolean
  events: MonthEvent[]
  specialists: SpecialistAvailability[]
  date: Date
}

function HeaderLabels() {
  return (
    <div
      className='absolute left-0 top-0 flex w-full border-b border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{
        height: 'var(--scheduler-day-header-height)'
      }}
    >
      {WEEKDAYS.map((day, index) => (
        <div
          key={index}
          className='flex flex-1 items-center justify-center p-2'
        >
          <p className='text-body-md text-center font-normal text-[var(--color-neutral-600)]'>
            {day}
          </p>
        </div>
      ))}
    </div>
  )
}

function MonthEvent({
  event,
  stackIndex = 0,
  stackTop,
  eventHeight,
  eventLeft,
  eventWidth,
  onHover,
  onLeave,
  onActivate,
  isActive,
  isHovered
}: {
  event: MonthEvent
  stackIndex?: number
  stackTop: string
  eventHeight: string
  eventLeft: string
  eventWidth: string
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
  isActive?: boolean
  isHovered?: boolean
}) {
  const displayLabel = event.detail?.patientFull ?? event.label
  const stateClasses = isActive
    ? 'border-2 border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-2 border-[var(--color-brand-300)]'
    : 'border-2 border-transparent'

  return (
    <button
      type='button'
      data-event
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={(e) => {
        e.stopPropagation()
        onActivate()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
      className={[
        'flex items-center justify-center rounded-[var(--month-event-radius)] p-[var(--month-event-padding)] text-body-sm font-normal text-[var(--color-neutral-900)] transition-all duration-150',
        stateClasses
      ].join(' ')}
      style={{
        position: 'absolute',
        top: stackTop,
        left: eventLeft,
        width: eventWidth,
        height: eventHeight,
        backgroundColor: event.bgColor
      }}
    >
      <p className='truncate text-center'>{displayLabel}</p>
    </button>
  )
}

function DayCell({
  cell,
  dayIndex,
  onHover,
  onActivate,
  activeId,
  hoveredId
}: {
  cell: DayCell
  dayIndex: number
  onHover: (selection: MonthEventSelection) => void
  onActivate: (selection: MonthEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  const [activeSpecId, setActiveSpecId] = useState<string | null>(null)
  const [showDayMenu, setShowDayMenu] = useState(false)
  // Aplicar patrón de puntos a: días fuera del mes O domingos
  const shouldHaveDots = !cell.isCurrentMonth || cell.isSunday

  const bgClass = shouldHaveDots ? '' : 'bg-[var(--color-neutral-0)]'

  const dotStyle = shouldHaveDots
    ? {
        backgroundColor: 'var(--color-neutral-0)',
        backgroundImage: 'var(--sunday-bg-pattern)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'var(--sunday-dot-spacing) var(--sunday-dot-spacing)',
        backgroundPosition: '0 0'
      }
    : {}

  const dayTextClass = cell.isToday
    ? 'font-bold text-[var(--color-brand-500)]'
    : 'font-normal text-[var(--color-neutral-600)]'

  const totalEvents = cell.events.length
  const maxColumns = 3
  const maxRowsPerCol = 4
  const rowGap = '0.25rem'
  const colGap = '0.5rem'
  const eventAreaPadding = '1rem'
  const visibleEvents = Math.min(totalEvents, maxColumns * maxRowsPerCol)
  const overflowCount = Math.max(0, totalEvents - maxColumns * maxRowsPerCol)
  const columns =
    visibleEvents > 0
      ? Math.min(maxColumns, Math.ceil(visibleEvents / maxRowsPerCol))
      : 1
  const rows =
    visibleEvents > 0
      ? Math.min(maxRowsPerCol, Math.ceil(visibleEvents / columns))
      : 1
  const rowHeightExpr = 'min(var(--month-row-height), 15vh)'
  const innerSpace = `calc(${rowHeightExpr} - var(--month-event-top) - 0.5rem)`
  const eventHeight =
    visibleEvents > 0
      ? `calc((${innerSpace} / ${rows}) - ${rowGap})`
      : 'var(--month-event-height)'
  const columnWidth =
    columns > 1
      ? `calc((100% - (2 * ${eventAreaPadding}) - (${
          columns - 1
        } * ${colGap})) / ${columns})`
      : `calc(100% - (2 * ${eventAreaPadding}))`
  const stackTopFor = (rowIndex: number) =>
    `calc(var(--month-event-top) + ${rowIndex} * (${eventHeight} + ${rowGap}))`
  const leftFor = (colIndex: number) =>
    columns > 1
      ? `calc(${eventAreaPadding} + ${colIndex} * (${columnWidth} + ${colGap}))`
      : eventAreaPadding

  const handleDayContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!cell.isCurrentMonth || cell.isSunday) return
    setShowDayMenu(true)
    const close = () => setShowDayMenu(false)
    window.addEventListener('click', close, { once: true })
    window.addEventListener('contextmenu', close, { once: true })
  }

  const handleOpenDay = (
    event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
  ) => {
    event.stopPropagation()
    setShowDayMenu(false)
    if (!cell.isCurrentMonth || cell.isSunday) return
    window.dispatchEvent(
      new CustomEvent('agenda:open-day-view', {
        detail: { date: cell.date?.toISOString() }
      })
    )
  }

  // Manejar clic en el día (no en eventos)
  const handleDayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Solo abrir vista diaria si el clic fue directamente en el día, no en un evento
    const target = event.target as HTMLElement
    // Verificar que no se hizo clic en un evento o en el especialista
    if (target.closest('[data-event]') || target.closest('[data-specialist]')) {
      return
    }
    handleOpenDay(event)
  }

  return (
    <div
      className={[
        'relative flex-1 overflow-hidden border-b border-r border-[var(--color-border-default)]',
        bgClass,
        cell.isCurrentMonth && !cell.isSunday
          ? 'cursor-pointer hover:bg-[var(--color-brand-0)] transition-colors'
          : ''
      ].join(' ')}
      style={{
        ...dotStyle
      }}
      onContextMenu={handleDayContextMenu}
      onClick={handleDayClick}
    >
      <div
        className='absolute left-0 right-0 flex items-center justify-between px-[1rem]'
        style={{
          top: 'var(--month-cell-padding-top)'
        }}
      >
        <p
          className={[
            'text-body-md',
            dayTextClass,
            cell.isCurrentMonth && !cell.isSunday
              ? 'hover:text-[var(--color-brand-600)]'
              : ''
          ].join(' ')}
        >
          {cell.day}
        </p>
        {cell.specialists.length > 0 && (
          <div className='flex items-center gap-[0.5rem]'>
            {cell.specialists.map((spec) => (
              <button
                key={spec.id}
                type='button'
                data-specialist
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveSpecId((prev) => (prev === spec.id ? null : spec.id))
                }}
                className='shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-300)] cursor-pointer'
                title={`${spec.name} · ${spec.timeRange}`}
                aria-label={`${spec.name} ${spec.timeRange}`}
                style={{
                  width: '0.875rem', // 14px Figma dot
                  height: '0.875rem',
                  backgroundColor: spec.color
                }}
              />
            ))}
          </div>
        )}
      </div>
      {activeSpecId &&
        (() => {
          const activeSpec = cell.specialists.find(
            (spec) => spec.id === activeSpecId
          )
          if (!activeSpec) return null
          return (
            <div
              className='pointer-events-auto absolute right-[1rem] z-[2] flex items-center gap-2 rounded-[var(--radius-xl)] bg-[var(--color-neutral-50)] px-3 py-2 text-label-md font-medium text-[var(--color-neutral-900)] shadow-[0px_2px_6px_rgba(0,0,0,0.08)]'
              style={{
                top: 'calc(var(--month-cell-padding-top) + 1.75rem)'
              }}
            >
              <span
                className='inline-flex h-[0.75rem] w-[0.75rem] rounded-full'
                style={{ backgroundColor: activeSpec.color }}
              />
              <span>{activeSpec.name}</span>
              <span className='text-[var(--color-neutral-600)]'>
                {activeSpec.timeRange}
              </span>
            </div>
          )
        })()}
      {showDayMenu && (
        <div className='absolute right-[1rem] top-[3.5rem] z-[3] flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[0px_4px_12px_rgba(0,0,0,0.12)]'>
          <button
            type='button'
            onClick={handleOpenDay}
            className='px-4 py-2 text-left text-body-md text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
          >
            Ver día
          </button>
        </div>
      )}
      {cell.events.map((event, eventIndex) => {
        if (eventIndex >= maxColumns * maxRowsPerCol) return null
        const colIndex = Math.min(
          columns - 1,
          Math.floor(eventIndex / maxRowsPerCol)
        )
        const rowIndex = eventIndex % maxRowsPerCol
        return (
          <MonthEvent
            key={event.id}
            event={event}
            stackIndex={eventIndex}
            stackTop={stackTopFor(rowIndex)}
            eventHeight={eventHeight}
            eventLeft={leftFor(colIndex)}
            eventWidth={columnWidth}
            onHover={() => onHover({ event, dayIndex, date: cell.date })}
            onLeave={() => onHover(null)}
            onActivate={() => onActivate({ event, dayIndex, date: cell.date })}
            isActive={activeId === event.id}
            isHovered={hoveredId === event.id && activeId !== event.id}
          />
        )
      })}
      {overflowCount > 0 && (
        <div
          className='pointer-events-none absolute bottom-2 right-2 flex items-center gap-2 rounded-full bg-[var(--color-neutral-50)] px-3 py-1 text-label-md font-medium text-[var(--color-neutral-900)] shadow-[0px_2px_6px_rgba(0,0,0,0.08)]'
          aria-label={`Más ${overflowCount} citas`}
        >
          <span className='inline-flex h-[0.75rem] w-[0.75rem] rounded-full bg-[var(--color-event-purple)]' />
          <span>+{overflowCount} citas</span>
        </div>
      )}
    </div>
  )
}

function MonthGrid({
  calendarData,
  onHover,
  onActivate,
  activeId,
  hoveredId
}: {
  calendarData: DayCell[][]
  onHover: (selection: MonthEventSelection) => void
  onActivate: (selection: MonthEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  return (
    <div
      className='absolute left-0 flex w-full flex-col overflow-y-auto'
      style={{
        top: 'var(--scheduler-day-header-height)',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      {calendarData.map((week, weekIndex) => (
        <div
          key={weekIndex}
          className='flex'
          style={{
            minHeight: 'min(var(--month-row-height), 15vh)',
            flex: '1 0 auto'
          }}
        >
          {week.map((cell, dayIndex) => {
            const globalDayIndex = weekIndex * 7 + dayIndex
            return (
              <DayCell
                key={`${weekIndex}-${dayIndex}`}
                cell={cell}
                dayIndex={globalDayIndex}
                onHover={onHover}
                onActivate={onActivate}
                activeId={activeId}
                hoveredId={hoveredId}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

type WeekEvent = {
  id: string
  weekday: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  title: string
  patient: string
  timeRange: string
  box: string
  bgColor: string
}

type MonthEventInput = {
  id: string
  date: string // YYYY-MM-DD
  title: string
  patient: string
  timeRange: string
  box: string
  professional?: string
  professionalId?: string
  confirmed?: boolean
  createdByVoiceAgent?: boolean
  bgColor: string
}

interface MonthCalendarProps {
  currentMonth?: Date
  currentWeekStart?: Date
  weekEvents?: WeekEvent[]
  monthEvents?: MonthEventInput[]
  disableMockFallback?: boolean
  selectedProfessionals?: string[]
  professionalOptions?: Array<{ id: string; label: string; color: string }>
}

export default function MonthCalendar({
  currentMonth: propCurrentMonth,
  currentWeekStart,
  weekEvents = [],
  monthEvents = [],
  disableMockFallback = true,
  selectedProfessionals = [],
  professionalOptions: overrideProfessionalOptions
}: MonthCalendarProps) {
  const [hovered, setHovered] = useState<MonthEventSelection>(null)
  const [active, setActive] = useState<MonthEventSelection>(null)

  // Configuration context for dynamic specialist availability
  const {
    professionalOptions: contextProfessionalOptions
  } = useConfiguration()
  const effectiveProfessionalOptions =
    overrideProfessionalOptions && overrideProfessionalOptions.length > 0
      ? overrideProfessionalOptions
      : contextProfessionalOptions

  // Use prop if provided, otherwise use internal state
  const [internalMonth] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const currentMonth = propCurrentMonth || internalMonth

  const handleHover = (state: MonthEventSelection) => {
    setHovered(state)
  }

  const handleActivate = (state: MonthEventSelection) => {
    if (!state) return
    const isSame = active?.event.id === state.event.id
    setActive(isSame ? null : state)
    setHovered(isSame ? null : state)
  }

  const handleRootClick = () => {
    setActive(null)
  }

  // Helper to get weekday name from date
  const getWeekdayFromDate = (
    date: Date
  ): 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | null => {
    const dayOfWeek = date.getDay()
    const mapping: (
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | null
    )[] = [null, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', null]
    return mapping[dayOfWeek] ?? null
  }

  // Helper to convert WeekEvent to MonthEvent
  const weekEventToMonthEvent = (ev: WeekEvent): MonthEvent => {
    const startTime = ev.timeRange?.split('-')[0]?.trim() || '12:30'
    return {
      id: ev.id,
      label: `${startTime} ${ev.title}`,
      bgColor: ev.bgColor,
      detail: createEventDetail(
        `${startTime} ${ev.title}`,
        ev.box,
        ev.patient,
        ev.timeRange ? `${ev.timeRange} (60 minutos)` : undefined
      ),
      box: ev.box
    }
  }

  const monthEventInputToMonthEvent = (ev: MonthEventInput): MonthEvent => {
    const startTime = ev.timeRange?.split('-')[0]?.trim() || '12:30'
    return {
      id: ev.id,
      label: `${startTime} ${ev.title}`,
      bgColor: ev.bgColor,
      detail: createEventDetail(
        `${startTime} ${ev.title}`,
        ev.box,
        ev.patient,
        ev.timeRange ? `${ev.timeRange} (60 minutos)` : undefined
      ),
      box: ev.box,
      professional: ev.professional,
      professionalId: ev.professionalId,
      confirmed: ev.confirmed,
      createdByVoiceAgent: ev.createdByVoiceAgent
    }
  }

  // Generate calendar data dynamically
  const generateCalendarData = (): DayCell[][] => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1)
    let firstDayWeekday = firstDayOfMonth.getDay()
    // Convert Sunday (0) to 7, and adjust so Monday = 1
    firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday

    // Get last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()

    // Get last day of previous month
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate()

    // Today for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weeks: DayCell[][] = []
    let currentWeekArr: DayCell[] = []

    // Fill in days from previous month
    const daysFromPrevMonth = firstDayWeekday - 1
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = lastDayOfPrevMonth - i + 1
      const prevMonthDate = new Date(year, month - 1, day)
      const isSunday = prevMonthDate.getDay() === 0

      currentWeekArr.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSunday,
        events: [],
        specialists: [],
        date: prevMonthDate
      })
    }

    // Fill in days from current month
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const cellDate = new Date(year, month, day)
      cellDate.setHours(0, 0, 0, 0)

      const isFirstDay = day === 1
      const displayDay = isFirstDay
        ? `${day} ${currentMonth.toLocaleString('es-ES', { month: 'long' })}`
        : day

      const isSunday = cellDate.getDay() === 0

      // Get events for this day from weekEvents prop
      let dayEvents: MonthEvent[] = []
      if (!isSunday && monthEvents.length > 0) {
        const dateKey = cellDate.toLocaleDateString('en-CA')
        const eventsForDay = monthEvents.filter((ev) => ev.date === dateKey)
        dayEvents = eventsForDay.map(monthEventInputToMonthEvent)
      } else if (!isSunday && weekEvents.length > 0) {
        const weekday = getWeekdayFromDate(cellDate)
        if (weekday) {
          const eventsForDay = weekEvents.filter((ev) => ev.weekday === weekday)
          dayEvents = eventsForDay.map(weekEventToMonthEvent)
        }
      }

      // Fallback to sample events if no weekEvents provided
      if (
        dayEvents.length === 0 &&
        !isSunday &&
        weekEvents.length === 0 &&
        monthEvents.length === 0 &&
        !disableMockFallback
      ) {
        if (day === 7 && today.getTime() === cellDate.getTime()) {
          dayEvents = [SAMPLE_EVENTS[0]]
        } else if (day === 9) {
          dayEvents = [SAMPLE_EVENTS[1]]
        } else if (day === 10) {
          dayEvents = [SAMPLE_EVENTS[2]]
        } else if (day === 13) {
          dayEvents = [SAMPLE_EVENTS[3]]
        } else if (day === 14) {
          dayEvents = [SAMPLE_EVENTS[4]]
        } else if (day === 15) {
          dayEvents = [SAMPLE_EVENTS[5]]
        } else if (day === 17) {
          dayEvents = [SAMPLE_EVENTS[6]]
        } else if (day === 22) {
          dayEvents = [SAMPLE_EVENTS[7]]
        } else if (day === 3) {
          dayEvents = [
            buildSampleEvent(
              'd3-e1',
              PATIENT_NAMES[0],
              'var(--color-event-purple)',
              'Box 1',
              TIME_SLOTS_10[0]
            ),
            buildSampleEvent(
              'd3-e2',
              PATIENT_NAMES[1],
              'var(--color-event-teal)',
              'Box 2',
              TIME_SLOTS_10[1]
            ),
            buildSampleEvent(
              'd3-e3',
              PATIENT_NAMES[2],
              'var(--color-event-coral)',
              'Box 3',
              TIME_SLOTS_10[2]
            ),
            buildSampleEvent(
              'd3-e4',
              PATIENT_NAMES[3],
              'var(--color-event-purple)',
              'Box 1',
              TIME_SLOTS_10[3]
            ),
            buildSampleEvent(
              'd3-e5',
              PATIENT_NAMES[4],
              'var(--color-event-teal)',
              'Box 2',
              TIME_SLOTS_10[4]
            ),
            buildSampleEvent(
              'd3-e6',
              PATIENT_NAMES[5],
              'var(--color-event-coral)',
              'Box 3',
              TIME_SLOTS_10[5]
            ),
            buildSampleEvent(
              'd3-e7',
              PATIENT_NAMES[6],
              'var(--color-event-purple)',
              'Box 2',
              TIME_SLOTS_10[6]
            ),
            buildSampleEvent(
              'd3-e8',
              PATIENT_NAMES[7],
              'var(--color-event-teal)',
              'Box 1',
              TIME_SLOTS_10[7]
            ),
            buildSampleEvent(
              'd3-e9',
              PATIENT_NAMES[8],
              'var(--color-event-purple)',
              'Box 3',
              TIME_SLOTS_10[8]
            ),
            buildSampleEvent(
              'd3-e10',
              PATIENT_NAMES[9],
              'var(--color-event-coral)',
              'Box 1',
              TIME_SLOTS_10[9]
            )
          ]
        } else if (day === 8) {
          dayEvents = [
            buildSampleEvent(
              'd8-e1',
              PATIENT_NAMES[1],
              'var(--color-event-teal)',
              'Box 2',
              TIME_SLOTS_5[0]
            ),
            buildSampleEvent(
              'd8-e2',
              PATIENT_NAMES[2],
              'var(--color-event-purple)',
              'Box 1',
              TIME_SLOTS_5[1]
            ),
            buildSampleEvent(
              'd8-e3',
              PATIENT_NAMES[3],
              'var(--color-event-coral)',
              'Box 3',
              TIME_SLOTS_5[2]
            ),
            buildSampleEvent(
              'd8-e4',
              PATIENT_NAMES[4],
              'var(--color-event-teal)',
              'Box 2',
              TIME_SLOTS_5[3]
            ),
            buildSampleEvent(
              'd8-e5',
              PATIENT_NAMES[5],
              'var(--color-event-purple)',
              'Box 1',
              TIME_SLOTS_5[4]
            )
          ]
        } else if (day === 11) {
          dayEvents = [
            buildSampleEvent(
              'd11-e1',
              PATIENT_NAMES[6],
              'var(--color-event-coral)',
              'Box 1',
              TIME_SLOTS_6[0]
            ),
            buildSampleEvent(
              'd11-e2',
              PATIENT_NAMES[7],
              'var(--color-event-purple)',
              'Box 2',
              TIME_SLOTS_6[1]
            ),
            buildSampleEvent(
              'd11-e3',
              PATIENT_NAMES[8],
              'var(--color-event-teal)',
              'Box 3',
              TIME_SLOTS_6[2]
            ),
            buildSampleEvent(
              'd11-e4',
              PATIENT_NAMES[9],
              'var(--color-event-purple)',
              'Box 1',
              TIME_SLOTS_6[3]
            ),
            buildSampleEvent(
              'd11-e5',
              PATIENT_NAMES[10],
              'var(--color-event-teal)',
              'Box 2',
              TIME_SLOTS_6[4]
            ),
            buildSampleEvent(
              'd11-e6',
              PATIENT_NAMES[11],
              'var(--color-event-coral)',
              'Box 3',
              TIME_SLOTS_6[5]
            )
          ]
        } else if (day === 18) {
          dayEvents = [
            buildSampleEvent(
              'd18-e1',
              PATIENT_NAMES[2],
              'var(--color-event-purple)',
              'Box 1',
              TIME_SLOTS_3[0]
            ),
            buildSampleEvent(
              'd18-e2',
              PATIENT_NAMES[5],
              'var(--color-event-teal)',
              'Box 2',
              TIME_SLOTS_3[1]
            ),
            buildSampleEvent(
              'd18-e3',
              PATIENT_NAMES[8],
              'var(--color-event-coral)',
              'Box 3',
              TIME_SLOTS_3[2]
            )
          ]
        }
      }

      // Dots should represent professionals with appointments on this day.
      let specialists: SpecialistAvailability[] = []
      if (!isSunday && dayEvents.length > 0) {
        const optionById = new Map(
          effectiveProfessionalOptions.map((option) => [option.id, option])
        )
        const optionByLabel = new Map(
          effectiveProfessionalOptions.map((option) => [
            option.label.trim().toLowerCase(),
            option
          ])
        )
        const selectedSet = new Set(selectedProfessionals)
        const specialistById = new Map<
          string,
          { id: string; name: string; color: string; ranges: Set<string> }
        >()

        for (const event of dayEvents) {
          const professionalName = (event.professional || '').trim()
          const optionFromId = event.professionalId
            ? optionById.get(event.professionalId)
            : undefined
          const optionFromLabel = professionalName
            ? optionByLabel.get(professionalName.toLowerCase())
            : undefined
          const resolvedId =
            optionFromId?.id ||
            optionFromLabel?.id ||
            event.professionalId ||
            (professionalName ? professionalName.toLowerCase() : '')
          if (!resolvedId) continue
          if (selectedSet.size > 0 && !selectedSet.has(resolvedId)) continue

          const resolvedName =
            optionFromId?.label ||
            optionFromLabel?.label ||
            professionalName ||
            'Profesional'
          const resolvedColor =
            optionFromId?.color ||
            optionFromLabel?.color ||
            'var(--color-neutral-400)'
          const entry = specialistById.get(resolvedId) || {
            id: resolvedId,
            name: resolvedName,
            color: resolvedColor,
            ranges: new Set<string>()
          }
          if (event.detail?.duration) {
            entry.ranges.add(event.detail.duration)
          }
          specialistById.set(resolvedId, entry)
        }

        specialists = Array.from(specialistById.values()).map((entry) => ({
          id: entry.id,
          name: entry.name,
          timeRange: Array.from(entry.ranges).slice(0, 2).join(', '),
          color: entry.color
        }))
      }

      currentWeekArr.push({
        day: displayDay,
        isCurrentMonth: true,
        isToday: cellDate.getTime() === today.getTime(),
        isSunday,
        events: dayEvents,
        specialists,
        date: cellDate
      })

      if (currentWeekArr.length === 7) {
        weeks.push(currentWeekArr)
        currentWeekArr = []
      }
    }

    // Fill in days from next month
    if (currentWeekArr.length > 0) {
      let nextMonthDay = 1
      while (currentWeekArr.length < 7) {
        const nextMonthDate = new Date(year, month + 1, nextMonthDay)
        const isSunday = nextMonthDate.getDay() === 0

        currentWeekArr.push({
          day: nextMonthDay++,
          isCurrentMonth: false,
          isToday: false,
          isSunday,
          events: [],
          specialists: [],
          date: nextMonthDate
        })
      }
      weeks.push(currentWeekArr)
    }

    return weeks
  }

  const calendarData = generateCalendarData()
  const totalWeeks = calendarData.length

  const overlaySource = active
  const activeDetail = overlaySource?.event.detail

  return (
    <div className='relative h-full w-full' onClick={handleRootClick}>
      <HeaderLabels />
      <MonthGrid
        calendarData={calendarData}
        onHover={handleHover}
        onActivate={handleActivate}
        activeId={active?.event.id}
        hoveredId={hovered?.event.id}
      />

      {/* Hover overlay - Simplified detail view */}
      {hovered &&
        !active &&
        hovered.event.detail &&
        (() => {
          const position = getSmartOverlayPosition(
            hovered.dayIndex,
            totalWeeks,
            'auto'
          )
          return (
            <AppointmentHoverOverlay
              detail={hovered.event.detail}
              box={hovered.event.box || ''}
              position={position}
              backgroundClass={`bg-[${hovered.event.bgColor}]`}
              createdByVoiceAgent={hovered.event.createdByVoiceAgent}
            />
          )
        })()}

      {/* Click overlay - AppointmentDetailOverlay */}
      {overlaySource &&
        activeDetail &&
        (() => {
          const position = getSmartOverlayPosition(
            overlaySource.dayIndex,
            totalWeeks
          )
          return (
            <AppointmentDetailOverlay
              detail={activeDetail}
              box={overlaySource.event.box || ''}
              position={position}
              backgroundClass={`bg-[${overlaySource.event.bgColor}]`}
              onClose={() => setActive(null)}
            />
          )
        })()}
    </div>
  )
}
