import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type SeriesPoint = {
  label: string
  actual: number
  invoiceCount?: number
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
      // Get all invoices for the selected day (full day: 00:00 - 23:59)
      // Frontend will calculate cumulative from raw invoice data
      const dateStr = anchorDate.toISOString().split('T')[0]
      const startTime = `${dateStr}T00:00:00Z`
      const endTime = `${dateStr}T23:59:59Z`
      
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
      
      // Get target value for the day
      const currentYear = anchorDate.getFullYear()
      const currentMonth = anchorDate.getMonth()
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
      const startTime = `${weekStartStr}T00:00:00Z`
      const endTime = `${weekEndStr}T23:59:59Z`

      const { data: weekInvoices, error: weekError } = await supabase.rpc('get_invoices_in_time_range', {
        p_clinic_id: clinicId,
        p_start_time: startTime,
        p_end_time: endTime
      })
      if (weekError) {
        console.error('[Trend API] Error fetching week invoices:', weekError)
      }
      totalFacturadoExact = (weekInvoices || []).reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      )

      const byDay = new Map<string, { sum: number; count: number }>()
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

      let cumulativeTotal = 0
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart)
        dayDate.setUTCDate(weekStart.getUTCDate() + i)
        const dateKey = dayDate.toISOString().split('T')[0]
        const dayEntry = byDay.get(dateKey) || { sum: 0, count: 0 }
        cumulativeTotal += dayEntry.sum

        const label = `${dayDate.getUTCDate()}/${dayDate.getUTCMonth() + 1}`
        dataPoints.push({
          label,
          actual: Math.round((cumulativeTotal / 1000) * 100) / 100,
          invoiceCount: dayEntry.count
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

      const { data: allMonthInvoices, error: monthError } = await supabase.rpc('get_invoices_in_time_range', {
        p_clinic_id: clinicId,
        p_start_time: `${monthStartDate}T00:00:00Z`,
        p_end_time: `${monthEndDate}T23:59:59Z`
      })
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

      const byDay = new Map<number, { sum: number; count: number }>()
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

      // Build cumulative totals per day across the entire month (1..daysInMonth)
      const cumulativeByDay: number[] = new Array(daysInMonth + 1).fill(0)
      let running = 0
      for (let day = 1; day <= daysInMonth; day++) {
        running += byDay.get(day)?.sum || 0
        cumulativeByDay[day] = running
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
        dataPoints.push({
          label: `${day}/${month + 1}`,
          actual: Math.round((cumulativeTotal / 1000) * 100) / 100,
          invoiceCount: entry.count
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

    // Calculate target based on time scale
    let targetValue = 0.5 // Default fallback (500 EUR/day)
    if (monthlyGoal?.revenue_goal) {
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
      targetValue = timeScale === 'day' ? 0.5 : timeScale === 'week' ? 2 : 10
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

