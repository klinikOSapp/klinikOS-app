import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type PaymentMethodBreakdown = {
  cash: number
  card: number
  transfer: number
  check: number // v2 nomenclature: "Financiación" (kept as `check` key for backward compatibility)
}

function getPaymentCategory(method: string): keyof PaymentMethodBreakdown {
  const methodLower = method.toLowerCase().trim()
  if (methodLower.includes('efectivo') || methodLower.includes('cash')) return 'cash'
  if (
    methodLower.includes('tpv') ||
    methodLower.includes('tarjeta') ||
    methodLower.includes('card') ||
    methodLower.includes('crédito') ||
    methodLower.includes('débito') ||
    methodLower.includes('credit') ||
    methodLower.includes('debit') ||
    methodLower.includes('billetera') ||
    methodLower.includes('wallet') ||
    methodLower.includes('digital')
  )
    return 'card'
  if (
    methodLower.includes('transferencia') ||
    methodLower.includes('transfer') ||
    methodLower.includes('bancaria') ||
    methodLower.includes('bank') ||
    methodLower.includes('cripto') ||
    methodLower.includes('crypto')
  )
    return 'transfer'
  if (
    methodLower.includes('financi') ||
    methodLower.includes('plazo') ||
    methodLower.includes('installment') ||
    methodLower.includes('financed') ||
    methodLower.includes('cheque') ||
    methodLower.includes('check')
  )
    return 'check'
  // default: most common bucket is card/TPV
  return 'card'
}

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

    // v2: Step 2A needs total + breakdown by payment method.
    // v2: Step 2B "Caja del día" is CASH (efectivo) expected value (readonly).
    const startDate = `${date}T00:00:00.000Z`
    const endDate = `${date}T23:59:59.999Z`

    console.log(`[Calculate Totals API] Fetching ALL payments for date: ${date}, range: ${startDate} to ${endDate}`)

    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, payment_method')
      .eq('clinic_id', clinicId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    const expectedBreakdown: PaymentMethodBreakdown = {
      cash: 0,
      card: 0,
      transfer: 0,
      check: 0
    }

    for (const p of allPayments || []) {
      const amount = Number((p as any).amount || 0)
      const method = String((p as any).payment_method || '')
      expectedBreakdown[getPaymentCategory(method)] += amount
    }

    const totalDayAmount =
      expectedBreakdown.cash +
      expectedBreakdown.card +
      expectedBreakdown.transfer +
      expectedBreakdown.check

    const dailyBoxAmount = expectedBreakdown.cash

    console.log(
      `[Calculate Totals API] Found ${allPayments?.length || 0} payments, total: ${totalDayAmount}, cash: ${dailyBoxAmount}`
    )

    return NextResponse.json({
      starterBoxAmount,
      dailyBoxAmount, // cash expected (Caja del día)
      totalDayAmount,
      expectedBreakdown
    })
  } catch (error: any) {
    console.error('Error calculating totals:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



