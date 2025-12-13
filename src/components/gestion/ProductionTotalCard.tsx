type ProductionTotalCardProps = {
  periodLabel?: string
  value?: string
  delta?: string
}

export default function ProductionTotalCard({
  periodLabel = '8 - 16 Oct, 2025',
  value = '€ 2.500,89',
  delta = '+ 35%'
}: ProductionTotalCardProps) {
  return (
    <section
      className='bg-brand-900 text-fg-inverse text-[var(--color-text-inverse)] rounded-lg shadow-elevation-card h-card-stat-fluid w-full shrink-0 overflow-hidden min-w-0'
      style={{
        width: 'min(var(--width-card-chart-md-fluid), 100%)'
      }}
    >
      <div className='flex h-full flex-col pl-[1rem] pr-card-pad pt-0 pb-[1rem] text-[var(--color-text-inverse)]'>
        <header className='mt-[1rem] flex shrink-0 items-baseline gap-[1rem] mb-[2.9375rem]'>
          <h3 className='text-title-sm font-medium text-[var(--color-text-inverse)]'>
            Producción total
          </h3>
          <div className='text-label-md text-[var(--color-text-inverse)]'>
            {periodLabel}
          </div>
        </header>
        <div className='flex flex-wrap items-baseline gap-[1rem] text-[var(--color-text-inverse)]'>
          <div className='text-display-lg text-[var(--color-text-inverse)]'>
            {value}
          </div>
          <div className='flex items-center gap-card-row'>
            <span className='text-body-lg text-[var(--color-brand-500)]'>
              {delta}
            </span>
            <span className='material-symbols-rounded text-[var(--color-brand-500)] text-[1.5rem] leading-[1.5rem]'>
              arrow_outward
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
