import { requireCajaPermission } from '@/lib/caja/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
// Use standalone build to avoid runtime fs reads of *.afm font data files.
// (Next.js output tracing can omit those assets, causing ENOENT at runtime.)
import PDFDocument from 'pdfkit/js/pdfkit.standalone'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

type ExportBody = {
  periodo: 'quarter_current' | 'quarter_previous' | 'custom'
  fecha_desde?: string // YYYY-MM-DD
  fecha_hasta?: string // YYYY-MM-DD
  formato: 'csv' | 'pdf' | 'xlsx'
  incluir?: {
    desglose_mensual?: boolean
    desglose_metodo?: boolean
    totales_generales?: boolean
  }
}

function parseISODateOnly(s: string) {
  const [y, m, d] = s.split('-').map((v) => Number(v))
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d))
}

function formatDateOnlyUTC(d: Date) {
  return d.toISOString().split('T')[0]
}

function startEndOfQuarterUTC(now: Date, quarterOffset: number) {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0..11
  const currentQuarter = Math.floor(m / 3) // 0..3
  const targetQuarter = currentQuarter + quarterOffset
  const targetYear = y + Math.floor(targetQuarter / 4)
  const q = ((targetQuarter % 4) + 4) % 4
  const startMonth = q * 3
  const start = new Date(Date.UTC(targetYear, startMonth, 1))
  const end = new Date(Date.UTC(targetYear, startMonth + 3, 0))
  return { start, end }
}

function csvEscape(v: string) {
  if (v.includes('"') || v.includes(',') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

async function renderPdf(params: {
  title: string
  periodLabel: string
  generatedAtIso: string
  totals: { produced: number; invoiced: number; collected: number; toCollect: number }
  methodBreakdown?: Record<string, number>
  monthlyRows?: Array<{ month: string; produced: number; collected: number }>
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 })
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(Buffer.from(c)))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  doc.fontSize(18).text(params.title, { align: 'left' })
  doc.moveDown(0.5)
  doc.fontSize(11).fillColor('#444').text(`Period: ${params.periodLabel}`)
  doc.text(`Generated: ${params.generatedAtIso}`)
  doc.moveDown(1)

  doc.fillColor('#000').fontSize(13).text('Summary')
  doc.moveDown(0.25)
  doc.fontSize(11)
  doc.text(`Produced: ${params.totals.produced.toFixed(2)} €`)
  doc.text(`Invoiced: ${params.totals.invoiced.toFixed(2)} €`)
  doc.text(`Collected: ${params.totals.collected.toFixed(2)} €`)
  doc.text(`To collect: ${params.totals.toCollect.toFixed(2)} €`)

  if (params.methodBreakdown && Object.keys(params.methodBreakdown).length > 0) {
    doc.moveDown(1)
    doc.fontSize(13).text('Breakdown by method')
    doc.moveDown(0.25)
    doc.fontSize(11)
    for (const [k, v] of Object.entries(params.methodBreakdown).sort((a, b) => b[1] - a[1])) {
      doc.text(`${k}: ${v.toFixed(2)} €`)
    }
  }

  if (params.monthlyRows && params.monthlyRows.length > 0) {
    doc.moveDown(1)
    doc.fontSize(13).text('Monthly breakdown')
    doc.moveDown(0.25)
    doc.fontSize(11)
    for (const r of params.monthlyRows) {
      doc.text(`${r.month} — Produced: ${r.produced.toFixed(2)} €, Collected: ${r.collected.toFixed(2)} €`)
    }
  }

  doc.end()
  return await done
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = (await req.json()) as ExportBody

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) return NextResponse.json({ error: 'No clinic found' }, { status: 400 })
    const clinicId = clinics[0] as string

    // v2: export permission is a custom rule on `cash` module (supports custom roles).
    const canViewCash = await requireCajaPermission(supabase, clinicId, {
      type: 'module',
      module: 'cash',
      action: 'view'
    })
    if (!canViewCash.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const canExport = await requireCajaPermission(supabase, clinicId, {
      type: 'custom',
      module: 'cash',
      key: 'export'
    })
    if (!canExport.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!body?.periodo || (body.formato !== 'csv' && body.formato !== 'pdf' && body.formato !== 'xlsx')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const now = new Date()
    let start: Date
    let end: Date
    if (body.periodo === 'quarter_current') {
      ;({ start, end } = startEndOfQuarterUTC(now, 0))
    } else if (body.periodo === 'quarter_previous') {
      ;({ start, end } = startEndOfQuarterUTC(now, -1))
    } else {
      const s = body.fecha_desde ? parseISODateOnly(body.fecha_desde) : null
      const e = body.fecha_hasta ? parseISODateOnly(body.fecha_hasta) : null
      if (!s || !e) return NextResponse.json({ error: 'fecha_desde and fecha_hasta required' }, { status: 400 })
      start = s
      end = e
    }

    const startStr = formatDateOnlyUTC(start)
    const endStr = formatDateOnlyUTC(end)
    if (endStr < startStr) {
      return NextResponse.json({ error: 'fecha_hasta must be >= fecha_desde' }, { status: 400 })
    }
    const days = Math.round((Number(end) - Number(start)) / 86400000) + 1
    if (days > 365) {
      return NextResponse.json({ error: 'Range too large (max 365 days)' }, { status: 400 })
    }

    const incluir = body.incluir || {}
    const includeTotals = incluir.totales_generales !== false
    const includeMonthly = Boolean(incluir.desglose_mensual)
    const includeMethod = Boolean(incluir.desglose_metodo)

    // Use existing summary RPC for totals.
    const startTs = `${startStr}T00:00:00Z`
    const endTs = `${endStr}T23:59:59Z`
    const prevStart = new Date(start)
    prevStart.setUTCFullYear(prevStart.getUTCFullYear() - 1)
    const prevEnd = new Date(end)
    prevEnd.setUTCFullYear(prevEnd.getUTCFullYear() - 1)

    const resumenRpc = await supabase.rpc('get_caja_resumen', {
      p_clinic_id: clinicId,
      p_period_start: startTs,
      p_period_end: endTs,
      p_prev_start: `${formatDateOnlyUTC(prevStart)}T00:00:00Z`,
      p_prev_end: `${formatDateOnlyUTC(prevEnd)}T23:59:59Z`
    })
    const resumen = Array.isArray(resumenRpc.data) ? (resumenRpc.data[0] as any) : null

    const produced = resumen ? Number(resumen.produced || 0) : 0
    const invoiced = resumen ? Number(resumen.invoiced || 0) : produced
    const collected = resumen ? Number(resumen.collected || 0) : 0
    const toCollect = resumen ? Number(resumen.to_collect || 0) : 0

    // Method breakdown from payments table (in range).
    const methodBreakdown: Record<string, number> = {}
    if (includeMethod) {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_method, transaction_date')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', startTs)
        .lte('transaction_date', endTs)
      if (error) {
        console.error('[exportar] payments query error', error)
      }
      for (const p of payments || []) {
        const key = String((p as any).payment_method || 'Unknown')
        methodBreakdown[key] = (methodBreakdown[key] || 0) + Number((p as any).amount || 0)
      }
    }

    // Monthly breakdown (simple, based on invoice timestamps and payments).
    const monthlyRows: Array<{ month: string; produced: number; collected: number }> = []
    if (includeMonthly) {
      const { data: dayInvoices } = await supabase.rpc('get_invoice_totals_by_day', {
        p_clinic_id: clinicId,
        p_start_time: startTs,
        p_end_time: endTs
      })
      const invByMonth: Record<string, number> = {}
      for (const r of (dayInvoices as any[]) || []) {
        const day = String(r.day) // YYYY-MM-DD
        const month = day.slice(0, 7)
        invByMonth[month] = (invByMonth[month] || 0) + Number(r.total_amount || 0)
      }

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, transaction_date')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', startTs)
        .lte('transaction_date', endTs)
      const payByMonth: Record<string, number> = {}
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit' })
      for (const p of payments || []) {
        const dt = (p as any).transaction_date
        if (!dt) continue
        const parts = formatter.formatToParts(new Date(dt))
        const y = parts.find((x) => x.type === 'year')?.value
        const m = parts.find((x) => x.type === 'month')?.value
        if (!y || !m) continue
        const key = `${y}-${m}`
        payByMonth[key] = (payByMonth[key] || 0) + Number((p as any).amount || 0)
      }

      const keys = Array.from(new Set([...Object.keys(invByMonth), ...Object.keys(payByMonth)])).sort()
      for (const k of keys) {
        monthlyRows.push({
          month: k,
          produced: invByMonth[k] || 0,
          collected: payByMonth[k] || 0
        })
      }
    }

    const toDmy = (isoDate: string) => {
      const [y, m, d] = isoDate.split('-')
      if (!y || !m || !d) return isoDate
      return `${d}-${m}-${y}`
    }

    // v2.0 brief strict naming:
    // - Quarter: caja_Q1_2025.{ext}
    // - Custom: caja_DD-MM-YYYY_al_DD-MM-YYYY.{ext}
    const [startYear, startMonth] = startStr.split('-')
    const q =
      startMonth && Number.isFinite(Number(startMonth))
        ? Math.floor((Number(startMonth) - 1) / 3) + 1
        : 1

    const fileName =
      body.periodo === 'custom'
        ? `caja_${toDmy(startStr)}_al_${toDmy(endStr)}.${body.formato}`
        : `caja_Q${q}_${startYear}.${body.formato}`

    // Audit log (DB)
    const { error: auditError } = await supabase.from('export_audit').insert({
      clinic_id: clinicId,
      user_id: user.id,
      period: body.periodo,
      date_from: startStr,
      date_to: endStr,
      format: body.formato,
      include_monthly_breakdown: includeMonthly,
      include_method_breakdown: includeMethod,
      include_overall_totals: includeTotals
    })
    if (auditError) {
      console.error('[exportar] audit insert error', auditError)
    }

    const generatedAt = new Date().toISOString()
    const periodLabel = `${startStr} to ${endStr}`

    if (body.formato === 'pdf') {
      const pdf = await renderPdf({
        title: 'KLINIKOS - Cash report',
        periodLabel,
        generatedAtIso: generatedAt,
        totals: { produced, invoiced, collected, toCollect },
        methodBreakdown: includeMethod ? methodBreakdown : undefined,
        monthlyRows: includeMonthly ? monthlyRows : undefined
      })
      return NextResponse.json({
        file_name: fileName,
        generated_at: generatedAt,
        content_type: 'application/pdf',
        pdf_base64: pdf.toString('base64')
      })
    }

    if (body.formato === 'xlsx') {
      const wb = XLSX.utils.book_new()

      if (includeTotals) {
        const totalsSheet = XLSX.utils.aoa_to_sheet([
          ['KLINIKOS - Reporte de Caja'],
          ['Periodo', `${startStr} al ${endStr}`],
          ['Generado', generatedAt],
          [],
          ['RESUMEN DEL PERIODO', 'Valor'],
          ['Producido', produced],
          ['Facturado', invoiced],
          ['Cobrado', collected],
          ['Por cobrar', toCollect]
        ])
        XLSX.utils.book_append_sheet(wb, totalsSheet, 'Resumen')
      }

      if (includeMethod) {
        const rows = Object.entries(methodBreakdown)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => [k, v])
        const methodSheet = XLSX.utils.aoa_to_sheet([['Metodo', 'Total'], ...rows])
        XLSX.utils.book_append_sheet(wb, methodSheet, 'Por método')
      }

      if (includeMonthly) {
        const monthlySheet = XLSX.utils.aoa_to_sheet([
          ['Mes', 'Producido', 'Cobrado'],
          ...monthlyRows.map((r) => [r.month, r.produced, r.collected])
        ])
        XLSX.utils.book_append_sheet(wb, monthlySheet, 'Desglose mensual')
      }

      const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
      return NextResponse.json({
        file_name: fileName,
        generated_at: generatedAt,
        content_type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xlsx_base64: out.toString('base64')
      })
    }

    // CSV
    const lines: string[] = []
    lines.push('KLINIKOS - Reporte de Caja')
    lines.push(`Periodo,${csvEscape(startStr)} al ${csvEscape(endStr)}`)
    lines.push(`Generado,${csvEscape(generatedAt)}`)
    lines.push('')

    if (includeTotals) {
      lines.push('RESUMEN DEL PERIODO')
      lines.push('Tipo,Valor')
      lines.push(`Producido,${produced.toFixed(2)}`)
      lines.push(`Facturado,${invoiced.toFixed(2)}`)
      lines.push(`Cobrado,${collected.toFixed(2)}`)
      lines.push(`Por cobrar,${toCollect.toFixed(2)}`)
      lines.push('')
    }

    if (includeMethod) {
      lines.push('DESGLOSE POR MÉTODO')
      lines.push('Metodo,Total')
      for (const [k, v] of Object.entries(methodBreakdown).sort((a, b) => b[1] - a[1])) {
        lines.push(`${csvEscape(k)},${v.toFixed(2)}`)
      }
      lines.push('')
    }

    if (includeMonthly) {
      lines.push('DESGLOSE MENSUAL')
      lines.push('Mes,Producido,Cobrado')
      for (const r of monthlyRows) {
        lines.push(`${r.month},${r.produced.toFixed(2)},${r.collected.toFixed(2)}`)
      }
      lines.push('')
    }

    const csv = lines.join('\n')
    return NextResponse.json({
      file_name: fileName,
      generated_at: generatedAt,
      content_type: 'text/csv',
      csv
    })
  } catch (error: any) {
    console.error('Error in exportar API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}


