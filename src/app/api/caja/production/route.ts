import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Body = {
  quoteId: string
  productionStatus: 'Done' | 'Pending'
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as Partial<Body>
    const quoteId = body.quoteId
    const productionStatus = body.productionStatus

    if (!quoteId || (productionStatus !== 'Done' && productionStatus !== 'Pending')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const productionDate =
      productionStatus === 'Done' ? new Date().toISOString() : null

    const { error } = await supabase
      .from('quotes')
      .update({
        production_status: productionStatus,
        production_date: productionDate
      })
      .eq('id', quoteId)

    if (error) {
      console.error('Error updating production status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      quoteId,
      productionStatus,
      productionDate
    })
  } catch (error: any) {
    console.error('Error in production API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



