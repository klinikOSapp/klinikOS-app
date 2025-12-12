import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type CashMovement = {
  id: string // Unique identifier for React keys
  time: string
  patient: string
  concept: string
  amount: string
  status: 'Aceptado' | 'Enviado'
  produced: 'Hecho' | 'Pendiente'
  method: string
  insurer: string
  paymentCategory: 'Efectivo' | 'TPV' | 'Financiación'
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
function isProduced(quoteSignedAt: string | null, invoiceStatus: string): 'Hecho' | 'Pendiente' {
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
    const startDate = new Date(date)
    const endDate = new Date(date)

    if (timeScale === 'week') {
      // Start of week (Monday)
      const day = startDate.getDay()
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
      startDate.setDate(diff)
      // End of week (Sunday)
      endDate.setDate(startDate.getDate() + 6)
    } else if (timeScale === 'month') {
      startDate.setDate(1)
      const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      endDate.setDate(lastDay.getDate())
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Fetch payments with related invoice and patient data
    const { data: payments, error } = await supabase
      .from('payments')
      .select(
        `
        id,
        amount,
        transaction_date,
        payment_method,
        invoice_id,
        invoices (
          id,
          invoice_number,
          status,
          total_amount,
          issue_date,
          quote_id,
          patient_id,
          patients (
            id,
            first_name,
            last_name
          ),
          quotes (
            id,
            signed_at
          )
        )
      `
      )
      .eq('clinic_id', clinicId)
      .gte('transaction_date', `${startDateStr}T00:00:00Z`)
      .lte('transaction_date', `${endDateStr}T23:59:59Z`)
      .order('transaction_date', { ascending: true })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also fetch invoices without payments (to show "Enviado" status)
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(
        `
        id,
        invoice_number,
        status,
        total_amount,
        issue_date,
        patient_id,
        patients (
          id,
          first_name,
          last_name
        ),
        quotes (
          id,
          signed_at
        )
      `
      )
      .eq('clinic_id', clinicId)
      .gte('issue_date', startDateStr)
      .lte('issue_date', endDateStr)
      .order('issue_date', { ascending: true })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    // Transform payments to cash movements
    const movements: CashMovement[] = []

    if (payments) {
      for (const payment of payments) {
        const invoice = payment.invoices as any
        if (!invoice) continue

        const patient = invoice.patients as any
        const quote = invoice.quotes as any

        const transactionDate = new Date(payment.transaction_date)
        const time = transactionDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })

        movements.push({
          id: `payment-${payment.id}-invoice-${invoice.id}`, // Unique ID for React keys
          time,
          patient: patient
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
            : 'Paciente desconocido',
          concept: invoice.invoice_number || `Factura #${invoice.id}`,
          amount: `${Number(payment.amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
          status: getInvoiceStatus(invoice.status),
          produced: isProduced(quote?.signed_at, invoice.status),
          method: payment.payment_method || 'No especificado',
          insurer: 'N/A', // TODO: Get from patient insurance if available
          paymentCategory: getPaymentCategory(payment.payment_method || '')
        })
      }
    }

    // Add invoices without payments as "Enviado" status
    if (invoices) {
      const paidInvoiceIds = new Set(payments?.map((p: any) => p.invoice_id) || [])
      for (const invoice of invoices) {
        if (paidInvoiceIds.has(invoice.id)) continue

        const patient = invoice.patients as any
        const quote = invoice.quotes as any

        const issueDate = new Date(invoice.issue_date)
        const time = issueDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })

        movements.push({
          id: `invoice-${invoice.id}-no-payment`, // Unique ID for React keys
          time,
          patient: patient
            ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
            : 'Paciente desconocido',
          concept: invoice.invoice_number || `Factura #${invoice.id}`,
          amount: `${Number(invoice.total_amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
          status: 'Enviado',
          produced: isProduced(quote?.signed_at, invoice.status),
          method: 'Pendiente',
          insurer: 'N/A',
          paymentCategory: 'Financiación'
        })
      }
    }

    // Sort by time
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
