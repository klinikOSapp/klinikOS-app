import { requireCajaPermission, resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Body = {
  invoiceId: string
  amount: number
  paymentMethod: string
  transactionDate?: string // ISO
  transactionId?: string | null
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
    const transactionId =
      body.transactionId && String(body.transactionId).trim()
        ? String(body.transactionId).trim()
        : null
    const notes = body.notes ? String(body.notes) : null

    if (!invoiceId || !paymentMethod || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Ensure invoice belongs to clinic.
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, clinic_id, total_amount, patient_id')
      .eq('id', invoiceId)
      .maybeSingle()

    if (invError) {
      console.error('[register-payment] invoice error', invError)
      return NextResponse.json({ error: invError.message }, { status: 500 })
    }
    if (!invoice || String((invoice as any).clinic_id) !== clinicId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('clinic_id', clinicId)
      .eq('invoice_id', invoiceId)

    if (paymentsError) {
      console.error('[register-payment] payments lookup error', paymentsError)
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }

    const alreadyPaid = (existingPayments || []).reduce(
      (sum: number, row: any) => sum + Number(row.amount || 0),
      0
    )
    const invoiceTotal = Number((invoice as any).total_amount || 0)
    const outstanding = Math.max(invoiceTotal - alreadyPaid, 0)
    if (amount - outstanding > 0.009) {
      return NextResponse.json(
        {
          error: `El pago (${amount.toFixed(2)} €) supera el pendiente (${outstanding.toFixed(2)} €)`
        },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('payments').insert({
      invoice_id: invoiceId,
      clinic_id: clinicId,
      staff_id: user.id,
      payment_method: paymentMethod,
      amount,
      transaction_date: transactionDate,
      transaction_id: transactionId,
      patient_id: (invoice as any).patient_id || null,
      notes
    })

    if (error) {
      console.error('[register-payment] insert error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const newAmountPaid = alreadyPaid + amount
    const nextStatus = newAmountPaid + 0.009 >= invoiceTotal ? 'paid' : 'open'
    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: newAmountPaid,
        status: nextStatus
      })
      .eq('id', invoiceId)
      .eq('clinic_id', clinicId)

    if (invoiceUpdateError) {
      console.error('[register-payment] invoice update error', invoiceUpdateError)
      return NextResponse.json({ error: invoiceUpdateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error in register-payment API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
