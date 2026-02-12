import { resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RawCallRow = {
  status: string | null
  started_at: string | null
  is_urgent: boolean | null
  call_outcome: string | null
  metadata: unknown
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
      .select('status, started_at, is_urgent, call_outcome, metadata')
      .or(`clinic_id.eq.${clinicId},initial_clinic_id.eq.${clinicId}`)
      .gte('started_at', weekStartUtc.toISOString())
      .lt('started_at', weekEndUtcExclusive.toISOString())

    if (callsError) {
      return NextResponse.json({ error: callsError.message }, { status: 500 })
    }

    const callRows = (calls || []) as RawCallRow[]

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
      consultas: 0,
      cancelaciones: 0,
      urgencias: 0
    }

    for (const row of callRows) {
      const startedAt = row.started_at ? new Date(row.started_at) : null
      if (!startedAt) continue

      const dayIndex = (startedAt.getUTCDay() + 6) % 7
      const metadata = asObject(row.metadata)
      const status = normalizeText(row.status)
      const outcomeText = normalizeText(row.call_outcome)
      const intentText = normalizeText(
        asString(metadata?.intent) ||
          asString(metadata?.call_intent) ||
          asString(metadata?.reason) ||
          ''
      )
      const summaryText = `${outcomeText} ${intentText}`

      const urgent = isUrgentCall(row.is_urgent, metadata, summaryText)
      const appointmentIntent = hasAppointmentIntent(summaryText)
      const accepted = isAcceptedCall(status, metadata, summaryText)

      volume[dayIndex].volumeTotal += 1
      if (urgent) volume[dayIndex].urgentes += 1
      if (appointmentIntent) volume[dayIndex].citasPropuestas += 1
      if (accepted) volume[dayIndex].citasAceptadas += 1

      const advancedBucket = classifyAdvancedBucket(status, metadata, summaryText)
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
  return (
    text.includes('cita') ||
    text.includes('agenda') ||
    text.includes('reagendar') ||
    text.includes('confirmar')
  )
}

function isAcceptedCall(
  status: string,
  metadata: Record<string, unknown> | null,
  text: string
): boolean {
  const acceptedByStatus = status.includes('resolved') || status.includes('completed')
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
  status: string,
  metadata: Record<string, unknown> | null,
  text: string
): 'pendientes' | 'confirmadas' | 'aceptadas' | 'estetica' {
  if (isAestheticCall(metadata, text)) return 'estetica'

  const isPending =
    status.includes('new') ||
    status.includes('pending') ||
    status.includes('queue') ||
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
): 'pedirCita' | 'consultas' | 'cancelaciones' | 'urgencias' {
  if (urgent) return 'urgencias'
  if (text.includes('cancel') || text.includes('anul')) return 'cancelaciones'
  if (hasAppointmentIntent(text)) return 'pedirCita'
  return 'consultas'
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
