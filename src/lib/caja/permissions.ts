import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CajaPermission =
  | { type: 'module'; module: string; action: 'view' | 'create' | 'edit' | 'delete' }
  | { type: 'custom'; module: string; key: string } // reads permissions[module].custom[key] === true

export async function resolveClinicIdForUser(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: clinics } = await supabase.rpc('get_my_clinics')
  const clinicId = Array.isArray(clinics) && clinics.length > 0 ? (clinics[0] as string) : null
  return clinicId
}

export async function requireCajaPermission(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  clinicId: string,
  permission: CajaPermission
) {
  if (permission.type === 'module') {
    const { data, error } = await supabase.rpc('has_permission', {
      p_clinic_id: clinicId,
      p_module: permission.module,
      p_action: permission.action
    })
    if (error) return { ok: false, error: error.message }
    return { ok: Boolean(data), error: null as string | null }
  }

  // custom rule: use get_my_role_info and inspect permissions JSON
  const { data, error } = await supabase.rpc('get_my_role_info', { p_clinic_id: clinicId })
  const row = Array.isArray(data) ? (data[0] as any) : (data as any)
  if (error || !row) return { ok: false, error: error?.message || 'Role info unavailable' }
  const custom = row?.permissions?.[permission.module]?.custom
  return { ok: Boolean(custom?.[permission.key]), error: null as string | null }
}


