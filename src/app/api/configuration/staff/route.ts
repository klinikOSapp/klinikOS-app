import { resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type CreatePayload = {
  full_name: string
  specialties?: string[]
  phone?: string | null
  email?: string | null
  calendar_color?: string | null
  commission_percentage?: number | null
  is_active?: boolean
  avatar_url?: string | null
  role?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreatePayload
    const supabase = await createSupabaseServerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = await resolveClinicIdForUser(supabase)
    if (!clinicId) {
      return NextResponse.json(
        { error: 'Could not resolve clinic' },
        { status: 400 }
      )
    }

    // Build insert payload
    const staffPayload: Record<string, unknown> = {
      full_name: body.full_name || 'Profesional',
      specialties: body.specialties || [],
      phone: body.phone || null,
      email: body.email || null,
      calendar_color: body.calendar_color || '#51d6c7',
      commission_percentage: body.commission_percentage ?? null,
      is_active: body.is_active ?? true,
      avatar_url: body.avatar_url || null
    }

    // Must use service_role to bypass RLS (INSERT policy requires auth.uid() = id)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        'POST /api/configuration/staff: missing SUPABASE_SERVICE_ROLE_KEY env var'
      )
      return NextResponse.json(
        { error: 'Server configuration error: service role not available' },
        { status: 500 }
      )
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const staffSelect =
      'id, full_name, specialties, phone, email, calendar_color, commission_percentage, is_active, avatar_url'

    const { data: insertedStaff, error: staffError } = await adminClient
      .from('staff')
      .insert(staffPayload)
      .select(staffSelect)
      .single()

    if (staffError || !insertedStaff) {
      console.error('Staff insert failed', staffError)
      return NextResponse.json(
        {
          error: staffError?.message || 'Failed to create staff',
          code: staffError?.code || null
        },
        { status: 400 }
      )
    }

    // Associate with clinic via staff_clinics
    const staffRole = body.role || 'doctor'

    // Look up role_id
    const { data: roleRow } = await adminClient
      .from('roles')
      .select('id')
      .or(
        `and(clinic_id.eq.${clinicId},name.eq.${staffRole}),name.eq.${staffRole}`
      )
      .order('clinic_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error: relationError } = await adminClient
      .from('staff_clinics')
      .insert({
        staff_id: insertedStaff.id,
        clinic_id: clinicId,
        role: staffRole,
        role_id: Number(roleRow?.id || 3)
      })

    if (relationError) {
      console.warn('Failed to associate staff with clinic', relationError)
    }

    return NextResponse.json({ data: insertedStaff }, { status: 201 })
  } catch (err) {
    console.error('POST /api/configuration/staff error', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
