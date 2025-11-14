import type { CSSProperties } from 'react'

const CARD_WIDTH_BASE = 'var(--width-card-chart-lg-fluid)'
const CARD_HEIGHT_BASE = 'var(--height-card-chart-fluid)'
const CARD_WIDTH_LIMIT = 'var(--accounting-width-limit)'
const CARD_HEIGHT_LIMIT = 'var(--accounting-height-limit)'
const CARD_WIDTH_CLAMP = `min(${CARD_WIDTH_BASE}, ${CARD_WIDTH_LIMIT})`
const CARD_HEIGHT_CLAMP = `min(${CARD_HEIGHT_BASE}, ${CARD_HEIGHT_LIMIT})`

const columnHeightPx = 262
const fixedOffsetPercent = `${((75 / columnHeightPx) * 100).toFixed(3)}%`
const fixedHeightPercent = `${((187 / columnHeightPx) * 100).toFixed(3)}%`
const variableOffsetPercent = `${((154 / columnHeightPx) * 100).toFixed(3)}%`
const variableHeightPercent = `${((108 / columnHeightPx) * 100).toFixed(3)}%`

const widthValue = (px: number) => {
  const ratio = (px / 1069).toFixed(6)
  return `min(calc(${CARD_WIDTH_BASE} * ${ratio}), calc(${CARD_WIDTH_LIMIT} * ${ratio}))`
}

const heightValue = (px: number) => {
  const ratio = (px / 342).toFixed(6)
  return `min(calc(${CARD_HEIGHT_BASE} * ${ratio}), calc(${CARD_HEIGHT_LIMIT} * ${ratio}))`
}

export default function AccountingPanel() {
  const cardStyles: CSSProperties = {
    width: CARD_WIDTH_CLAMP,
    height: CARD_HEIGHT_CLAMP
  }

  const headerStyles: CSSProperties = {
    left: widthValue(16),
    right: widthValue(16),
    top: heightValue(16)
  }

  const columnStyles: CSSProperties = {
    left: widthValue(16),
    top: heightValue(56),
    width: widthValue(214),
    height: heightValue(columnHeightPx)
  }

  const summaryStyles: CSSProperties = {
    left: widthValue(266),
    top: heightValue(56),
    width: widthValue(240),
    height: heightValue(120)
  }

  const fixedCardStyles: CSSProperties = {
    left: widthValue(535),
    top: heightValue(56),
    width: widthValue(240),
    height: heightValue(240)
  }

  const variableCardStyles: CSSProperties = {
    left: widthValue(804),
    top: heightValue(56),
    width: widthValue(240),
    height: heightValue(212)
  }

  return (
    <section
      className='relative overflow-clip rounded-lg bg-surface shadow-elevation-card'
      style={cardStyles}
    >
      <header
        className='absolute flex items-center text-title-sm font-medium text-fg'
        style={headerStyles}
      >
        <h3>Contabilidad</h3>
      </header>

      {/* Left stacked column */}
      <div className='absolute' style={columnStyles}>
        <div className='relative h-full'>
          <div className='absolute inset-x-0 top-0 bottom-0 overflow-clip rounded-t-2xl bg-surface-accent'>
            <div className='flex h-full flex-col justify-between p-gapsm text-fg-secondary'>
              <p className='text-label-sm'>Total facturación</p>
              <p className='text-title-sm font-medium text-right'>60.000 €</p>
            </div>
          </div>

          <div
            className='absolute left-0 right-0 overflow-clip rounded-t-2xl bg-brand-200'
            style={{ top: fixedOffsetPercent, height: fixedHeightPercent }}
          >
            <div className='flex h-full flex-col justify-between p-gapsm text-fg-secondary'>
              <div className='flex items-center justify-between text-label-sm'>
                <span>Gastos fijos</span>
                <span className='font-medium'>62%</span>
              </div>
              <p className='text-title-sm font-medium text-right'>36.000 €</p>
            </div>
          </div>

          <div
            className='absolute left-0 right-0 overflow-clip bg-brandSemantic'
            style={{
              top: variableOffsetPercent,
              height: variableHeightPercent
            }}
          >
            <div className='flex h-full flex-col justify-between p-gapsm text-fg-inverse'>
              <div className='flex items-center justify-between text-label-sm'>
                <span>Gastos Variables</span>
                <span className='font-medium'>32%</span>
              </div>
              <p className='text-title-sm font-medium text-right'>18.000 €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del mes */}
      <div
        className='absolute border border-border rounded-2xl bg-surface p-fluid-sm'
        style={summaryStyles}
      >
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
      <div
        className='absolute border border-border rounded-2xl bg-surface p-fluid-sm'
        style={fixedCardStyles}
      >
        <h3 className='text-title-sm font-medium text-fg mb-fluid-sm'>
          Gastos fijos
        </h3>
        <dl className='flex h-full flex-col justify-between'>
          <div className='space-y-gapsm'>
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
          </div>
          <div>
            <div className='my-gapsm h-px bg-border' />
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Total</dt>
              <dd className='text-body-sm'>18.500 €</dd>
            </div>
          </div>
        </dl>
      </div>

      {/* Gastos variables */}
      <div
        className='absolute border border-border rounded-2xl bg-surface p-fluid-sm'
        style={variableCardStyles}
      >
        <h3 className='text-title-sm font-medium text-fg mb-fluid-sm'>
          Gastos variables
        </h3>
        <dl className='flex h-full flex-col justify-between'>
          <div className='space-y-gapsm'>
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
          </div>
          <div>
            <div className='my-gapsm h-px bg-border' />
            <div className='flex justify-between text-label-sm text-fg'>
              <dt>Total</dt>
              <dd className='text-body-sm'>11.500 €</dd>
            </div>
          </div>
        </dl>
      </div>
    </section>
  )
}
