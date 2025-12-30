import { requireCajaPermission } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Body = {
  quoteId: string
  productionStatus: 'Done' | 'Pending'
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

    const body = (await req.json()) as Partial<Body>
    const quoteId = body.quoteId
    const productionStatus = body.productionStatus

    if (!quoteId || (productionStatus !== 'Done' && productionStatus !== 'Pending')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const productionDate =
      productionStatus === 'Done' ? new Date().toISOString() : null

    // Ensure quote belongs to my clinic.
    const { data: quoteRow, error: quoteError } = await supabase
      .from('quotes')
      .select('id, clinic_id')
      .eq('id', quoteId)
      .maybeSingle()

    if (quoteError) {
      console.error('Error fetching quote:', quoteError)
      return NextResponse.json({ error: quoteError.message }, { status: 500 })
    }

    const clinicId = quoteRow?.clinic_id ? String((quoteRow as any).clinic_id) : null
    if (!quoteRow || !clinicId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ error: 'No clinic' }, { status: 400 })
    }
    const userClinics = new Set(clinics.map((c: any) => String(c)))
    if (!userClinics.has(clinicId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Spec (caja-module-2-updated.md): doctor marks "Producido" when treatment completed.
    // We also allow gerencia via cash.edit as an administrative override.
    const canClinical = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'clinical_notes',
      action: 'edit'
    })
    const canAdmin = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'cash',
      action: 'edit'
    })
    if (!canClinical.ok && !canAdmin.ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('quotes')
      .update({
        production_status: productionStatus,
        production_date: productionDate
      })
      .eq('id', quoteId)

    if (error) {
      console.error('Error updating production status:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      quoteId,
      productionStatus,
      productionDate
    })
  } catch (error: any) {
    console.error('Error in production API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}





