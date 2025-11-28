'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import CloseRounded from '@mui/icons-material/CloseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import TimelineRounded from '@mui/icons-material/TimelineRounded'
import { useRouter } from 'next/navigation'
import React from 'react'

type VoiceCallStatus =
  | 'booked'
  | 'hold'
  | 'rescheduled'
  | 'cancelled'
  | 'faq'
  | 'not_booked'

type VoiceCallRow = {
  eventId: number
  callRowId: number
  externalCallId?: string | null
  payloadCallId?: string | null
  eventType: string
  receivedAt: string
  clinicId?: string | null
  clinicName: string
  patientId?: string | null
  patientName: string
  patientPhone: string
  callReason?: string | null
  durationSeconds: number
  summary: string
  transcript: string
  recordingUrl?: string | null
  status: VoiceCallStatus
  appointmentRef?: string | null
  appointmentId?: number
  appointmentStatus?: string | null
  holdInfo?: {
    id: number
    publicRef?: string | null
    status: string
    expiresAt?: string | null
    startTime?: string | null
    endTime?: string | null
  } | null
  agentName: string
  callStatus: string
  // New: caller contact info
  callerContactId?: string | null
  callerContactName?: string | null
  // Urgency info
  isUrgent?: boolean
  urgencyLevel?: string | null
}

type FiltersState = {
  clinic: string
  status: string
  eventType: string
  agent: string
}

const DEFAULT_FILTERS: FiltersState = {
  clinic: 'all',
  status: 'all',
  eventType: 'all',
  agent: 'all'
}

function formatDuration(seconds?: number | null) {
  if (!seconds || Number.isNaN(seconds)) {
    return '—'
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

function safeJson(value: any) {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

function extractSummary(payload: any, intentSummary: any): string {
  const candidates = [
    payload?.call?.analysis?.summary,
    payload?.call?.call_summary,
    payload?.call?.call_analysis?.call_summary,
    payload?.call?.call_analysis?.custom_analysis_data?.call_summary,
    payload?.analysis?.summary,
    payload?.call?.summary,
    typeof intentSummary === 'string' ? intentSummary : null,
    intentSummary?.summary,
    intentSummary?.overview
  ].filter(Boolean)
  if (candidates.length === 0) return 'Sin resumen disponible.'
  const first = candidates[0]
  if (typeof first === 'string') return first
  return JSON.stringify(first)
}

function extractTranscript(payload: any): string {
  const transcript =
    payload?.call?.transcript ||
    payload?.call?.full_transcript ||
    payload?.transcript ||
    ''
  return transcript || 'Sin transcripción disponible.'
}

function extractPatientName(payload: any) {
  return (
    payload?.call?.call_analysis?.custom_analysis_data?.full_name ||
    payload?.call?.call_analysis?.custom_analysis_data?.patient_name ||
    payload?.call?.retell_llm_dynamic_variables?.name ||
    payload?.call?.collected_dynamic_variables?.patient_name ||
    'Paciente sin nombre'
  )
}

function extractPhone(payload: any) {
  return (
    payload?.call?.retell_llm_dynamic_variables?.from_number ||
    payload?.call?.collected_dynamic_variables?.phone ||
    payload?.call?.from_number ||
    '—'
  )
}

function extractCallReason(payload: any) {
  return (
    payload?.call?.call_analysis?.custom_analysis_data?.call_reason ||
    payload?.call?.call_reason ||
    payload?.call_reason ||
    payload?.call?.retell_llm_dynamic_variables?.call_reason ||
    null
  )
}

const STATUS_META: Record<
  VoiceCallStatus,
  { label: string; badgeClass: string; detailDescription: string }
> = {
  booked: {
    label: 'Appointment booked',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    detailDescription: 'La llamada generó una cita confirmada.'
  },
  hold: {
    label: 'Hold creado',
    badgeClass: 'bg-sky-50 text-sky-700',
    detailDescription: 'Se reservó un horario pendiente de confirmación.'
  },
  rescheduled: {
    label: 'Reprogramación',
    badgeClass: 'bg-indigo-50 text-indigo-700',
    detailDescription: 'La llamada gestionó un cambio de horario.'
  },
  cancelled: {
    label: 'Cancelación',
    badgeClass: 'bg-rose-50 text-rose-700',
    detailDescription: 'La llamada canceló una cita existente.'
  },
  faq: {
    label: 'Consulta / FAQ',
    badgeClass: 'bg-purple-50 text-purple-700',
    detailDescription: 'La llamada fue informativa.'
  },
  not_booked: {
    label: 'Sin cita',
    badgeClass: 'bg-amber-50 text-amber-700',
    detailDescription: 'La llamada no generó una acción en la agenda.'
  }
}

export default function ManagerPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const router = useRouter()
  const [calls, setCalls] = React.useState<VoiceCallRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<FiltersState>(DEFAULT_FILTERS)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCall, setSelectedCall] = React.useState<VoiceCallRow | null>(null)

  const loadVoiceRows = React.useCallback(async (): Promise<VoiceCallRow[]> => {
    const { data: eventRows, error: eventError } = await supabase
      .from('webhook_events')
      .select('id, event_type, received_at, status_code, payload, related_call_id')
      .not('related_call_id', 'is', null)
      .order('received_at', { ascending: false })
      .limit(120)

    if (eventError) throw eventError

    const deduped: typeof eventRows = []
    const seen = new Set<number>()
    for (const row of eventRows ?? []) {
      const callId = row.related_call_id
      if (!callId || seen.has(callId)) continue
      seen.add(callId)
      deduped.push(row)
    }

    const callIds = Array.from(seen)
    if (callIds.length === 0) return []

    const { data: callRows, error: callError } = await supabase
      .from('calls')
      .select(
        'id, external_call_id, clinic_id, initial_clinic_id, patient_id, from_number, status, call_outcome, recording_url, duration_seconds, intent_summary, metadata, caller_contact_id, is_urgent, urgency_level'
      )
      .in('id', callIds)

    if (callError) throw callError

    const clinicIds = Array.from(
      new Set(
        (callRows ?? [])
          .map((c) => c.clinic_id || c.initial_clinic_id)
          .filter(Boolean)
      )
    )
    const patientIds = Array.from(
      new Set((callRows ?? []).map((c) => c.patient_id).filter(Boolean))
    )
    // Fetch caller contacts
    const callerContactIds = Array.from(
      new Set((callRows ?? []).map((c) => c.caller_contact_id).filter(Boolean))
    )

    const [clinicsRes, patientsRes, appointmentsRes, holdsRes, contactsRes] = await Promise.all([
      clinicIds.length
        ? supabase.from('clinics').select('id, name').in('id', clinicIds)
        : Promise.resolve({ data: [], error: null }),
      patientIds.length
        ? supabase
            .from('patients')
            .select('id, first_name, last_name, phone_number')
            .in('id', patientIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('appointments')
        .select('id, public_ref, created_by_call_id, scheduled_start_time, status')
        .in('created_by_call_id', callIds),
      supabase
        .from('appointment_holds')
        .select(
          'id, public_ref, status, held_by_call_id, hold_expires_at, start_time, end_time'
        )
        .in('held_by_call_id', callIds),
      callerContactIds.length
        ? supabase.from('contacts').select('id, full_name, phone_primary').in('id', callerContactIds)
        : Promise.resolve({ data: [], error: null })
    ])

    if (clinicsRes.error) throw clinicsRes.error
    if (patientsRes.error) throw patientsRes.error
    if (appointmentsRes.error) throw appointmentsRes.error
    if (holdsRes.error) throw holdsRes.error
    if (contactsRes.error) throw contactsRes.error

    const callMap = new Map((callRows ?? []).map((row) => [row.id, row]))
    const clinicsMap = new Map(
      (clinicsRes.data ?? []).map((clinic) => [clinic.id, clinic])
    )
    const patientsMap = new Map(
      (patientsRes.data ?? []).map((patient) => [patient.id, patient])
    )
    const contactsMap = new Map(
      (contactsRes.data ?? []).map((contact) => [contact.id, contact])
    )
    const appointmentMap = new Map<number, (typeof appointmentsRes.data)[number]>()
    for (const appt of appointmentsRes.data ?? []) {
      if (appt.created_by_call_id) {
        appointmentMap.set(appt.created_by_call_id, appt)
      }
    }
    const holdMap = new Map<number, (typeof holdsRes.data)[number]>()
    for (const hold of holdsRes.data ?? []) {
      if (hold.held_by_call_id) {
        holdMap.set(hold.held_by_call_id, hold)
      }
    }

    return deduped
      .map((eventRow) => {
        const callId = eventRow.related_call_id
        if (!callId) return null
        const callRecord = callMap.get(callId)
        if (!callRecord) return null
        const payload = safeJson(eventRow.payload)
        const agentName = payload?.call?.agent_name || '—'
        const clinic =
          clinicsMap.get(callRecord.clinic_id ?? callRecord.initial_clinic_id ?? '') ??
          null
        const patient = patientsMap.get(callRecord.patient_id ?? '')
        const appointment = appointmentMap.get(callId) ?? null
        const hold = holdMap.get(callId) ?? null
        const callReason = extractCallReason(payload)
        const patientName = patient
          ? [patient.first_name, patient.last_name].filter(Boolean).join(' ')
          : extractPatientName(payload)
        const patientPhone =
          patient?.phone_number ?? callRecord.from_number ?? extractPhone(payload)
        const durationSeconds =
          callRecord.duration_seconds ??
          payload?.call?.call_cost?.total_duration_seconds ??
          Math.round((payload?.call?.duration_ms ?? 0) / 1000)
        const summary = extractSummary(payload, callRecord.intent_summary)
        const transcript = extractTranscript(payload)
        const recordingUrl = callRecord.recording_url ?? payload?.call?.recording_url
        const reasonText = callReason?.toLowerCase() ?? ''
        const callSuccess =
          payload?.call?.call_analysis?.call_successful ??
          payload?.call?.call_analysis?.custom_analysis_data?.call_successful ??
          null
        let status: VoiceCallStatus = 'not_booked'
        if (appointment) {
          status = 'booked'
        } else if (hold) {
          status = 'hold'
        } else if (reasonText.includes('resched')) {
          status = 'rescheduled'
        } else if (reasonText.includes('cancel')) {
          status = 'cancelled'
        } else if (
          reasonText.includes('faq') ||
          reasonText.includes('question') ||
          reasonText.includes('consulta') ||
          reasonText.includes('info')
        ) {
          status = 'faq'
        } else if (callSuccess && reasonText.includes('book')) {
          status = 'hold'
        }
        const callStatus =
          callRecord.status || payload?.call?.call_status || eventRow.event_type || 'unknown'

        // Get caller contact info
        const callerContact = callRecord.caller_contact_id
          ? contactsMap.get(callRecord.caller_contact_id)
          : null

        // Check for urgency from call record or from post-call analysis
        const isUrgent = callRecord.is_urgent || 
          callReason?.toLowerCase() === 'emergency' ||
          payload?.call?.call_analysis?.custom_analysis_data?.urgency_level === 'urgent' ||
          payload?.call?.call_analysis?.custom_analysis_data?.is_emergency === true
        const urgencyLevel = callRecord.urgency_level ?? 
          payload?.call?.call_analysis?.custom_analysis_data?.urgency_level ?? null

        return {
          eventId: eventRow.id,
          callRowId: callId,
          externalCallId: callRecord.external_call_id,
          payloadCallId: payload?.call?.call_id,
          eventType: eventRow.event_type ?? 'event',
          receivedAt: eventRow.received_at,
          clinicId: clinic?.id ?? callRecord.clinic_id ?? callRecord.initial_clinic_id,
          clinicName: clinic?.name ?? 'Clínica sin nombre',
          patientId: patient?.id,
          patientName,
          patientPhone: callerContact?.phone_primary ?? patientPhone,
          callReason,
          durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
          summary,
          transcript,
          recordingUrl,
          status,
          appointmentRef: appointment?.public_ref ?? hold?.public_ref ?? null,
          appointmentId: appointment?.id,
          appointmentStatus: appointment?.status ?? null,
          holdInfo: hold
            ? {
                id: hold.id,
                publicRef: hold.public_ref,
                status: hold.status,
                expiresAt: hold.hold_expires_at,
                startTime: hold.start_time,
                endTime: hold.end_time
              }
            : null,
          agentName,
          callStatus,
          callerContactId: callRecord.caller_contact_id,
          callerContactName: callerContact?.full_name ?? null,
          isUrgent,
          urgencyLevel
        } as VoiceCallRow
      })
      .filter((row): row is VoiceCallRow => Boolean(row))
  }, [supabase])

  React.useEffect(() => {
    let cancelled = false
    async function init() {
      setError(null)
      setLoading(true)
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session) {
          router.replace('/login')
          return
        }
        const canManage = await userIsManager()
        if (!canManage) {
          router.replace('/')
          return
        }
        const data = await loadVoiceRows()
        if (!cancelled) {
          setCalls(data)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError('No se pudo cargar el panel. Intenta nuevamente.')
          setLoading(false)
        }
      }
    }

    async function userIsManager() {
      try {
        const { data: clinics } = await supabase.rpc('get_my_clinics')
        if (!Array.isArray(clinics) || clinics.length === 0) return false
        for (const clinicId of clinics as string[]) {
          if (!clinicId) continue
          const { data: role } = await supabase.rpc('get_my_role_in_clinic', {
            p_clinic_id: clinicId
          })
          if (role === 'gerencia') {
            return true
          }
        }
      } catch (err) {
        console.error('Error validating manager access', err)
      }
      return false
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [loadVoiceRows, router, supabase])

  const filteredCalls = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return calls.filter((call) => {
      const matchesSearch = term
        ? [
            call.patientName,
            call.patientPhone,
            call.clinicName,
            call.agentName,
            call.callReason ?? '',
            call.payloadCallId ?? '',
            call.externalCallId ?? ''
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term))
        : true
      const matchesClinic =
        filters.clinic === 'all' || call.clinicId === filters.clinic
      const matchesStatus =
        filters.status === 'all' || call.status === (filters.status as VoiceCallStatus)
      const matchesEvent =
        filters.eventType === 'all' || call.eventType === filters.eventType
      const matchesAgent =
        filters.agent === 'all' || call.agentName === filters.agent
      return matchesSearch && matchesClinic && matchesStatus && matchesEvent && matchesAgent
    })
  }, [calls, filters, searchTerm])

  const totals = React.useMemo(() => {
    const counts: Record<VoiceCallStatus, number> = {
      booked: 0,
      hold: 0,
      rescheduled: 0,
      cancelled: 0,
      faq: 0,
      not_booked: 0
    }
    for (const call of calls) {
      counts[call.status] += 1
    }
    const booked = counts.booked + counts.hold + counts.rescheduled
    const notBooked = counts.not_booked + counts.cancelled + counts.faq
    const avgDuration =
      calls.length > 0
        ? calls.reduce((sum, call) => sum + call.durationSeconds, 0) / calls.length
        : 0
    return {
      total: calls.length,
      booked,
      notBooked,
      avgDuration: formatDuration(avgDuration)
    }
  }, [calls])

  const clinicOptions = React.useMemo(() => {
    const map = new Map<string, string>()
    calls.forEach((call) => {
      if (call.clinicId) {
        map.set(call.clinicId, call.clinicName)
      }
    })
    return Array.from(map.entries())
  }, [calls])

  const eventOptions = React.useMemo(() => {
    return Array.from(new Set(calls.map((call) => call.eventType))).filter(Boolean)
  }, [calls])

  const agentOptions = React.useMemo(() => {
    return Array.from(new Set(calls.map((call) => call.agentName))).filter(Boolean)
  }, [calls])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const data = await loadVoiceRows()
      setCalls(data)
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar la información.')
    } finally {
      setRefreshing(false)
    }
  }

  React.useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [calls.length])

  const content = (() => {
    if (loading) {
      return (
        <div className='flex flex-1 items-center justify-center text-neutral-500'>
          Cargando datos del agente de voz…
        </div>
      )
    }
    if (error) {
      return (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 text-center text-neutral-700'>
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className='inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50'
          >
            <RefreshRounded className='size-4' /> Reintentar
          </button>
        </div>
      )
    }
    if (filteredCalls.length === 0) {
      return (
        <div className='flex flex-1 flex-col items-center justify-center gap-2 text-neutral-600'>
          <p>No hay llamadas que coincidan con los filtros seleccionados.</p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className='text-sm text-brand-600 underline'
          >
            Restablecer filtros
          </button>
        </div>
      )
    }
    return (
      <div className='flex-1 overflow-auto rounded-2xl border border-neutral-200 bg-white'>
        <table className='min-w-full table-fixed'>
          <thead className='bg-neutral-50 text-left text-sm text-neutral-600'>
            <tr>
              <th className='px-4 py-3'>Fecha</th>
              <th className='px-4 py-3'>Clínica</th>
              <th className='px-4 py-3'>Paciente</th>
              <th className='px-4 py-3'>Motivo</th>
              <th className='px-4 py-3'>Teléfono</th>
              <th className='px-4 py-3'>Duración</th>
              <th className='px-4 py-3'>Resumen</th>
              <th className='px-4 py-3'>Estado</th>
              <th className='px-4 py-3'>Cita</th>
              <th className='px-4 py-3 text-center'>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.map((call) => (
              <tr
                key={call.eventId}
                className='border-t border-neutral-100 text-sm text-neutral-800 hover:bg-neutral-50'
              >
                <td className='px-4 py-3 align-top'>
                  {new Date(call.receivedAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className='px-4 py-3 align-top'>
                  <div className='font-medium'>{call.clinicName}</div>
                  <div className='text-xs text-neutral-500'>{call.agentName}</div>
                </td>
                <td className='px-4 py-3 align-top'>
                  <div className='font-medium'>{call.patientName}</div>
                  <div className='text-xs text-neutral-500'>
                    ID llamada: {call.payloadCallId ?? call.externalCallId ?? '—'}
                  </div>
                </td>
                <td className='px-4 py-3 align-top'>
                  {call.callReason ? (
                    <span 
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        call.isUrgent || call.callReason?.toLowerCase() === 'emergency'
                          ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {call.isUrgent && '🚨 '}
                      {call.callReason}
                    </span>
                  ) : call.isUrgent ? (
                    <span className='inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200'>
                      🚨 Urgent
                    </span>
                  ) : (
                    <span className='text-sm text-neutral-500'>—</span>
                  )}
                </td>
                <td className='px-4 py-3 align-top'>{call.patientPhone}</td>
                <td className='px-4 py-3 align-top'>{formatDuration(call.durationSeconds)}</td>
                <td className='px-4 py-3 align-top'>
                  <p className='line-clamp-3 text-sm text-neutral-700'>{call.summary}</p>
                </td>
                <td className='px-4 py-3 align-top'>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      call.status === 'booked'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {call.status === 'booked' ? 'Appointment booked' : 'Appointment not booked'}
                  </span>
                </td>
                <td className='px-4 py-3 align-top'>
                  {call.appointmentRef ? (
                    <a
                      href={`/agenda?appt=${call.appointmentRef}`}
                      className='text-sm text-brand-600 underline'
                      target='_blank'
                      rel='noreferrer'
                    >
                      {call.appointmentRef}
                    </a>
                  ) : (
                    <span className='text-sm text-neutral-500'>—</span>
                  )}
                </td>
                <td className='px-4 py-3 align-top'>
                  <div className='flex flex-col gap-2'>
                    <button
                      type='button'
                      disabled={!call.recordingUrl}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (call.recordingUrl) {
                          window.open(call.recordingUrl, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className='inline-flex items-center justify-center gap-1 rounded-lg border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <PlayArrowRounded className='size-4' />
                      Escuchar
                    </button>
                    <button
                      type='button'
                      onClick={() => setSelectedCall(call)}
                      className='text-xs font-medium text-brand-600 underline'
                    >
                      Ver detalles
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  })()

  return (
    <div className='flex h-[calc(100dvh-var(--spacing-topbar))] flex-col gap-6 rounded-tl-[var(--radius-xl)] bg-[var(--color-neutral-50)] px-[min(3rem,4vw)] py-[min(1.5rem,2vw)]'>
      <header className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-body-sm uppercase text-neutral-500'>Panel de gerencia</p>
            <div className='flex items-center gap-2'>
              <TimelineRounded className='text-neutral-700' />
              <h1 className='text-title-lg text-neutral-900'>Voice agent dashboard</h1>
            </div>
            <p className='text-body-sm text-neutral-600'>
              Monitoriza las llamadas del agente de voz, identifica oportunidades y sigue la
              conversión a citas.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className='inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60'
          >
            <RefreshRounded className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <KpiCard label='Llamadas registradas' value={totals.total.toString()} />
          <KpiCard label='Citas generadas' value={totals.booked.toString()} trend='+' />
          <KpiCard label='Llamadas sin cita' value={totals.notBooked.toString()} trend='-' />
          <KpiCard label='Duración promedio' value={totals.avgDuration} />
        </div>
      </header>

      <section className='rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2'>
            <SearchRounded className='text-neutral-500' />
            <input
              type='search'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Buscar por paciente, teléfono, clínica o ID de llamada'
              className='w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400'
            />
          </div>
          <FilterSelect
            label='Clínica'
            value={filters.clinic}
            onChange={(value) => setFilters((prev) => ({ ...prev, clinic: value }))}
            options={clinicOptions.map(([id, name]) => ({ label: name, value: id }))}
          />
          <FilterSelect
            label='Estado'
            value={filters.status}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            options={[
              { label: 'Appointment booked', value: 'booked' },
              { label: 'Appointment not booked', value: 'not_booked' }
            ]}
          />
          <FilterSelect
            label='Evento'
            value={filters.eventType}
            onChange={(value) => setFilters((prev) => ({ ...prev, eventType: value }))}
            options={eventOptions.map((event) => ({ label: event, value: event }))}
          />
          <FilterSelect
            label='Agente'
            value={filters.agent}
            onChange={(value) => setFilters((prev) => ({ ...prev, agent: value }))}
            options={agentOptions.map((agent) => ({ label: agent, value: agent }))}
          />
        </div>
      </section>

      {content}

      <CallDetailsModal call={selectedCall} onClose={() => setSelectedCall(null)} />
    </div>
  )
}

function KpiCard({
  label,
  value,
  trend
}: {
  label: string
  value: string
  trend?: '+' | '-'
}) {
  return (
    <div className='rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm'>
      <p className='text-sm text-neutral-500'>{label}</p>
      <div className='mt-2 flex items-baseline gap-2'>
        <span className='text-3xl font-semibold text-neutral-900'>{value}</span>
        {trend ? (
          <span
            className={`text-xs font-medium ${
              trend === '+' ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {trend === '+' ? '↑' : '↓'}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  const list = [{ label: 'Todos', value: 'all' }, ...options]
  return (
    <label className='flex flex-1 min-w-[140px] flex-col gap-1 text-xs font-medium text-neutral-500'>
      {label}
      <select
        className='rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {list.map((opt) => (
          <option key={`${label}-${opt.value}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function CallDetailsModal({
  call,
  onClose
}: {
  call: VoiceCallRow | null
  onClose: () => void
}) {
  if (!call) return null
  return (
    <div className='fixed inset-0 z-[250] flex items-center justify-center bg-black/40 px-4 py-6'>
      <div className='relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl'>
        <button
          type='button'
          onClick={onClose}
          className='absolute right-4 top-4 text-neutral-500 hover:text-neutral-800'
          aria-label='Cerrar detalles'
        >
          <CloseRounded className='size-5' />
        </button>
        <div className='space-y-4'>
          <div>
            <p className='text-xs uppercase text-neutral-500'>Llamada</p>
            <h2 className='text-title-md text-neutral-900'>
              {call.patientName} · {call.clinicName}
            </h2>
            <p className='text-sm text-neutral-600'>
              {new Date(call.receivedAt).toLocaleString('es-ES', {
                dateStyle: 'full',
                timeStyle: 'short'
              })}
            </p>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <DetailField label='Agente' value={call.agentName} />
            <DetailField label='Teléfono' value={call.patientPhone} />
            <DetailField label='Duración' value={formatDuration(call.durationSeconds)} />
            <DetailField
              label='Estado'
              value={STATUS_META[call.status].label}
            />
            <DetailField 
              label='Motivo' 
              value={
                <span className={call.isUrgent ? 'text-red-600 font-semibold' : ''}>
                  {call.isUrgent && '🚨 '}
                  {call.callReason ?? '—'}
                  {call.isUrgent}
                </span>
              } 
            />
          </div>
          <section className='rounded-xl border border-neutral-200 bg-neutral-50 p-4'>
            <h3 className='text-base font-semibold text-neutral-900'>Resumen</h3>
            <p className='mt-2 whitespace-pre-line text-sm text-neutral-700'>{call.summary}</p>
          </section>
          <section className='rounded-xl border border-neutral-200 bg-neutral-50 p-4'>
            <h3 className='text-base font-semibold text-neutral-900'>Transcripción</h3>
            <p className='mt-2 whitespace-pre-line text-sm text-neutral-700'>
              {call.transcript}
            </p>
          </section>
          {call.holdInfo ? (
            <section className='rounded-xl border border-neutral-200 bg-neutral-50 p-4'>
              <h3 className='text-base font-semibold text-neutral-900'>Hold asociado</h3>
              <div className='mt-2 grid gap-4 sm:grid-cols-2'>
                <DetailField
                  label='Referencia'
                  value={call.holdInfo.publicRef ?? `Hold #${call.holdInfo.id}`}
                />
                <DetailField label='Estado' value={call.holdInfo.status} />
                {call.holdInfo.startTime ? (
                  <DetailField
                    label='Inicio'
                    value={new Date(call.holdInfo.startTime).toLocaleString('es-ES')}
                  />
                ) : null}
                {call.holdInfo.endTime ? (
                  <DetailField
                    label='Fin'
                    value={new Date(call.holdInfo.endTime).toLocaleString('es-ES')}
                  />
                ) : null}
                {call.holdInfo.expiresAt ? (
                  <DetailField
                    label='Expira'
                    value={new Date(call.holdInfo.expiresAt).toLocaleString('es-ES')}
                  />
                ) : null}
              </div>
            </section>
          ) : null}
          {call.recordingUrl ? (
            <section className='rounded-xl border border-neutral-200 bg-neutral-50 p-4'>
              <h3 className='text-base font-semibold text-neutral-900'>Escuchar llamada</h3>
              <audio controls className='mt-3 w-full' src={call.recordingUrl}>
                Tu navegador no soporta audio embebido.
              </audio>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='rounded-xl border border-neutral-200 bg-white px-3 py-2'>
      <p className='text-xs text-neutral-500'>{label}</p>
      <p className='text-sm font-medium text-neutral-900'>{value}</p>
    </div>
  )
}

