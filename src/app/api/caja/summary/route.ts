import { requireCajaPermission, resolveClinicIdForUser } from '@/lib/caja/permissions'
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

type AccountingSummaryRow = {
  ingresos?: number | string | null
  cobros?: number | string | null
  anticipos?: number | string | null
  devoluciones?: number | string | null
  prev_ingresos?: number | string | null
  prev_cobros?: number | string | null
  prev_anticipos?: number | string | null
  prev_devoluciones?: number | string | null
}

type PaymentAccountingRow = {
  amount: number | string | null
  cash_kind?: string | null
  voided_at?: string | null
}

const computeAccountingSummaryFromPayments = (payments: PaymentAccountingRow[]) => {
  return payments.reduce(
    (totals, payment) => {
      if (payment.voided_at) return totals
      const amount = Number(payment.amount || 0)
      const cashKind = payment.cash_kind || null

      if (cashKind === 'cobro') {
        totals.cobros += amount
      } else if (cashKind === 'anticipo') {
        totals.anticipos += amount
      } else if (cashKind === 'devolucion') {
        totals.devoluciones += amount
      }

      totals.ingresos = totals.anticipos + totals.cobros - totals.devoluciones
      return totals
    },
    { ingresos: 0, cobros: 0, anticipos: 0, devoluciones: 0 }
  )
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

    const clinicId = await resolveClinicIdForUser(supabase)
    if (!clinicId) return NextResponse.json({ summary: null })

    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'cash',
      action: 'view'
    })
    if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
    let prevInvoiced = 0
    let prevCollected = 0
    let prevToCollect: number | null = null

    const [resumenRpc, accountingCombinedRpc] = await Promise.all([
      supabase.rpc('get_caja_resumen', {
        p_clinic_id: clinicId,
        p_period_start: periodStartTs,
        p_period_end: periodEndTs,
        p_prev_start: prevStartTs,
        p_prev_end: prevEndTs
      }),
      supabase.rpc('get_cash_accounting_summary', {
        p_clinic_id: clinicId,
        p_period_start: periodStartTs,
        p_period_end: periodEndTs,
        p_prev_start: prevStartTs,
        p_prev_end: prevEndTs
      })
    ])

    const resumenRow = Array.isArray(resumenRpc.data) ? resumenRpc.data[0] : null
    const accountingCombinedRow = Array.isArray(accountingCombinedRpc.data)
      ? (accountingCombinedRpc.data[0] as AccountingSummaryRow | null)
      : null

    if (!resumenRpc.error && resumenRow) {
      produced = Number(resumenRow.produced || 0)
      prevProduced = Number(resumenRow.prev_produced || 0)
    } else {
      const [periodInvoicesRes, prevPeriodInvoicesRes] = await Promise.all([
        supabase.rpc('get_invoices_in_time_range', {
          p_clinic_id: clinicId,
          p_start_time: periodStartTs,
          p_end_time: periodEndTs
        }),
        supabase.rpc('get_invoices_in_time_range', {
          p_clinic_id: clinicId,
          p_start_time: prevStartTs,
          p_end_time: prevEndTs
        })
      ])

      const periodInvoices = periodInvoicesRes.data || []
      const prevPeriodInvoices = prevPeriodInvoicesRes.data || []

      produced = periodInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      )
      prevProduced = prevPeriodInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      )
    }

    if (!accountingCombinedRpc.error && accountingCombinedRow) {
      invoiced = Number(accountingCombinedRow.ingresos || 0)
      collected = Number(accountingCombinedRow.cobros || 0)
      toCollect = Number(accountingCombinedRow.anticipos || 0)
      prevInvoiced = Number(accountingCombinedRow.prev_ingresos || 0)
      prevCollected = Number(accountingCombinedRow.prev_cobros || 0)
      prevToCollect = Number(accountingCombinedRow.prev_anticipos || 0)
    } else {
      const [accountingCurrentRpc, accountingPrevRpc] = await Promise.all([
        supabase.rpc('get_cash_accounting_summary', {
          p_clinic_id: clinicId,
          p_period_start: periodStartTs,
          p_period_end: periodEndTs
        }),
        supabase.rpc('get_cash_accounting_summary', {
          p_clinic_id: clinicId,
          p_period_start: prevStartTs,
          p_period_end: prevEndTs
        })
      ])

      const accountingCurrentRow = Array.isArray(accountingCurrentRpc.data)
        ? (accountingCurrentRpc.data[0] as AccountingSummaryRow | null)
        : null
      const accountingPrevRow = Array.isArray(accountingPrevRpc.data)
        ? (accountingPrevRpc.data[0] as AccountingSummaryRow | null)
        : null

      if (!accountingCurrentRpc.error && accountingCurrentRow) {
        invoiced = Number(accountingCurrentRow.ingresos || 0)
        collected = Number(accountingCurrentRow.cobros || 0)
        toCollect = Number(accountingCurrentRow.anticipos || 0)
      } else {
        const { data: periodPayments } = await supabase
          .from('payments')
          .select('amount,cash_kind,voided_at')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', periodStartTs)
          .lte('transaction_date', periodEndTs)

        const accounting = computeAccountingSummaryFromPayments(
          (periodPayments || []) as PaymentAccountingRow[]
        )
        invoiced = accounting.ingresos
        collected = accounting.cobros
        toCollect = accounting.anticipos
      }

      if (!accountingPrevRpc.error && accountingPrevRow) {
        prevInvoiced = Number(accountingPrevRow.ingresos || 0)
        prevCollected = Number(accountingPrevRow.cobros || 0)
        prevToCollect = Number(accountingPrevRow.anticipos || 0)
      } else {
        const { data: prevPeriodPayments } = await supabase
          .from('payments')
          .select('amount,cash_kind,voided_at')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', prevStartTs)
          .lte('transaction_date', prevEndTs)

        const previousAccounting = computeAccountingSummaryFromPayments(
          (prevPeriodPayments || []) as PaymentAccountingRow[]
        )
        prevInvoiced = previousAccounting.ingresos
        prevCollected = previousAccounting.cobros
        prevToCollect = previousAccounting.anticipos
      }
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
        accessory: 'attach_money'
      },
      {
        id: 'invoiced',
        title: 'Facturado',
        value: `${invoiced.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(invoiced, prevInvoiced),
        color: '#e9f6fb',
        accessory: 'receipt_long'
      },
      {
        id: 'collected',
        title: 'Cobrado',
        value: `${collected.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(collected, prevCollected),
        color: 'var(--color-brand-50)',
        accessory: 'check_circle'
      },
      {
        id: 'advance',
        title: 'Anticipo / Pdte. cobrar',
        value: `${toCollect.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta:
          prevToCollect === null
            ? '—'
            : calculateDelta(toCollect, Number.isFinite(prevToCollect) ? prevToCollect : 0),
        color: 'var(--color-warning-50)',
        accessory: 'hourglass_top'
      }
    ]

    // Donut gauge for selected period: Cobrado vs Facturado (accounting view)
    const donutValue = collected
    const donutTarget = invoiced

    return NextResponse.json({
      summary,
      donut: {
        value: donutValue,
        target: donutTarget,
        pendingToCollect: Math.max(toCollect, 0)
      }
    })
  } catch (error: any) {
    console.error('Error in cash summary API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
