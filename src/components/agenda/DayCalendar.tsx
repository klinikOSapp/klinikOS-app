'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import { useState, useEffect, useMemo } from 'react'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import AppointmentDetailOverlay from './AppointmentDetailOverlay'
import type { EventDetail } from './types'

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

// Positioning functions for smart overlay placement
function getOverlayTop(relativeTop: string): string {
  const trimmed = relativeTop.trim()
  if (trimmed.startsWith('calc(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(5, -1).trim()
    return `calc(var(--scheduler-day-header-height) + ${inner})`
  }
  return `calc(var(--scheduler-day-header-height) + ${trimmed})`
}

function getOverlayLeft(boxIndex: number, totalBoxes: number): string {
  // Smart positioning: place overlay to the right of the box when possible
  // If box is the last one, place overlay to the LEFT
  const isLastBox = boxIndex === totalBoxes - 1 && totalBoxes > 1

  if (isLastBox) {
    // Place overlay to the LEFT
    const columnPercent = (boxIndex / totalBoxes) * 100
    return `max(1rem, calc(${columnPercent}% - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER}))`
  }

  // For first and middle boxes, place overlay to the RIGHT
  const columnPercent = (boxIndex / totalBoxes) * 100
  const columnWidth = (1 / totalBoxes) * 100
  return `calc(var(--day-time-column-width) + ${columnPercent + columnWidth}% + ${OVERLAY_GUTTER})`
}

function getSmartOverlayPosition(
  relativeTop: string,
  boxIndex: number,
  totalBoxes: number,
  overlayHeight: string = 'var(--scheduler-overlay-height)'
) {
  const baseTop = getOverlayTop(relativeTop)
  const baseLeft = getOverlayLeft(boxIndex, totalBoxes)

  return {
    top: `max(0rem, min(${baseTop}, calc(100vh - ${overlayHeight} - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 1rem)))`,
    left: baseLeft,
    maxHeight: `min(${overlayHeight}, calc(100vh - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 2rem))`
  }
}

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

// Color palette for appointments based on status
const APPOINTMENT_COLORS: Record<string, string> = {
  confirmed: 'var(--color-brand-100)',
  scheduled: 'rgba(86,145,255,0.2)',
  hold: '#fbf3e9',
  completed: '#e8f5e9',
  cancelled: '#fbe9e9',
  no_show: '#fff3e0',
  default: '#f5f5f5'
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
  
  return `${Math.max(0, slots * slotHeight)}rem`
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

type DayEvent = {
  id: string
  label: string
  top: string
  height: string
  bgColor: string
  detail?: EventDetail
  box?: string
  status?: string
}

type DayEventSelection = {
  event: DayEvent
  boxIndex: number
} | null

type BoxColumn = {
  id: string
  name_or_number: string
  events: DayEvent[]
}

function TimeColumn({ timeLabels }: { timeLabels: string[] }) {
  return (
    <div
      className='absolute left-0 bg-[var(--color-neutral-100)]'
      style={{
        top: 'var(--scheduler-day-header-height)',
        width: 'var(--day-time-column-width)',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      <div
        className='grid h-full'
        style={{
          gridTemplateRows: `repeat(${timeLabels.length}, 1fr)`
        }}
      >
        {timeLabels.map((time, index) => (
          <div
            key={index}
            className='flex items-center justify-center border-b border-r border-[var(--color-border-default)] p-2'
          >
            <p className='text-body-md font-normal text-[var(--color-neutral-600)]'>
              {time}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BoxHeaders({ boxes }: { boxes: BoxColumn[] }) {
  return (
    <div
      className='sticky top-0 z-10 flex w-full border-b border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{ height: 'var(--scheduler-day-header-height)' }}
    >
      <div
        className='flex items-center justify-center border-r border-[var(--color-border-default)] bg-[var(--color-neutral-100)] px-2'
        style={{ width: 'var(--day-time-column-width)' }}
      >
        <p className='text-label-md font-medium uppercase tracking-[0.08em] text-[var(--color-neutral-600)]'>
          Box
        </p>
      </div>
      {boxes.map((box, index) => (
        <div
          key={box.id}
          className='flex flex-1 items-center justify-center px-3'
        >
          <p className='text-body-md text-center font-medium text-[var(--color-neutral-600)]'>
            {box.name_or_number}
          </p>
        </div>
      ))}
    </div>
  )
}

function DayEventCard({
  event,
  onHover,
  onLeave,
  onActivate,
  isActive,
  isHovered
}: {
  event: DayEvent
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
        'flex flex-col items-start justify-start rounded-[var(--day-event-radius)] p-[var(--day-event-padding)] text-body-sm font-normal text-[var(--color-neutral-900)] transition-all duration-150',
        stateClasses,
        isCancelled ? 'opacity-50' : ''
      ].join(' ')}
      style={{
        position: 'absolute',
        top: event.top,
        left: 'var(--day-event-left)',
        width: 'var(--day-event-width-percent)',
        height: event.height,
        backgroundColor: event.bgColor
      }}
    >
      <p className={`truncate text-left ${isCancelled ? 'line-through' : ''}`}>{event.label}</p>
      {isCancelled && (
        <span className='text-xs text-red-600 font-medium'>
          {event.status === 'cancelled' ? 'Cancelada' : 'No asistió'}
        </span>
      )}
    </button>
  )
}

function BoxColumnGrid({
  column,
  boxIndex,
  totalBoxes,
  timeLabels,
  onHover,
  onActivate,
  activeId,
  hoveredId
}: {
  column: BoxColumn
  boxIndex: number
  totalBoxes: number
  timeLabels: string[]
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  return (
    <div className='relative flex-1 border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'>
      {/* Grid lines */}
      <div
        className='absolute inset-0 grid'
        style={{
          gridTemplateRows: `repeat(${timeLabels.length}, 1fr)`
        }}
      >
        {timeLabels.map((_, index) => (
          <div
            key={index}
            className='border-b border-[var(--color-border-default)]'
          />
        ))}
      </div>
      
      {/* Events */}
      {column.events.map((event) => (
        <DayEventCard
          key={event.id}
          event={event}
          onHover={() => onHover({ event, boxIndex })}
          onLeave={() => onHover(null)}
          onActivate={() => onActivate({ event, boxIndex })}
          isActive={activeId === event.id}
          isHovered={hoveredId === event.id && activeId !== event.id}
        />
      ))}
    </div>
  )
}

function DayGrid({
  boxes,
  timeLabels,
  onHover,
  onActivate,
  activeId,
  hoveredId
}: {
  boxes: BoxColumn[]
  timeLabels: string[]
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  return (
    <div
      className='absolute flex w-full'
      style={{
        left: 'var(--day-time-column-width)',
        top: 'var(--scheduler-day-header-height)',
        width: 'calc(100% - var(--day-time-column-width))',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      {boxes.map((box, index) => (
        <BoxColumnGrid
          key={box.id}
          column={box}
          boxIndex={index}
          totalBoxes={boxes.length}
          timeLabels={timeLabels}
          onHover={onHover}
          onActivate={onActivate}
          activeId={activeId}
          hoveredId={hoveredId}
        />
      ))}
    </div>
  )
}

type DayPeriod = 'full' | 'morning' | 'afternoon'

interface DayCalendarProps {
  period?: DayPeriod
  currentDate?: Date
  clinicId?: string | null
  selectedBoxes?: string[]
  boxes?: DbBox[] // Pass boxes from parent to avoid duplicate fetching
}

export default function DayCalendar({ 
  period = 'full',
  currentDate,
  clinicId: propClinicId,
  selectedBoxes: propSelectedBoxes,
  boxes: propBoxes
}: DayCalendarProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  
  const [hovered, setHovered] = useState<DayEventSelection>(null)
  const [active, setActive] = useState<DayEventSelection>(null)
  
  // Data state
  const [clinicId, setClinicId] = useState<string | null>(propClinicId ?? null)
  const [appointments, setAppointments] = useState<DbAppointment[]>([])
  const [holds, setHolds] = useState<DbAppointmentHold[]>([])
  const [boxes, setBoxes] = useState<DbBox[]>(propBoxes ?? [])
  const [isLoading, setIsLoading] = useState(!propClinicId)
  
  // Current day
  const [displayDate] = useState<Date>(() => {
    if (currentDate) return currentDate
    return new Date()
  })

  const handleHover = (state: DayEventSelection) => {
    setHovered(state)
  }

  const handleActivate = (state: DayEventSelection) => {
    if (!state) return
    const isSame = active?.event.id === state.event.id
    setActive(isSame ? null : state)
    setHovered(isSame ? null : state)
  }

  const handleRootClick = () => {
    setActive(null)
  }

  // Sync props
  useEffect(() => {
    if (propClinicId) setClinicId(propClinicId)
  }, [propClinicId])
  
  useEffect(() => {
    if (propBoxes && propBoxes.length > 0) setBoxes(propBoxes)
  }, [propBoxes])

  // Fetch clinic and boxes on mount (only if not provided via props)
  useEffect(() => {
    async function init() {
      // Skip if we already have clinic and boxes from props
      if (propClinicId && propBoxes && propBoxes.length > 0) {
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        let cId: string | null = propClinicId ?? null
        if (!cId) {
          const { data: clinics } = await supabase.rpc('get_my_clinics')
          cId = Array.isArray(clinics) && clinics.length > 0 ? clinics[0] : null
        }
        setClinicId(cId)
        
        // Only fetch boxes if not provided via props
        if (cId && (!propBoxes || propBoxes.length === 0)) {
          const { data: boxData } = await supabase
            .from('boxes')
            .select('id, name_or_number, clinic_id')
            .eq('clinic_id', cId)
            .order('name')
          setBoxes(boxData ?? [])
        }
      } catch (error) {
        console.error('Error initializing day calendar:', error)
      }
      setIsLoading(false)
    }
    void init()
  }, [supabase, propClinicId, propBoxes])

  // Fetch appointments for the current day
  useEffect(() => {
    async function fetchAppointments() {
      if (!clinicId) return
      
      // Get start and end of day
      const dayStart = new Date(currentDate ?? displayDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      
      const startIso = dayStart.toISOString()
      const endIso = dayEnd.toISOString()
      
      // Fetch appointments with staff
      const { data: apptData } = await supabase
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
      
      setAppointments((apptData as unknown as DbAppointment[]) ?? [])
      
      // Fetch holds
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
  }, [supabase, clinicId, currentDate, displayDate])

  // Filter time labels based on period
  const getFilteredTimeLabels = () => {
    if (period === 'morning') {
      return TIME_LABELS.filter((time) => {
        const hour = parseInt(time.split(':')[0])
        return hour >= 9 && hour <= 12
      })
    } else if (period === 'afternoon') {
      return TIME_LABELS.filter((time) => {
        const hour = parseInt(time.split(':')[0])
        return hour >= 12 && hour <= 20
      })
    }
    return TIME_LABELS
  }

  const filteredTimeLabels = getFilteredTimeLabels()

  // Convert appointments to box columns
  const boxColumns = useMemo((): BoxColumn[] => {
    // Filter boxes if propSelectedBoxes is provided
    const filteredBoxes = propSelectedBoxes 
      ? boxes.filter(b => propSelectedBoxes.includes(b.id))
      : boxes
    
    // If no boxes, show placeholder
    if (filteredBoxes.length === 0) {
      return [{
        id: 'placeholder',
        name_or_number: 'Sin boxes',
        events: []
      }]
    }
    
    return filteredBoxes.map(box => {
      const events: DayEvent[] = []
      
      // Add appointments for this box
      const boxAppointments = appointments.filter(a => a.box_id === box.id)
      for (const appt of boxAppointments) {
        const patientName = appt.patients
          ? `${appt.patients.first_name} ${appt.patients.last_name}`
          : 'Paciente'
        const serviceName = appt.service_catalog?.name ?? 'Cita'
        const staffNames = appt.appointment_staff
          ?.map(as => as.staff?.full_name)
          .filter(Boolean)
          .join(', ') ?? 'Por asignar'
        
        const startTime = new Date(appt.scheduled_start_time).toLocaleTimeString(DEFAULT_LOCALE, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: DEFAULT_TIMEZONE
        })
        
        events.push({
          id: `appt-${appt.id}`,
          label: `${startTime} ${serviceName}`,
          top: timeToSlotPosition(appt.scheduled_start_time),
          height: durationToHeight(appt.scheduled_start_time, appt.scheduled_end_time),
          bgColor: APPOINTMENT_COLORS[appt.status] ?? APPOINTMENT_COLORS.default,
          status: appt.status,
          box: box.name_or_number,
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
        })
      }
      
      // Add holds for this box
      const boxHolds = holds.filter(h => h.box_id === box.id)
      for (const hold of boxHolds) {
        const patientName = hold.patients
          ? `${hold.patients.first_name} ${hold.patients.last_name}`
          : 'Pendiente confirmar'
        const serviceName = hold.service_catalog?.name ?? 'Reserva'
        
        const startTime = new Date(hold.start_time).toLocaleTimeString(DEFAULT_LOCALE, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: DEFAULT_TIMEZONE
        })
        
        events.push({
          id: `hold-${hold.id}`,
          label: `${startTime} ${serviceName} (Reserva)`,
          top: timeToSlotPosition(hold.start_time),
          height: durationToHeight(hold.start_time, hold.end_time),
          bgColor: APPOINTMENT_COLORS.hold,
          status: 'hold',
          box: box.name_or_number,
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
        })
      }
      
      return {
        id: box.id,
        name_or_number: box.name_or_number,
        events
      }
    })
  }, [boxes, appointments, holds, propSelectedBoxes])

  // Calculate min height based on filtered slots
  const minHeight = `calc(${filteredTimeLabels.length} * var(--scheduler-slot-height-half) + var(--scheduler-day-header-height))`

  const overlaySource = active
  const activeDetail = overlaySource?.event.detail

  if (isLoading) {
    return (
      <div
        className='relative flex h-full w-full items-center justify-center'
        style={{ minHeight }}
      >
        <p className='text-body-md text-neutral-500'>Cargando agenda...</p>
      </div>
    )
  }

  return (
    <div
      className='relative h-full w-full'
      style={{ minHeight }}
      onClick={handleRootClick}
    >
      <BoxHeaders boxes={boxColumns} />
      <TimeColumn timeLabels={filteredTimeLabels} />
      <DayGrid
        boxes={boxColumns}
        timeLabels={filteredTimeLabels}
        onHover={handleHover}
        onActivate={handleActivate}
        activeId={active?.event.id}
        hoveredId={hovered?.event.id}
      />

      {/* Hover overlay - Simplified detail view */}
      {hovered && !active && hovered.event.detail && (() => {
        const position = getSmartOverlayPosition(
          hovered.event.top,
          hovered.boxIndex,
          boxColumns.length,
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
          overlaySource.event.top,
          overlaySource.boxIndex,
          boxColumns.length
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
