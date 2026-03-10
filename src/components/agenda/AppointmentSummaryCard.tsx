'use client'

import { useEffect, useRef, useState } from 'react'

import { MD3Icon } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'
import { useWaitTimer } from '@/hooks/useWaitTimer'

import type { AgendaEvent, VisitStatus } from './types'
import { VISIT_STATUS_CONFIG } from './types'
import VisitStatusMenu from './VisitStatusMenu'
import { WaitTimerBadge } from './WaitTimeDisplay'

const clampStyle = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  } as const)

const parseDimensionToPx = (value?: string | number): number => {
  if (typeof value === 'number') return value
  if (!value) return 0
  const trimmed = value.trim()
  const num = parseFloat(trimmed)
  if (Number.isNaN(num)) return 0
  if (trimmed.endsWith('rem')) return num * 16
  return num
}

const MIN_HEIGHT_FOR_NOTES_PX = 120 // ensures notes render only when the card is tall enough to avoid overflow

export interface AppointmentSummaryCardProps {
  event: AgendaEvent
  isActive?: boolean
  isHovered?: boolean
  isDragging?: boolean
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
  onDragStart?: (
    type: 'move' | 'resize',
    event: AgendaEvent,
    clientX: number,
    clientY: number
  ) => void
  onToggleComplete?: (eventId: string, completed: boolean) => void
  onContextMenu?: (e: React.MouseEvent<HTMLElement>, event: AgendaEvent) => void
  /** Callback para cambiar el estado de visita */
  onVisitStatusChange?: (eventId: string, newStatus: VisitStatus) => void
}

export default function AppointmentSummaryCard({
  event,
  isActive,
  isHovered,
  isDragging,
  onHover,
  onLeave,
  onActivate,
  onDragStart,
  onToggleComplete,
  onContextMenu,
  onVisitStatusChange
}: AppointmentSummaryCardProps) {
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

    // Pequeño delay para evitar que el mismo click cierre el menú
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isStatusMenuOpen])

  const canShowNotes =
    parseDimensionToPx(event.height) >= MIN_HEIGHT_FOR_NOTES_PX
  const isCompleted = event.completed ?? false
  const isConfirmed = event.confirmed ?? false

  // Estado de visita actual (default: 'scheduled')
  const visitStatus: VisitStatus = event.visitStatus ?? 'scheduled'
  const statusConfig = VISIT_STATUS_CONFIG[visitStatus]

  // Animación pulsante para estado "Llamar"
  const isPulsing = visitStatus === 'call_patient'

  // Timer hook for real-time wait time tracking
  const {
    waitingTimeMs,
    consultationTimeMs,
    isWaitingActive,
    isConsultationActive,
    waitingAlertLevel,
    consultationAlertLevel
  } = useWaitTimer(
    visitStatus,
    event.visitStatusHistory,
    event.waitingDuration,
    event.consultationDuration
  )

  // Only show timer when there's something to display
  const showTimer =
    waitingTimeMs > 0 ||
    consultationTimeMs > 0 ||
    isWaitingActive ||
    isConsultationActive

  // Determinar borde según estado:
  // - Rosa fuerte (#EC4899) para citas creadas por IA
  // - Azul (#3B82F6) para citas confirmadas
  // - Brand para activo/hover
  // - Default para resto
  const isVoiceAgentAppointment = event.createdByVoiceAgent === true

  const stateClasses = isActive
    ? 'border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-[var(--color-brand-500)]'
    : isVoiceAgentAppointment
    ? 'border-[#EC4899] border-2 shadow-[0_0_0_1px_rgba(236,72,153,0.2)]'
    : isConfirmed
    ? 'border-[#3B82F6] shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
    : 'border-[var(--color-border)]'

  return (
    <>
      <button
        type='button'
        data-appointment-card='true'
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        onFocus={onHover}
        onBlur={onLeave}
        onClick={(eventObj) => {
          eventObj.stopPropagation()
          onActivate()
        }}
        onKeyDown={(eventObj) => {
          if (eventObj.key === 'Enter' || eventObj.key === ' ') {
            eventObj.preventDefault()
            onActivate()
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu?.(e, event)
        }}
        className={[
          'group/card absolute left-[var(--scheduler-event-left-offset)] flex flex-col gap-[var(--scheduler-event-gap)] overflow-hidden rounded-[var(--radius-lg)] border p-[var(--scheduler-event-padding)] text-left shadow-[0px_1px_2px_rgba(36,40,44,0.08)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] active:brightness-[0.98]',
          event.bgColorInline ? '' : event.backgroundClass,
          event.borderClass ?? '',
          stateClasses,
          isCompleted ? 'opacity-70' : ''
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          top: event.top,
          height: event.height,
          width: event.width ?? 'var(--scheduler-event-width)',
          left: event.left ?? 'var(--scheduler-event-left-offset)',
          overflow: 'hidden',
          ...(event.bgColorInline
            ? { backgroundColor: event.bgColorInline }
            : {})
        }}
        aria-pressed={isActive}
        aria-controls={isActive ? 'scheduler-event-overlay' : undefined}
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

        <div className='flex items-start justify-between gap-2'>
          <div className='flex min-w-0 flex-1 flex-col gap-[0.375rem]'>
            {/* Nombre del paciente - Negrita */}
            <div className='flex items-center gap-1.5'>
              {/* Indicador de cita creada por agente de voz (IA) */}
              {event.createdByVoiceAgent && (
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
              {/* Indicador de cobro pendiente - usa paymentInfo si existe, sino fallback a economicStatus */}
              {
                // Usar paymentInfo.pendingAmount si está disponible
                ((event.detail?.paymentInfo &&
                  event.detail.paymentInfo.pendingAmount > 0) ||
                  // Fallback al sistema anterior basado en economicStatus
                  (!event.detail?.paymentInfo &&
                    event.detail?.economicStatus &&
                    (event.detail.economicStatus === 'Pendiente de cobro' ||
                      event.detail.economicStatus === 'Pendiente de pago' ||
                      event.detail.economicStatus.includes('Pendiente')))) && (
                  <MD3Icon
                    name='PaymentsRounded'
                    size={0.875}
                    className='shrink-0 text-amber-600'
                  />
                )
              }
              <p
                className='font-bold text-[var(--color-neutral-900)]'
                style={{
                  fontSize: '0.875rem', // 14px
                  lineHeight: '1.25rem',
                  ...clampStyle(1)
                }}
              >
                {event.patient}
              </p>
            </div>
            {/* Tratamiento - Cursiva */}
            <p
              className='font-normal italic text-[var(--color-neutral-700)]'
              style={{
                fontSize: '0.75rem', // 12px
                lineHeight: '1rem',
                ...clampStyle(1)
              }}
            >
              {event.title}
            </p>
            {/* Timer de espera/consulta */}
            {showTimer && (
              <WaitTimerBadge
                waitingTimeMs={waitingTimeMs}
                consultationTimeMs={consultationTimeMs}
                waitingAlertLevel={waitingAlertLevel}
                consultationAlertLevel={consultationAlertLevel}
                isWaitingActive={isWaitingActive}
                isConsultationActive={isConsultationActive}
                compact
              />
            )}
            {/* Notas */}
            {event.detail && canShowNotes && event.detail.notes ? (
              <p
                className='font-normal text-[var(--color-neutral-600)]'
                style={{
                  fontSize: '0.75rem', // 12px
                  lineHeight: '1rem',
                  ...clampStyle(2)
                }}
              >
                {event.detail.notes}
              </p>
            ) : null}
          </div>
        </div>

        {/* Drag / resize handlers - left: 6px para no cubrir el indicador de estado */}
        <div
          className={`absolute top-0 right-0 bottom-0 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            left: '6px', // No cubrir el indicador de estado de visita
            opacity: isDragging ? 0.88 : 1,
            transform: isDragging ? 'scale(1.02)' : 'none',
            transition: 'transform 120ms ease, opacity 120ms ease'
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            onDragStart?.('move', event, e.clientX, e.clientY)
          }}
          aria-hidden
        />
        <div
          className={`absolute bottom-0 left-0 right-0 h-2 ${
            isDragging ? 'cursor-s-resize' : 'cursor-s-resize'
          }`}
          onMouseDown={(e) => {
            e.stopPropagation()
            onDragStart?.('resize', event, e.clientX, e.clientY)
          }}
          aria-hidden
        />
      </button>

      {/* Menú de selección de estado - renderizado fuera del botón via Portal */}
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
