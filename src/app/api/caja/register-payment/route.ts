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
  appliedCreditAmount?: number
}

type AdvanceSourceRow = {
  id: number
  amount: number | null
  transaction_date: string | null
}
type PaymentWithNotesRow = {
  id: number
  amount: number | null
  notes: string | null
}

const ADVANCE_APPLICATION_PREFIX = 'advance_application:'

type AdvanceApplication = {
  advancePaymentId: number
  amount: number
}

function parseAdvanceApplications(notes: string | null | undefined): AdvanceApplication[] {
  const raw = String(notes || '').trim()
  if (!raw.startsWith(ADVANCE_APPLICATION_PREFIX)) return []
  const payload = raw.slice(ADVANCE_APPLICATION_PREFIX.length)
  if (!payload) return []

  try {
    const parsed = JSON.parse(payload) as
      | { applications?: Array<{ advancePaymentId?: number; amount?: number }> }
      | { advancePaymentId?: number; amount?: number }
    if (Array.isArray((parsed as any).applications)) {
      return (parsed as any).applications
        .map((row: any) => ({
          advancePaymentId: Number(row?.advancePaymentId),
          amount: Number(row?.amount)
        }))
        .filter(
          (row: AdvanceApplication) =>
            Number.isFinite(row.advancePaymentId) &&
            Number.isFinite(row.amount) &&
            row.amount > 0
        )
    }
    const singleId = Number((parsed as any).advancePaymentId)
    const singleAmount = Number((parsed as any).amount)
    if (Number.isFinite(singleId) && Number.isFinite(singleAmount) && singleAmount > 0) {
      return [{ advancePaymentId: singleId, amount: singleAmount }]
    }
  } catch {
    return []
  }

  return []
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
    const appliedCreditAmount = Math.max(0, Number(body.appliedCreditAmount || 0))
    const transactionDate =
      body.transactionDate && String(body.transactionDate).trim()
        ? new Date(String(body.transactionDate)).toISOString()
        : new Date().toISOString()
    const transactionId =
      body.transactionId && String(body.transactionId).trim()
        ? String(body.transactionId).trim()
        : null
    const notes = body.notes ? String(body.notes) : null

    if (
      !invoiceId ||
      !paymentMethod ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(appliedCreditAmount)
    ) {
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
      .is('voided_at', null)

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

    if (appliedCreditAmount - amount > 0.009) {
      return NextResponse.json(
        { error: 'El credito aplicado no puede superar el importe del pago' },
        { status: 400 }
      )
    }

    let appliedCredit = 0
    if (appliedCreditAmount > 0) {
      const patientId = String((invoice as any).patient_id || '')
      if (!patientId) {
        return NextResponse.json(
          { error: 'No se puede aplicar credito sin paciente vinculado' },
          { status: 400 }
        )
      }

      const { data: advanceRows, error: advancesError } = await supabase
        .from('payments')
        .select('id, amount, transaction_date')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .is('invoice_id', null)
        .is('voided_at', null)
        .order('transaction_date', { ascending: true })

      if (advancesError) {
        return NextResponse.json({ error: advancesError.message }, { status: 500 })
      }

      const { data: appliedRows, error: appliedRowsError } = await supabase
        .from('payments')
        .select('id, amount, notes')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .not('invoice_id', 'is', null)
        .is('voided_at', null)
        .like('notes', `${ADVANCE_APPLICATION_PREFIX}%`)

      if (appliedRowsError) {
        return NextResponse.json({ error: appliedRowsError.message }, { status: 500 })
      }

      const typedAdvances = (advanceRows || []) as AdvanceSourceRow[]
      const typedAppliedRows = (appliedRows || []) as PaymentWithNotesRow[]
      const usedByAdvanceId = new Map<number, number>()
      for (const row of typedAppliedRows) {
        const apps = parseAdvanceApplications(row.notes)
        for (const app of apps) {
          usedByAdvanceId.set(
            app.advancePaymentId,
            (usedByAdvanceId.get(app.advancePaymentId) || 0) + app.amount
          )
        }
      }

      let remainingToAllocate = appliedCreditAmount
      const allocations: AdvanceApplication[] = []
      for (const advance of typedAdvances) {
        if (remainingToAllocate <= 0.0001) break
        const sourceAmount = Number(advance.amount || 0)
        const usedAmount = usedByAdvanceId.get(advance.id) || 0
        const sourceRemaining = Math.max(sourceAmount - usedAmount, 0)
        if (sourceRemaining <= 0.0001) continue
        const take = Math.min(sourceRemaining, remainingToAllocate)
        allocations.push({
          advancePaymentId: advance.id,
          amount: Number(take.toFixed(2))
        })
        remainingToAllocate -= take
      }

      if (remainingToAllocate > 0.009) {
        return NextResponse.json(
          { error: 'No hay credito disponible suficiente para aplicar ese importe' },
          { status: 400 }
        )
      }

      appliedCredit = Number(appliedCreditAmount.toFixed(2))
      const applicationNotes = `${ADVANCE_APPLICATION_PREFIX}${JSON.stringify({
        applications: allocations
      })}`
      const { error: creditInsertError } = await supabase.from('payments').insert({
        invoice_id: invoiceId,
        clinic_id: clinicId,
        staff_id: user.id,
        payment_method: 'credito_paciente',
        amount: appliedCredit,
        transaction_date: transactionDate,
        transaction_id: null,
        patient_id: patientId,
        notes: applicationNotes
      })
      if (creditInsertError) {
        return NextResponse.json({ error: creditInsertError.message }, { status: 500 })
      }
    }

    const cashAmount = Number((amount - appliedCredit).toFixed(2))
    if (cashAmount > 0.009) {
      const { error } = await supabase.from('payments').insert({
        invoice_id: invoiceId,
        clinic_id: clinicId,
        staff_id: user.id,
        payment_method: paymentMethod,
        amount: cashAmount,
        transaction_date: transactionDate,
        transaction_id: transactionId,
        patient_id: (invoice as any).patient_id || null,
        notes
      })
      if (error) {
        console.error('[register-payment] insert error', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    const newAmountPaid = alreadyPaid + appliedCredit + Math.max(cashAmount, 0)
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

    return NextResponse.json({
      ok: true,
      appliedCreditAmount: appliedCredit,
      cashAmount: Math.max(cashAmount, 0)
    })
  } catch (error: any) {
    console.error('Error in register-payment API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
