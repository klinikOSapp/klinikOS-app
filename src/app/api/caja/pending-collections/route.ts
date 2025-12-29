import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function addDaysUtcDateStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map((v) => Number(v))
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().split('T')[0]
}

function madridDayStartUtc(dateStr: string) {
  const guessUtc = new Date(`${dateStr}T00:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(guessUtc)

  const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0')
  const second = Number(parts.find((p) => p.type === 'second')?.value || '0')
  const deltaMs = (hour * 3600 + minute * 60 + second) * 1000
  return new Date(guessUtc.getTime() - deltaMs)
}

function madridDayRangeUtc(dateStr: string) {
  const startUtc = madridDayStartUtc(dateStr)
  const nextStartUtc = madridDayStartUtc(addDaysUtcDateStr(dateStr, 1))
  const endUtc = new Date(nextStartUtc.getTime() - 1)
  return { startUtc, endUtc }
}

function startOfWeekUtc(d: Date) {
  const copy = new Date(d)
  const day = copy.getUTCDay()
  const diffToMonday = (day + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - diffToMonday)
  return copy
}

function endOfWeekUtc(d: Date) {
  const start = startOfWeekUtc(d)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return end
}

function startOfMonthUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function endOfMonthUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
}

function startOfYearUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
}

function endOfYearUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 11, 31))
}

function madridDayStr(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || null
    const timeScale = (searchParams.get('timeScale') || 'month') as
      | 'day'
      | 'week'
      | 'month'
      | 'year'

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) return NextResponse.json({ patients: [] })
    const clinicId = clinics[0] as string

    const formatMadridDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d)

    const anchorDateStr = date ?? formatMadridDate(new Date())
    const anchorUtc = new Date(`${anchorDateStr}T00:00:00Z`)

    const periodStartUtc =
      timeScale === 'day'
        ? anchorUtc
        : timeScale === 'week'
          ? startOfWeekUtc(anchorUtc)
          : timeScale === 'year'
            ? startOfYearUtc(anchorUtc)
            : startOfMonthUtc(anchorUtc)

    const periodEndUtc =
      timeScale === 'day'
        ? anchorUtc
        : timeScale === 'week'
          ? endOfWeekUtc(anchorUtc)
          : timeScale === 'year'
            ? endOfYearUtc(anchorUtc)
            : endOfMonthUtc(anchorUtc)

    const periodEndStr = periodEndUtc.toISOString().split('T')[0] // YYYY-MM-DD
    const { endUtc } = madridDayRangeUtc(periodEndStr)
    const asOf = endUtc.toISOString()

    // Prefer DB-side aggregation (fast).
    const res = await supabase.rpc('get_caja_pending_collections_by_patient', {
      p_clinic_id: clinicId,
      p_as_of: asOf
    })

    if (!res.error) {
      const patients = (res.data as any[] | null)?.map((r) => ({
        patientId: String(r.patient_id),
        name: `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.trim(),
        phone: r.patient_phone ? String(r.patient_phone) : null,
        email: r.patient_email ? String(r.patient_email) : null,
        outstandingTotal: Number(r.outstanding_total || 0),
        oldestDay: r.oldest_day ? String(r.oldest_day) : null, // YYYY-MM-DD
        invoiceCount: Number(r.invoice_count || 0),
        agingDays: Number(r.aging_days || 0)
      })) || []

      return NextResponse.json({ patients, asOf })
    }

    // Fallback: compute from invoices + payments (source of truth), grouped per patient.
    console.warn('[pending-collections] RPC missing, using fallback', res.error)

    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('id, patient_id, clinic_id, total_amount, issue_timestamp, issue_date')
      .eq('clinic_id', clinicId)
      .lte('issue_timestamp', asOf)

    if (invErr) {
      console.error('[pending-collections] invoices fallback error', invErr)
      return NextResponse.json({ error: invErr.message }, { status: 500 })
    }

    const invoiceIds = (invoices || []).map((i: any) => i.id)
    const paidByInvoice = new Map<string, number>()
    if (invoiceIds.length > 0) {
      // NOTE: Supabase "in" has limits; for very large ranges, deploy the RPC.
      const { data: pays, error: payErr } = await supabase
        .from('payments')
        .select('invoice_id, amount, transaction_date')
        .eq('clinic_id', clinicId)
        .lte('transaction_date', asOf)
        .in('invoice_id', invoiceIds)

      if (payErr) {
        console.error('[pending-collections] payments fallback error', payErr)
        return NextResponse.json({ error: payErr.message }, { status: 500 })
      }
      for (const p of pays || []) {
        const id = String((p as any).invoice_id)
        const amt = Number((p as any).amount || 0)
        paidByInvoice.set(id, (paidByInvoice.get(id) || 0) + amt)
      }
    }

    const agg = new Map<
      string,
      { outstandingTotal: number; invoiceCount: number; oldestDay: string | null }
    >()

    for (const inv of invoices || []) {
      const invoiceId = String((inv as any).id)
      const patientId = String((inv as any).patient_id)
      const total = Number((inv as any).total_amount || 0)
      const paid = paidByInvoice.get(invoiceId) || 0
      const outstanding = total - paid
      if (outstanding <= 0.009) continue

      const ts = (inv as any).issue_timestamp
        ? new Date((inv as any).issue_timestamp)
        : new Date(`${String((inv as any).issue_date)}T00:00:00Z`)
      const day = madridDayStr(ts) // YYYY-MM-DD

      const prev = agg.get(patientId) || {
        outstandingTotal: 0,
        invoiceCount: 0,
        oldestDay: null as string | null
      }
      prev.outstandingTotal += outstanding
      prev.invoiceCount += 1
      prev.oldestDay = prev.oldestDay ? (day < prev.oldestDay ? day : prev.oldestDay) : day
      agg.set(patientId, prev)
    }

    const patientIds = Array.from(agg.keys())
    if (patientIds.length === 0) return NextResponse.json({ patients: [], asOf })

    const { data: patientsData, error: patErr } = await supabase
      .from('patients')
      .select('id, first_name, last_name, phone_number, email')
      .eq('clinic_id', clinicId)
      .in('id', patientIds)

    if (patErr) {
      console.error('[pending-collections] patients fallback error', patErr)
      return NextResponse.json({ error: patErr.message }, { status: 500 })
    }

    const asOfDay = madridDayStr(new Date(asOf))
    const asOfDate = new Date(`${asOfDay}T00:00:00Z`)

    const out = (patientsData || [])
      .map((p: any) => {
        const patientId = String(p.id)
        const s = agg.get(patientId)!
        const oldest = s.oldestDay
        const agingDays = oldest
          ? Math.round((Number(asOfDate) - Number(new Date(`${oldest}T00:00:00Z`))) / 86400000)
          : 0
        return {
          patientId,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          phone: p.phone_number ? String(p.phone_number) : null,
          email: p.email ? String(p.email) : null,
          outstandingTotal: Number(s.outstandingTotal || 0),
          oldestDay: oldest,
          invoiceCount: Number(s.invoiceCount || 0),
          agingDays
        }
      })
      .sort((a: any, b: any) => {
        if (a.oldestDay && b.oldestDay) return a.oldestDay.localeCompare(b.oldestDay)
        if (a.oldestDay) return -1
        if (b.oldestDay) return 1
        return 0
      })

    return NextResponse.json({ patients: out, asOf })
  } catch (error: any) {
    console.error('Error in pending-collections API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

