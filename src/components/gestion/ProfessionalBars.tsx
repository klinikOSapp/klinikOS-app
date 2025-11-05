export default function ProfessionalBars() {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='flex items-center justify-between'>
        <h3 className='text-title-md text-fg'>Facturación por profesional</h3>
        <button className='text-fg-secondary'>
          <span className='material-symbols-rounded'>tune</span>
        </button>
      </header>
      <div className='mt-fluid-sm aspect-[16/9] rounded-lg bg-surface-app relative overflow-hidden grid grid-rows-[1fr_auto] grid-cols-[auto_1fr] gap-fluid-sm p-fluid-md'>
        <div className='row-span-1 col-start-1 col-end-2 flex flex-col justify-between text-label-sm text-fg-muted pr-fluid-sm'>
          {[350, 300, 250, 200, 150, 100, 50, 0].map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
        <div className='row-span-1 col-start-2 col-end-3 h-full grid grid-cols-4 gap-fluid-md items-end'>
          <div className='bg-[var(--chart-1)] rounded-lg h-[78%]' />
          <div className='bg-[var(--chart-2)] rounded-lg h-[65%]' />
          <div className='bg-[var(--chart-3)] rounded-lg h-[47%]' />
          <div className='bg-[var(--chart-4)] rounded-lg h-[52%]' />
        </div>
        <div className='row-start-2 col-start-2 col-end-3 grid grid-cols-4 text-label-sm text-fg-muted'>
          <span>Dr. Guille</span>
          <span>Dra. Laura</span>
          <span>Tamara (Hig.)</span>
          <span>Nerea (Hig.)</span>
        </div>
      </div>
    </section>
  )
}


