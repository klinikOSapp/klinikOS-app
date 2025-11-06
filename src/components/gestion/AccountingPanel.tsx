const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'
const COLUMN_HEIGHT_RATIO = (262 / 342).toFixed(4)
const FIXED_OFFSET_PERCENT = `${((75 / 262) * 100).toFixed(3)}%`
const FIXED_HEIGHT_PERCENT = `${((187 / 262) * 100).toFixed(3)}%`
const VARIABLE_OFFSET_PERCENT = `${((154 / 262) * 100).toFixed(3)}%`
const VARIABLE_HEIGHT_PERCENT = `${((108 / 262) * 100).toFixed(3)}%`

export default function AccountingPanel() {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md h-card-chart-fluid overflow-clip w-full'>
      <header className='text-title-sm font-medium text-fg mb-fluid-sm'>
        Contabilidad
      </header>

      <div className='accounting-grid'>
        {/* Left bars */}
        <div
          className='relative'
          style={{
            height: `calc(${CARD_HEIGHT_VAR} * ${COLUMN_HEIGHT_RATIO})`
          }}
        >
          {/* Total facturación */}
          <div className='absolute inset-x-0 top-0 bottom-0 bg-surface-accent rounded-t-2xl overflow-clip'>
            <div className='p-gapsm'>
              <p className='text-label-sm text-fg-secondary'>
                Total facturación
              </p>
              <p className='text-title-sm font-medium text-fg-secondary text-right mt-fluid-sm'>
                60.000 €
              </p>
            </div>
          </div>

          {/* Gastos fijos */}
          <div
            className='absolute left-0 right-0 bg-brand-200 rounded-t-2xl overflow-clip'
            style={{ top: FIXED_OFFSET_PERCENT, height: FIXED_HEIGHT_PERCENT }}
          >
            <div className='p-gapsm'>
              <div className='flex items-center justify-between text-label-sm text-fg-secondary'>
                <span>Gastos fijos</span>
                <span className='font-medium'>62%</span>
              </div>
              <p className='text-title-sm font-medium text-fg-secondary text-right mt-fluid-sm'>
                36.000 €
              </p>
            </div>
          </div>

          {/* Gastos Variables */}
          <div
            className='absolute left-0 right-0 bg-brandSemantic overflow-clip'
            style={{
              top: VARIABLE_OFFSET_PERCENT,
              height: VARIABLE_HEIGHT_PERCENT
            }}
          >
            <div className='p-gapsm'>
              <div className='flex items-center justify-between text-label-sm text-fg-inverse'>
                <span>Gastos Variables</span>
                <span className='font-medium'>32%</span>
              </div>
              <p className='text-title-sm font-medium text-fg-inverse text-right mt-fluid-sm'>
                18.000 €
              </p>
            </div>
          </div>
        </div>

        {/* Resumen del mes */}
        <div className='border border-border rounded-2xl p-fluid-sm'>
          <h3 className='text-title-sm font-medium text-fg mb-fluid-sm'>
            Resumen del mes
          </h3>
          <dl className='space-y-gapsm'>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Facturado:</dt>
              <dd className='text-body-sm'>60.000 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Gastos totales:</dt>
              <dd className='text-body-sm'>-30.000 €</dd>
            </div>
          </dl>
        </div>

        {/* Gastos fijos */}
        <div className='border border-border rounded-2xl p-fluid-sm'>
          <h3 className='text-title-sm font-medium text-fg mb-fluid-sm'>
            Gastos fijos
          </h3>
          <dl className='space-y-gapsm'>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Nóminas:</dt>
              <dd className='text-body-sm'>15.000 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Alquiler:</dt>
              <dd className='text-body-sm'>3.000 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Servicios:</dt>
              <dd className='text-body-sm'>500 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Seguros:</dt>
              <dd className='text-body-sm'>300 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Otros:</dt>
              <dd className='text-body-sm'>200 €</dd>
            </div>
            <div className='h-px bg-border my-gapsm' />
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Total</dt>
              <dd className='text-body-sm'>18.500 €</dd>
            </div>
          </dl>
        </div>

        {/* Gastos variables */}
        <div className='border border-border rounded-2xl p-fluid-sm'>
          <h3 className='text-title-sm font-medium text-fg mb-fluid-sm'>
            Gastos variables
          </h3>
          <dl className='space-y-gapsm'>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Implantes:</dt>
              <dd className='text-body-sm'>8.000 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Mat. conservadora:</dt>
              <dd className='text-body-sm'>2.500 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Mat. Ortodoncia:</dt>
              <dd className='text-body-sm'>1.000 €</dd>
            </div>
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Otros:</dt>
              <dd className='text-body-sm'>200 €</dd>
            </div>
            <div className='h-px bg-border my-gapsm' />
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Total</dt>
              <dd className='text-body-sm'>11.500 €</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
