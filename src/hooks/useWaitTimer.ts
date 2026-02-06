'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { VisitStatus, VisitStatusLog } from '@/components/agenda/types'
import {
  calculateElapsedTime,
  calculateDurationBetween,
  getTimerAlertLevelFromMs,
  type TimerAlertLevel
} from '@/utils/timerUtils'

export type WaitTimerResult = {
  // Current elapsed times in milliseconds
  waitingTimeMs: number
  consultationTimeMs: number
  // Whether timers are actively running
  isWaitingActive: boolean
  isConsultationActive: boolean
  // Alert levels for visual indicators
  waitingAlertLevel: TimerAlertLevel
  consultationAlertLevel: TimerAlertLevel
  // Final recorded durations (for completed appointments)
  finalWaitingDuration: number | null
  finalConsultationDuration: number | null
}

/**
 * Custom hook for real-time patient wait time tracking
 * 
 * @param visitStatus - Current visit status of the appointment
 * @param visitStatusHistory - Array of status change logs with timestamps
 * @param recordedWaitingDuration - Pre-recorded waiting duration (for completed appointments)
 * @param recordedConsultationDuration - Pre-recorded consultation duration (for completed appointments)
 * @returns Timer state with elapsed times and alert levels
 */
export function useWaitTimer(
  visitStatus: VisitStatus | undefined,
  visitStatusHistory: VisitStatusLog[] | undefined,
  recordedWaitingDuration?: number,
  recordedConsultationDuration?: number
): WaitTimerResult {
  const [now, setNow] = useState(Date.now())

  // Get the timestamp when patient entered waiting room
  const waitingRoomEntry = useMemo(() => {
    if (!visitStatusHistory) return null
    return visitStatusHistory.find((log) => log.status === 'waiting_room')
  }, [visitStatusHistory])

  // Get the timestamp when patient entered consultation
  const consultationEntry = useMemo(() => {
    if (!visitStatusHistory) return null
    return visitStatusHistory.find((log) => log.status === 'in_consultation')
  }, [visitStatusHistory])

  // Get the timestamp when appointment was completed
  const completedEntry = useMemo(() => {
    if (!visitStatusHistory) return null
    return visitStatusHistory.find((log) => log.status === 'completed')
  }, [visitStatusHistory])

  // Determine if timers should be active
  const isWaitingActive = visitStatus === 'waiting_room' || visitStatus === 'call_patient'
  const isConsultationActive = visitStatus === 'in_consultation'

  // Update the clock every second when a timer is active
  useEffect(() => {
    if (!isWaitingActive && !isConsultationActive) {
      return
    }

    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [isWaitingActive, isConsultationActive])

  // Calculate current waiting time
  const waitingTimeMs = useMemo(() => {
    // If we have a pre-recorded duration, use it
    if (recordedWaitingDuration !== undefined) {
      return recordedWaitingDuration
    }

    // If no entry to waiting room, no waiting time
    if (!waitingRoomEntry) return 0

    // If patient is still waiting (or being called)
    if (isWaitingActive) {
      return calculateElapsedTime(waitingRoomEntry.timestamp)
    }

    // If patient moved to consultation, calculate time spent waiting
    if (consultationEntry) {
      return calculateDurationBetween(
        waitingRoomEntry.timestamp,
        consultationEntry.timestamp
      )
    }

    // If completed without going through consultation (edge case)
    if (completedEntry) {
      return calculateDurationBetween(
        waitingRoomEntry.timestamp,
        completedEntry.timestamp
      )
    }

    return 0
  }, [
    waitingRoomEntry,
    consultationEntry,
    completedEntry,
    isWaitingActive,
    now,
    recordedWaitingDuration
  ])

  // Calculate current consultation time
  const consultationTimeMs = useMemo(() => {
    // If we have a pre-recorded duration, use it
    if (recordedConsultationDuration !== undefined) {
      return recordedConsultationDuration
    }

    // If no entry to consultation, no consultation time
    if (!consultationEntry) return 0

    // If patient is currently in consultation
    if (isConsultationActive) {
      return calculateElapsedTime(consultationEntry.timestamp)
    }

    // If appointment is completed, calculate time spent in consultation
    if (completedEntry) {
      return calculateDurationBetween(
        consultationEntry.timestamp,
        completedEntry.timestamp
      )
    }

    return 0
  }, [
    consultationEntry,
    completedEntry,
    isConsultationActive,
    now,
    recordedConsultationDuration
  ])

  // Calculate alert levels
  const waitingAlertLevel = getTimerAlertLevelFromMs(waitingTimeMs)
  const consultationAlertLevel = getTimerAlertLevelFromMs(consultationTimeMs)

  // Final durations (for completed appointments)
  const finalWaitingDuration = visitStatus === 'completed' 
    ? (recordedWaitingDuration ?? waitingTimeMs) 
    : null
  const finalConsultationDuration = visitStatus === 'completed' 
    ? (recordedConsultationDuration ?? consultationTimeMs) 
    : null

  return {
    waitingTimeMs,
    consultationTimeMs,
    isWaitingActive,
    isConsultationActive,
    waitingAlertLevel,
    consultationAlertLevel,
    finalWaitingDuration,
    finalConsultationDuration
  }
}

/**
 * Helper function to extract timestamps from visit status history
 * Useful for calculating durations outside of React components
 */
export function getTimestampsFromHistory(history: VisitStatusLog[] | undefined): {
  waitingRoomTimestamp: Date | null
  consultationTimestamp: Date | null
  completedTimestamp: Date | null
} {
  if (!history) {
    return {
      waitingRoomTimestamp: null,
      consultationTimestamp: null,
      completedTimestamp: null
    }
  }

  const waitingRoomEntry = history.find((log) => log.status === 'waiting_room')
  const consultationEntry = history.find((log) => log.status === 'in_consultation')
  const completedEntry = history.find((log) => log.status === 'completed')

  return {
    waitingRoomTimestamp: waitingRoomEntry?.timestamp ?? null,
    consultationTimestamp: consultationEntry?.timestamp ?? null,
    completedTimestamp: completedEntry?.timestamp ?? null
  }
}

/**
 * Calculate final durations from visit status history
 * Used when completing an appointment to record final times
 */
export function calculateFinalDurations(history: VisitStatusLog[] | undefined): {
  waitingDuration: number | null
  consultationDuration: number | null
} {
  const { waitingRoomTimestamp, consultationTimestamp, completedTimestamp } = 
    getTimestampsFromHistory(history)

  let waitingDuration: number | null = null
  let consultationDuration: number | null = null

  // Calculate waiting duration
  if (waitingRoomTimestamp) {
    if (consultationTimestamp) {
      // Normal flow: waiting room → consultation
      waitingDuration = calculateDurationBetween(
        waitingRoomTimestamp,
        consultationTimestamp
      )
    } else if (completedTimestamp) {
      // Direct completion from waiting room (edge case)
      waitingDuration = calculateDurationBetween(
        waitingRoomTimestamp,
        completedTimestamp
      )
    }
  }

  // Calculate consultation duration
  if (consultationTimestamp && completedTimestamp) {
    consultationDuration = calculateDurationBetween(
      consultationTimestamp,
      completedTimestamp
    )
  }

  return { waitingDuration, consultationDuration }
}
