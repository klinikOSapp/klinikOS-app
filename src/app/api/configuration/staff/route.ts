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

function parseJwtPayload(
  token: string | undefined
): Record<string, unknown> | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    const parsed = JSON.parse(payload)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function isServiceRoleKey(token: string | undefined): boolean {
  const payload = parseJwtPayload(token)
  return String(payload?.role || '') === 'service_role'
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

    // Use service_role to bypass RLS (INSERT policy requires auth.uid() = id)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasServiceRole =
      Boolean(supabaseUrl) && isServiceRoleKey(serviceRoleKey)

    const adminClient = hasServiceRole
      ? createClient(supabaseUrl, serviceRoleKey!, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : null

    const insertClient = adminClient ?? supabase

    const staffSelect =
      'id, full_name, specialties, phone, email, calendar_color, commission_percentage, is_active, avatar_url'

    const { data: insertedStaff, error: staffError } = await (
      insertClient as unknown as typeof supabase
    )
      .from('staff')
      .insert(staffPayload)
      .select(staffSelect)
      .single()

    if (staffError || !insertedStaff) {
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
    const { data: roleRow } = await (insertClient as unknown as typeof supabase)
      .from('roles')
      .select('id')
      .or(
        `and(clinic_id.eq.${clinicId},name.eq.${staffRole}),name.eq.${staffRole}`
      )
      .order('clinic_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error: relationError } = await (
      insertClient as unknown as typeof supabase
    )
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
