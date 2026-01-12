'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'

import type { AgendaEvent } from './types'

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
  onToggleComplete
}: AppointmentSummaryCardProps) {
  const canShowNotes =
    parseDimensionToPx(event.height) >= MIN_HEIGHT_FOR_NOTES_PX
  const isCompleted = event.completed ?? false
  
  const stateClasses = isActive
    ? 'border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-[var(--color-brand-500)]'
    : isCompleted
    ? 'border-[var(--color-success-400)]'
    : 'border-[var(--color-border)]'

  // Handler para el checkbox de completado
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onToggleComplete?.(event.id, !isCompleted)
  }

  return (
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
      className={[
        'group/card absolute left-[var(--scheduler-event-left-offset)] flex flex-col gap-[var(--scheduler-event-gap)] overflow-hidden rounded-[var(--radius-lg)] border p-[var(--scheduler-event-padding)] text-left shadow-[0px_1px_2px_rgba(36,40,44,0.08)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] active:brightness-[0.98]',
        event.backgroundClass,
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
        overflow: 'hidden'
      }}
      aria-pressed={isActive}
      aria-controls={isActive ? 'scheduler-event-overlay' : undefined}
    >
      {/* Checkbox de cita completada - esquina superior derecha */}
      {onToggleComplete && (
        <div
          role='checkbox'
          aria-checked={isCompleted}
          aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
          tabIndex={0}
          onClick={handleToggleComplete}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onToggleComplete(event.id, !isCompleted)
            }
          }}
          className={[
            'absolute right-1.5 top-1.5 z-20 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200',
            'opacity-0 group-hover/card:opacity-100 focus:opacity-100',
            isCompleted
              ? 'border-[var(--color-success-500)] bg-[var(--color-success-500)] opacity-100 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]'
              : 'border-[var(--color-neutral-400)] bg-white/90 hover:border-[var(--color-success-400)] hover:bg-[var(--color-success-50)]'
          ].join(' ')}
        >
          {isCompleted && (
            <svg
              className='h-3 w-3 animate-[checkmark_0.2s_ease-out] text-white'
              viewBox='0 0 12 12'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M2.5 6L5 8.5L9.5 3.5' />
            </svg>
          )}
        </div>
      )}

      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 flex-1 flex-col gap-[0.375rem]'>
          <div className='flex items-center gap-1.5'>
            {/* Indicador de cobro pendiente - usa paymentInfo si existe, sino fallback a economicStatus */}
            {(
              // Usar paymentInfo.pendingAmount si está disponible
              (event.detail?.paymentInfo && event.detail.paymentInfo.pendingAmount > 0) ||
              // Fallback al sistema anterior basado en economicStatus
              (!event.detail?.paymentInfo && event.detail?.economicStatus &&
                (event.detail.economicStatus === 'Pendiente de cobro' ||
                  event.detail.economicStatus === 'Pendiente de pago' ||
                  event.detail.economicStatus.includes('Pendiente')))
            ) && (
              <MD3Icon
                name='PaymentsRounded'
                size={0.875}
                className='shrink-0 text-amber-600'
              />
            )}
            <p
              className='font-medium text-[var(--color-neutral-900)]'
              style={{
                fontSize: '0.75rem', // 12px
                lineHeight: '1rem',
                ...clampStyle(1)
              }}
            >
              {event.title}
            </p>
          </div>
          <p
            className='font-medium text-[var(--color-neutral-900)]'
            style={{
              fontSize: '0.875rem', // 14px
              lineHeight: '1.25rem',
              ...clampStyle(1)
            }}
          >
            {event.patient}
          </p>
          {event.detail && canShowNotes ? (
            <div className='flex flex-col gap-[0.375rem]'>
              <div className='flex items-center gap-1 text-[var(--color-neutral-600)]'>
                <MD3Icon
                  name='DescriptionRounded'
                  size={1}
                  className='text-[var(--color-neutral-600)]'
                />
                <span
                  className='font-normal'
                  style={{
                    fontSize: '0.75rem',
                    lineHeight: '1rem',
                    ...clampStyle(1)
                  }}
                >
                  {event.detail.notesLabel ?? 'Notas'}
                </span>
              </div>
              {event.detail.notes ? (
                <p
                  className='font-normal text-[var(--color-neutral-900)]'
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.25rem',
                    ...clampStyle(2)
                  }}
                >
                  {event.detail.notes}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Drag / resize handlers */}
      <div
        className={`absolute inset-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={(e) => {
          e.stopPropagation()
          onDragStart?.('move', event, e.clientX, e.clientY)
        }}
        aria-hidden
        style={{
          opacity: isDragging ? 0.88 : 1,
          transform: isDragging ? 'scale(1.02)' : 'none',
          transition: 'transform 120ms ease, opacity 120ms ease'
        }}
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
  )
}
