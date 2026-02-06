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
import type { Specialty, SpecialtyFilter } from './gestionTypes'

type BillingLineChartProps = {
  yearLabel?: string
  timeScale: CashTimeScale
  anchorDate: Date
  selectedSpecialty?: SpecialtyFilter
}

const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'

// Datos mensuales realistas para clínica dental (~32.400€/mes facturado)
// brand = año actual, accent = año anterior (comparativa)
const CHART_DATA = [
  { month: 'Ene', brand: 28500, accent: 24000 },
  { month: 'Feb', brand: 30200, accent: 26500 },
  { month: 'Mar', brand: 31800, accent: 27800 },
  { month: 'Abr', brand: 29600, accent: 25200 },
  { month: 'May', brand: 33400, accent: 29000 },
  { month: 'Jun', brand: 31200, accent: 27500 },
  { month: 'Jul', brand: 26800, accent: 23500 }, // Julio baja (vacaciones)
  { month: 'Ago', brand: 18500, accent: 16200 }, // Agosto muy bajo
  { month: 'Sept', brand: 32800, accent: 28600 },
  { month: 'Oct', brand: 34200, accent: 30100 },
  { month: 'Nov', brand: 33600, accent: 29400 },
  { month: 'Dic', brand: 32400, accent: 28800 }
]

// Datos semanales realistas (~7.200€/semana facturado)
// brand = semana actual, accent = misma semana año anterior
const WEEKLY_DATA = [
  { brand: 6800, accent: 6100 },
  { brand: 7400, accent: 6600 },
  { brand: 6200, accent: 5800 },
  { brand: 7800, accent: 7000 },
  { brand: 7100, accent: 6400 },
  { brand: 8200, accent: 7300 },
  { brand: 7600, accent: 6900 },
  { brand: 6900, accent: 6200 },
  { brand: 7500, accent: 6800 },
  { brand: 8100, accent: 7200 },
  { brand: 7200, accent: 6500 },
  { brand: 7200, accent: 6400 }
] as const

// Porcentajes de facturación por especialidad (suman 100%)
const SPECIALTY_PERCENTAGES: Record<Specialty, number> = {
  Conservadora: 0.4, // 40%
  Ortodoncia: 0.3, // 30%
  Implantes: 0.2, // 20%
  Estética: 0.1 // 10%
}

// Escalas Y dinámicas según timeScale
const Y_CONFIG = {
  month: {
    domain: [0, 40000] as [number, number],
    labels: ['40K', '32K', '24K', '16K', '8K', '0']
  },
  week: {
    domain: [0, 10000] as [number, number],
    labels: ['10K', '8K', '6K', '4K', '2K', '0']
  },
  day: {
    domain: [0, 2000] as [number, number],
    labels: ['2K', '1.6K', '1.2K', '800', '400', '0']
  }
}

// Y config for filtered specialties
const Y_CONFIG_SPECIALTY: Record<
  Specialty,
  {
    month: { domain: [number, number]; labels: string[] }
    week: { domain: [number, number]; labels: string[] }
  }
> = {
  Conservadora: {
    month: {
      domain: [0, 16000],
      labels: ['16K', '12.8K', '9.6K', '6.4K', '3.2K', '0']
    },
    week: {
      domain: [0, 4000],
      labels: ['4K', '3.2K', '2.4K', '1.6K', '800', '0']
    }
  },
  Ortodoncia: {
    month: {
      domain: [0, 12000],
      labels: ['12K', '9.6K', '7.2K', '4.8K', '2.4K', '0']
    },
    week: {
      domain: [0, 3000],
      labels: ['3K', '2.4K', '1.8K', '1.2K', '600', '0']
    }
  },
  Implantes: {
    month: {
      domain: [0, 8000],
      labels: ['8K', '6.4K', '4.8K', '3.2K', '1.6K', '0']
    },
    week: {
      domain: [0, 2000],
      labels: ['2K', '1.6K', '1.2K', '800', '400', '0']
    }
  },
  Estética: {
    month: {
      domain: [0, 4000],
      labels: ['4K', '3.2K', '2.4K', '1.6K', '800', '0']
    },
    week: { domain: [0, 1000], labels: ['1K', '800', '600', '400', '200', '0'] }
  }
}

export default function BillingLineChart({
  timeScale,
  anchorDate,
  selectedSpecialty
}: BillingLineChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)

  const chartData = useMemo(
    () => buildChartData(timeScale, anchorDate, selectedSpecialty),
    [timeScale, anchorDate, selectedSpecialty]
  )

  // Escala Y dinámica según timeScale y especialidad
  const yConfig = useMemo(() => {
    if (selectedSpecialty) {
      const specialtyConfig = Y_CONFIG_SPECIALTY[selectedSpecialty]
      return timeScale === 'month'
        ? specialtyConfig.month
        : specialtyConfig.week
    }
    return Y_CONFIG[timeScale] ?? Y_CONFIG.month
  }, [timeScale, selectedSpecialty])

  // La línea amarilla marca el período actual (último punto con datos)
  // En vista mensual, el mes actual es el último con datos
  const currentPeriodIndex = useMemo(() => {
    if (chartData.length === 0) return 0
    // Buscar el último índice que tiene datos (brand !== null)
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].brand !== null) {
        return i
      }
    }
    return chartData.length - 1
  }, [chartData])

  // El highlight (punto y badges) está en el período actual
  const highlightIndex = currentPeriodIndex

  const lineClipPercent =
    chartData.length > 1
      ? currentPeriodIndex / Math.max(chartData.length - 1, 1)
      : 0

  const highlightLabel = chartData[highlightIndex]?.month ?? null
  const highlightValue = chartData[highlightIndex]?.brand ?? null
  const highlightAccentValue = chartData[highlightIndex]?.accent ?? null

  // Cálculo dinámico del porcentaje de cambio
  const percentChange = useMemo(() => {
    if (!highlightValue || !highlightAccentValue || highlightAccentValue === 0)
      return null
    const change =
      ((highlightValue - highlightAccentValue) / highlightAccentValue) * 100
    return change
  }, [highlightValue, highlightAccentValue])

  useEffect(() => setIsMounted(true), [])

  // Etiqueta del período destacado (donde está la línea amarilla)
  const currentPeriodLabel = useMemo(() => {
    const label = chartData[highlightIndex]?.month ?? ''
    const year = anchorDate.getFullYear()
    return `${label}, ${year}`
  }, [chartData, highlightIndex, anchorDate])

  // Etiqueta del período anterior (año pasado)
  const prevPeriodLabel = useMemo(() => {
    const label = chartData[highlightIndex]?.month ?? ''
    const year = anchorDate.getFullYear() - 1
    return `${label}, ${year}`
  }, [chartData, highlightIndex, anchorDate])

  return (
    <section
      className='relative flex w-full flex-col overflow-hidden rounded-lg bg-surface shadow-elevation-card'
      style={{ height: CARD_HEIGHT_VAR }}
    >
      {/* Header */}
      <header className='flex shrink-0 items-center justify-between px-3 lg:px-4 pt-3 lg:pt-4 gap-2'>
        <h3 className='text-title-sm font-medium text-fg truncate'>
          Facturación
          {selectedSpecialty && (
            <span className='text-brand-500 font-normal'>
              {' '}
              · {selectedSpecialty}
            </span>
          )}
        </h3>
        {/* Legend - hidden on small tablets */}
        <div className='hidden sm:flex items-center gap-2 lg:gap-4 text-label-sm shrink-0'>
          <div className='flex items-center gap-1.5'>
            <span className='h-0.5 w-3 lg:w-4 rounded bg-[#51D6C7]' />
            <span className='text-neutral-500'>Actual</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span
              className='h-0.5 w-3 lg:w-4 rounded bg-[#D4B5FF]'
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #D4B5FF 0, #D4B5FF 4px, transparent 4px, transparent 8px)'
              }}
            />
            <span className='text-neutral-500 hidden lg:inline'>Año anterior</span>
            <span className='text-neutral-500 lg:hidden'>Ant.</span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className='flex flex-1 gap-2 lg:gap-3 overflow-hidden px-3 lg:px-4 pb-3 lg:pb-4'>
        {/* Chart area - takes remaining space */}
        <div className='flex min-w-0 flex-1 flex-col'>
          {/* Y-axis + Chart grid container */}
          <div className='flex flex-1'>
            {/* Y-axis labels - responsive width */}
            <div className='flex w-8 lg:w-10 shrink-0 flex-col justify-between py-2 text-label-sm font-normal text-neutral-400'>
              {yConfig.labels.map((value) => (
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
              <div className='absolute inset-0 outline-none' tabIndex={-1}>
                {isMounted && (
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                      style={{ outline: 'none' }}
                    >
                      <XAxis dataKey='month' hide />
                      <YAxis domain={yConfig.domain} hide />
                      {/* Accent line (dashed) - año anterior */}
                      <Line
                        type='monotone'
                        dataKey='accent'
                        stroke='#D4B5FF'
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        strokeDasharray='4 4'
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: '#D4B5FF',
                          stroke: '#fff',
                          strokeWidth: 2
                        }}
                        animationDuration={1200}
                        animationBegin={150}
                        connectNulls={false}
                      />
                      {/* Brand line (solid) - año actual */}
                      <Line
                        type='monotone'
                        dataKey='brand'
                        stroke='#51D6C7'
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: '#51D6C7',
                          stroke: '#fff',
                          strokeWidth: 2
                        }}
                        animationDuration={1200}
                        animationBegin={0}
                        connectNulls={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Current period vertical line */}
              <div
                className='pointer-events-none absolute top-0 h-full w-px bg-[var(--color-warning-200,#FFD188)]'
                style={{ left: `${lineClipPercent * 100}%` }}
              />

              {/* Highlight point on the line */}
              {highlightValue !== null && (
                <div
                  className='pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand-500,#00A991)] border-2 border-white shadow-elevation-card'
                  style={{
                    left: `${lineClipPercent * 100}%`,
                    top: `${
                      (1 -
                        Math.min(
                          Math.max(highlightValue / yConfig.domain[1], 0),
                          1
                        )) *
                      100
                    }%`
                  }}
                />
              )}

              {/* Period label badge (top) */}
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

              {/* Value badge showing current value */}
              {highlightValue !== null && (
                <div
                  className='pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-brandSemantic bg-brand-50 px-2 py-1 text-label-sm font-medium text-brandSemantic'
                  style={{
                    left: `${lineClipPercent * 100}%`,
                    top: `calc(${
                      (1 -
                        Math.min(
                          Math.max(highlightValue / yConfig.domain[1], 0),
                          1
                        )) *
                      100
                    }% - 1.75rem)`
                  }}
                >
                  {highlightValue.toLocaleString('es-ES')} €
                </div>
              )}
            </div>
          </div>

          {/* X-axis labels - responsive */}
          <div className='mt-1 flex shrink-0 justify-between pl-8 lg:pl-10 text-label-sm font-normal text-neutral-400'>
            {chartData.map((point, idx) => (
              <span key={`${point.month}-${idx}`} className='truncate'>
                {point.month}
              </span>
            ))}
          </div>
        </div>

        {/* Comparison panel - responsive width */}
        <div className='flex w-[6rem] lg:w-[9rem] shrink-0 flex-col justify-between rounded-lg border border-neutral-300 bg-surface p-2 lg:p-3'>
          <div className='flex flex-col gap-0.5 lg:gap-1'>
            <p className='text-label-sm lg:text-body-sm font-medium capitalize text-neutral-600 truncate'>
              {currentPeriodLabel}
            </p>
            <p className='text-title-md font-semibold text-neutral-600'>
              {(highlightValue ?? 0).toLocaleString('es-ES')} €
            </p>
            {percentChange !== null && (
              <div className='flex items-center gap-0.5 lg:gap-1'>
                <span
                  className={`text-label-sm ${
                    percentChange >= 0 ? 'text-brand-500' : 'text-error-500'
                  }`}
                >
                  {percentChange >= 0 ? '+' : ''}
                  {percentChange.toFixed(1)}%
                </span>
                <span
                  className={`material-symbols-rounded text-sm lg:text-base ${
                    percentChange >= 0 ? 'text-brand-500' : 'text-error-500'
                  }`}
                >
                  {percentChange >= 0 ? 'arrow_outward' : 'arrow_downward'}
                </span>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-0.5 lg:gap-1'>
            <p className='text-label-sm font-normal capitalize text-neutral-500 truncate'>
              {prevPeriodLabel}
            </p>
            <p className='text-label-sm font-medium text-info-200'>
              {(highlightAccentValue ?? 0).toLocaleString('es-ES')} €
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

  const brand = payload.find((p) => p.dataKey === 'brand')?.value ?? null
  const accent = payload.find((p) => p.dataKey === 'accent')?.value ?? null

  // No mostrar tooltip si no hay datos (meses futuros)
  if (brand === null && accent === null) {
    return (
      <div className='rounded-md border border-border bg-surface px-2 py-1.5 text-label-sm text-neutral-500 shadow-elevation-card'>
        <div className='font-medium'>{label}</div>
        <div className='text-neutral-400'>Sin datos</div>
      </div>
    )
  }

  return (
    <div className='rounded-md border border-border bg-surface px-2 py-1.5 text-label-sm text-neutral-700 shadow-elevation-card'>
      <div className='font-medium text-neutral-900'>{label}</div>
      {typeof brand === 'number' && (
        <div className='flex items-center gap-1.5 text-brandSemantic'>
          <span className='inline-block h-2 w-2 rounded-full bg-brandSemantic' />
          <span>Actual: {brand.toLocaleString('es-ES')} €</span>
        </div>
      )}
      {typeof accent === 'number' && (
        <div className='flex items-center gap-1.5 text-[#D4B5FF]'>
          <span className='inline-block h-2 w-2 rounded-full bg-[#D4B5FF]' />
          <span>Año ant.: {accent.toLocaleString('es-ES')} €</span>
        </div>
      )}
    </div>
  )
}

type ChartPoint = { month: string; brand: number | null; accent: number | null }

function buildChartData(
  scale: CashTimeScale,
  anchorDate: Date,
  specialty?: SpecialtyFilter
): ChartPoint[] {
  switch (scale) {
    case 'week':
      return buildWeeklyData(anchorDate, specialty)
    case 'month':
    default:
      return buildMonthlyData(anchorDate, specialty)
  }
}

function buildMonthlyData(
  anchorDate: Date,
  specialty?: SpecialtyFilter
): ChartPoint[] {
  const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
  const multiplier = specialty ? SPECIALTY_PERCENTAGES[specialty] : 1

  // El mes actual estará en posición 9, dejando 2 meses futuros vacíos (posiciones 10 y 11)
  const currentPeriodIdx = 9
  const result: ChartPoint[] = []

  for (let i = 0; i < 12; i++) {
    // Calcular la fecha de cada punto: empezamos 9 meses antes del actual
    const monthOffset = i - currentPeriodIdx // -9 a +2
    const date = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() + monthOffset,
      1
    )
    const monthLabel = formatter.format(date)

    // Usar el índice del mes (0-11) para obtener datos del mock
    const dataIndex = date.getMonth()

    // Solo mostrar datos hasta el mes actual (posición 9)
    if (i <= currentPeriodIdx) {
      result.push({
        month: monthLabel,
        brand: Math.round(CHART_DATA[dataIndex].brand * multiplier),
        accent: Math.round(CHART_DATA[dataIndex].accent * multiplier)
      })
    } else {
      // Meses futuros sin datos
      result.push({
        month: monthLabel,
        brand: null,
        accent: null
      })
    }
  }
  return result
}

function buildWeeklyData(
  anchorDate: Date,
  specialty?: SpecialtyFilter
): ChartPoint[] {
  const data: ChartPoint[] = []
  const multiplier = specialty ? SPECIALTY_PERCENTAGES[specialty] : 1
  // La semana actual estará en posición 9, dejando 2 semanas futuras vacías
  const currentWeekIdx = 9

  for (let i = 0; i < 12; i++) {
    // Calcular la fecha de cada semana: empezamos 9 semanas antes
    const weekOffset = i - currentWeekIdx // -9 a +2
    const weekDate = addDays(anchorDate, weekOffset * 7)
    const start = startOfWeek(weekDate)
    const weekNumber = getWeekOfYear(start)

    const dataIndex = i % WEEKLY_DATA.length
    const weekData = WEEKLY_DATA[dataIndex] ?? { brand: 7200, accent: 6400 }

    // Solo mostrar datos hasta la semana actual (posición 9)
    if (i <= currentWeekIdx) {
      data.push({
        month: `S${weekNumber}`,
        brand: Math.round(weekData.brand * multiplier),
        accent: Math.round(weekData.accent * multiplier)
      })
    } else {
      // Semanas futuras sin datos
      data.push({
        month: `S${weekNumber}`,
        brand: null,
        accent: null
      })
    }
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

function getWeekOfYear(date: Date): number {
  // Cálculo ISO 8601 del número de semana
  const target = new Date(date.valueOf())
  // Ajustar al jueves de la semana (ISO weeks start on Monday, week 1 contains Jan 4)
  const dayNum = (date.getDay() + 6) % 7 // Lunes = 0, Domingo = 6
  target.setDate(target.getDate() - dayNum + 3) // Jueves de esta semana

  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3)

  const weekNum =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

  // Asegurar que esté en rango 1-52 (algunos años tienen semana 53, pero lo limitamos)
  if (weekNum > 52) return 52
  if (weekNum < 1) return 1
  return weekNum
}
