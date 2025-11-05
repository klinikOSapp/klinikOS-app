type HeaderControlsProps = {
  dateLabel?: string
  rangeLabel?: string
}

export default function HeaderControls({
  dateLabel = '13 - 19, oct 2025',
  rangeLabel = 'Semana'
}: HeaderControlsProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-fluid-sm'>
        <button className='rounded-pill border border-border bg-surface-app text-fg px-fluid-md py-fluid-sm shadow-elevation-card'>
          <span className='sr-only'>Anterior</span>
          <span className='material-symbols-rounded align-middle'>chevron_left</span>
        </button>
        <div className='rounded-pill border border-border bg-surface-app text-fg px-fluid-md py-fluid-sm text-title-sm'>
          {dateLabel}
        </div>
        <button className='rounded-pill border border-border bg-surface-app text-fg px-fluid-md py-fluid-sm shadow-elevation-card'>
          <span className='sr-only'>Siguiente</span>
          <span className='material-symbols-rounded align-middle'>chevron_right</span>
        </button>
      </div>
      <div className='flex items-center gap-fluid-sm'>
        <button className='rounded-pill border border-border bg-surface-app text-fg px-fluid-md py-fluid-sm text-title-sm flex items-center gap-fluid-sm'>
          {rangeLabel}
          <span className='material-symbols-rounded align-middle'>expand_more</span>
        </button>
        <button className='rounded-pill border border-border bg-surface-app text-fg px-fluid-md py-fluid-sm flex items-center gap-fluid-sm'>
          <span className='material-symbols-rounded align-middle'>add</span>
          <span className='text-title-sm'>Informe</span>
        </button>
      </div>
    </div>
  )
}


