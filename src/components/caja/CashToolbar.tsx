'use client'

import { CashClosingModal } from '@/components/caja/CashClosingModal'
import { type CashTimeScale } from '@/components/caja/cajaTypes'
import DateNavigator from '@/components/gestion/DateNavigator'
import { useState, type CSSProperties } from 'react'

const CTA_WIDTH_REM = 7.3125 // 117px ÷ 16
const CTA_HEIGHT_REM = 2.5 // 40px ÷ 16
const CHIP_HEIGHT_REM = 2.5 // 40px ÷ 16

const sharedChipClasses =
  'inline-flex items-center gap-gapsm rounded-full border border-border bg-surface px-[1rem] py-[0.5rem] text-title-sm font-medium text-fg transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0'

type CashToolbarProps = {
  dateLabel: string
  onNavigateNext: () => void
  onNavigatePrevious: () => void
  timeScale: CashTimeScale
  onTimeScaleChange: (scale: CashTimeScale) => void
}

const SCALE_OPTIONS: { id: CashTimeScale; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' }
]

export default function CashToolbar({
  dateLabel,
  onNavigateNext,
  onNavigatePrevious,
  timeScale,
  onTimeScaleChange
}: CashToolbarProps) {
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false)

  const ctaStyles: CSSProperties = {
    width: `min(${CTA_WIDTH_REM}rem, 100%)`,
    minHeight: `min(${CTA_HEIGHT_REM}rem, 6vh)`
  }

  return (
    <div className='mt-[var(--spacing-plnav)] flex flex-col gap-fluid-sm xl:flex-row xl:items-center xl:justify-between'>
      <div className='w-full xl:w-auto'>
        <div className='flex flex-wrap items-center gap-gapmd'>
          <DateNavigator
            dateLabel={dateLabel}
            onNext={onNavigateNext}
            onPrevious={onNavigatePrevious}
          />

          <div className='flex items-center gap-gapsm'>
            {SCALE_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type='button'
                className={`${sharedChipClasses} ${
                  timeScale === id
                    ? 'border-brandSemantic bg-brand-50 text-brandSemantic'
                    : ''
                }`}
                style={{
                  minHeight: `min(${CHIP_HEIGHT_REM}rem, 7vh)`
                }}
                onClick={() => onTimeScaleChange(id)}
              >
                <span>{label}</span>
                {timeScale === id && (
                  <span className='material-symbols-rounded text-[1rem] leading-4 text-brandSemantic'>
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type='button'
        className='inline-flex items-center justify-center rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-neutral-900 shadow-cta transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app'
        style={ctaStyles}
        onClick={() => setIsClosingModalOpen(true)}
        aria-haspopup='dialog'
        aria-expanded={isClosingModalOpen}
      >
        Cerrar caja
      </button>

      <CashClosingModal
        open={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
      />
    </div>
  )
}




