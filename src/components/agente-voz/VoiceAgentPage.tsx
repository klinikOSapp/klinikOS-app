'use client'

import { useSubscription } from '@/context/SubscriptionContext'
import { Suspense, useState } from 'react'
import CallDistributionDonut from './CallDistributionDonut'
import CallVolumeChart from './CallVolumeChart'
import CallsTable from './CallsTable'
import VoiceAgentKPICard from './VoiceAgentKPICard'
import type { VoiceAgentKPI, VoiceAgentTier } from './voiceAgentTypes'

// Helper: Get the start of the week (Monday) for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust to Monday (day 0 = Sunday, so we need to go back to previous Monday)
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper: Get the end of the week (Sunday) for a given date
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  return d
}

// Helper: Format date range for display
function formatWeekRange(weekStart: Date): string {
  const weekEnd = getWeekEnd(weekStart)
  const startDay = weekStart.getDate()
  const endDay = weekEnd.getDate()
  const startMonth = weekStart.toLocaleDateString('es-ES', { month: 'short' })
  const endMonth = weekEnd.toLocaleDateString('es-ES', { month: 'short' })
  const year = weekEnd.getFullYear()

  // If same month, show: "27 - 2 Feb 2026" or "27 Ene - 2 Feb 2026" if different months
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${year}`
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
}

// Helper: Check if two dates are in the same week
function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = getWeekStart(date1)
  const week2 = getWeekStart(date2)
  return week1.getTime() === week2.getTime()
}

// KPI data from Figma design - Advanced mode (with auto-appointment creation)
const KPI_DATA_ADVANCED: VoiceAgentKPI[] = [
  {
    label: 'Citas creadas',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Llamadas recibidas',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Tiempo medio llamada',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Llamadas resueltas',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Créditos usados',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Tiempo de espera medio',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  }
]

// KPI data for Basic mode (receptionist - no auto-appointment creation)
// Replaces "Citas creadas" with "Llamadas pendientes"
const KPI_DATA_BASIC: VoiceAgentKPI[] = [
  {
    label: 'Llamadas pendientes',
    value: '12',
    changePercent: '- 8%',
    changeDirection: 'down',
    comparisonValue: '13',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Llamadas recibidas',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Tiempo medio llamada',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Llamadas resueltas',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Créditos usados',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  },
  {
    label: 'Tiempo de espera medio',
    value: '456',
    changePercent: '+ 12%',
    changeDirection: 'up',
    comparisonValue: '430',
    comparisonLabel: 'hace una semana'
  }
]

// Get KPI data based on voice agent tier
function getKPIData(tier: VoiceAgentTier): VoiceAgentKPI[] {
  return tier === 'basic' ? KPI_DATA_BASIC : KPI_DATA_ADVANCED
}

/**
 * Voice Agent Page
 * Main layout integrating KPIs, charts, and calls table
 * Figma: 1664 × 1016px content area (after sidebar 256px and topbar 64px)
 *
 * Supports two tiers:
 * - basic: Receptionist mode - collects info, user calls back to schedule
 * - advanced: Full automation - creates appointments automatically
 */
export default function VoiceAgentPage() {
  // Get subscription tier (basic/advanced) and setter for testing toggle
  const { voiceAgentTier, setVoiceAgentTier } = useSubscription()

  // Get KPI data based on tier
  const kpiData = getKPIData(voiceAgentTier)

  // State for selected week (defaults to current week)
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  )

  // Check if we're viewing the current week
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date())

  // Navigation functions
  const goToPreviousWeek = () => {
    setSelectedWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 7)
      return newDate
    })
  }

  const goToNextWeek = () => {
    if (!isCurrentWeek) {
      setSelectedWeekStart((prev) => {
        const newDate = new Date(prev)
        newDate.setDate(newDate.getDate() + 7)
        return newDate
      })
    }
  }

  const goToCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()))
  }

  return (
    <div className='flex flex-col gap-[min(1rem,2vw)] p-[min(1rem,2vw)] w-full h-full overflow-hidden'>
      {/* Week Navigator */}
      <div className='flex items-center gap-4 shrink-0'>
        {/* Navigation Controls */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={goToPreviousWeek}
            className='size-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors cursor-pointer'
            aria-label='Semana anterior'
          >
            <span className='material-symbols-rounded text-xl text-neutral-700'>
              chevron_left
            </span>
          </button>
          <span className='text-title-md font-medium text-neutral-900 min-w-[10rem] text-center'>
            {formatWeekRange(selectedWeekStart)}
          </span>
          <button
            type='button'
            onClick={goToNextWeek}
            disabled={isCurrentWeek}
            className={`size-8 inline-flex items-center justify-center rounded-full transition-colors ${
              isCurrentWeek
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-neutral-100 cursor-pointer'
            }`}
            aria-label='Semana siguiente'
          >
            <span className='material-symbols-rounded text-xl text-neutral-700'>
              chevron_right
            </span>
          </button>
        </div>

        {/* Current Week Button */}
        {!isCurrentWeek && (
          <button
            type='button'
            onClick={goToCurrentWeek}
            className='px-3 py-1 text-body-sm font-medium text-brand-700 bg-brand-0 border border-brand-200 rounded-full hover:bg-brand-100 transition-colors cursor-pointer'
          >
            Esta semana
          </button>
        )}

        {/* Weekly Data Indicator */}
        <span className='px-2 py-0.5 text-label-sm bg-brand-0 text-brand-700 border border-brand-200 rounded-full'>
          Datos semanales
        </span>

        {/* Voice Agent Tier Toggle (for testing - will be moved to config later) */}
        <div className='flex items-center gap-2 ml-auto'>
          <span className='text-label-sm text-neutral-500'>Modo:</span>
          <button
            type='button'
            onClick={() =>
              setVoiceAgentTier(
                voiceAgentTier === 'advanced' ? 'basic' : 'advanced'
              )
            }
            className={`relative inline-flex h-7 w-[8.5rem] items-center rounded-full transition-colors cursor-pointer p-0.5 ${
              voiceAgentTier === 'advanced'
                ? 'bg-success-100 border border-success-300'
                : 'bg-neutral-100 border border-neutral-300'
            }`}
            title='Click para cambiar de modo (solo para testing)'
          >
            {/* Sliding indicator */}
            <span
              className={`absolute h-6 w-[4rem] rounded-full transition-all duration-200 ease-in-out ${
                voiceAgentTier === 'advanced'
                  ? 'translate-x-[4.25rem] bg-success-500'
                  : 'translate-x-0.5 bg-neutral-500'
              }`}
            />
            {/* Labels container */}
            <span className='relative flex w-full h-full'>
              {/* Basic label */}
              <span
                className={`flex-1 flex items-center justify-center text-label-sm font-medium transition-colors z-10 ${
                  voiceAgentTier === 'basic' ? 'text-white' : 'text-neutral-500'
                }`}
              >
                Básico
              </span>
              {/* Advanced label */}
              <span
                className={`flex-1 flex items-center justify-center text-label-sm font-medium transition-colors z-10 ${
                  voiceAgentTier === 'advanced'
                    ? 'text-white'
                    : 'text-neutral-500'
                }`}
              >
                Avanzado
              </span>
            </span>
          </button>
          {/* Tier indicator icon */}
          <span
            className={`material-symbols-rounded text-lg ${
              voiceAgentTier === 'advanced'
                ? 'text-success-600'
                : 'text-neutral-500'
            }`}
            title={
              voiceAgentTier === 'advanced'
                ? 'Crea citas automáticamente'
                : 'Recoge información para gestión manual'
            }
          >
            {voiceAgentTier === 'advanced' ? 'auto_awesome' : 'support_agent'}
          </span>
        </div>
      </div>

      {/* Top Section: KPIs + Charts - Fixed */}
      <div className='flex gap-[min(1rem,2vw)] w-full shrink-0'>
        {/* KPI Grid - 2 columns × 3 rows */}
        <div className='grid grid-cols-2 gap-[min(0.75rem,1vw)] gap-y-[min(0.5rem,1vw)] shrink-0'>
          {kpiData.map((kpi) => (
            <VoiceAgentKPICard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Donut Chart */}
        <div className='w-[min(16rem,22vw)] shrink-0'>
          <CallDistributionDonut tier={voiceAgentTier} />
        </div>

        {/* Line Chart - Takes remaining space */}
        <div className='flex-1 min-w-[min(30rem,40vw)]'>
          <CallVolumeChart tier={voiceAgentTier} />
        </div>
      </div>

      {/* Bottom Section: Calls Table - Scrollable */}
      <div className='flex-1 min-h-0 bg-surface-app overflow-y-auto'>
        <Suspense fallback={<div className='p-4'>Cargando...</div>}>
          <CallsTable voiceAgentTier={voiceAgentTier} />
        </Suspense>
      </div>
    </div>
  )
}
