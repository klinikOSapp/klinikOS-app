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
      className='bg-brand-900 text-fg-inverse text-[var(--color-text-inverse)] rounded-lg shadow-elevation-card h-card-stat-fluid w-full shrink-0 justify-self-stretch overflow-hidden'
      style={{ width: 'min(var(--width-card-stat-fluid), 100%)' }}
    >
      <div className='flex h-full flex-col gap-[min(1.46875rem,2.25vw)] p-[min(1rem,1.5vw)] text-[var(--color-text-inverse)]'>
        <header className='flex shrink-0 items-baseline gap-[min(1rem,1.5vw)]'>
          <h3 className='text-title-sm font-medium text-[var(--color-text-inverse)]'>
            Producción total
          </h3>
          <div className='text-label-md text-[var(--color-text-inverse)]'>
            {periodLabel}
          </div>
        </header>
        <div className='flex flex-wrap items-baseline gap-[min(1rem,1.5vw)] text-[var(--color-text-inverse)]'>
          <div className='text-display-lg text-[var(--color-text-inverse)]'>
            {value}
          </div>
          <div className='flex items-center gap-[min(0.5rem,1vw)]'>
            <span className='text-body-lg text-[var(--color-brand-500)]'>
              {delta}
            </span>
            <span className='material-symbols-rounded text-[var(--color-brand-500)] text-[min(1.5rem,2vw)] leading-[min(1.5rem,2vw)]'>
              arrow_outward
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
