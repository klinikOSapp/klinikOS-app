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

    // Use SECURITY DEFINER RPC to avoid granting quote SELECT to clinical roles.
    const quoteIdNum = Number(quoteId)
    if (!Number.isFinite(quoteIdNum)) {
      return NextResponse.json({ error: 'Invalid quoteId' }, { status: 400 })
    }

    const rpc = await supabase.rpc('toggle_quote_production', {
      p_quote_id: quoteIdNum,
      p_production_status: productionStatus
    })

    if (rpc.error) {
      // normalize errors
      const msg = rpc.error.message || 'Unexpected error'
      if (msg.toLowerCase().includes('unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (msg.toLowerCase().includes('forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (msg.toLowerCase().includes('not found')) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      console.error('Error toggling production (rpc):', rpc.error)
      return NextResponse.json({ error: msg }, { status: 500 })
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





