import DateNavigator from '@/components/gestion/DateNavigator'
import type { CSSProperties } from 'react'

const DAY_BUTTON_WIDTH_REM = 5.5625 // 89px ÷ 16
const CTA_WIDTH_REM = 7.3125 // 117px ÷ 16
const CHIP_HEIGHT_REM = 2.5 // 40px ÷ 16

const sharedChipClasses =
  'inline-flex items-center gap-gapsm rounded-full border border-border bg-surface px-[1rem] py-[0.5rem] text-title-sm font-medium text-fg transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0'

export default function CashToolbar() {
  const dayButtonStyles: CSSProperties = {
    width: `min(${DAY_BUTTON_WIDTH_REM}rem, 28vw)`,
    minHeight: `min(${CHIP_HEIGHT_REM}rem, 7vh)`
  }

  const ctaStyles: CSSProperties = {
    width: `min(${CTA_WIDTH_REM}rem, 32vw)`,
    minHeight: `min(${CHIP_HEIGHT_REM}rem, 7vh)`
  }

  return (
    <div className='flex flex-col gap-fluid-sm xl:flex-row xl:items-center xl:justify-between mt-[var(--spacing-plnav)]'>
      <div className='w-full xl:w-auto'>
        <div className='flex flex-wrap items-center gap-gapmd'>
          <DateNavigator dateLabel='28 oct 2025' />

          <button
            type='button'
            className={sharedChipClasses}
            style={dayButtonStyles}
          >
            <span>Día</span>
            <span className='material-symbols-rounded rotate-90 text-[1rem] leading-4 text-fg'>
              arrow_forward_ios
            </span>
          </button>
        </div>
      </div>

      <button
        type='button'
        className='rounded-full bg-brand-500 px-[1.5rem] py-[0.5rem] text-title-sm font-medium text-neutral-900 shadow-cta transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app'
        style={ctaStyles}
      >
        Cerrar caja
      </button>
    </div>
  )
}
