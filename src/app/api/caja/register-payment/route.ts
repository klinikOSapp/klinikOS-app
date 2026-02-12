import { requireCajaPermission, resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Body = {
  invoiceId: string
  amount: number
  paymentMethod: string
  transactionDate?: string // ISO
  notes?: string | null
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clinicId = await resolveClinicIdForUser(supabase)
    if (!clinicId) return NextResponse.json({ error: 'No clinic' }, { status: 400 })

    // v2: register payment requires payments.create permission.
    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'payments',
      action: 'create'
    })
    if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await req.json()) as Partial<Body>
    const invoiceId = body.invoiceId ? String(body.invoiceId) : ''
    const paymentMethod = body.paymentMethod ? String(body.paymentMethod) : ''
    const amount = Number(body.amount)
    const transactionDate =
      body.transactionDate && String(body.transactionDate).trim()
        ? new Date(String(body.transactionDate)).toISOString()
        : new Date().toISOString()
    const notes = body.notes ? String(body.notes) : null

    if (!invoiceId || !paymentMethod || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Ensure invoice belongs to clinic.
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, clinic_id')
      .eq('id', invoiceId)
      .maybeSingle()

    if (invError) {
      console.error('[register-payment] invoice error', invError)
      return NextResponse.json({ error: invError.message }, { status: 500 })
    }
    if (!invoice || String((invoice as any).clinic_id) !== clinicId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await supabase.from('payments').insert({
      invoice_id: invoiceId,
      clinic_id: clinicId,
      staff_id: user.id,
      payment_method: paymentMethod,
      amount,
      transaction_date: transactionDate,
      notes
    })

    if (error) {
      console.error('[register-payment] insert error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error in register-payment API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

