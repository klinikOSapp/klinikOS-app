'use client'

/**
 * SlotDragSelection Component
 * 
 * Visual component showing the selection area when dragging to select a time range
 * for creating a new appointment. Shows start time, end time, and duration.
 */

import { CSSProperties } from 'react'
import { formatDuration } from './TimeIndicator'

type SlotDragSelectionProps = {
  /** Top position in pixels or CSS value */
  top: number | string
  /** Height of the selection in pixels or CSS value */
  height: number | string
  /** Left position (CSS value, e.g., percentage or calc) */
  left?: string
  /** Width of the selection (CSS value) */
  width?: string
  /** Start time label (e.g., "10:30") */
  startTime: string
  /** End time label (e.g., "11:00") */
  endTime: string
  /** Duration in minutes */
  durationMinutes: number
  /** Whether to show the selection */
  visible?: boolean
}

export default function SlotDragSelection({
  top,
  height,
  left = '0',
  width = '100%',
  startTime,
  endTime,
  durationMinutes,
  visible = true
}: SlotDragSelectionProps) {
  if (!visible || durationMinutes <= 0) return null

  const topValue = typeof top === 'number' ? `${top}px` : top
  const heightValue = typeof height === 'number' ? `${height}px` : height

  // Calculate if the selection is tall enough to show all details
  const heightPx = typeof height === 'number' ? height : 0
  const isCompact = heightPx < 60 // Less than ~60px, show compact version

  return (
    <div
      className='pointer-events-none absolute z-[3] rounded-lg border-2 border-[var(--color-brand-500)] bg-[var(--color-brand-100)]'
      style={{
        top: topValue,
        left,
        width,
        height: heightValue,
        opacity: 0.7
      } as CSSProperties}
    >
      {/* Content container */}
      <div className='flex h-full flex-col items-center justify-center gap-1 px-2 py-1'>
        {/* Duration - always shown, prominently */}
        <div className='flex items-center justify-center rounded-full bg-[var(--color-brand-500)] px-3 py-1'>
          <span className='text-xs font-semibold text-white'>
            {formatDuration(durationMinutes)}
          </span>
        </div>

        {/* Time range - shown if enough space */}
        {!isCompact && (
          <span className='text-xs font-medium text-[var(--color-brand-700)]'>
            {startTime} - {endTime}
          </span>
        )}
      </div>

      {/* Top edge indicator (start time) */}
      <div 
        className='absolute -top-px left-0 right-0 h-[3px] rounded-t-lg bg-[var(--color-brand-500)]'
      />

      {/* Bottom edge indicator (end time) */}
      <div 
        className='absolute -bottom-px left-0 right-0 h-[3px] rounded-b-lg bg-[var(--color-brand-500)]'
      />
    </div>
  )
}

/**
 * Type for slot drag state used by parent components
 */
export type SlotDragState = {
  /** Starting slot index (0-based) */
  startSlot: number
  /** Current slot index during drag */
  currentSlot: number
  /** Column ID (weekday for week view, or box for day view) */
  columnId: string
  /** Box ID within the column (e.g., 'box 1', 'box 2') - used in week view */
  boxId?: string
  /** Whether currently dragging */
  isDragging: boolean
  /** Starting Y position (for click detection) */
  startY: number
}

/**
 * Helper to calculate selection bounds from drag state
 */
export function getSelectionBounds(
  startSlot: number,
  currentSlot: number
): { minSlot: number; maxSlot: number; slotCount: number } {
  const minSlot = Math.min(startSlot, currentSlot)
  const maxSlot = Math.max(startSlot, currentSlot)
  const slotCount = maxSlot - minSlot + 1
  return { minSlot, maxSlot, slotCount }
}
