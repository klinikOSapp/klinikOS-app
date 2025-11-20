'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import { useState } from 'react'

import AppointmentDetailOverlay from './AppointmentDetailOverlay'
import type { EventDetail } from './types'

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

type MonthEvent = {
  id: string
  label: string
  bgColor: string
  detail?: EventDetail
  box?: string
}

type MonthEventSelection = {
  event: MonthEvent
  dayIndex: number
} | null

// Helper function to create event details
function createEventDetail(title: string, box: string): EventDetail {
  return {
    title,
    date: 'Lunes, 20 de Noviembre 2025',
    duration: '13:00 - 13:30 (30 minutos)',
    patientFull: 'Juan Pérez González',
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

// Sample events for demonstration
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

type DayCell = {
  day: number | string
  isCurrentMonth: boolean
  isToday: boolean
  isSunday: boolean
  events: MonthEvent[]
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
  onHover,
  onLeave,
  onActivate,
  isActive,
  isHovered
}: {
  event: MonthEvent
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
  isActive?: boolean
  isHovered?: boolean
}) {
  const stateClasses = isActive
    ? 'border-2 border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-2 border-[var(--color-brand-300)]'
    : 'border-2 border-transparent'

  return (
    <button
      type='button'
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
        top: 'var(--month-event-top)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'var(--month-event-width-percent)',
        height: 'var(--month-event-height)',
        backgroundColor: event.bgColor
      }}
    >
      <p className='truncate text-center'>{event.label}</p>
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

  return (
    <div
      className={[
        'relative flex-1 overflow-hidden border-b border-r border-[var(--color-border-default)]',
        bgClass
      ].join(' ')}
      style={{
        height: 'var(--month-row-height)',
        ...dotStyle
      }}
    >
      <p
        className={['text-body-md', dayTextClass].join(' ')}
        style={{
          position: 'absolute',
          left: '1rem',
          top: 'var(--month-cell-padding-top)'
        }}
      >
        {cell.day}
      </p>
      {cell.events.map((event) => (
        <MonthEvent
          key={event.id}
          event={event}
          onHover={() => onHover({ event, dayIndex })}
          onLeave={() => onHover(null)}
          onActivate={() => onActivate({ event, dayIndex })}
          isActive={activeId === event.id}
          isHovered={hoveredId === event.id && activeId !== event.id}
        />
      ))}
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
      className='absolute left-0 flex w-full flex-col'
      style={{
        top: 'var(--scheduler-day-header-height)',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      {calendarData.map((week, weekIndex) => (
        <div key={weekIndex} className='flex flex-1'>
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

interface MonthCalendarProps {
  currentMonth?: Date
  events?: Array<{
    id: string
    date: Date
    title: string
    bgColor: string
  }>
}

export default function MonthCalendar({
  currentMonth: propCurrentMonth,
  events = []
}: MonthCalendarProps) {
  const [hovered, setHovered] = useState<MonthEventSelection>(null)
  const [active, setActive] = useState<MonthEventSelection>(null)

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
    let currentWeek: DayCell[] = []

    // Fill in days from previous month
    const daysFromPrevMonth = firstDayWeekday - 1
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = lastDayOfPrevMonth - i + 1
      const prevMonthDate = new Date(year, month - 1, day)
      const isSunday = prevMonthDate.getDay() === 0
      
      currentWeek.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSunday,
        events: []
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

      // Add sample events to specific days for demonstration
      let dayEvents: MonthEvent[] = []
      if (day === 7 && today.getTime() === cellDate.getTime()) {
        // Today gets event 1
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
      }

      const isSunday = cellDate.getDay() === 0
      
      currentWeek.push({
        day: displayDay,
        isCurrentMonth: true,
        isToday: cellDate.getTime() === today.getTime(),
        isSunday,
        events: dayEvents
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Fill in days from next month
    if (currentWeek.length > 0) {
      let nextMonthDay = 1
      while (currentWeek.length < 7) {
        const nextMonthDate = new Date(year, month + 1, nextMonthDay)
        const isSunday = nextMonthDate.getDay() === 0
        
        currentWeek.push({
          day: nextMonthDay++,
          isCurrentMonth: false,
          isToday: false,
          isSunday,
          events: []
        })
      }
      weeks.push(currentWeek)
    }

    return weeks
  }

  const calendarData = generateCalendarData()

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
      {hovered && !active && hovered.event.detail && (
        <div
          className='pointer-events-none absolute z-10 flex flex-col overflow-hidden overflow-y-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)]'
          style={{
            top: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'var(--scheduler-overlay-width)',
            maxHeight: '14rem'
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
                  style={{ width: '2rem', height: '2rem' }}
                />
                <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                  {hovered.event.detail.professional}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click overlay - AppointmentDetailOverlay */}
      {overlaySource && activeDetail && (
        <div
          style={{
            position: 'absolute',
            top: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20
          }}
        >
          <AppointmentDetailOverlay
            detail={activeDetail}
            box={overlaySource.event.box || ''}
            position={{ top: '0', left: '0' }}
          />
        </div>
      )}
    </div>
  )
}

