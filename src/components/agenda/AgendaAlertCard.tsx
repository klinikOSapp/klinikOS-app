'use client'

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { MD3Icon } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'

const clampStyle = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  }) as const

export type AgendaAlertCardProps = {
  id: string
  title: string
  description?: string | null
  timeRange: string
  patientName?: string | null
  top: string
  height: string
  left?: string
  width?: string
  onToggleComplete?: (alertId: number) => void
  alertNumericId?: number
  styleOverride?: CSSProperties
}

function AlertDetailPopover({
  title,
  description,
  timeRange,
  patientName,
  anchorRect,
  onClose,
  onComplete,
}: {
  title: string
  description?: string | null
  timeRange: string
  patientName?: string | null
  anchorRect: DOMRect
  onClose: () => void
  onComplete?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) return
      onClose()
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const top = anchorRect.bottom + 6
  const left = Math.max(8, anchorRect.left)

  return (
    <Portal>
      <div
        ref={ref}
        className='fixed z-[9999] w-72 rounded-xl border border-[var(--color-border-default)] bg-white p-4 shadow-xl'
        style={{ top, left }}
      >
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <MD3Icon
              name='NotificationsActiveRounded'
              size={1}
              className='shrink-0 text-red-400'
            />
            <h4 className='text-body-md font-semibold text-[var(--color-neutral-900)]'>
              {title}
            </h4>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='grid size-6 place-items-center rounded text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]'
          >
            <MD3Icon name='CloseRounded' size={0.875} />
          </button>
        </div>

        <p className='mt-1 text-label-sm text-[var(--color-neutral-500)]'>{timeRange}</p>

        {patientName && (
          <p className='mt-1.5 text-body-sm text-[var(--color-brand-700)]'>{patientName}</p>
        )}

        {description && (
          <p className='mt-2 text-body-sm text-[var(--color-neutral-700)]'>{description}</p>
        )}

        {onComplete && (
          <button
            type='button'
            onClick={() => {
              onComplete()
              onClose()
            }}
            className='mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-neutral-100)] px-3 py-1.5 text-body-sm font-medium text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-200)]'
          >
            <MD3Icon name='CheckCircleRounded' size={0.875} />
            Marcar como completada
          </button>
        )}
      </div>
    </Portal>
  )
}

export default function AgendaAlertCard({
  id,
  title,
  description,
  timeRange,
  patientName,
  top,
  height,
  left,
  width,
  onToggleComplete,
  alertNumericId,
  styleOverride
}: AgendaAlertCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const cardRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={cardRef}
        type='button'
        data-alert-card='true'
        onClick={(event) => {
          event.stopPropagation()
          setShowDetail((prev) => !prev)
        }}
        className='group/alertcard absolute flex flex-col gap-0.5 overflow-hidden rounded-lg border border-red-200 bg-red-50 p-2 text-left shadow-sm transition-all duration-150 hover:bg-red-100 hover:shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-red-300'
        style={{
          top,
          height,
          left: left ?? 'var(--scheduler-event-left-offset)',
          width: width ?? 'var(--scheduler-event-width)',
          zIndex: 2,
          ...styleOverride
        }}
        aria-label={`Alerta: ${title}`}
      >
        <div className='flex items-center gap-1'>
          <MD3Icon
            name='NotificationsActiveRounded'
            size={0.75}
            className='shrink-0 text-red-400'
          />
          <span
            className='font-semibold text-red-700'
            style={{
              fontSize: '0.75rem',
              lineHeight: '1rem',
              ...clampStyle(1)
            }}
          >
            {title}
          </span>
        </div>

        {patientName && (
          <p
            className='font-normal text-red-500'
            style={{
              fontSize: '0.625rem',
              lineHeight: '0.875rem',
              ...clampStyle(1)
            }}
          >
            {patientName}
          </p>
        )}

        <p
          className='font-normal text-red-400'
          style={{ fontSize: '0.625rem', lineHeight: '0.75rem' }}
        >
          {timeRange}
        </p>
      </button>

      {showDetail && cardRef.current && (
        <AlertDetailPopover
          title={title}
          description={description}
          timeRange={timeRange}
          patientName={patientName}
          anchorRect={cardRef.current.getBoundingClientRect()}
          onClose={() => setShowDetail(false)}
          onComplete={
            onToggleComplete && alertNumericId != null
              ? () => onToggleComplete(alertNumericId)
              : undefined
          }
        />
      )}
    </>
  )
}
