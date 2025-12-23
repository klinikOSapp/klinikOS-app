'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const Y_AXIS_LABELS = ['50K', '40K', '30K', '20K', '10K', 'º']

const CARD_WIDTH_PX = 523
const CARD_HEIGHT_PX = 342
const CARD_HEIGHT_REM = CARD_HEIGHT_PX / 16
const TREND_CARD_WIDTH_REM = 32.6875 // 523px
const GRID_WIDTH_PX = 451
const GRID_HEIGHT_PX = 228
const GRID_LEFT_PX = 56
const GRID_TOP_PX = 58
const CARD_PADDING_PX = 16
const Y_AXIS_TOP_PX = 64
const Y_AXIS_HEIGHT_PX = 222
const X_AXIS_TOP_PX = 302
const CHIP_LEFT_PX = 64
const CHIP_FACT_TOP_PX = 66
const CHIP_OBJ_TOP_PX = 98
const DEFAULT_TARGET_VALUE_EUR = 30000 // Fallback if no monthly goal set

const percentOfWidth = (px: number) => `${(px / CARD_WIDTH_PX) * 100}%`
const percentOfHeight = (px: number) => `${(px / CARD_HEIGHT_PX) * 100}%`
const percentOfGridWidth = (px: number) => `${(px / GRID_WIDTH_PX) * 100}%`
const percentOfGridHeight = (px: number) => `${(px / GRID_HEIGHT_PX) * 100}%`

const rectToStyle = ({
  left,
  top,
  width,
  height
}: {
  left: number
  top: number
  width: number
  height: number
}) => ({
  left: percentOfWidth(left),
  top: percentOfHeight(top),
  width: percentOfWidth(width),
  height: percentOfHeight(height)
})

const horizontalLinesPx = [0, 41.2, 82.4, 123.6, 164.8, 206]
const verticalLinesPx = Array.from(
  { length: 12 },
  (_, index) => index * (GRID_WIDTH_PX / 11)
)

const chartCanvas = {
  width: GRID_WIDTH_PX,
  height: GRID_HEIGHT_PX,
  maxValue: 50 // Default, will be calculated dynamically
}

const HEADER_RECT = {
  left: CARD_PADDING_PX,
  top: CARD_PADDING_PX,
  width: 491,
  height: 24
}
const FACT_CHIP_RECT = {
  left: CHIP_LEFT_PX,
  top: CHIP_FACT_TOP_PX,
  width: 135,
  height: 24
}
const TARGET_CHIP_RECT = {
  left: CHIP_LEFT_PX,
  top: CHIP_OBJ_TOP_PX,
  width: 135,
  height: 24
}
const Y_AXIS_RECT = {
  left: CARD_PADDING_PX,
  top: Y_AXIS_TOP_PX,
  width: 24,
  height: Y_AXIS_HEIGHT_PX
}
const X_AXIS_RECT = {
  left: GRID_LEFT_PX,
  top: X_AXIS_TOP_PX,
  width: GRID_WIDTH_PX,
  height: 16
}
const GRID_RECT = {
  left: GRID_LEFT_PX,
  top: GRID_TOP_PX,
  width: GRID_WIDTH_PX,
  height: GRID_HEIGHT_PX
}
const GRID_FILL_RECT = { left: 0, top: 160, width: GRID_WIDTH_PX, height: 68 }
// TARGET_RATIO will be calculated dynamically based on targetValue from API

type SeriesPoint = {
  label: string
  actual: number
  invoiceCount?: number
  hasInvoice?: boolean
  collected?: number
  paymentCount?: number
  hasPayment?: boolean
  bucketStart?: string
  bucketEnd?: string
}

type SeriesResult = {
  labels: string[]
  dataPoints: SeriesPoint[]
  highlightIndex: number
}

type CashTrendCardProps = {
  timeScale: CashTimeScale
  anchorDate: Date
  targetHeightRem?: number | null
}

export default function CashTrendCard({
  timeScale,
  anchorDate,
  targetHeightRem
}: CashTrendCardProps) {
  const [series, setSeries] = useState<SeriesResult>({
    labels: [],
    dataPoints: [],
    highlightIndex: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [facturadoValue, setFacturadoValue] = useState(38000)
  const [targetValue, setTargetValue] = useState(30) // In thousands (from API)

  const formatDateMadrid = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d)

  // Fetch trend data from API
  useEffect(() => {
    setIsLoading(true)
    const dateStr = formatDateMadrid(anchorDate)
    fetch(`/api/caja/trend?date=${dateStr}&timeScale=${timeScale}`)
      .then((res) => res.json())
      .then((data) => {
        // For day view: API returns raw invoices, calculate cumulative on frontend
        if (timeScale === 'day' && data.invoices && Array.isArray(data.invoices)) {
          // Find all hours that have invoices
          const invoiceHours = new Set<number>()
          const standardHours = [9, 10, 11, 12, 13, 14, 15, 16]
          const paymentHours = new Set<number>()
          
          for (const inv of data.invoices) {
            if (inv.issue_timestamp) {
              const invTimeUTC = new Date(inv.issue_timestamp)
              const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Europe/Madrid',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                hour12: false
              })
              const parts = formatter.formatToParts(invTimeUTC)
              const invYear = parts.find(p => p.type === 'year')?.value
              const invMonth = parts.find(p => p.type === 'month')?.value
              const invDay = parts.find(p => p.type === 'day')?.value
              const invHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
              const invDateStr = `${invYear}-${invMonth}-${invDay}`
              
              // Only include if same date and hour is in business hours (9-16)
              if (invDateStr === dateStr && invHour >= 9 && invHour <= 16) {
                invoiceHours.add(invHour)
              }
            }
          }

          for (const p of Array.isArray(data.payments) ? data.payments : []) {
            if (!p.transaction_date) continue
            const pTimeUTC = new Date(p.transaction_date)
            const formatter = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Europe/Madrid',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              hour12: false
            })
            const parts = formatter.formatToParts(pTimeUTC)
            const pYear = parts.find(p => p.type === 'year')?.value
            const pMonth = parts.find(p => p.type === 'month')?.value
            const pDay = parts.find(p => p.type === 'day')?.value
            const pHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
            const pDateStr = `${pYear}-${pMonth}-${pDay}`
            if (pDateStr === dateStr && pHour >= 9 && pHour <= 16) {
              paymentHours.add(pHour)
            }
          }
          
          // Combine invoice hours with standard hours, sort them
          const allHours = Array.from(
            new Set([...standardHours, ...Array.from(invoiceHours), ...Array.from(paymentHours)])
          ).sort((a, b) => a - b)
          
          const dataPoints: SeriesPoint[] = []
          let facturadoTotal = 0
          let cobradoTotal = 0

          // Calculate cumulative for each hour
          for (const hour of allHours) {
            // Sum all invoices up to this hour
            const invoicesUpToHour = data.invoices.filter((inv: any) => {
              if (!inv.issue_timestamp) return false
              const invTimeUTC = new Date(inv.issue_timestamp)
              const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Europe/Madrid',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                hour12: false
              })
              const parts = formatter.formatToParts(invTimeUTC)
              const invYear = parts.find(p => p.type === 'year')?.value
              const invMonth = parts.find(p => p.type === 'month')?.value
              const invDay = parts.find(p => p.type === 'day')?.value
              const invHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
              const invDateStr = `${invYear}-${invMonth}-${invDay}`
              // Check if invoice is on the same date and hour <= current hour
              return invDateStr === dateStr && invHour <= hour
            })
            
            const cumulativeTotal = invoicesUpToHour.reduce((sum: number, inv: any) => {
              return sum + Number(inv.total_amount || 0)
            }, 0)

            const paymentsUpToHour = (Array.isArray(data.payments) ? data.payments : []).filter(
              (p: any) => {
                if (!p.transaction_date) return false
                const pTimeUTC = new Date(p.transaction_date)
                const formatter = new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Europe/Madrid',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  hour12: false
                })
                const parts = formatter.formatToParts(pTimeUTC)
                const pYear = parts.find(pp => pp.type === 'year')?.value
                const pMonth = parts.find(pp => pp.type === 'month')?.value
                const pDay = parts.find(pp => pp.type === 'day')?.value
                const pHour = parseInt(parts.find(pp => pp.type === 'hour')?.value || '0')
                const pDateStr = `${pYear}-${pMonth}-${pDay}`
                return pDateStr === dateStr && pHour <= hour
              }
            )
            const cumulativeCollected = paymentsUpToHour.reduce(
              (sum: number, p: any) => sum + Number(p.amount || 0),
              0
            )
            
            // Convert to thousands for chart
            const cumulativeInThousands = cumulativeTotal / 1000
            const collectedInThousands = cumulativeCollected / 1000
            
            dataPoints.push({
              label: `${String(hour).padStart(2, '0')}:00`,
              actual: Math.round(cumulativeInThousands * 10) / 10,
              collected: Math.round(collectedInThousands * 10) / 10,
              hasInvoice: invoiceHours.has(hour),
              hasPayment: paymentHours.has(hour),
              bucketStart: dateStr,
              bucketEnd: dateStr
            })
          }

          // Calculate total Facturado (sum of all invoices for the day)
          facturadoTotal = data.invoices.reduce((sum: number, inv: any) => {
            return sum + Number(inv.total_amount || 0)
          }, 0)
          cobradoTotal = (Array.isArray(data.payments) ? data.payments : []).reduce(
            (sum: number, p: any) => sum + Number(p.amount || 0),
            0
          )

          // Calculate highlightIndex (current hour if today, otherwise last hour)
          const now = new Date()
          const todayStr = formatDateMadrid(now)
          const isToday = dateStr === todayStr
          const currentHour = Number(
            new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Europe/Madrid',
              hour: '2-digit',
              hour12: false
            })
              .formatToParts(now)
              .find((p) => p.type === 'hour')?.value || '0'
          )
          let highlightIndex = dataPoints.length - 1
          
          if (isToday && currentHour >= 9 && currentHour <= 16) {
            highlightIndex = currentHour - 9
          }

          setSeries({
            labels: dataPoints.map(p => p.label),
            dataPoints: dataPoints,
            highlightIndex: highlightIndex
          })
          
          setFacturadoValue(Math.round(facturadoTotal * 10) / 10)
          console.log(`[CashTrendCard] Day view - Calculated Facturado: ${facturadoTotal} EUR from ${data.invoices.length} invoices`)
        } 
        // For week/month views: use pre-calculated dataPoints from API
        else if (data.dataPoints && data.labels) {
          setSeries({
            labels: data.labels,
            dataPoints: data.dataPoints,
            highlightIndex: data.highlightIndex || data.dataPoints.length - 1
          })
          
          // Use totalFacturado from API if available, otherwise calculate from last dataPoint
          if (data.totalFacturado !== undefined) {
            setFacturadoValue(Math.round(data.totalFacturado * 10) / 10)
            console.log(`[CashTrendCard] ${timeScale} view - Facturado from API: ${data.totalFacturado} EUR`)
          } else {
            // Fallback: calculate from last data point
            const lastDataPoint = data.dataPoints[data.dataPoints.length - 1]
            const total = (lastDataPoint?.actual || 0) * 1000
            setFacturadoValue(Math.round(total * 10) / 10)
            console.log(`[CashTrendCard] ${timeScale} view - Calculated Facturado: ${total} EUR (fallback)`)
          }
        }

        // Set target value from API (already in thousands)
        if (data.targetValue !== undefined) {
          setTargetValue(data.targetValue)
        }
        
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching trend:', error)
        setIsLoading(false)
      })
  }, [timeScale, anchorDate])

  // Calculate dynamic max value based on data and target
  const dynamicMaxValue = useMemo(() => {
    if (series.dataPoints.length === 0) return 50 // Default fallback
    
    // Find max actual value in data
    const maxActual = Math.max(...series.dataPoints.map(p => p.actual), 0)
    const targetValueEur = (targetValue || 0) * 1000 / 1000 // Already in thousands
    
    // Use the larger of: max actual * 1.2 (20% padding) or target * 1.1 (10% padding)
    const calculatedMax = Math.max(maxActual * 1.2, targetValueEur * 1.1, 1) // At least 1K
    
    // Round up to nearest nice number (1, 2, 5, 10, 20, 50, etc.)
    const magnitude = Math.pow(10, Math.floor(Math.log10(calculatedMax)))
    const normalized = calculatedMax / magnitude
    let niceValue
    if (normalized <= 1) niceValue = 1
    else if (normalized <= 2) niceValue = 2
    else if (normalized <= 5) niceValue = 5
    else niceValue = 10
    
    return niceValue * magnitude
  }, [series.dataPoints, targetValue])

  // Generate dynamic Y-axis labels
  const yAxisLabels = useMemo(() => {
    const labels: string[] = []
    const steps = 5 // 5 grid lines
    for (let i = steps; i >= 0; i--) {
      const value = (dynamicMaxValue / steps) * i
      if (value >= 1) {
        labels.push(`${value}K`)
      } else if (value >= 0.1) {
        labels.push(`${Math.round(value * 100) / 100}`)
      } else {
        labels.push('0')
      }
    }
    return labels
  }, [dynamicMaxValue])

  // Calculate target ratio dynamically
  const targetRatio = useMemo(() => {
    if (!targetValue || targetValue <= 0 || dynamicMaxValue <= 0) return 0
    const ratio = targetValue / dynamicMaxValue
    // Ensure ratio is between 0 and 1
    return Math.max(0, Math.min(1, ratio))
  }, [targetValue, dynamicMaxValue])

  // All views now use cumulative data
  const isDayView = timeScale === 'day'

  const chartLineData = useMemo(() => {
    // All views (day/week/month) now show cumulative values
    return series.dataPoints.map((point) => ({
      ...point,
      cumulative: point.actual, // Use actual as cumulative value (already cumulative from API)
      collected: typeof point.collected === 'number' ? point.collected : 0,
      hasInvoice:
        typeof point.hasInvoice === 'boolean'
          ? point.hasInvoice
          : (point.invoiceCount ?? 0) > 0
      ,
      hasPayment:
        typeof point.hasPayment === 'boolean'
          ? point.hasPayment
          : (point.paymentCount ?? 0) > 0
    }))
  }, [series])

  const cutoffIndex = useMemo(() => {
    const now = new Date()
    const nowDateStr = formatDateMadrid(now)
    const anchorDateStr = formatDateMadrid(anchorDate)

    if (timeScale === 'day') {
      if (nowDateStr !== anchorDateStr) return null
      const nowHour = Number(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          hour12: false
        })
          .formatToParts(now)
          .find((p) => p.type === 'hour')?.value || '0'
      )
      // Stop at current hour point (so dashed line doesn't overpass now marker).
      const label = `${String(nowHour).padStart(2, '0')}:00`
      const idx = series.dataPoints.findIndex((p) => p.label === label)
      return idx >= 0 ? idx : null
    }

    if (timeScale === 'week') {
      // If viewing a week that contains "today", stop after today's point.
      const parseUTCDate = (s: string) => new Date(`${s}T00:00:00Z`)
      const anchorUTC = parseUTCDate(anchorDateStr)
      const anchorDay = anchorUTC.getUTCDay()
      const diffToMonday = (anchorDay + 6) % 7
      const weekStart = new Date(anchorUTC)
      weekStart.setUTCDate(anchorUTC.getUTCDate() - diffToMonday)
      const weekEnd = new Date(weekStart)
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
      const nowUTC = parseUTCDate(nowDateStr)
      if (nowUTC < weekStart || nowUTC > weekEnd) return null
      const dayOffset = Math.round((Number(nowUTC) - Number(weekStart)) / 86400000)
      // week dataPoints are Mon..Sun => index matches offset
      return Math.max(0, Math.min(series.dataPoints.length - 1, dayOffset))
    }

    if (timeScale === 'year') {
      const [ay] = anchorDateStr.split('-').map((v) => Number(v))
      const [ny, nm] = nowDateStr.split('-').map((v) => Number(v))
      if (ny !== ay) return null
      // Stop at current month index (0..11)
      const monthIdx = Math.max(0, Math.min(11, nm - 1))
      return Math.min(series.dataPoints.length - 1, monthIdx)
    }

    // month
    const [ay, am] = anchorDateStr.split('-').map((v) => Number(v))
    const [ny, nm, nd] = nowDateStr.split('-').map((v) => Number(v))
    if (ny !== ay || nm !== am) return null
    const todayLabelPrefix = `${nd}/${am}`
    const idx = series.dataPoints.findIndex((p) => p.label === todayLabelPrefix)
    return idx >= 0 ? idx : null
  }, [timeScale, anchorDate, series.dataPoints])

  const trimmedChartLineData = useMemo(() => {
    return chartLineData.map((p, idx) => ({
      ...p,
      cumulativeTrimmed:
        cutoffIndex === null ? p.cumulative : idx <= cutoffIndex ? p.cumulative : null
      ,
      collectedTrimmed:
        cutoffIndex === null ? p.collected : idx <= cutoffIndex ? p.collected : null
    }))
  }, [chartLineData, cutoffIndex])

  const nowLineLeftPercent = useMemo(() => {
    const now = new Date()
    const nowDateStr = formatDateMadrid(now) // YYYY-MM-DD (Madrid)
    const anchorDateStr = formatDateMadrid(anchorDate)

    const parseUTCDate = (s: string) => new Date(`${s}T00:00:00Z`)
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

    if (timeScale === 'day') {
      if (nowDateStr !== anchorDateStr) return null
      const hour = Number(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          hour12: false
        })
          .formatToParts(now)
          .find((p) => p.type === 'hour')?.value || '0'
      )
      const minute = Number(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Madrid',
          minute: '2-digit'
        })
          .formatToParts(now)
          .find((p) => p.type === 'minute')?.value || '0'
      )

      // Business hours 09:00–16:00 mapped across grid width.
      const t = hour + minute / 60
      const ratio = clamp01((t - 9) / 7)
      return percentOfWidth(GRID_LEFT_PX + ratio * GRID_WIDTH_PX)
    }

    if (timeScale === 'week') {
      const anchorUTC = parseUTCDate(anchorDateStr)
      const anchorDay = anchorUTC.getUTCDay() // 0..6
      const diffToMonday = (anchorDay + 6) % 7
      const weekStart = new Date(anchorUTC)
      weekStart.setUTCDate(anchorUTC.getUTCDate() - diffToMonday)
      const weekEnd = new Date(weekStart)
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

      const nowUTC = parseUTCDate(nowDateStr)
      if (nowUTC < weekStart || nowUTC > weekEnd) return null
      const dayOffset = Math.round((Number(nowUTC) - Number(weekStart)) / 86400000)
      const ratio = clamp01(dayOffset / 6)
      return percentOfWidth(GRID_LEFT_PX + ratio * GRID_WIDTH_PX)
    }

    if (timeScale === 'year') {
      const [ay] = anchorDateStr.split('-').map((v) => Number(v))
      const [ny, nm, nd] = nowDateStr.split('-').map((v) => Number(v))
      if (ny !== ay) return null
      const daysInYear = new Date(Date.UTC(ay + 1, 0, 0)).getUTCDate()
      const startOfYear = new Date(Date.UTC(ay, 0, 1))
      const nowUTC = parseUTCDate(nowDateStr)
      const dayOfYear = Math.round((Number(nowUTC) - Number(startOfYear)) / 86400000) + 1
      const denom = Math.max(daysInYear - 1, 1)
      const ratio = clamp01((dayOfYear - 1) / denom)
      return percentOfWidth(GRID_LEFT_PX + ratio * GRID_WIDTH_PX)
    }

    // month
    const [ay, am] = anchorDateStr.split('-').map((v) => Number(v))
    const [ny, nm, nd] = nowDateStr.split('-').map((v) => Number(v))
    if (ny !== ay || nm !== am) return null
    const daysInMonth = new Date(Date.UTC(ay, am, 0)).getUTCDate()
    const denom = Math.max(daysInMonth - 1, 1)
    const ratio = clamp01((nd - 1) / denom)
    return percentOfWidth(GRID_LEFT_PX + ratio * GRID_WIDTH_PX)
  }, [timeScale, anchorDate])

  const cardStyles: CSSProperties = {
    width: '100%',
    height: targetHeightRem ? `${targetHeightRem}rem` : `min(${CARD_HEIGHT_REM}rem, 100%)`,
    overflow: 'hidden',
    position: 'relative'
  }

  const [scale, setScale] = useState(1)
  const frameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = frameRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const widthRatio = entry.contentRect.width / CARD_WIDTH_PX
      const heightRatio = entry.contentRect.height / CARD_HEIGHT_PX
      setScale(Math.min(widthRatio, heightRatio))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [targetHeightRem])

  return (
    <article
      className='relative rounded-lg bg-surface shadow-elevation-card'
      style={cardStyles}
    >
      <div
        ref={frameRef}
        className='relative h-full w-full'
        style={{
          minHeight: CARD_HEIGHT_REM * scale,
          minWidth: CARD_WIDTH_PX * scale
        }}
      >
        <header
          className='absolute flex items-center justify-between'
          style={rectToStyle(HEADER_RECT)}
        >
          <h2 className='text-title-sm font-medium text-fg'>Ingresos</h2>
          <button
            type='button'
            className='inline-flex items-center gap-[0.25rem] text-label-md font-normal text-fg'
          >
            2024
            <span className='material-symbols-rounded text-[1rem] leading-4 text-fg'>
              arrow_drop_down
            </span>
          </button>
        </header>

        {/* Legend chips - Turquoise for Facturado, light teal for Objetivo */}
        <div
          className='absolute inline-flex items-center gap-[0.25rem] rounded-pill border px-[0.5rem] py-[0.25rem] text-label-md font-normal'
          style={{
            ...rectToStyle(FACT_CHIP_RECT),
            borderColor: isDayView ? '#51D6C7' : 'var(--color-brandSemantic)',
            color: isDayView ? '#51D6C7' : 'var(--color-brandSemantic)',
            whiteSpace: 'nowrap',
            zIndex: 5
          }}
        >
          <span>Facturado:</span>
          <span className='font-bold' style={{ color: isDayView ? '#51D6C7' : 'var(--color-brandSemantic)' }}>
            {facturadoValue.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} €
          </span>
        </div>

        <div
          className='absolute inline-flex items-center gap-[0.25rem] rounded-pill px-[0.5rem] py-[0.25rem] text-label-md font-normal'
          style={{
            ...rectToStyle(TARGET_CHIP_RECT),
            backgroundColor: 'rgba(81, 214, 199, 0.1)',
            color: 'var(--color-neutral-600)',
            whiteSpace: 'nowrap',
            zIndex: 5
          }}
        >
          <span>Objetivo:</span>
          <span className='font-bold text-neutral-900'>
            {(targetValue * 1000).toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </span>
        </div>

        <div
          className='absolute flex flex-col justify-between text-label-md font-normal text-neutral-400'
          style={rectToStyle(Y_AXIS_RECT)}
        >
          {yAxisLabels.map((label, idx) => (
            <span key={`${label}-${idx}`}>{label}</span>
          ))}
        </div>

        <div
          className='absolute flex items-center justify-between text-label-md font-normal text-neutral-400'
          style={rectToStyle(X_AXIS_RECT)}
        >
          {isLoading ? (
            <span>Cargando...</span>
          ) : (
            series.labels.map((label) => <span key={label}>{label}</span>)
          )}
        </div>

        <div className='absolute' style={rectToStyle(GRID_RECT)}>
          {!isLoading && (
            <>
          <ChartGrid steps={5} />
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={trimmedChartLineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id='colorActual' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#51D6C7' stopOpacity={0.4}/>
                  <stop offset='100%' stopColor='#51D6C7' stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id='colorTarget' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='#51D6C7' stopOpacity={0.16}/>
                  <stop offset='100%' stopColor='#51D6C7' stopOpacity={0.08}/>
                </linearGradient>
              </defs>
              <YAxis type='number' domain={[0, dynamicMaxValue]} hide />
              <XAxis dataKey='label' type='category' hide />
              <Tooltip content={<TrendTooltip />} />
              {/* Target as filled area band (no horizontal line) */}
              <Area
                type='monotone'
                dataKey={() => targetValue}
                stroke='none'
                fill='url(#colorTarget)'
                fillOpacity={1}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Area
                type='monotone'
                dataKey='cumulativeTrimmed'
                stroke='none'
                fill='url(#colorActual)'
                fillOpacity={1}
                connectNulls={false}
              />
              <Line
                type='monotone'
                dataKey='cumulativeTrimmed'
                stroke={isDayView ? '#51D6C7' : 'var(--color-brand-500)'} // Turquoise for day view
                strokeWidth={2.5}
                strokeDasharray='0'
                dot={(props: any) => {
                  const { cx, cy, payload } = props || {}
                  if (!payload?.hasInvoice) return null
                  const fill = isDayView ? '#51D6C7' : 'var(--color-brand-500)'
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={fill}
                      stroke='white'
                      strokeWidth={1.25}
                      style={{ cursor: payload?.bucketStart ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (!payload?.bucketStart || !payload?.bucketEnd) return
                        window.dispatchEvent(
                          new CustomEvent('caja:trend-drilldown', {
                            detail: { from: payload.bucketStart, to: payload.bucketEnd }
                          })
                        )
                      }}
                    />
                  )
                }}
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props || {}
                  if (!payload?.hasInvoice) return null
                  const fill = isDayView ? '#51D6C7' : 'var(--color-brand-500)'
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={fill}
                      stroke='white'
                      strokeWidth={1.5}
                    />
                  )
                }}
                animationDuration={1100}
                animationBegin={200}
                isAnimationActive={!isDayView} // Disable animation for day view to show full cumulative line immediately
              />

              {/* Second series: Cobrado (cumulative) */}
              <Line
                type='monotone'
                dataKey='collectedTrimmed'
                stroke='#22C55E'
                strokeWidth={2}
                strokeDasharray='0'
                dot={(props: any) => {
                  const { cx, cy, payload } = props || {}
                  if (!payload?.hasPayment) return null
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3.25}
                      fill='#22C55E'
                      stroke='white'
                      strokeWidth={1.25}
                      style={{ cursor: payload?.bucketStart ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (!payload?.bucketStart || !payload?.bucketEnd) return
                        window.dispatchEvent(
                          new CustomEvent('caja:trend-drilldown', {
                            detail: { from: payload.bucketStart, to: payload.bucketEnd }
                          })
                        )
                      }}
                    />
                  )
                }}
                isAnimationActive={!isDayView}
              />
            </AreaChart>
          </ResponsiveContainer>
            </>
          )}
        </div>

        {/* "Now" indicator - Yellow vertical line (all time scales, only if now is inside the displayed range) */}
        {nowLineLeftPercent && (
          <div
            className='absolute'
            style={{
              left: nowLineLeftPercent,
              top: percentOfHeight(GRID_TOP_PX),
              width: percentOfWidth(1),
              height: percentOfHeight(GRID_HEIGHT_PX),
              backgroundColor: '#FFD700',
              zIndex: 1
            }}
          />
        )}
      </div>
    </article>
  )
}

function ChartGrid({ steps = 5 }: { steps?: number }) {
  // Generate dynamic horizontal grid lines (5 lines for 0-4 steps)
  const horizontalLines = Array.from({ length: steps + 1 }, (_, i) => {
    return (GRID_HEIGHT_PX / steps) * i
  })
  
  return (
    <svg
      viewBox={`0 0 ${chartCanvas.width} ${chartCanvas.height}`}
      className='absolute inset-0'
      preserveAspectRatio='none'
    >
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          x2={chartCanvas.width}
          y1={y}
          y2={y}
          stroke='var(--chart-grid)'
          strokeWidth={1}
          opacity={0.35}
        />
      ))}
      {verticalLinesPx.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          x2={x}
          y1={0}
          y2={chartCanvas.height}
          stroke='var(--chart-grid)'
          strokeWidth={1}
          opacity={0.15}
        />
      ))}
    </svg>
  )
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0]?.payload || {}
  const producedK = typeof p.cumulative === 'number' ? p.cumulative : 0
  const collectedK = typeof p.collected === 'number' ? p.collected : 0

  return (
    <div className='rounded-lg border border-border bg-neutral-0 px-[0.75rem] py-[0.5rem] text-body-sm text-fg shadow-elevation-popover'>
      <div className='mb-[0.25rem] text-label-sm text-neutral-600'>{label}</div>
      <div className='flex items-center justify-between gap-[1rem]'>
        <span className='text-neutral-600'>Producido</span>
        <span className='font-medium text-fg'>
          {(producedK * 1000).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
        </span>
      </div>
      <div className='flex items-center justify-between gap-[1rem]'>
        <span className='text-neutral-600'>Cobrado</span>
        <span className='font-medium text-fg'>
          {(collectedK * 1000).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €
        </span>
      </div>
      <div className='mt-[0.25rem] text-[0.75rem] text-neutral-500'>Click para ver movimientos</div>
    </div>
  )
}

function buildSeries(scale: CashTimeScale, anchorDate: Date): SeriesResult {
  switch (scale) {
    case 'week':
      return buildWeeklySeries(anchorDate)
    case 'month':
      return buildMonthlySeries(anchorDate)
    case 'day':
    default:
      return buildDailySeries(anchorDate)
  }
}

function buildDailySeries(anchorDate: Date): SeriesResult {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric'
  })
  const dataPoints: SeriesPoint[] = []
  for (let delta = 6; delta >= 0; delta--) {
    const date = addDays(anchorDate, -delta)
    dataPoints.push({
      label: formatter.format(date),
      actual: generateValue(date, 1.4, 12)
    })
  }
  return {
    labels: dataPoints.map((point) => point.label),
    dataPoints,
    highlightIndex: dataPoints.length - 1
  }
}

function buildWeeklySeries(anchorDate: Date): SeriesResult {
  const dataPoints: SeriesPoint[] = []
  for (let delta = 3; delta >= 0; delta--) {
    const start = startOfWeek(addDays(anchorDate, -7 * delta))
    const weekNumber = getWeekOfYear(start)
    dataPoints.push({
      label: `Sem ${weekNumber}`,
      actual: generateValue(start, 2.2, 18)
    })
  }
  return {
    labels: dataPoints.map((point) => point.label),
    dataPoints,
    highlightIndex: dataPoints.length - 1
  }
}

function buildMonthlySeries(anchorDate: Date): SeriesResult {
  const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
  const dataPoints: SeriesPoint[] = []
  for (let delta = 5; delta >= 0; delta--) {
    const date = addMonths(anchorDate, -delta)
    dataPoints.push({
      label: formatter.format(date),
      actual: generateValue(date, 2.5, 20)
    })
  }
  return {
    labels: dataPoints.map((point) => point.label),
    dataPoints,
    highlightIndex: dataPoints.length - 1
  }
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

function addMonths(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + amount)
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

function generateValue(date: Date, slope: number, base: number) {
  const seed = date.getDate() + date.getMonth() * 31
  const noise = ((seed * 11) % 7) * 0.6
  const trend = ((date.getMonth() % 6) + 1) * slope
  const value = Math.min(48, Math.max(8, base + trend + noise))
  return Math.round((value + Number.EPSILON) * 10) / 10
}

