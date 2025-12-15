import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type DailyMovement = {
  time: string
  patient: string
  concept: string
  amount: string
  method: string
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get user's clinic
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ movements: [] })
    }

    const clinicId = clinics[0] as string

    // Get all payments for the day
    const startDate = `${date}T00:00:00Z`
    const endDate = `${date}T23:59:59Z`

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(
        `
        id,
        amount,
        transaction_date,
        payment_method,
        invoice_id,
        invoices!inner(
          id,
          total_amount,
          invoice_number,
          patient_id,
          patients!inner(
            first_name,
            last_name
          ),
          quote_id,
          quotes(
            id,
            quote_number
          )
        )
      `
      )
      .eq('clinic_id', clinicId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }

    // Transform to daily movements format
    const movements: DailyMovement[] =
      payments?.map((payment: any) => {
        const invoice = payment.invoices
        const patient = invoice?.patients
        const quote = invoice?.quotes

        // Format time (HH:MM)
        const transactionDate = new Date(payment.transaction_date)
        const time = transactionDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })

        // Format patient name
        const patientName = patient
          ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
          : 'Paciente desconocido'

        // Format concept (use quote number or invoice number)
        const concept = quote?.quote_number
          ? `Presupuesto ${quote.quote_number}`
          : invoice?.invoice_number
            ? `Factura ${invoice.invoice_number}`
            : 'Servicio'

        // Format amount
        const amount = Number(payment.amount || 0).toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })

        // Format payment method (translate to Spanish if needed)
        const methodMap: Record<string, string> = {
          Efectivo: 'Efectivo',
          Cash: 'Efectivo',
          TPV: 'TPV',
          'Credit card': 'Tarjeta de crédito',
          'Debit card': 'Tarjeta de débito',
          'Bank transfer': 'Transferencia bancaria',
          Transferencia: 'Transferencia bancaria',
          Cheque: 'Cheque',
          Check: 'Cheque',
          Financiado: 'Financiado',
          Financed: 'Financiado',
          'Digital wallet': 'Billetera digital',
          Cryptocurrencies: 'Criptomonedas',
          'Payment in installments': 'Pago a plazos'
        }

        const method = methodMap[payment.payment_method] || payment.payment_method || 'Desconocido'

        return {
          time,
          patient: patientName,
          concept,
          amount: `${amount} €`,
          method
        }
      }) || []

    return NextResponse.json({ movements })
  } catch (error: any) {
    console.error('Error in daily movements API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

