import { requireCajaPermission, resolveClinicIdForUser } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type UpdatePayload = {
  updates?: {
    name?: string
    role?: 'director' | 'coordinador' | 'profesional' | 'asistente' | 'recepcion'
    specialty?: string
    phone?: string
    email?: string
    colorTone?: 'morado' | 'naranja' | 'verde' | 'azul' | 'rojo'
    commission?: string
    status?: 'Activo' | 'Inactivo'
    photoUrl?: string
    is_external?: boolean
    external_notes?: string | null
  }
  previousRole?: string
}

type UpdateErrorLike = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

function parseCommissionPercentage(commission: string | undefined): number | null {
  const parsed = Number(String(commission || '').replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function toneToHex(
  tone: 'morado' | 'naranja' | 'verde' | 'azul' | 'rojo' | undefined
): string {
  switch (tone) {
    case 'naranja':
      return '#d97706'
    case 'verde':
      return '#2e7d5b'
    case 'azul':
      return '#0369a1'
    case 'rojo':
      return '#dc2626'
    default:
      return '#7725eb'
  }
}

function mapProfessionalRoleToUserRole(
  role: string
): 'gerencia' | 'doctor' | 'higienista' | 'recepcion' {
  const normalized = role.toLowerCase()
  if (normalized.includes('higien')) return 'higienista'
  if (
    normalized.includes('recep') ||
    normalized.includes('admin') ||
    normalized.includes('auxiliar')
  ) {
    return 'recepcion'
  }
  if (
    normalized.includes('manager') ||
    normalized.includes('geren') ||
    normalized.includes('direc')
  ) {
    return 'gerencia'
  }
  return 'doctor'
}

function slugifyRoleName(role: string): string {
  return role
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function isMissingColumnError(error: UpdateErrorLike | null): boolean {
  if (!error) return false
  const code = String(error.code || '')
  const message = String(error.message || '').toLowerCase()
  const details = String(error.details || '').toLowerCase()
  const hint = String(error.hint || '').toLowerCase()
  if (code === '42703' || code === 'PGRST204') return true
  return (
    message.includes('does not exist') ||
    message.includes('could not find') ||
    details.includes('does not exist') ||
    hint.includes('does not exist')
  )
}

function parseJwtPayload(token: string | undefined): Record<string, unknown> | null {
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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await context.params
    const body = (await req.json()) as UpdatePayload
    const updates = body.updates || {}
    const supabase = await createSupabaseServerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const selectedClinicId = await resolveClinicIdForUser(supabase)
    const { data: myClinicRawIds, error: myClinicIdsError } = await supabase.rpc(
      'get_my_clinics'
    )
    if (myClinicIdsError) {
      return NextResponse.json(
        {
          error: myClinicIdsError.message || 'Unable to resolve my clinics',
          code: myClinicIdsError.code || null
        },
        { status: 400 }
      )
    }
    const myClinicIds = Array.isArray(myClinicRawIds)
      ? myClinicRawIds
          .map((value) => String(value || ''))
          .filter((value) => value.length > 0)
      : []
    if (myClinicIds.length === 0) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 400 })
    }

    const { data: staffClinicRows, error: staffClinicError } = await supabase
      .from('staff_clinics')
      .select('clinic_id')
      .eq('staff_id', staffId)
      .in('clinic_id', myClinicIds)
    if (staffClinicError) {
      return NextResponse.json(
        {
          error:
            staffClinicError.message ||
            'Unable to validate specialist clinic relation',
          code: staffClinicError.code || null
        },
        { status: 400 }
      )
    }
    const candidateClinicIds = Array.isArray(staffClinicRows)
      ? Array.from(
          new Set(
            staffClinicRows
              .map((row) => String((row as { clinic_id?: string }).clinic_id || ''))
              .filter(Boolean)
          )
        )
      : []
    if (candidateClinicIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Specialist is not linked to your clinics',
          code: 'STAFF_NOT_IN_MY_CLINICS'
        },
        { status: 404 }
      )
    }

    let clinicId: string | null = null
    const permissionAudit: Array<{
      clinicId: string
      resolvedRoleId: number | null
      resolvedRoleError: string | null
      policyEdit: boolean
      policyError: string | null
      staffEdit: boolean
      settingsEdit: boolean
      staffError: string | null
      settingsError: string | null
    }> = []

    for (const candidateClinicId of candidateClinicIds) {
      const { data: resolvedRoleRaw, error: resolvedRoleError } = await supabase.rpc(
        'get_my_role_id_in_clinic',
        { p_clinic_id: candidateClinicId }
      )
      const resolvedRoleId =
        resolvedRoleRaw == null ? null : Number(resolvedRoleRaw)
      const { data: policyEditRaw, error: policyEditError } = await supabase.rpc(
        'can_edit_staff_for_clinic',
        { p_clinic_id: candidateClinicId }
      )
      const policyEdit = policyEditRaw === true
      const staffEditPermission = await requireCajaPermission(
        supabase,
        candidateClinicId,
        {
          type: 'module',
          module: 'staff',
          action: 'edit'
        }
      )
      const settingsEditPermission = staffEditPermission.ok
        ? { ok: true, error: null as string | null }
        : await requireCajaPermission(supabase, candidateClinicId, {
            type: 'module',
            module: 'settings',
            action: 'edit'
          })
      permissionAudit.push({
        clinicId: candidateClinicId,
        resolvedRoleId:
          Number.isFinite(resolvedRoleId || Number.NaN) && resolvedRoleId
            ? resolvedRoleId
            : null,
        resolvedRoleError: resolvedRoleError?.message || null,
        policyEdit,
        policyError: policyEditError?.message || null,
        staffEdit: Boolean(staffEditPermission.ok),
        settingsEdit: Boolean(settingsEditPermission.ok),
        staffError: staffEditPermission.error || null,
        settingsError: settingsEditPermission.error || null
      })
      if (policyEdit || staffEditPermission.ok || settingsEditPermission.ok) {
        clinicId = candidateClinicId
        break
      }
    }

    const routePermissionGranted = Boolean(clinicId)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasValidServiceRole =
      Boolean(supabaseUrl) && isServiceRoleKey(serviceRoleKey)
    const supabaseAdmin =
      hasValidServiceRole && supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          })
        : null

    const basePayload: Record<string, unknown> = {
      full_name: updates.name || null,
      specialties: updates.specialty ? [updates.specialty] : [],
      phone: updates.phone || null,
      email: updates.email || null,
      calendar_color: toneToHex(updates.colorTone),
      commission_percentage: parseCommissionPercentage(updates.commission),
      is_active: updates.status === 'Activo',
      avatar_url: updates.photoUrl || null
    }
    if (updates.is_external !== undefined) basePayload.is_external = updates.is_external
    if (updates.external_notes !== undefined) basePayload.external_notes = updates.external_notes

    const updateAttempts: Array<Record<string, unknown>> = [
      { ...basePayload, updated_at: new Date().toISOString() },
      basePayload
    ]
    const writerClients: Array<{
      name: 'user' | 'service_role'
      client: typeof supabase
    }> = [{ name: 'user', client: supabase }]
    if (supabaseAdmin && routePermissionGranted) {
      writerClients.push({
        name: 'service_role',
        client: supabaseAdmin as unknown as typeof supabase
      })
    }

    let lastError: UpdateErrorLike | null = null
    let updated = false
    let writerClientName: 'user' | 'service_role' = 'user'
    const writersTried: Array<'user' | 'service_role'> = []

    for (const writerClient of writerClients) {
      writersTried.push(writerClient.name)
      for (let index = 0; index < updateAttempts.length; index += 1) {
        const payload = updateAttempts[index]
        const updateResponse = await writerClient.client
          .from('staff')
          .update(payload, { count: 'exact' })
          .eq('id', staffId)

        if (updateResponse.error) {
          lastError = updateResponse.error
          if (isMissingColumnError(updateResponse.error) && index === 0) {
            continue
          }
          break
        }

        if (typeof updateResponse.count === 'number' && updateResponse.count < 1) {
          lastError = {
            code: 'NO_ROWS_UPDATED',
            message:
              'No staff row was updated (likely RLS permission or clinic mismatch)'
          }
          break
        }

        updated = true
        writerClientName = writerClient.name
        lastError = null
        break
      }

      if (updated) break
    }

    if (!updated) {
      return NextResponse.json(
        {
          error: lastError?.message || 'Staff update failed',
          code:
            lastError?.code ||
            (hasValidServiceRole ? null : 'SERVICE_ROLE_MISSING_OR_INVALID'),
          details: {
            writersTried,
            hasValidServiceRole,
            routePermissionGranted,
            selectedClinicId,
            myClinicIds,
            candidateClinicIds,
            permissionAudit
          }
        },
        {
          status:
            !routePermissionGranted || lastError?.code === 'NO_ROWS_UPDATED'
              ? 403
              : isMissingColumnError(lastError || null)
              ? 400
              : 400
        }
      )
    }

    const roleChanged =
      typeof updates.specialty === 'string' &&
      updates.specialty.trim().length > 0 &&
      updates.specialty !== body.previousRole
    if (roleChanged && clinicId) {
      const staffRole = updates.is_external ? 'externo' : mapProfessionalRoleToUserRole(updates.specialty || 'doctor')
      const roleSlug = slugifyRoleName(updates.specialty || '')
      const roleClient =
        writerClientName === 'service_role' && supabaseAdmin
          ? (supabaseAdmin as unknown as typeof supabase)
          : supabase
      let roleQuery = roleClient.from('roles').select('id')
      if (roleSlug) {
        roleQuery = roleQuery.or(
          `and(clinic_id.eq.${clinicId},name.eq.${roleSlug}),name.eq.${staffRole}`
        )
      } else {
        roleQuery = roleQuery.eq('name', staffRole)
      }
      const { data: roleRow } = await roleQuery
        .order('clinic_id', { ascending: false })
        .limit(1)
        .maybeSingle()

      await roleClient
        .from('staff_clinics')
        .update({
          role: staffRole,
          role_id: Number(roleRow?.id || 3)
        })
        .eq('clinic_id', clinicId)
        .eq('staff_id', staffId)
    }

    return NextResponse.json({ ok: true, via: writerClientName })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
