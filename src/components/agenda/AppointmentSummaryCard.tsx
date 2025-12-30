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
}

export default function AppointmentSummaryCard({
  event,
  isActive,
  isHovered,
  isDragging,
  onHover,
  onLeave,
  onActivate,
  onDragStart
}: AppointmentSummaryCardProps) {
  const canShowNotes =
    parseDimensionToPx(event.height) >= MIN_HEIGHT_FOR_NOTES_PX
  const stateClasses = isActive
    ? 'border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-[var(--color-brand-500)]'
    : 'border-[var(--color-border)]'

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
        'absolute left-[var(--scheduler-event-left-offset)] flex flex-col gap-[var(--scheduler-event-gap)] overflow-hidden rounded-[var(--radius-lg)] border p-[var(--scheduler-event-padding)] text-left shadow-[0px_1px_2px_rgba(36,40,44,0.08)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] active:brightness-[0.98]',
        event.backgroundClass,
        event.borderClass ?? '',
        stateClasses
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
      <div className='flex items-start justify-between gap-2'>
        <div className='flex min-w-0 flex-1 flex-col gap-[0.375rem]'>
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
