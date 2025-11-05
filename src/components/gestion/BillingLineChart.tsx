type BillingLineChartProps = { yearLabel?: string }

export default function BillingLineChart({ yearLabel = '2024' }: BillingLineChartProps) {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='flex items-center justify-between'>
        <h3 className='text-title-md text-fg'>Facturación</h3>
        <div className='text-label-sm text-fg-secondary'>{yearLabel} ▾</div>
      </header>
      <div className='mt-fluid-sm aspect-[16/9] rounded-lg bg-surface-app relative overflow-hidden'>
        <div className='absolute inset-0 bg-[linear-gradient(to_bottom,var(--chart-grid)_1px,transparent_1px),linear-gradient(to_right,var(--chart-grid)_1px,transparent_1px)] bg-[size:100%_12.5%,_8.333%_100%] opacity-50' />
        <svg className='absolute inset-0 size-full' viewBox='0 0 100 100' preserveAspectRatio='none'>
          <polyline points='0,70 10,60 20,65 30,50 40,30 50,35 60,40 70,38 80,45 90,55 100,50' fill='none' stroke='var(--chart-2)' strokeWidth='2' />
          <polyline points='0,80 10,70 20,75 30,60 40,40 50,45 60,50 70,48 80,55 90,65 100,60' fill='none' stroke='var(--chart-accent)' strokeDasharray='2 3' strokeWidth='2' />
        </svg>
        <div className='absolute left-0 top-0 bottom-6 w-[3ch] flex flex-col justify-between text-label-sm text-fg-muted pl-1'>
          {['90K', '70K', '50K', '30K', '10K', '0'].map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
        <div className='absolute left-[3ch] right-0 bottom-1 grid grid-cols-12 text-label-sm text-fg-muted'>
          {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'].map((m) => (
            <span key={m} className='text-center'>
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}


