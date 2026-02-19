import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type AlertRow = {
  label: string
  category: string
  severity?: string
}

type PrimaryContactUpdate = {
  id?: string | null
  full_name?: string | null
  email?: string | null
  phone_primary?: string | null
  address_country?: string | null
}

type HealthProfileUpdate = {
  allergies?: string | null
  main_complaint?: string | null
  motivo_consulta?: string | null
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await req.json()
    const {
      patientId,
      patient,
      alerts,
      primaryContact,
      healthProfile
    }: {
      patientId?: string
      patient?: Record<string, unknown>
      alerts?: AlertRow[]
      primaryContact?: PrimaryContactUpdate
      healthProfile?: HealthProfileUpdate
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    if (patient && Object.keys(patient).length > 0) {
      const { error: updateError } = await supabase.from('patients').update(patient).eq('id', patientId)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    if (primaryContact?.id) {
      const { error: contactUpdateError } = await supabase
        .from('contacts')
        .update({
          full_name: primaryContact.full_name ?? null,
          email: primaryContact.email ?? null,
          phone_primary: primaryContact.phone_primary ?? null,
          address_country: primaryContact.address_country ?? null
        })
        .eq('id', primaryContact.id)

      if (contactUpdateError) {
        return NextResponse.json({ error: contactUpdateError.message }, { status: 400 })
      }
    }

    if (healthProfile && Object.keys(healthProfile).length > 0) {
      const { error: profileError } = await supabase
        .from('patient_health_profiles')
        .upsert({
          patient_id: patientId,
          allergies: healthProfile.allergies ?? null,
          main_complaint: healthProfile.main_complaint ?? null,
          motivo_consulta: healthProfile.motivo_consulta ?? null
        })

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }
    }

    if (Array.isArray(alerts)) {
      const { error: delError } = await supabase
        .from('patient_medical_alerts')
        .delete()
        .eq('patient_id', patientId)
      if (delError) {
        return NextResponse.json({ error: delError.message }, { status: 400 })
      }

      const rows = alerts.map((a) => ({
        patient_id: patientId,
        alert_type: a.label,
        description: a.label,
        severity: a.severity ?? 'medium',
        category: a.category ?? 'allergy',
        is_critical: false
      }))

      if (rows.length) {
        const { error: insError } = await supabase.from('patient_medical_alerts').insert(rows)
        if (insError) {
          return NextResponse.json({ error: insError.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

