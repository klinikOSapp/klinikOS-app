type IncomeItem = {
  label: string
  value: string
  percent: string
  delta?: string
}
type IncomeTypesProps = { yearLabel?: string; items?: IncomeItem[] }

const defaultItems: IncomeItem[] = [
  { label: 'Efectivo', value: '1.200 €', percent: '44%', delta: '+ 12%' },
  { label: 'Tarjeta/TPV', value: '2.200 €', percent: '56%', delta: '+ 12%' },
  { label: 'Financiación', value: '800 €', percent: '44%', delta: '+ 12%' }
]

export default function IncomeTypes({
  yearLabel = '2024',
  items = defaultItems
}: IncomeTypesProps) {
  return (
    <section
      className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid w-full shrink-0 flex flex-col px-[0.5rem] pt-0 pb-card-inner'
      style={{ width: 'min(var(--width-card-stat-fluid), 100%)' }}
    >
        <div className='w-full px-[0.5rem]'>
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>
            Tipos de ingreso
          </h3>
          <div className='flex items-center gap-card-metric text-label-md text-fg'>
            <span>{yearLabel}</span>
            <span className='material-symbols-rounded text-body-md leading-none'>
              arrow_drop_down
            </span>
          </div>
        </header>
        <div
          className='mt-[0.9375rem] grid gap-[0.75rem] justify-center'
          style={{
            gridTemplateColumns:
              'repeat(3, min(var(--width-income-card), calc((100% - (0.75rem * 2)) / 3)))'
          }}
        >
          {items.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex h-income-card w-full flex-col justify-between items-start text-left'
              style={{ maxWidth: 'var(--width-income-card)' }}
            >
              <div className='flex flex-col items-start gap-[0.5rem] w-full'>
                <div className='flex items-center justify-between gap-[0.5rem] text-label-md text-fg-secondary whitespace-nowrap w-full'>
                  <span>{i.label}</span>
                  <span className='font-medium text-fg-secondary'>
                    {i.percent}
                  </span>
                </div>
                <div className='text-headline-sm text-fg-secondary text-[var(--color-neutral-600)] whitespace-nowrap'>
                  {i.value}
                </div>
              </div>
              <div className='flex items-center gap-card-metric whitespace-nowrap'>
                <span className='text-body-sm text-[var(--color-brand-500)]'>
                  {i.delta ?? '+ 12%'}
                </span>
                <span className='material-symbols-rounded text-[var(--color-brand-500)] text-body-md leading-none'>
                  arrow_outward
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
