'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import { useState } from 'react'

import AppointmentDetailOverlay from './AppointmentDetailOverlay'
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

type DayEvent = {
  id: string
  label: string
  top: string
  bgColor: string
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
      className='absolute left-0 flex flex-col bg-[var(--color-neutral-100)]'
      style={{
        top: 'var(--scheduler-day-header-height)',
        width: 'var(--day-time-column-width)',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      {timeLabels.map((time, index) => (
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
        'flex items-center justify-center rounded-[var(--day-event-radius)] p-[var(--day-event-padding)] text-body-sm font-normal text-[var(--color-neutral-900)] transition-all duration-150',
        stateClasses
      ].join(' ')}
      style={{
        position: 'absolute',
        top: event.top,
        left: 'var(--day-event-left)',
        width: 'var(--day-event-width-percent)',
        height: 'var(--day-event-height)',
        backgroundColor: event.bgColor
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
  hoveredId
}: {
  column: BoxColumn
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  return (
    <div className='relative flex-1 overflow-hidden border-b border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'>
      {column.events.map((event) => (
        <DayEvent
          key={event.id}
          event={event}
          onHover={() => onHover({ event, boxId: column.id })}
          onLeave={() => onHover(null)}
          onActivate={() => onActivate({ event, boxId: column.id })}
          isActive={activeId === event.id}
          isHovered={hoveredId === event.id && activeId !== event.id}
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
  hoveredId
}: {
  slot: TimeSlot
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  return (
    <div className='flex flex-1'>
      {slot.boxes.map((box) => (
        <BoxColumn
          key={box.id}
          column={box}
          onHover={onHover}
          onActivate={onActivate}
          activeId={activeId}
          hoveredId={hoveredId}
        />
      ))}
    </div>
  )
}

function DayGrid({
  timeLabels,
  onHover,
  onActivate,
  activeId,
  hoveredId
}: {
  timeLabels: string[]
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
}) {
  // Filtrar slots según los horarios visibles
  const filteredSlots = TIME_SLOTS.filter((slot) => timeLabels.includes(slot.time))

  return (
    <div
      className='absolute flex w-full flex-col'
      style={{
        left: 'var(--day-time-column-width)',
        top: 'var(--scheduler-day-header-height)',
        width: 'calc(100% - var(--day-time-column-width))',
        height: 'calc(100% - var(--scheduler-day-header-height))'
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
        />
      ))}
    </div>
  )
}

type DayPeriod = 'full' | 'morning' | 'afternoon'

interface DayCalendarProps {
  period?: DayPeriod
}

export default function DayCalendar({ period = 'full' }: DayCalendarProps) {
  const [hovered, setHovered] = useState<DayEventSelection>(null)
  const [active, setActive] = useState<DayEventSelection>(null)

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

  // Calcular altura mínima basada en slots filtrados
  const minHeight = `calc(${filteredTimeLabels.length} * var(--scheduler-slot-height-half) + var(--scheduler-day-header-height))`

  const overlaySource = active
  const activeDetail = overlaySource?.event.detail

  return (
    <div
      className='relative h-full w-full'
      style={{ minHeight }}
      onClick={handleRootClick}
    >
      <BoxHeaders />
      <TimeColumn timeLabels={filteredTimeLabels} />
      <DayGrid
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

