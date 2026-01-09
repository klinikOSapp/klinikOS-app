'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis
} from 'recharts'

type BillingLineChartProps = {
  yearLabel?: string
  timeScale: CashTimeScale
  anchorDate: Date
}

const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'

// Mock data con curvatura visible para demo
const CHART_DATA = [
  { month: 'Ene', brand: 8000, accent: 6500 },
  { month: 'Feb', brand: 15000, accent: 12500 },
  { month: 'Mar', brand: 10000, accent: 8500 },
  { month: 'Abr', brand: 32000, accent: 27000 },
  { month: 'May', brand: 50000, accent: 42500 },
  { month: 'Jun', brand: 34000, accent: 29000 },
  { month: 'Jul', brand: 30000, accent: 25500 },
  { month: 'Ago', brand: 42000, accent: 35500 },
  { month: 'Sept', brand: 24000, accent: 20500 },
  { month: 'Oct', brand: 36000, accent: 30500 },
  { month: 'Nov', brand: 28000, accent: 23500 },
  { month: 'Dic', brand: 52000, accent: 44000 }
]

const WEEKLY_MOCK_BRAND = [
  12000, 18000, 15000, 24000, 20000, 30000,
  26000, 34000, 28000, 36000, 31000, 40000
] as const

const Y_AXIS_LABELS = ['90K', '70K', '50K', '30K', '10K', '0']

export default function BillingLineChart({
  timeScale,
  anchorDate
}: BillingLineChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)

  const chartData = useMemo(
    () => buildChartData(timeScale, anchorDate),
    [timeScale, anchorDate]
  )

  const highlightIndex = useMemo(() => {
    if (chartData.length === 0) return 0
    if (timeScale !== 'month') return Math.max(0, chartData.length - 1)
    return Math.max(0, chartData.length - 2)
  }, [chartData.length, timeScale])

  const lineClipPercent =
    chartData.length > 1 ? highlightIndex / Math.max(chartData.length - 1, 1) : 0

  const highlightLabel = chartData[highlightIndex]?.month ?? null
  const highlightValue = chartData[highlightIndex]?.brand ?? null
  const highlightAccentValue = chartData[highlightIndex]?.accent ?? null

  useEffect(() => setIsMounted(true), [])

  // Comparison panel data
  const comparisonMonth = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' })
    return formatter.format(anchorDate)
  }, [anchorDate])

  const prevYearMonth = useMemo(() => {
    const prevYear = new Date(anchorDate)
    prevYear.setFullYear(prevYear.getFullYear() - 1)
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' })
    return formatter.format(prevYear)
  }, [anchorDate])

  return (
    <section
      className='relative flex w-full flex-col overflow-hidden rounded-lg bg-surface shadow-elevation-card'
      style={{ height: CARD_HEIGHT_VAR }}
    >
      {/* Header */}
      <header className='flex shrink-0 items-baseline justify-between px-4 pt-4'>
        <h3 className='text-title-sm font-medium text-fg'>Facturación</h3>
      </header>

      {/* Main content area */}
      <div className='flex flex-1 gap-3 overflow-hidden px-4 pb-4'>
        {/* Chart area - takes remaining space */}
        <div className='flex min-w-0 flex-1 flex-col'>
          {/* Y-axis + Chart grid container */}
          <div className='flex flex-1'>
            {/* Y-axis labels */}
            <div className='flex w-10 shrink-0 flex-col justify-between py-2 text-label-sm font-normal text-neutral-400'>
              {Y_AXIS_LABELS.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>

            {/* Chart area */}
            <div className='relative flex-1' ref={chartContainerRef}>
              {/* Grid background */}
              <div
                className='absolute inset-0'
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, var(--chart-grid) 1px, transparent 1px), linear-gradient(to right, var(--chart-grid) 1px, transparent 1px)',
                  backgroundSize: '100% calc(100% / 5), calc(100% / 11) 100%',
                  backgroundPosition: 'left top, left top'
                }}
              />

              {/* Recharts container */}
              <div className='absolute inset-0'>
                {isMounted && (
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                    >
                      <XAxis dataKey='month' hide />
                      <YAxis domain={[0, 90000]} hide />
                      {/* Accent line (dashed) */}
                      <Line
                        type='monotone'
                        dataKey='accent'
                        stroke='#D4B5FF'
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        strokeDasharray='4 4'
                        dot={false}
                        animationDuration={1200}
                        animationBegin={150}
                        connectNulls
                      />
                      {/* Brand line (solid) */}
                      <Line
                        type='monotone'
                        dataKey='brand'
                        stroke='#51D6C7'
                        strokeWidth={2}
                        dot={false}
                        animationDuration={1200}
                        animationBegin={0}
                        connectNulls
                      />
                      <Tooltip content={<ChartTooltip />} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Current period vertical line */}
              <div
                className='pointer-events-none absolute top-0 h-full w-px bg-[var(--color-warning-200,#FFD188)]'
                style={{ left: `${lineClipPercent * 100}%` }}
              />

              {/* Highlight point */}
              {highlightValue !== null && (
                <div
                  className='pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-warning-200,#FFD188)] shadow-elevation-card'
                  style={{
                    left: `${lineClipPercent * 100}%`,
                    top: `${(1 - Math.min(Math.max(highlightValue / 90000, 0), 1)) * 100}%`
                  }}
                />
              )}

              {/* Period label badge */}
              {highlightLabel && (
                <div
                  className='pointer-events-none absolute -translate-x-1/2 rounded-full bg-surface px-2 py-1 text-label-sm font-medium text-neutral-700 shadow-elevation-card'
                  style={{
                    left: `${lineClipPercent * 100}%`,
                    top: '-0.5rem'
                  }}
                >
                  {highlightLabel}
                </div>
              )}

              {/* Value badge (brand) */}
              {highlightValue !== null && (
                <div
                  className='pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-brandSemantic bg-brand-50 px-2 py-1 text-label-sm font-normal text-brandSemantic'
                  style={{
                    left: `${lineClipPercent * 100}%`,
                    top: `calc(${(1 - Math.min(Math.max(highlightValue / 90000, 0), 1)) * 100}% - 2rem)`
                  }}
                />
              )}
            </div>
          </div>

          {/* X-axis labels */}
          <div className='mt-1 flex shrink-0 justify-between pl-10 text-label-sm font-normal text-neutral-400'>
            {chartData.map((point, idx) => (
              <span key={`${point.month}-${idx}`} className='truncate'>
                {point.month}
              </span>
            ))}
          </div>
        </div>

        {/* Comparison panel - fixed width */}
        <div className='flex w-[9rem] shrink-0 flex-col justify-between rounded-lg border border-neutral-300 bg-surface p-3'>
          <div className='flex flex-col gap-1'>
            <p className='text-body-sm font-medium capitalize text-neutral-600'>
              {comparisonMonth}
            </p>
            <p className='text-xl font-semibold text-neutral-600'>
              {(highlightValue ?? 42000).toLocaleString('es-ES')}
            </p>
            <div className='flex items-center gap-1'>
              <span className='text-sm text-brand-500'>+ 6%</span>
              <span className='material-symbols-rounded text-brand-500 text-base'>
                arrow_outward
              </span>
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <p className='text-label-sm font-normal capitalize text-neutral-500'>
              {prevYearMonth}
            </p>
            <p className='text-sm font-medium text-info-200'>
              {(highlightAccentValue ?? 40000).toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

type ChartTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{ dataKey?: string; value?: number }>
  label?: string
}

function ChartTooltip(props: ChartTooltipProps) {
  const { active, payload, label } = props
  if (!active || !payload || payload.length === 0) return null
  const brand =
    (payload.find((p) => p.dataKey === 'brandClipped')?.value ??
      payload.find((p) => p.dataKey === 'brand')?.value) ?? null
  const accent =
    (payload.find((p) => p.dataKey === 'accentClipped')?.value ??
      payload.find((p) => p.dataKey === 'accent')?.value) ?? null

  return (
    <div className='rounded-md border border-border bg-surface px-2 py-1.5 text-label-sm text-neutral-700 shadow-elevation-card'>
      <div className='font-medium text-neutral-900'>{label}</div>
      {typeof brand === 'number' && (
        <div className='flex items-center gap-1.5 text-brandSemantic'>
          <span className='inline-block h-2 w-2 rounded-full bg-brandSemantic' />
          <span>{brand.toLocaleString('es-ES')} €</span>
        </div>
      )}
      {typeof accent === 'number' && (
        <div className='flex items-center gap-1.5 text-info-200'>
          <span className='inline-block h-2 w-2 rounded-full bg-info-200' />
          <span>{accent.toLocaleString('es-ES')} €</span>
        </div>
      )}
    </div>
  )
}

type ChartPoint = { month: string; brand: number; accent: number }

function buildChartData(scale: CashTimeScale, anchorDate: Date): ChartPoint[] {
  switch (scale) {
    case 'week':
      return buildWeeklyData(anchorDate)
    case 'month':
    default:
      return buildMonthlyData(anchorDate)
  }
}

function buildMonthlyData(anchorDate: Date): ChartPoint[] {
  const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
  const months = Math.min(12, CHART_DATA.length)
  const source = CHART_DATA.slice(-months)
  return source.map((point, idx) => {
    const date = new Date(anchorDate)
    date.setMonth(anchorDate.getMonth() - (months - 1 - idx))
    return {
      ...point,
      month: formatter.format(date)
    }
  })
}

function buildWeeklyData(anchorDate: Date): ChartPoint[] {
  const data: ChartPoint[] = []
  const weeks = WEEKLY_MOCK_BRAND.length
  for (let delta = 11; delta >= 0; delta -= 1) {
    const start = startOfWeek(addDays(anchorDate, -7 * delta))
    const weekNumber = getWeekOfYear(start)
    const idx = weeks - 1 - delta
    const brand = WEEKLY_MOCK_BRAND[idx] ?? 15000
    const accent = Math.max(Math.round(brand * 0.88), 8000)
    data.push({
      month: `S${weekNumber}`,
      brand,
      accent
    })
  }
  return data
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay() || 7
  if (day !== 1) {
    copy.setDate(copy.getDate() - (day - 1))
  }
  return copy
}

function getWeekOfYear(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = Math.floor(
    (Number(date) - Number(firstDayOfYear)) / 86400000
  )
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
