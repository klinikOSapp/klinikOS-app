import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await req.json()

    const patientId = String(body.patientId || '')
    const channel = String(body.channel || '')
    const note = body.note ? String(body.note) : null

    if (!patientId || !channel) {
      return NextResponse.json({ error: 'patientId and channel are required' }, { status: 400 })
    }
    if (!['call', 'email', 'whatsapp'].includes(channel)) {
      return NextResponse.json({ error: 'invalid channel' }, { status: 400 })
    }

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Unified comms history: log a manual contact attempt in `communications`.
    // `clinic_id` is auto-filled by DB trigger from patient_id (if not provided).
    const { error } = await supabase.from('communications').insert({
      patient_id: patientId,
      channel,
      content: note || `Manual contact attempt (${channel})`,
      status: 'attempted',
      kind: 'collection_followup',
      related_entity_type: 'caja_pending_collection',
      related_entity_id: null,
      user_id: user.id
    })

    if (error) {
      console.error('[pending-collections/log] insert error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error in pending-collections/log API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

