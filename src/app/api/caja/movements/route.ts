import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type CashMovement = {
  id: string // Unique identifier for React keys
  invoiceId: string
  time: string
  patient: string
  concept: string
  amount: string
  status: 'Aceptado' | 'Enviado'
  collectionStatus: 'Cobrado' | 'Por cobrar'
  outstandingAmount: number
  produced: 'Hecho' | 'Pendiente'
  method: string
  insurer: string
  paymentCategory: 'Efectivo' | 'TPV' | 'Financiación'
  quoteId?: string | null
  productionStatus?: 'Done' | 'Pending' | null
  productionDate?: string | null
}

// Map payment_method to category
function getPaymentCategory(method: string): 'Efectivo' | 'TPV' | 'Financiación' {
  const methodLower = method.toLowerCase()
  if (methodLower.includes('efectivo') || methodLower.includes('cash')) {
    return 'Efectivo'
  }
  if (methodLower.includes('financi') || methodLower.includes('transferencia') || methodLower.includes('plazo')) {
    return 'Financiación'
  }
  return 'TPV'
}

// Map invoice status to UI status
function getInvoiceStatus(status: string): 'Aceptado' | 'Enviado' {
  return status === 'paid' || status === 'accepted' ? 'Aceptado' : 'Enviado'
}

// Check if quote is signed (produced)
function isProduced(
  quoteSignedAt: string | null,
  productionStatus: string | null | undefined,
  invoiceStatus: string
): 'Hecho' | 'Pendiente' {
  if (productionStatus === 'Done') {
    return 'Hecho'
  }
  if (quoteSignedAt || invoiceStatus === 'paid') {
    return 'Hecho'
  }
  return 'Pendiente'
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const timeScale = searchParams.get('timeScale') || 'day' // day, week, month

    // Get user's clinic
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's clinics
    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ movements: [] })
    }

    const clinicId = clinics[0] as string

    // Calculate date range based on timeScale
    // Treat `date` as a date-only anchor to avoid timezone drift.
    const startDate = new Date(`${date}T00:00:00Z`)
    const endDate = new Date(`${date}T00:00:00Z`)

    if (timeScale === 'week') {
      // Start of week (Monday)
      const day = startDate.getUTCDay() // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7
      startDate.setUTCDate(startDate.getUTCDate() - diffToMonday)
      // End of week (Sunday)
      endDate.setUTCDate(startDate.getUTCDate() + 6)
    } else if (timeScale === 'month') {
      startDate.setUTCDate(1)
      const lastDay = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0))
      endDate.setUTCDate(lastDay.getUTCDate())
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Real-time transaction table should show INVOICES (not payments).
    // Use the existing RPC to handle issue_timestamp / issue_date fallback.
    const { data: invoiceRows, error: invoiceRowsError } = await supabase.rpc(
      'get_invoices_in_time_range',
      {
        p_clinic_id: clinicId,
        p_start_time: `${startDateStr}T00:00:00Z`,
        p_end_time: `${endDateStr}T23:59:59Z`
      }
    )

    if (invoiceRowsError) {
      console.error('Error fetching invoices in time range:', invoiceRowsError)
      return NextResponse.json({ error: invoiceRowsError.message }, { status: 500 })
    }

    const invoiceIds = (invoiceRows || []).map((r: any) => r.id)
    if (invoiceIds.length === 0) {
      return NextResponse.json({ movements: [] })
    }

    // Fetch invoice details for UI fields (patient name, quote signed_at)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(
        `
        id,
        invoice_number,
        status,
        total_amount,
        amount_paid,
        issue_timestamp,
        quote_id,
        patient_id,
        patients (
          id,
          first_name,
          last_name
        ),
        quotes (
          id,
          quote_number,
          production_status,
          production_date,
          signed_at
        )
      `
      )
      .in('id', invoiceIds)

    if (invoicesError) {
      console.error('Error fetching invoice details:', invoicesError)
      return NextResponse.json({ error: invoicesError.message }, { status: 500 })
    }

    // Fetch payments for these invoices only to infer "Método" and filter category (but we DO NOT render payment rows).
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('invoice_id, payment_method, transaction_date')
      .eq('clinic_id', clinicId)
      .in('invoice_id', invoiceIds)
      .order('transaction_date', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching invoice payments:', paymentsError)
    }

    const lastPaymentByInvoice = new Map<string, { method: string; transaction_date: string }>()
    for (const p of payments || []) {
      const key = String((p as any).invoice_id)
      if (!lastPaymentByInvoice.has(key)) {
        lastPaymentByInvoice.set(key, {
          method: String((p as any).payment_method || ''),
          transaction_date: String((p as any).transaction_date || '')
        })
      }
    }

    // Transform invoices to cash movements (invoice rows only)
    const movements: CashMovement[] = []

    if (invoices) {
      for (const invoice of invoices as any[]) {
        const patient = invoice.patients as any
        const quote = invoice.quotes as any

        const issueTs = invoice.issue_timestamp
          ? new Date(invoice.issue_timestamp)
          : null
        const time = issueTs
          ? new Intl.DateTimeFormat('es-ES', {
              timeZone: 'Europe/Madrid',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).format(issueTs)
          : new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })

        const lastPayment = lastPaymentByInvoice.get(String(invoice.id))
        const method = lastPayment?.method ? lastPayment.method : 'Pendiente'
        const paymentCategory = lastPayment?.method
          ? getPaymentCategory(lastPayment.method)
          : 'Financiación'

        const total = Number(invoice.total_amount || 0)
        const paid = Number(invoice.amount_paid || 0)
        const outstandingAmount = Math.max(total - paid, 0)
        const collectionStatus: 'Cobrado' | 'Por cobrar' =
          outstandingAmount <= 0.009 ? 'Cobrado' : 'Por cobrar'

        movements.push({
          id: `invoice-${invoice.id}`, // Unique ID for React keys
          invoiceId: String(invoice.id),
          time,
          patient: patient
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
            : 'Paciente desconocido',
          concept:
            quote?.quote_number
              ? `Presupuesto ${quote.quote_number}`
              : invoice.invoice_number || `Factura #${invoice.id}`,
          amount: `${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
          status: getInvoiceStatus(invoice.status),
          collectionStatus,
          outstandingAmount,
          produced: isProduced(quote?.signed_at, quote?.production_status, invoice.status),
          method,
          insurer: 'N/A',
          paymentCategory,
          quoteId: invoice.quote_id ?? quote?.id ?? null,
          productionStatus: quote?.production_status ?? null,
          productionDate: quote?.production_date ?? null
        })
      }
    }

    // Sort by time (HH:mm)
    movements.sort((a, b) => {
      const timeA = a.time.split(':').map(Number)
      const timeB = b.time.split(':').map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
    })

    return NextResponse.json({ movements })
  } catch (error: any) {
    console.error('Error in cash movements API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

