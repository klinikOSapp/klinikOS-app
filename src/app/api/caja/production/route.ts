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

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ error: 'No clinic' }, { status: 400 })
    }
    const clinicId = clinics[0] as string

    // Spec (caja-module-2-updated.md): doctor marks "Producido" when treatment completed.
    // We tie this to clinical_notes.edit (doctor/higienista default permissions) instead of role names.
    const perm = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'clinical_notes',
      action: 'edit'
    })
    if (!perm.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
    if (!quoteRow || String((quoteRow as any).clinic_id) !== clinicId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
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




