type ProductionTotalCardProps = { periodLabel?: string; value?: string; delta?: string }

export default function ProductionTotalCard({
  periodLabel = '8 - 16 Oct, 2025',
  value = '€ 2.500,89',
  delta = '+ 35%'
}: ProductionTotalCardProps) {
  return (
    <section className='bg-brandSemantic-strong text-fg-inverse rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='flex items-baseline gap-fluid-md'>
        <h3 className='text-title-md'>Producción total</h3>
        <div className='text-label-sm opacity-80'>{periodLabel}</div>
      </header>
      <div className='flex items-baseline gap-fluid-md pt-fluid-md'>
        <div className='text-display-md'>{value}</div>
        <div className='flex items-center gap-2 text-state-success'>
          <span className='text-body-lg'>{delta}</span>
          <span className='material-symbols-rounded'>trending_up</span>
        </div>
      </div>
    </section>
  )
}


