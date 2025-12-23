import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ closing: null })
    }

    const clinicId = clinics[0] as string

    // Get existing closing for the date
    const { data: closing, error } = await supabase
      .from('daily_cash_closings')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('closing_date', date)
      .maybeSingle()

    if (error) {
      console.error('Error fetching cash closing:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ closing })
  } catch (error: any) {
    console.error('Error in cash closing GET API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await req.json()
    const {
      date,
      staffId,
      // Step 1: Cash totals
      starterBoxAmount,
      dailyBoxAmount,
      cashWithdrawals,
      cashBalance,
      // Step 2: Reconciliation (payment method breakdown)
      paymentMethodBreakdown,
      // Step 3: Reconciliation discrepancies (for audit/review)
      reconciliationDiscrepancies,
      // Legacy fields (for backward compatibility)
      expectedCash,
      actualCash,
      cardTotal,
      financedTotal,
      notes
    }: {
      date: string
      staffId?: string
      // New 3-step workflow fields
      starterBoxAmount?: number
      dailyBoxAmount?: number
      cashWithdrawals?: number
      cashBalance?: number
      paymentMethodBreakdown?: Record<string, number>
      reconciliationDiscrepancies?: Record<string, { expected: number; actual: number; difference: number }>
      // Legacy fields
      expectedCash?: number
      actualCash?: number
      cardTotal?: number
      financedTotal?: number
      notes?: string
    } = body

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

    // Calculate discrepancy (if legacy fields provided)
    const discrepancy = expectedCash !== undefined && actualCash !== undefined 
      ? Number(actualCash) - Number(expectedCash) 
      : null

    // Calculate cash balance if not provided (starter + daily - withdrawals)
    const calculatedCashBalance = cashBalance !== undefined 
      ? cashBalance 
      : (starterBoxAmount !== undefined && dailyBoxAmount !== undefined && cashWithdrawals !== undefined)
        ? Number(starterBoxAmount) + Number(dailyBoxAmount) - Number(cashWithdrawals)
        : null

    // Check if closing already exists
    const { data: existing } = await supabase
      .from('daily_cash_closings')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('closing_date', date)
      .maybeSingle()

    const updateData: any = {
      notes: notes || null
    }

    // Add new 3-step workflow fields if provided
    if (starterBoxAmount !== undefined) updateData.starter_box_amount = starterBoxAmount
    if (dailyBoxAmount !== undefined) updateData.daily_box_amount = dailyBoxAmount
    if (cashWithdrawals !== undefined) updateData.cash_withdrawals = cashWithdrawals
    if (calculatedCashBalance !== null) updateData.cash_balance = calculatedCashBalance
    if (paymentMethodBreakdown) updateData.payment_method_breakdown = paymentMethodBreakdown
    if (reconciliationDiscrepancies) updateData.reconciliation_discrepancies = reconciliationDiscrepancies

    // Add legacy fields if provided (for backward compatibility)
    if (expectedCash !== undefined) updateData.expected_cash = expectedCash
    if (actualCash !== undefined) updateData.actual_cash = actualCash
    if (cardTotal !== undefined) updateData.card_total = cardTotal
    if (financedTotal !== undefined) updateData.financed_total = financedTotal
    if (discrepancy !== null) updateData.discrepancy = discrepancy

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('daily_cash_closings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ closing: data })
    } else {
      // Create new
      const { data, error } = await supabase
        .from('daily_cash_closings')
        .insert({
          clinic_id: clinicId,
          closing_date: date,
          staff_id: staffId || user.id, // Use selected staff or current user
          ...updateData
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ closing: data })
    }
  } catch (error: any) {
    console.error('Error in cash closing POST API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



