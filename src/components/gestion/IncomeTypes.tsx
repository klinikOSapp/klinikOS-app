type IncomeItem = {
  label: string
  value: string
  percent: string
}
import type { CashTimeScale } from '@/components/caja/cajaTypes'

type IncomeTypesProps = {
  yearLabel?: string
  items?: IncomeItem[]
  timeScale?: CashTimeScale
}

function getItems(timeScale: CashTimeScale): IncomeItem[] {
  if (timeScale === 'month') {
    return [
      { label: 'Efectivo', value: '4.800 €', percent: '32%' },
      { label: 'Tarjeta/TPV', value: '9.200 €', percent: '52%' },
      { label: 'Financiación', value: '1.800 €', percent: '16%' }
    ]
  }

  return [
    { label: 'Efectivo', value: '1.200 €', percent: '32%' },
    { label: 'Tarjeta/TPV', value: '2.000 €', percent: '55%' },
    { label: 'Financiación', value: '450 €', percent: '13%' }
  ]
}

export default function IncomeTypes({
  yearLabel = '2024',
  items,
  timeScale = 'week'
}: IncomeTypesProps) {
  void yearLabel
  const data = items ?? getItems(timeScale)

  return (
    <section className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid overflow-hidden min-w-0 flex flex-col px-[0.5rem] pt-0 pb-card-inner'>
      <div className='w-full px-[0.5rem]'>
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>
            Tipos de ingreso
          </h3>
        </header>
        <div className='mt-[0.9375rem] grid gap-[0.75rem] grid-cols-3 auto-rows-fr'>
          {data.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex h-income-card w-full flex-col items-start text-left'
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
