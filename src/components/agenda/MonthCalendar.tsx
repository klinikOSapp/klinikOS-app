'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import { useState, useEffect, useMemo } from 'react'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import AppointmentDetailOverlay from './AppointmentDetailOverlay'
import type { EventDetail } from './types'

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const OVERLAY_GUTTER = '1rem'

// Database types
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
  patients?: { first_name: string; last_name: string; phone_number: string | null; email: string | null } | null
  boxes?: { name_or_number: string } | null
  service_catalog?: { name: string } | null
  appointment_staff?: Array<{ staff_id: string; staff?: { full_name: string } | null }> | null
}

// Color palette for appointments based on status
const APPOINTMENT_COLORS: Record<string, string> = {
  confirmed: 'var(--color-brand-100)',
  scheduled: 'var(--color-event-teal)',
  hold: 'var(--color-event-purple)',
  completed: 'var(--color-event-teal)',
  cancelled: 'var(--color-event-coral)',
  no_show: 'var(--color-event-coral)',
  default: 'var(--color-neutral-200)'
}

// Positioning functions for smart overlay placement
function getOverlayTop(dayIndex: number, totalWeeks: number): string {
  const weekIndex = Math.floor(dayIndex / 7)
  const weekPercentage = (weekIndex / totalWeeks) * 100

  return `calc(var(--scheduler-day-header-height) + ${weekPercentage}%)`
}

function getOverlayLeft(dayIndex: number): string {
  const dayOfWeek = dayIndex % 7

  const isRightColumn = dayOfWeek >= 4

  if (isRightColumn) {
    const columnPercent = (dayOfWeek / 7) * 100
    return `max(1rem, calc(${columnPercent}% - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER}))`
  }

  const columnPercent = (dayOfWeek / 7) * 100
  const columnWidth = (1 / 7) * 100
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

// Helper to format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString(DEFAULT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DEFAULT_TIMEZONE
  })
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

type MonthEvent = {
  id: string
  label: string
  bgColor: string
  detail?: EventDetail
  box?: string
  status?: string
}

type MonthEventSelection = {
  event: MonthEvent
  dayIndex: number
} | null

type DayCell = {
  day: number | string
  date: Date
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

function MonthEventCard({
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

  const isCancelled = event.status === 'cancelled' || event.status === 'no_show'

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
        stateClasses,
        isCancelled ? 'opacity-50' : ''
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
      <p className={`truncate text-center ${isCancelled ? 'line-through' : ''}`}>{event.label}</p>
    </button>
  )
}

function DayCellComponent({
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

  // Show count if more than 1 event
  const eventCount = cell.events.length
  const displayEvent = cell.events[0]

  return (
    <div
      className={[
        'relative flex-1 overflow-hidden border-b border-r border-[var(--color-border-default)]',
        bgClass
      ].join(' ')}
      style={{
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
      
      {/* Show first event */}
      {displayEvent && (
        <MonthEventCard
          event={displayEvent}
          onHover={() => onHover({ event: displayEvent, dayIndex })}
          onLeave={() => onHover(null)}
          onActivate={() => onActivate({ event: displayEvent, dayIndex })}
          isActive={activeId === displayEvent.id}
          isHovered={hoveredId === displayEvent.id && activeId !== displayEvent.id}
        />
      )}
      
      {/* Show +N more indicator */}
      {eventCount > 1 && (
        <p
          className='absolute text-xs font-medium text-[var(--color-neutral-600)]'
          style={{
            bottom: '0.25rem',
            right: '0.5rem'
          }}
        >
          +{eventCount - 1} más
        </p>
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
              <DayCellComponent
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
  clinicId?: string | null
  selectedBoxes?: string[]
}

export default function MonthCalendar({
  currentMonth: propCurrentMonth,
  clinicId: propClinicId,
  selectedBoxes
}: MonthCalendarProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  
  const [hovered, setHovered] = useState<MonthEventSelection>(null)
  const [active, setActive] = useState<MonthEventSelection>(null)
  
  // Data state
  const [clinicId, setClinicId] = useState<string | null>(propClinicId ?? null)
  const [appointments, setAppointments] = useState<DbAppointment[]>([])
  const [isLoading, setIsLoading] = useState(!propClinicId) // Only loading if we need to fetch clinicId

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

  // Fetch clinic on mount (only if not provided via props)
  useEffect(() => {
    async function init() {
      if (propClinicId) {
        // If clinicId is provided via props, use it directly
        setClinicId(propClinicId)
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        const { data: clinics } = await supabase.rpc('get_my_clinics')
        const cId = Array.isArray(clinics) && clinics.length > 0 ? clinics[0] : null
        setClinicId(cId)
      } catch (error) {
        console.error('Error initializing month calendar:', error)
      }
      setIsLoading(false)
    }
    void init()
  }, [supabase, propClinicId])

  // Fetch appointments for the month
  useEffect(() => {
    async function fetchAppointments() {
      if (!clinicId) return
      
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      // Get first day of month and last day
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
      
      // Extend to include days from previous/next month shown in calendar
      const firstDayWeekday = monthStart.getDay()
      const daysFromPrevMonth = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1
      const calendarStart = new Date(monthStart)
      calendarStart.setDate(calendarStart.getDate() - daysFromPrevMonth)
      
      const lastDayWeekday = monthEnd.getDay()
      const daysFromNextMonth = lastDayWeekday === 0 ? 0 : 7 - lastDayWeekday
      const calendarEnd = new Date(monthEnd)
      calendarEnd.setDate(calendarEnd.getDate() + daysFromNextMonth)
      
      const startIso = calendarStart.toISOString()
      const endIso = calendarEnd.toISOString()
      
      // Build query - fetch ALL appointments (including cancelled) for visibility
      let query = supabase
        .from('appointments')
        .select(`
          id, clinic_id, patient_id, box_id, service_id,
          scheduled_start_time, scheduled_end_time, status, public_ref, notes,
          patients (first_name, last_name, phone_number, email),
          boxes (name_or_number),
          service_catalog (name),
          appointment_staff (staff_id, staff:staff_id(full_name))
        `)
        .eq('clinic_id', clinicId)
        .gte('scheduled_start_time', startIso)
        .lte('scheduled_start_time', endIso)
        .order('scheduled_start_time', { ascending: true })
      
      // Filter by boxes if specified
      if (selectedBoxes && selectedBoxes.length > 0) {
        query = query.in('box_id', selectedBoxes)
      }
      
      const { data: apptData } = await query
      
      setAppointments((apptData as unknown as DbAppointment[]) ?? [])
    }
    
    void fetchAppointments()
  }, [supabase, clinicId, currentMonth, selectedBoxes])

  // Generate calendar data dynamically with real appointments
  const { calendarData, totalWeeks } = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    let firstDayWeekday = firstDayOfMonth.getDay()
    firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Group appointments by date (using timezone-aware date extraction)
    const appointmentsByDate = new Map<string, DbAppointment[]>()
    for (const appt of appointments) {
      // Parse the date in the clinic's timezone to get the correct local date
      const date = new Date(appt.scheduled_start_time)
      // Format as YYYY-MM-DD in the local timezone
      const dateKey = date.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE }) // en-CA gives YYYY-MM-DD format
      if (!appointmentsByDate.has(dateKey)) {
        appointmentsByDate.set(dateKey, [])
      }
      appointmentsByDate.get(dateKey)!.push(appt)
    }

    const weeks: DayCell[][] = []
    let currentWeek: DayCell[] = []

    // Fill in days from previous month
    const daysFromPrevMonth = firstDayWeekday - 1
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = lastDayOfPrevMonth - i + 1
      const cellDate = new Date(year, month - 1, day)
      const isSunday = cellDate.getDay() === 0
      
      currentWeek.push({
        day,
        date: cellDate,
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

      // Get appointments for this day (use same YYYY-MM-DD format)
      const dateKey = cellDate.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE })
      const dayAppointments = appointmentsByDate.get(dateKey) ?? []
      
      const events: MonthEvent[] = dayAppointments.map(appt => {
        const patientName = appt.patients
          ? `${appt.patients.first_name} ${appt.patients.last_name}`
          : 'Paciente'
        const serviceName = appt.service_catalog?.name ?? 'Cita'
        const boxName = appt.boxes?.name_or_number ?? 'Sin box'
        const staffNames = appt.appointment_staff
          ?.map(as => as.staff?.full_name)
          .filter(Boolean)
          .join(', ') ?? 'Por asignar'
        
        return {
          id: `appt-${appt.id}`,
          label: `${formatTime(appt.scheduled_start_time)} ${serviceName}`,
          bgColor: APPOINTMENT_COLORS[appt.status] ?? APPOINTMENT_COLORS.default,
          status: appt.status,
          box: boxName,
          detail: {
            title: `${serviceName} · ${appt.public_ref ?? ''}`,
            date: formatDateForDisplay(appt.scheduled_start_time),
            duration: formatTimeRange(appt.scheduled_start_time, appt.scheduled_end_time),
            patientFull: patientName,
            patientPhone: appt.patients?.phone_number ?? undefined,
            patientEmail: appt.patients?.email ?? undefined,
            professional: staffNames,
            notes: appt.notes ?? undefined,
            locationLabel: 'Fecha y ubicación',
            patientLabel: 'Paciente',
            professionalLabel: 'Profesional',
            economicLabel: 'Económico',
            notesLabel: 'Notas'
          }
        }
      })

      const isSunday = cellDate.getDay() === 0
      
      currentWeek.push({
        day: displayDay,
        date: cellDate,
        isCurrentMonth: true,
        isToday: cellDate.getTime() === today.getTime(),
        isSunday,
        events
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
        const cellDate = new Date(year, month + 1, nextMonthDay)
        const isSunday = cellDate.getDay() === 0
        
        currentWeek.push({
          day: nextMonthDay++,
          date: cellDate,
          isCurrentMonth: false,
          isToday: false,
          isSunday,
          events: []
        })
      }
      weeks.push(currentWeek)
    }

    return { calendarData: weeks, totalWeeks: weeks.length }
  }, [currentMonth, appointments])

  const overlaySource = active
  const activeDetail = overlaySource?.event.detail

  if (isLoading) {
    return (
      <div className='relative flex h-full w-full items-center justify-center'>
        <p className='text-body-md text-neutral-500'>Cargando calendario...</p>
      </div>
    )
  }

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
      {hovered && !active && hovered.event.detail && (() => {
        const position = getSmartOverlayPosition(
          hovered.dayIndex,
          totalWeeks,
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
                  style={{ width: '2rem', height: '2rem' }}
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
      {overlaySource && activeDetail && (() => {
        const position = getSmartOverlayPosition(
          overlaySource.dayIndex,
          totalWeeks
        )
        return (
          <AppointmentDetailOverlay
            detail={activeDetail}
            box={overlaySource.event.box || ''}
            position={position}
          />
        )
      })()}
    </div>
  )
}
