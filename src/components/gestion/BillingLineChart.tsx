'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useEffect, useMemo, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis
} from 'recharts'
import type {
  GestionBillingPoint,
  GestionSpecialtyMetric,
  SpecialtyFilter
} from './gestionTypes'

type BillingLineChartProps = {
  timeScale: CashTimeScale
  anchorDate: Date
  selectedSpecialty?: SpecialtyFilter
  points?: GestionBillingPoint[]
  specialties?: GestionSpecialtyMetric[]
}

const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'

type ChartPoint = { month: string; brand: number | null; accent: number | null }

export default function BillingLineChart({
  timeScale,
  anchorDate,
  selectedSpecialty,
  points,
  specialties
}: BillingLineChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  const specialtyShare =
    selectedSpecialty
      ? (specialties?.find((item) => item.label === selectedSpecialty)?.sharePercent ||
          0) / 100
      : 1

  const chartData = useMemo<ChartPoint[]>(() => {
    return (points || []).map((point) => ({
      month: point.label,
      brand:
        point.current == null ? null : Math.round(point.current * specialtyShare),
      accent:
        point.previous == null ? null : Math.round(point.previous * specialtyShare)
    }))
  }, [points, specialtyShare])

  const maxValue = useMemo(() => {
    const values = chartData.flatMap((point) => [point.brand, point.accent])
    const max = Math.max(...values.map((value) => Number(value || 0)), 1)
    return Math.ceil(max / 1000) * 1000
  }, [chartData])

  const yConfig = useMemo(() => {
    const step = maxValue / 5
    const labels = Array.from({ length: 6 }, (_, index) => {
      const value = Math.round(maxValue - step * index)
      if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
      }
      return `${value}`
    })

    return {
      domain: [0, maxValue] as [number, number],
      labels
    }
  }, [maxValue])

  const currentPeriodIndex = useMemo(() => {
    if (chartData.length === 0) return 0
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].brand !== null) return i
    }
    return chartData.length - 1
  }, [chartData])

  const highlightIndex = currentPeriodIndex
  const lineClipPercent =
    chartData.length > 1
      ? currentPeriodIndex / Math.max(chartData.length - 1, 1)
      : 0

  const highlightLabel = chartData[highlightIndex]?.month ?? null
  const highlightValue = chartData[highlightIndex]?.brand ?? null
  const highlightAccentValue = chartData[highlightIndex]?.accent ?? null

  const percentChange = useMemo(() => {
    if (!highlightValue || !highlightAccentValue || highlightAccentValue === 0)
      return null
    return ((highlightValue - highlightAccentValue) / highlightAccentValue) * 100
  }, [highlightValue, highlightAccentValue])

  useEffect(() => setIsMounted(true), [])

  const currentPeriodLabel = useMemo(() => {
    const label = chartData[highlightIndex]?.month ?? ''
    const year = anchorDate.getFullYear()
    return `${label}, ${year}`
  }, [chartData, highlightIndex, anchorDate])

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

      <div className='flex flex-1 gap-2 lg:gap-3 overflow-hidden px-3 lg:px-4 pb-3 lg:pb-4'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='flex flex-1'>
            <div className='flex w-8 lg:w-10 shrink-0 flex-col justify-between py-2 text-label-sm font-normal text-neutral-400'>
              {yConfig.labels.map((value: string) => (
                <span key={value}>{value}</span>
              ))}
            </div>

            <div className='relative flex-1'>
              <div
                className='absolute inset-0'
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, var(--chart-grid) 1px, transparent 1px), linear-gradient(to right, var(--chart-grid) 1px, transparent 1px)',
                  backgroundSize: '100% calc(100% / 5), calc(100% / 11) 100%',
                  backgroundPosition: 'left top, left top'
                }}
              />

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
                        connectNulls={false}
                      />
                      <Line
                        type='monotone'
                        dataKey='brand'
                        stroke='#51D6C7'
                        strokeWidth={2}
                        dot={false}
                        animationDuration={1200}
                        animationBegin={0}
                        connectNulls={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div
                className='pointer-events-none absolute top-0 h-full w-px bg-[var(--color-warning-200,#FFD188)]'
                style={{ left: `${lineClipPercent * 100}%` }}
              />

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

              {highlightValue !== null && (
                <div
                  className='pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full border border-brandSemantic bg-brand-50 px-2 py-1 text-label-sm font-medium text-brandSemantic'
                  style={{
                    left: `${lineClipPercent * 100}%`,
                    top: `calc(${((1 - Math.min(Math.max(highlightValue / yConfig.domain[1], 0), 1)) * 100).toFixed(2)}% - 1.75rem)`
                  }}
                >
                  {highlightValue.toLocaleString('es-ES')} €
                </div>
              )}
            </div>
          </div>

          <div className='mt-1 flex shrink-0 justify-between pl-8 lg:pl-10 text-label-sm font-normal text-neutral-400'>
            {chartData.map((point, idx) => (
              <span key={`${point.month}-${idx}`} className='truncate'>
                {point.month}
              </span>
            ))}
          </div>
        </div>

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
