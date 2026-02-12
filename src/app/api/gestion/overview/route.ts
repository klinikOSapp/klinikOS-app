import type { CashTimeScale } from '@/components/caja/cajaTypes'
import {
  SPECIALTIES,
  type GestionBillingPoint,
  type GestionOverviewResponse,
  type GestionProfessionalMetric,
  type Specialty
} from '@/components/gestion/gestionTypes'
import { resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type PeriodRange = {
  startUtc: Date
  endUtc: Date
}

type AppointmentRow = {
  patient_id: string | null
  service_type: string | null
  scheduled_start_time: string
  service_catalog?: { category?: string | null } | { category?: string | null }[] | null
}

type CalendarRow = {
  id: number
  patient_id: string | null
  service_name: string | null
  staff_assigned:
    | Array<{ full_name?: string | null }>
    | { full_name?: string | null }
    | null
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta/TPV',
  transfer: 'Transferencia',
  financing: 'Financiación'
}

const FIXED_COST_RATIO = 0.6

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const timeScale = parseTimeScale(searchParams.get('timeScale'))
    const anchorDate = parseAnchorDate(searchParams.get('date'))

    const clinicId = await resolveClinicIdForUser(supabase)
    if (!clinicId) {
      return NextResponse.json(emptyResponse(timeScale, anchorDate))
    }

    const period = buildPeriodRange(anchorDate, timeScale)
    const previousPeriod = shiftPeriodByYears(period, -1)

    const periodStartTs = toStartTs(period.startUtc)
    const periodEndTs = toEndTs(period.endUtc)
    const prevStartTs = toStartTs(previousPeriod.startUtc)
    const prevEndTs = toEndTs(previousPeriod.endUtc)

    const [
      resumenRpc,
      paymentsPeriodRes,
      paymentsPreviousRes,
      invoicesPeriodRes,
      invoicesPreviousRes,
      invoicesToDateRes,
      paymentsToDateRes,
      appointmentsPeriodRes,
      appointmentsPrevRes,
      patientsNewRes,
      patientsPrevNewRes,
      calendarRes,
      billingInvoicesRes
    ] = await Promise.all([
      supabase.rpc('get_caja_resumen', {
        p_clinic_id: clinicId,
        p_period_start: periodStartTs,
        p_period_end: periodEndTs,
        p_prev_start: prevStartTs,
        p_prev_end: prevEndTs
      }),
      supabase
        .from('payments')
        .select('amount, payment_method')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', periodStartTs)
        .lte('transaction_date', periodEndTs),
      supabase
        .from('payments')
        .select('amount')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', prevStartTs)
        .lte('transaction_date', prevEndTs),
      supabase.rpc('get_invoices_in_time_range', {
        p_clinic_id: clinicId,
        p_start_time: periodStartTs,
        p_end_time: periodEndTs
      }),
      supabase.rpc('get_invoices_in_time_range', {
        p_clinic_id: clinicId,
        p_start_time: prevStartTs,
        p_end_time: prevEndTs
      }),
      supabase.rpc('get_invoices_in_time_range', {
        p_clinic_id: clinicId,
        p_start_time: '1970-01-01T00:00:00Z',
        p_end_time: periodEndTs
      }),
      supabase
        .from('payments')
        .select('amount')
        .eq('clinic_id', clinicId)
        .lte('transaction_date', periodEndTs),
      supabase
        .from('appointments')
        .select('patient_id, service_type, scheduled_start_time, service_catalog:service_id(category)')
        .eq('clinic_id', clinicId)
        .gte('scheduled_start_time', periodStartTs)
        .lte('scheduled_start_time', periodEndTs),
      supabase
        .from('appointments')
        .select('patient_id, scheduled_start_time')
        .eq('clinic_id', clinicId)
        .gte('scheduled_start_time', prevStartTs)
        .lte('scheduled_start_time', prevEndTs),
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('created_at', periodStartTs)
        .lte('created_at', periodEndTs),
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('created_at', prevStartTs)
        .lte('created_at', prevEndTs),
      supabase.rpc('get_appointments_calendar', {
        p_clinic_id: clinicId,
        p_start_date: toDate(period.startUtc),
        p_end_date: toDate(period.endUtc),
        p_staff_id: null,
        p_box_id: null
      }),
      buildBillingInvoicesQuery(supabase, clinicId, anchorDate, timeScale)
    ])

    const fallbackProduced = sumAmount(invoicesPeriodRes.data, 'total_amount')
    const fallbackCollected = sumAmount(paymentsPeriodRes.data, 'amount')
    const fallbackPrevProduced = sumAmount(invoicesPreviousRes.data, 'total_amount')
    const fallbackPrevCollected = sumAmount(paymentsPreviousRes.data, 'amount')
    const producedToDate = sumAmount(invoicesToDateRes.data, 'total_amount')
    const collectedToDate = sumAmount(paymentsToDateRes.data, 'amount')

    const resumenRow = Array.isArray(resumenRpc.data) ? resumenRpc.data[0] : null
    const produced = Number(resumenRow?.produced ?? fallbackProduced)
    const invoiced = Number(resumenRow?.invoiced ?? fallbackProduced)
    const collected = Number(resumenRow?.collected ?? fallbackCollected)
    const pending = Number(resumenRow?.to_collect ?? Math.max(producedToDate - collectedToDate, 0))

    const prevProduced = Number(resumenRow?.prev_produced ?? fallbackPrevProduced)
    const prevInvoiced = Number(resumenRow?.prev_invoiced ?? fallbackPrevProduced)
    const prevCollected = Number(resumenRow?.prev_collected ?? fallbackPrevCollected)
    const prevPendingRaw = resumenRow?.prev_to_collect
    const prevPending =
      prevPendingRaw == null || prevPendingRaw === '' ? null : Number(prevPendingRaw)

    const incomeMethods = aggregateIncomeMethods(
      paymentsPeriodRes.data as Array<{ amount: number | string | null; payment_method: string | null }> | null
    )

    const periodAppointments = (appointmentsPeriodRes.data || []) as AppointmentRow[]
    const previousAppointments =
      (appointmentsPrevRes.data || []) as Array<{ patient_id: string | null }>

    const activePatients = new Set(
      periodAppointments
        .map((row) => row.patient_id)
        .filter((value): value is string => Boolean(value))
    ).size
    const prevActivePatients = new Set(
      previousAppointments
        .map((row) => row.patient_id)
        .filter((value): value is string => Boolean(value))
    ).size

    const newPatients = Number(patientsNewRes.count || 0)
    const prevNewPatients = Number(patientsPrevNewRes.count || 0)

    const specialtyWeights = buildSpecialtyWeights(periodAppointments)
    const specialties = SPECIALTIES.map((label) => {
      const share = specialtyWeights.get(label) || 0
      const producedValue = round2(produced * share)
      const invoicedValue = round2(invoiced * share)
      const collectedValue = round2(collected * share)
      return {
        label,
        produced: producedValue,
        invoiced: invoicedValue,
        collected: collectedValue,
        pending: round2(Math.max(invoicedValue - collectedValue, 0)),
        sharePercent: Math.round(share * 100)
      }
    })

    const professionals = buildProfessionals(
      (calendarRes.data || []) as CalendarRow[],
      produced,
      specialtyWeights
    )

    const billingPoints = buildBillingSeries({
      timeScale,
      anchorDate,
      invoices: (billingInvoicesRes.data || []) as Array<{
        issue_timestamp: string | null
        issue_date: string | null
        total_amount: number | string | null
      }>
    })

    const response: GestionOverviewResponse = {
      timeScale,
      anchorDate: toDate(anchorDate),
      summary: {
        produced,
        invoiced,
        collected,
        pending,
        producedDelta: toDeltaNumber(produced, prevProduced),
        invoicedDelta: toDeltaNumber(invoiced, prevInvoiced),
        collectedDelta: toDeltaNumber(collected, prevCollected),
        pendingDelta: prevPending == null ? null : toDeltaNumber(pending, prevPending)
      },
      incomeMethods,
      patients: {
        active: activePatients,
        nextDate: newPatients,
        growthPercent: toDeltaNumber(newPatients, prevNewPatients)
      },
      specialties,
      billing: {
        points: billingPoints
      },
      professionals,
      accounting: {
        fixedCosts: round2(invoiced * FIXED_COST_RATIO),
        fixedCostRatio: FIXED_COST_RATIO
      }
    }

    // Keep values clean for UI
    response.patients.growthPercent =
      Number.isFinite(response.patients.growthPercent) &&
      Math.abs(response.patients.growthPercent) < 1000
        ? response.patients.growthPercent
        : 0

    if (!Number.isFinite(response.summary.pendingDelta as number)) {
      response.summary.pendingDelta = null
    }

    // Derived metric used by PatientsSummary card for "% split"
    if (prevActivePatients < 0) {
      // unreachable, defensive only
      response.patients.active = activePatients
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in gestion overview API:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Unexpected error' },
      { status: 500 }
    )
  }
}

function emptyResponse(
  timeScale: CashTimeScale,
  anchorDate: Date
): GestionOverviewResponse {
  return {
    timeScale,
    anchorDate: toDate(anchorDate),
    summary: {
      produced: 0,
      invoiced: 0,
      collected: 0,
      pending: 0,
      producedDelta: 0,
      invoicedDelta: 0,
      collectedDelta: 0,
      pendingDelta: null
    },
    incomeMethods: [],
    patients: {
      active: 0,
      nextDate: 0,
      growthPercent: 0
    },
    specialties: SPECIALTIES.map((label) => ({
      label,
      produced: 0,
      invoiced: 0,
      collected: 0,
      pending: 0,
      sharePercent: 25
    })),
    billing: {
      points: []
    },
    professionals: [],
    accounting: {
      fixedCosts: 0,
      fixedCostRatio: FIXED_COST_RATIO
    }
  }
}

function parseTimeScale(value: string | null): CashTimeScale {
  if (value === 'day' || value === 'week' || value === 'month' || value === 'year') {
    return value
  }
  return 'week'
}

function parseAnchorDate(value: string | null) {
  if (!value) return new Date()
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function buildPeriodRange(anchor: Date, scale: CashTimeScale): PeriodRange {
  if (scale === 'day') {
    return {
      startUtc: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate())),
      endUtc: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()))
    }
  }

  if (scale === 'week') {
    const start = startOfWeekUtc(anchor)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 6)
    return { startUtc: start, endUtc: end }
  }

  if (scale === 'year') {
    return {
      startUtc: new Date(Date.UTC(anchor.getUTCFullYear(), 0, 1)),
      endUtc: new Date(Date.UTC(anchor.getUTCFullYear(), 11, 31))
    }
  }

  return {
    startUtc: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)),
    endUtc: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0))
  }
}

function shiftPeriodByYears(period: PeriodRange, years: number): PeriodRange {
  const start = new Date(period.startUtc)
  const end = new Date(period.endUtc)
  start.setUTCFullYear(start.getUTCFullYear() + years)
  end.setUTCFullYear(end.getUTCFullYear() + years)
  return { startUtc: start, endUtc: end }
}

function toStartTs(d: Date) {
  return `${toDate(d)}T00:00:00Z`
}

function toEndTs(d: Date) {
  return `${toDate(d)}T23:59:59Z`
}

function toDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function startOfWeekUtc(d: Date) {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = copy.getUTCDay()
  const diffToMonday = (day + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - diffToMonday)
  return copy
}

function sumAmount(data: any[] | null | undefined, field: string) {
  if (!Array.isArray(data)) return 0
  return round2(
    data.reduce((sum, row) => sum + Number((row && row[field]) || 0), 0)
  )
}

function toDeltaNumber(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0
  if (previous === 0) return current > 0 ? 100 : 0
  return round2(((current - previous) / Math.abs(previous)) * 100)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function aggregateIncomeMethods(
  rows: Array<{ amount: number | string | null; payment_method: string | null }> | null
) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const totals = new Map<string, number>()
  let grandTotal = 0

  for (const row of rows) {
    const key = normalizePaymentMethod(row.payment_method)
    const amount = Number(row.amount || 0)
    if (!Number.isFinite(amount) || amount <= 0) continue
    totals.set(key, (totals.get(key) || 0) + amount)
    grandTotal += amount
  }

  const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])

  return entries.map(([key, amount]) => ({
    label: PAYMENT_LABELS[key] || 'Otros',
    amount: round2(amount),
    percent: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0
  }))
}

function normalizePaymentMethod(value: string | null) {
  const lowered = (value || '').toLowerCase()
  if (lowered.includes('cash') || lowered.includes('efect')) return 'cash'
  if (lowered.includes('card') || lowered.includes('tpv') || lowered.includes('tarjeta')) {
    return 'card'
  }
  if (lowered.includes('transfer')) return 'transfer'
  if (lowered.includes('financ')) return 'financing'
  return 'other'
}

function buildSpecialtyWeights(appointments: AppointmentRow[]) {
  const counts = new Map<Specialty, number>()
  for (const specialty of SPECIALTIES) counts.set(specialty, 0)

  for (const row of appointments) {
    const category = extractAppointmentCategory(row)
    const specialty = mapCategoryToSpecialty(category)
    if (!specialty) continue
    counts.set(specialty, (counts.get(specialty) || 0) + 1)
  }

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0)
  const weights = new Map<Specialty, number>()

  if (total === 0) {
    const equal = 1 / SPECIALTIES.length
    for (const specialty of SPECIALTIES) weights.set(specialty, equal)
    return weights
  }

  for (const specialty of SPECIALTIES) {
    weights.set(specialty, (counts.get(specialty) || 0) / total)
  }

  return weights
}

function extractAppointmentCategory(row: AppointmentRow) {
  const nested = Array.isArray(row.service_catalog)
    ? row.service_catalog[0]
    : row.service_catalog
  return [nested?.category, row.service_type].filter(Boolean).join(' ')
}

function mapCategoryToSpecialty(raw: string | null | undefined): Specialty | null {
  const value = (raw || '').toLowerCase()
  if (!value) return null

  if (
    value.includes('impl') ||
    value.includes('cirug') ||
    value.includes('peri')
  ) {
    return 'Implantes'
  }

  if (value.includes('orto')) return 'Ortodoncia'

  if (value.includes('est') || value.includes('blanq') || value.includes('cosm')) {
    return 'Estética'
  }

  if (
    value.includes('cons') ||
    value.includes('endo') ||
    value.includes('odonto') ||
    value.includes('limp') ||
    value.includes('hig') ||
    value.includes('rev') ||
    value.includes('consulta')
  ) {
    return 'Conservadora'
  }

  return 'Conservadora'
}

function buildProfessionals(
  rows: CalendarRow[],
  producedTotal: number,
  specialtyWeights: Map<Specialty, number>
): GestionProfessionalMetric[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  const counters = new Map<string, { count: number }>()

  for (const row of rows) {
    const staff = Array.isArray(row.staff_assigned)
      ? row.staff_assigned[0]
      : row.staff_assigned
    const name = (staff?.full_name || '').trim() || 'Profesional'
    const current = counters.get(name) || { count: 0 }
    current.count += 1
    counters.set(name, current)
  }

  const totalAppointments = Array.from(counters.values()).reduce(
    (sum, value) => sum + value.count,
    0
  )

  if (totalAppointments === 0) return []

  const specialtyFactor =
    Array.from(specialtyWeights.values()).reduce((sum, value) => sum + value, 0) ||
    1

  const output: GestionProfessionalMetric[] = Array.from(counters.entries())
    .map(([name, value]) => {
      const share = value.count / totalAppointments
      return {
        name,
        appointmentCount: value.count,
        produced: round2((producedTotal * share) / specialtyFactor)
      }
    })
    .sort((a, b) => b.produced - a.produced)

  return output
}

async function buildBillingInvoicesQuery(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  clinicId: string,
  anchorDate: Date,
  timeScale: CashTimeScale
) {
  const points = buildBaseSeriesPoints(anchorDate, timeScale)
  const currentPoints = points.filter((point) => point.showData)
  const firstPoint = currentPoints[0]
  const lastPoint = currentPoints[currentPoints.length - 1]

  if (!firstPoint || !lastPoint) {
    return Promise.resolve({ data: [], error: null } as any)
  }

  const start = new Date(firstPoint.start)
  start.setUTCFullYear(start.getUTCFullYear() - 1)

  return supabase
    .from('invoices')
    .select('issue_timestamp, issue_date, total_amount')
    .eq('clinic_id', clinicId)
    .gte('issue_timestamp', toStartTs(start))
    .lte('issue_timestamp', toEndTs(lastPoint.end))
}

function buildBillingSeries(args: {
  timeScale: CashTimeScale
  anchorDate: Date
  invoices: Array<{
    issue_timestamp: string | null
    issue_date: string | null
    total_amount: number | string | null
  }>
}): GestionBillingPoint[] {
  const base = buildBaseSeriesPoints(args.anchorDate, args.timeScale)
  const aggregates = new Map<string, number>()

  for (const row of args.invoices) {
    const tsRaw = row.issue_timestamp || row.issue_date
    if (!tsRaw) continue
    const date = new Date(tsRaw)
    if (Number.isNaN(date.getTime())) continue

    const amount = Number(row.total_amount || 0)
    if (!Number.isFinite(amount)) continue

    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    const weekStart = startOfWeekUtc(date)
    const weekKey = `W-${toDate(weekStart)}`

    aggregates.set(monthKey, round2((aggregates.get(monthKey) || 0) + amount))
    aggregates.set(weekKey, round2((aggregates.get(weekKey) || 0) + amount))
  }

  return base.map((point) => {
    if (!point.showData) {
      return {
        label: point.label,
        current: null,
        previous: null
      }
    }

    const current = aggregates.get(point.currentKey) || 0
    const previous = aggregates.get(point.previousKey) || 0

    return {
      label: point.label,
      current,
      previous
    }
  })
}

function buildBaseSeriesPoints(anchorDate: Date, scale: CashTimeScale) {
  const currentIndex = 9
  const points: Array<{
    label: string
    start: Date
    end: Date
    currentKey: string
    previousKey: string
    showData: boolean
  }> = []

  const monthly = scale === 'month' || scale === 'year'

  for (let i = 0; i < 12; i++) {
    const offset = i - currentIndex
    if (monthly) {
      const d = new Date(
        Date.UTC(
          anchorDate.getUTCFullYear(),
          anchorDate.getUTCMonth() + offset,
          1
        )
      )
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
      const label = capitalize(
        new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(start)
      )
      const currentKey = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
      const previousKey = `${start.getUTCFullYear() - 1}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`
      points.push({
        label,
        start,
        end,
        currentKey,
        previousKey,
        showData: i <= currentIndex
      })
      continue
    }

    const weekAnchor = new Date(anchorDate)
    weekAnchor.setUTCDate(weekAnchor.getUTCDate() + offset * 7)
    const start = startOfWeekUtc(weekAnchor)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 6)
    const weekNumber = getWeekOfYear(start)

    points.push({
      label: `S${weekNumber}`,
      start,
      end,
      currentKey: `W-${toDate(start)}`,
      previousKey: `W-${toDate(new Date(Date.UTC(start.getUTCFullYear() - 1, start.getUTCMonth(), start.getUTCDate())))}`,
      showData: i <= currentIndex
    })
  }

  return points
}

function capitalize(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getWeekOfYear(date: Date): number {
  const target = new Date(date.valueOf())
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)

  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3)

  const weekNum =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

  if (weekNum < 1) return 1
  if (weekNum > 53) return 53
  return weekNum
}
