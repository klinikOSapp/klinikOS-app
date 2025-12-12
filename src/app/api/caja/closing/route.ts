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
      expectedCash,
      actualCash,
      cardTotal,
      financedTotal,
      notes
    }: {
      date: string
      expectedCash: number
      actualCash: number
      cardTotal: number
      financedTotal: number
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

    // Calculate discrepancy
    const discrepancy = Number(actualCash) - Number(expectedCash)

    // Check if closing already exists
    const { data: existing } = await supabase
      .from('daily_cash_closings')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('closing_date', date)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('daily_cash_closings')
        .update({
          expected_cash: expectedCash,
          actual_cash: actualCash,
          card_total: cardTotal,
          financed_total: financedTotal,
          discrepancy: discrepancy,
          notes: notes || null
        })
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
          staff_id: user.id,
          expected_cash: expectedCash,
          actual_cash: actualCash,
          card_total: cardTotal,
          financed_total: financedTotal,
          discrepancy: discrepancy,
          notes: notes || null
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
