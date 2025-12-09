'use client'

import type { AgendaEvent } from './types'

export interface AppointmentSummaryCardProps {
  event: AgendaEvent
  isActive?: boolean
  isHovered?: boolean
  onHover: () => void
  onLeave: () => void
  onActivate: () => void
}

export default function AppointmentSummaryCard({
  event,
  isActive,
  isHovered,
  onHover,
  onLeave,
  onActivate
}: AppointmentSummaryCardProps) {
  const stateClasses = isActive
    ? 'border-[var(--color-brand-500)] shadow-[0px_4px_12px_rgba(81,214,199,0.35)]'
    : isHovered
    ? 'border-[var(--color-brand-500)]'
    : 'border-transparent'

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
        'absolute left-[var(--scheduler-event-left-offset)] flex flex-col gap-[var(--scheduler-event-gap)] rounded-[var(--radius-lg)] border-2 p-[var(--scheduler-event-padding)] text-left shadow-[0px_1px_2px_rgba(36,40,44,0.08)] transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand-500)] active:brightness-[0.98]',
        event.backgroundClass,
        event.borderClass ?? '',
        stateClasses
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        top: event.top,
        height: event.height,
        width: 'var(--scheduler-event-width)'
      }}
      aria-pressed={isActive}
      aria-controls={isActive ? 'scheduler-event-overlay' : undefined}
    >
      <div className='flex items-start justify-between'>
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <p
            className='overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[var(--color-neutral-900)]'
            style={{
              fontSize: 'var(--text-label-md)',
              lineHeight: 'var(--leading-label-md)'
            }}
          >
            {event.title}
          </p>
          <p
            className='overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[var(--color-neutral-900)]'
            style={{
              fontSize: 'var(--text-label-md)',
              lineHeight: 'var(--leading-label-md)'
            }}
          >
            {event.patient}
          </p>
        </div>
        <div className='flex shrink-0 flex-col items-end justify-center self-stretch text-right'>
          <p className='whitespace-nowrap text-title-sm font-bold text-[var(--color-neutral-900)]'>
            {event.box}
          </p>
        </div>
      </div>
      <p
        className='overflow-hidden text-ellipsis whitespace-nowrap text-label-sm text-[var(--color-neutral-700)]'
        style={{
          lineHeight: 'var(--leading-label-md)'
        }}
      >
        {event.timeRange}
      </p>
    </button>
  )
}
