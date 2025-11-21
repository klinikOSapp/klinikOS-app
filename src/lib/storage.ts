import { createSupabaseBrowserClient } from './supabase/client'

export async function getClinicIdForPatient(patientId: string): Promise<string | null> {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.from('patients').select('clinic_id').eq('id', patientId).maybeSingle()
  return (data as any)?.clinic_id ?? null
}

export async function uploadPatientFile(params: {
  patientId: string
  file: File
  kind: 'rx' | 'consents' | 'avatar' | 'orthodontics'
}): Promise<{ path: string }> {
  const supabase = createSupabaseBrowserClient()
  const { patientId, file, kind } = params
  const path = `patients/${patientId}/${kind}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('patient-docs').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined
  })
  if (error) {
    throw error
  }
  return { path }
}

export async function getSignedUrl(path: string, expiresInSeconds = 600): Promise<string> {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from('patient-docs').createSignedUrl(path, expiresInSeconds)
  if (error || !data) {
    throw error || new Error('No signed url')
  }
  return data.signedUrl
}

export async function uploadStaffAvatar(params: {
  staffId: string
  file: File
}): Promise<{ path: string }> {
  const supabase = createSupabaseBrowserClient()
  const { staffId, file } = params
  const path = `patients/_staff/${staffId}/avatar/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('patient-docs').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || undefined
  })
  if (error) {
    throw error
  }
  return { path }
}


