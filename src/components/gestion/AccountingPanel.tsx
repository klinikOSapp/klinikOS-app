export default function AccountingPanel() {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='text-title-md text-fg mb-fluid-sm'>Contabilidad</header>
      <div className='grid grid-cols-1 md:grid-cols-[minmax(0,0.6fr)_1fr_1fr_1fr] gap-fluid-md'>
        <div className='space-y-fluid-sm'>
          <div className='bg-surface-accent text-fg-secondary rounded-lg p-fluid-sm'>
            <div className='text-label-sm'>Total facturación</div>
            <div className='text-title-sm text-right'>60.000 €</div>
          </div>
          <div className='bg-[var(--color-brand-200)]/60 text-fg-secondary rounded-lg p-fluid-sm'>
            <div className='flex items-center justify-between text-label-sm'><span>Gastos fijos</span><span>62%</span></div>
            <div className='text-title-sm text-right'>36.000 €</div>
          </div>
          <div className='bg-brandSemantic text-fg-inverse rounded-lg p-fluid-sm'>
            <div className='flex items-center justify-between text-label-sm'><span>Gastos variables</span><span>32%</span></div>
            <div className='text-title-sm text-right'>18.000 €</div>
          </div>
        </div>
        <div className='rounded-lg border border-border p-fluid-md'>
          <div className='text-title-md text-fg mb-fluid-sm'>Resumen del mes</div>
          <dl className='grid grid-cols-[auto_1fr] gap-y-2 gap-x-4 text-body-sm text-fg'>
            <dt>Facturado:</dt>
            <dd className='text-right'>60.000 €</dd>
            <dt>Gastos totales:</dt>
            <dd className='text-right'>-30.000 €</dd>
          </dl>
        </div>
        <div className='rounded-lg border border-border p-fluid-md'>
          <div className='text-title-md text-fg mb-fluid-sm'>Gastos fijos</div>
          <dl className='grid grid-cols-[auto_1fr] gap-y-2 gap-x-4 text-body-sm text-fg'>
            <dt>Nóminas:</dt><dd className='text-right'>15.000 €</dd>
            <dt>Alquiler:</dt><dd className='text-right'>3.000 €</dd>
            <dt>Servicios:</dt><dd className='text-right'>500 €</dd>
            <dt>Seguros:</dt><dd className='text-right'>300 €</dd>
            <div className='col-span-2 h-px bg-border my-2' />
            <dt>Total</dt><dd className='text-right'>18.500 €</dd>
          </dl>
        </div>
        <div className='rounded-lg border border-border p-fluid-md'>
          <div className='text-title-md text-fg mb-fluid-sm'>Gastos variables</div>
          <dl className='grid grid-cols-[auto_1fr] gap-y-2 gap-x-4 text-body-sm text-fg'>
            <dt>Implantes:</dt><dd className='text-right'>8.000 €</dd>
            <dt>Mat. conservadora:</dt><dd className='text-right'>2.500 €</dd>
            <dt>Mat. Ortodoncia:</dt><dd className='text-right'>1.000 €</dd>
            <dt>Otros:</dt><dd className='text-right'>200 €</dd>
            <div className='col-span-2 h-px bg-border my-2' />
            <dt>Total</dt><dd className='text-right'>11.500 €</dd>
          </dl>
        </div>
      </div>
    </section>
  )
}


