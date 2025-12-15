import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 400 })
    }

    const clinicId = clinics[0] as string

    // Calculate previous day's date
    const closingDate = new Date(date)
    const previousDate = new Date(closingDate)
    previousDate.setDate(previousDate.getDate() - 1)
    const previousDateStr = previousDate.toISOString().split('T')[0]

    // Get previous day's cash_balance (this becomes starter_box_amount)
    const { data: previousClosing } = await supabase
      .from('daily_cash_closings')
      .select('cash_balance')
      .eq('clinic_id', clinicId)
      .eq('closing_date', previousDateStr)
      .maybeSingle()

    const starterBoxAmount = previousClosing?.cash_balance || 0

    // Calculate daily_box_amount from all CASH payments on the closing date
    const startDate = `${date}T00:00:00Z`
    const endDate = `${date}T23:59:59Z`

    const { data: cashPayments } = await supabase
      .from('payments')
      .select('amount, payment_method')
      .eq('clinic_id', clinicId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .or('payment_method.ilike.%cash%,payment_method.ilike.%efectivo%')

    const dailyBoxAmount =
      cashPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0

    return NextResponse.json({
      starterBoxAmount,
      dailyBoxAmount
    })
  } catch (error: any) {
    console.error('Error calculating totals:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

