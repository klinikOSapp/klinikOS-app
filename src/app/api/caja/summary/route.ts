import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type SummaryCard = {
  id: string
  title: string
  value: string
  delta: string
  color: string
  accessory: string
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

    // Get user's clinic
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ summary: null })
    }

    const clinicId = clinics[0] as string

    const formatMadridDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d)

    // v2.0: KPI cards change based on temporal filter selection.
    // Default (if no params) is current month.
    const anchorDateStr = date ?? formatMadridDate(new Date())
    const anchorUtc = new Date(`${anchorDateStr}T00:00:00Z`)

    const startOfWeekUtc = (d: Date) => {
      const copy = new Date(d)
      const day = copy.getUTCDay()
      const diffToMonday = (day + 6) % 7
      copy.setUTCDate(copy.getUTCDate() - diffToMonday)
      return copy
    }

    const endOfWeekUtc = (d: Date) => {
      const start = startOfWeekUtc(d)
      const end = new Date(start)
      end.setUTCDate(start.getUTCDate() + 6)
      return end
    }

    const startOfMonthUtc = (d: Date) =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))

    const endOfMonthUtc = (d: Date) =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))

    const startOfYearUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const endOfYearUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), 11, 31))

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

    const periodStartStr = periodStartUtc.toISOString().split('T')[0]
    const periodEndStr = periodEndUtc.toISOString().split('T')[0]
    const periodStartTs = `${periodStartStr}T00:00:00Z`
    const periodEndTs = `${periodEndStr}T23:59:59Z`

    // For delta (optional): compare to same period last year
    const prevStartUtc = new Date(periodStartUtc)
    prevStartUtc.setUTCFullYear(prevStartUtc.getUTCFullYear() - 1)
    const prevEndUtc = new Date(periodEndUtc)
    prevEndUtc.setUTCFullYear(prevEndUtc.getUTCFullYear() - 1)
    const prevStartStr = prevStartUtc.toISOString().split('T')[0]
    const prevEndStr = prevEndUtc.toISOString().split('T')[0]
    const prevStartTs = `${prevStartStr}T00:00:00Z`
    const prevEndTs = `${prevEndStr}T23:59:59Z`

    // Prefer DB-side aggregation (fast). Fallback to row-fetching (slower) for environments
    // where the RPC hasn't been deployed yet.
    let produced = 0
    let invoiced = 0
    let collected = 0
    let toCollect = 0
    let prevProduced = 0
    let prevCollected = 0

    const resumenRpc = await supabase.rpc('get_caja_resumen', {
      p_clinic_id: clinicId,
      p_period_start: periodStartTs,
      p_period_end: periodEndTs,
      p_prev_start: prevStartTs,
      p_prev_end: prevEndTs
    })

    const resumenRow = Array.isArray(resumenRpc.data) ? resumenRpc.data[0] : null
    if (!resumenRpc.error && resumenRow) {
      produced = Number(resumenRow.produced || 0)
      invoiced = Number(resumenRow.invoiced || 0)
      collected = Number(resumenRow.collected || 0)
      toCollect = Number(resumenRow.to_collect || 0)
      prevProduced = Number(resumenRow.prev_produced || 0)
      prevCollected = Number(resumenRow.prev_collected || 0)
    } else {
      // Fetch all needed datasets in parallel (reduces lag when switching filters).
      const [
        periodPaymentsRes,
        periodInvoicesRes,
        prevPeriodPaymentsRes,
        prevPeriodInvoicesRes,
        invoicesUpToEndRes,
        paymentsUpToEndRes
      ] = await Promise.all([
        supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', periodStartTs)
          .lte('transaction_date', periodEndTs),
        supabase.rpc('get_invoices_in_time_range', {
          p_clinic_id: clinicId,
          p_start_time: periodStartTs,
          p_end_time: periodEndTs
        }),
        supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', prevStartTs)
          .lte('transaction_date', prevEndTs),
        supabase.rpc('get_invoices_in_time_range', {
          p_clinic_id: clinicId,
          p_start_time: prevStartTs,
          p_end_time: prevEndTs
        }),
        // Por cobrar: outstanding as of period end (includes previous months)
        supabase.rpc('get_invoices_in_time_range', {
          p_clinic_id: clinicId,
          p_start_time: `1970-01-01T00:00:00Z`,
          p_end_time: periodEndTs
        }),
        supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', clinicId)
          .lte('transaction_date', periodEndTs)
      ])

      const periodPayments = periodPaymentsRes.data || []
      const periodInvoices = periodInvoicesRes.data || []
      const prevPeriodPayments = prevPeriodPaymentsRes.data || []
      const prevPeriodInvoices = prevPeriodInvoicesRes.data || []
      const invoicesUpToEnd = invoicesUpToEndRes.data || []
      const paymentsUpToEnd = paymentsUpToEndRes.data || []

      // v2.0 KPI values are for selected period.
      produced = periodInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      )
      invoiced = produced
      collected = periodPayments.reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      )

      // v2.0 "Por cobrar": outstanding debt as-of end of selected period.
      const producedUpToEnd = invoicesUpToEnd.reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      )
      const collectedUpToEnd = paymentsUpToEnd.reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      )
      toCollect = producedUpToEnd - collectedUpToEnd

      // Previous period totals (same window last year)
      prevProduced = prevPeriodInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      )
      prevCollected = prevPeriodPayments.reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      )
    }

    // Calculate deltas
    const calculateDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+ 100%' : '0%'
      const percent = ((current - previous) / previous) * 100
      const sign = percent >= 0 ? '+' : ''
      return `${sign} ${Math.round(percent)}%`
    }

    const summary: SummaryCard[] = [
      {
        id: 'produced',
        title: 'Producido',
        value: `${produced.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(produced, prevProduced),
        color: 'var(--color-info-50)',
        accessory: 'money_bag'
      },
      {
        id: 'invoiced',
        title: 'Facturado',
        value: `${invoiced.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(invoiced, prevProduced),
        color: '#e9f6fb',
        accessory: 'receipt_long'
      },
      {
        id: 'collected',
        title: 'Cobrado',
        value: `${collected.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(collected, prevCollected),
        color: 'var(--color-brand-50)',
        accessory: 'check'
      },
      {
        id: 'toCollect',
        title: 'Por cobrar',
        value: `${toCollect.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(toCollect, 0),
        color: 'var(--color-warning-50)',
        accessory: 'money_bag'
      }
    ]

    // Donut gauge for selected period: Cobrado vs Producido
    const donutValue = collected
    const donutTarget = produced

    return NextResponse.json({
      summary,
      donut: {
        value: donutValue,
        target: donutTarget
      }
    })
  } catch (error: any) {
    console.error('Error in cash summary API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



