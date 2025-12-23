import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type CashMovement = {
  id: string // Unique identifier for React keys
  invoiceId: string
  day: string
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

    const startTime = `${startDateStr}T00:00:00Z`
    const endTime = `${endDateStr}T23:59:59Z`

    // Prefer DB-side movement RPC (fast). Fallback to legacy path if RPC not deployed yet.
    const movementsRpc = await supabase.rpc('get_caja_movements_in_time_range', {
      p_clinic_id: clinicId,
      p_start_time: startTime,
      p_end_time: endTime
    })

    const movements: CashMovement[] = []

    if (!movementsRpc.error && Array.isArray(movementsRpc.data)) {
      for (const row of movementsRpc.data as any[]) {
        const total = Number(row.total_amount || 0)
        const paid = Number(row.total_paid || 0)
        const outstandingAmount = Math.max(total - paid, 0)
        const collectionStatus: 'Cobrado' | 'Por cobrar' =
          outstandingAmount <= 0.009 ? 'Cobrado' : 'Por cobrar'

        const method = row.last_payment_method ? String(row.last_payment_method) : 'Pendiente'
        const paymentCategory = row.last_payment_method
          ? getPaymentCategory(String(row.last_payment_method))
          : 'Financiación'

        const patientName = `${row.patient_first_name || ''} ${row.patient_last_name || ''}`.trim()

        movements.push({
          id: `invoice-${row.invoice_id}`,
          invoiceId: String(row.invoice_id),
          day: String(row.day_madrid || startDateStr),
          time: String(row.time_madrid || '00:00'),
          patient: patientName || 'Paciente desconocido',
          concept: row.quote_number
            ? `Presupuesto ${row.quote_number}`
            : row.invoice_number || `Factura #${row.invoice_id}`,
          amount: `${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
          status: getInvoiceStatus(String(row.invoice_status || '')),
          collectionStatus,
          outstandingAmount,
          produced: isProduced(
            row.quote_signed_at ? String(row.quote_signed_at) : null,
            row.production_status ? String(row.production_status) : null,
            String(row.invoice_status || '')
          ),
          method,
          insurer: 'N/A',
          paymentCategory,
          quoteId: row.quote_id ? String(row.quote_id) : null,
          productionStatus: row.production_status ? String(row.production_status) : null,
          productionDate: row.production_date ? String(row.production_date) : null
        })
      }

      // Already sorted in RPC, but keep deterministic ordering if needed
      movements.sort((a, b) => {
        if (a.day !== b.day) return b.day.localeCompare(a.day)
        const timeA = a.time.split(':').map(Number)
        const timeB = b.time.split(':').map(Number)
        return timeB[0] * 60 + timeB[1] - (timeA[0] * 60 + timeA[1])
      })
    } else {
      // Legacy fallback (kept for compatibility)
      const { data: invoiceRows, error: invoiceRowsError } = await supabase.rpc(
        'get_invoices_in_time_range',
        {
          p_clinic_id: clinicId,
          p_start_time: startTime,
          p_end_time: endTime
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

      // NOTE: fixed missing `amount` selection for summing.
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('invoice_id, amount, payment_method, transaction_date')
        .eq('clinic_id', clinicId)
        .in('invoice_id', invoiceIds)
        .order('transaction_date', { ascending: false })

      if (paymentsError) {
        console.error('Error fetching invoice payments:', paymentsError)
      }

      const lastPaymentByInvoice = new Map<string, { method: string; transaction_date: string }>()
      const paymentSumByInvoice = new Map<string, number>()
      for (const p of payments || []) {
        const key = String((p as any).invoice_id)
        if (!lastPaymentByInvoice.has(key)) {
          lastPaymentByInvoice.set(key, {
            method: String((p as any).payment_method || ''),
            transaction_date: String((p as any).transaction_date || '')
          })
        }
        paymentSumByInvoice.set(
          key,
          (paymentSumByInvoice.get(key) || 0) + Number((p as any).amount || 0)
        )
      }

      for (const invoice of invoices as any[]) {
        const patient = invoice.patients as any
        const quote = invoice.quotes as any

        const issueTs = invoice.issue_timestamp ? new Date(invoice.issue_timestamp) : null
        const day = issueTs
          ? new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Europe/Madrid',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).format(issueTs)
          : startDateStr
        const time = issueTs
          ? new Intl.DateTimeFormat('es-ES', {
              timeZone: 'Europe/Madrid',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).format(issueTs)
          : '00:00'

        const lastPayment = lastPaymentByInvoice.get(String(invoice.id))
        const method = lastPayment?.method ? lastPayment.method : 'Pendiente'
        const paymentCategory = lastPayment?.method
          ? getPaymentCategory(lastPayment.method)
          : 'Financiación'

        const total = Number(invoice.total_amount || 0)
        const paid = paymentSumByInvoice.get(String(invoice.id)) || 0
        const outstandingAmount = Math.max(total - paid, 0)
        const collectionStatus: 'Cobrado' | 'Por cobrar' =
          outstandingAmount <= 0.009 ? 'Cobrado' : 'Por cobrar'

        movements.push({
          id: `invoice-${invoice.id}`,
          invoiceId: String(invoice.id),
          day,
          time,
          patient: patient
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
            : 'Paciente desconocido',
          concept: quote?.quote_number
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

      movements.sort((a, b) => {
        if (a.day !== b.day) return b.day.localeCompare(a.day)
        const timeA = a.time.split(':').map(Number)
        const timeB = b.time.split(':').map(Number)
        return timeB[0] * 60 + timeB[1] - (timeA[0] * 60 + timeA[1])
      })
    }

    return NextResponse.json({ movements })
  } catch (error: any) {
    console.error('Error in cash movements API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



