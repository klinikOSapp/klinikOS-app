import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type EditableTreatmentInput = {
  codigo?: string | null
  tratamiento?: string | null
  precio?: string | number | null
  importe?: string | number | null
  porcentajeDescuento?: string | number | null
  pieza?: string | number | null
  cara?: string | null
  doctor?: string | null
  importeSeguro?: string | number | null
}

type UpdateBudgetPayload = {
  clinicId?: string
  quoteId?: number | string
  status?: string
  totalAmount?: number | string
  validUntil?: string | null
  planId?: number | string | null
  planName?: string | null
  treatments?: EditableTreatmentInput[]
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDateForDb(value: string | null | undefined): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null

  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    return `${year}-${month}-${day}`
  }

  const esDateMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (esDateMatch) {
    const day = Number(esDateMatch[1])
    const month = Number(esDateMatch[2])
    const yearRaw = esDateMatch[3]
    const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw)
    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12
    ) {
      const yyyy = String(year).padStart(4, '0')
      const mm = String(month).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as UpdateBudgetPayload
    const clinicId = String(body.clinicId || '').trim()
    const quoteId = Number(body.quoteId)
    const status = String(body.status || '').trim()
    const totalAmount = parseAmount(body.totalAmount)
    const validUntil = normalizeDateForDb(body.validUntil)
    const requestedPlanId = Number(body.planId)
    const planName = String(body.planName || '').trim()
    const treatments = Array.isArray(body.treatments) ? body.treatments : []

    if (!clinicId || !Number.isFinite(quoteId) || quoteId <= 0) {
      return NextResponse.json({ error: 'Invalid clinicId/quoteId payload' }, { status: 400 })
    }

    const { error: updateQuoteError } = await supabase
      .from('quotes')
      .update({
        status: status || null,
        total_amount: totalAmount,
        expiry_date: validUntil
      })
      .eq('id', quoteId)
      .eq('clinic_id', clinicId)
    if (updateQuoteError) {
      return NextResponse.json({ error: updateQuoteError.message }, { status: 400 })
    }

    let effectivePlanId =
      Number.isFinite(requestedPlanId) && requestedPlanId > 0 ? requestedPlanId : null
    if (!effectivePlanId) {
      const { data: quoteRow, error: quoteSelectError } = await supabase
        .from('quotes')
        .select('plan_id')
        .eq('id', quoteId)
        .eq('clinic_id', clinicId)
        .maybeSingle()
      if (quoteSelectError) {
        return NextResponse.json({ error: quoteSelectError.message }, { status: 400 })
      }
      const resolvedPlanId = Number((quoteRow as { plan_id?: number | null } | null)?.plan_id)
      if (Number.isFinite(resolvedPlanId) && resolvedPlanId > 0) {
        effectivePlanId = resolvedPlanId
      }
    }

    if (effectivePlanId && planName) {
      const { error: updatePlanError } = await supabase
        .from('treatment_plans')
        .update({ name: planName })
        .eq('id', effectivePlanId)
      if (updatePlanError) {
        return NextResponse.json({ error: updatePlanError.message }, { status: 400 })
      }
    }

    const { error: deleteQuoteItemsError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId)
    if (deleteQuoteItemsError) {
      return NextResponse.json({ error: deleteQuoteItemsError.message }, { status: 400 })
    }

    if (effectivePlanId) {
      const { error: deletePlanItemsError } = await supabase
        .from('treatment_plan_items')
        .delete()
        .eq('plan_id', effectivePlanId)
      if (deletePlanItemsError) {
        return NextResponse.json({ error: deletePlanItemsError.message }, { status: 400 })
      }
    }

    if (treatments.length > 0) {
      const normalizedCodes = Array.from(
        new Set(
          treatments
            .map((t) => String(t.codigo || '').trim())
            .filter((value) => value.length > 0)
        )
      )
      const normalizedNames = Array.from(
        new Set(
          treatments
            .map((t) => String(t.tratamiento || '').trim())
            .filter((value) => value.length > 0)
        )
      )

      const [servicesByCode, servicesByName] = await Promise.all([
        normalizedCodes.length > 0
          ? supabase
              .from('service_catalog')
              .select('id, treatment_code, name')
              .in('treatment_code', normalizedCodes)
          : Promise.resolve({ data: [], error: null }),
        normalizedNames.length > 0
          ? supabase
              .from('service_catalog')
              .select('id, treatment_code, name')
              .in('name', normalizedNames)
          : Promise.resolve({ data: [], error: null })
      ])

      if (servicesByCode.error) {
        return NextResponse.json({ error: servicesByCode.error.message }, { status: 400 })
      }
      if (servicesByName.error) {
        return NextResponse.json({ error: servicesByName.error.message }, { status: 400 })
      }

      const serviceByCode = new Map<string, number>()
      const serviceByName = new Map<string, number>()
      ;(servicesByCode.data || []).forEach((row: any) => {
        if (row?.treatment_code) serviceByCode.set(String(row.treatment_code), Number(row.id))
        if (row?.name) serviceByName.set(String(row.name), Number(row.id))
      })
      ;(servicesByName.data || []).forEach((row: any) => {
        if (row?.treatment_code) serviceByCode.set(String(row.treatment_code), Number(row.id))
        if (row?.name) serviceByName.set(String(row.name), Number(row.id))
      })

      const resolvedRows = treatments.map((treatment) => {
        const treatmentCode = String(treatment.codigo || '').trim()
        const treatmentName = String(treatment.tratamiento || '').trim()
        const serviceId = serviceByCode.get(treatmentCode) ?? serviceByName.get(treatmentName) ?? null

        const unitPrice = parseAmount(treatment.precio ?? treatment.importe)
        const discountPercentage = Number(treatment.porcentajeDescuento)
        const toothNumber = Number(treatment.pieza)
        const notes = JSON.stringify({
          cara: treatment.cara ? String(treatment.cara) : undefined,
          doctor: treatment.doctor ? String(treatment.doctor) : undefined,
          codigo: treatmentCode || undefined,
          importeSeguro: treatment.importeSeguro ? String(treatment.importeSeguro) : undefined
        })

        return {
          quoteItem: {
            quote_id: quoteId,
            service_id: serviceId,
            description: treatmentName || treatmentCode || 'Tratamiento',
            quantity: 1,
            unit_price: unitPrice,
            discount_percentage: Number.isFinite(discountPercentage)
              ? discountPercentage
              : 0
          },
          planItem: effectivePlanId && serviceId
            ? {
                plan_id: effectivePlanId,
                service_id: serviceId,
                tooth_number:
                  Number.isFinite(toothNumber) && toothNumber > 0 ? toothNumber : null,
                notes
              }
            : null
        }
      })

      const quoteItemsPayload = resolvedRows.map((row) => row.quoteItem)
      const { error: insertQuoteItemsError } = await supabase
        .from('quote_items')
        .insert(quoteItemsPayload)
      if (insertQuoteItemsError) {
        return NextResponse.json({ error: insertQuoteItemsError.message }, { status: 400 })
      }

      if (effectivePlanId) {
        const planItemsPayload = resolvedRows
          .map((row) => row.planItem)
          .filter((row): row is NonNullable<typeof row> => row !== null)
        if (planItemsPayload.length > 0) {
          const { error: insertPlanItemsError } = await supabase
            .from('treatment_plan_items')
            .insert(planItemsPayload)
          if (insertPlanItemsError) {
            return NextResponse.json({ error: insertPlanItemsError.message }, { status: 400 })
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
