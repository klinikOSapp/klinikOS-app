import { requireCajaPermission } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Body = {
  paymentId: string
  paymentMethod: string
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as Partial<Body>
    const paymentId = body.paymentId ? String(body.paymentId) : ''
    const paymentMethod = body.paymentMethod ? String(body.paymentMethod) : ''

    if (!paymentId || !paymentMethod) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('id, clinic_id')
      .eq('id', paymentId)
      .maybeSingle()

    if (payErr) {
      console.error('Error fetching payment:', payErr)
      return NextResponse.json({ error: payErr.message }, { status: 500 })
    }
    if (!payment?.clinic_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const clinicId = String(payment.clinic_id)

    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'payments',
      action: 'edit'
    })
    if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error: updErr } = await supabase
      .from('payments')
      .update({ payment_method: paymentMethod })
      .eq('id', paymentId)

    if (updErr) {
      console.error('Error updating payment method:', updErr)
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

