type ProductionTotalCardProps = { periodLabel?: string; value?: string; delta?: string }

export default function ProductionTotalCard({
  periodLabel = '8 - 16 Oct, 2025',
  value = '€ 2.500,89',
  delta = '+ 35%'
}: ProductionTotalCardProps) {
  return (
    <section className='bg-brand-900 text-fg-inverse rounded-lg shadow-elevation-card p-4 h-card-stat flex flex-col justify-between'>
      <header className='flex items-baseline gap-4'>
        <h3 className='text-title-sm font-medium'>Producción total</h3>
        <div className='text-label-sm'>{periodLabel}</div>
      </header>
      <div className='flex items-baseline gap-4'>
        <div className='text-display-lg'>{value}</div>
        <div className='flex items-center gap-2'>
          <span className='text-body-lg text-brandSemantic'>{delta}</span>
          <span className='material-symbols-rounded text-brandSemantic'>arrow_outward</span>
        </div>
      </div>
    </section>
  )
}


