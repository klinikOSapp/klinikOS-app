type SpecialtyDonutProps = { yearLabel?: string }

export default function SpecialtyDonut({ yearLabel = '2024' }: SpecialtyDonutProps) {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='flex items-center justify-between'>
        <h3 className='text-title-md text-fg'>Facturación por especialidad</h3>
        <div className='text-label-sm text-fg-secondary'>{yearLabel} ▾</div>
      </header>
      <div className='mt-fluid-sm grid grid-cols-[auto_1fr] gap-fluid-md items-center'>
        <div className='relative aspect-square w-full place-self-center'>
          <svg viewBox='0 0 36 36' className='size-full' preserveAspectRatio='xMidYMid meet'>
            <circle cx='18' cy='18' r='16' fill='none' stroke='var(--chart-3)' strokeWidth='4' />
            <circle cx='18' cy='18' r='16' fill='none' stroke='var(--chart-2)' strokeWidth='4' strokeDasharray='60 100' strokeDashoffset='0' />
            <circle cx='18' cy='18' r='16' fill='none' stroke='var(--chart-4)' strokeWidth='4' strokeDasharray='30 100' strokeDashoffset='60' />
            <circle cx='18' cy='18' r='16' fill='none' stroke='var(--chart-1)' strokeWidth='4' strokeDasharray='10 100' strokeDashoffset='90' />
            <text x='18' y='19' textAnchor='middle' className='fill-[var(--color-text-primary)] text-[8px] font-medium'>€ 56 K</text>
          </svg>
        </div>
        <ul className='self-center space-y-1 text-label-sm text-fg'>
          <li className='flex items-center gap-2'><span className='size-3 rounded-full bg-[var(--chart-3)]' /> Conservadora 40%</li>
          <li className='flex items-center gap-2'><span className='size-3 rounded-full bg-[var(--chart-4)]' /> Ortodoncia 30%</li>
          <li className='flex items-center gap-2'><span className='size-3 rounded-full bg-[var(--chart-2)]' /> Implantes 20%</li>
          <li className='flex items-center gap-2'><span className='size-3 rounded-full bg-[var(--chart-1)]' /> Estética 10%</li>
        </ul>
      </div>
    </section>
  )
}


