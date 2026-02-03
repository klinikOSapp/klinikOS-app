'use client'

/**
 * TimeIndicator Component
 * 
 * Shows a horizontal guide line with time badge that follows the mouse cursor
 * when hovering over the agenda grid. Helps receptionists quickly identify
 * available time slots for appointment creation.
 */

import { CSSProperties } from 'react'

type TimeIndicatorProps = {
  /** Position from top of the grid container (in pixels or CSS value) */
  top: number | string
  /** Time label to display (e.g., "10:30", "14:15") */
  timeLabel: string
  /** Width of the time column on the left (CSS value) */
  timeColumnWidth?: string
  /** Whether to show the indicator */
  visible?: boolean
  /** Optional: show during drag (different styling) */
  isDragging?: boolean
}

/**
 * Formats duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "30 min", "1h", "1h 30min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}

/**
 * Converts slot index to time string
 * @param slotIndex - Zero-based slot index (each slot is 15 minutes)
 * @param startHour - Starting hour of the calendar (default 9)
 * @param minutesStep - Minutes per slot (default 15)
 * @returns Time string in "HH:MM" format
 */
export function slotIndexToTime(
  slotIndex: number,
  startHour: number = 9,
  minutesStep: number = 15
): string {
  const totalMinutes = startHour * 60 + slotIndex * minutesStep
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Calculates slot index from Y position within the grid
 * @param relativeY - Y position relative to the grid top (in pixels)
 * @param gridHeight - Total height of the grid (in pixels)
 * @param totalSlots - Total number of slots in the grid
 * @returns Clamped slot index
 */
export function positionToSlotIndex(
  relativeY: number,
  gridHeight: number,
  totalSlots: number
): number {
  if (gridHeight <= 0) return 0
  const slotHeight = gridHeight / totalSlots
  const rawIndex = Math.floor(relativeY / slotHeight)
  return Math.max(0, Math.min(rawIndex, totalSlots - 1))
}

export default function TimeIndicator({
  top,
  timeLabel,
  timeColumnWidth = 'var(--scheduler-time-width)',
  visible = true,
  isDragging = false
}: TimeIndicatorProps) {
  if (!visible) return null

  const topValue = typeof top === 'number' ? `${top}px` : top

  return (
    <div
      className='pointer-events-none absolute left-0 z-[3] flex w-full items-center'
      style={{
        top: topValue,
        transform: 'translateY(-50%)'
      } as CSSProperties}
    >
      {/* Time badge on the left */}
      <div
        className={[
          'flex items-center justify-center rounded-[0.25rem] px-[0.5rem] py-[0.125rem]',
          isDragging 
            ? 'bg-[var(--color-brand-600)]' 
            : 'bg-[var(--color-brand-500)]'
        ].join(' ')}
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

      {/* Horizontal guide line */}
      <div 
        className={[
          'h-[2px] flex-1',
          isDragging 
            ? 'bg-[var(--color-brand-600)]' 
            : 'border-t-2 border-dashed border-[var(--color-brand-400)]'
        ].join(' ')}
        style={{
          backgroundColor: isDragging ? undefined : 'transparent'
        }}
      />
    </div>
  )
}
