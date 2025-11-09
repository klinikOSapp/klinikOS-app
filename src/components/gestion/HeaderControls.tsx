import DateNavigator from './DateNavigator'

type HeaderControlsProps = {
  dateLabel?: string
  rangeLabel?: string
}

export default function HeaderControls({
  dateLabel = '13 - 19, oct 2025',
  rangeLabel = 'Semana'
}: HeaderControlsProps) {
  const pillButtonClasses =
    'inline-flex items-center justify-center h-[var(--nav-chip-height)] px-[var(--nav-chip-pad-x)] rounded-full border border-border bg-surface-app text-title-sm font-medium text-fg gap-gapsm transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0'

  return (
    <div className='flex flex-col gap-fluid-sm xl:flex-row xl:items-center xl:justify-between mt-[var(--spacing-plnav)]'>
      {/* Date Navigator - Using exact Figma design */}
      <div className='w-full xl:w-auto'>
        <DateNavigator dateLabel={dateLabel} />
      </div>

      {/* Right side controls */}
      <div className='flex flex-nowrap items-center gap-gapsm xl:justify-end min-w-0 overflow-x-auto'>
        {/* Range selector */}
        <button className={pillButtonClasses}>
          {rangeLabel}
          <span className='material-symbols-rounded rotate-90'>
            arrow_forward_ios
          </span>
        </button>

        {/* Add report button */}
        <button className={pillButtonClasses}>
          <span className='material-symbols-rounded'>add</span>
          <span className='text-title-sm font-medium'>Informe</span>
        </button>
      </div>
    </div>
  )
}
