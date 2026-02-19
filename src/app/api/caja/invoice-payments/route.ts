import { requireCajaPermission, resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function normalizePaymentMethodLabel(value: string | null): string {
  const raw = String(value || '').trim()
  const method = raw.toLowerCase()
  if (!method) return '-'
  if (method.includes('efectivo') || method.includes('cash')) return 'Efectivo'
  if (
    method.includes('tpv') ||
    method.includes('tarjeta') ||
    method.includes('card')
  )
    return 'TPV'
  if (
    method.includes('transferencia') ||
    method.includes('transfer') ||
    method.includes('bank')
  )
    return 'Transferencia'
  if (method.includes('financi') || method.includes('financing')) return 'Financiación'
  return raw
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
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

    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'cash',
      action: 'view'
    })
    if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select(
        'id, total_amount, amount_paid, invoice_number, clinic_id, issue_timestamp, patient_id'
      )
      .eq('id', invoiceId)
      .maybeSingle()

    if (invError) {
      console.error('Error fetching invoice:', invError)
      return NextResponse.json({ error: invError.message }, { status: 500 })
    }
    if (!invoice || invoice.clinic_id !== clinicId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('id, amount, transaction_date, payment_method, transaction_id, staff_id')
      .eq('clinic_id', clinicId)
      .eq('invoice_id', invoiceId)
      .order('transaction_date', { ascending: false })

    if (payError) {
      console.error('Error fetching payments:', payError)
      return NextResponse.json({ error: payError.message }, { status: 500 })
    }

    let patientName = '-'
    let patientNif = '-'
    let insurer = '-'
    const patientId = (invoice as any).patient_id
    if (patientId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name, national_id')
        .eq('clinic_id', clinicId)
        .eq('id', patientId)
        .maybeSingle()
      if (patient) {
        const fullName = `${String((patient as any).first_name || '').trim()} ${String(
          (patient as any).last_name || ''
        ).trim()}`.trim()
        if (fullName) patientName = fullName
        patientNif = String((patient as any).national_id || '-')
      }

      const { data: patientInsurance } = await supabase
        .from('patient_insurances')
        .select('provider, is_primary, created_at')
        .eq('patient_id', patientId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (patientInsurance?.provider) {
        insurer = String(patientInsurance.provider)
      }
    }

    let professional = '-'
    const latestStaffId = String((payments?.[0] as any)?.staff_id || '').trim()
    if (latestStaffId) {
      const { data: staffRow } = await supabase
        .from('staff')
        .select('full_name')
        .eq('id', latestStaffId)
        .maybeSingle()
      if (staffRow?.full_name) {
        professional = String(staffRow.full_name)
      }
    }

    const total = Number(invoice.total_amount || 0)
    // Compute collected from payments table (source of truth)
    const collectedFromPayments = (payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    )
    const outstanding = Math.max(total - collectedFromPayments, 0)

    return NextResponse.json({
      invoice: {
        id: String(invoice.id),
        invoiceNumber: invoice.invoice_number,
        totalAmount: total,
        amountPaid: collectedFromPayments,
        outstandingAmount: outstanding,
        issueDate: (invoice as any).issue_timestamp || null,
        patientName,
        patientNif,
        insurer,
        professional
      },
      payments: (payments || []).map((p: any) => ({
        id: String(p.id),
        amount: Number(p.amount || 0),
        transactionDate: p.transaction_date,
        paymentMethod: normalizePaymentMethodLabel(p.payment_method),
        paymentReference: p.transaction_id || null
      }))
    })
  } catch (error: any) {
    console.error('Error in invoice payments API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



