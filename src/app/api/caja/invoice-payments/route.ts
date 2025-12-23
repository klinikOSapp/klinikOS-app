import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ error: 'No clinic' }, { status: 400 })
    }
    const clinicId = clinics[0] as string

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, total_amount, amount_paid, invoice_number, clinic_id')
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
      .select('id, amount, transaction_date, payment_method')
      .eq('clinic_id', clinicId)
      .eq('invoice_id', invoiceId)
      .order('transaction_date', { ascending: false })

    if (payError) {
      console.error('Error fetching payments:', payError)
      return NextResponse.json({ error: payError.message }, { status: 500 })
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
        outstandingAmount: outstanding
      },
      payments: (payments || []).map((p: any) => ({
        id: String(p.id),
        amount: Number(p.amount || 0),
        transactionDate: p.transaction_date,
        paymentMethod: p.payment_method
      }))
    })
  } catch (error: any) {
    console.error('Error in invoice payments API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



