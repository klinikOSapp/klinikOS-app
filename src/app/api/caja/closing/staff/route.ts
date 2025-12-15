import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
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
      return NextResponse.json({ staff: [] })
    }

    const clinicId = clinics[0] as string

    // Fetch staff members for the clinic
    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, first_name, last_name, email')
      .eq('clinic_id', clinicId)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      staff: staff?.map((s) => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
        email: s.email
      })) || []
    })
  } catch (error: any) {
    console.error('Error in staff API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

