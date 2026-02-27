import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type BudgetTreatmentInput = {
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

type CreateBudgetPayload = {
  clinicId?: string
  patientId?: string
  budgetName?: string
  totalAmount?: string | number | null
  treatments?: BudgetTreatmentInput[]
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function cleanText(value: unknown): string {
  return String(value || '').trim()
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

    const body = (await req.json()) as CreateBudgetPayload
    const clinicId = cleanText(body.clinicId)
    const patientId = cleanText(body.patientId)
    const budgetName = cleanText(body.budgetName)
    const totalAmount = parseAmount(body.totalAmount)
    const treatments = Array.isArray(body.treatments) ? body.treatments : []

    if (!clinicId || !patientId) {
      return NextResponse.json(
        { error: 'Missing clinicId/patientId' },
        { status: 400 }
      )
    }

    const quoteNumber = `PRE-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const issueDate = new Date().toISOString().slice(0, 10)
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const { data: createdPlan, error: createPlanError } = await supabase
      .from('treatment_plans')
      .insert({
        patient_id: patientId,
        staff_id: user.id,
        name: budgetName || `Plan ${quoteNumber}`,
        status: 'draft'
      })
      .select('id')
      .single()

    if (createPlanError || !createdPlan?.id) {
      return NextResponse.json(
        {
          error: `No se pudo crear plan de tratamiento: ${
            createPlanError?.message || 'missing plan id'
          }`
        },
        { status: 400 }
      )
    }

    const planId = Number((createdPlan as { id: number }).id)
    if (!Number.isFinite(planId)) {
      return NextResponse.json({ error: 'Invalid plan id' }, { status: 400 })
    }

    const { data: createdQuote, error: createQuoteError } = await supabase
      .from('quotes')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        plan_id: planId,
        quote_number: quoteNumber,
        status: 'sent',
        total_amount: Number.isFinite(totalAmount) ? totalAmount : 0,
        issue_date: issueDate,
        expiry_date: expiryDate
      })
      .select('id')
      .single()

    if (createQuoteError || !createdQuote?.id) {
      return NextResponse.json(
        {
          error: createQuoteError?.message || 'No quote id returned after insert'
        },
        { status: 400 }
      )
    }

    const quoteId = Number((createdQuote as { id: number }).id)
    if (!Number.isFinite(quoteId)) {
      return NextResponse.json({ error: 'Invalid quote id' }, { status: 400 })
    }

    if (treatments.length > 0) {
      const normalizedCodes = Array.from(
        new Set(
          treatments.map((t) => cleanText(t.codigo)).filter((value) => value.length > 0)
        )
      )
      const normalizedNames = Array.from(
        new Set(
          treatments
            .map((t) => cleanText(t.tratamiento))
            .filter((value) => value.length > 0)
        )
      )

      const loadServiceLookup = async () => {
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

        if (servicesByCode.error) throw servicesByCode.error
        if (servicesByName.error) throw servicesByName.error

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

        return { serviceByCode, serviceByName }
      }

      let { serviceByCode, serviceByName } = await loadServiceLookup()
      const unresolvedTreatments = treatments.filter((treatment) => {
        const treatmentCode = cleanText(treatment.codigo)
        const treatmentName = cleanText(treatment.tratamiento)
        return !(serviceByCode.get(treatmentCode) ?? serviceByName.get(treatmentName))
      })

      if (unresolvedTreatments.length > 0) {
        const { data: clinicRow } = await supabase
          .from('clinics')
          .select('organization_id')
          .eq('id', clinicId)
          .maybeSingle()

        const organizationId = cleanText(
          (clinicRow as { organization_id?: string | null } | null)?.organization_id
        )

        if (organizationId) {
          const missingCatalogRows = unresolvedTreatments
            .map((treatment) => {
              const treatmentCode = cleanText(treatment.codigo) || null
              const treatmentName = cleanText(treatment.tratamiento)
              const name = treatmentName || treatmentCode || ''
              if (!name) return null
              return {
                organization_id: organizationId,
                name,
                treatment_code: treatmentCode,
                category: 'General',
                standard_price: parseAmount(treatment.precio ?? treatment.importe),
                default_duration_minutes: null,
                is_active: true
              }
            })
            .filter((row): row is NonNullable<typeof row> => row !== null)

          const dedupedRows = Array.from(
            missingCatalogRows
              .reduce(
                (map, row) => map.set(`${row.treatment_code || ''}::${row.name}`, row),
                new Map<string, (typeof missingCatalogRows)[number]>()
              )
              .values()
          )

          if (dedupedRows.length > 0) {
            const { error: insertMissingServicesError } = await supabase
              .from('service_catalog')
              .insert(dedupedRows)

            if (!insertMissingServicesError) {
              const reloadedLookup = await loadServiceLookup()
              serviceByCode = reloadedLookup.serviceByCode
              serviceByName = reloadedLookup.serviceByName
            }
          }
        }
      }

      const resolvedRows = treatments.map((treatment) => {
        const treatmentCode = cleanText(treatment.codigo)
        const treatmentName = cleanText(treatment.tratamiento)
        const serviceId =
          serviceByCode.get(treatmentCode) ?? serviceByName.get(treatmentName) ?? null

        const unitPrice = parseAmount(treatment.precio ?? treatment.importe)
        const discountPercentage = Number(treatment.porcentajeDescuento)
        const toothNumber = Number(treatment.pieza)
        const notes = JSON.stringify({
          cara: treatment.cara ? cleanText(treatment.cara) : undefined,
          doctor: treatment.doctor ? cleanText(treatment.doctor) : undefined,
          codigo: treatmentCode || undefined,
          importeSeguro: treatment.importeSeguro
            ? cleanText(treatment.importeSeguro)
            : undefined
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
          planItem: serviceId
            ? {
                plan_id: planId,
                service_id: serviceId,
                tooth_number:
                  Number.isFinite(toothNumber) && toothNumber > 0 ? toothNumber : null,
                notes
              }
            : null
        }
      })

      const quoteItems = resolvedRows.map((row) => row.quoteItem)
      if (quoteItems.length > 0) {
        const { error: insertQuoteItemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)
        if (insertQuoteItemsError) {
          return NextResponse.json(
            { error: insertQuoteItemsError.message },
            { status: 400 }
          )
        }
      }

      const planItems = resolvedRows
        .map((row) => row.planItem)
        .filter((row): row is NonNullable<typeof row> => row !== null)
      if (planItems.length > 0) {
        const { error: insertPlanItemsError } = await supabase
          .from('treatment_plan_items')
          .insert(planItems)
        if (insertPlanItemsError) {
          return NextResponse.json(
            { error: insertPlanItemsError.message },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json({ ok: true, quoteId, quoteNumber, planId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
