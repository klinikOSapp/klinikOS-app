'use client'

import { useClinic } from '@/context/ClinicContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import CallDistributionDonut from './CallDistributionDonut'
import CallVolumeChart from './CallVolumeChart'
import CallsTable from './CallsTable'
import VoiceAgentKPICard from './VoiceAgentKPICard'
import type {
  CallDistribution,
  CallVolumeDataPoint,
  VoiceAgentAnalyticsResponse,
  VoiceAgentKPI,
  VoiceAgentTier
} from './voiceAgentTypes'

// Helper: Get the start of the week (Monday) for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust to Monday (day 0 = Sunday, so we need to go back to previous Monday)
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper: Get the end of the week (Sunday) for a given date
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  return d
}

// Helper: Format date range for display
function formatWeekRange(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart)
  const startDay = weekStart.getDate()
  const endDay = weekEnd.getDate()
  const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'short' })
  const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'short' })
  const year = weekEnd.getFullYear()

  // If same month, show: "27 - 2 Feb 2026" or "27 Ene - 2 Feb 2026" if different months
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${year}`
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
}

// Helper: Check if two dates are in the same week
function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = getWeekStart(date1)
  const week2 = getWeekStart(date2)
  return week1.getTime() === week2.getTime()
}

type VoiceKpiStats = {
  appointmentsCreated: number
  callsReceived: number
  avgDurationSeconds: number
  resolvedCalls: number
  pendingCalls: number
  creditsUsed: number
  avgWaitSeconds: number | null
}

const CREDIT_RATE_PER_MINUTE = 0.1

const EMPTY_STATS: VoiceKpiStats = {
  appointmentsCreated: 0,
  callsReceived: 0,
  avgDurationSeconds: 0,
  resolvedCalls: 0,
  pendingCalls: 0,
  creditsUsed: 0,
  avgWaitSeconds: null
}

type KpiRawCallRow = {
  id: number | string
  external_call_id: string | null
  status: string | null
  management_status: string | null
  duration_seconds: number | null
  metadata: unknown
  recording_url: string | null
  from_number: string | null
  started_at: string | null
}

type ClinicTier = 'basic' | 'complete'

const EMPTY_DISTRIBUTION_ADVANCED: CallDistribution[] = [
  { name: 'Pendientes', value: 0, color: '#E9FBF9' },
  { name: 'Confirmadas', value: 0, color: '#A8EFE7' },
  { name: 'Aceptadas', value: 0, color: '#51D6C7' },
  { name: 'Estética', value: 0, color: '#2A6B67' }
]

const EMPTY_DISTRIBUTION_BASIC: CallDistribution[] = [
  { name: 'Pedir cita', value: 0, color: '#51D6C7' },
  { name: 'Cambiar cita', value: 0, color: '#B8D0FF' },
  { name: 'Consultas', value: 0, color: '#A8EFE7' },
  { name: 'Cancelaciones', value: 0, color: '#FFD188' },
  { name: 'Urgencias', value: 0, color: '#FF6B6B' }
]

const EMPTY_VOLUME_DATA: CallVolumeDataPoint[] = [
  { day: 'Lun', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 },
  { day: 'Mar', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 },
  { day: 'Mie', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 },
  { day: 'Jue', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 },
  { day: 'Vie', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 },
  { day: 'Sab', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 },
  { day: 'Dom', volumeTotal: 0, citasPropuestas: 0, citasAceptadas: 0, urgentes: 0 }
]

function formatDurationShort(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safe / 60)
  const remainingSeconds = safe % 60
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`
  return `${remainingSeconds}s`
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function normalizeClinicTier(value: unknown): ClinicTier | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes('basic')) return 'basic'
  if (
    normalized.includes('complete') ||
    normalized.includes('advanced') ||
    normalized.includes('full')
  ) {
    return 'complete'
  }
  return null
}

function resolveClinicTier(record: Record<string, unknown> | null): ClinicTier | null {
  if (!record) return null
  const candidates = [
    record.tier,
    record.Tier,
    record.subscription_tier,
    record.subscription_plan,
    record.voice_agent_tier,
    record.voice_agent_plan,
    record.plan
  ]
  for (const candidate of candidates) {
    const normalized = normalizeClinicTier(candidate)
    if (normalized) return normalized
  }
  return null
}

function parseDurationSeconds(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.round(parsed)
}

function getStartedTs(value: string | null): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function dedupeCallsForStats(rows: KpiRawCallRow[]): KpiRawCallRow[] {
  const deduped = new Map<string, KpiRawCallRow>()

  for (const row of rows) {
    const key =
      asString(row.external_call_id).trim() ||
      asString(row.recording_url).trim() ||
      `${asString(row.from_number).trim()}|${asString(row.started_at).trim()}`
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, row)
      continue
    }
    const shouldReplace =
      parseDurationSeconds(row.duration_seconds) >
        parseDurationSeconds(existing.duration_seconds) ||
      getStartedTs(row.started_at) > getStartedTs(existing.started_at)
    if (shouldReplace) deduped.set(key, row)
  }

  return Array.from(deduped.values())
}

function isResolvedWorkflowStatus(
  managementStatusRaw: string | null,
  lifecycleStatusRaw: string | null
): boolean {
  const managementStatus = normalizeText(managementStatusRaw || '')
  if (managementStatus) {
    return managementStatus.includes('resolved') || managementStatus.includes('resuelt')
  }
  const lifecycle = normalizeText(lifecycleStatusRaw || '')
  return lifecycle.includes('resolved') || lifecycle.includes('completed')
}

function getDelta(current: number, previous: number) {
  if (previous <= 0) {
    if (current <= 0) return { changePercent: '0%', changeDirection: 'up' as const }
    return { changePercent: '+100%', changeDirection: 'up' as const }
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  return {
    changePercent: `${pct >= 0 ? '+' : ''}${pct}%`,
    changeDirection: pct >= 0 ? ('up' as const) : ('down' as const)
  }
}

async function fetchVoiceStats(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  clinicId: string,
  rangeStart: Date,
  rangeEndExclusive: Date
): Promise<VoiceKpiStats> {
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select(
      'id, external_call_id, status, management_status, duration_seconds, metadata, recording_url, from_number, started_at'
    )
    .or(`clinic_id.eq.${clinicId},initial_clinic_id.eq.${clinicId}`)
    .gte('started_at', rangeStart.toISOString())
    .lt('started_at', rangeEndExclusive.toISOString())

  if (callsError) throw callsError

  const rawCallRows = (calls || []) as KpiRawCallRow[]
  const callRows = dedupeCallsForStats(rawCallRows)
  const dedupedCallIds = callRows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id))

  // Fetch call_logs duration as fallback (calls.duration_seconds is often NULL
  // because it is only written by the call_ended webhook handler)
  const { data: logRows } =
    dedupedCallIds.length > 0
      ? await supabase
          .from('call_logs')
          .select('call_id, duration_seconds')
          .in('call_id', dedupedCallIds)
      : { data: [] }
  const logDurationMap = new Map<number, number>(
    (logRows ?? []).map((l: { call_id: number; duration_seconds: number | null }) => [
      l.call_id,
      l.duration_seconds ?? 0
    ])
  )

  const { count: appointmentsCreatedCount, error: apptError } =
    dedupedCallIds.length > 0
      ? await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .in('created_by_call_id', dedupedCallIds)
      : { count: 0, error: null }

  if (apptError) throw apptError

  let resolvedCalls = 0
  let pendingCalls = 0
  let totalDurationSeconds = 0
  const waitTimes: number[] = []

  for (const row of callRows) {
    const resolved = isResolvedWorkflowStatus(
      row.management_status ?? null,
      row.status ?? null
    )
    if (resolved) {
      resolvedCalls += 1
    } else {
      pendingCalls += 1
    }
    const metadata = safeJson(row.metadata)
    const callId = Number(row.id)
    const duration = Math.max(
      parseDurationSeconds(row.duration_seconds),
      parseDurationSeconds(logDurationMap.get(callId) ?? 0)
    )
    totalDurationSeconds += duration

    const waitCandidate =
      metadata?.wait_time_seconds ??
      metadata?.queue_wait_seconds ??
      metadata?.wait_seconds
    const parsedWait =
      typeof waitCandidate === 'number'
        ? waitCandidate
        : typeof waitCandidate === 'string'
        ? Number(waitCandidate)
        : NaN
    if (Number.isFinite(parsedWait) && parsedWait >= 0) {
      waitTimes.push(parsedWait)
    }
  }

  const callsReceived = callRows.length
  const avgDurationSeconds =
    callsReceived > 0 ? totalDurationSeconds / callsReceived : 0
  const avgWaitSeconds =
    waitTimes.length > 0
      ? waitTimes.reduce((sum, current) => sum + current, 0) / waitTimes.length
      : null

  return {
    appointmentsCreated: appointmentsCreatedCount || 0,
    callsReceived,
    avgDurationSeconds,
    resolvedCalls,
    pendingCalls,
    creditsUsed: round2((totalDurationSeconds / 60) * CREDIT_RATE_PER_MINUTE),
    avgWaitSeconds
  }
}

/**
 * Voice Agent Page
 * Main layout integrating KPIs, charts, and calls table
 * Figma: 1664 × 1016px content area (after sidebar 256px and topbar 64px)
 *
 * Supports two tiers:
 * - basic: Receptionist mode - collects info, user calls back to schedule
 * - advanced: Full automation - creates appointments automatically
 */
export default function VoiceAgentPage() {
  // Get subscription tier (basic/advanced) and setter for testing toggle
  const { voiceAgentTier, setVoiceAgentTier } = useSubscription()
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [clinicTier, setClinicTier] = useState<ClinicTier | null>(null)

  // State for selected week (defaults to current week)
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  )
  const [currentStats, setCurrentStats] = useState<VoiceKpiStats>(EMPTY_STATS)
  const [previousStats, setPreviousStats] = useState<VoiceKpiStats>(EMPTY_STATS)
  const [advancedDistribution, setAdvancedDistribution] = useState<CallDistribution[]>(
    EMPTY_DISTRIBUTION_ADVANCED
  )
  const [basicDistribution, setBasicDistribution] = useState<CallDistribution[]>(
    EMPTY_DISTRIBUTION_BASIC
  )
  const [volumeData, setVolumeData] = useState<CallVolumeDataPoint[]>(EMPTY_VOLUME_DATA)
  const isClinicBasic = clinicTier === 'basic'
  const canCallActions = clinicTier !== 'basic'
  const effectiveVoiceAgentTier: VoiceAgentTier = isClinicBasic
    ? 'basic'
    : voiceAgentTier

  // Check if we're viewing the current week
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date())

  // Navigation functions
  const goToPreviousWeek = () => {
    setSelectedWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 7)
      return newDate
    })
  }

  const goToNextWeek = () => {
    if (!isCurrentWeek) {
      setSelectedWeekStart((prev) => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() + 7)
        return newDate
      })
    }
  }

  const goToCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()))
  }

  useEffect(() => {
    let isMounted = true

    async function loadClinicTier() {
      if (!isClinicInitialized) return
      if (!activeClinicId) {
        if (isMounted) setClinicTier(null)
        return
      }

      try {
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', activeClinicId)
          .maybeSingle()
        if (error) throw error
        if (!isMounted) return
        const parsed = resolveClinicTier(
          data && typeof data === 'object' ? (data as Record<string, unknown>) : null
        )
        setClinicTier(parsed)
      } catch (error) {
        console.warn('VoiceAgent: unable to resolve clinic tier', error)
        if (isMounted) setClinicTier(null)
      }
    }

    void loadClinicTier()
    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized, supabase])

  useEffect(() => {
    let isMounted = true

    async function loadWeeklyStats() {
      if (!isClinicInitialized) return
      if (!activeClinicId) {
        if (isMounted) {
          setCurrentStats(EMPTY_STATS)
          setPreviousStats(EMPTY_STATS)
        }
        return
      }

      try {
        const currentStart = new Date(selectedWeekStart)
        const currentEnd = new Date(selectedWeekStart)
        currentEnd.setDate(currentEnd.getDate() + 7)

        const previousStart = new Date(selectedWeekStart)
        previousStart.setDate(previousStart.getDate() - 7)
        const previousEnd = new Date(selectedWeekStart)

        const [current, previous] = await Promise.all([
          fetchVoiceStats(supabase, activeClinicId, currentStart, currentEnd),
          fetchVoiceStats(supabase, activeClinicId, previousStart, previousEnd)
        ])

        if (!isMounted) return
        setCurrentStats(current)
        setPreviousStats(previous)
      } catch (error) {
        console.warn('VoiceAgent KPI hydration failed', error)
        if (!isMounted) return
        setCurrentStats(EMPTY_STATS)
        setPreviousStats(EMPTY_STATS)
      }
    }

    void loadWeeklyStats()
    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized, selectedWeekStart, supabase])

  useEffect(() => {
    let isMounted = true
    async function loadWeeklyAnalytics() {
      if (!isClinicInitialized) return
      if (!activeClinicId) {
        if (!isMounted) return
        setAdvancedDistribution(EMPTY_DISTRIBUTION_ADVANCED)
        setBasicDistribution(EMPTY_DISTRIBUTION_BASIC)
        setVolumeData(EMPTY_VOLUME_DATA)
        return
      }

      try {
        const weekStartParam = formatDateParam(selectedWeekStart)
        const response = await fetch(
          `/api/agente-voz/analytics?weekStart=${encodeURIComponent(weekStartParam)}`,
          { cache: 'no-store' }
        )
        if (!response.ok) throw new Error(`Analytics request failed: ${response.status}`)

        const payload = (await response.json()) as VoiceAgentAnalyticsResponse
        if (!isMounted) return

        setAdvancedDistribution(
          payload.distribution?.advanced?.length
            ? payload.distribution.advanced
            : EMPTY_DISTRIBUTION_ADVANCED
        )
        setBasicDistribution(
          payload.distribution?.basic?.length
            ? payload.distribution.basic
            : EMPTY_DISTRIBUTION_BASIC
        )
        setVolumeData(payload.volume?.length ? payload.volume : EMPTY_VOLUME_DATA)
      } catch (error) {
        console.warn('VoiceAgent analytics hydration failed', error)
        if (!isMounted) return
        setAdvancedDistribution(EMPTY_DISTRIBUTION_ADVANCED)
        setBasicDistribution(EMPTY_DISTRIBUTION_BASIC)
        setVolumeData(EMPTY_VOLUME_DATA)
      }
    }

    void loadWeeklyAnalytics()
    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized, selectedWeekStart])

  const kpiData = useMemo<VoiceAgentKPI[]>(() => {
    const commonComparisonLabel = 'semana anterior'
    const buildCountCard = (
      label: string,
      currentValue: number,
      previousValue: number
    ): VoiceAgentKPI => ({
      label,
      value: currentValue,
      ...getDelta(currentValue, previousValue),
      comparisonValue: previousValue,
      comparisonLabel: commonComparisonLabel
    })

    const durationDelta = getDelta(
      currentStats.avgDurationSeconds,
      previousStats.avgDurationSeconds
    )
    const waitDelta = getDelta(
      currentStats.avgWaitSeconds ?? 0,
      previousStats.avgWaitSeconds ?? 0
    )

    const tierLeadCard =
      effectiveVoiceAgentTier === 'basic'
        ? buildCountCard(
            'Llamadas pendientes',
            currentStats.pendingCalls,
            previousStats.pendingCalls
          )
        : buildCountCard(
            'Citas creadas',
            currentStats.appointmentsCreated,
            previousStats.appointmentsCreated
          )

    return [
      tierLeadCard,
      buildCountCard(
        'Llamadas recibidas',
        currentStats.callsReceived,
        previousStats.callsReceived
      ),
      {
        label: 'Tiempo medio llamada',
        value: formatDurationShort(currentStats.avgDurationSeconds),
        ...durationDelta,
        comparisonValue: formatDurationShort(previousStats.avgDurationSeconds),
        comparisonLabel: commonComparisonLabel
      },
      buildCountCard(
        'Llamadas resueltas',
        currentStats.resolvedCalls,
        previousStats.resolvedCalls
      ),
      buildCountCard(
        'Créditos usados',
        currentStats.creditsUsed,
        previousStats.creditsUsed
      ),
      {
        label: 'Tiempo de espera medio',
        value:
          currentStats.avgWaitSeconds == null
            ? '—'
            : formatDurationShort(currentStats.avgWaitSeconds),
        ...waitDelta,
        comparisonValue:
          previousStats.avgWaitSeconds == null
            ? '—'
            : formatDurationShort(previousStats.avgWaitSeconds),
        comparisonLabel: commonComparisonLabel
      }
    ]
  }, [currentStats, effectiveVoiceAgentTier, previousStats])

  return (
    <div className='flex flex-col gap-[min(1rem,2vw)] p-[min(1rem,2vw)] w-full h-full overflow-hidden'>
      {/* Week Navigator */}
      <div className='flex items-center gap-4 shrink-0'>
        {/* Navigation Controls */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={goToPreviousWeek}
            className='size-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors cursor-pointer'
            aria-label='Semana anterior'
          >
            <span className='material-symbols-rounded text-xl text-neutral-700'>
              chevron_left
            </span>
          </button>
          <span className='text-title-md font-medium text-neutral-900 min-w-[10rem] text-center'>
            {formatWeekRange(selectedWeekStart)}
          </span>
          <button
            type='button'
            onClick={goToNextWeek}
            disabled={isCurrentWeek}
            className={`size-8 inline-flex items-center justify-center rounded-full transition-colors ${
              isCurrentWeek
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-neutral-100 cursor-pointer'
            }`}
            aria-label='Semana siguiente'
          >
            <span className='material-symbols-rounded text-xl text-neutral-700'>
              chevron_right
            </span>
          </button>
        </div>

        {/* Current Week Button */}
        {!isCurrentWeek && (
          <button
            type='button'
            onClick={goToCurrentWeek}
            className='px-3 py-1 text-body-sm font-medium text-brand-700 bg-brand-0 border border-brand-200 rounded-full hover:bg-brand-100 transition-colors cursor-pointer'
          >
            Esta semana
          </button>
        )}

        {/* Weekly Data Indicator */}
        <span className='px-2 py-0.5 text-label-sm bg-brand-0 text-brand-700 border border-brand-200 rounded-full'>
          Datos semanales
        </span>

        {/* Voice Agent Tier Toggle */}
        <div className='flex items-center gap-2 ml-auto'>
          <span className='text-label-sm text-neutral-500'>Modo:</span>
          {isClinicBasic ? (
            <span
              className='inline-flex h-7 items-center rounded-full border border-neutral-300 bg-neutral-100 px-3 text-label-sm font-medium text-neutral-700'
              title='Esta clínica tiene plan Básico'
            >
              Básico
            </span>
          ) : (
            <button
              type='button'
              onClick={() =>
                setVoiceAgentTier(
                  effectiveVoiceAgentTier === 'advanced' ? 'basic' : 'advanced'
                )
              }
              className={`relative inline-flex h-7 w-[8.5rem] items-center rounded-full transition-colors cursor-pointer p-0.5 ${
                effectiveVoiceAgentTier === 'advanced'
                  ? 'bg-success-100 border border-success-300'
                  : 'bg-neutral-100 border border-neutral-300'
              }`}
              title='Cambiar modo'
            >
              <span
                className={`absolute h-6 w-[4rem] rounded-full transition-all duration-200 ease-in-out ${
                  effectiveVoiceAgentTier === 'advanced'
                    ? 'translate-x-[4.25rem] bg-success-500'
                    : 'translate-x-0.5 bg-neutral-500'
                }`}
              />
              <span className='relative flex w-full h-full'>
                <span
                  className={`flex-1 flex items-center justify-center text-label-sm font-medium transition-colors z-10 ${
                    effectiveVoiceAgentTier === 'basic'
                      ? 'text-white'
                      : 'text-neutral-500'
                  }`}
                >
                  Básico
                </span>
                <span
                  className={`flex-1 flex items-center justify-center text-label-sm font-medium transition-colors z-10 ${
                    effectiveVoiceAgentTier === 'advanced'
                      ? 'text-white'
                      : 'text-neutral-500'
                  }`}
                >
                  Avanzado
                </span>
              </span>
            </button>
          )}
          {/* Tier indicator icon */}
          <span
            className={`material-symbols-rounded text-lg ${
              effectiveVoiceAgentTier === 'advanced'
                ? 'text-success-600'
                : 'text-neutral-500'
            }`}
            title={
              effectiveVoiceAgentTier === 'advanced'
                ? 'Crea citas automáticamente'
                : 'Recoge información para gestión manual'
            }
          >
            {effectiveVoiceAgentTier === 'advanced'
              ? 'auto_awesome'
              : 'support_agent'}
          </span>
        </div>
      </div>

      {/* Top Section: KPIs + Charts - Fixed */}
      <div className='flex gap-[min(1rem,2vw)] w-full shrink-0'>
        {/* KPI Grid - 2 columns × 3 rows */}
        <div className='grid grid-cols-2 gap-[min(0.75rem,1vw)] gap-y-[min(0.5rem,1vw)] shrink-0'>
          {kpiData.map((kpi) => (
            <VoiceAgentKPICard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Donut Chart */}
        <div className='w-[min(16rem,22vw)] shrink-0'>
          <CallDistributionDonut
            tier={effectiveVoiceAgentTier}
            data={
              effectiveVoiceAgentTier === 'basic'
                ? basicDistribution
                : advancedDistribution
            }
          />
        </div>

        {/* Line Chart - Takes remaining space */}
        <div className='flex-1 min-w-[min(30rem,40vw)]'>
          <CallVolumeChart tier={effectiveVoiceAgentTier} data={volumeData} />
        </div>
      </div>

      {/* Bottom Section: Calls Table - Scrollable */}
      <div className='flex-1 min-h-0 bg-surface-app overflow-y-auto'>
        <Suspense fallback={<div className='p-4'>Cargando...</div>}>
          <CallsTable
            voiceAgentTier={effectiveVoiceAgentTier}
            canCallActions={canCallActions}
            selectedWeekStart={selectedWeekStart}
          />
        </Suspense>
      </div>
    </div>
  )
}
