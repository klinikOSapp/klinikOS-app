// Shared accounting data for Caja and Gestion dashboards

import type { CashTimeScale } from '@/components/caja/cajaTypes'

export type KpiCard = {
  id: string
  title: string
  value: string
  delta: string
  bg: string
  icon: string
}

export type DonutData = {
  data: Array<{ name: string; value: number; color: string }>
  progress: number
  valueLabel: string
  targetLabel: string
  value: number
  target: number
}

// Data totals by timeScale
const TOTALS_WEEK = {
  produced: '8.400 €',
  invoiced: '7.200 €',
  collected: '6.000 €',
  pending: '1.200 €',
  deltas: { produced: '+ 12%', invoiced: '+ 10%', collected: '+ 8%', pending: '- 5%' },
  donut: { value: 6000, target: 7200 }
}

const TOTALS_MONTH = {
  produced: '37.800 €',
  invoiced: '32.400 €',
  collected: '27.000 €',
  pending: '5.400 €',
  deltas: { produced: '+ 18%', invoiced: '+ 15%', collected: '+ 12%', pending: '- 3%' },
  donut: { value: 27000, target: 32400 }
}

const TOTALS_DAY = {
  produced: '1.200 €',
  invoiced: '1.029 €',
  collected: '857 €',
  pending: '172 €',
  deltas: { produced: '+ 8%', invoiced: '+ 6%', collected: '+ 5%', pending: '- 2%' },
  donut: { value: 857, target: 1029 }
}

export function getAccountingKpis(timeScale: CashTimeScale): KpiCard[] {
  const data = timeScale === 'month' ? TOTALS_MONTH : timeScale === 'day' ? TOTALS_DAY : TOTALS_WEEK

  return [
    {
      id: 'produced',
      title: 'Producido',
      value: data.produced,
      delta: data.deltas.produced,
      bg: 'var(--color-info-50)',
      icon: 'attach_money'
    },
    {
      id: 'invoiced',
      title: 'Facturado',
      value: data.invoiced,
      delta: data.deltas.invoiced,
      bg: '#e9f6fb',
      icon: 'receipt_long'
    },
    {
      id: 'collected',
      title: 'Cobrado',
      value: data.collected,
      delta: data.deltas.collected,
      bg: 'var(--color-brand-50)',
      icon: 'check_circle'
    },
    {
      id: 'pending',
      title: 'Por cobrar',
      value: data.pending,
      delta: data.deltas.pending,
      bg: 'var(--color-warning-50)',
      icon: 'hourglass_top'
    }
  ]
}

export function getAccountingDonut(timeScale: CashTimeScale): DonutData {
  const data = timeScale === 'month' ? TOTALS_MONTH : timeScale === 'day' ? TOTALS_DAY : TOTALS_WEEK
  const { value, target } = data.donut

  return {
    data: [
      { name: 'actual', value, color: 'var(--color-brand-500)' },
      {
        name: 'remaining',
        value: Math.max(target - value, 0),
        color: 'var(--color-brand-50)'
      }
    ],
    progress: value / target,
    valueLabel: value.toLocaleString('es-ES') + ' €',
    targetLabel: target.toLocaleString('es-ES') + ' €',
    value,
    target
  }
}

// Trend chart data types and functions
export type TrendDataPoint = {
  label: string
  value: number | null
}

export type TrendChartData = {
  dataPoints: TrendDataPoint[]
  currentPeriodIndex: number
  invoiced: number
  invoicedLabel: string
  target: number
  targetLabel: string
  maxValue: number
  yAxisLabels: string[]
}

// Mock data for values (indexed by week/month number)
const WEEKLY_VALUES = [6800, 7400, 6200, 7800, 7100, 8200, 7600, 6900, 7500, 8100, 7200, 7500]
const MONTHLY_VALUES = [28500, 30200, 31800, 29600, 33400, 31200, 26800, 18500, 32800, 34200, 33600, 32400]
const DAILY_VALUES = [1200, 1450, 980, 1680, 1520, 890, 0] // Lun-Dom

function generateYAxisLabels(maxValue: number): string[] {
  const steps = 5
  const labels: string[] = []
  for (let i = steps; i >= 0; i--) {
    const value = (maxValue / steps) * i
    if (value >= 1000) {
      labels.push(`${Math.round(value / 1000)}K`)
    } else {
      labels.push(`${Math.round(value)}`)
    }
  }
  return labels
}

function getWeekOfYear(date: Date): number {
  // Validate date
  if (!date || isNaN(date.getTime())) return 1
  
  // Simple week calculation based on day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)
  
  // Clamp to valid range 1-52
  if (weekNum > 52) return 52
  if (weekNum < 1) return 1
  return weekNum
}

function startOfWeek(date: Date): Date {
  if (!date || isNaN(date.getTime())) return new Date()
  const copy = new Date(date.getTime())
  const day = copy.getDay() || 7
  if (day !== 1) {
    copy.setDate(copy.getDate() - (day - 1))
  }
  return copy
}

function addDays(date: Date, amount: number): Date {
  if (!date || isNaN(date.getTime())) return new Date()
  const copy = new Date(date.getTime())
  copy.setDate(copy.getDate() + amount)
  return copy
}

export function getTrendChartData(timeScale: CashTimeScale, anchorDate: Date): TrendChartData {
  // Ensure we have a valid date
  const safeAnchorDate = anchorDate && !isNaN(anchorDate.getTime()) 
    ? new Date(anchorDate.getTime()) 
    : new Date()
  
  const dataPoints: TrendDataPoint[] = []
  let currentPeriodIndex = 0
  let invoiced = 0
  let target = 0

  if (timeScale === 'day') {
    // Show 7 days (Mon-Sun of current week)
    const weekStart = startOfWeek(safeAnchorDate)
    const currentDayOfWeek = (safeAnchorDate.getDay() + 6) % 7 // Mon=0, Sun=6
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    
    for (let i = 0; i < 7; i++) {
      const isFuture = i > currentDayOfWeek
      dataPoints.push({
        label: dayNames[i],
        value: isFuture ? null : DAILY_VALUES[i]
      })
    }
    currentPeriodIndex = currentDayOfWeek
    invoiced = DAILY_VALUES[currentDayOfWeek] ?? 0
    target = 1500

  } else if (timeScale === 'week') {
    // Show 8 weeks: 5 past + current + 2 future (like BillingLineChart)
    const currentWeekStart = startOfWeek(safeAnchorDate)
    const TOTAL_WEEKS = 8
    const FUTURE_WEEKS = 2
    const CURRENT_INDEX = TOTAL_WEEKS - FUTURE_WEEKS - 1 // Index 5
    
    for (let i = 0; i < TOTAL_WEEKS; i++) {
      const weekOffset = i - CURRENT_INDEX // -5 to +2
      const weekDate = addDays(currentWeekStart, weekOffset * 7)
      const weekNum = getWeekOfYear(weekDate)
      const dataIndex = Math.abs(weekNum) % WEEKLY_VALUES.length
      const isFuture = i > CURRENT_INDEX
      
      dataPoints.push({
        label: `Sem ${weekNum}`,
        value: isFuture ? null : WEEKLY_VALUES[dataIndex]
      })
    }
    currentPeriodIndex = CURRENT_INDEX
    invoiced = dataPoints[currentPeriodIndex]?.value ?? 0
    target = 8000

  } else {
    // Month: show 8 months: 5 past + current + 2 future
    const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
    const TOTAL_MONTHS = 8
    const FUTURE_MONTHS = 2
    const CURRENT_INDEX = TOTAL_MONTHS - FUTURE_MONTHS - 1 // Index 5
    
    for (let i = 0; i < TOTAL_MONTHS; i++) {
      const monthOffset = i - CURRENT_INDEX // -5 to +2
      const monthDate = new Date(safeAnchorDate.getFullYear(), safeAnchorDate.getMonth() + monthOffset, 1)
      const monthLabel = monthFormatter.format(monthDate)
      const monthIndex = monthDate.getMonth()
      const isFuture = i > CURRENT_INDEX
      
      dataPoints.push({
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        value: isFuture ? null : MONTHLY_VALUES[monthIndex]
      })
    }
    currentPeriodIndex = CURRENT_INDEX
    invoiced = dataPoints[currentPeriodIndex]?.value ?? 0
    target = 35000
  }

  // Calculate max value for Y axis
  const validValues = dataPoints.filter(d => d.value !== null).map(d => d.value as number)
  const maxDataValue = Math.max(...validValues, invoiced, target)
  const maxValue = timeScale === 'day' 
    ? Math.ceil(maxDataValue / 500) * 500 + 500
    : Math.ceil(maxDataValue / 1000) * 1000 + 2000

  return {
    dataPoints,
    currentPeriodIndex,
    invoiced,
    invoicedLabel: invoiced.toLocaleString('es-ES') + ' €',
    target,
    targetLabel: target.toLocaleString('es-ES') + ' €',
    maxValue,
    yAxisLabels: generateYAxisLabels(maxValue)
  }
}
