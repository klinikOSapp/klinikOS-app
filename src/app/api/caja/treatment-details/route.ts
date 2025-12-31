import { requireCajaPermission } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const quoteId = searchParams.get('quoteId')

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quoteId' }, { status: 400 })
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, clinic_id, plan_id, quote_number, total_amount')
      .eq('id', quoteId)
      .maybeSingle()

    if (quoteError) {
      console.error('Error fetching quote:', quoteError)
      return NextResponse.json({ error: quoteError.message }, { status: 500 })
    }
    if (!quote || !quote.clinic_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const clinicId = String(quote.clinic_id)

    // Ensure user belongs to clinic
    const { data: clinics } = await supabase.rpc('get_my_clinics')
    const userClinics = new Set((clinics || []).map((c: any) => String(c)))
    if (!userClinics.has(clinicId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'cash',
      action: 'view'
    })
    if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const quoteIdNum = Number(quoteId)
    if (!Number.isFinite(quoteIdNum)) {
      return NextResponse.json({ error: 'Invalid quoteId' }, { status: 400 })
    }

    const rpc = await supabase.rpc('get_quote_items_for_cash', {
      p_quote_id: quoteIdNum
    })

    if (rpc.error) {
      const msg = rpc.error.message || 'Unexpected error'
      if (msg.toLowerCase().includes('unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (msg.toLowerCase().includes('forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (msg.toLowerCase().includes('not found')) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      console.error('Error fetching quote items (rpc):', rpc.error)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const rows = Array.isArray(rpc.data) ? (rpc.data as any[]) : []
    const first = rows[0] ?? null

    const items: Array<{
      label: string
      quantity?: number
      unitPrice?: number
      finalPrice?: number
      discountPercentage?: number
      serviceName?: string | null
      doctorName?: string | null
      source?: string
    }> = rows.map((r) => ({
      label: String(r.description || r.service_name || `Service #${r.service_id || ''}`),
      quantity: r.quantity != null ? Number(r.quantity) : 1,
      unitPrice: r.unit_price != null ? Number(r.unit_price) : undefined,
      finalPrice: r.final_price != null ? Number(r.final_price) : undefined,
      discountPercentage: r.discount_percentage != null ? Number(r.discount_percentage) : undefined,
      serviceName: r.service_name ?? null,
      doctorName: r.doctor_name ?? null,
      source: 'get_quote_items_for_cash'
    }))

    const title = quote.quote_number
      ? `Treatment details — ${quote.quote_number}`
      : 'Treatment details'

    return NextResponse.json({
      title,
      quote: {
        id: String(quote.id),
        quoteNumber: quote.quote_number,
        totalAmount: Number(quote.total_amount || 0)
      },
      doctor: first?.doctor_name ? { id: first.doctor_id ?? null, name: first.doctor_name } : null,
      items
    })
  } catch (error: any) {
    console.error('Error in treatment details API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

