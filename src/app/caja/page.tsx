'use client'

import ClientLayout from '@/app/client-layout'
import CashMovementsTable from '@/components/caja/CashMovementsTable'
import CashSummaryCard from '@/components/caja/CashSummaryCard'
import CashToolbar from '@/components/caja/CashToolbar'
import CashTrendCard from '@/components/caja/CashTrendCard'
import type { CashTimeScale } from '@/components/caja/cajaTypes'
import PatientRecordModal, {
  type PatientRecordTab
} from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import { useCallback, useMemo, useState } from 'react'

const SUMMARY_CARD_WIDTH_REM = 66.8125 // 1069px
const TREND_CARD_MIN_WIDTH_REM = 32.6875 // 523px

export default function CajaPage() {
  const [timeScale, setTimeScale] = useState<CashTimeScale>('week')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [summaryHeightRem, setSummaryHeightRem] = useState<number | null>(null)
  const [patientRecordOpen, setPatientRecordOpen] = useState(false)
  const [patientRecordTab, setPatientRecordTab] =
    useState<PatientRecordTab>('Resumen')
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)

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

  const handleViewPatient = useCallback((movement: { patient: string }) => {
    setSelectedPatient(movement.patient)
    setPatientRecordTab('Presupuestos y pagos')
    setPatientRecordOpen(true)
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
            />

            <div className='flex flex-col flex-1 overflow-hidden gap-gapmd'>
              <div
                className='flex flex-col gap-gapmd xl:grid xl:items-stretch'
                style={{
                  gridTemplateColumns: `minmax(0, ${SUMMARY_CARD_WIDTH_REM}rem) minmax(${TREND_CARD_MIN_WIDTH_REM}rem, 1fr)`
                }}
              >
                <div className='w-full'>
                  <CashSummaryCard onHeightChange={handleSummaryHeight} />
                </div>
                <div className='w-full'>
                  <CashTrendCard
                    timeScale={timeScale}
                    anchorDate={anchorDate}
                    targetHeightRem={summaryHeightRem ?? undefined}
                  />
                </div>
              </div>

              <CashMovementsTable onViewPatient={handleViewPatient} />
            </div>
          </div>
        </div>
      </div>

      <PatientRecordModal
        open={patientRecordOpen}
        onClose={() => setPatientRecordOpen(false)}
        initialTab={patientRecordTab}
      />
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
