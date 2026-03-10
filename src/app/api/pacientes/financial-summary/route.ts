import { resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type InvoiceRow = {
  id: number
  total_amount: number | null
  amount_paid: number | null
}

type AdvancePaymentRow = {
  id: number
  transaction_date: string | null
  amount: number | null
  payment_method: string | null
  concept: string | null
  notes: string | null
}

type AppliedCreditPaymentRow = {
  notes: string | null
}

const ADVANCE_APPLICATION_PREFIX = 'advance_application:'

function getAppliedCreditFromNotes(notes: string | null | undefined): number {
  const raw = String(notes || '').trim()
  if (!raw.startsWith(ADVANCE_APPLICATION_PREFIX)) return 0
  const payload = raw.slice(ADVANCE_APPLICATION_PREFIX.length)
  if (!payload) return 0
  try {
    const parsed = JSON.parse(payload) as
      | { applications?: Array<{ amount?: number }> }
      | { amount?: number }
    if (Array.isArray((parsed as any).applications)) {
      return (parsed as any).applications.reduce(
        (sum: number, row: any) => sum + Number(row?.amount || 0),
        0
      )
    }
    return Number((parsed as any).amount || 0)
  } catch {
    return 0
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const patientId = (searchParams.get('patientId') || '').trim()

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

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

    const [
      { data: invoices, error: invoicesError },
      { data: advancePayments, error: paymentsError },
      { data: appliedCreditPayments, error: appliedPaymentsError }
    ] =
      await Promise.all([
        supabase
          .from('invoices')
          .select('id, total_amount, amount_paid')
          .eq('clinic_id', clinicId)
          .eq('patient_id', patientId),
        supabase
          .from('payments')
          .select('id, transaction_date, amount, payment_method, concept, notes')
          .eq('clinic_id', clinicId)
          .eq('patient_id', patientId)
          .is('invoice_id', null)
          .is('voided_at', null)
          .gt('amount', 0)
          .order('transaction_date', { ascending: false }),
        supabase
          .from('payments')
          .select('notes')
          .eq('clinic_id', clinicId)
          .eq('patient_id', patientId)
          .not('invoice_id', 'is', null)
          .is('voided_at', null)
          .like('notes', `${ADVANCE_APPLICATION_PREFIX}%`)
      ])

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 })
    }
    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }
    if (appliedPaymentsError) {
      return NextResponse.json({ error: appliedPaymentsError.message }, { status: 500 })
    }

    const typedInvoices = (invoices || []) as InvoiceRow[]
    const openInvoicesTotal = typedInvoices.reduce((sum, row) => {
      const total = Number(row.total_amount || 0)
      const paid = Number(row.amount_paid || 0)
      return sum + Math.max(total - paid, 0)
    }, 0)

    const typedAdvances = (advancePayments || []) as AdvancePaymentRow[]
    const totalCreditFromAdvances = typedAdvances.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    )
    const typedAppliedCredits = (appliedCreditPayments || []) as AppliedCreditPaymentRow[]
    const appliedCreditTotal = typedAppliedCredits.reduce(
      (sum, row) => sum + getAppliedCreditFromNotes(row.notes),
      0
    )
    const availableCredit = Math.max(totalCreditFromAdvances - appliedCreditTotal, 0)
    const netPendingTotal = openInvoicesTotal - availableCredit

    return NextResponse.json({
      openInvoicesTotal,
      availableCredit,
      netPendingTotal,
      advancePayments: typedAdvances.map((row) => ({
        id: row.id,
        transactionDate: row.transaction_date,
        amount: Number(row.amount || 0),
        paymentMethod: row.payment_method || '',
        concept: row.concept || '',
        notes: row.notes || ''
      }))
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
