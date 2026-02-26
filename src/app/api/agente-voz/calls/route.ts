import { resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type VoiceAgentCallRow = {
  call_id: string
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

type BaseCallRow = {
  id: number | string
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
}

type PatientRow = {
  id: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
}

type ContactRow = {
  id: string
  full_name: string | null
  phone_primary: string | null
}

type CallLogRow = {
  call_id: number | string
  transcript_text: string | null
  call_summary: string | null
  duration_seconds: number | null
  started_at: string | null
}

type AppointmentRow = {
  id: number | string
  created_by_call_id: number | string | null
}

function parseWeekStartUtc(value: string | null): Date {
  if (value) {
    const parsed = new Date(`${value}T00:00:00Z`)
    if (Number.isFinite(parsed.getTime())) {
      const day = parsed.getUTCDay()
      const diff = day === 0 ? -6 : 1 - day
      parsed.setUTCDate(parsed.getUTCDate() + diff)
      parsed.setUTCHours(0, 0, 0, 0)
      return parsed
    }
  }

  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const day = start.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setUTCDate(start.getUTCDate() + diff)
  return start
}

function toDateString(value: Date): string {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function fetchCallsFallback(
  supabase: SupabaseServerClient,
  clinicId: string,
  rangeStartIso: string,
  rangeEndIso: string,
  limit: number
): Promise<VoiceAgentCallRow[]> {
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select(
      'id, external_call_id, status, management_status, from_number, started_at, duration_seconds, call_outcome, is_urgent, patient_id, caller_contact_id, metadata, recording_url, intent_summary'
    )
    .or(`clinic_id.eq.${clinicId},initial_clinic_id.eq.${clinicId}`)
    .gte('started_at', rangeStartIso)
    .lt('started_at', rangeEndIso)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (callsError) throw callsError

  const callRows = (calls || []) as BaseCallRow[]
  const callIds = callRows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id))
  const patientIds = Array.from(
    new Set(callRows.map((row) => asString(row.patient_id).trim()).filter(Boolean))
  )
  const contactIds = Array.from(
    new Set(
      callRows.map((row) => asString(row.caller_contact_id).trim()).filter(Boolean)
    )
  )

  const [patientsRes, contactsRes, callLogsRes, appointmentsRes] = await Promise.all([
    patientIds.length
      ? supabase
          .from('patients')
          .select('id, first_name, last_name, phone_number')
          .in('id', patientIds)
      : Promise.resolve({ data: [], error: null }),
    contactIds.length
      ? supabase
          .from('contacts')
          .select('id, full_name, phone_primary')
          .in('id', contactIds)
      : Promise.resolve({ data: [], error: null }),
    callIds.length
      ? supabase
          .from('call_logs')
          .select('call_id, transcript_text, call_summary, duration_seconds, started_at')
          .in('call_id', callIds)
          .order('started_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    callIds.length
      ? supabase
          .from('appointments')
          .select('id, created_by_call_id')
          .in('created_by_call_id', callIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ])

  if (patientsRes.error) throw patientsRes.error
  if (contactsRes.error) throw contactsRes.error
  if (callLogsRes.error) throw callLogsRes.error
  if (appointmentsRes.error) throw appointmentsRes.error

  const patientsById = new Map(
    ((patientsRes.data || []) as PatientRow[]).map((row) => [
      String(row.id),
      {
        fullName: [asString(row.first_name), asString(row.last_name)]
          .join(' ')
          .trim(),
        phone: asString(row.phone_number).trim()
      }
    ])
  )

  const contactsById = new Map(
    ((contactsRes.data || []) as ContactRow[]).map((row) => [
      String(row.id),
      {
        fullName: asString(row.full_name).trim(),
        phone: asString(row.phone_primary).trim()
      }
    ])
  )

  const callLogByCallId = new Map<string, CallLogRow>()
  for (const row of (callLogsRes.data || []) as CallLogRow[]) {
    const key = String(row.call_id)
    if (callLogByCallId.has(key)) continue
    callLogByCallId.set(key, row)
  }

  const appointmentByCallId = new Map<string, string>()
  for (const row of (appointmentsRes.data || []) as AppointmentRow[]) {
    const key = String(row.created_by_call_id || '')
    if (!key || appointmentByCallId.has(key)) continue
    appointmentByCallId.set(key, String(row.id))
  }

  return callRows.map((row) => {
    const callId = String(row.id)
    const patientRef = asString(row.patient_id).trim()
    const contactRef = asString(row.caller_contact_id).trim()
    const patient = patientRef ? patientsById.get(patientRef) : null
    const contact = contactRef ? contactsById.get(contactRef) : null
    const log = callLogByCallId.get(callId) || null

    return {
      call_id: callId,
      external_call_id: asString(row.external_call_id).trim() || null,
      status: asString(row.status).trim() || null,
      management_status: asString(row.management_status).trim() || null,
      from_number: asString(row.from_number).trim() || null,
      started_at: asString(row.started_at).trim() || null,
      duration_seconds:
        typeof row.duration_seconds === 'number' ? row.duration_seconds : null,
      call_outcome: asString(row.call_outcome).trim() || null,
      is_urgent: row.is_urgent === true,
      patient_id: patientRef || null,
      caller_contact_id: contactRef || null,
      metadata: row.metadata || null,
      recording_url: asString(row.recording_url).trim() || null,
      intent_summary: asString(row.intent_summary).trim() || null,
      patient_full_name: patient?.fullName || null,
      patient_phone: patient?.phone || null,
      contact_full_name: contact?.fullName || null,
      contact_phone: contact?.phone || null,
      call_log_transcript: asString(log?.transcript_text).trim() || null,
      call_log_summary: asString(log?.call_summary).trim() || null,
      call_log_duration_seconds:
        typeof log?.duration_seconds === 'number' ? log.duration_seconds : null,
      call_log_started_at: asString(log?.started_at).trim() || null,
      webhook_payload: null,
      appointment_id: appointmentByCallId.get(callId) || null
    }
  })
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await resolveClinicIdForUser(supabase)
    if (!clinicId) {
      return NextResponse.json({ weekStart: null, calls: [] })
    }

    const { searchParams } = new URL(req.url)
    const weekStartUtc = parseWeekStartUtc(searchParams.get('weekStart'))
    const weekEndUtcExclusive = new Date(weekStartUtc)
    weekEndUtcExclusive.setUTCDate(weekEndUtcExclusive.getUTCDate() + 7)

    const requestedLimit = Number(searchParams.get('limit') || 1200)
    const safeLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), 2000)
        : 1200

    const { data, error } = await supabase.rpc('get_voice_agent_calls_feed', {
      p_clinic_id: clinicId,
      p_start_time: weekStartUtc.toISOString(),
      p_end_time: weekEndUtcExclusive.toISOString(),
      p_limit: safeLimit,
      p_offset: 0
    })

    if (!error && Array.isArray(data)) {
      return NextResponse.json({
        weekStart: toDateString(weekStartUtc),
        source: 'rpc',
        calls: data as VoiceAgentCallRow[]
      })
    }

    if (error) {
      console.warn('[voice-agent/calls] RPC failed, switching to fallback', {
        code: error.code,
        message: error.message
      })
    }

    const fallbackCalls = await fetchCallsFallback(
      supabase,
      clinicId,
      weekStartUtc.toISOString(),
      weekEndUtcExclusive.toISOString(),
      safeLimit
    )

    return NextResponse.json({
      weekStart: toDateString(weekStartUtc),
      source: 'fallback',
      rpcError: error
        ? {
            code: error.code || null,
            message: error.message,
            hint: error.hint || null
          }
        : null,
      calls: fallbackCalls
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
