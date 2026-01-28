'use client'

import { useMemo } from 'react'
import {
  formatDuration,
  formatDurationCompact,
  getTimerAlertColors,
  type TimerAlertLevel
} from '@/utils/timerUtils'

type WaitTimeDisplayProps = {
  /** Time in milliseconds */
  timeMs: number
  /** Alert level for color coding */
  alertLevel: TimerAlertLevel
  /** Label to show (e.g., "Espera", "Consulta") */
  label?: string
  /** Compact variant for small spaces */
  compact?: boolean
  /** Whether the timer is currently active/running */
  isActive?: boolean
  /** Show only the time without label */
  timeOnly?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays elapsed time with color-coded alerts based on duration
 * 
 * Color coding:
 * - Normal (gray): 0-20 minutes
 * - Warning (amber): 20-40 minutes
 * - Critical (red): >40 minutes
 */
export function WaitTimeDisplay({
  timeMs,
  alertLevel,
  label,
  compact = false,
  isActive = false,
  timeOnly = false,
  className = ''
}: WaitTimeDisplayProps) {
  const colors = useMemo(() => getTimerAlertColors(alertLevel), [alertLevel])
  const formattedTime = compact 
    ? formatDurationCompact(timeMs) 
    : formatDuration(timeMs)

  if (timeOnly) {
    return (
      <span
        className={`font-medium ${className}`}
        style={{ color: colors.text }}
      >
        {formattedTime}
        {isActive && (
          <span className="ml-0.5 inline-block w-1 h-1 rounded-full animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        )}
      </span>
    )
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${className}`}
        style={{
          backgroundColor: colors.bg,
          color: colors.text
        }}
      >
        {label && <span className="opacity-75">{label}:</span>}
        <span>{formattedTime}</span>
        {isActive && (
          <span 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`
      }}
    >
      {label && (
        <span 
          className="text-xs font-medium"
          style={{ color: colors.text }}
        >
          {label}:
        </span>
      )}
      <span
        className="text-sm font-semibold"
        style={{ color: colors.text }}
      >
        {formattedTime}
      </span>
      {isActive && (
        <span 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: colors.border }}
        />
      )}
    </div>
  )
}

type WaitTimerBadgeProps = {
  /** Waiting time in milliseconds */
  waitingTimeMs: number
  /** Consultation time in milliseconds */
  consultationTimeMs: number
  /** Waiting time alert level */
  waitingAlertLevel: TimerAlertLevel
  /** Consultation time alert level */
  consultationAlertLevel: TimerAlertLevel
  /** Whether waiting timer is active */
  isWaitingActive: boolean
  /** Whether consultation timer is active */
  isConsultationActive: boolean
  /** Compact variant */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Combined badge showing both waiting and consultation times
 * Used in appointment cards and table rows
 */
export function WaitTimerBadge({
  waitingTimeMs,
  consultationTimeMs,
  waitingAlertLevel,
  consultationAlertLevel,
  isWaitingActive,
  isConsultationActive,
  compact = false,
  className = ''
}: WaitTimerBadgeProps) {
  const showWaiting = waitingTimeMs > 0 || isWaitingActive
  const showConsultation = consultationTimeMs > 0 || isConsultationActive

  if (!showWaiting && !showConsultation) {
    return null
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {showWaiting && (
          <WaitTimeDisplay
            timeMs={waitingTimeMs}
            alertLevel={waitingAlertLevel}
            isActive={isWaitingActive}
            compact
            timeOnly
          />
        )}
        {showWaiting && showConsultation && (
          <span className="text-gray-400">/</span>
        )}
        {showConsultation && (
          <WaitTimeDisplay
            timeMs={consultationTimeMs}
            alertLevel={consultationAlertLevel}
            isActive={isConsultationActive}
            compact
            timeOnly
          />
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {showWaiting && (
        <WaitTimeDisplay
          timeMs={waitingTimeMs}
          alertLevel={waitingAlertLevel}
          label="Espera"
          isActive={isWaitingActive}
          compact
        />
      )}
      {showConsultation && (
        <WaitTimeDisplay
          timeMs={consultationTimeMs}
          alertLevel={consultationAlertLevel}
          label="Consulta"
          isActive={isConsultationActive}
          compact
        />
      )}
    </div>
  )
}

type TableTimerCellProps = {
  /** Waiting time in milliseconds */
  waitingTimeMs: number
  /** Consultation time in milliseconds */
  consultationTimeMs: number
  /** Waiting time alert level */
  waitingAlertLevel: TimerAlertLevel
  /** Consultation time alert level */
  consultationAlertLevel: TimerAlertLevel
  /** Whether waiting timer is active */
  isWaitingActive: boolean
  /** Whether consultation timer is active */
  isConsultationActive: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Timer cell component for the parte diario table
 * Shows waiting and consultation times in a table-friendly format
 */
export function TableTimerCell({
  waitingTimeMs,
  consultationTimeMs,
  waitingAlertLevel,
  consultationAlertLevel,
  isWaitingActive,
  isConsultationActive,
  className = ''
}: TableTimerCellProps) {
  const showWaiting = waitingTimeMs > 0 || isWaitingActive
  const showConsultation = consultationTimeMs > 0 || isConsultationActive

  if (!showWaiting && !showConsultation) {
    return <span className="text-gray-400">—</span>
  }

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {showWaiting && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">E:</span>
          <WaitTimeDisplay
            timeMs={waitingTimeMs}
            alertLevel={waitingAlertLevel}
            isActive={isWaitingActive}
            compact
            timeOnly
          />
        </div>
      )}
      {showConsultation && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">C:</span>
          <WaitTimeDisplay
            timeMs={consultationTimeMs}
            alertLevel={consultationAlertLevel}
            isActive={isConsultationActive}
            compact
            timeOnly
          />
        </div>
      )}
    </div>
  )
}
