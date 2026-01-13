import type { CashTimeScale } from '@/components/caja/cajaTypes'

type ProductionTotalCardProps = {
  produced?: string
  invoiced?: string
  producedDelta?: string
  invoicedDelta?: string
  timeScale?: CashTimeScale
}

function getCardData(timeScale: CashTimeScale) {
  if (timeScale === 'month') {
    return {
      periodLabel: 'Mes',
      produced: 37800.0,
      invoiced: 32400.0,
      producedDelta: '+18%',
      invoicedDelta: '+15%'
    }
  }

  return {
    periodLabel: 'Semana',
    produced: 8400.0,
    invoiced: 7200.0,
    producedDelta: '+12%',
    invoicedDelta: '+10%'
  }
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return `€${value.toFixed(0)}`
}

export default function ProductionTotalCard({
  produced,
  invoiced,
  producedDelta,
  invoicedDelta,
  timeScale = 'week'
}: ProductionTotalCardProps) {
  const data = getCardData(timeScale)

  const producedValue = produced
    ? parseFloat(produced.replace(/[^0-9,.]/g, '').replace(',', '.'))
    : data.produced
  const invoicedValue = invoiced
    ? parseFloat(invoiced.replace(/[^0-9,.]/g, '').replace(',', '.'))
    : data.invoiced

  // Calculate the billing ratio (what % of produced has been invoiced)
  const billingRatio = Math.min((invoicedValue / producedValue) * 100, 100)
  const pendingAmount = producedValue - invoicedValue

  return (
    <section className='bg-brand-900 text-[var(--color-text-inverse)] rounded-lg shadow-elevation-card h-card-stat-fluid overflow-hidden min-w-0'>
      <div className='flex h-full flex-col p-[0.875rem] overflow-hidden'>
        {/* Header */}
        <header className='flex shrink-0 items-center justify-between mb-[0.5rem] gap-[0.5rem]'>
          <h3 className='text-body-sm font-medium text-[var(--color-text-inverse)] truncate'>
            Producido vs Facturado
          </h3>
          <span className='text-label-sm text-[var(--color-brand-400)] shrink-0'>
            {data.periodLabel}
          </span>
        </header>

        {/* Main content */}
        <div className='flex-1 flex flex-col justify-center min-w-0'>
          {/* Two value boxes side by side */}
          <div className='grid grid-cols-2 gap-[0.5rem] min-w-0'>
            {/* Produced */}
            <div className='flex flex-col min-w-0 overflow-hidden'>
              <div className='flex items-center gap-[0.25rem] mb-[0.125rem]'>
                <span className='w-[6px] h-[6px] rounded-full bg-[var(--color-brand-300)] shrink-0' />
                <span className='text-label-sm text-[var(--color-brand-300)] truncate'>
                  Producido
                </span>
              </div>
              <div className='flex items-baseline gap-[0.25rem] flex-wrap'>
                <span className='text-title-md font-bold text-[var(--color-text-inverse)]'>
                  €{formatCompactCurrency(producedValue)}
                </span>
                <span className='text-label-sm text-[var(--color-brand-400)]'>
                  {producedDelta ?? data.producedDelta}
                </span>
              </div>
            </div>

            {/* Invoiced */}
            <div className='flex flex-col min-w-0 overflow-hidden'>
              <div className='flex items-center gap-[0.25rem] mb-[0.125rem]'>
                <span className='w-[6px] h-[6px] rounded-full bg-[var(--color-brand-500)] shrink-0' />
                <span className='text-label-sm text-[var(--color-brand-400)] truncate'>
                  Facturado
                </span>
              </div>
              <div className='flex items-baseline gap-[0.25rem] flex-wrap'>
                <span className='text-title-md font-bold text-[var(--color-text-inverse)]'>
                  €{formatCompactCurrency(invoicedValue)}
                </span>
                <span className='text-label-sm text-[var(--color-brand-500)]'>
                  {invoicedDelta ?? data.invoicedDelta}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress section */}
        <div className='mt-auto pt-[0.5rem]'>
          {/* Progress bar */}
          <div className='relative w-full h-[6px] bg-[var(--color-brand-800)] rounded-full overflow-hidden'>
            <div className='absolute inset-0 bg-[var(--color-brand-700)] rounded-full opacity-40' />
            <div
              className='absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] rounded-full transition-all duration-700'
              style={{ width: `${billingRatio}%` }}
            />
          </div>

          {/* Bottom row */}
          <div className='flex items-center justify-between mt-[0.375rem] gap-[0.5rem]'>
            <span className='text-label-sm font-medium text-[var(--color-brand-300)] truncate'>
              {billingRatio.toFixed(0)}% facturado
            </span>
            {pendingAmount > 0 && (
              <span className='text-label-sm text-[var(--color-brand-500)] truncate shrink-0'>
                €{formatCompactCurrency(pendingAmount)} pdte
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
