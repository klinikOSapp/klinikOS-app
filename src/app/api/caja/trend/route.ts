import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type SeriesPoint = {
  label: string
  actual: number // produced cumulative (thousands)
  collected?: number // collected cumulative (thousands)
  invoiceCount?: number
  paymentCount?: number
  bucketStart?: string // YYYY-MM-DD (Madrid)
  bucketEnd?: string // YYYY-MM-DD (Madrid)
}

function addDaysUtcDateStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split('-').map((v) => Number(v))
  const utc = new Date(Date.UTC(y, m - 1, d))
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().split('T')[0]
}

function madridDayStartUtc(dateStr: string) {
  // dateStr is YYYY-MM-DD and represents a day in Europe/Madrid.
  // We compute the UTC instant that corresponds to 00:00:00 in Madrid on that date.
  const guessUtc = new Date(`${dateStr}T00:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(guessUtc)

  const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0')
  const second = Number(parts.find((p) => p.type === 'second')?.value || '0')
  const deltaMs = (hour * 3600 + minute * 60 + second) * 1000
  return new Date(guessUtc.getTime() - deltaMs)
}

function madridDayRangeUtc(dateStr: string) {
  const startUtc = madridDayStartUtc(dateStr)
  const nextStartUtc = madridDayStartUtc(addDaysUtcDateStr(dateStr, 1))
  const endUtc = new Date(nextStartUtc.getTime() - 1)
  return { startUtc, endUtc }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const timeScale = searchParams.get('timeScale') || 'day'

    // Get user's clinic
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clinics } = await supabase.rpc('get_my_clinics')
    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ dataPoints: [], labels: [], highlightIndex: 0 })
    }

    const clinicId = clinics[0] as string

    // Treat `date` as a date-only anchor (YYYY-MM-DD) to avoid timezone drift.
    const anchorDate = new Date(`${date}T00:00:00Z`)
    let dataPoints: SeriesPoint[] = []
    let labels: string[] = []
    let totalFacturadoExact: number | null = null
    let invoiceDots: Array<{ day: number; cumulative: number }> | null = null
    let daysInMonthForResponse: number | null = null

    if (timeScale === 'day') {
      // Get all invoices for the selected day using Europe/Madrid day boundaries
      // Frontend will calculate cumulative from raw invoice + payment data
      const dateStr = date
      const { startUtc, endUtc } = madridDayRangeUtc(dateStr)
      const startTime = startUtc.toISOString()
      const endTime = endUtc.toISOString()
      
      // Use RPC function to get all invoices in time range
      const { data: invoices, error: rpcError } = await supabase.rpc('get_invoices_in_time_range', {
        p_clinic_id: clinicId,
        p_start_time: startTime,
        p_end_time: endTime
      })

      let finalInvoices: any[] = []

      if (rpcError) {
        console.error('Error calling get_invoices_in_time_range:', rpcError)
        // Fallback to direct query if RPC fails
        // Try issue_timestamp first, fallback to issue_date if not available
        const { data: fallbackInvoices, error: queryError } = await supabase
          .from('invoices')
          .select('id, invoice_number, total_amount, issue_timestamp, status, patient_id')
          .eq('clinic_id', clinicId)
          .or(`issue_timestamp.gte.${startTime},issue_timestamp.lte.${endTime},and(issue_timestamp.is.null,issue_date.eq.${dateStr})`)
          .order('issue_timestamp', { ascending: true, nullsFirst: false })

        if (queryError) {
          console.error('Error fetching invoices:', queryError)
          // Final fallback: use issue_date
          const { data: dateInvoices } = await supabase
            .from('invoices')
            .select('id, invoice_number, total_amount, issue_timestamp, status, patient_id')
            .eq('clinic_id', clinicId)
            .eq('issue_date', dateStr)
            .order('issue_timestamp', { ascending: true, nullsFirst: false })
          
          finalInvoices = dateInvoices || []
        } else {
          // Filter by time range for invoices with issue_timestamp
          finalInvoices = (fallbackInvoices || []).filter((inv: any) => {
            if (inv.issue_timestamp) {
              const invTime = new Date(inv.issue_timestamp)
              return invTime >= new Date(startTime) && invTime <= new Date(endTime)
            }
            // If no issue_timestamp, include if issue_date matches
            return true
          })
        }
      } else {
        finalInvoices = invoices || []
      }

      console.log(`[Trend API] Found ${finalInvoices.length} invoices for day ${dateStr}`)

      // Fetch payments for the same day (used for "Cobrado" series in FE)
      const { data: dayPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, transaction_date')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', startTime)
        .lte('transaction_date', endTime)

      if (paymentsError) {
        console.error('[Trend API] Error fetching day payments:', paymentsError)
      }
      
      // Get target value for the day (based on selected month/year)
      const currentYear = anchorDate.getUTCFullYear()
      const currentMonth = anchorDate.getUTCMonth()
      const { data: monthlyGoal } = await supabase
        .from('monthly_goals')
        .select('revenue_goal')
        .eq('clinic_id', clinicId)
        .eq('year', currentYear)
        .eq('month', currentMonth + 1)
        .maybeSingle()

      // Default fallback: ~500 EUR per day (reasonable daily target)
      let targetValue = 0.5
      if (monthlyGoal?.revenue_goal) {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        targetValue = Number(monthlyGoal.revenue_goal) / daysInMonth / 1000 // Convert to thousands
      }

      // Return raw invoices - frontend will calculate cumulative
      return NextResponse.json({
        invoices: finalInvoices,
        payments: dayPayments || [],
        timeRange: { start: startTime, end: endTime },
        timeScale: 'day',
        targetValue: Math.round(targetValue * 10) / 10
      })
    } else if (timeScale === 'week') {
      // Week view: 7 daily points for the selected week (Mon–Sun),
      // with a dot only on days that have invoices.
      const anchorDay = anchorDate.getUTCDay() // 0=Sun..6=Sat
      const diffToMonday = (anchorDay + 6) % 7 // Monday => 0
      const weekStart = new Date(anchorDate)
      weekStart.setUTCDate(anchorDate.getUTCDate() - diffToMonday)
      const weekEnd = new Date(weekStart)
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      const weekStartRange = madridDayRangeUtc(weekStartStr)
      const weekEndNextUtc = madridDayStartUtc(addDaysUtcDateStr(weekEndStr, 1))
      const startTime = weekStartRange.startUtc.toISOString()
      const endTime = new Date(weekEndNextUtc.getTime() - 1).toISOString()

      // Prefer DB-side aggregation (fast). Fallback to invoice row fetching if RPC not deployed.
      const dayTotalsRpc = await supabase.rpc('get_invoice_totals_by_day', {
        p_clinic_id: clinicId,
        p_start_time: startTime,
        p_end_time: endTime
      })

      const byDay = new Map<string, { sum: number; count: number }>()
      const paymentsByDay = new Map<string, { sum: number; count: number }>()
      if (!dayTotalsRpc.error && Array.isArray(dayTotalsRpc.data)) {
        for (const row of dayTotalsRpc.data as any[]) {
          const dateKey = String(row.day) // YYYY-MM-DD
          byDay.set(dateKey, {
            sum: Number(row.total_amount || 0),
            count: Number(row.invoice_count || 0)
          })
        }
        totalFacturadoExact = (dayTotalsRpc.data as any[]).reduce(
          (sum: number, r: any) => sum + Number(r.total_amount || 0),
          0
        )
      } else {
        const { data: weekInvoices, error: weekError } = await supabase.rpc(
          'get_invoices_in_time_range',
          {
            p_clinic_id: clinicId,
            p_start_time: startTime,
            p_end_time: endTime
          }
        )
        if (weekError) {
          console.error('[Trend API] Error fetching week invoices:', weekError)
        }
        totalFacturadoExact = (weekInvoices || []).reduce(
          (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
          0
        )

        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })

        for (const inv of weekInvoices || []) {
          if (!inv.issue_timestamp) continue
          const dateKey = formatter.format(new Date(inv.issue_timestamp))
          const entry = byDay.get(dateKey) || { sum: 0, count: 0 }
          entry.sum += Number(inv.total_amount || 0)
          entry.count += 1
          byDay.set(dateKey, entry)
        }
      }

      // Payments for week (Cobrado cumulative)
      const { data: weekPayments, error: weekPaymentsError } = await supabase
        .from('payments')
        .select('amount, transaction_date')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', startTime)
        .lte('transaction_date', endTime)
      if (weekPaymentsError) {
        console.error('[Trend API] Error fetching week payments:', weekPaymentsError)
      }
      const payFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      for (const p of weekPayments || []) {
        if (!(p as any).transaction_date) continue
        const dateKey = payFormatter.format(new Date((p as any).transaction_date))
        const entry = paymentsByDay.get(dateKey) || { sum: 0, count: 0 }
        entry.sum += Number((p as any).amount || 0)
        entry.count += 1
        paymentsByDay.set(dateKey, entry)
      }

      let producedCum = 0
      let collectedCum = 0
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart)
        dayDate.setUTCDate(weekStart.getUTCDate() + i)
        const dateKey = dayDate.toISOString().split('T')[0]
        const dayEntry = byDay.get(dateKey) || { sum: 0, count: 0 }
        const payEntry = paymentsByDay.get(dateKey) || { sum: 0, count: 0 }
        producedCum += dayEntry.sum
        collectedCum += payEntry.sum

        const label = `${dayDate.getUTCDate()}/${dayDate.getUTCMonth() + 1}`
        dataPoints.push({
          label,
          actual: Math.round((producedCum / 1000) * 100) / 100,
          collected: Math.round((collectedCum / 1000) * 100) / 100,
          invoiceCount: dayEntry.count,
          paymentCount: payEntry.count,
          bucketStart: dateKey,
          bucketEnd: dateKey
        })
      }

      labels = dataPoints.map((p) => p.label)
    } else if (timeScale === 'month') {
      // Parse the date string to get year and month
      const dateParts = date.split('-')
      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1 // JavaScript months are 0-indexed
      
      // Show cumulative daily data for the selected month.
      // We keep a reduced set of X labels (invoice days + 1st + last),
      // but we include `invoiceCount` per point so frontend can render dots.
      const monthStartDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const monthEnd = new Date(Date.UTC(year, month + 1, 0))
      const daysInMonth = monthEnd.getUTCDate()
      const monthEndDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
      daysInMonthForResponse = daysInMonth

      const monthStartUtc = madridDayStartUtc(monthStartDate)
      const monthEndNextUtc = madridDayStartUtc(addDaysUtcDateStr(monthEndDate, 1))
      const startTime = monthStartUtc.toISOString()
      const endTime = new Date(monthEndNextUtc.getTime() - 1).toISOString()

      const byDay = new Map<number, { sum: number; count: number }>()
      const paymentsByDay = new Map<number, { sum: number; count: number }>()

      // Prefer DB-side aggregation (fast). Fallback to invoice row fetching if RPC not deployed.
      const dayTotalsRpc = await supabase.rpc('get_invoice_totals_by_day', {
        p_clinic_id: clinicId,
        p_start_time: startTime,
        p_end_time: endTime
      })

      if (!dayTotalsRpc.error && Array.isArray(dayTotalsRpc.data)) {
        totalFacturadoExact = (dayTotalsRpc.data as any[]).reduce(
          (sum: number, r: any) => sum + Number(r.total_amount || 0),
          0
        )
        for (const row of dayTotalsRpc.data as any[]) {
          const dateStr = String(row.day) // YYYY-MM-DD
          const parts = dateStr.split('-')
          const invYear = Number(parts[0])
          const invMonth = Number(parts[1])
          const invDay = Number(parts[2])
          if (invYear !== year || invMonth !== month + 1) continue
          byDay.set(invDay, {
            sum: Number(row.total_amount || 0),
            count: Number(row.invoice_count || 0)
          })
        }
      } else {
        const { data: allMonthInvoices, error: monthError } = await supabase.rpc(
          'get_invoices_in_time_range',
          {
            p_clinic_id: clinicId,
            p_start_time: startTime,
            p_end_time: endTime
          }
        )
        if (monthError) {
          console.error('[Trend API] Error fetching month invoices:', monthError)
        }
        totalFacturadoExact = (allMonthInvoices || []).reduce(
          (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
          0
        )

        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })

        for (const inv of allMonthInvoices || []) {
          if (!inv.issue_timestamp) continue
          const dateKey = formatter.format(new Date(inv.issue_timestamp)) // YYYY-MM-DD
          const parts = dateKey.split('-')
          const invYear = Number(parts[0])
          const invMonth = Number(parts[1])
          const invDay = Number(parts[2])
          if (invYear !== year || invMonth !== month + 1) continue
          const entry = byDay.get(invDay) || { sum: 0, count: 0 }
          entry.sum += Number(inv.total_amount || 0)
          entry.count += 1
          byDay.set(invDay, entry)
        }
      }

      // Payments for month (Cobrado cumulative)
      const { data: monthPayments, error: monthPaymentsError } = await supabase
        .from('payments')
        .select('amount, transaction_date')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', startTime)
        .lte('transaction_date', endTime)
      if (monthPaymentsError) {
        console.error('[Trend API] Error fetching month payments:', monthPaymentsError)
      }
      for (const p of monthPayments || []) {
        if (!(p as any).transaction_date) continue
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
          .format(new Date((p as any).transaction_date))
          .split('-')
        const py = Number(parts[0])
        const pm = Number(parts[1])
        const pd = Number(parts[2])
        if (py !== year || pm !== month + 1) continue
        const entry = paymentsByDay.get(pd) || { sum: 0, count: 0 }
        entry.sum += Number((p as any).amount || 0)
        entry.count += 1
        paymentsByDay.set(pd, entry)
      }

      // Build cumulative totals per day across the entire month (1..daysInMonth)
      const cumulativeByDay: number[] = new Array(daysInMonth + 1).fill(0)
      const cumulativeCollectedByDay: number[] = new Array(daysInMonth + 1).fill(0)
      let running = 0
      let runningCollected = 0
      for (let day = 1; day <= daysInMonth; day++) {
        running += byDay.get(day)?.sum || 0
        cumulativeByDay[day] = running
        runningCollected += paymentsByDay.get(day)?.sum || 0
        cumulativeCollectedByDay[day] = runningCollected
      }

      // Use a fixed set of sample labels for stable spacing,
      // but chart data includes EVERY day so dots land exactly on the line.
      const sampleDays = [1, 5, 10, 15, 20, 25, 30]
      const daysToShow = new Set<number>()
      for (const d of sampleDays) {
        if (d >= 1 && d <= daysInMonth) daysToShow.add(d)
      }
      daysToShow.add(daysInMonth)

      // Also include anchor day (helps when navigating month)
      const anchorDay = anchorDate.getUTCDate()
      if (anchorDay >= 1 && anchorDay <= daysInMonth) daysToShow.add(anchorDay)

      labels = Array.from(daysToShow)
        .sort((a, b) => a - b)
        .map((day) => `${day}/${month + 1}`)

      for (let day = 1; day <= daysInMonth; day++) {
        const entry = byDay.get(day) || { sum: 0, count: 0 }
        const cumulativeTotal = cumulativeByDay[day] || 0
        const payEntry = paymentsByDay.get(day) || { sum: 0, count: 0 }
        const cumulativeCollected = cumulativeCollectedByDay[day] || 0
        const bucketStart = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        dataPoints.push({
          label: `${day}/${month + 1}`,
          actual: Math.round((cumulativeTotal / 1000) * 100) / 100,
          collected: Math.round((cumulativeCollected / 1000) * 100) / 100,
          invoiceCount: entry.count,
          paymentCount: payEntry.count,
          bucketStart,
          bucketEnd: bucketStart
        })
      }
    } else if (timeScale === 'year') {
      // Year view: 12 monthly points for selected year (cumulative).
      const year = Number(date.split('-')[0])
      const yearStartDate = `${year}-01-01`
      const yearEndDate = `${year}-12-31`

      const yearStartUtc = madridDayStartUtc(yearStartDate)
      const yearEndNextUtc = madridDayStartUtc(addDaysUtcDateStr(yearEndDate, 1))
      const startTime = yearStartUtc.toISOString()
      const endTime = new Date(yearEndNextUtc.getTime() - 1).toISOString()

      const monthTotals = new Array<{ sum: number; count: number }>(12)
        .fill(null as any)
        .map(() => ({ sum: 0, count: 0 }))
      const monthCollectedTotals = new Array<{ sum: number; count: number }>(12)
        .fill(null as any)
        .map(() => ({ sum: 0, count: 0 }))

      // Prefer DB-side day aggregation (fast, bounded ~366 rows) and roll up to months.
      const dayTotalsRpc = await supabase.rpc('get_invoice_totals_by_day', {
        p_clinic_id: clinicId,
        p_start_time: startTime,
        p_end_time: endTime
      })

      if (!dayTotalsRpc.error && Array.isArray(dayTotalsRpc.data)) {
        for (const row of dayTotalsRpc.data as any[]) {
          const dateStr = String(row.day) // YYYY-MM-DD (Madrid day)
          const parts = dateStr.split('-')
          const y = Number(parts[0])
          const m = Number(parts[1]) // 1..12
          if (y !== year || m < 1 || m > 12) continue
          monthTotals[m - 1].sum += Number(row.total_amount || 0)
          monthTotals[m - 1].count += Number(row.invoice_count || 0)
        }
        totalFacturadoExact = monthTotals.reduce((s, m) => s + m.sum, 0)
      } else {
        const { data: allYearInvoices, error: yearError } = await supabase.rpc(
          'get_invoices_in_time_range',
          {
            p_clinic_id: clinicId,
            p_start_time: startTime,
            p_end_time: endTime
          }
        )
        if (yearError) {
          console.error('[Trend API] Error fetching year invoices:', yearError)
        }

        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })

        for (const inv of allYearInvoices || []) {
          if (!inv.issue_timestamp) continue
          const dateKey = formatter.format(new Date(inv.issue_timestamp)) // YYYY-MM-DD
          const parts = dateKey.split('-')
          const invYear = Number(parts[0])
          const invMonth = Number(parts[1])
          if (invYear !== year || invMonth < 1 || invMonth > 12) continue
          monthTotals[invMonth - 1].sum += Number(inv.total_amount || 0)
          monthTotals[invMonth - 1].count += 1
        }

        totalFacturadoExact = monthTotals.reduce((s, m) => s + m.sum, 0)
      }

      // Payments for year (Cobrado cumulative)
      const { data: yearPayments, error: yearPaymentsError } = await supabase
        .from('payments')
        .select('amount, transaction_date')
        .eq('clinic_id', clinicId)
        .gte('transaction_date', startTime)
        .lte('transaction_date', endTime)
      if (yearPaymentsError) {
        console.error('[Trend API] Error fetching year payments:', yearPaymentsError)
      }
      const ymFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit'
      })
      for (const p of yearPayments || []) {
        if (!(p as any).transaction_date) continue
        const parts = ymFormatter.formatToParts(new Date((p as any).transaction_date))
        const py = Number(parts.find((x) => x.type === 'year')?.value || '0')
        const pm = Number(parts.find((x) => x.type === 'month')?.value || '0')
        if (py !== year || pm < 1 || pm > 12) continue
        monthCollectedTotals[pm - 1].sum += Number((p as any).amount || 0)
        monthCollectedTotals[pm - 1].count += 1
      }

      const monthLabelFormatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
      labels = Array.from({ length: 12 }, (_, idx) => {
        const d = new Date(Date.UTC(year, idx, 1))
        return monthLabelFormatter.format(d)
      })

      let running = 0
      let runningCollected = 0
      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        running += monthTotals[monthIdx].sum
        runningCollected += monthCollectedTotals[monthIdx].sum
        const monthStart = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`
        const monthEnd = new Date(Date.UTC(year, monthIdx + 2, 0)).getUTCDate()
        const bucketEnd = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(monthEnd).padStart(2, '0')}`
        dataPoints.push({
          label: labels[monthIdx],
          actual: Math.round((running / 1000) * 100) / 100,
          collected: Math.round((runningCollected / 1000) * 100) / 100,
          invoiceCount: monthTotals[monthIdx].count,
          paymentCount: monthCollectedTotals[monthIdx].count,
          bucketStart: monthStart,
          bucketEnd
        })
      }
    }

    // Get monthly goal for target line
    // For month view, use parsed date; otherwise use anchorDate
    let currentMonth: number
    let currentYear: number
    if (timeScale === 'month') {
      const dateParts = date.split('-')
      currentYear = parseInt(dateParts[0])
      currentMonth = parseInt(dateParts[1])
    } else if (timeScale === 'year') {
      currentYear = parseInt(date.split('-')[0])
      currentMonth = anchorDate.getMonth() + 1
    } else {
      currentMonth = anchorDate.getMonth() + 1
      currentYear = anchorDate.getFullYear()
    }
    const { data: monthlyGoal } = await supabase
      .from('monthly_goals')
      .select('revenue_goal')
      .eq('clinic_id', clinicId)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .maybeSingle()

    // For year view, use sum of monthly goals (if present) as a single objective band.
    let yearGoalTotal: number | null = null
    if (timeScale === 'year') {
      const { data: goals } = await supabase
        .from('monthly_goals')
        .select('revenue_goal, month')
        .eq('clinic_id', clinicId)
        .eq('year', currentYear)
      yearGoalTotal =
        (goals || []).reduce((sum: number, g: any) => sum + Number(g.revenue_goal || 0), 0) ||
        0
    }

    // Calculate target based on time scale
    let targetValue = 0.5 // Default fallback (500 EUR/day)
    if (timeScale === 'year' && yearGoalTotal !== null && yearGoalTotal > 0) {
      targetValue = yearGoalTotal / 1000
    } else if (monthlyGoal?.revenue_goal) {
      if (timeScale === 'day') {
        // For day view: daily target = monthly goal / days in month
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
        targetValue = Number(monthlyGoal.revenue_goal) / daysInMonth / 1000 // Convert to thousands
      } else if (timeScale === 'week') {
        // Weekly target = monthly goal / 4.33 (average weeks per month)
        targetValue = Number(monthlyGoal.revenue_goal) / 4.33 / 1000 // Convert to thousands
      } else {
        // Monthly target = full monthly goal
        targetValue = Number(monthlyGoal.revenue_goal) / 1000 // Convert to thousands
      }
    } else {
      // Fallback values in thousands: 0.5K/day, 2K/week, 10K/month
      targetValue = timeScale === 'day' ? 0.5 : timeScale === 'week' ? 2 : timeScale === 'year' ? 120 : 10
    }

    // Highlight index:
    // - week: highlight anchor day within the 7-day window
    // - month: highlight anchor day if present, else last point
    let highlightIndex = dataPoints.length - 1
    if (timeScale === 'week') {
      // Since we always return 7 points (Mon–Sun), anchor day is deterministic.
      const anchorDay = anchorDate.getUTCDay()
      const diffToMonday = (anchorDay + 6) % 7
      const idx = diffToMonday === 0 ? 0 : diffToMonday
      // Actually we want day offset from Monday: (anchorDay+6)%7
      highlightIndex = (anchorDay + 6) % 7
    } else if (timeScale === 'month') {
      const anchorDayOfMonth = anchorDate.getUTCDate()
      const idx = dataPoints.findIndex((p) => p.label.startsWith(`${anchorDayOfMonth}/`))
      highlightIndex = idx >= 0 ? idx : dataPoints.length - 1
    } else if (timeScale === 'year') {
      const anchorMonthIdx = anchorDate.getUTCMonth()
      highlightIndex = Math.max(0, Math.min(11, anchorMonthIdx))
    }

    // Total facturado must be derived from raw invoice totals (not rounded chart points),
    // otherwise it will lose cents and can display "1800,0" for "1811,6".
    const totalFacturado = totalFacturadoExact ?? 0
    
    // For week/month views, return pre-calculated dataPoints
    // (Day view already returned early with raw invoices)
    return NextResponse.json({
      dataPoints,
      labels,
      highlightIndex,
      targetValue: Math.round(targetValue * 10) / 10, // Round to 1 decimal
      totalFacturado: Math.round(totalFacturado * 10) / 10, // Total in EUR, 1 decimal
      daysInMonth: daysInMonthForResponse
    })
  } catch (error: any) {
    console.error('Error in cash trend API:', error)
    return NextResponse.json({ error: error?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

function getWeekOfYear(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = Math.floor((Number(date) - Number(firstDayOfYear)) / 86400000)
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

