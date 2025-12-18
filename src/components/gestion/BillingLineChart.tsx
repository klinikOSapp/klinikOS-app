'use client'

/* eslint-disable @next/next/no-img-element */
import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Line,
  LineChart,
  ReferenceDot,
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
const CARD_WIDTH_VAR = 'var(--width-card-chart-lg-fluid)'
const CARD_WIDTH_STYLE = 'min(100%, var(--width-card-chart-lg-fluid))'
const CARD_WIDTH_EFFECTIVE = 'min(100%, var(--width-card-chart-lg-fluid))'

const HEADER_LEFT_RATIO = 16 / 1069
const HEADER_TOP_RATIO = 16 / 342
const Y_AXIS_LEFT_RATIO = 16 / 1069
const Y_AXIS_TOP_RATIO = 64 / 342
const Y_AXIS_HEIGHT_RATIO = 222 / 342
const GRID_LEFT_RATIO = 63 / 1069
const GRID_TOP_RATIO = 58 / 342
const GRID_WIDTH_RATIO = 824 / 1069
const GRID_HEIGHT_RATIO = 228 / 342
const MONTH_ROW_TOP_RATIO = 302 / 342
const COMPARISON_LEFT_RATIO = 911 / 1069
const COMPARISON_TOP_RATIO = 58 / 342
const COMPARISON_WIDTH_RATIO = 142 / 1069
// Recharts sustituye las líneas SVG estáticas. Los datos por mes permiten dibujar
// la línea "brand" (actual) y la "accent" (comparativa) manteniendo la estructura Figma.
// Mock data con curvatura visible para demo; sustituir por backend en prod.
// Escalado para encajar con el eje 0–90K del diseño.
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
  12000,
  18000,
  15000,
  24000,
  20000,
  30000,
  26000,
  34000,
  28000,
  36000,
  31000,
  40000
] as const

const Y_AXIS_LABELS = ['90K', '70K', '50K', '30K', '10K', '0']

const toWidth = (ratio: number) =>
  `calc(${CARD_WIDTH_EFFECTIVE} * ${ratio.toFixed(6)})`
const toHeight = (ratio: number) =>
  `calc(${CARD_HEIGHT_VAR} * ${ratio.toFixed(6)})`

export default function BillingLineChart({
  yearLabel = '2024',
  timeScale,
  anchorDate
}: BillingLineChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  const clipId = useId()
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const [clipWidthPx, setClipWidthPx] = useState<number | null>(null)
  const chartData = useMemo(
    () => buildChartData(timeScale, anchorDate),
    [timeScale, anchorDate]
  )

  // El índice del momento actual depende de la escala:
  // - Mes: buscamos el mes de anchorDate dentro de la serie generada (12 meses, el último slot es el mes actual)
  // - Semana/día: el último punto es el periodo actual
  const highlightIndex = (() => {
    if (chartData.length === 0) return 0
    if (timeScale !== 'month') return Math.max(0, chartData.length - 1)

    const monthsCount = chartData.length
    const monthIndex = Array.from({ length: monthsCount }, (_, idx) => {
      const d = new Date(anchorDate)
      // buildMonthlyData usa (months - 2 - idx) para dejar el mes actual en el penúltimo slot
      d.setMonth(anchorDate.getMonth() - (monthsCount - 2 - idx))
      return d
    }).findIndex(
      (d) =>
        d.getMonth() === anchorDate.getMonth() &&
        d.getFullYear() === anchorDate.getFullYear()
    )

    return monthIndex >= 0 ? monthIndex : Math.max(0, monthsCount - 2)
  })()

  const lineClipPercent =
    chartData.length > 1 ? highlightIndex / Math.max(chartData.length - 1, 1) : 0

  const highlightLabel = chartData[highlightIndex]?.month ?? null
  const highlightValue = chartData[highlightIndex]?.brand ?? null
  const highlightAccentValue = chartData[highlightIndex]?.accent ?? null

  // Datos completos para mantener los 12 ejes en mes; las líneas se “cortan” con valores null a partir del punto actual.
  const lineData = chartData.map((point, idx) => ({
    ...point,
    brandClipped: idx <= highlightIndex ? point.brand : null,
    accentClipped: idx <= highlightIndex ? point.accent : null
  }))
  useEffect(() => setIsMounted(true), [])

  useEffect(() => {
    const node = chartContainerRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const next = entry.contentRect.width * lineClipPercent
      setClipWidthPx((prev) => (prev === next ? prev : next))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [lineClipPercent])

  return (
    <section
      className='relative w-full overflow-clip rounded-lg bg-surface shadow-elevation-card'
      style={{ height: CARD_HEIGHT_VAR, width: CARD_WIDTH_STYLE }}
    >
      <header
        className='absolute z-10 flex items-baseline justify-between text-fg'
        style={{
          left: toWidth(HEADER_LEFT_RATIO),
          right: toWidth(HEADER_LEFT_RATIO),
          top: toHeight(HEADER_TOP_RATIO)
        }}
      >
        <h3 className='text-title-sm font-medium'>Facturación</h3>
      </header>

      <div
        className='absolute flex flex-col justify-between text-label-sm font-normal text-neutral-400'
        style={{
          left: toWidth(Y_AXIS_LEFT_RATIO),
          top: toHeight(Y_AXIS_TOP_RATIO),
          height: toHeight(Y_AXIS_HEIGHT_RATIO)
        }}
      >
        {Y_AXIS_LABELS.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>

      <div
        ref={chartContainerRef}
        className='absolute'
        style={{
          left: toWidth(GRID_LEFT_RATIO),
          top: toHeight(GRID_TOP_RATIO),
          width: toWidth(GRID_WIDTH_RATIO),
          height: toHeight(GRID_HEIGHT_RATIO)
        }}
      >
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'linear-gradient(to bottom, var(--chart-grid) 1px, transparent 1px), linear-gradient(to right, var(--chart-grid) 1px, transparent 1px)',
            backgroundSize: '100% calc(100% / 5), calc(100% / 11) 100%',
            backgroundPosition: 'left top, left top'
          }}
        />
        <div className='absolute inset-0'>
          {isMounted && (
            <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={lineData}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <clipPath id={clipId} clipPathUnits='userSpaceOnUse'>
                    <rect
                      width={clipWidthPx ?? 0}
                      height={clipWidthPx !== null ? '100%' : 0}
                      x='0'
                      y='0'
                    />
                  </clipPath>
                </defs>
                {/* Ejes ocultos para mantener las etiquetas personalizadas de Figma */}
                <XAxis dataKey='month' hide />
                <YAxis domain={[0, 90000]} hide />
                {/* Línea comparativa (info-200) - estilo discontínuo */}
                <Line
                  type='monotone'
                  dataKey='accentClipped'
                  stroke='var(--info-200, #D4B5FF)'
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  strokeDasharray='4 4'
                  dot={false}
                  animationDuration={1200}
                  animationBegin={150}
                  clipPath={`url(#${clipId})`}
                />
                {/* Línea principal (brandSemantic) */}
                <Line
                  type='monotone'
                  dataKey='brandClipped'
                  stroke='var(--brandSemantic, #51D6C7)'
                  strokeWidth={1.6}
                  strokeOpacity={0.8}
                  dot={false}
                  animationDuration={1200}
                  animationBegin={0}
                  clipPath={`url(#${clipId})`}
                />
                <Tooltip content={<ChartTooltip />} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(GRID_LEFT_RATIO + GRID_WIDTH_RATIO * lineClipPercent),
          top: toHeight(GRID_TOP_RATIO),
          width: '0.0625rem', // 1px
          height: toHeight(GRID_HEIGHT_RATIO),
          backgroundColor: 'var(--color-warning-200, #FFD188)',
          pointerEvents: 'none'
        }}
      />
      {/* Punto amarillo alineado con la línea amarilla y cruzando la línea turquesa */}
      {highlightValue !== null ? (
        <div
          className='absolute h-[0.75rem] w-[0.75rem] rounded-full bg-[var(--color-warning-200,#FFD188)] shadow-elevation-card'
          style={{
            left: toWidth(GRID_LEFT_RATIO + GRID_WIDTH_RATIO * lineClipPercent),
            top: toHeight(
              GRID_TOP_RATIO +
                GRID_HEIGHT_RATIO *
                  (1 - Math.min(Math.max(highlightValue / 90000, 0), 1))
            ),
            transform: 'translate(-50%, -50%)'
          }}
        />
      ) : null}
      {highlightLabel ? (
        <div
          className='absolute translate-y-[-60%] rounded-full bg-surface px-[0.5rem] py-[0.25rem] text-label-sm font-medium text-neutral-700 shadow-elevation-card'
          style={{
            left: toWidth(GRID_LEFT_RATIO + GRID_WIDTH_RATIO * lineClipPercent),
            top: toHeight(GRID_TOP_RATIO),
            transform: 'translate(-50%, -70%)'
          }}
        >
          {highlightLabel}
        </div>
      ) : null}

      {highlightValue !== null ? (
        <div
          className='absolute'
          style={{
            left: toWidth(GRID_LEFT_RATIO + GRID_WIDTH_RATIO * lineClipPercent),
            top: toHeight(
              GRID_TOP_RATIO +
                GRID_HEIGHT_RATIO *
                  (1 - Math.min(Math.max(highlightValue / 90000, 0), 1))
            ),
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className='rounded-full border border-brandSemantic bg-brand-50 px-[0.5rem] py-[0.25rem] text-label-sm font-normal text-brandSemantic whitespace-nowrap'>
            {highlightValue.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </div>
        </div>
      ) : null}

      {highlightAccentValue !== null ? (
        <div
          className='absolute'
          style={{
            left: toWidth(GRID_LEFT_RATIO + GRID_WIDTH_RATIO * lineClipPercent),
            top: toHeight(
              GRID_TOP_RATIO +
                GRID_HEIGHT_RATIO *
                  (1 - Math.min(Math.max(highlightAccentValue / 90000, 0), 1))
            ),
            transform: 'translate(-50%, -220%)'
          }}
        >
          <div className='rounded-full border border-info-200 border-dashed px-[0.5rem] py-[0.25rem] text-label-sm font-normal text-info-200 whitespace-nowrap'>
            {highlightAccentValue.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </div>
        </div>
      ) : null}

      <div
        className='absolute flex justify-between text-label-sm font-normal text-neutral-400'
        style={{
          left: toWidth(GRID_LEFT_RATIO),
          top: toHeight(MONTH_ROW_TOP_RATIO),
          width: toWidth(GRID_WIDTH_RATIO)
        }}
      >
        {chartData.map((point) => (
          <span key={point.month}>{point.month}</span>
        ))}
      </div>

      <div
        className='absolute flex flex-col rounded-lg bg-surface overflow-hidden'
        style={{
          left: toWidth(COMPARISON_LEFT_RATIO),
          top: toHeight(COMPARISON_TOP_RATIO),
          width: toWidth(COMPARISON_WIDTH_RATIO),
          height: toHeight(GRID_HEIGHT_RATIO),
          paddingTop: 'var(--space-card-pad)', // 16px
          paddingBottom: 'var(--space-card-pad)',
          paddingLeft: 'var(--space-card-gap2)', // 11px
          paddingRight: 'var(--space-card-gap2)',
          border: '0.03125rem solid var(--color-neutral-300, #CBD3D9)' // 0.5px
        }}
      >
        <div className='flex flex-1 flex-col justify-between'>
          <div className='flex flex-col gap-card-row'>
            <p className='text-body-sm font-medium text-neutral-600'>
              Oct, 2025
            </p>
            <p
              className='text-headline-lg text-neutral-600'
              style={{
                fontSize: 'clamp(1.1rem, 1.8vw, 2.25rem)', // reduce mínimo
                lineHeight: 'clamp(1.6rem, 2.4vw, 2.75rem)'
              }}
            >
              42.000
            </p>
            <div className='flex items-center gap-card-metric'>
              <span
                className='text-body-lg text-brand-500'
                style={{
                  fontSize: 'clamp(0.8rem, 1.1vw, 1rem)',
                  lineHeight: 'clamp(1.1rem, 1.7vw, 1.5rem)'
                }}
              >
                + 6%
              </span>
              <span className='material-symbols-rounded text-brand-500 text-[1.5rem] leading-none'>
                arrow_outward
              </span>
            </div>
          </div>

          <div className='flex flex-col gap-card-row'>
            <p className='text-label-sm font-normal text-neutral-600'>
              Oct, 2024
            </p>
            <p
              className='text-body-md font-medium text-info-200'
              style={{
                fontSize: 'clamp(0.7rem, 1vw, 0.95rem)',
                lineHeight: 'clamp(1rem, 1.4vw, 1.4rem)'
              }}
            >
              40.000
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ChartTooltip({
  active,
  payload,
  label
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const brand =
    (payload.find((p) => p.dataKey === 'brandClipped')?.value ??
      payload.find((p) => p.dataKey === 'brand')?.value) ?? null
  const accent =
    (payload.find((p) => p.dataKey === 'accentClipped')?.value ??
      payload.find((p) => p.dataKey === 'accent')?.value) ?? null

  return (
    <div className='rounded-md border border-border bg-surface px-[0.5rem] py-[0.375rem] text-label-sm shadow-elevation-card text-neutral-700'>
      <div className='font-medium text-neutral-900'>{label}</div>
      {typeof brand === 'number' ? (
        <div
          className='flex items-center gap-[0.35rem]'
          style={{ color: 'var(--brandSemantic, #51D6C7)' }}
        >
          <span
            className='inline-block h-[0.5rem] w-[0.5rem] rounded-full'
            style={{ backgroundColor: 'var(--brandSemantic, #51D6C7)' }}
          />
          <span>{brand.toLocaleString('es-ES')} €</span>
        </div>
      ) : null}
      {typeof accent === 'number' ? (
        <div
          className='flex items-center gap-[0.35rem]'
          style={{ color: 'var(--info-200, #D4B5FF)' }}
        >
          <span
            className='inline-block h-[0.5rem] w-[0.5rem] rounded-full'
            style={{ backgroundColor: 'var(--info-200, #D4B5FF)' }}
          />
          <span>{accent.toLocaleString('es-ES')} €</span>
        </div>
      ) : null}
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
  const months = Math.min(12, CHART_DATA.length) // 12 meses
  const source = CHART_DATA.slice(-months)
  return source.map((point, idx) => {
    const date = new Date(anchorDate)
    // Mes actual en el último slot (idx = months - 1)
    date.setMonth(anchorDate.getMonth() - (months - 1 - idx))
    return {
      ...point,
      month: formatter.format(date)
    }
  })
}

function buildWeeklyData(anchorDate: Date): ChartPoint[] {
  const data: ChartPoint[] = []
  // 12 semanas (actual + 11 previas) con mock curvo visible
  const weeks = WEEKLY_MOCK_BRAND.length
  for (let delta = 11; delta >= 0; delta -= 1) {
    const start = startOfWeek(addDays(anchorDate, -7 * delta))
    const weekNumber = getWeekOfYear(start)
    const idx = weeks - 1 - delta
    const brand = WEEKLY_MOCK_BRAND[idx] ?? 15000
    const accent = Math.max(Math.round(brand * 0.88), 8000)
    data.push({
      month: `Sem ${weekNumber}`,
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

function generateValue(date: Date, base: number, slope: number) {
  const seed = date.getDate() + date.getMonth() * 31
  const noise = ((seed * 11) % 7) * 160
  const trend = ((date.getMonth() % 6) + 1) * slope
  const value = Math.min(90000, Math.max(8000, base + trend + noise))
  return Math.round(value / 100) * 100
}
