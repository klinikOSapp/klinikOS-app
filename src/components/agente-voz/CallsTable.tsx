'use client'

import Portal from '@/components/ui/Portal'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import AssignProfessionalModal from './AssignProfessionalModal'
import CallCardsView from './CallCardsView'
import CallDetailModal from './CallDetailModal'
import CallModal from './CallModal'
import CallStatusBadge from './CallStatusBadge'
import ListenCallModal from './ListenCallModal'
import TranscriptionModal from './TranscriptionModal'
import type {
  CallFilter,
  CallIntent,
  CallRecord,
  Sentiment,
  VoiceAgentTier
} from './voiceAgentTypes'
import {
  AUTO_PENDING_HOURS,
  CALL_INTENT_LABELS,
  SENTIMENT_LABELS,
  isAppointmentIntent
} from './voiceAgentTypes'

type CallsTableProps = {
  data?: CallRecord[]
  selectedWeekStart?: Date
  /** Voice agent tier - determines available actions */
  voiceAgentTier?: VoiceAgentTier
  /** Whether call actions are available for the clinic */
  canCallActions?: boolean
}

const ITEMS_PER_PAGE = 9
const CALLS_FETCH_LIMIT = 500
const CALLS_RPC_LIMIT = 800

type VoiceAgentRpcCallRow = {
  call_id: string | number
  external_call_id: string | null
  status: string | null
  management_status: string | null
  from_number: string | null
  started_at: string | null
  duration_seconds: number | null
  call_outcome: string | null
  is_urgent: boolean | null
  patient_id: string | null
  caller_contact_id: string | null
  metadata: unknown
  recording_url: string | null
  intent_summary: string | null
  patient_full_name: string | null
  patient_phone: string | null
  contact_full_name: string | null
  contact_phone: string | null
  call_log_transcript: string | null
  call_log_summary: string | null
  call_log_duration_seconds: number | null
  call_log_started_at: string | null
  webhook_payload: unknown
  appointment_id: string | null
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function safeJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }
  return typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeText(value: unknown): string {
  return asString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function extractSummary(payload: Record<string, unknown> | null): string {
  const call = safeJson(payload?.call)
  const analysis = safeJson(call?.analysis)
  const callAnalysis = safeJson(call?.call_analysis)
  const customAnalysis = safeJson(callAnalysis?.custom_analysis_data)
  const candidates = [
    asString(analysis?.summary),
    asString(call?.call_summary),
    asString(callAnalysis?.call_summary),
    asString(customAnalysis?.call_summary),
    asString(call?.summary)
  ].map((value) => value.trim())
  return candidates.find(Boolean) || ''
}

function extractTranscript(payload: Record<string, unknown> | null): string {
  const call = safeJson(payload?.call)
  const candidates = [
    asString(call?.transcript),
    asString(call?.full_transcript),
    asString(payload?.transcript)
  ].map((value) => value.trim())
  return candidates.find(Boolean) || ''
}

function extractRecordingUrl(payload: Record<string, unknown> | null): string {
  const call = safeJson(payload?.call)
  const candidates = [asString(call?.recording_url), asString(payload?.recording_url)].map(
    (value) => value.trim()
  )
  return candidates.find(Boolean) || ''
}

function mapIntent(intentSource: string): CallIntent {
  const source = normalizeText(intentSource)
  if (!source) return 'consulta_general'
  const primary = source.split('-')[0]?.trim() || source
  if (primary.startsWith('urgencia') || source.includes('urgenc') || source.includes('dolor')) {
    return 'urgencia_dolor'
  }
  if (primary.startsWith('cancelar cita') || source.includes('cancel')) return 'cancelar_cita'
  if (
    primary.startsWith('cambiar cita') ||
    source.includes('reprogram') ||
    source.includes('reagend') ||
    source.includes('confirm')
  ) {
    return 'confirmar_cita'
  }
  if (
    primary.startsWith('reservar cita') ||
    primary.startsWith('pedir cita') ||
    source.includes('book') ||
    source.includes('agenda') ||
    source.includes('cita')
  ) {
    return 'pedir_cita_higiene'
  }
  if (primary.startsWith('preguntas frecuentes')) return 'consulta_general'
  if (
    source.includes('financ') ||
    source.includes('presup') ||
    source.includes('coste') ||
    source.includes('precio')
  ) {
    return 'consulta_financiacion'
  }
  return 'consulta_general'
}

function getIntentDisplay(intentSource: string, intent: CallIntent): string {
  const raw = intentSource.trim()
  if (!raw) return CALL_INTENT_LABELS[intent]
  const normalized = normalizeText(raw)
  if (
    normalized === 'voice call' ||
    normalized === 'llamada de voz' ||
    normalized === 'no summary available' ||
    normalized === 'sin resumen disponible' ||
    normalized === 'n/a'
  ) {
    return CALL_INTENT_LABELS[intent]
  }
  return raw
}

function getDisplayedIntent(call: Pick<CallRecord, 'intent' | 'intentDisplay'>): string {
  return call.intentDisplay?.trim() || CALL_INTENT_LABELS[call.intent]
}

function mapSentiment(sentimentSource: string): Sentiment {
  const source = normalizeText(sentimentSource)
  if (!source) return 'neutral'
  if (source === 'neutral') return 'neutral'
  if (source.includes('enfad') || source.includes('angry')) return 'enfadado'
  if (source.includes('nerv')) return 'nervioso'
  if (source.includes('preocup') || source.includes('worr')) return 'preocupado'
  if (source.includes('alivi') || source.includes('relief') || source.includes('relieved')) {
    return 'aliviado'
  }
  if (source.includes('happy') || source.includes('content')) return 'contento'
  return 'neutral'
}

function isPlaceholderSummary(value: string): boolean {
  const normalized = normalizeText(value)
  return (
    !normalized ||
    normalized === 'voice call' ||
    normalized === 'llamada de voz' ||
    normalized === 'no summary available' ||
    normalized === 'sin resumen disponible' ||
    normalized === 'n/a'
  )
}

function parseDurationSeconds(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.round(parsed)
}

function parseDurationFromPayload(payload: Record<string, unknown> | null): number {
  const call = safeJson(payload?.call)
  const fromMs = parseDurationSeconds(call?.duration_ms) / 1000
  const fromCost = parseDurationSeconds(safeJson(call?.call_cost)?.total_duration_seconds)
  const fromTop = parseDurationSeconds(payload?.duration_seconds || payload?.duration)
  const candidates = [fromCost, fromTop, fromMs]
  for (const candidate of candidates) {
    if (candidate > 0) return Math.round(candidate)
  }
  return 0
}

function parseStartedAtFromPayload(payload: Record<string, unknown> | null): string | null {
  const call = safeJson(payload?.call)
  const startTimestamp = asString(call?.start_timestamp).trim()
  if (startTimestamp) {
    const parsed = new Date(startTimestamp)
    if (Number.isFinite(parsed.getTime())) return parsed.toISOString()
  }
  const candidates = [
    asString(payload?.started_at),
    asString(payload?.start_time),
    asString(payload?.received_at)
  ]
    .map((value) => value.trim())
    .filter(Boolean)
  for (const candidate of candidates) {
    const parsed = new Date(candidate)
    if (Number.isFinite(parsed.getTime())) return parsed.toISOString()
  }
  return null
}

function durationTextFromSeconds(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const mm = String(Math.floor(safe / 60)).padStart(2, '0')
  const ss = String(safe % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function hasMedia(call: CallRecord): boolean {
  return Boolean(call.recordingUrl && call.recordingUrl.trim() && call.transcript && call.transcript.trim())
}

function getCallTimestamp(call: CallRecord): number {
  const source = call.startedAt || ''
  const parsed = source ? new Date(source).getTime() : NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function dedupeAndFilterCalls(calls: CallRecord[]): CallRecord[] {
  const filtered = calls.filter(hasMedia)
  const sourceCalls = filtered.length > 0 ? filtered : calls
  const deduped = new Map<string, CallRecord>()

  for (const call of sourceCalls) {
    const key =
      (call.externalCallId && call.externalCallId.trim()) ||
      (call.recordingUrl && call.recordingUrl.trim()) ||
      `${call.phone}|${call.startedAt || call.time}`
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, call)
      continue
    }
    const currentScore =
      (call.transcript?.length || 0) +
      (call.summary?.length || 0) +
      (call.duration !== '00:00' ? 15 : 0) +
      (call.startedAt ? 10 : 0)
    const existingScore =
      (existing.transcript?.length || 0) +
      (existing.summary?.length || 0) +
      (existing.duration !== '00:00' ? 15 : 0) +
      (existing.startedAt ? 10 : 0)
    const statusPriority: Record<CallRecord['status'], number> = {
      nueva: 1,
      pendiente: 2,
      en_curso: 3,
      urgente: 4,
      resuelta: 5
    }
    const currentStatusPriority = statusPriority[call.status] ?? 0
    const existingStatusPriority = statusPriority[existing.status] ?? 0
    const shouldReplace =
      currentStatusPriority > existingStatusPriority ||
      (currentStatusPriority === existingStatusPriority &&
        (currentScore > existingScore ||
          getCallTimestamp(call) > getCallTimestamp(existing)))
    if (shouldReplace) {
      deduped.set(key, call)
    }
  }

  return Array.from(deduped.values()).sort(
    (a, b) => getCallTimestamp(b) - getCallTimestamp(a)
  )
}

function mapCallStatus(
  rawLifecycleStatus: string,
  urgent: boolean,
  managementStatusRaw?: string
): CallRecord['status'] {
  const lifecycleStatus = rawLifecycleStatus.toLowerCase()
  const managementStatus = normalizeText(managementStatusRaw || '')

  if (
    managementStatus.includes('resuelt') ||
    managementStatus.includes('resolved')
  ) {
    return 'resuelta'
  }
  if (
    managementStatus.includes('en curso') ||
    managementStatus.includes('in_progress')
  ) {
    return 'en_curso'
  }
  if (
    managementStatus.includes('pend') ||
    managementStatus.includes('pending') ||
    managementStatus.includes('queue') ||
    managementStatus.includes('earring')
  ) {
    return urgent ? 'urgente' : 'pendiente'
  }
  if (
    managementStatus.includes('nueva') ||
    managementStatus.includes('new') ||
    managementStatus.includes('created') ||
    managementStatus.includes('initiated')
  ) {
    return urgent ? 'urgente' : 'nueva'
  }

  if (lifecycleStatus.includes('resolved')) return 'resuelta'
  if (lifecycleStatus.includes('in_progress')) return 'en_curso'
  if (
    lifecycleStatus.includes('new') ||
    lifecycleStatus.includes('created') ||
    lifecycleStatus.includes('initiated')
  ) {
    return urgent ? 'urgente' : 'nueva'
  }
  if (
    lifecycleStatus.includes('pending') ||
    lifecycleStatus.includes('queue') ||
    lifecycleStatus.includes('earring') ||
    lifecycleStatus.includes('completed')
  ) {
    return urgent ? 'urgente' : 'pendiente'
  }
  return urgent ? 'urgente' : 'pendiente'
}

function hydrateCallsFromRpcRows(rows: VoiceAgentRpcCallRow[]): CallRecord[] {
  const hydrated = rows.map((row) => {
    const callId = String(row.call_id)
    const webhookPayload = safeJson(row.webhook_payload)
    const payloadStartedAt = parseStartedAtFromPayload(webhookPayload)
    const startedAtRaw =
      asString(row.started_at).trim() ||
      asString(row.call_log_started_at).trim() ||
      payloadStartedAt ||
      null
    const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date()
    const payloadDuration = parseDurationFromPayload(webhookPayload)
    const durationSeconds = Math.max(
      parseDurationSeconds(row.duration_seconds),
      parseDurationSeconds(row.call_log_duration_seconds),
      payloadDuration
    )
    const metadata =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : null
    const managementStatusSource = asString(row.management_status).trim()
    const payloadCall = safeJson(webhookPayload?.call)
    const payloadCustomAnalysis = safeJson(
      safeJson(payloadCall?.call_analysis)?.custom_analysis_data
    )
    const metadataPatientName =
      (typeof metadata?.patient_name === 'string' && metadata.patient_name.trim()) ||
      (typeof metadata?.patient_full_name === 'string' &&
        metadata.patient_full_name.trim()) ||
      (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
      (typeof metadata?.caller_name === 'string' && metadata.caller_name.trim()) ||
      null
    const payloadPatientName =
      asString(payloadCustomAnalysis?.full_name).trim() ||
      asString(payloadCustomAnalysis?.patient_name).trim() ||
      asString(safeJson(payloadCall?.retell_llm_dynamic_variables)?.name).trim() ||
      asString(safeJson(payloadCall?.collected_dynamic_variables)?.patient_name).trim() ||
      null
    const patientName =
      asString(row.patient_full_name).trim() ||
      asString(row.contact_full_name).trim() ||
      metadataPatientName ||
      payloadPatientName ||
      null
    const phone =
      asString(row.from_number).trim() ||
      asString(row.patient_phone).trim() ||
      asString(row.contact_phone).trim() ||
      (typeof metadata?.caller_phone === 'string' ? metadata.caller_phone.trim() : '') ||
      asString(safeJson(payloadCall?.retell_llm_dynamic_variables)?.from_number).trim() ||
      '—'
    const extractedSummary = extractSummary(webhookPayload)
    const callLogSummary = asString(row.call_log_summary).trim()
    const rowSummaryRaw = asString(row.call_outcome).trim()
    const rowSummary = isPlaceholderSummary(rowSummaryRaw) ? '' : rowSummaryRaw
    const summaryRaw = rowSummary || callLogSummary || extractedSummary
    const summary = isPlaceholderSummary(summaryRaw)
      ? 'Sin resumen disponible.'
      : summaryRaw
    const callLogTranscript = asString(row.call_log_transcript).trim()
    const payloadTranscript = extractTranscript(webhookPayload)
    const transcript = callLogTranscript || payloadTranscript || null
    const recordingUrl =
      asString(row.recording_url).trim() ||
      asString(metadata?.recording_url).trim() ||
      extractRecordingUrl(webhookPayload) ||
      null
    const intentSource = [
      asString(metadata?.call_reason),
      asString(payloadCustomAnalysis?.call_reason),
      asString(payloadCall?.call_reason),
      asString(metadata?.intent),
      asString(metadata?.call_intent),
      asString(metadata?.reason),
      asString(row.intent_summary),
      asString(row.call_outcome)
    ]
      .map((value) => value.trim())
      .find(Boolean)
    const mappedIntent = mapIntent(intentSource || '')
    const sentimentSource = [
      asString(metadata?.feeling),
      asString(metadata?.sentiment),
      asString(metadata?.emotion),
      asString(payloadCustomAnalysis?.feeling),
      asString(payloadCustomAnalysis?.sentiment),
      asString(payloadCustomAnalysis?.emotion)
    ]
      .map((value) => value.trim())
      .find(Boolean)
    const appointmentId = asString(row.appointment_id).trim()

    return {
      id: callId,
      externalCallId: asString(row.external_call_id).trim() || null,
      startedAt: startedAtRaw,
      status: mapCallStatus(
        asString(row.status),
        Boolean(row.is_urgent),
        managementStatusSource
      ),
      time: startedAt.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      patient: patientName,
      phone,
      intent: mappedIntent,
      intentDisplay: getIntentDisplay(intentSource || '', mappedIntent),
      duration: durationTextFromSeconds(durationSeconds),
      summary,
      transcript,
      recordingUrl,
      sentiment: mapSentiment(sentimentSource || ''),
      appointmentId: appointmentId || undefined
    } satisfies CallRecord
  })

  return dedupeAndFilterCalls(hydrated)
}

// Quick Actions Menu Item
type QuickActionItem = {
  id: string
  label: string
  icon: string
  onClick: () => void
}

// Quick Actions Menu Component (following parte diario pattern)
function CallQuickActionsMenu({
  row,
  onClose,
  triggerRect,
  onCall,
  onViewAppointment,
  onCreateAppointment,
  onMarkResolved,
  onListenCall,
  onViewTranscription,
  onAssignProfessional,
  onMoreInfo,
  voiceAgentTier = 'advanced',
  canCallActions = true
}: {
  row: CallRecord
  onClose: () => void
  triggerRect?: DOMRect
  onCall: () => void
  onViewAppointment: () => void
  onCreateAppointment: () => void
  onMarkResolved: () => void
  onListenCall: () => void
  onViewTranscription: () => void
  onAssignProfessional: () => void
  onMoreInfo: () => void
  voiceAgentTier?: VoiceAgentTier
  canCallActions?: boolean
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    right?: number
  }>({})

  // Calculate optimal menu position
  useEffect(() => {
    if (!menuRef.current || !triggerRect) return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const margin = 8

    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    if (spaceBelow >= menuRect.height + margin) {
      setPosition({
        top: triggerRect.bottom + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else if (spaceAbove >= menuRect.height + margin) {
      setPosition({
        bottom: viewportHeight - triggerRect.top + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else {
      const centeredTop = Math.max(
        margin,
        Math.min(
          viewportHeight - menuRect.height - margin,
          triggerRect.top + triggerRect.height / 2 - menuRect.height / 2
        )
      )
      setPosition({
        top: centeredTop,
        right: window.innerWidth - triggerRect.right
      })
    }
  }, [triggerRect])

  // Handle click outside and escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Determinar si la intención es de pedir cita (cita ya creada automáticamente)
  const isCreatingIntent = isAppointmentIntent(row.intent)

  // Build actions list based on voice agent tier
  const actions: QuickActionItem[] = []

  if (canCallActions) {
    actions.push({ id: 'call', label: 'Llamar', icon: 'call', onClick: onCall })
  }

  // Only show appointment actions in advanced mode
  if (voiceAgentTier === 'advanced') {
    // Mostrar "Ver en agenda" si la intención creó cita automáticamente, sino "Crear cita"
    if (isCreatingIntent) {
      actions.push({
        id: 'view-appointment',
        label: 'Ver en agenda',
        icon: 'calendar_month',
        onClick: onViewAppointment
      })
    } else {
      actions.push({
        id: 'create-appointment',
        label: 'Crear cita',
        icon: 'add_circle',
        onClick: onCreateAppointment
      })
    }
  }

  // Common actions for both tiers
  const isResolved = row.status === 'resuelta'
  actions.push(
    {
      id: 'mark-resolved',
      label: isResolved ? 'Volver a pendiente' : 'Marcar resuelta',
      icon: isResolved ? 'undo' : 'check_box',
      onClick: onMarkResolved
    },
    {
      id: 'listen-call',
      label: 'Escuchar llamada',
      icon: 'adaptive_audio_mic',
      onClick: onListenCall
    },
    {
      id: 'transcription',
      label: 'Transcripción',
      icon: 'dictionary',
      onClick: onViewTranscription
    }
  )

  if (voiceAgentTier === 'advanced') {
    actions.push({
      id: 'assign-professional',
      label: 'Asignar profesional',
      icon: 'person_add',
      onClick: onAssignProfessional
    })
  }

  actions.push({
      id: 'more-info',
      label: 'Más información',
      icon: 'info',
      onClick: onMoreInfo
    })

  return (
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[13rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={{
        top: position.top,
        bottom: position.bottom,
        right: position.right
      }}
      role='menu'
      aria-label='Acciones rápidas'
    >
      <div className='py-1'>
        {actions.map((action) => (
          <button
            key={action.id}
            type='button'
            role='menuitem'
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
          >
            <span className='material-symbols-rounded text-xl text-[var(--color-neutral-600)]'>
              {action.icon}
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Calls Table
 * Figma: 1616 × 440px = 101rem × 27.5rem
 * Columns: Estado, Hora, Paciente, Teléfono, Intención, Duración, Resumen, Sentimiento
 *
 * Supports two tiers:
 * - basic: Receptionist mode - no appointment actions, manual status management
 * - advanced: Full mode - appointment sync, automatic status updates
 */
export type ViewMode = 'table' | 'cards'

export default function CallsTable({
  data,
  selectedWeekStart,
  voiceAgentTier = 'advanced',
  canCallActions = true
}: CallsTableProps) {
  const supabase = useRef(createSupabaseBrowserClient())
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<CallFilter>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [refreshTick, setRefreshTick] = useState(0)
  const rpcRouteSchemaMismatchRef = useRef(false)

  // Local state for call records (to allow status updates from appointment sync)
  const [localCalls, setLocalCalls] = useState<CallRecord[]>(data ?? [])
  const [totalCallsAvailable, setTotalCallsAvailable] = useState<number>(
    data?.length ?? 0
  )

  // Sync local calls when data prop changes
  useEffect(() => {
    if (data) {
      const normalized = dedupeAndFilterCalls(data)
      setLocalCalls(normalized)
      setTotalCallsAvailable(normalized.length)
    }
  }, [data])

  useEffect(() => {
    function triggerRefresh() {
      setRefreshTick((current) => current + 1)
    }
    window.addEventListener('pageshow', triggerRefresh)
    window.addEventListener('focus', triggerRefresh)
    return () => {
      window.removeEventListener('pageshow', triggerRefresh)
      window.removeEventListener('focus', triggerRefresh)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    async function hydrateCalls() {
      if (!isClinicInitialized) return
      try {
        if (!activeClinicId) {
          if (isMounted) {
            setLocalCalls([])
            setTotalCallsAvailable(0)
          }
          return
        }

        const clinicFilter = `clinic_id.eq.${activeClinicId},initial_clinic_id.eq.${activeClinicId}`
        const weekStart = selectedWeekStart ? new Date(selectedWeekStart) : null
        if (weekStart) {
          weekStart.setHours(0, 0, 0, 0)
        }
        const weekEnd = weekStart ? new Date(weekStart) : null
        if (weekEnd) {
          weekEnd.setDate(weekEnd.getDate() + 7)
        }

        try {
          const params = new URLSearchParams()
          if (weekStart) {
            params.set('weekStart', formatDateParam(weekStart))
          }
          params.set('limit', String(CALLS_RPC_LIMIT))
          if (rpcRouteSchemaMismatchRef.current) {
            params.set('skipRpc', '1')
          }

          const response = await fetch(`/api/agente-voz/calls?${params.toString()}`, {
            cache: 'no-store'
          })

          if (response.ok) {
            const payload = (await response.json()) as {
              source?: 'rpc' | 'fallback'
              rpcError?: { code?: string | null; message?: string | null } | null
              calls?: VoiceAgentRpcCallRow[]
            }
            if (payload.source === 'fallback' && payload.rpcError?.code === '42804') {
              rpcRouteSchemaMismatchRef.current = true
            }
            if (Array.isArray(payload.calls)) {
              const normalizedCalls = hydrateCallsFromRpcRows(payload.calls)
              if (isMounted) {
                setLocalCalls(normalizedCalls)
                setTotalCallsAvailable(normalizedCalls.length)
              }
              return
            }
          } else {
            console.warn('CallsTable RPC route unavailable, falling back to client hydration', {
              status: response.status
            })
          }
        } catch (rpcError) {
          console.warn('CallsTable RPC route failed, falling back to client hydration', rpcError)
        }

        let callsQuery = supabase.current
          .from('calls')
          .select(
            'id, external_call_id, status, management_status, from_number, started_at, duration_seconds, call_outcome, is_urgent, patient_id, caller_contact_id, metadata, initial_clinic_id, recording_url, intent_summary'
          )
          .or(clinicFilter)
          .order('started_at', { ascending: false })
          .limit(CALLS_FETCH_LIMIT)
        let countQuery = supabase.current
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .or(clinicFilter)

        if (weekStart && weekEnd) {
          const rangeStartIso = weekStart.toISOString()
          const rangeEndIso = weekEnd.toISOString()
          callsQuery = callsQuery
            .gte('started_at', rangeStartIso)
            .lt('started_at', rangeEndIso)
          countQuery = countQuery
            .gte('started_at', rangeStartIso)
            .lt('started_at', rangeEndIso)
        }

        const [{ data: callRows, error }, { count }] = await Promise.all([
          callsQuery,
          countQuery
        ])
        if (error) throw error

        const normalizedCount = Number(count || 0)

        let allCallRows = callRows || []
        if (normalizedCount > allCallRows.length) {
          for (
            let offset = allCallRows.length;
            offset < normalizedCount;
            offset += CALLS_FETCH_LIMIT
          ) {
            const { data: nextRows, error: nextError } = await supabase.current
              .from('calls')
              .select(
                'id, external_call_id, status, management_status, from_number, started_at, duration_seconds, call_outcome, is_urgent, patient_id, caller_contact_id, metadata, initial_clinic_id, recording_url, intent_summary'
              )
              .or(clinicFilter)
              .gte('started_at', weekStart ? weekStart.toISOString() : '1970-01-01T00:00:00.000Z')
              .lt('started_at', weekEnd ? weekEnd.toISOString() : '9999-12-31T23:59:59.999Z')
              .order('started_at', { ascending: false })
              .range(offset, offset + CALLS_FETCH_LIMIT - 1)
            if (nextError) throw nextError
            if (!nextRows || nextRows.length === 0) break
            allCallRows = [...allCallRows, ...nextRows]
          }
        }

        const patientIds = Array.from(
          new Set(allCallRows.map((row) => row.patient_id).filter(Boolean))
        )
        const contactIds = Array.from(
          new Set(allCallRows.map((row) => row.caller_contact_id).filter(Boolean))
        )
        const callIds = allCallRows
          .map((row) => Number(row.id))
          .filter((value) => Number.isFinite(value))

        const [patientsRes, contactsRes, callLogsRes, webhookEventsRes, appointmentsRes] =
          await Promise.all([
          patientIds.length
            ? supabase.current
                .from('patients')
                .select('id, first_name, last_name, phone_number')
                .in('id', patientIds)
            : Promise.resolve({ data: [], error: null }),
          contactIds.length
            ? supabase.current
                .from('contacts')
                .select('id, full_name, phone_primary')
                .in('id', contactIds)
            : Promise.resolve({ data: [], error: null }),
          callIds.length
            ? supabase.current
                .from('call_logs')
                .select('call_id, transcript_text, call_summary, duration_seconds, started_at')
                .in('call_id', callIds)
            : Promise.resolve({ data: [], error: null }),
          callIds.length
            ? supabase.current
                .from('webhook_events')
                .select('related_call_id, payload, received_at')
                .in('related_call_id', callIds)
                .order('received_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          callIds.length
            ? supabase.current
                .from('appointments')
                .select('id, created_by_call_id')
                .in('created_by_call_id', callIds)
            : Promise.resolve({ data: [], error: null })
          ])
        if (patientsRes.error) throw patientsRes.error
        if (contactsRes.error) throw contactsRes.error
        if (callLogsRes.error) throw callLogsRes.error
        if (webhookEventsRes.error) throw webhookEventsRes.error
        if (appointmentsRes.error) throw appointmentsRes.error

        const patientsById = new Map(
          (patientsRes.data || []).map((row) => [
            String(row.id),
            {
              fullName: [String(row.first_name || ''), String(row.last_name || '')]
                .join(' ')
                .trim(),
              phone: String(row.phone_number || '')
            }
          ])
        )
        const callLogsByCallId = new Map(
          (callLogsRes.data || []).map((row) => [String(row.call_id), row])
        )
        const payloadByCallId = new Map<string, Record<string, unknown>>()
        for (const row of webhookEventsRes.data || []) {
          const callId = row.related_call_id ? String(row.related_call_id) : ''
          if (!callId || payloadByCallId.has(callId)) continue
          const payload = safeJson(row.payload)
          if (payload) {
            payloadByCallId.set(callId, payload)
          }
        }
        const appointmentByCallId = new Map(
          (appointmentsRes.data || []).map((row) => [
            String(row.created_by_call_id),
            String(row.id)
          ])
        )
        const contactsById = new Map(
          (contactsRes.data || []).map((row) => [
            String(row.id),
            {
              fullName: String(row.full_name || '').trim(),
              phone: String(row.phone_primary || '')
            }
          ])
        )

        const hydrated: CallRecord[] = allCallRows.map((row) => {
          const callId = String(row.id)
          const webhookPayload = payloadByCallId.get(callId) || null
          const callLog = callLogsByCallId.get(callId) || null
          const payloadStartedAt = parseStartedAtFromPayload(webhookPayload)
          const startedAtRaw =
            asString(row.started_at).trim() ||
            asString(callLog?.started_at).trim() ||
            payloadStartedAt ||
            null
          const startedAt = startedAtRaw ? new Date(startedAtRaw) : new Date()
          const payloadDuration = parseDurationFromPayload(webhookPayload)
          const durationSeconds = Math.max(
            parseDurationSeconds(row.duration_seconds),
            parseDurationSeconds(callLog?.duration_seconds),
            payloadDuration
          )
          const patient =
            (row.patient_id ? patientsById.get(String(row.patient_id)) : null) ||
            (row.caller_contact_id
              ? contactsById.get(String(row.caller_contact_id))
              : null) ||
            null
          const metadata =
            row.metadata && typeof row.metadata === 'object'
              ? (row.metadata as Record<string, unknown>)
              : null
          const managementStatusSource = asString(row.management_status).trim()
          const payloadCall = safeJson(webhookPayload?.call)
          const payloadCustomAnalysis = safeJson(
            safeJson(payloadCall?.call_analysis)?.custom_analysis_data
          )
          const metadataPatientName =
            (typeof metadata?.patient_name === 'string' && metadata.patient_name.trim()) ||
            (typeof metadata?.patient_full_name === 'string' &&
              metadata.patient_full_name.trim()) ||
            (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
            (typeof metadata?.caller_name === 'string' && metadata.caller_name.trim()) ||
            null
          const payloadPatientName =
            asString(payloadCustomAnalysis?.full_name).trim() ||
            asString(payloadCustomAnalysis?.patient_name).trim() ||
            asString(safeJson(payloadCall?.retell_llm_dynamic_variables)?.name).trim() ||
            asString(safeJson(payloadCall?.collected_dynamic_variables)?.patient_name).trim() ||
            null
          const patientName =
            (patient?.fullName && patient.fullName.trim()) ||
            metadataPatientName ||
            payloadPatientName ||
            null
          const phone =
            String(row.from_number || '').trim() ||
            patient?.phone ||
            (typeof metadata?.caller_phone === 'string' ? metadata.caller_phone.trim() : '') ||
            asString(safeJson(payloadCall?.retell_llm_dynamic_variables)?.from_number).trim() ||
            '—'
          const extractedSummary = extractSummary(webhookPayload)
          const callLogSummary = asString(callLog?.call_summary).trim()
          const rowSummaryRaw = String(row.call_outcome || '').trim()
          const rowSummary = isPlaceholderSummary(rowSummaryRaw) ? '' : rowSummaryRaw
          const summaryRaw = rowSummary || callLogSummary || extractedSummary
          const summary = isPlaceholderSummary(summaryRaw)
            ? 'Sin resumen disponible.'
            : summaryRaw
          const callLogTranscript = asString(callLog?.transcript_text).trim()
          const payloadTranscript = extractTranscript(webhookPayload)
          const transcript = callLogTranscript || payloadTranscript || null
          const recordingUrl =
            asString(row.recording_url).trim() ||
            asString(metadata?.recording_url).trim() ||
            extractRecordingUrl(webhookPayload) ||
            null
          const intentSource = [
            asString(metadata?.call_reason),
            asString(payloadCustomAnalysis?.call_reason),
            asString(payloadCall?.call_reason),
            asString(metadata?.intent),
            asString(metadata?.call_intent),
            asString(metadata?.reason),
            asString(row.intent_summary),
            asString(row.call_outcome)
          ]
            .map((value) => value.trim())
            .find(Boolean)
          const mappedIntent = mapIntent(intentSource || '')
          const sentimentSource = [
            asString(metadata?.feeling),
            asString(metadata?.sentiment),
            asString(metadata?.emotion),
            asString(payloadCustomAnalysis?.feeling),
            asString(payloadCustomAnalysis?.sentiment),
            asString(payloadCustomAnalysis?.emotion)
          ]
            .map((value) => value.trim())
            .find(Boolean)
          return {
            id: callId,
            externalCallId: asString(row.external_call_id).trim() || null,
            startedAt: startedAtRaw,
            status: mapCallStatus(
              String(row.status || ''),
              Boolean(row.is_urgent),
              managementStatusSource
            ),
            time: startedAt.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            patient: patientName,
            phone,
            intent: mappedIntent,
            intentDisplay: getIntentDisplay(intentSource || '', mappedIntent),
            duration: durationTextFromSeconds(durationSeconds),
            summary,
            transcript,
            recordingUrl,
            sentiment: mapSentiment(sentimentSource || ''),
            appointmentId: appointmentByCallId.get(callId)
          }
        })
        const normalizedCalls = dedupeAndFilterCalls(hydrated)
        if (isMounted) {
          setLocalCalls(normalizedCalls)
          setTotalCallsAvailable(normalizedCalls.length)
        }
      } catch (error) {
        console.warn('CallsTable hydration failed', error)
        if (isMounted) {
          setLocalCalls([])
          setTotalCallsAvailable(0)
        }
      }
    }
    void hydrateCalls()
    return () => {
      isMounted = false
    }
  }, [activeClinicId, data, isClinicInitialized, refreshTick, selectedWeekStart])

  // Listen for appointment status changes to sync call status (ADVANCED MODE ONLY)
  useEffect(() => {
    // Only sync with appointments in advanced mode
    if (voiceAgentTier !== 'advanced') return

    const handleAppointmentStatusChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        appointmentId: string
        voiceAgentCallId: string
        oldStatus: string
        newStatus: string
      }

      // Map appointment status to call status
      const statusMap: Record<string, CallRecord['status']> = {
        Confirmada: 'resuelta',
        'No confirmada': 'pendiente',
        Reagendar: 'pendiente',
        'Pendiente IA': 'nueva'
      }

      const newCallStatus = statusMap[detail.newStatus]
      if (!newCallStatus) return

      // Update the call status
      setLocalCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === detail.voiceAgentCallId
            ? { ...call, status: newCallStatus }
            : call
        )
      )

      console.log(
        `🔄 Voice Agent [Advanced]: Call ${detail.voiceAgentCallId} status updated to ${newCallStatus} (from appointment ${detail.appointmentId})`
      )
    }

    const handleAppointmentVisitStatusChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        appointmentId: string
        voiceAgentCallId: string
        oldVisitStatus: string
        newVisitStatus: string
      }

      // If appointment is completed, mark call as resolved
      if (detail.newVisitStatus === 'completed') {
        setLocalCalls((prevCalls) =>
          prevCalls.map((call) =>
            call.id === detail.voiceAgentCallId
              ? { ...call, status: 'resuelta' }
              : call
          )
        )

        console.log(
          `🔄 Voice Agent [Advanced]: Call ${detail.voiceAgentCallId} marked as resolved (appointment completed)`
        )
      }
    }

    window.addEventListener(
      'appointment:status-change',
      handleAppointmentStatusChange
    )
    window.addEventListener(
      'appointment:visit-status-change',
      handleAppointmentVisitStatusChange
    )

    return () => {
      window.removeEventListener(
        'appointment:status-change',
        handleAppointmentStatusChange
      )
      window.removeEventListener(
        'appointment:visit-status-change',
        handleAppointmentVisitStatusChange
      )
    }
  }, [voiceAgentTier])

  // Auto-transition from 'nueva' to 'pendiente' after X hours (BASIC MODE ONLY)
  // In basic mode, calls don't auto-create appointments, so we use time-based transitions
  useEffect(() => {
    // Only apply auto-pending in basic mode
    if (voiceAgentTier !== 'basic') return

    // Check every minute for calls that should transition
    const checkInterval = setInterval(() => {
      const now = new Date()

      setLocalCalls((prevCalls) =>
        prevCalls.map((call) => {
          // Only transition 'nueva' calls
          if (call.status !== 'nueva') return call

          // Parse call time (assuming today's date for mock data)
          // In production, CallRecord should include a full timestamp
          const [hours, minutes] = call.time.split(':').map(Number)
          const callTime = new Date()
          callTime.setHours(hours, minutes, 0, 0)

          // Calculate hours since call
          const hoursSinceCall =
            (now.getTime() - callTime.getTime()) / (1000 * 60 * 60)

          // Transition to 'pendiente' if enough time has passed
          if (hoursSinceCall >= AUTO_PENDING_HOURS) {
            console.log(
              `🔄 Voice Agent [Basic]: Call ${
                call.id
              } auto-transitioned from 'nueva' to 'pendiente' (${hoursSinceCall.toFixed(
                1
              )}h elapsed)`
            )
            return { ...call, status: 'pendiente' }
          }

          return call
        })
      )
    }, 60000) // Check every minute

    // Also run once immediately
    const immediateCheck = setTimeout(() => {
      const now = new Date()

      setLocalCalls((prevCalls) =>
        prevCalls.map((call) => {
          if (call.status !== 'nueva') return call

          const [hours, minutes] = call.time.split(':').map(Number)
          const callTime = new Date()
          callTime.setHours(hours, minutes, 0, 0)

          const hoursSinceCall =
            (now.getTime() - callTime.getTime()) / (1000 * 60 * 60)

          if (hoursSinceCall >= AUTO_PENDING_HOURS) {
            console.log(
              `🔄 Voice Agent [Basic]: Call ${
                call.id
              } auto-transitioned from 'nueva' to 'pendiente' (${hoursSinceCall.toFixed(
                1
              )}h elapsed)`
            )
            return { ...call, status: 'pendiente' }
          }

          return call
        })
      )
    }, 0)

    return () => {
      clearInterval(checkInterval)
      clearTimeout(immediateCheck)
    }
  }, [voiceAgentTier])

  // State for quick actions menu
  const [activeMenuRow, setActiveMenuRow] = useState<CallRecord | null>(null)
  const [menuTriggerRect, setMenuTriggerRect] = useState<DOMRect | undefined>()

  // State for listen call modal
  const [listenCallRow, setListenCallRow] = useState<CallRecord | null>(null)

  // State for assign professional modal
  const [assignProfessionalRow, setAssignProfessionalRow] =
    useState<CallRecord | null>(null)

  // State for transcription modal
  const [transcriptionRow, setTranscriptionRow] = useState<CallRecord | null>(
    null
  )

  // State for call detail modal
  const [detailRow, setDetailRow] = useState<CallRecord | null>(null)

  // State for call modal (devolver llamada)
  const [callModalRow, setCallModalRow] = useState<CallRecord | null>(null)

  // State for summary tooltip
  const [summaryTooltip, setSummaryTooltip] = useState<{
    text: string
    rect: DOMRect
  } | null>(null)
  const [intentTooltip, setIntentTooltip] = useState<{
    text: string
    rect: DOMRect
  } | null>(null)

  // State for search input visibility
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Handle callId from URL (coming from Agenda "Ver llamada IA" action)
  useEffect(() => {
    const callId = searchParams.get('callId')
    if (!callId) return

    // Find the call record with this ID (using localCalls for synced state)
    const call = localCalls.find((c) => c.id === callId)
    if (call) {
      // Open the call detail modal
      setDetailRow(call)
      // Clear the URL parameter to prevent re-triggering
      router.replace('/agente-voz', { scroll: false })
      console.log(`✅ Llamada ${callId} encontrada y mostrando detalles`)
    } else {
      console.log(`⚠️ Llamada ${callId} no encontrada en los datos`)
    }
  }, [searchParams, localCalls, router])

  // Handle search toggle
  const handleSearchToggle = () => {
    if (isSearchOpen && searchQuery) {
      // If closing with text, clear the search
      setSearchQuery('')
      setCurrentPage(1)
    }
    setIsSearchOpen(!isSearchOpen)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('')
    setCurrentPage(1)
    searchInputRef.current?.focus()
  }

  // Filtered data (using localCalls for synced state)
  const filteredData = useMemo(() => {
    let result = localCalls

    // Apply status filter
    if (filter === 'pendientes') {
      result = result.filter(
        (r) => r.status === 'pendiente' || r.status === 'nueva'
      )
    } else if (filter === 'urgentes') {
      result = result.filter((r) => r.status === 'urgente')
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.patient?.toLowerCase().includes(query) ||
          r.phone.toLowerCase().includes(query) ||
          CALL_INTENT_LABELS[r.intent].toLowerCase().includes(query) ||
          getDisplayedIntent(r).toLowerCase().includes(query)
      )
    }

    return result
  }, [localCalls, filter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredData.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredData, currentPage])

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: CallFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  // Handle opening quick actions menu
  const handleOpenMenu = (
    row: CallRecord,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuTriggerRect(rect)
    setActiveMenuRow(row)
  }

  // Quick action handlers
  const handleCall = (row: CallRecord) => {
    setCallModalRow(row)
  }

  const persistCallManagementStatus = async (
    row: CallRecord,
    managementStatus: 'new' | 'pending' | 'in_progress' | 'resolved'
  ): Promise<boolean> => {
    const numericId = Number(row.id)
    const idFilter = Number.isFinite(numericId) ? numericId : row.id
    const { error } = await supabase.current
      .from('calls')
      .update({
        management_status: managementStatus
      })
      .eq('id', idFilter)

    if (error) {
      console.warn('Failed to persist management status', {
        callId: row.id,
        managementStatus,
        error
      })
      return false
    }

    const nextUiStatus: CallRecord['status'] =
      managementStatus === 'resolved'
        ? 'resuelta'
        : managementStatus === 'in_progress'
          ? 'en_curso'
          : managementStatus === 'new'
            ? 'nueva'
            : 'pendiente'

    setLocalCalls((prevCalls) =>
      prevCalls.map((call) =>
        call.id === row.id ? { ...call, status: nextUiStatus } : call
      )
    )
    setRefreshTick((current) => current + 1)
    return true
  }

  const transitionNewCallToPending = (row: CallRecord) => {
    if (row.status !== 'nueva') return
    void persistCallManagementStatus(row, 'pending')
  }

  // Handler para marcar llamada como resuelta (desde el modal de devolver llamada)
  const handleCallModalResolved = async (row: CallRecord) => {
    await persistCallManagementStatus(row, 'resolved')
    setCallModalRow(null)
    console.log(
      `📞 Voice Agent [${voiceAgentTier}]: Call ${row.id} marked as resolved after callback`
    )
  }

  const handleViewAppointment = (row: CallRecord) => {
    if (row.appointmentId) {
      // Navigate to agenda with the appointment highlighted
      router.push(`/agenda?appointmentId=${row.appointmentId}`)
    } else {
      // No appointment linked - show alert
      alert('Esta llamada no tiene una cita vinculada en la agenda.')
    }
  }

  // Handler para crear cita manualmente (intenciones que no crean cita automáticamente)
  const handleCreateAppointment = (row: CallRecord) => {
    // Navegar a la agenda con datos prellenados para crear cita
    const intentText = getDisplayedIntent(row)
    const params = new URLSearchParams({
      action: 'create',
      paciente: row.patient || '',
      pacientePhone: row.phone,
      observaciones: `${intentText} - ${row.summary}`,
      createdByVoiceAgent: 'true',
      voiceAgentCallId: row.id
    })
    router.push(`/agenda?${params.toString()}`)
  }

  const handleMarkResolved = async (row: CallRecord) => {
    const targetStatus = row.status === 'resuelta' ? 'pending' : 'resolved'
    await persistCallManagementStatus(row, targetStatus)
    console.log(
      `✅ Voice Agent [${voiceAgentTier}]: Call ${row.id} set to ${targetStatus}`
    )
  }

  const handleListenCall = (row: CallRecord) => {
    transitionNewCallToPending(row)
    setListenCallRow(row)
  }

  const handleViewTranscription = (row: CallRecord) => {
    transitionNewCallToPending(row)
    setTranscriptionRow(row)
  }

  const handleAssignProfessional = (row: CallRecord) => {
    setAssignProfessionalRow(row)
  }

  const handleMoreInfo = (row: CallRecord) => {
    transitionNewCallToPending(row)
    setDetailRow(row)
  }

  return (
    <div className='flex flex-col w-full h-full'>
      {/* Toolbar - Fixed */}
      <div className='flex items-center justify-between gap-4 pb-4 shrink-0 bg-surface-app'>
        {/* View toggle icons */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setViewMode('table')}
            className={`p-1 transition-colors rounded ${
              viewMode === 'table'
                ? 'text-brand-600 bg-brand-50'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label='Vista de tabla'
            aria-pressed={viewMode === 'table'}
          >
            <span className='material-symbols-rounded text-2xl'>reorder</span>
          </button>
          <button
            type='button'
            onClick={() => setViewMode('cards')}
            className={`p-1 transition-colors rounded ${
              viewMode === 'cards'
                ? 'text-brand-600 bg-brand-50'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label='Vista de tarjetas'
            aria-pressed={viewMode === 'cards'}
          >
            <span className='material-symbols-rounded text-2xl -rotate-90'>
              splitscreen
            </span>
          </button>
          <span className='ml-2 text-label-sm text-neutral-500'>
            Mostrando {filteredData.length.toLocaleString('es-ES')} de{' '}
            {totalCallsAvailable.toLocaleString('es-ES')} llamadas
          </span>
        </div>

        {/* Filters */}
        <div className='flex items-center gap-2'>
          {/* Search - Expandable */}
          <div className='flex items-center'>
            {isSearchOpen && (
              <div className='flex items-center gap-1 mr-1'>
                <div className='relative'>
                  <input
                    ref={searchInputRef}
                    type='text'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder='Buscar paciente, teléfono...'
                    className='w-[14rem] pl-3 pr-8 py-1.5 text-body-sm border border-neutral-300 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={handleSearchClear}
                      className='absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 transition-colors'
                    >
                      <span className='material-symbols-rounded text-lg'>
                        close
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
            <button
              type='button'
              onClick={handleSearchToggle}
              className={`p-2 rounded-full transition-colors ${
                isSearchOpen || searchQuery
                  ? 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
              aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
            >
              <span className='material-symbols-rounded text-2xl'>
                {isSearchOpen ? 'search_off' : 'search'}
              </span>
            </button>
          </div>

          {/* Filter: Todos */}
          <button
            type='button'
            onClick={() => handleFilterChange('todos')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-body-sm transition-colors ${
              filter === 'todos'
                ? 'border-brand-500 text-brand-500 bg-brand-50'
                : 'border-neutral-700 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span className='material-symbols-rounded text-lg'>filter_alt</span>
            <span>Todos</span>
          </button>

          {/* Filter: Pendientes */}
          <button
            type='button'
            onClick={() => handleFilterChange('pendientes')}
            className={`flex items-center px-2 py-1 rounded-full border text-body-sm transition-colors ${
              filter === 'pendientes'
                ? 'border-brand-500 text-brand-500 bg-brand-50'
                : 'border-neutral-700 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>Pendientes</span>
          </button>

          {/* Filter: Urgentes */}
          <button
            type='button'
            onClick={() => handleFilterChange('urgentes')}
            className={`flex items-center px-2 py-1 rounded-full border text-body-sm transition-colors ${
              filter === 'urgentes'
                ? 'border-error-600 text-error-600 bg-error-50'
                : 'border-error-600 text-error-600 hover:bg-error-50'
            }`}
          >
            <span>Urgentes</span>
          </button>
        </div>
      </div>

      {/* Content Container - Table or Cards View */}
      <div className='flex-1 min-h-0 overflow-hidden flex flex-col'>
        {viewMode === 'cards' ? (
          <CallCardsView
            calls={paginatedData}
            onCall={handleCall}
            canCallActions={canCallActions}
            onMarkResolved={handleMarkResolved}
            onAddNote={(call) => {
              // TODO: Implement add note functionality
              console.log('Add note to call:', call.id)
            }}
            onShowDetail={handleMoreInfo}
            onViewAppointment={handleViewAppointment}
            onCreateAppointment={handleCreateAppointment}
            onListenCall={handleListenCall}
            onViewTranscription={handleViewTranscription}
            onAssignProfessional={handleAssignProfessional}
            voiceAgentTier={voiceAgentTier}
          />
        ) : (
          <div className='w-full table-scroll-x flex-1 flex flex-col'>
            <table className='w-full min-w-[80rem] table-fixed'>
              {/* Header - Sticky vertical and horizontal for key columns */}
              <thead className='sticky top-0 z-20 bg-surface-app'>
                <tr className='border-b border-neutral-300'>
                  {/* Estado - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[6.5625rem] sticky left-0 z-30 bg-surface-app'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        label
                      </span>
                      <span>Estado</span>
                    </div>
                  </th>
                  {/* Hora - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[6rem] sticky left-[6.5625rem] z-30 bg-surface-app'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        schedule
                      </span>
                      <span>Hora</span>
                    </div>
                  </th>
                  {/* Paciente - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[14.625rem] sticky left-[12.5625rem] z-30 bg-surface-app border-r border-neutral-300'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        person
                      </span>
                      <span>Paciente</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[10.6875rem]'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        phone
                      </span>
                      <span>Teléfono</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[12.4375rem]'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        psychology
                      </span>
                      <span>Intención</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[5.875rem]'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        timer
                      </span>
                      <span>Duración</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        notes
                      </span>
                      <span>Resumen</span>
                    </div>
                  </th>
                  {/* Sentimiento - Sticky right */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[10.5625rem] sticky right-0 z-30 bg-surface-app border-l border-neutral-300'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        mood
                      </span>
                      <span>Sentimiento</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Body - Scrollable */}
              <tbody>
                {paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className='border-b border-neutral-300 group'
                  >
                    {/* Estado - Sticky left */}
                    <td className='px-2 py-2 border-r border-neutral-300 sticky left-0 z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      <CallStatusBadge status={row.status} />
                    </td>

                    {/* Hora - Sticky left */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 sticky left-[6.5625rem] z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      {row.time}
                    </td>

                    {/* Paciente - Sticky left */}
                    <td className='px-2 py-2 border-r border-neutral-300 sticky left-[12.5625rem] z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      <span
                        className={`text-body-md ${
                          row.patient ? 'text-neutral-900' : 'text-neutral-400'
                        }`}
                      >
                        {row.patient ?? 'Pendiente de asignar'}
                      </span>
                    </td>

                    {/* Teléfono */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      {row.phone}
                    </td>

                    {/* Intención */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      <div
                        className='truncate cursor-pointer hover:text-brand-600 transition-colors'
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setIntentTooltip({
                            text: getDisplayedIntent(row),
                            rect
                          })
                        }}
                        onMouseLeave={() => setIntentTooltip(null)}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const nextText = getDisplayedIntent(row)
                          setIntentTooltip(
                            intentTooltip?.text === nextText
                              ? null
                              : { text: nextText, rect }
                          )
                        }}
                        title={getDisplayedIntent(row)}
                      >
                        {getDisplayedIntent(row)}
                      </div>
                    </td>

                    {/* Duración */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      {row.duration}
                    </td>

                    {/* Resumen */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      <div
                        className='truncate cursor-pointer hover:text-brand-600 transition-colors'
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setSummaryTooltip({ text: row.summary, rect })
                        }}
                        onMouseLeave={() => setSummaryTooltip(null)}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setSummaryTooltip(
                            summaryTooltip?.text === row.summary
                              ? null
                              : { text: row.summary, rect }
                          )
                        }}
                      >
                        {row.summary}
                      </div>
                    </td>

                    {/* Sentimiento + Actions - Sticky right */}
                    <td className='px-2 py-2 sticky right-0 z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors border-l border-neutral-300'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-body-md text-neutral-900'>
                          {SENTIMENT_LABELS[row.sentiment]}
                        </span>
                        <button
                          type='button'
                          onClick={(e) => handleOpenMenu(row, e)}
                          className='p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors'
                          aria-label='Acciones'
                        >
                          <span className='material-symbols-rounded text-xl'>
                            more_vert
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className='flex items-center justify-end gap-3 pt-4 shrink-0 bg-surface-app'>
          {/* First page */}
          <button
            type='button'
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>first_page</span>
          </button>

          {/* Previous page */}
          <button
            type='button'
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>
              chevron_left
            </span>
          </button>

          {/* Page numbers */}
          <div className='flex items-center gap-2 text-body-sm'>
            <span
              className={`${
                currentPage === 1 ? 'font-bold underline' : ''
              } text-neutral-900`}
            >
              1
            </span>
            {totalPages > 1 && (
              <span
                className={`cursor-pointer ${
                  currentPage === 2 ? 'font-bold underline' : ''
                } text-neutral-900`}
                onClick={() => setCurrentPage(2)}
              >
                2
              </span>
            )}
            {totalPages > 3 && <span className='text-neutral-900'>...</span>}
            {totalPages > 2 && (
              <span
                className={`cursor-pointer ${
                  currentPage === totalPages ? 'font-bold underline' : ''
                } text-neutral-900`}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </span>
            )}
          </div>

          {/* Next page */}
          <button
            type='button'
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>
              chevron_right
            </span>
          </button>

          {/* Last page */}
          <button
            type='button'
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>last_page</span>
          </button>
        </div>
      )}

      {/* Quick Actions Menu Portal */}
      {activeMenuRow && (
        <Portal>
          <CallQuickActionsMenu
            row={activeMenuRow}
            triggerRect={menuTriggerRect}
            onClose={() => setActiveMenuRow(null)}
            onCall={() => handleCall(activeMenuRow)}
            onViewAppointment={() => handleViewAppointment(activeMenuRow)}
            onCreateAppointment={() => handleCreateAppointment(activeMenuRow)}
            onMarkResolved={() => handleMarkResolved(activeMenuRow)}
            onListenCall={() => handleListenCall(activeMenuRow)}
            onViewTranscription={() => handleViewTranscription(activeMenuRow)}
            onAssignProfessional={() => handleAssignProfessional(activeMenuRow)}
            onMoreInfo={() => handleMoreInfo(activeMenuRow)}
            voiceAgentTier={voiceAgentTier}
            canCallActions={canCallActions}
          />
        </Portal>
      )}

      {/* Listen Call Modal */}
      {listenCallRow && (
        <ListenCallModal
          call={listenCallRow}
          onClose={() => setListenCallRow(null)}
        />
      )}

      {/* Assign Professional Modal */}
      {assignProfessionalRow && (
        <AssignProfessionalModal
          call={assignProfessionalRow}
          onClose={() => setAssignProfessionalRow(null)}
          onAssign={(professionalId) => {
            console.log(
              'Asignado profesional:',
              professionalId,
              'a llamada:',
              assignProfessionalRow.id
            )
            // TODO: Implement actual assignment logic
          }}
        />
      )}

      {/* Transcription Modal */}
      {transcriptionRow && (
        <TranscriptionModal
          call={transcriptionRow}
          onClose={() => setTranscriptionRow(null)}
        />
      )}

      {/* Call Modal (Devolver llamada) */}
      {callModalRow && (
        <CallModal
          call={callModalRow}
          onClose={() => setCallModalRow(null)}
          onMarkResolved={() => handleCallModalResolved(callModalRow)}
        />
      )}

      {/* Call Detail Modal */}
      {detailRow && (
        <CallDetailModal
          call={detailRow}
          onClose={() => setDetailRow(null)}
          onCall={canCallActions ? () => handleCall(detailRow) : undefined}
          onCreateAppointment={(prefill) => {
            // Navigate to agenda to create appointment with pre-filled data
            // Encode the prefill data as URL parameters
            const params = new URLSearchParams()
            params.set('action', 'create')
            if (prefill.paciente) params.set('paciente', prefill.paciente)
            if (prefill.pacientePhone)
              params.set('pacientePhone', prefill.pacientePhone)
            if (prefill.observaciones)
              params.set('observaciones', prefill.observaciones)
            if (prefill.createdByVoiceAgent)
              params.set('createdByVoiceAgent', 'true')
            if (prefill.voiceAgentCallId)
              params.set('voiceAgentCallId', prefill.voiceAgentCallId)
            router.push(`/agenda?${params.toString()}`)
          }}
          onViewAppointment={(appointmentId) => {
            // Navigate to agenda with the appointment highlighted
            router.push(`/agenda?appointmentId=${appointmentId}`)
          }}
          voiceAgentTier={voiceAgentTier}
          onMarkResolved={() => handleMarkResolved(detailRow)}
        />
      )}

      {/* Summary Tooltip */}
      {summaryTooltip && (
        <Portal>
          <div
            className='fixed z-[9999] bg-neutral-100 rounded-lg p-4 shadow-lg border border-neutral-200 max-w-[17.5rem]'
            style={{
              top: summaryTooltip.rect.bottom + 8,
              left: Math.min(summaryTooltip.rect.left, window.innerWidth - 300)
            }}
            onMouseEnter={() => {
              // Keep tooltip open when hovering over it
            }}
            onMouseLeave={() => setSummaryTooltip(null)}
          >
            <p className='text-body-sm text-neutral-900'>
              {summaryTooltip.text}
            </p>
          </div>
        </Portal>
      )}
      {intentTooltip && (
        <Portal>
          <div
            className='fixed z-[9999] bg-neutral-100 rounded-lg p-4 shadow-lg border border-neutral-200 max-w-[20rem]'
            style={{
              top: intentTooltip.rect.bottom + 8,
              left: Math.min(intentTooltip.rect.left, window.innerWidth - 340)
            }}
            onMouseLeave={() => setIntentTooltip(null)}
          >
            <p className='text-body-sm text-neutral-900'>{intentTooltip.text}</p>
          </div>
        </Portal>
      )}
    </div>
  )
}
