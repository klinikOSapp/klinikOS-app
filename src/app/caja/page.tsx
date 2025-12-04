'use client'

import ClientLayout from '@/app/client-layout'
import CashMovementsTable from '@/components/caja/CashMovementsTable'
import CashSummaryCard from '@/components/caja/CashSummaryCard'
import CashToolbar from '@/components/caja/CashToolbar'
import CashTrendCard from '@/components/caja/CashTrendCard'
import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useMemo, useState } from 'react'

export default function CajaPage() {
  const [timeScale, setTimeScale] = useState<CashTimeScale>('day')
  const [anchorDate, setAnchorDate] = useState(() => new Date())

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

  return (
    <ClientLayout>
      <div className='bg-surface-app min-h-screen overflow-auto pb-plnav'>
        <div className='container-page py-fluid-md pb-plnav'>
          <CashToolbar
            dateLabel={dateLabel}
            onNavigateNext={() => handleNavigate(1)}
            onNavigatePrevious={() => handleNavigate(-1)}
            timeScale={timeScale}
            onTimeScaleChange={handleTimeScaleChange}
          />
          <div className='mt-header-stack flex justify-center'>
            <div
              className='grid gap-gapmd'
              style={{
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                width: 'min(99.5rem, 95vw)'
              }}
            >
              <CashSummaryCard />
              <CashTrendCard timeScale={timeScale} anchorDate={anchorDate} />
            </div>
          </div>
          <CashMovementsTable />
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
