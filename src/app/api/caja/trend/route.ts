import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type SeriesPoint = {
  label: string
  actual: number
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

    const anchorDate = new Date(date)
    let dataPoints: SeriesPoint[] = []
    let labels: string[] = []

    if (timeScale === 'day') {
      // Last 7 days
      const formatter = new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
        day: 'numeric'
      })

      for (let delta = 6; delta >= 0; delta--) {
        const pointDate = new Date(anchorDate)
        pointDate.setDate(pointDate.getDate() - delta)

        const dateStr = pointDate.toISOString().split('T')[0]

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', `${dateStr}T00:00:00Z`)
          .lte('transaction_date', `${dateStr}T23:59:59Z`)

        const total = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
        const actual = total / 1000 // Convert to thousands

        dataPoints.push({
          label: formatter.format(pointDate),
          actual: Math.round(actual * 10) / 10
        })
      }

      labels = dataPoints.map((p) => p.label)
    } else if (timeScale === 'week') {
      // Last 4 weeks
      for (let delta = 3; delta >= 0; delta--) {
        const weekStart = new Date(anchorDate)
        weekStart.setDate(weekStart.getDate() - 7 * delta)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        const weekNumber = getWeekOfYear(weekStart)
        const startStr = weekStart.toISOString().split('T')[0]
        const endStr = weekEnd.toISOString().split('T')[0]

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', `${startStr}T00:00:00Z`)
          .lte('transaction_date', `${endStr}T23:59:59Z`)

        const total = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
        const actual = total / 1000

        dataPoints.push({
          label: `Sem ${weekNumber}`,
          actual: Math.round(actual * 10) / 10
        })
      }

      labels = dataPoints.map((p) => p.label)
    } else if (timeScale === 'month') {
      // Last 6 months
      const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })

      for (let delta = 5; delta >= 0; delta--) {
        const monthDate = new Date(anchorDate)
        monthDate.setMonth(monthDate.getMonth() - delta)
        monthDate.setDate(1)

        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        const startStr = monthDate.toISOString().split('T')[0]
        const endStr = lastDay.toISOString().split('T')[0]

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('clinic_id', clinicId)
          .gte('transaction_date', `${startStr}T00:00:00Z`)
          .lte('transaction_date', `${endStr}T23:59:59Z`)

        const total = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
        const actual = total / 1000

        dataPoints.push({
          label: formatter.format(monthDate),
          actual: Math.round(actual * 10) / 10
        })
      }

      labels = dataPoints.map((p) => p.label)
    }

    // Get monthly goal for target line
    const currentMonth = anchorDate.getMonth() + 1
    const currentYear = anchorDate.getFullYear()
    const { data: monthlyGoal } = await supabase
      .from('monthly_goals')
      .select('revenue_goal')
      .eq('clinic_id', clinicId)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .maybeSingle()

    // Calculate target based on time scale
    let targetValue = 30000 // Default fallback
    if (monthlyGoal?.revenue_goal) {
      if (timeScale === 'day') {
        // Daily target = monthly goal / days in month
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
        targetValue = Number(monthlyGoal.revenue_goal) / daysInMonth
      } else if (timeScale === 'week') {
        // Weekly target = monthly goal / 4.33 (average weeks per month)
        targetValue = Number(monthlyGoal.revenue_goal) / 4.33
      } else {
        // Monthly target = full monthly goal
        targetValue = Number(monthlyGoal.revenue_goal)
      }
      // Convert to thousands for chart display
      targetValue = targetValue / 1000
    } else {
      // Fallback to 30K if no goal set
      targetValue = 30
    }

    return NextResponse.json({
      dataPoints,
      labels,
      highlightIndex: dataPoints.length - 1,
      targetValue: Math.round(targetValue * 10) / 10 // Round to 1 decimal
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

