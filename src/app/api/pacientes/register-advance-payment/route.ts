import { requireCajaPermission, resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Body = {
  patientId: string
  amount: number
  paymentMethod: string
  transactionDate?: string
  concept: string
  transactionId?: string | null
  notes?: string | null
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

    const clinicId = await resolveClinicIdForUser(supabase)
    if (!clinicId) {
      return NextResponse.json({ error: 'No clinic' }, { status: 400 })
    }

    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'payments',
      action: 'create'
    })
    if (!perm.ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as Partial<Body>
    const patientId = body.patientId ? String(body.patientId).trim() : ''
    const paymentMethod = body.paymentMethod ? String(body.paymentMethod).trim() : ''
    const concept = body.concept ? String(body.concept).trim() : ''
    const amount = Number(body.amount)
    const transactionDate =
      body.transactionDate && String(body.transactionDate).trim()
        ? new Date(String(body.transactionDate)).toISOString()
        : new Date().toISOString()
    const transactionId =
      body.transactionId && String(body.transactionId).trim()
        ? String(body.transactionId).trim()
        : null
    const notes =
      body.notes && String(body.notes).trim() ? String(body.notes).trim() : null

    if (!patientId || !paymentMethod || !concept || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data: patientRow, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('clinic_id', clinicId)
      .maybeSingle()

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500 })
    }
    if (!patientRow) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const { error: insertError } = await supabase.from('payments').insert({
      clinic_id: clinicId,
      patient_id: patientId,
      staff_id: user.id,
      invoice_id: null,
      payment_method: paymentMethod,
      amount,
      transaction_date: transactionDate,
      transaction_id: transactionId,
      concept,
      notes
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
