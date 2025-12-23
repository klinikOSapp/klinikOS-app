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
    // Note: date and timeScale parameters are ignored - always use TODAY for YTD calculations
    // This ensures KPI cards show accumulated values from fiscal year start and don't change with filters

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

    // ALWAYS use TODAY's date for YTD calculations (not the selected date)
    // This ensures KPI cards don't change when user navigates dates
    const formatMadridDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d)

    const today = new Date()
    const todayStr = formatMadridDate(today)
    
    // Calculate fiscal year start (January 1st of current year)
    const currentYear = Number(todayStr.split('-')[0])
    const fiscalYearStartStr = `${currentYear}-01-01`

    // Calculate previous year's same period for delta comparison
    const [y, m, d] = todayStr.split('-').map((v) => Number(v))
    const prevYearStartStr = `${y - 1}-01-01`
    const prevYearEndStr = `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    // Fetch YTD (Year-To-Date) accumulated data from fiscal year start to TODAY
    const { data: ytdPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('clinic_id', clinicId)
      .gte('transaction_date', `${fiscalYearStartStr}T00:00:00Z`)
      .lte('transaction_date', `${todayStr}T23:59:59Z`)

    // Invoices: use RPC to correctly use issue_timestamp (fallback to issue_date)
    const { data: ytdInvoices } = await supabase.rpc('get_invoices_in_time_range', {
      p_clinic_id: clinicId,
      p_start_time: `${fiscalYearStartStr}T00:00:00Z`,
      p_end_time: `${todayStr}T23:59:59Z`
    })

    // Fetch previous year's same period data for delta calculation
    const { data: prevYearPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('clinic_id', clinicId)
      .gte('transaction_date', `${prevYearStartStr}T00:00:00Z`)
      .lte('transaction_date', `${prevYearEndStr}T23:59:59Z`)

    const { data: prevYearInvoices } = await supabase.rpc('get_invoices_in_time_range', {
      p_clinic_id: clinicId,
      p_start_time: `${prevYearStartStr}T00:00:00Z`,
      p_end_time: `${prevYearEndStr}T23:59:59Z`
    })

    // Calculate YTD accumulated totals (from fiscal year start to today)
    const ytdProduced =
      ytdInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
    const ytdInvoiced = ytdProduced
    const ytdCollected =
      ytdPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
    
    // Por Cobrar = Producido - Cobrado (includes ALL accumulated debt from fiscal year start)
    const ytdToCollect = ytdProduced - ytdCollected

    // Calculate previous year's same period totals for comparison
    const prevYearProduced =
      prevYearInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0
    const prevYearCollected =
      prevYearPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0

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
        value: `${ytdProduced.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(ytdProduced, prevYearProduced),
        color: 'var(--color-info-50)',
        accessory: 'money_bag'
      },
      {
        id: 'invoiced',
        title: 'Facturado',
        value: `${ytdInvoiced.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(ytdInvoiced, prevYearProduced),
        color: '#e9f6fb',
        accessory: 'receipt_long'
      },
      {
        id: 'collected',
        title: 'Cobrado',
        value: `${ytdCollected.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(ytdCollected, prevYearCollected),
        color: 'var(--color-brand-50)',
        accessory: 'check'
      },
      {
        id: 'toCollect',
        title: 'Por cobrar',
        value: `${ytdToCollect.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        delta: calculateDelta(ytdToCollect, prevYearProduced - prevYearCollected),
        color: 'var(--color-warning-50)',
        accessory: 'money_bag'
      }
    ]

    // Calculate donut chart data (YTD collected vs YTD produced/facturado)
    // Gauge shows: Cobrado / Producido (or Facturado, they're the same)
    const donutValue = ytdCollected
    const donutTarget = ytdProduced // Use Producido/Facturado as target (not 1.5x)

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



