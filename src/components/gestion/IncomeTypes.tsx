import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { GestionIncomeMethod, SpecialtyFilter } from './gestionTypes'

type IncomeTypesProps = {
  yearLabel?: string
  items?: GestionIncomeMethod[]
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
}

function formatCurrency(value: number) {
  return `${value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} €`
}

export default function IncomeTypes({
  yearLabel = '2024',
  items,
  selectedSpecialty
}: IncomeTypesProps) {
  void yearLabel
  void selectedSpecialty

  const data = (items || []).slice(0, 3)

  return (
    <section className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid overflow-hidden min-w-0 flex flex-col px-[0.5rem] pt-0 pb-card-inner'>
      <div className='w-full px-[0.5rem]'>
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>
            Métodos de pago
          </h3>
        </header>
        <div className='mt-[0.9375rem] grid gap-[0.5rem] lg:gap-[0.75rem] grid-cols-1 sm:grid-cols-3 auto-rows-fr'>
          {data.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex min-h-[4rem] lg:h-income-card w-full flex-col items-start text-left'
            >
              <div className='flex flex-col items-start gap-[0.5rem] w-full'>
                <div className='flex items-center justify-between gap-[0.5rem] text-label-md text-fg-secondary whitespace-nowrap w-full'>
                  <span>{i.label}</span>
                  <span className='font-medium text-fg-secondary'>
                    {i.percent}%
                  </span>
                </div>
                <div className='text-headline-sm text-fg-secondary text-[var(--color-neutral-600)] whitespace-nowrap'>
                  {formatCurrency(i.amount)}
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className='bg-surface-app rounded-lg px-[0.5rem] py-[0.75rem] text-label-sm text-neutral-500'>
              Sin datos para este período.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
