import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type AlertRow = {
  label: string
  category: string
  severity?: string
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await req.json()
    const { patientId, patient, alerts }: { patientId?: string; patient?: Record<string, any>; alerts?: AlertRow[] } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    if (patient && Object.keys(patient).length > 0) {
      const { error: updateError } = await supabase.from('patients').update(patient).eq('id', patientId)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
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
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}



