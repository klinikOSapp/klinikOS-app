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

    // Fetch staff members using RPC function (bypasses RLS, same as appointment_hold)
    const { data: staffData, error } = await supabase.rpc('get_clinic_staff', { clinic: clinicId })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // RPC returns array of { id, full_name } directly
    const staff = (staffData || []).map((s: { id: string; full_name: string }) => ({
      id: s.id,
      name: s.full_name || s.id,
      email: '' // RPC doesn't return email, but we don't need it for display
    }))

    console.log(`[Staff API] Found ${staff.length} staff members for clinic ${clinicId}`)
    
    return NextResponse.json({ staff })
  } catch (error: any) {
    console.error('Error in staff API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

