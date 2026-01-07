'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'
import { CSSProperties, useRef, useState } from 'react'

import AppointmentDetailOverlay from './modals/AppointmentDetailOverlay'
import type { EventDetail } from './types'

const OVERLAY_GUTTER = '1rem'

// Positioning functions for smart overlay placement
function getOverlayTop(relativeTop: string): string {
  const trimmed = relativeTop.trim()
  if (trimmed.startsWith('calc(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(5, -1).trim()
    return `calc(var(--scheduler-day-header-height) + ${inner})`
  }
  return `calc(var(--scheduler-day-header-height) + ${trimmed})`
}

function getOverlayLeft(boxId: string): string {
  // Smart positioning: place overlay to the right of the box when possible
  // If box is the last one (box3), place overlay to the LEFT
  const isLastBox = boxId === 'box3'

  if (isLastBox) {
    // Place overlay to the LEFT
    // Calculate: 2/3 of the width (from left edge) - overlay width - gutter
    return `max(1rem, calc(66.67% - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER}))`
  }

  // For first and middle boxes, place overlay to the RIGHT
  // box1: starts after time column (var(--day-time-column-width)) + 1/3 width + gutter
  // box2: starts at 1/3 + 1/3 width + gutter
  if (boxId === 'box1') {
    return `calc(var(--day-time-column-width) + 33.33% + ${OVERLAY_GUTTER})`
  }

  // box2
  return `calc(var(--day-time-column-width) + 66.67% + ${OVERLAY_GUTTER})`
}

function getSmartOverlayPosition(
  relativeTop: string,
  boxId: string,
  overlayHeight: string = 'var(--scheduler-overlay-height)'
) {
  const baseTop = getOverlayTop(relativeTop)
  const baseLeft = getOverlayLeft(boxId)

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

const BOX_HEADERS = [
  { label: 'BOX 1', tone: 'neutral' as const },
  { label: 'BOX 2', tone: 'neutral' as const },
  { label: 'BOX 3', tone: 'neutral' as const }
]

const DAILY_BANDS = [
  {
    id: 'odontologo',
    label: 'Odontólogo 10:00 - 16:00',
    background: '#f0fafa'
  },
  {
    id: 'anestesista',
    label: 'Anestesista 10:00 - 16:00',
    background: '#fbe9fb'
  }
]
const DAILY_BAND_HEIGHT_REM = 2.25 // 36px ÷ 16

type DayEvent = {
  id: string
  label: string
  top: string
  bgColor: string
  height?: string
  detail?: EventDetail
  box?: string
}

type DayEventSelection = {
  event: DayEvent
  boxId: string
} | null

type BoxColumn = {
  id: string
  events: DayEvent[]
}

type TimeSlot = {
  time: string
  boxes: BoxColumn[]
}

// Helper function to create event details
function createEventDetail(title: string, box: string): EventDetail {
  return {
    title,
    date: 'Lunes, 20 de Noviembre 2025',
    duration: '12:30 - 13:00 (30 minutos)',
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

// Datos de ejemplo basados en Figma
const TIME_SLOTS: TimeSlot[] = [
  {
    time: '9:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e1',
            label: '9:30 Consulta médica',
            top: '3.9375rem', // 63px
            bgColor: 'var(--color-event-coral)',
            detail: createEventDetail('9:30 Consulta médica', 'Box 1'),
            box: 'Box 1'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '10:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e2',
            label: '13:00 Consulta médica',
            top: '3.96469rem', // 63.43px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '11:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e3',
            label: '13:00 Consulta médica',
            top: '1.11625rem', // 17.86px
            bgColor: 'var(--color-event-coral)'
          },
          {
            id: 'e4',
            label: '13:00 Consulta médica',
            top: '3.92875rem', // 62.86px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e5',
            label: '13:00 Consulta médica',
            top: '3.92875rem', // 62.86px
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      {
        id: 'box3',
        events: [
          {
            id: 'e6',
            label: '13:00 Consulta médica',
            top: '1.11625rem', // 17.86px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      }
    ]
  },
  {
    time: '12:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e7',
            label: '13:00 Consulta médica',
            top: '3.95563rem', // 63.29px
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '13:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e8',
            label: '13:00 Consulta médica',
            top: '3.91938rem', // 62.71px
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e9',
            label: '13:00 Consulta médica',
            top: '3.91938rem', // 62.71px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '14:00',
    boxes: [
      { id: 'box1', events: [] },
      { id: 'box2', events: [] },
      {
        id: 'box3',
        events: [
          {
            id: 'e10',
            label: '13:00 Consulta médica',
            top: '1.13375rem', // 18.14px
            bgColor: 'var(--color-event-purple)'
          }
        ]
      }
    ]
  },
  {
    time: '15:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e11',
            label: '15:00 Revisión ortodoncia',
            top: '2.5rem',
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e12',
            label: '15:30 Limpieza dental',
            top: '4.5rem',
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '16:00',
    boxes: [
      { id: 'box1', events: [] },
      {
        id: 'box2',
        events: [
          {
            id: 'e13',
            label: '16:00 Consulta médica',
            top: '1.5rem',
            bgColor: 'var(--color-event-teal)'
          }
        ]
      },
      {
        id: 'box3',
        events: [
          {
            id: 'e14',
            label: '16:15 Extracción',
            top: '2.8rem',
            bgColor: 'var(--color-event-coral)'
          }
        ]
      }
    ]
  },
  {
    time: '17:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e15',
            label: '17:00 Consulta médica',
            top: '1.2rem',
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      { id: 'box2', events: [] },
      {
        id: 'box3',
        events: [
          {
            id: 'e16',
            label: '17:30 Revisión',
            top: '4.8rem',
            bgColor: 'var(--color-brand-0)'
          }
        ]
      }
    ]
  },
  {
    time: '18:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e17',
            label: '18:00 Limpieza dental',
            top: '1.8rem',
            bgColor: 'var(--color-event-teal)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e18',
            label: '18:15 Consulta médica',
            top: '3.2rem',
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '19:00',
    boxes: [
      { id: 'box1', events: [] },
      {
        id: 'box2',
        events: [
          {
            id: 'e19',
            label: '19:00 Revisión ortodoncia',
            top: '2rem',
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      {
        id: 'box3',
        events: [
          {
            id: 'e20',
            label: '19:30 Consulta médica',
            top: '5rem',
            bgColor: 'var(--color-brand-0)'
          }
        ]
      }
    ]
  },
  {
    time: '20:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e21',
            label: '20:00 Última consulta',
            top: '1.5rem',
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  }
]

function TimeColumn({ timeLabels }: { timeLabels: string[] }) {
  return (
    <div
      className='absolute left-0 bg-[var(--color-neutral-100)]'
      style={{
        top: 'var(--day-offset-top)',
        width: 'var(--day-time-column-width)',
        height: 'calc(100% - var(--day-offset-top))'
      }}
    >
      <div
        className='grid h-full'
        style={{
          gridTemplateRows: `repeat(${timeLabels.length}, minmax(var(--scheduler-slot-height-half), 1fr))`
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

function BoxHeaders() {
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
      {BOX_HEADERS.map((box, index) => (
        <div
          key={index}
          className='flex flex-1 items-center justify-center px-3'
        >
          <p
            className={[
              'text-body-md text-center font-medium',
              box.tone === 'neutral'
                ? 'text-[var(--color-neutral-600)]'
                : 'text-[var(--color-neutral-900)]'
            ].join(' ')}
          >
            {box.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function DayEvent({
  event,
  onHover,
  onLeave,
  onActivate,
  isActive,
  isHovered,
  onDragStart,
  styleOverride
}: {
  event: DayEvent
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
  isActive?: boolean
  isHovered?: boolean
  onDragStart?: (e: React.MouseEvent<HTMLButtonElement>) => void
  styleOverride?: CSSProperties
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
      onMouseDown={(e) => {
        onDragStart?.(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
      className={[
        'flex items-center justify-center rounded-[var(--day-event-radius)] p-[var(--day-event-padding)] text-body-sm font-normal text-[var(--color-neutral-900)] transition-all duration-150',
        stateClasses
      ].join(' ')}
      style={{
        position: 'absolute',
        top: event.top,
        left: 'var(--day-event-left)',
        width: 'var(--day-event-width-percent)',
        height: event.height ?? 'var(--day-event-height)',
        backgroundColor: event.bgColor,
        cursor: onDragStart ? 'grab' : 'pointer',
        ...styleOverride
      }}
    >
      <p className='truncate text-center'>{event.label}</p>
    </button>
  )
}

function BoxColumn({
  column,
  onHover,
  onActivate,
  activeId,
  hoveredId,
  onDragStart,
  previewStyles
}: {
  column: BoxColumn
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
  onDragStart?: (
    selection: DayEventSelection,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void
  previewStyles?: Record<string, CSSProperties>
}) {
  return (
    <div className='relative flex-1 overflow-hidden border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'>
      {/* Eventos */}
      {column.events.map((event, idx) => (
        <DayEvent
          key={event.id || `${column.id}-${idx}`}
          event={event}
          onHover={() => onHover({ event, boxId: column.id })}
          onLeave={() => onHover(null)}
          onActivate={() => onActivate({ event, boxId: column.id })}
          isActive={activeId === event.id}
          isHovered={hoveredId === event.id && activeId !== event.id}
          onDragStart={
            onDragStart
              ? (e) => onDragStart({ event, boxId: column.id }, e)
              : undefined
          }
          styleOverride={previewStyles?.[event.id]}
        />
      ))}
    </div>
  )
}

function TimeSlotRow({
  slot,
  onHover,
  onActivate,
  activeId,
  hoveredId,
  onDragStart,
  previewStyles
}: {
  slot: TimeSlot
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
  onDragStart?: (
    selection: DayEventSelection,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void
  previewStyles?: Record<string, CSSProperties>
}) {
  return (
    <div className='flex'>
      {slot.boxes.map((box) => (
        <BoxColumn
          key={box.id}
          column={box}
          onHover={onHover}
          onActivate={onActivate}
          activeId={activeId}
          hoveredId={hoveredId}
          onDragStart={onDragStart}
          previewStyles={previewStyles}
        />
      ))}
    </div>
  )
}

function DayGrid({
  timeLabels,
  timeSlotsOverride,
  onHover,
  onActivate,
  activeId,
  hoveredId,
  onDragStart,
  previewStyles,
  gridRef
}: {
  timeLabels: string[]
  timeSlotsOverride?: TimeSlot[]
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
  onDragStart?: (
    selection: DayEventSelection,
    e: React.MouseEvent<HTMLButtonElement>
  ) => void
  previewStyles?: Record<string, CSSProperties>
  gridRef?: React.Ref<HTMLDivElement>
}) {
  // Filtrar slots según los horarios visibles
  const sourceSlots = timeSlotsOverride ?? TIME_SLOTS
  const filteredSlots = sourceSlots.filter((slot) =>
    timeLabels.includes(slot.time)
  )

  return (
    <div
      className='absolute w-full'
      ref={gridRef}
      style={{
        left: 'var(--day-time-column-width)',
        top: 'var(--day-offset-top)',
        width: 'calc(100% - var(--day-time-column-width))',
        height: 'calc(100% - var(--day-offset-top))'
      }}
    >
      {/* Rejilla de líneas cada 30 minutos (misma que vista semanal) */}
      <div className='pointer-events-none absolute inset-0 z-[1]'>
        <div
          className='grid h-full'
          style={{
            gridTemplateRows: `repeat(${timeLabels.length}, minmax(var(--scheduler-slot-height-half), 1fr))`
          }}
        >
          {timeLabels.map((_, index) => (
            <div
              key={index}
              className='border-b border-[var(--color-border-default)]'
            />
          ))}
        </div>
      </div>

      <div
        className='grid h-full'
        style={{
          gridTemplateRows: `repeat(${filteredSlots.length}, 1fr)`
        }}
      >
        {filteredSlots.map((slot, index) => (
          <TimeSlotRow
            key={index}
            slot={slot}
            onHover={onHover}
            onActivate={onActivate}
            activeId={activeId}
            hoveredId={hoveredId}
            onDragStart={onDragStart}
            previewStyles={previewStyles}
          />
        ))}
      </div>
    </div>
  )
}

type DayPeriod = 'full' | 'morning' | 'afternoon'

type ExternalAppointment = {
  id: string
  start: string // 'HH:MM'
  end: string // 'HH:MM'
  patient?: string
  title?: string
  box?: string
  bgColor?: string
}

// Tipo para bandas de profesionales dinámicas
export type DayBand = {
  id: string
  label: string
  background: string
}

interface DayCalendarProps {
  period?: DayPeriod
  appointments?: ExternalAppointment[]
  dateLabel?: string
  bands?: DayBand[] // Bandas de profesionales para el día
  onAppointmentMove?: (payload: {
    id: string
    start: string
    end: string
    box: string
  }) => void
}

function timeToMinutes(time: string): number {
  const [hh, mm] = time.split(':').map(Number)
  return hh * 60 + mm
}

function buildEventsFromAppointments(
  appointments: ExternalAppointment[]
): TimeSlot[] {
  if (!appointments.length) return TIME_SLOTS

  const slotHeight = 'var(--scheduler-slot-height-half)'
  const dayStartMinutes = 9 * 60 // 9:00 base in current grid

  // Helper to map appointment box to internal boxId
  const getBoxId = (apptBox: string | undefined, index: number): string => {
    if (apptBox) {
      const lower = apptBox.toLowerCase()
      if (lower.includes('1')) return 'box1'
      if (lower.includes('2')) return 'box2'
      if (lower.includes('3')) return 'box3'
    }
    // Fallback: round-robin
    return index % 3 === 0 ? 'box1' : index % 3 === 1 ? 'box2' : 'box3'
  }

  // Helper to get the time slot key (e.g., "9:00", "9:30")
  const getTimeSlotKey = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}:${m === 0 ? '00' : '30'}`
  }

  // Group events by their starting time slot
  const eventsBySlot: Record<string, Record<string, DayEvent[]>> = {}

  // Initialize all slots with empty boxes
  TIME_LABELS.forEach((time) => {
    eventsBySlot[time] = {
      box1: [],
      box2: [],
      box3: []
    }
  })

  // Sort by start time
  const sorted = [...appointments].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
  )

  sorted.forEach((appt, index) => {
    const startMin = timeToMinutes(appt.start)
    const endMin = timeToMinutes(appt.end)
    const durationMin = Math.max(30, endMin - startMin)
    const heightUnits = durationMin / 30

    // Find the slot this event belongs to
    const slotKey = getTimeSlotKey(startMin)

    // Calculate top offset within the slot (should be 0 for events starting at slot time)
    const slotStartMin = Math.floor(startMin / 30) * 30
    const offsetWithinSlot = (startMin - slotStartMin) / 30
    const top = `calc(${offsetWithinSlot} * ${slotHeight})`
    const height = `calc(${heightUnits} * ${slotHeight})`

    // Use the box from the appointment or fallback to round-robin
    const boxId = getBoxId(appt.box, index)

    // Create label with title AND patient name (like weekly view)
    const title = appt.title ?? 'Consulta'
    const patient = appt.patient ?? ''
    const label = patient ? `${title}\n${patient}` : `${appt.start} ${title}`

    const event: DayEvent = {
      id: appt.id,
      label,
      top,
      bgColor: appt.bgColor ?? 'var(--color-event-purple)',
      detail: createEventDetail(`${appt.start} ${title}`, appt.box ?? 'Box 1'),
      box: appt.box ?? boxId,
      height
    }

    // Add event to the correct slot and box
    if (eventsBySlot[slotKey]) {
      eventsBySlot[slotKey][boxId].push(event)
    }
  })

  // Build time slots with proper structure
  return TIME_LABELS.map((time) => ({
    time,
    boxes: [
      { id: 'box1', events: eventsBySlot[time]?.box1 || [] },
      { id: 'box2', events: eventsBySlot[time]?.box2 || [] },
      { id: 'box3', events: eventsBySlot[time]?.box3 || [] }
    ]
  }))
}

export default function DayCalendar({
  period = 'full',
  appointments = [],
  dateLabel,
  bands = DAILY_BANDS,
  onAppointmentMove
}: DayCalendarProps) {
  const [hovered, setHovered] = useState<DayEventSelection>(null)
  const [active, setActive] = useState<DayEventSelection>(null)
  const [previewStyles, setPreviewStyles] = useState<
    Record<string, CSSProperties>
  >({})
  const gridRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{
    id: string
    spanSlots: number
    offsetY: number
  } | null>(null)

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

  // Filtrar horarios según el período seleccionado
  const getFilteredTimeLabels = () => {
    if (period === 'morning') {
      // Mañana: 9:00 - 12:00 (incluye 12:00)
      return TIME_LABELS.filter((time) => {
        const hour = parseInt(time.split(':')[0])
        return hour >= 9 && hour <= 12
      })
    } else if (period === 'afternoon') {
      // Tarde: 12:00 - 20:00
      return TIME_LABELS.filter((time) => {
        const hour = parseInt(time.split(':')[0])
        return hour >= 12 && hour <= 20
      })
    }
    // Día completo: 9:00 - 20:00
    return TIME_LABELS
  }

  const filteredTimeLabels = getFilteredTimeLabels()
  const timeSlots = appointments.length
    ? buildEventsFromAppointments(appointments)
    : TIME_SLOTS

  const clampSlot = (value: number, span: number) =>
    Math.max(0, Math.min(value, filteredTimeLabels.length - span))

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const handleDragStart = (
    selection: DayEventSelection,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!selection) return
    const grid = gridRef.current
    if (!grid) return

    const gridRect = grid.getBoundingClientRect()
    const slotHeight = gridRect.height / filteredTimeLabels.length
    if (slotHeight <= 0) return

    const targetRect = (
      e.currentTarget as HTMLButtonElement
    ).getBoundingClientRect()
    const spanSlots = Math.max(1, targetRect.height / slotHeight)
    const offsetY = e.clientY - targetRect.top

    dragState.current = {
      id: selection.event.id,
      spanSlots,
      offsetY
    }

    const handleMove = (ev: MouseEvent) => {
      if (!dragState.current) return
      const { id, spanSlots, offsetY } = dragState.current
      const relY = ev.clientY - gridRect.top - offsetY
      const slotHeightPx = slotHeight
      const slotIndex = clampSlot(
        Math.round(relY / slotHeightPx),
        Math.ceil(spanSlots)
      )

      const topPx = slotIndex * slotHeightPx
      setPreviewStyles({
        [id]: {
          top: `${topPx}px`
        }
      })
    }

    const handleUp = (ev: MouseEvent) => {
      if (!dragState.current) return
      const { id, spanSlots, offsetY } = dragState.current
      const relY = ev.clientY - gridRect.top - offsetY
      const slotIndex = clampSlot(
        Math.round(relY / (gridRect.height / filteredTimeLabels.length)),
        Math.ceil(spanSlots)
      )
      const startMinutes = 9 * 60 + slotIndex * 30
      const endMinutes = startMinutes + Math.max(1, Math.round(spanSlots)) * 30

      // Determinar box por posición X dentro de la grilla (3 boxes)
      const boxWidth = gridRect.width / 3
      const relX = ev.clientX - gridRect.left
      const boxIndex = Math.max(
        0,
        Math.min(2, Math.floor(relX / Math.max(boxWidth, 1)))
      )
      const targetBox = BOX_HEADERS[boxIndex]?.label ?? 'BOX 1'

      if (onAppointmentMove) {
        onAppointmentMove({
          id,
          start: minutesToTime(startMinutes),
          end: minutesToTime(endMinutes),
          box: targetBox
        })
      }

      setPreviewStyles({})
      dragState.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp, { once: true })
  }

  // Altura mínima basada en la jornada completa para que los segmentos puedan expandirse
  const bandsTotalHeight = `${bands.length * DAILY_BAND_HEIGHT_REM}rem`
  const dayOffsetTop = `calc(var(--scheduler-day-header-height) + ${bandsTotalHeight})`
  const fullDayHeight = `calc(${TIME_LABELS.length} * var(--scheduler-slot-height-half) + var(--scheduler-day-header-height) + ${bandsTotalHeight})`

  const overlaySource = active
  const activeDetail = overlaySource?.event.detail

  return (
    <div
      className='relative h-full w-full'
      style={
        {
          minHeight: fullDayHeight,
          '--day-bands-height': bandsTotalHeight,
          '--day-offset-top': dayOffsetTop
        } as CSSProperties
      }
      onClick={handleRootClick}
    >
      <BoxHeaders />
      <div
        className='absolute left-0 top-[var(--scheduler-day-header-height)] z-[2] flex w-full flex-col'
        style={{
          height: bandsTotalHeight
        }}
        aria-hidden
      >
        {bands.map((band) => (
          <div key={band.id} className='flex h-[2.25rem] w-full'>
            <div
              className='shrink-0'
              style={{
                width: 'var(--day-time-column-width)',
                backgroundColor: 'var(--color-neutral-100)'
              }}
            />
            <div
              className='flex flex-1 items-center justify-center px-[0.5rem]'
              style={{ backgroundColor: band.background }}
            >
              <p className='text-[0.875rem] leading-[1.25rem] text-[#24282c] text-center whitespace-nowrap'>
                {band.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <TimeColumn timeLabels={filteredTimeLabels} />
      <DayGrid
        timeLabels={filteredTimeLabels}
        timeSlotsOverride={timeSlots}
        onHover={handleHover}
        onActivate={handleActivate}
        activeId={active?.event.id}
        hoveredId={hovered?.event.id}
        onDragStart={handleDragStart}
        previewStyles={previewStyles}
        gridRef={gridRef}
      />

      {/* Hover overlay - Simplified detail view */}
      {hovered &&
        !active &&
        hovered.event.detail &&
        (() => {
          const position = getSmartOverlayPosition(
            hovered.event.top,
            hovered.boxId,
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
                    <MD3Icon
                      name='CalendarMonthRounded'
                      size={1}
                      className='text-[var(--color-neutral-600)]'
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
                    <MD3Icon
                      name='AccountCircleRounded'
                      size={1}
                      className='text-[var(--color-neutral-600)]'
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
                    <MD3Icon
                      name='MonitorHeartRounded'
                      size={1}
                      className='text-[var(--color-neutral-600)]'
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
      {overlaySource &&
        activeDetail &&
        (() => {
          const position = getSmartOverlayPosition(
            overlaySource.event.top,
            overlaySource.boxId
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
