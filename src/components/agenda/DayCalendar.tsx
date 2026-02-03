'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import RegisterPaymentModal from '@/components/pacientes/modals/patient-record/RegisterPaymentModal'
import { useRouter } from 'next/navigation'
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import Portal from '@/components/ui/Portal'
import { useAppointments } from '@/context/AppointmentsContext'
import { useConfiguration } from '@/context/ConfigurationContext'
import AgendaBlockCard from './AgendaBlockCard'
import AppointmentContextMenu, {
  type ContextMenuAction
} from './AppointmentContextMenu'
import AppointmentDetailOverlay from './modals/AppointmentDetailOverlay'
import SlotDragSelection, {
  getSelectionBounds,
  type SlotDragState
} from './SlotDragSelection'
import TimeIndicator, { slotIndexToTime } from './TimeIndicator'
import type { EventDetail, VisitStatus } from './types'
import { VISIT_STATUS_CONFIG } from './types'
import VisitStatusMenu from './VisitStatusMenu'

const OVERLAY_GUTTER = '1rem'

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
  timeColumnWidth = 'var(--day-time-column-width)'
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

// Constantes para el sistema de drag (EXACTAMENTE IGUALES a vista semanal)
const FULL_START_HOUR = 9
const FULL_END_HOUR = 20
const MINUTES_STEP = 15 // Misma granularidad que vista semanal (15 min)
const SLOTS_PER_HOUR = 60 / MINUTES_STEP // 4 slots por hora (cada 15 min)
const SLOT_REM = 2.5 // Mismo valor que vista semanal: var(--scheduler-slot-height-quarter)

// Configuración de períodos del día
type DayPeriodType = 'full' | 'morning' | 'afternoon'

const PERIOD_CONFIG: Record<
  DayPeriodType,
  { startHour: number; endHour: number }
> = {
  full: { startHour: 9, endHour: 20 }, // 9:00 - 20:00 (11 horas)
  morning: { startHour: 9, endHour: 14 }, // 9:00 - 14:00 (5 horas)
  afternoon: { startHour: 14, endHour: 20 } // 14:00 - 20:00 (6 horas)
}

// Función helper para obtener configuración del período
function getPeriodConfig(period: DayPeriodType) {
  const config = PERIOD_CONFIG[period]
  const totalSlots = (config.endHour - config.startHour) * SLOTS_PER_HOUR
  return {
    ...config,
    totalSlots,
    // Offset para convertir posiciones absolutas (desde las 9:00) a relativas al período
    slotOffset: (config.startHour - FULL_START_HOUR) * SLOTS_PER_HOUR
  }
}

// Constantes por defecto (para compatibilidad)
const START_HOUR = FULL_START_HOUR
const END_HOUR = FULL_END_HOUR
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR // 44 slots
// Altura de cada fila de 30 minutos en la cuadrícula visual
const VISUAL_SLOT_HEIGHT_REM = 5 // var(--scheduler-slot-height-half)

type BoxId = 'box1' | 'box2' | 'box3'

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

// Default box headers - will be overridden by ConfigurationContext
const DEFAULT_BOX_HEADERS = [
  { id: 'box-1', label: 'BOX 1', tone: 'neutral' as const },
  { id: 'box-2', label: 'BOX 2', tone: 'neutral' as const },
  { id: 'box-3', label: 'BOX 3', tone: 'neutral' as const }
]

// Helper to convert box id to box name (e.g., 'box-1' -> 'box 1')
const boxIdToName = (boxId: string): string => boxId.replace('-', ' ')

// Function to calculate dynamic box layout based on selected boxes
const getBoxLayout = (
  selectedBoxes: string[],
  boxHeaders: typeof DEFAULT_BOX_HEADERS = DEFAULT_BOX_HEADERS
): Record<string, { left: string; width: string }> => {
  // Filter to only include boxes that exist in boxHeaders
  const validBoxes = selectedBoxes.filter((id) =>
    boxHeaders.some((opt) => opt.id === id)
  )

  if (validBoxes.length === 0) {
    // Default 3-box layout
    return {
      'box 1': { left: '0%', width: '33.33%' },
      'box 2': { left: '33.33%', width: '33.33%' },
      'box 3': { left: '66.67%', width: '33.33%' }
    }
  }

  const boxWidth = 100 / validBoxes.length

  const layout: Record<string, { left: string; width: string }> = {}

  validBoxes.forEach((boxId, index) => {
    const boxName = boxIdToName(boxId)
    const left = index * boxWidth
    layout[boxName] = {
      left: `${left}%`,
      width: `${boxWidth}%`
    }
  })

  return layout
}

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
  completed?: boolean // Indica si la cita ya se ha realizado
  confirmed?: boolean // Indica si el paciente confirmó la cita
  visitStatus?: VisitStatus // Estado de visita del paciente
  createdByVoiceAgent?: boolean // Indica si fue creada por el agente de voz (IA)
  voiceAgentCallId?: string // ID de la llamada vinculada
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

function TimeColumn({ period = 'full' }: { period?: DayPeriodType }) {
  const periodConfig = getPeriodConfig(period)
  const { startHour, totalSlots } = periodConfig

  return (
    <div
      className='absolute left-0 z-[5] bg-[var(--color-neutral-100)]'
      style={{
        top: 'var(--day-offset-top)',
        width: 'var(--day-time-column-width)',
        height: `calc(${totalSlots} * var(--scheduler-slot-height-quarter))`
      }}
    >
      <div
        className='grid h-full overflow-visible'
        style={{
          gridTemplateRows: `repeat(${totalSlots}, var(--scheduler-slot-height-quarter))`
        }}
      >
        {Array.from({ length: totalSlots }).map((_, index) => {
          const isFirstCell = index === 0
          const isHourBorder = (index + 1) % SLOTS_PER_HOUR === 0

          const hourAtBorder = startHour + (index + 1) / SLOTS_PER_HOUR
          const timeLabel = isFirstCell
            ? `${startHour}:00`
            : `${hourAtBorder}:00`

          return (
            <div
              key={index}
              className='relative flex items-end justify-center overflow-visible border-r border-[var(--color-border-default)]'
            >
              {isFirstCell && (
                <p
                  className='absolute left-1/2 z-10 text-body-md font-normal text-[var(--color-neutral-600)]'
                  style={{
                    top: 0,
                    transform: 'translate(-50%, 0)'
                  }}
                >
                  {timeLabel}
                </p>
              )}
              {isHourBorder && (
                <p
                  className='absolute left-1/2 z-10 text-body-md font-normal text-[var(--color-neutral-600)]'
                  style={{
                    bottom: 0,
                    transform: 'translate(-50%, 50%)'
                  }}
                >
                  {timeLabel}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BoxHeaders({
  visibleBoxes
}: {
  visibleBoxes: typeof DEFAULT_BOX_HEADERS
}) {
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
      {visibleBoxes.map((box, index) => (
        <div
          key={box.id}
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

// Función auxiliar para convertir altura a px (igual que vista semanal)
const parseDimensionToPx = (value?: string | number): number => {
  if (typeof value === 'number') return value
  if (!value) return 0
  const trimmed = value.trim()
  const num = parseFloat(trimmed)
  if (Number.isNaN(num)) return 0
  if (trimmed.endsWith('rem')) return num * 16
  return num
}

// Altura mínima para mostrar notas (igual que vista semanal)
const MIN_HEIGHT_FOR_NOTES_PX = 120

// Estilos para clamp de texto (igual que vista semanal)
const clampStyle = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  } as const)

function DayEvent({
  event,
  onHover,
  onLeave,
  onActivate,
  isActive,
  isHovered,
  isDragging,
  onDragStart,
  onResizeStart,
  styleOverride,
  onToggleComplete,
  onContextMenu,
  onVisitStatusChange
}: {
  event: DayEvent
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
  isActive?: boolean
  isHovered?: boolean
  isDragging?: boolean
  onDragStart?: (e: React.MouseEvent<HTMLElement>) => void
  onResizeStart?: (e: React.MouseEvent<HTMLElement>) => void
  styleOverride?: CSSProperties
  onToggleComplete?: (eventId: string, completed: boolean) => void
  onContextMenu?: (e: React.MouseEvent<HTMLElement>, event: DayEvent) => void
  onVisitStatusChange?: (eventId: string, newStatus: VisitStatus) => void
}) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calcular posición del menú cuando se abre
  useEffect(() => {
    if (isStatusMenuOpen && indicatorRef.current) {
      const rect = indicatorRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.top,
        left: rect.right + 8 // 8px de margen
      })
    }
  }, [isStatusMenuOpen])

  // Cerrar menú al hacer clic fuera (del indicador Y del menú)
  useEffect(() => {
    if (!isStatusMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideIndicator = indicatorRef.current?.contains(target)
      const isInsideMenu = menuRef.current?.contains(target)

      if (!isInsideIndicator && !isInsideMenu) {
        setIsStatusMenuOpen(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStatusMenuOpen])

  // Calcular si hay suficiente altura para mostrar notas (igual que vista semanal)
  const canShowNotes =
    parseDimensionToPx(event.height) >= MIN_HEIGHT_FOR_NOTES_PX
  const isCompleted = event.completed ?? false
  const isConfirmed = event.confirmed ?? false

  // Estado de visita actual (default: 'scheduled')
  const visitStatus: VisitStatus = event.visitStatus ?? 'scheduled'
  const statusConfig = VISIT_STATUS_CONFIG[visitStatus]

  // Animación pulsante para estado "Llamar"
  const isPulsing = visitStatus === 'call_patient'

  // Determinar si es cita creada por agente de voz (IA)
  const isVoiceAgentAppointment = event.createdByVoiceAgent === true

  // Estados de borde/sombra - Rosa para IA, Azul para confirmadas
  const stateClasses = isActive
    ? 'border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-[var(--color-brand-500)]'
    : isVoiceAgentAppointment
    ? 'border-[#EC4899] border-2 shadow-[0_0_0_1px_rgba(236,72,153,0.2)]'
    : isConfirmed
    ? 'border-[#3B82F6] shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
    : 'border-[var(--color-border)]'

  // Separar título y paciente del label
  const labelParts = event.label.split('\n')
  const title = labelParts[0] ?? ''
  const patient = labelParts[1] ?? ''

  return (
    <>
      <button
        type='button'
        data-appointment-card='true'
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        onClick={(e) => {
          e.stopPropagation()
          onActivate()
        }}
        onMouseDown={(e) => {
          // Solo iniciar drag si no es el handle de resize
          const target = e.target as HTMLElement
          if (!target.closest('[data-resize-handle]')) {
            onDragStart?.(e)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onActivate()
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu?.(e, event)
        }}
        className={[
          // Clases idénticas a AppointmentSummaryCard (sin text-body-sm ni font-normal que interfieren)
          'group/daycard absolute flex flex-col gap-[var(--scheduler-event-gap)] overflow-hidden rounded-[var(--radius-lg)] border p-[var(--scheduler-event-padding)] text-left shadow-[0px_1px_2px_rgba(36,40,44,0.08)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] active:brightness-[0.98]',
          stateClasses,
          isCompleted ? 'opacity-70' : ''
        ].join(' ')}
        style={{
          top: event.top,
          left: 'var(--day-event-left)',
          width: 'var(--day-event-width-percent)',
          height: event.height ?? 'var(--day-event-height)',
          backgroundColor: event.bgColor,
          cursor: isDragging ? 'grabbing' : onDragStart ? 'grab' : 'pointer',
          zIndex: isDragging ? 50 : undefined,
          // Efecto de drag idéntico a AppointmentSummaryCard
          opacity: isDragging ? 0.88 : isCompleted ? 0.7 : 1,
          transform: isDragging ? 'scale(1.02)' : 'none',
          ...styleOverride
        }}
        aria-pressed={isActive}
      >
        {/* Indicador de estado de visita - borde izquierdo */}
        <div
          ref={indicatorRef}
          className='absolute left-0 top-0 bottom-0 z-10'
          onMouseDown={(e) => {
            // Prevenir que el mousedown inicie el drag selection del grid
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (onVisitStatusChange) {
              setIsStatusMenuOpen(!isStatusMenuOpen)
            }
          }}
          onKeyDown={(e) => {
            if (onVisitStatusChange && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              e.stopPropagation()
              setIsStatusMenuOpen(!isStatusMenuOpen)
            }
          }}
          role={onVisitStatusChange ? 'button' : 'presentation'}
          tabIndex={onVisitStatusChange ? 0 : -1}
          aria-label={`Estado: ${statusConfig.label}${
            onVisitStatusChange ? '. Clic para cambiar' : ''
          }`}
          aria-haspopup={onVisitStatusChange ? 'menu' : undefined}
          aria-expanded={onVisitStatusChange ? isStatusMenuOpen : undefined}
        >
          <div
            className={[
              'h-full w-[4px] rounded-l-[var(--radius-lg)] transition-all duration-200',
              onVisitStatusChange && 'cursor-pointer hover:w-[6px]',
              isPulsing && 'animate-pulse'
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              backgroundColor: statusConfig.color,
              boxShadow: isPulsing ? `0 0 8px ${statusConfig.color}` : undefined
            }}
          />
        </div>

        {/* Contenido idéntico a AppointmentSummaryCard */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 flex-1 flex-col gap-[0.375rem]'>
            {/* Nombre del paciente - Negrita */}
            {patient && (
              <div className='flex items-center gap-1.5'>
                {/* Indicador de cita creada por agente de voz (IA) */}
                {isVoiceAgentAppointment && (
                  <span
                    className='inline-flex shrink-0 items-center justify-center rounded bg-[var(--color-event-ai-bg)] px-1 py-0.5 text-[0.5rem] font-bold text-[var(--color-event-ai)]'
                    title='Cita creada por agente de voz'
                  >
                    <span className='material-symbols-rounded text-xs mr-0.5'>
                      smart_toy
                    </span>
                    IA
                  </span>
                )}
                <p
                  className='font-bold text-[var(--color-neutral-900)]'
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                    ...clampStyle(1)
                  }}
                >
                  {patient}
                </p>
              </div>
            )}
            {/* Tratamiento - Cursiva */}
            <p
              className='font-normal italic text-[var(--color-neutral-700)]'
              style={{
                fontSize: '0.75rem',
                lineHeight: '1rem',
                ...clampStyle(1)
              }}
            >
              {title}
            </p>
            {/* Notas - Solo se muestran si hay suficiente altura */}
            {event.detail && canShowNotes && event.detail.notes && (
              <p
                className='font-normal text-[var(--color-neutral-600)]'
                style={{
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  ...clampStyle(2)
                }}
              >
                {event.detail.notes}
              </p>
            )}
          </div>
        </div>

        {/* Drag overlay - inicia el drag desde cualquier punto de la tarjeta (excepto indicador de estado) */}
        {onDragStart && (
          <div
            className={`absolute top-0 right-0 bottom-0 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ left: '6px' }} // No cubrir el indicador de estado de visita
            onMouseDown={(e) => {
              e.stopPropagation()
              onDragStart(e)
            }}
            aria-hidden
          />
        )}

        {/* Handle de resize en la parte inferior - idéntico a AppointmentSummaryCard */}
        {onResizeStart && (
          <div
            data-resize-handle='true'
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e)
            }}
            className='absolute bottom-0 left-0 right-0 h-2 cursor-s-resize'
            aria-hidden
          />
        )}
      </button>

      {/* Menú de selección de estado - renderizado via Portal fuera del button */}
      {isStatusMenuOpen && onVisitStatusChange && menuPosition && (
        <Portal>
          <div
            ref={menuRef}
            className='fixed z-[9999]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <VisitStatusMenu
              currentStatus={visitStatus}
              onSelect={(newStatus) => {
                onVisitStatusChange(event.id, newStatus)
                setIsStatusMenuOpen(false)
              }}
              onClose={() => setIsStatusMenuOpen(false)}
            />
          </div>
        </Portal>
      )}
    </>
  )
}

function BoxColumnComponent({
  column,
  onHover,
  onActivate,
  activeId,
  hoveredId,
  draggingId,
  onEventDragStart,
  columnRef
}: {
  column: BoxColumn
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
  draggingId?: string | null
  onEventDragStart?: (
    type: 'move' | 'resize',
    event: DayEvent,
    boxId: BoxId,
    clientX: number,
    clientY: number
  ) => void
  columnRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={columnRef}
      className='relative flex-1 overflow-hidden border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'
    >
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
          isDragging={draggingId === event.id}
          onDragStart={
            onEventDragStart
              ? (e) =>
                  onEventDragStart(
                    'move',
                    event,
                    column.id as BoxId,
                    e.clientX,
                    e.clientY
                  )
              : undefined
          }
          onResizeStart={
            onEventDragStart
              ? (e) =>
                  onEventDragStart(
                    'resize',
                    event,
                    column.id as BoxId,
                    e.clientX,
                    e.clientY
                  )
              : undefined
          }
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
  draggingId,
  onEventDragStart,
  boxRefs
}: {
  slot: TimeSlot
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
  draggingId?: string | null
  onEventDragStart?: (
    type: 'move' | 'resize',
    event: DayEvent,
    boxId: BoxId,
    clientX: number,
    clientY: number
  ) => void
  boxRefs?: React.MutableRefObject<Record<BoxId, HTMLDivElement | null>>
}) {
  return (
    <div className='flex'>
      {slot.boxes.map((box) => (
        <BoxColumnComponent
          key={box.id}
          column={box}
          onHover={onHover}
          onActivate={onActivate}
          activeId={activeId}
          hoveredId={hoveredId}
          draggingId={draggingId}
          onEventDragStart={onEventDragStart}
          columnRef={
            boxRefs
              ? (el) => {
                  boxRefs.current[box.id as BoxId] = el
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}

// Type for visual block in day view
type DayBlock = {
  id: string
  top: string
  height: string
  blockType: import('@/context/AppointmentsContext').BlockType
  description: string
  box?: string
  timeRange: string
  responsibleName?: string
  isRecurring?: boolean
  parentBlockId?: string
}

function DayGrid({
  timeLabels,
  timeSlotsOverride,
  onHover,
  onActivate,
  activeId,
  hoveredId,
  draggingId,
  onEventDragStart,
  gridRef,
  boxRefs,
  selectedBoxes,
  boxLayout,
  boxCount,
  visibleSlotCount,
  selectedProfessionals,
  completedEvents,
  confirmedEvents,
  onToggleComplete,
  onEventContextMenu,
  visitStatusMap,
  onVisitStatusChange,
  showConfirmedOnly = false,
  showAIOnly = false,
  blocks = [],
  onEditBlock,
  onDeleteBlock,
  activeBlockId,
  hoveredBlockId,
  onBlockHover,
  onBlockActivate,
  // Quick appointment creation props
  hoverSlotIndex,
  onHoverSlotChange,
  slotDragState,
  onSlotDragStart,
  onSlotDragMove,
  onSlotDragEnd,
  // Period prop
  period = 'full'
}: {
  timeLabels: string[]
  timeSlotsOverride?: TimeSlot[]
  onHover: (selection: DayEventSelection) => void
  onActivate: (selection: DayEventSelection) => void
  activeId?: string | null
  hoveredId?: string | null
  draggingId?: string | null
  onEventDragStart?: (
    type: 'move' | 'resize',
    event: DayEvent,
    boxId: BoxId,
    clientX: number,
    clientY: number
  ) => void
  gridRef?: React.Ref<HTMLDivElement>
  boxRefs?: React.MutableRefObject<Record<BoxId, HTMLDivElement | null>>
  selectedBoxes: string[]
  boxLayout: Record<string, { left: string; width: string }>
  boxCount: number
  visibleSlotCount: number // Número de slots de 30 min visibles según el período
  selectedProfessionals: string[]
  completedEvents?: Record<string, boolean>
  confirmedEvents?: Record<string, boolean>
  onToggleComplete?: (eventId: string, completed: boolean) => void
  onEventContextMenu?: (
    e: React.MouseEvent<HTMLElement>,
    event: DayEvent
  ) => void
  visitStatusMap?: Record<string, VisitStatus>
  onVisitStatusChange?: (eventId: string, newStatus: VisitStatus) => void
  showConfirmedOnly?: boolean
  showAIOnly?: boolean // Filter for AI-created appointments
  // Block-related props
  blocks?: DayBlock[]
  onEditBlock?: (blockId: string) => void
  onDeleteBlock?: (blockId: string, deleteRecurrence?: boolean) => void
  activeBlockId?: string | null
  hoveredBlockId?: string | null
  onBlockHover?: (blockId: string | null) => void
  onBlockActivate?: (blockId: string | null) => void
  // Quick appointment creation props
  hoverSlotIndex?: number | null
  onHoverSlotChange?: (slotIndex: number | null, boxId: string) => void
  slotDragState?: SlotDragState | null
  onSlotDragStart?: (slotIndex: number, boxId: string, clientY: number) => void
  onSlotDragMove?: (slotIndex: number) => void
  onSlotDragEnd?: () => void
  // Period prop
  period?: DayPeriodType
}) {
  // Get period configuration
  const periodConfig = getPeriodConfig(period)
  const {
    totalSlots: periodTotalSlots,
    startHour: periodStartHour,
    slotOffset,
    endHour: periodEndHour
  } = periodConfig
  // Filtrar slots según los horarios visibles
  const sourceSlots = timeSlotsOverride ?? TIME_SLOTS

  // Helper: extraer el slot desde el valor top (ej: "10rem" -> 4)
  const getSlotFromTop = (top: string): number => {
    const match = top.match(/^([\d.]+)rem$/)
    if (match) {
      return parseFloat(match[1]) / SLOT_REM
    }
    return 0
  }

  // Helper: check if event is within period time range
  const isEventInPeriod = (event: DayEvent): boolean => {
    if (period === 'full') return true
    const eventSlot = getSlotFromTop(event.top)
    // Event slot is relative to FULL_START_HOUR (9:00)
    // slotOffset is the offset from 9:00 to period start
    return eventSlot >= slotOffset && eventSlot < slotOffset + periodTotalSlots
  }

  // Helper: adjust event top position for period
  const adjustEventTopForPeriod = (top: string): string => {
    if (period === 'full') return top
    const match = top.match(/^([\d.]+)rem$/)
    if (match) {
      const originalRem = parseFloat(match[1])
      // Subtract the offset to make position relative to period start
      const adjustedRem = originalRem - slotOffset * SLOT_REM
      return `${adjustedRem}rem`
    }
    return top
  }

  // Extraer todos los eventos de todos los slots para renderizarlos en capa absoluta
  // Filter events to only show those in selected boxes AND selected professionals AND confirmed (if filter active)
  // AND within the selected period's time range
  const allEvents: { event: DayEvent; boxId: BoxId }[] = []
  sourceSlots.forEach((slot) => {
    slot.boxes.forEach((box) => {
      // Convert box id (box1, box2, box3) to filter format (box-1, box-2, box-3)
      const boxFilterId = box.id.replace('box', 'box-')
      if (selectedBoxes.includes(boxFilterId)) {
        box.events.forEach((event) => {
          // Filter by period (time range)
          if (!isEventInPeriod(event)) return

          // Filter by professional if selectedProfessionals is not empty
          const professionalMatch =
            selectedProfessionals.length === 0 ||
            !event.detail?.professional ||
            selectedProfessionals.some((profId) =>
              event.detail?.professional
                ?.toLowerCase()
                .includes(
                  profId.toLowerCase().replace('dr', '').replace('dra', '')
                )
            )

          // Filter by confirmed status (if showConfirmedOnly is true)
          const isConfirmed =
            confirmedEvents?.[event.id] ?? event.confirmed ?? false
          const confirmedMatch = !showConfirmedOnly || isConfirmed

          // Filter by AI-created (if showAIOnly is true)
          const isAICreated = event.createdByVoiceAgent === true
          const aiMatch = !showAIOnly || isAICreated

          if (professionalMatch && confirmedMatch && aiMatch) {
            // Adjust event top position for the period
            const adjustedEvent = {
              ...event,
              top: adjustEventTopForPeriod(event.top)
            }
            allEvents.push({ event: adjustedEvent, boxId: box.id as BoxId })
          }
        })
      }
    })
  })

  // Calcular posición left basada en el box usando el layout dinámico
  const getEventLeft = (boxId: BoxId): string => {
    // Convert boxId (box1, box2, box3) to box name (box 1, box 2, box 3)
    const boxName = boxId.replace('box', 'box ')
    return boxLayout[boxName]?.left ?? '0'
  }

  // Get event width based on dynamic layout
  const getEventWidth = (boxId: BoxId): string => {
    const boxName = boxId.replace('box', 'box ')
    return boxLayout[boxName]?.width ?? '33.33%'
  }

  // Local ref for mouse event calculations
  const localGridRef = useRef<HTMLDivElement | null>(null)

  // Calculate slot index from mouse Y position (relative to period)
  const getSlotFromY = (clientY: number): number => {
    if (!localGridRef.current) return 0
    const rect = localGridRef.current.getBoundingClientRect()
    if (rect.height <= 0) return 0
    const relativeY = clientY - rect.top
    const slotHeight = rect.height / periodTotalSlots
    if (slotHeight <= 0) return 0
    const rawIndex = Math.floor(relativeY / slotHeight)
    // Return slot index relative to period start
    return Math.max(0, Math.min(rawIndex, periodTotalSlots - 1))
  }

  // Get box ID from mouse X position
  const getBoxFromX = (clientX: number): BoxId => {
    if (!localGridRef.current) return 'box1'
    const rect = localGridRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const boxWidth = rect.width / boxCount
    const boxIndex = Math.max(
      0,
      Math.min(boxCount - 1, Math.floor(relativeX / boxWidth))
    )
    return (['box1', 'box2', 'box3'] as const)[boxIndex] || 'box1'
  }

  // Handle mouse move for time indicator
  const handleGridMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't update hover if dragging an existing appointment
    if (draggingId) return

    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-appointment-card="true"]')) {
      onHoverSlotChange?.(null, '')
      return
    }

    const slotIndex = getSlotFromY(event.clientY)
    const boxId = getBoxFromX(event.clientX)
    onHoverSlotChange?.(slotIndex, boxId)

    // If dragging to select, update the current slot
    if (slotDragState?.isDragging) {
      onSlotDragMove?.(slotIndex)
    }
  }

  // Handle mouse leave to hide time indicator
  const handleGridMouseLeave = () => {
    if (!slotDragState?.isDragging) {
      onHoverSlotChange?.(null, '')
    }
  }

  // Handle mouse down to start drag selection
  const handleGridMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
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
    onSlotDragStart?.(slotIndex, boxId, event.clientY)
    event.preventDefault()
  }

  // Calculate slot height for visual components
  const slotHeightRem = 2.5 // var(--scheduler-slot-height-quarter)

  // Show time indicator if hovering and not dragging
  const showTimeIndicator =
    hoverSlotIndex !== null &&
    hoverSlotIndex !== undefined &&
    !slotDragState?.isDragging &&
    !draggingId

  // Show drag selection if dragging
  const showDragSelection = slotDragState?.isDragging

  // Usar slots del período seleccionado
  return (
    <div
      className='absolute w-full'
      ref={(el) => {
        localGridRef.current = el
        if (typeof gridRef === 'function') {
          gridRef(el)
        } else if (gridRef) {
          ;(gridRef as React.MutableRefObject<HTMLDivElement | null>).current =
            el
        }
      }}
      style={{
        left: 'var(--day-time-column-width)',
        top: 'var(--day-offset-top)',
        width: 'calc(100% - var(--day-time-column-width))',
        height: `calc(${periodTotalSlots} * var(--scheduler-slot-height-quarter))`
      }}
      onMouseMove={handleGridMouseMove}
      onMouseLeave={handleGridMouseLeave}
      onMouseDown={handleGridMouseDown}
    >
      {/* Time indicator on hover */}
      {showTimeIndicator && hoverSlotIndex !== null && (
        <TimeIndicator
          top={`${hoverSlotIndex * slotHeightRem}rem`}
          timeLabel={slotIndexToTime(
            hoverSlotIndex + slotOffset,
            FULL_START_HOUR,
            MINUTES_STEP
          )}
          timeColumnWidth='4rem'
          visible
        />
      )}

      {/* Drag selection overlay */}
      {showDragSelection &&
        slotDragState &&
        (() => {
          const { minSlot, maxSlot, slotCount } = getSelectionBounds(
            slotDragState.startSlot,
            slotDragState.currentSlot
          )
          const durationMinutes = slotCount * MINUTES_STEP
          // Get the width based on the selected box
          const boxName = slotDragState.columnId.replace('box', 'box ')
          const selectionLayout = boxLayout[boxName]
          return (
            <SlotDragSelection
              top={`${minSlot * slotHeightRem}rem`}
              height={`${slotCount * slotHeightRem}rem`}
              left={selectionLayout?.left ?? '0'}
              width={selectionLayout?.width ?? '33.33%'}
              startTime={slotIndexToTime(
                minSlot + slotOffset,
                FULL_START_HOUR,
                MINUTES_STEP
              )}
              endTime={slotIndexToTime(
                maxSlot + 1 + slotOffset,
                FULL_START_HOUR,
                MINUTES_STEP
              )}
              durationMinutes={durationMinutes}
              visible
            />
          )
        })()}

      {/* Rejilla de líneas cada 15 min */}
      <div className='pointer-events-none absolute inset-0 z-[1]'>
        <div
          className='grid h-full'
          style={{
            gridTemplateRows: `repeat(${periodTotalSlots}, var(--scheduler-slot-height-quarter))`
          }}
        >
          {Array.from({ length: periodTotalSlots }).map((_, index) => {
            // El borde inferior de la celda en las horas en punto
            // Necesitamos considerar el offset del período
            const absoluteIndex = index + slotOffset
            const isHourLine = (absoluteIndex + 1) % SLOTS_PER_HOUR === 0
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
      </div>

      {/* Líneas verticales para separar boxes (dinámico según filtro) */}
      <div className='pointer-events-none absolute inset-0 z-[1] flex'>
        {Array.from({ length: boxCount }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 ${
              index < boxCount - 1
                ? 'border-r border-[var(--color-border-default)]'
                : ''
            }`}
          />
        ))}
      </div>

      {/* Capa de bloques - z-index 1 (debajo de eventos) */}
      <div className='absolute inset-0 z-[1]'>
        {blocks.map((block) => {
          // Get box layout for block positioning
          const boxName = block.box || ''
          const blockLayout = boxLayout[boxName]
          if (!blockLayout && block.box) return null // Skip if box not visible

          return (
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
              styleOverride={
                blockLayout
                  ? {
                      left: blockLayout.left,
                      width: `calc(${blockLayout.width} - 0.5rem)`,
                      marginLeft: '0.25rem',
                      marginRight: '0.25rem'
                    }
                  : undefined
              }
            />
          )
        })}
      </div>

      {/* Capa de eventos - Posición absoluta sobre toda la cuadrícula (igual que vista semanal) */}
      <div className='absolute inset-0 z-[2]'>
        {allEvents.map(({ event, boxId }) => (
          <DayEvent
            key={event.id}
            event={{
              ...event,
              completed: completedEvents?.[event.id] ?? event.completed,
              confirmed: confirmedEvents?.[event.id] ?? event.confirmed,
              visitStatus: visitStatusMap?.[event.id] ?? event.visitStatus
            }}
            onHover={() => onHover({ event, boxId })}
            onLeave={() => onHover(null)}
            onActivate={() => onActivate({ event, boxId })}
            isActive={activeId === event.id}
            isHovered={hoveredId === event.id && activeId !== event.id}
            isDragging={draggingId === event.id}
            onDragStart={
              onEventDragStart
                ? (e) =>
                    onEventDragStart('move', event, boxId, e.clientX, e.clientY)
                : undefined
            }
            onResizeStart={
              onEventDragStart
                ? (e) =>
                    onEventDragStart(
                      'resize',
                      event,
                      boxId,
                      e.clientX,
                      e.clientY
                    )
                : undefined
            }
            styleOverride={{
              left: getEventLeft(boxId),
              width: `calc(${getEventWidth(boxId)} - 0.5rem)`,
              marginLeft: '0.25rem',
              marginRight: '0.25rem'
            }}
            onToggleComplete={onToggleComplete}
            onContextMenu={onEventContextMenu}
            onVisitStatusChange={onVisitStatusChange}
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
  detail?: EventDetail // Incluye notas y otra información del evento
  createdByVoiceAgent?: boolean // Indica si fue creada por el agente de voz (IA)
  voiceAgentCallId?: string // ID de la llamada vinculada
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
  currentDate?: string // ISO date string for the day being displayed
  bands?: DayBand[] // Bandas de profesionales para el día
  onAppointmentMove?: (payload: {
    id: string
    start: string
    end: string
    box: string
  }) => void
  selectedBoxes?: string[] // Boxes selected in the filter
  selectedProfessionals?: string[] // Professionals selected in the filter
  onOpenCreateAppointment?: (prefill?: {
    paciente?: string
    fecha?: string
    hora?: string
    duracion?: string
    box?: string
  }) => void
  /** Callback para cambiar el estado de visita de una cita */
  onVisitStatusChange?: (appointmentId: string, newStatus: VisitStatus) => void
  /** Filtrar solo citas confirmadas */
  showConfirmedOnly?: boolean
  /** Filtrar solo citas creadas por IA */
  showAIOnly?: boolean
  /** Callback para editar un bloqueo */
  onEditBlock?: (blockId: string) => void
  /** Callback para eliminar un bloqueo */
  onDeleteBlock?: (blockId: string, deleteRecurrence?: boolean) => void
}

function timeToMinutes(time: string): number {
  const [hh, mm] = time.split(':').map(Number)
  return hh * 60 + mm
}

function buildEventsFromAppointments(
  appointments: ExternalAppointment[]
): TimeSlot[] {
  if (!appointments.length) return TIME_SLOTS

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
    // Redondear al slot de 30 min más cercano para la estructura de TIME_LABELS
    const roundedM = m < 30 ? 0 : 30
    return `${h}:${roundedM === 0 ? '00' : '30'}`
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
    const durationMin = Math.max(MINUTES_STEP, endMin - startMin)

    // Calcular slot de inicio (granularidad de 15 min, igual que vista semanal)
    const startSlot = Math.floor((startMin - START_HOUR * 60) / MINUTES_STEP)
    // Calcular altura en slots (granularidad de 15 min)
    const heightSlots = Math.max(1, Math.ceil(durationMin / MINUTES_STEP))

    // Find the slot this event belongs to (para la estructura de TIME_LABELS)
    const slotKey = getTimeSlotKey(startMin)

    // Calcular top y height usando SLOT_REM (igual que vista semanal)
    const top = `${startSlot * SLOT_REM}rem`
    const height = `${heightSlots * SLOT_REM}rem`

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
      // Usar el detail de la cita si existe, sino crear uno básico
      detail:
        appt.detail ??
        createEventDetail(`${appt.start} ${title}`, appt.box ?? 'Box 1'),
      box: appt.box ?? boxId,
      height,
      // Propiedades del agente de voz (IA)
      createdByVoiceAgent: appt.createdByVoiceAgent,
      voiceAgentCallId: appt.voiceAgentCallId
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
  currentDate,
  bands = DAILY_BANDS,
  onAppointmentMove,
  selectedBoxes: selectedBoxesProp,
  selectedProfessionals = [], // Empty means all professionals
  onOpenCreateAppointment,
  onVisitStatusChange,
  showConfirmedOnly = false,
  showAIOnly = false,
  onEditBlock,
  onDeleteBlock
}: DayCalendarProps) {
  // Router for navigation (e.g., to voice agent page)
  const router = useRouter()

  // Get blocks from context
  const { getBlocksByDate, deleteBlock } = useAppointments()

  // Get boxes from configuration context
  const { activeBoxes } = useConfiguration()

  // Transform active boxes to match the expected format
  const effectiveBoxHeaders = useMemo(
    () =>
      activeBoxes.length > 0
        ? activeBoxes.map((b) => ({ id: b.id, label: b.label, tone: b.tone }))
        : DEFAULT_BOX_HEADERS,
    [activeBoxes]
  )

  // Use prop if provided, otherwise default to all boxes from config
  const selectedBoxes =
    selectedBoxesProp ?? effectiveBoxHeaders.map((b) => b.id)

  // Get visible boxes based on filter
  const visibleBoxes = effectiveBoxHeaders.filter((box) =>
    selectedBoxes.includes(box.id)
  )
  const boxCount = visibleBoxes.length || 1
  const boxLayout = getBoxLayout(selectedBoxes, effectiveBoxHeaders)
  const [hovered, setHovered] = useState<DayEventSelection>(null)
  const [active, setActive] = useState<DayEventSelection>(null)
  const [localEvents, setLocalEvents] = useState<TimeSlot[]>([])

  // Block-related state
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  // Quick appointment creation state - hover and drag
  const [hoverSlotInfo, setHoverSlotInfo] = useState<{
    slotIndex: number
    boxId: string
  } | null>(null)
  const [slotDragState, setSlotDragState] = useState<SlotDragState | null>(null)

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

  // Context menu state for right-click actions
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
    event: DayEvent
  } | null>(null)

  const isDraggingRef = useRef(false)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const boxRefs = useRef<Record<BoxId, HTMLDivElement | null>>({
    box1: null,
    box2: null,
    box3: null
  })

  // Estado de drag similar a WeekScheduler
  type DragState = {
    eventId: string
    originBoxId: BoxId
    type: 'move' | 'resize'
    startClientY: number
    startSlot: number
    startHeightSlots: number
    originalEvent: DayEvent
  } | null

  const [dragState, setDragState] = useState<DragState>(null)
  const dragPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRafRef = useRef<number | null>(null)

  // Sincronizar eventos locales con appointments externos
  useEffect(() => {
    if (appointments.length) {
      setLocalEvents(buildEventsFromAppointments(appointments))
    } else {
      setLocalEvents(TIME_SLOTS)
    }
  }, [appointments])

  const handleHover = (state: DayEventSelection) => {
    if (isDraggingRef.current) return
    setHovered(state)
  }

  const handleActivate = (state: DayEventSelection) => {
    if (isDraggingRef.current) return
    if (!state) return
    const isSame = active?.event.id === state.event.id
    setActive(isSame ? null : state)
    setHovered(isSame ? null : state)
  }

  const handleRootClick = () => {
    setActive(null)
  }

  // Handler para abrir modal de pago desde acciones rápidas
  const handlePaymentAction = useCallback(() => {
    if (!active?.event) return

    const event = active.event
    const detail = event.detail

    setSelectedEventForPayment({
      id: detail?.appointmentId ?? event.id,
      patientName: detail?.patientFull ?? event.label.split('\n')[1] ?? '',
      treatment:
        detail?.treatmentDescription ?? event.label.split('\n')[0] ?? '',
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
        const isFullyPaid = paymentInfo
          ? data.amountToPay >= paymentInfo.pendingAmount
          : true

        // TODO: Integrar con contexto/backend para actualizar estado de cobro
        console.log('✅ Pago registrado desde vista día:', {
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
    [selectedEventForPayment]
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
      // Actualizar estado local para feedback visual inmediato
      setVisitStatusMap((prev) => ({
        ...prev,
        [eventId]: newStatus
      }))

      // Si el estado es 'completed', también marcar como completado
      if (newStatus === 'completed') {
        setCompletedEvents((prev) => ({
          ...prev,
          [eventId]: true
        }))
      }

      // Notificar al padre si existe el callback
      onVisitStatusChange?.(eventId, newStatus)
    },
    [onVisitStatusChange]
  )

  // Handler para abrir menú contextual (clic derecho en cita)
  const handleEventContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>, event: DayEvent) => {
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

  // Handler para acciones del menú contextual
  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextMenu?.event) return

      const event = contextMenu.event
      const detail = event.detail

      switch (action) {
        case 'view-appointment':
          // Abrir overlay de detalle de la cita
          setActive({
            event,
            boxId: event.box?.toLowerCase().replace(' ', '') || 'box1'
          } as DayEventSelection)
          break

        case 'new-appointment':
          // Abrir modal de nueva cita con datos pre-rellenados del paciente
          onOpenCreateAppointment?.({
            paciente: detail?.patientFull || ''
          })
          break

        case 'new-budget':
          // Abrir modal de ficha del paciente en tab Finanzas con creación abierta
          setPatientRecordConfig({
            open: true,
            initialTab: 'Finanzas',
            openBudgetCreation: true,
            patientId: event.id,
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
          // Navegar al agente de voz con el ID de la llamada para abrir el detalle
          if (event.voiceAgentCallId) {
            router.push(`/agente-voz?callId=${event.voiceAgentCallId}`)
          }
          break
      }

      setContextMenu(null)
    },
    [contextMenu, onOpenCreateAppointment, router]
  )

  // === Quick appointment creation handlers ===

  // Handle hover slot change (time indicator)
  const handleHoverSlotChange = useCallback(
    (slotIndex: number | null, boxId: string) => {
      if (slotIndex === null) {
        setHoverSlotInfo(null)
      } else {
        setHoverSlotInfo({ slotIndex, boxId })
      }
    },
    []
  )

  // Handle slot drag start
  const handleSlotDragStart = useCallback(
    (slotIndex: number, boxId: string, clientY: number) => {
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
        columnId: boxId,
        isDragging: true,
        startY: clientY
      })
      // Clear any hover state
      setHovered(null)
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

    const { startSlot, currentSlot, columnId } = slotDragState
    const { minSlot, slotCount } = getSelectionBounds(startSlot, currentSlot)

    // Calculate start time
    const startTime = slotIndexToTime(minSlot, START_HOUR, MINUTES_STEP)

    // Calculate duration in minutes
    const durationMinutes = slotCount * MINUTES_STEP

    // Convert box ID to display format (box1 -> box 1)
    const boxDisplayName = columnId.replace('box', 'box ')

    // Open modal with pre-filled data using the parent's callback
    if (onOpenCreateAppointment) {
      onOpenCreateAppointment({
        fecha: currentDate || '',
        hora: startTime,
        duracion: durationMinutes.toString(),
        box: boxDisplayName
      })
    }

    // Clear drag state
    setSlotDragState(null)
    setHoverSlotInfo(null)
  }, [slotDragState, onOpenCreateAppointment, currentDate])

  // Window mouseup listener for ending drag
  useEffect(() => {
    if (!slotDragState?.isDragging) return

    const handleMouseUp = () => {
      handleSlotDragEnd()
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [slotDragState?.isDragging, handleSlotDragEnd])

  // Filtrar horarios según el período seleccionado
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
  const visibleSlotCount = filteredTimeLabels.length

  // Filtrar eventos según el período seleccionado
  const getFilteredEvents = (): TimeSlot[] => {
    if (!localEvents.length) return TIME_SLOTS

    // Crear un Set con las horas visibles para filtrado rápido
    const visibleTimes = new Set(filteredTimeLabels)

    // Filtrar los slots para mostrar solo los del período seleccionado
    return localEvents.filter((slot) => visibleTimes.has(slot.time))
  }

  const filteredEvents = getFilteredEvents()

  // Get blocks for the current date and convert to visual format
  const visualBlocks: DayBlock[] = (() => {
    if (!currentDate) return []

    const blocksForDate = getBlocksByDate(currentDate)

    return blocksForDate
      .filter((block) => {
        // Filter by selected boxes
        if (block.box) {
          const boxFilterId = block.box.replace(' ', '-')
          if (!selectedBoxes.includes(boxFilterId)) return false
        }

        // Filter by period - check if block overlaps with period time range
        if (period !== 'full') {
          const blockStartMinutes = timeToMinutes(block.startTime)
          const blockEndMinutes = timeToMinutes(block.endTime)
          const periodStartMinutes = periodConfig.startHour * 60
          const periodEndMinutes = periodConfig.endHour * 60

          // Block must overlap with period
          if (
            blockEndMinutes <= periodStartMinutes ||
            blockStartMinutes >= periodEndMinutes
          ) {
            return false
          }
        }

        return true
      })
      .map((block) => {
        // Calculate position based on time
        const startMinutes = timeToMinutes(block.startTime)
        const endMinutes = timeToMinutes(block.endTime)
        const durationMinutes = endMinutes - startMinutes

        // Calculate slot position relative to full day
        const startSlot = Math.floor(
          (startMinutes - FULL_START_HOUR * 60) / MINUTES_STEP
        )
        const heightSlots = Math.max(
          1,
          Math.ceil(durationMinutes / MINUTES_STEP)
        )

        // Adjust for period offset
        const adjustedStartSlot = startSlot - periodConfig.slotOffset
        const top = `${adjustedStartSlot * SLOT_REM}rem`
        const height = `${heightSlots * SLOT_REM}rem`

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
          parentBlockId: block.parentBlockId
        }
      })
  })()

  // Handler for block deletion
  const handleDeleteBlock = useCallback(
    (blockId: string, deleteRecurrence?: boolean) => {
      if (onDeleteBlock) {
        onDeleteBlock(blockId, deleteRecurrence)
      } else {
        // Default: use context's deleteBlock
        deleteBlock(blockId, deleteRecurrence)
      }
      setActiveBlockId(null)
    },
    [onDeleteBlock, deleteBlock]
  )

  // Funciones auxiliares para convertir entre slots y tiempo (IGUAL que vista semanal)
  const toSlots = (value: string | undefined): number => {
    if (!value) return 0
    // Extraer el número de rem del string (ej: "2.5rem" -> 2.5)
    const match = value.match(/^([\d.]+)rem$/)
    if (match) {
      const num = parseFloat(match[1])
      return Number.isFinite(num) ? num / SLOT_REM : 0
    }
    // Si es un calc(), intentar extraer el valor
    const calcMatch = value.match(/calc\(([\d.]+)\s*\*/)
    if (calcMatch) {
      return parseFloat(calcMatch[1]) || 0
    }
    return 0
  }

  const slotToTime = (slotIndex: number): string => {
    const totalMinutes = START_HOUR * 60 + Math.max(0, slotIndex) * MINUTES_STEP
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  // Convertir tiempo HH:MM a índice de slot (igual que vista semanal)
  const timeToSlotIndex = (time: string): number => {
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

  // Encontrar evento por ID en localEvents
  const findEventById = (
    eventId: string
  ): { event: DayEvent; boxId: BoxId; slotTime: string } | null => {
    for (const slot of localEvents) {
      for (const box of slot.boxes) {
        const found = box.events.find((e) => e.id === eventId)
        if (found) {
          return { event: found, boxId: box.id as BoxId, slotTime: slot.time }
        }
      }
    }
    return null
  }

  // Inicio del drag (EXACTAMENTE IGUAL a WeekScheduler)
  const handleEventDragStart = (
    type: 'move' | 'resize',
    event: DayEvent,
    boxId: BoxId,
    clientX: number,
    clientY: number
  ) => {
    // Ocultar overlays mientras se arrastra (igual que vista semanal)
    isDraggingRef.current = true
    setHovered(null)
    setActive(null)

    // Calcular slot inicial desde la posición top del evento
    const startSlot = toSlots(event.top)
    // Calcular altura en slots
    const startHeightSlots = Math.max(1, toSlots(event.height))

    setDragState({
      eventId: event.id,
      originBoxId: boxId,
      type,
      startClientY: clientY,
      startSlot,
      startHeightSlots,
      originalEvent: { ...event }
    })
  }

  // useEffect para manejar el movimiento del mouse durante el drag
  // LÓGICA EXACTAMENTE IGUAL A LA VISTA SEMANAL
  useEffect(() => {
    if (!dragState) return

    const handleMove = (e: MouseEvent) => {
      dragPointerRef.current = { x: e.clientX, y: e.clientY }
      if (dragRafRef.current !== null) return

      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null
        const { x, y } = dragPointerRef.current
        const grid = gridRef.current
        if (!grid) return

        const gridRect = grid.getBoundingClientRect()
        // Usar TOTAL_SLOTS para calcular la altura del slot (igual que vista semanal)
        const slotHeightPx = gridRect.height / TOTAL_SLOTS
        if (slotHeightPx <= 0) return

        // Calcular delta de slots basado en movimiento Y (igual que vista semanal)
        const deltaSlots = (y - dragState.startClientY) / slotHeightPx

        // Para move: mover el slot de inicio
        // Para resize: cambiar la altura
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

        // Detectar box destino basándose en posición X (igual que vista semanal)
        const boxWidth = gridRect.width / 3
        const relX = x - gridRect.left
        const boxIndex = Math.max(0, Math.min(2, Math.floor(relX / boxWidth)))
        const targetBoxId: BoxId = (['box1', 'box2', 'box3'] as const)[boxIndex]
        const targetBox = DEFAULT_BOX_HEADERS[boxIndex]?.label ?? 'BOX 1'

        // Calcular tiempos (igual que vista semanal)
        const startTime = slotToTime(newSlot)
        const endTime = slotToTime(newSlot + newHeightSlots)

        // Actualizar eventos locales para feedback visual inmediato
        setLocalEvents((prev) => {
          // Crear copia profunda - remover evento de su posición actual
          const newSlots = prev.map((slot) => ({
            ...slot,
            boxes: slot.boxes.map((box) => ({
              ...box,
              events: box.events.filter((ev) => ev.id !== dragState.eventId)
            }))
          }))

          // Encontrar el slot correspondiente al nuevo tiempo
          const totalMinutes = START_HOUR * 60 + newSlot * MINUTES_STEP
          const slotHour = Math.floor(totalMinutes / 60)
          const slotMinute = totalMinutes % 60
          // Ajustar al slot de 30 min más cercano para la estructura de TIME_LABELS
          const roundedMinute = slotMinute < 30 ? '00' : '30'
          const targetSlotTime = `${slotHour}:${roundedMinute}`

          // Encontrar el slot en la estructura
          const slotIndex = newSlots.findIndex((s) => s.time === targetSlotTime)
          if (slotIndex === -1) {
            // Si no existe el slot exacto, usar el primero disponible
            const fallbackIndex = 0
            if (newSlots[fallbackIndex]) {
              const boxIdx = newSlots[fallbackIndex].boxes.findIndex(
                (b) => b.id === targetBoxId
              )
              if (boxIdx !== -1) {
                const updatedEvent: DayEvent = {
                  ...dragState.originalEvent,
                  top: `${newSlot * SLOT_REM}rem`,
                  height: `${newHeightSlots * SLOT_REM}rem`,
                  box: targetBox,
                  label: `${startTime} ${
                    dragState.originalEvent.label.split('\n')[1] ||
                    dragState.originalEvent.label.split(' ').slice(1).join(' ')
                  }`
                }
                newSlots[fallbackIndex].boxes[boxIdx].events.push(updatedEvent)
              }
            }
            return newSlots
          }

          // Crear evento actualizado con nueva posición
          const updatedEvent: DayEvent = {
            ...dragState.originalEvent,
            top: `${newSlot * SLOT_REM}rem`,
            height: `${newHeightSlots * SLOT_REM}rem`,
            box: targetBox,
            label: `${startTime} ${
              dragState.originalEvent.label.split('\n')[1] ||
              dragState.originalEvent.label.split(' ').slice(1).join(' ')
            }`
          }

          // Añadir al box correcto
          const boxIdx = newSlots[slotIndex].boxes.findIndex(
            (b) => b.id === targetBoxId
          )
          if (boxIdx !== -1) {
            newSlots[slotIndex].boxes[boxIdx].events.push(updatedEvent)
          }

          return newSlots
        })
      })
    }

    const handleUp = () => {
      isDraggingRef.current = false

      // Obtener posición final (igual que vista semanal)
      const { x, y } = dragPointerRef.current
      const grid = gridRef.current
      if (!grid) {
        setDragState(null)
        return
      }

      const gridRect = grid.getBoundingClientRect()
      const slotHeightPx = gridRect.height / TOTAL_SLOTS
      if (slotHeightPx <= 0) {
        setDragState(null)
        return
      }

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

      // Detectar box final (igual que vista semanal)
      const boxWidth = gridRect.width / 3
      const relX = x - gridRect.left
      const boxIndex = Math.max(0, Math.min(2, Math.floor(relX / boxWidth)))
      const targetBox = DEFAULT_BOX_HEADERS[boxIndex]?.label ?? 'BOX 1'

      // Calcular tiempos finales (igual que vista semanal)
      const startTime = slotToTime(newSlot)
      const endTime = slotToTime(newSlot + newHeightSlots)

      // Notificar al padre con los datos actualizados
      if (onAppointmentMove) {
        onAppointmentMove({
          id: dragState.eventId,
          start: startTime,
          end: endTime,
          box: targetBox
        })
      }

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
  }, [dragState, onAppointmentMove])

  // Obtener configuración del período actual
  const periodConfig = getPeriodConfig(period)
  const periodTotalSlots = periodConfig.totalSlots

  // Altura basada en slots del período seleccionado
  const bandsTotalHeight = `${bands.length * DAILY_BAND_HEIGHT_REM}rem`
  const dayOffsetTop = `calc(var(--scheduler-day-header-height) + ${bandsTotalHeight})`
  const fullDayHeight = `calc(${periodTotalSlots} * var(--scheduler-slot-height-quarter) + var(--scheduler-day-header-height) + ${bandsTotalHeight})`

  const overlaySource = active
  const activeDetail = overlaySource?.event.detail

  return (
    <div
      className='relative w-full'
      style={
        {
          // Usar height explícita en lugar de minHeight para que el scroll funcione
          height: fullDayHeight,
          '--day-bands-height': bandsTotalHeight,
          '--day-offset-top': dayOffsetTop
        } as CSSProperties
      }
      onClick={handleRootClick}
    >
      <BoxHeaders visibleBoxes={visibleBoxes} />
      {/* Bandas de especialistas - sticky para que no hagan scroll */}
      <div
        className='sticky left-0 z-[8] flex w-full flex-col'
        style={{
          top: 'var(--scheduler-day-header-height)',
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
      <TimeColumn period={period} />
      <DayGrid
        period={period}
        timeLabels={filteredTimeLabels}
        timeSlotsOverride={filteredEvents}
        onHover={handleHover}
        onActivate={handleActivate}
        activeId={active?.event.id}
        hoveredId={hovered?.event.id}
        draggingId={dragState?.eventId ?? null}
        onEventDragStart={handleEventDragStart}
        gridRef={gridRef}
        boxRefs={boxRefs}
        selectedBoxes={selectedBoxes}
        boxLayout={boxLayout}
        boxCount={boxCount}
        visibleSlotCount={visibleSlotCount}
        selectedProfessionals={selectedProfessionals}
        completedEvents={completedEvents}
        confirmedEvents={confirmedEvents}
        onToggleComplete={handleToggleComplete}
        onEventContextMenu={handleEventContextMenu}
        visitStatusMap={visitStatusMap}
        onVisitStatusChange={handleVisitStatusChange}
        showConfirmedOnly={showConfirmedOnly}
        showAIOnly={showAIOnly}
        // Block-related props
        blocks={visualBlocks}
        onEditBlock={onEditBlock}
        onDeleteBlock={handleDeleteBlock}
        activeBlockId={activeBlockId}
        hoveredBlockId={hoveredBlockId}
        onBlockHover={setHoveredBlockId}
        onBlockActivate={setActiveBlockId}
        // Quick appointment creation props
        hoverSlotIndex={hoverSlotInfo?.slotIndex ?? null}
        onHoverSlotChange={handleHoverSlotChange}
        slotDragState={slotDragState}
        onSlotDragStart={handleSlotDragStart}
        onSlotDragMove={handleSlotDragMove}
        onSlotDragEnd={handleSlotDragEnd}
      />

      {/* Indicador de hora actual - línea roja horizontal */}
      <div
        className='pointer-events-none absolute left-0 w-full'
        style={{
          top: dayOffsetTop,
          height: `calc(${periodTotalSlots} * var(--scheduler-slot-height-quarter))`
        }}
      >
        <CurrentTimeIndicator
          startHour={periodConfig.startHour}
          endHour={periodConfig.endHour}
          timeColumnWidth='var(--day-time-column-width)'
        />
      </div>

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
              {/* Header - Color dinámico según la cita */}
              <div
                className='flex items-center justify-between px-4 py-2'
                style={{
                  backgroundColor:
                    hovered.event.bgColor || 'var(--color-brand-100)'
                }}
              >
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
              backgroundClass={`bg-[${overlaySource.event.bgColor}]`}
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
          )
        })()}

      {/* Register Payment Modal - Quick action from day view */}
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

      {/* Patient Record Modal - Quick action "Ver ficha" from day view */}
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
    </div>
  )
}
