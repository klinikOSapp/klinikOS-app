'use client'

import ClientLayout from '@/app/client-layout'
import CashMovementsTable from '@/components/caja/CashMovementsTable'
import CashSummaryCard from '@/components/caja/CashSummaryCard'
import CashToolbar from '@/components/caja/CashToolbar'
import CashTrendCard from '@/components/caja/CashTrendCard'
import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useCallback, useMemo, useState } from 'react'

const SUMMARY_CARD_WIDTH_REM = 66.8125 // 1069px
const TREND_CARD_MIN_WIDTH_REM = 32.6875 // 523px

export default function CajaPage() {
  const [timeScale, setTimeScale] = useState<CashTimeScale>('day')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [summaryHeightRem, setSummaryHeightRem] = useState<number | null>(null)

  const dateLabel = useMemo(
    () => formatToolbarLabel(anchorDate, timeScale),
    [anchorDate, timeScale]
  )

  const handleNavigate = (direction: 1 | -1) => {
    setAnchorDate((prev) => shiftAnchor(prev, timeScale, direction))
  }

  const handleTimeScaleChange = (scale: CashTimeScale) => {
    setTimeScale(scale)
    setAnchorDate(new Date())
  }

  const handleSummaryHeight = useCallback((heightRem: number) => {
    setSummaryHeightRem((prev) =>
      prev !== null && Math.abs(prev - heightRem) < 0.01 ? prev : heightRem
    )
  }, [])

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-surface-app rounded-tl-[var(--radius-xl)] px-[min(1.5rem,2vw)] py-[min(1.5rem,2vw)] flex flex-col overflow-hidden'>
        <CashToolbar
          dateLabel={dateLabel}
          onNavigateNext={() => handleNavigate(1)}
          onNavigatePrevious={() => handleNavigate(-1)}
          timeScale={timeScale}
          onTimeScaleChange={handleTimeScaleChange}
        />

        <div className='flex flex-col flex-1 overflow-hidden gap-[min(0.75rem,1vw)]' style={{ marginTop: 'var(--spacing-header-stack)' }}>
          <div
            className='flex flex-col gap-[min(1.5rem,2vw)] xl:grid xl:items-stretch'
            style={{
              gridTemplateColumns: `minmax(0, ${SUMMARY_CARD_WIDTH_REM}rem) minmax(${TREND_CARD_MIN_WIDTH_REM}rem, 1fr)`
            }}
          >
            <div className='w-full'>
              <CashSummaryCard
                date={anchorDate}
                timeScale={timeScale}
                onHeightChange={handleSummaryHeight}
              />
            </div>
            <div className='w-full'>
              <CashTrendCard
                timeScale={timeScale}
                anchorDate={anchorDate}
                targetHeightRem={summaryHeightRem ?? undefined}
              />
            </div>
          </div>

          <CashMovementsTable date={anchorDate} timeScale={timeScale} />
        </div>
      </div>
    </ClientLayout>
  )
}

function formatToolbarLabel(date: Date, scale: CashTimeScale) {
  const intlDay = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  switch (scale) {
    case 'week': {
      const start = startOfWeek(date)
      const end = addDays(start, 6)
      return `${intlDay.format(start)} - ${intlDay.format(end)}`
    }
    case 'month': {
      return new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric'
      }).format(date)
    }
    case 'day':
    default: {
      return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date)
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

