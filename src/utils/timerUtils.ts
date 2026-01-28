/**
 * Timer utility functions for patient wait time tracking
 */

export type TimerAlertLevel = 'normal' | 'warning' | 'critical'

// Alert thresholds in minutes
export const TIMER_THRESHOLDS = {
  warning: 20, // Yellow after 20 minutes
  critical: 40 // Red after 40 minutes
} as const

// Alert colors matching the design system
export const TIMER_ALERT_COLORS: Record<
  TimerAlertLevel,
  { bg: string; text: string; border: string }
> = {
  normal: {
    bg: '#F3F4F6', // gray-100
    text: '#6B7280', // gray-500
    border: '#9CA3AF' // gray-400
  },
  warning: {
    bg: '#FEF3C7', // amber-100
    text: '#B45309', // amber-700
    border: '#F59E0B' // amber-500
  },
  critical: {
    bg: '#FEE2E2', // red-100
    text: '#B91C1C', // red-700
    border: '#EF4444' // red-500
  }
}

/**
 * Format milliseconds to a human-readable duration string
 * Examples: "5 min", "23 min", "1h 15min"
 */
export function formatDuration(ms: number): string {
  if (ms < 0) return '0 min'

  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}min`
}

/**
 * Format milliseconds to a compact duration string for small spaces
 * Examples: "5m", "23m", "1h15m"
 */
export function formatDurationCompact(ms: number): string {
  if (ms < 0) return '0m'

  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h${minutes}m`
}

/**
 * Calculate elapsed time in milliseconds from a timestamp to now
 */
export function calculateElapsedTime(startTimestamp: Date | string): number {
  const start =
    typeof startTimestamp === 'string'
      ? new Date(startTimestamp)
      : startTimestamp
  return Date.now() - start.getTime()
}

/**
 * Get the alert level based on elapsed minutes
 */
export function getTimerAlertLevel(minutes: number): TimerAlertLevel {
  if (minutes >= TIMER_THRESHOLDS.critical) {
    return 'critical'
  }
  if (minutes >= TIMER_THRESHOLDS.warning) {
    return 'warning'
  }
  return 'normal'
}

/**
 * Get alert level from milliseconds
 */
export function getTimerAlertLevelFromMs(ms: number): TimerAlertLevel {
  const minutes = Math.floor(ms / 60000)
  return getTimerAlertLevel(minutes)
}

/**
 * Get the colors for a given alert level
 */
export function getTimerAlertColors(level: TimerAlertLevel) {
  return TIMER_ALERT_COLORS[level]
}

/**
 * Calculate duration between two timestamps in milliseconds
 */
export function calculateDurationBetween(
  start: Date | string,
  end: Date | string
): number {
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = typeof end === 'string' ? new Date(end) : end
  return endDate.getTime() - startDate.getTime()
}
