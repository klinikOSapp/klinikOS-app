/* eslint-disable @next/next/no-img-element */
'use client'

type HeaderControlsProps = {
  dateLabel?: string
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
}

export default function HeaderControls({
  dateLabel = '13 - 19, oct 2025',
  onNavigatePrevious,
  onNavigateNext
}: HeaderControlsProps) {
  const pillButtonClasses =
    'inline-flex items-center justify-center h-[var(--nav-chip-height)] px-[var(--nav-chip-pad-x)] rounded-full border border-border bg-surface-app text-title-sm font-medium text-fg gap-gapsm transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0'

  return (
    <div className='flex flex-col gap-fluid-sm xl:flex-row xl:items-center xl:justify-end mt-[var(--spacing-plnav)]'>
      <div className='flex w-full flex-nowrap items-center gap-gapsm justify-end pr-4 min-w-0 overflow-x-auto'>
        <button className={pillButtonClasses}>
          <span className='material-symbols-rounded'>add</span>
          <span className='text-title-sm font-medium'>Informe</span>
        </button>
      </div>
    </div>
  )
}
