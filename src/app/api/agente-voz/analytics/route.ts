import { resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RawCallRow = {
  id: number | string
  external_call_id: string | null
  status: string | null
  management_status: string | null
  started_at: string | null
  recording_url: string | null
  from_number: string | null
  is_urgent: boolean | null
  call_outcome: string | null
  metadata: unknown
}

type CallLogRow = {
  call_id: number | string
  transcript_text: string | null
}

type WebhookEventRow = {
  related_call_id: number | string | null
  payload: unknown
}

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] as const

const DISTRIBUTION_COLORS = {
  advanced: {
    pendientes: '#E9FBF9',
    confirmadas: '#A8EFE7',
    aceptadas: '#51D6C7',
    estetica: '#2A6B67'
  },
  basic: {
    pedirCita: '#51D6C7',
    cambiarCita: '#B8D0FF',
    consultas: '#A8EFE7',
    cancelaciones: '#FFD188',
    urgencias: '#FF6B6B'
  }
} as const

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
      return NextResponse.json(emptyAnalytics())
    }

    const { searchParams } = new URL(req.url)
    const weekStartParam = searchParams.get('weekStart')
    const weekStartUtc = parseWeekStartUtc(weekStartParam)
    const weekEndUtcExclusive = new Date(weekStartUtc)
    weekEndUtcExclusive.setUTCDate(weekEndUtcExclusive.getUTCDate() + 7)

    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select(
        'id, external_call_id, status, management_status, started_at, recording_url, from_number, is_urgent, call_outcome, metadata'
      )
      .or(`clinic_id.eq.${clinicId},initial_clinic_id.eq.${clinicId}`)
      .gte('started_at', weekStartUtc.toISOString())
      .lt('started_at', weekEndUtcExclusive.toISOString())

    if (callsError) {
      return NextResponse.json({ error: callsError.message }, { status: 500 })
    }

    const rawCallRows = (calls || []) as RawCallRow[]
    const callIds = rawCallRows
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id))

    const [callLogsRes, webhookEventsRes] = await Promise.all([
      callIds.length > 0
        ? supabase
            .from('call_logs')
            .select('call_id, transcript_text')
            .in('call_id', callIds)
        : Promise.resolve({ data: [], error: null }),
      callIds.length > 0
        ? supabase
            .from('webhook_events')
            .select('related_call_id, payload')
            .in('related_call_id', callIds)
            .order('received_at', { ascending: false })
        : Promise.resolve({ data: [], error: null })
    ])

    if (callLogsRes.error) {
      return NextResponse.json({ error: callLogsRes.error.message }, { status: 500 })
    }
    if (webhookEventsRes.error) {
      return NextResponse.json({ error: webhookEventsRes.error.message }, { status: 500 })
    }

    const callLogsByCallId = new Map(
      ((callLogsRes.data || []) as CallLogRow[]).map((row) => [
        String(row.call_id),
        row
      ])
    )
    const payloadByCallId = new Map<string, Record<string, unknown>>()
    for (const row of (webhookEventsRes.data || []) as WebhookEventRow[]) {
      const key = row.related_call_id ? String(row.related_call_id) : ''
      if (!key || payloadByCallId.has(key)) continue
      const parsed = safeJson(row.payload)
      if (parsed) payloadByCallId.set(key, parsed)
    }

    const callRows = dedupeAndFilterCallsWithMedia(
      rawCallRows,
      callLogsByCallId,
      payloadByCallId
    )

    const volume = DAY_LABELS.map((label) => ({
      day: label,
      volumeTotal: 0,
      citasPropuestas: 0,
      citasAceptadas: 0,
      urgentes: 0
    }))

    const advancedCounts = {
      pendientes: 0,
      confirmadas: 0,
      aceptadas: 0,
      estetica: 0
    }
    const basicCounts = {
      pedirCita: 0,
      cambiarCita: 0,
      consultas: 0,
      cancelaciones: 0,
      urgencias: 0
    }

    for (const row of callRows) {
      const startedAt = row.started_at ? new Date(row.started_at) : null
      if (!startedAt) continue

      const dayIndex = (startedAt.getUTCDay() + 6) % 7
      const metadata = asObject(row.metadata)
      const payload = payloadByCallId.get(String(row.id)) || null
      const payloadCall = asObject(payload?.call)
      const lifecycleStatus = normalizeText(row.status)
      const managementStatus = normalizeText(row.management_status)
      const outcomeText = normalizeText(row.call_outcome)
      const intentText = normalizeText(
        asString(metadata?.call_reason) ||
          asString(metadata?.intent) ||
          asString(metadata?.call_intent) ||
          asString(metadata?.reason) ||
          asString(asObject(asObject(payloadCall?.call_analysis)?.custom_analysis_data)?.call_reason) ||
          asString(payloadCall?.call_reason) ||
          asString(asObject(payloadCall?.call_analysis)?.call_reason) ||
          ''
      )
      const summaryText = `${outcomeText} ${intentText}`

      const urgent = isUrgentCall(row.is_urgent, metadata, summaryText)
      const appointmentIntent = hasAppointmentIntent(summaryText)
      const accepted = isAcceptedCall(managementStatus, lifecycleStatus, metadata, summaryText)

      volume[dayIndex].volumeTotal += 1
      if (urgent) volume[dayIndex].urgentes += 1
      if (appointmentIntent) volume[dayIndex].citasPropuestas += 1
      if (accepted) volume[dayIndex].citasAceptadas += 1

      const advancedBucket = classifyAdvancedBucket(
        managementStatus,
        lifecycleStatus,
        metadata,
        summaryText
      )
      advancedCounts[advancedBucket] += 1

      const basicBucket = classifyBasicBucket(urgent, summaryText)
      basicCounts[basicBucket] += 1
    }

    return NextResponse.json({
      weekStart: toDate(weekStartUtc),
      distribution: {
        advanced: toPercentBuckets(
          [
            {
              name: 'Pendientes',
              key: 'pendientes',
              color: DISTRIBUTION_COLORS.advanced.pendientes
            },
            {
              name: 'Confirmadas',
              key: 'confirmadas',
              color: DISTRIBUTION_COLORS.advanced.confirmadas
            },
            {
              name: 'Aceptadas',
              key: 'aceptadas',
              color: DISTRIBUTION_COLORS.advanced.aceptadas
            },
            {
              name: 'Estética',
              key: 'estetica',
              color: DISTRIBUTION_COLORS.advanced.estetica
            }
          ],
          advancedCounts
        ),
        basic: toPercentBuckets(
          [
            {
              name: 'Pedir cita',
              key: 'pedirCita',
              color: DISTRIBUTION_COLORS.basic.pedirCita
            },
            {
              name: 'Cambiar cita',
              key: 'cambiarCita',
              color: DISTRIBUTION_COLORS.basic.cambiarCita
            },
            {
              name: 'Consultas',
              key: 'consultas',
              color: DISTRIBUTION_COLORS.basic.consultas
            },
            {
              name: 'Cancelaciones',
              key: 'cancelaciones',
              color: DISTRIBUTION_COLORS.basic.cancelaciones
            },
            {
              name: 'Urgencias',
              key: 'urgencias',
              color: DISTRIBUTION_COLORS.basic.urgencias
            }
          ],
          basicCounts
        )
      },
      volume
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function parseWeekStartUtc(input: string | null): Date {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return startOfIsoWeekUtc(new Date())
  }
  const parsed = new Date(`${input}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    return startOfIsoWeekUtc(new Date())
  }
  return startOfIsoWeekUtc(parsed)
}

function startOfIsoWeekUtc(date: Date): Date {
  const value = new Date(date)
  const day = value.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  value.setUTCDate(value.getUTCDate() + diff)
  value.setUTCHours(0, 0, 0, 0)
  return value
}

function toDate(value: Date): string {
  return value.toISOString().split('T')[0]
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
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
  return asObject(value)
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

function hasMedia(
  row: RawCallRow,
  log: CallLogRow | null,
  payload: Record<string, unknown> | null
): boolean {
  const payloadCall = asObject(payload?.call)
  const transcript = [
    asString(log?.transcript_text),
    asString(payload?.transcript),
    asString(payloadCall?.transcript),
    asString(payloadCall?.full_transcript)
  ]
    .map((value) => value.trim())
    .find(Boolean)
  const recording = [
    asString(row.recording_url),
    asString(asObject(row.metadata)?.recording_url),
    asString(payload?.recording_url),
    asString(payloadCall?.recording_url)
  ]
    .map((value) => value.trim())
    .find(Boolean)
  return Boolean(transcript && recording)
}

function getRowScore(
  row: RawCallRow,
  log: CallLogRow | null,
  payload: Record<string, unknown> | null
): number {
  const payloadCall = asObject(payload?.call)
  const transcriptLen = [
    asString(log?.transcript_text),
    asString(payload?.transcript),
    asString(payloadCall?.transcript),
    asString(payloadCall?.full_transcript)
  ]
    .map((value) => value.trim())
    .find(Boolean)?.length || 0
  const summaryLen =
    asString(row.call_outcome).trim().length +
    asString(asObject(payloadCall?.call_analysis)?.call_summary).trim().length
  return transcriptLen + summaryLen
}

function getStartedAtTs(value: string | null): number {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function dedupeAndFilterCallsWithMedia(
  rows: RawCallRow[],
  callLogsByCallId: Map<string, CallLogRow>,
  payloadByCallId: Map<string, Record<string, unknown>>
): RawCallRow[] {
  const deduped = new Map<string, RawCallRow>()

  for (const row of rows) {
    const idKey = String(row.id)
    const log = callLogsByCallId.get(idKey) || null
    const payload = payloadByCallId.get(idKey) || null
    if (!hasMedia(row, log, payload)) continue

    const dedupeKey =
      asString(row.external_call_id).trim() ||
      asString(row.recording_url).trim() ||
      `${asString(row.from_number).trim()}|${asString(row.started_at).trim()}`
    const existing = deduped.get(dedupeKey)
    if (!existing) {
      deduped.set(dedupeKey, row)
      continue
    }
    const existingIdKey = String(existing.id)
    const existingLog = callLogsByCallId.get(existingIdKey) || null
    const existingPayload = payloadByCallId.get(existingIdKey) || null
    const currentScore = getRowScore(row, log, payload)
    const existingScore = getRowScore(existing, existingLog, existingPayload)
    const shouldReplace =
      currentScore > existingScore ||
      getStartedAtTs(row.started_at) > getStartedAtTs(existing.started_at)
    if (shouldReplace) deduped.set(dedupeKey, row)
  }

  return Array.from(deduped.values())
}

function asBoolean(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'yes'
  )
}

function isUrgentCall(
  rowUrgent: boolean | null,
  metadata: Record<string, unknown> | null,
  text: string
): boolean {
  if (rowUrgent) return true
  const urgencyLevel = normalizeText(metadata?.urgency_level)
  return (
    urgencyLevel.includes('urgent') ||
    urgencyLevel.includes('alta') ||
    text.includes('urgencia') ||
    text.includes('dolor')
  )
}

function hasAppointmentIntent(text: string): boolean {
  const primary = getPrimaryIntentToken(text)
  if (
    primary.startsWith('cancelar cita') ||
    primary.startsWith('cambiar cita') ||
    primary.startsWith('change appointment') ||
    primary.startsWith('cancel appointment')
  ) {
    return false
  }
  return (
    text.includes('reservar cita') ||
    text.includes('pedir cita') ||
    text.includes('cita') ||
    text.includes('agenda') ||
    text.includes('reagendar') ||
    text.includes('confirmar') ||
    text.includes('book') ||
    text.includes('appointment')
  )
}

function isAcceptedCall(
  managementStatus: string,
  lifecycleStatus: string,
  metadata: Record<string, unknown> | null,
  text: string
): boolean {
  const acceptedByStatus =
    managementStatus.includes('resolved') ||
    lifecycleStatus.includes('resolved') ||
    lifecycleStatus.includes('completed')
  const acceptedByMetadata =
    asBoolean(metadata?.appointment_created) ||
    asBoolean(metadata?.appointment_confirmed) ||
    asBoolean(metadata?.accepted)
  const acceptedByText =
    text.includes('aceptad') ||
    text.includes('confirmad') ||
    text.includes('agendad')

  return acceptedByStatus || acceptedByMetadata || acceptedByText
}

function classifyAdvancedBucket(
  managementStatus: string,
  lifecycleStatus: string,
  metadata: Record<string, unknown> | null,
  text: string
): 'pendientes' | 'confirmadas' | 'aceptadas' | 'estetica' {
  if (isAestheticCall(metadata, text)) return 'estetica'

  const status = managementStatus || lifecycleStatus
  const isPending =
    status.includes('new') ||
    status.includes('pending') ||
    status.includes('queue') ||
    status.includes('earring') ||
    status.includes('in_progress')
  if (isPending) return 'pendientes'

  const isConfirmed =
    asBoolean(metadata?.appointment_confirmed) ||
    text.includes('confirmad') ||
    text.includes('confirmar cita')
  if (isConfirmed) return 'confirmadas'

  return 'aceptadas'
}

function classifyBasicBucket(
  urgent: boolean,
  text: string
): 'pedirCita' | 'cambiarCita' | 'consultas' | 'cancelaciones' | 'urgencias' {
  const primary = getPrimaryIntentToken(text)
  if (urgent) return 'urgencias'
  if (
    primary.startsWith('cambiar cita') ||
    primary.startsWith('change appointment') ||
    text.includes('cambiar cita') ||
    text.includes('change appointment') ||
    text.includes('reagendar') ||
    text.includes('reschedule')
  ) {
    return 'cambiarCita'
  }
  if (text.includes('cancel') || text.includes('anul')) return 'cancelaciones'
  if (hasAppointmentIntent(text)) return 'pedirCita'
  return 'consultas'
}

function getPrimaryIntentToken(text: string): string {
  const normalized = normalizeText(text)
  return normalized.split('-')[0]?.trim() || normalized
}

function isAestheticCall(
  metadata: Record<string, unknown> | null,
  text: string
): boolean {
  const service = normalizeText(metadata?.service_type)
  const specialty = normalizeText(metadata?.specialty)
  const source = `${service} ${specialty} ${text}`
  return (
    source.includes('estet') ||
    source.includes('blanque') ||
    source.includes('carilla') ||
    source.includes('ortodon')
  )
}

function toPercentBuckets<
  TKey extends string,
  TRow extends { name: string; key: TKey; color: string }
>(rows: TRow[], counters: Record<TKey, number>) {
  const total = rows.reduce((sum, row) => sum + (counters[row.key] || 0), 0)

  if (total <= 0) {
    return rows.map((row) => ({
      name: row.name,
      value: 0,
      color: row.color
    }))
  }

  const base = rows.map((row) => {
    const raw = ((counters[row.key] || 0) * 100) / total
    return {
      row,
      value: Math.floor(raw),
      remainder: raw - Math.floor(raw)
    }
  })

  let remaining = 100 - base.reduce((sum, item) => sum + item.value, 0)
  base.sort((a, b) => b.remainder - a.remainder)

  let cursor = 0
  while (remaining > 0) {
    base[cursor % base.length].value += 1
    remaining -= 1
    cursor += 1
  }

  const finalized = rows.map((row) => {
    const item = base.find((entry) => entry.row.key === row.key)
    return {
      name: row.name,
      value: item?.value ?? 0,
      color: row.color
    }
  })

  return finalized
}

function emptyAnalytics() {
  const emptyVolume = DAY_LABELS.map((day) => ({
    day,
    volumeTotal: 0,
    citasPropuestas: 0,
    citasAceptadas: 0,
    urgentes: 0
  }))

  return {
    weekStart: toDate(startOfIsoWeekUtc(new Date())),
    distribution: {
      advanced: [
        {
          name: 'Pendientes',
          value: 0,
          color: DISTRIBUTION_COLORS.advanced.pendientes
        },
        {
          name: 'Confirmadas',
          value: 0,
          color: DISTRIBUTION_COLORS.advanced.confirmadas
        },
        {
          name: 'Aceptadas',
          value: 0,
          color: DISTRIBUTION_COLORS.advanced.aceptadas
        },
        {
          name: 'Estética',
          value: 0,
          color: DISTRIBUTION_COLORS.advanced.estetica
        }
      ],
      basic: [
        {
          name: 'Pedir cita',
          value: 0,
          color: DISTRIBUTION_COLORS.basic.pedirCita
        },
        {
          name: 'Cambiar cita',
          value: 0,
          color: DISTRIBUTION_COLORS.basic.cambiarCita
        },
        {
          name: 'Consultas',
          value: 0,
          color: DISTRIBUTION_COLORS.basic.consultas
        },
        {
          name: 'Cancelaciones',
          value: 0,
          color: DISTRIBUTION_COLORS.basic.cancelaciones
        },
        {
          name: 'Urgencias',
          value: 0,
          color: DISTRIBUTION_COLORS.basic.urgencias
        }
      ]
    },
    volume: emptyVolume
  }
}
