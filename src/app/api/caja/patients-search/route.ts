import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) return NextResponse.json({ patients: [] })
    const clinicId = clinics[0] as string

    if (q.length < 2) return NextResponse.json({ patients: [] })

    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('clinic_id', clinicId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .order('last_name', { ascending: true, nullsFirst: false })
      .limit(10)

    if (error) {
      console.error('[patients-search] error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const patients =
      (data || []).map((p: any) => ({
        id: String(p.id),
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim()
      })) || []

    return NextResponse.json({ patients })
  } catch (error: any) {
    console.error('Error in patients-search API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

