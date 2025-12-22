'use client'

import ClientLayout from '@/app/client-layout'
import CashToolbar from '@/components/caja/CashToolbar'
import AccountingPanel from '@/components/gestion/AccountingPanel'
import BillingLineChart from '@/components/gestion/BillingLineChart'
import IncomeTypes from '@/components/gestion/IncomeTypes'
import PatientsSummary from '@/components/gestion/PatientsSummary'
import ProductionTotalCard from '@/components/gestion/ProductionTotalCard'
import ProfessionalBars from '@/components/gestion/ProfessionalBars'
import SpecialtyDonut from '@/components/gestion/SpecialtyDonut'
import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { useCallback, useMemo, useState } from 'react'

const secondRowStyles = {
  '--height-card-chart-fluid': '100%',
  '--height-card-chart': '100%'
} as CSSProperties

const thirdRowStyles = {
  '--height-card-chart-fluid': '100%',
  '--height-card-chart': '100%',
  '--height-card-chart-fluid-base': '100%',
  '--chart-prof-height-limit': '100%',
  '--accounting-height-limit': '100%'
} as CSSProperties

export default function GestionPage() {
  const [timeScale, setTimeScale] = useState<CashTimeScale>('week')
  const [anchorDate, setAnchorDate] = useState(() => new Date())

  const dateLabel = useMemo(
    () => formatToolbarLabel(anchorDate, timeScale),
    [anchorDate, timeScale]
  )

  const handleNavigate = useCallback(
    (direction: 1 | -1) => {
      setAnchorDate((prev) => {
        const candidate = shiftAnchor(prev, timeScale, direction)
        return isAfterCurrentPeriod(candidate, timeScale) ? prev : candidate
      })
    },
    [timeScale]
  )

  const handleTimeScaleChange = useCallback((scale: CashTimeScale) => {
    setTimeScale(scale)
    setAnchorDate(new Date())
  }, [])

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-surface-app rounded-tl-[var(--radius-xl)] flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-y-auto overflow-x-hidden'>
          <div className='container-page py-fluid-md pb-plnav flex h-full flex-col gap-gapmd overflow-hidden'>
            <CashToolbar
              dateLabel={dateLabel}
              onNavigateNext={() => handleNavigate(1)}
              onNavigatePrevious={() => handleNavigate(-1)}
              timeScale={timeScale}
              onTimeScaleChange={handleTimeScaleChange}
              showClosingButton={false}
            />

            <div className='flex h-full flex-col gap-gapmd min-h-0'>
              {/* First row - Stats cards */}
              <div className='dashboard-grid-stats flex-none min-w-0'>
                <IncomeTypes timeScale={timeScale} />
                <PatientsSummary timeScale={timeScale} />
                <ProductionTotalCard timeScale={timeScale} />
              </div>

              {/* Second row - Billing chart + Specialty donut */}
              <div
                className='dashboard-grid-charts flex-1 min-h-0 min-w-0'
                style={secondRowStyles}
              >
                <BillingLineChart
                  timeScale={timeScale}
                  anchorDate={anchorDate}
                />
                <SpecialtyDonut timeScale={timeScale} />
              </div>

              {/* Third row - Accounting + Professional bars */}
              <div
                className='dashboard-grid-charts dashboard-grid-bottom flex-1 min-h-0 min-w-0'
                style={thirdRowStyles}
              >
                <AccountingPanel timeScale={timeScale} />
                <ProfessionalBars timeScale={timeScale} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

function formatToolbarLabel(date: Date, scale: CashTimeScale) {
  switch (scale) {
    case 'week': {
      const start = startOfWeek(date)
      const end = addDays(start, 6)
      const startLabel = formatDateWithCapitalizedMonths(start, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      const endLabel = formatDateWithCapitalizedMonths(end, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      return `${startLabel} - ${endLabel}`
    }
    case 'month': {
      return formatDateWithCapitalizedMonths(date, {
        month: 'long',
        year: 'numeric'
      })
    }
    case 'day':
    default: {
      return formatDateWithCapitalizedMonths(date, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  }
}

function shiftAnchor(date: Date, scale: CashTimeScale, direction: 1 | -1) {
  const multiplier = direction === 1 ? 1 : -1
  switch (scale) {
    case 'week':
      return addDays(date, multiplier * 7)
    case 'month':
      return addMonths(date, multiplier)
    case 'day':
    default:
      return addDays(date, multiplier)
  }
}

function isAfterCurrentPeriod(date: Date, scale: CashTimeScale) {
  const today = new Date()
  switch (scale) {
    case 'week':
      return startOfWeek(date) > startOfWeek(today)
    case 'month': {
      const target = new Date(date.getFullYear(), date.getMonth(), 1)
      const current = new Date(today.getFullYear(), today.getMonth(), 1)
      return target > current
    }
    case 'day':
    default:
      return date > today
  }
}

function formatDateWithCapitalizedMonths(
  date: Date,
  options: Intl.DateTimeFormatOptions
) {
  const formatted = new Intl.DateTimeFormat('es-ES', options).format(date)
  return capitalizeSpanishMonth(formatted)
}

function capitalizeSpanishMonth(label: string) {
  const longMap: Record<string, string> = {
    enero: 'Enero',
    febrero: 'Febrero',
    marzo: 'Marzo',
    abril: 'Abril',
    mayo: 'Mayo',
    junio: 'Junio',
    julio: 'Julio',
    agosto: 'Agosto',
    septiembre: 'Septiembre',
    octubre: 'Octubre',
    noviembre: 'Noviembre',
    diciembre: 'Diciembre'
  }

  const shortMap: Record<string, string> = {
    ene: 'Ene',
    feb: 'Feb',
    mar: 'Mar',
    abr: 'Abr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    ago: 'Ago',
    sept: 'Sept',
    oct: 'Oct',
    nov: 'Nov',
    dic: 'Dic'
  }

  let result = label.replace(
    /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi,
    (match) => longMap[match.toLowerCase()] ?? match
  )

  result = result.replace(
    /\b(ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic)\b/gi,
    (match) => shortMap[match.toLowerCase()] ?? match
  )

  return result
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
