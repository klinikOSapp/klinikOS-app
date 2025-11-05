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
    <section className='bg-surface rounded-lg shadow-elevation-card p-4 h-card-stat'>
      <header className='flex items-center justify-between mb-4'>
        <h3 className='text-title-sm font-medium text-fg'>Tipos de ingreso</h3>
        <div className='flex items-center gap-1 text-label-sm text-fg'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[16px]'>arrow_drop_down</span>
        </div>
      </header>
      <div className='grid grid-cols-3 gap-4'>
        {items.map((i) => (
          <div key={i.label} className='bg-surface-app rounded-lg p-2'>
            <div className='flex items-center justify-between text-label-sm text-fg-secondary mb-2'>
              <span>{i.label}</span>
              <span className='font-medium text-fg'>{i.percent}</span>
            </div>
            <div className='text-headline-sm text-fg-secondary mb-1'>{i.value}</div>
            <div className='flex items-center gap-1'>
              <span className='text-body-sm text-brandSemantic'>+ 12%</span>
              <span className='material-symbols-rounded text-brandSemantic text-[16px]'>arrow_outward</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


