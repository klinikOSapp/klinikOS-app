'use client'

import { CashClosingModal } from '@/components/caja/CashClosingModal'
import { type CashTimeScale } from '@/components/caja/cajaTypes'
import DateNavigator from '@/components/gestion/DateNavigator'
import { useCashClosing } from '@/context/CashClosingContext'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent
} from 'react'

const CTA_WIDTH_REM = 7.3125 // 117px ÷ 16
const CTA_HEIGHT_REM = 2.5 // 40px ÷ 16
const SCALE_MIN_WIDTH_REM = 5.5625 // 89px ÷ 16 (Figma dropdown pill)
const SCALE_POPOVER_WIDTH_REM = 9.3125 // 149px ÷ 16 (Agenda dropdown width)

type CashToolbarProps = {
  dateLabel: string
  onNavigateNext: () => void
  onNavigatePrevious: () => void
  timeScale: CashTimeScale
  onTimeScaleChange: (scale: CashTimeScale) => void
  showClosingButton?: boolean
  currentDate?: Date // The date being viewed
}

const SCALE_OPTIONS: { id: CashTimeScale; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' }
]

/**
 * Get the ISO date string for today
 */
function getTodayISO(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get ISO date string from Date object
 */
function dateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CashToolbar({
  dateLabel,
  onNavigateNext,
  onNavigatePrevious,
  timeScale,
  onTimeScaleChange,
  showClosingButton = true,
  currentDate
}: CashToolbarProps) {
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false)
  const [isScaleDropdownOpen, setIsScaleDropdownOpen] = useState(false)
  const [selectedClosingDate, setSelectedClosingDate] = useState<
    string | undefined
  >()
  const scaleDropdownRef = useRef<HTMLDivElement | null>(null)

  // Get closing context
  const { isDayClosed, getAvailableDates } = useCashClosing()

  // Determine which date to check for closure status
  const dateToCheck = useMemo(() => {
    if (currentDate) return dateToISO(currentDate)
    return getTodayISO()
  }, [currentDate])

  // Check if today is closed
  const todayIsClosed = isDayClosed(getTodayISO())

  // Check if current view date is closed
  const currentDateIsClosed = isDayClosed(dateToCheck)

  // Get list of unclosed dates (for the quick action menu)
  const unclosedDates = useMemo(() => {
    const availableDates = getAvailableDates()
    return availableDates.filter((date) => !isDayClosed(date))
  }, [getAvailableDates, isDayClosed])

  const currentScaleLabel =
    SCALE_OPTIONS.find(({ id }) => id === timeScale)?.label ?? ''

  const ctaStyles: CSSProperties = {
    minHeight: `min(${CTA_HEIGHT_REM}rem, 6vh)`
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        scaleDropdownRef.current &&
        !scaleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsScaleDropdownOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsScaleDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const toggleScaleDropdown = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setIsScaleDropdownOpen((prev) => !prev)
  }

  const handleScaleSelect = (scale: CashTimeScale) => {
    onTimeScaleChange(scale)
    setIsScaleDropdownOpen(false)
  }

  const handleOpenClosingModal = (dateOverride?: string) => {
    setSelectedClosingDate(dateOverride)
    setIsClosingModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsClosingModalOpen(false)
    setSelectedClosingDate(undefined)
  }

  return (
    <div className='mt-[var(--spacing-plnav)] flex items-center justify-between gap-fluid-sm'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-gapmd'>
          <DateNavigator
            dateLabel={dateLabel}
            onNext={onNavigateNext}
            onPrevious={onNavigatePrevious}
          />

          <div className='flex items-center gap-gapsm' ref={scaleDropdownRef}>
            <div className='relative'>
              <button
                type='button'
                className='inline-flex h-[var(--nav-chip-height)] min-w-0 items-center justify-between gap-gapsm rounded-full border border-border bg-surface-app px-[var(--nav-chip-pad-x)] text-title-sm font-medium text-fg transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0'
                style={{
                  minWidth: `min(${SCALE_MIN_WIDTH_REM}rem, 40vw)`
                }}
                aria-haspopup='listbox'
                aria-expanded={isScaleDropdownOpen}
                onClick={toggleScaleDropdown}
              >
                <span className='text-nowrap'>{currentScaleLabel}</span>
                <span className='material-symbols-rounded rotate-90 text-fg'>
                  arrow_forward_ios
                </span>
              </button>

              {isScaleDropdownOpen ? (
                <div
                  className='absolute left-0 top-[calc(100%+0.5rem)] z-20 flex flex-col rounded-[var(--radius-xl)] border border-border bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.08)]'
                  style={{ width: `min(${SCALE_POPOVER_WIDTH_REM}rem, 40vw)` }}
                >
                  {SCALE_OPTIONS.map(({ id, label }) => {
                    const isActive = timeScale === id
                    return (
                      <button
                        key={id}
                        type='button'
                        role='option'
                        aria-selected={isActive}
                        className={`flex w-full items-center justify-between gap-gapsm px-[0.75rem] py-[0.5rem] text-left text-title-sm font-medium text-fg transition-colors hover:bg-surface focus:outline-none ${
                          isActive ? 'bg-brand-50 text-fg' : ''
                        }`}
                        onClick={() => handleScaleSelect(id)}
                      >
                        <span className='text-nowrap'>{label}</span>
                        {isActive ? (
                          <span className='material-symbols-rounded text-[1rem] leading-4 text-brandSemantic'>
                            check
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Closed indicator badge */}
          {todayIsClosed && (
            <div className='flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1.5 text-label-sm font-medium text-success-700'>
              <span className='material-symbols-rounded text-[1rem]'>
                check_circle
              </span>
              <span>Hoy cerrado</span>
            </div>
          )}

          {/* Pending closings indicator */}
          {unclosedDates.length > 0 && !todayIsClosed && (
            <div className='flex items-center gap-1.5 rounded-full bg-warning-100 px-3 py-1.5 text-label-sm font-medium text-warning-700'>
              <span className='material-symbols-rounded text-[1rem]'>
                schedule
              </span>
              <span>
                {unclosedDates.length === 1
                  ? '1 día pendiente'
                  : `${unclosedDates.length} días pendientes`}
              </span>
            </div>
          )}
        </div>
      </div>

      {showClosingButton ? (
        <div className='flex shrink-0 items-center gap-3'>
          <button
            type='button'
            className='inline-flex items-center justify-center whitespace-nowrap rounded-full bg-brand-500 px-[1.25rem] py-[0.625rem] text-title-sm font-medium text-neutral-900 shadow-cta transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app'
            style={ctaStyles}
            onClick={() => handleOpenClosingModal()}
            aria-haspopup='dialog'
            aria-expanded={isClosingModalOpen}
          >
            <span className='material-symbols-rounded mr-1.5 text-[1rem]'>
              point_of_sale
            </span>
            Cerrar caja
          </button>

          <CashClosingModal
            open={isClosingModalOpen}
            onClose={handleCloseModal}
            initialDate={selectedClosingDate}
          />
        </div>
      ) : null}
    </div>
  )
}
