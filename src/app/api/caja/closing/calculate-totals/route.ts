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

    // Use the date string directly (already in YYYY-MM-DD format)
    const closingDateStr = date

    console.log(`[Calculate Totals API] Processing date: ${date}`)

    // Find the most recent closing before the selected date
    const { data: previousClosing } = await supabase
      .from('daily_cash_closings')
      .select('cash_balance, closing_date')
      .eq('clinic_id', clinicId)
      .lt('closing_date', closingDateStr) // All closings before the selected date
      .order('closing_date', { ascending: false }) // Most recent first
      .limit(1)
      .maybeSingle()

    const starterBoxAmount = previousClosing?.cash_balance || 0
    console.log(`[Calculate Totals API] Previous closing: ${previousClosing?.closing_date || 'none'}, starter box: ${starterBoxAmount}`)

    // Calculate daily_box_amount from ALL payments on the closing date (not just cash)
    // Note: "Caja del día" should include all payment methods for the day
    const startDate = `${date}T00:00:00.000Z`
    const endDate = `${date}T23:59:59.999Z`

    console.log(`[Calculate Totals API] Fetching ALL payments for date: ${date}, range: ${startDate} to ${endDate}`)

    // Fetch ALL payments for the day (not just cash) - "Caja del día" means total collected
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, payment_method')
      .eq('clinic_id', clinicId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    console.log(`[Calculate Totals API] Found ${allPayments?.length || 0} payments, total: ${allPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0}`)

    const dailyBoxAmount =
      allPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0

    return NextResponse.json({
      starterBoxAmount,
      dailyBoxAmount
    })
  } catch (error: any) {
    console.error('Error calculating totals:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

