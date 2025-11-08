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
    <section className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid w-card-stat-fluid shrink-0 flex flex-col px-card-pad pt-card-pad pb-card-inner'>
      <header className='flex items-center justify-between'>
        <h3 className='text-title-sm font-medium text-fg'>Tipos de ingreso</h3>
        <div className='flex items-center gap-card-metric text-label-md text-fg'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[16px]'>
            arrow_drop_down
          </span>
        </div>
      </header>
      <div
        className='mt-header-cards grid gap-card-gap'
        style={{
          gridTemplateColumns:
            'repeat(3, min(var(--width-income-card), calc((100% - (var(--space-card-gap) * 2)) / 3)))'
        }}
      >
        {items.map((i) => (
          <div
            key={i.label}
            className='bg-surface-app rounded-lg p-card-inner flex flex-col gap-card-row h-income-card w-full'
            style={{ maxWidth: 'var(--width-income-card)' }}
          >
            <div className='flex items-center justify-between text-label-md text-fg-secondary whitespace-nowrap'>
              <span>{i.label}</span>
              <span className='font-medium text-fg-secondary'>{i.percent}</span>
            </div>
            <div className='text-headline-sm text-fg-secondary whitespace-nowrap'>
              {i.value}
            </div>
            <div className='flex items-center gap-card-metric whitespace-nowrap'>
              <span className='text-body-sm text-brandSemantic'>
                {i.delta ?? '+ 12%'}
              </span>
              <span className='material-symbols-rounded text-brandSemantic text-[16px]'>
                arrow_outward
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
