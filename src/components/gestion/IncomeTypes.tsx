type IncomeItem = { label: string; value: string; percent: string }
type IncomeTypesProps = { yearLabel?: string; items?: IncomeItem[] }

const defaultItems: IncomeItem[] = [
  { label: 'Efectivo', value: '1.200 €', percent: '44%' },
  { label: 'Tarjeta/TPV', value: '2.200 €', percent: '56%' },
  { label: 'Financiación', value: '800 €', percent: '44%' }
]

export default function IncomeTypes({
  yearLabel = '2024',
  items = defaultItems
}: IncomeTypesProps) {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='flex items-center justify-between'>
        <h3 className='text-title-md text-fg'>Tipos de ingreso</h3>
        <div className='text-label-sm text-fg-secondary'>{yearLabel} ▾</div>
      </header>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-fluid-sm pt-fluid-sm'>
        {items.map((i) => (
          <div key={i.label} className='bg-surface-app rounded-lg p-fluid-sm'>
            <div className='flex items-center justify-between text-label-sm text-fg-secondary'>
              <span>{i.label}</span>
              <span className='text-fg'>{i.percent}</span>
            </div>
            <div className='text-headline-sm text-fg'>{i.value}</div>
            <div className='flex items-center gap-1 text-state-success text-label-lg'>
              <span>+ 12%</span>
              <span className='material-symbols-rounded align-middle text-state-success'>trending_up</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


