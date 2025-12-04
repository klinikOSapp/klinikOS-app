'use client'

import React from 'react'
import { createPortal } from 'react-dom'

const pxToRem = (value: number) => value / 16

const MODAL_WIDTH_REM = pxToRem(1200) // 75rem
const MODAL_HEIGHT_REM = pxToRem(892) // 55.75rem
const MODAL_SCALE_FORMULA = `min(1, calc(95vw / ${MODAL_WIDTH_REM}rem), calc(90vh / ${MODAL_HEIGHT_REM}rem))`
const RECOUNT_MODAL_WIDTH_REM = pxToRem(602) // 37.625rem
const RECOUNT_MODAL_SCALE_FORMULA = `min(1, calc(95vw / ${RECOUNT_MODAL_WIDTH_REM}rem), calc(90vh / ${MODAL_HEIGHT_REM}rem))`

const SECTION_LEFT_REM = pxToRem(32) // 2rem
const HEADER_TOP_REM = pxToRem(88) // 5.5rem
const HEADER_WIDTH_REM = pxToRem(568) // 35.5rem
const FORM_TOP_REM = pxToRem(232) // 14.5rem
const FORM_WIDTH_REM = pxToRem(1136) // 71rem
const FORM_GAP_REM = pxToRem(64) // 4rem
const TABLE_TOP_REM = pxToRem(372) // 23.25rem
const TABLE_HEIGHT_REM = pxToRem(392) // 24.5rem
const ROW_HEIGHT_REM = pxToRem(40) // 2.5rem
const CTA_TOP_REM = pxToRem(820) // 51.25rem
const CTA_LEFT_REM = pxToRem(1049) // 65.5625rem
const CTA_WIDTH_REM = pxToRem(119) // 7.4375rem
const CTA_HEIGHT_REM = pxToRem(40) // 2.5rem
const RECOUNT_HEADER_TOP_REM = pxToRem(104) // 6.5rem
const RECOUNT_LABEL_LEFT_REM = pxToRem(32) // 2rem
const RECOUNT_LABEL_TOP_START_REM = pxToRem(176) // 11rem
const RECOUNT_LABEL_ROW_GAP_REM = pxToRem(100) // 6.25rem
const RECOUNT_INPUT_LEFT_REM = pxToRem(266) // 16.625rem
const RECOUNT_INPUT_WIDTH_REM = pxToRem(304) // 19rem
const RECOUNT_INPUT_HEIGHT_REM = pxToRem(48) // 3rem
const RECOUNT_CTA_LEFT_REM = pxToRem(451) // 28.1875rem

const TABLE_COLUMN_WIDTHS_REM = [
  pxToRem(95),
  pxToRem(287),
  pxToRem(348),
  pxToRem(166),
  pxToRem(200)
]

const TABLE_GRID_TEMPLATE = TABLE_COLUMN_WIDTHS_REM.map((width) => `${width}rem`).join(' ')

const CASH_TOTAL_FIELDS = [
  { id: 'initial', label: 'Caja inicial', placeholder: '0,00 €' },
  { id: 'day', label: 'Caja del día', placeholder: '0,00 €' },
  { id: 'outflow', label: 'Salida de caja', placeholder: '0,00 €', required: true },
  { id: 'rest', label: 'Resto de caja', placeholder: '0,00 €' }
] as const

type CashTotalFieldId = (typeof CASH_TOTAL_FIELDS)[number]['id']

const INITIAL_TOTAL_VALUES: Record<CashTotalFieldId, string> = {
  initial: '100.00 €',
  day: '200.00 €',
  rest: '200.00 €',
  outflow: '50.00 €'
}

const RECOUNT_FIELDS = [
  { id: 'cash', label: 'Efectivo', should: '300€' },
  { id: 'tpv', label: 'TPV', should: '600€' },
  { id: 'transfer', label: 'Transferencia', should: '1.000€' },
  { id: 'cheque', label: 'Cheque', should: '1.500€' }
] as const

type RecountFieldId = (typeof RECOUNT_FIELDS)[number]['id']

const INITIAL_RECOUNT_VALUES: Record<RecountFieldId, string> = {
  cash: '',
  tpv: '',
  transfer: '',
  cheque: ''
}

const CASH_CLOSING_ROWS = [
  {
    time: '09:00',
    patient: 'Carlos Martínez Pérez',
    concept: 'Operación mandíbula',
    amount: '2.300 €',
    method: 'Financiado'
  },
  {
    time: '09:30',
    patient: 'Nacho Nieto Iniesta',
    concept: 'Consulta inicial',
    amount: '150 €',
    method: 'TPV'
  },
  {
    time: '10:00',
    patient: 'Sofía Rodríguez López',
    concept: 'Radiografía',
    amount: '100 €',
    method: 'Efectivo'
  },
  {
    time: '10:30',
    patient: 'Elena García Santos',
    concept: 'Extracción de muela',
    amount: '500 €',
    method: 'Tarjeta de crédito'
  },
  {
    time: '11:00',
    patient: 'Javier Fernández Torres',
    concept: 'Implante dental',
    amount: '1.200 €',
    method: 'Transferencia bancaria'
  },
  {
    time: '11:30',
    patient: 'Lucía Pérez Gómez',
    concept: 'Férula de descarga',
    amount: '300 €',
    method: 'Billetera digital'
  },
  {
    time: '12:00',
    patient: 'Andrés Jiménez Ortega',
    concept: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    method: 'Criptomonedas'
  },
  {
    time: '12:30',
    patient: 'María del Mar Ruiz',
    concept: 'Consulta de seguimiento',
    amount: '100 €',
    method: 'Cheque'
  },
  {
    time: '13:00',
    patient: 'Pablo Sánchez Delgado',
    concept: 'Blanqueamiento dental',
    amount: '400 €',
    method: 'Pago a plazos'
  }
] as const

type CashClosingModalProps = {
  open: boolean
  onClose: () => void
}

type ModalStep = 'summary' | 'recount'

export function CashClosingModal({ open, onClose }: CashClosingModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [totalValues, setTotalValues] = React.useState(INITIAL_TOTAL_VALUES)
  const [recountValues, setRecountValues] = React.useState(INITIAL_RECOUNT_VALUES)
  const [step, setStep] = React.useState<ModalStep>('summary')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  React.useEffect(() => {
    if (open) {
      setTotalValues(INITIAL_TOTAL_VALUES)
      setRecountValues(INITIAL_RECOUNT_VALUES)
      setStep('summary')
    }
  }, [open])

  const handleInputChange = (fieldId: CashTotalFieldId, value: string) => {
    setTotalValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleRecountInputChange = (fieldId: RecountFieldId, value: string) => {
    setRecountValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleClose = () => {
    setStep('summary')
    onClose()
  }

  const handleContinue = () => {
    if (step === 'summary') {
      setStep('recount')
      return
    }
    handleClose()
  }

  if (!open || !mounted) return null

  const modalWidthRem = step === 'summary' ? MODAL_WIDTH_REM : RECOUNT_MODAL_WIDTH_REM
  const modalScaleFormula =
    step === 'summary' ? MODAL_SCALE_FORMULA : RECOUNT_MODAL_SCALE_FORMULA

  const modalFrameStyle = {
    '--modal-scale': modalScaleFormula,
    width: `min(95vw, calc(${modalWidthRem}rem * var(--modal-scale)))`,
    height: `min(90vh, calc(${MODAL_HEIGHT_REM}rem * var(--modal-scale)))`
  } as React.CSSProperties

  const modalContentStyle = {
    width: `${modalWidthRem}rem`,
    height: `${MODAL_HEIGHT_REM}rem`,
    transform: 'scale(var(--modal-scale))',
    transformOrigin: 'top left'
  } as React.CSSProperties

  const tableGridStyles = {
    gridTemplateColumns: TABLE_GRID_TEMPLATE,
    minHeight: `${ROW_HEIGHT_REM}rem`
  } as React.CSSProperties

  const descriptionId =
    step === 'summary' ? 'cash-close-dialog-description' : 'cash-close-recount-description'

  const content = (
    <div
      className='fixed inset-0 z-[80] bg-black/30 backdrop-blur-[1px]'
      onClick={handleClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center px-[2rem] py-[2rem]'>
        <div
          className='relative flex shrink-0 items-start justify-center rounded-xl bg-neutral-0 shadow-elevation-popover'
          style={modalFrameStyle}
        >
          <div
            className='relative h-full w-full overflow-hidden rounded-xl bg-neutral-50'
            onClick={(event) => event.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-labelledby='cash-close-dialog-title'
            aria-describedby={descriptionId}
          >
            <div className='relative' style={modalContentStyle}>
              <header className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-border px-[2rem]'>
                <p id='cash-close-dialog-title' className='text-title-md font-medium text-fg'>
                  Cierre de caja
                </p>
                <button
                  type='button'
                  className='flex size-[0.875rem] items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50'
                  onClick={handleClose}
                  aria-label='Cerrar cierre de caja'
                >
                  <span className='material-symbols-rounded text-[1rem] leading-none'>close</span>
                </button>
              </header>

              {step === 'summary' ? (
                <SummaryStep
                  descriptionId={descriptionId}
                  totalValues={totalValues}
                  onChange={handleInputChange}
                  tableGridStyles={tableGridStyles}
                  onContinue={handleContinue}
                />
              ) : (
                <RecountStep
                  descriptionId={descriptionId}
                  values={recountValues}
                  onChange={handleRecountInputChange}
                  onContinue={handleContinue}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

function Cell({
  children,
  border = true
}: {
  children: React.ReactNode
  border?: boolean
}) {
  return (
    <div
      className={`flex items-center px-[0.5rem] py-[0.5rem] ${
        border ? 'border-r border-border' : ''
      }`}
    >
      {children}
    </div>
  )
}

type SummaryStepProps = {
  descriptionId: string
  totalValues: Record<CashTotalFieldId, string>
  onChange: (fieldId: CashTotalFieldId, value: string) => void
  tableGridStyles: React.CSSProperties
  onContinue: () => void
}

function SummaryStep({
  descriptionId,
  totalValues,
  onChange,
  tableGridStyles,
  onContinue
}: SummaryStepProps) {
  return (
    <>
      <section
        className='absolute flex flex-col gap-[0.5rem]'
        style={{
          left: `${SECTION_LEFT_REM}rem`,
          top: `${HEADER_TOP_REM}rem`,
          width: `${HEADER_WIDTH_REM}rem`
        }}
      >
        <p className='text-headline-sm text-fg'>Totales de caja</p>
        <p id={descriptionId} className='text-body-sm text-fg'>
          Comprueba que todos los datos del resumen son correctos y anota la salida de caja.
        </p>
      </section>

      <section
        className='absolute flex w-full items-start'
        style={{
          left: `${SECTION_LEFT_REM}rem`,
          top: `${FORM_TOP_REM}rem`,
          width: `${FORM_WIDTH_REM}rem`,
          gap: `${FORM_GAP_REM}rem`
        }}
      >
        {CASH_TOTAL_FIELDS.map((field) => (
          <div key={field.id} className='flex flex-1 flex-col gap-[0.5rem]'>
            <p className='text-body-sm text-fg'>{field.label}</p>
            <label className='flex h-[3rem] items-center justify-between rounded-lg border border-border bg-neutral-50 px-[0.625rem] focus-within:ring-2 focus-within:ring-brandSemantic'>
              <input
                type='text'
                value={totalValues[field.id]}
                onChange={(event) => onChange(field.id, event.target.value)}
                placeholder={field.placeholder}
                className='w-full bg-transparent text-body-md text-fg placeholder:text-neutral-400 focus:outline-none'
                aria-required={field.required}
              />
              {field.required && (
                <span className='text-body-lg font-medium leading-none text-error-600'>*</span>
              )}
            </label>
          </div>
        ))}
      </section>

      <section
        className='absolute rounded-lg bg-neutral-50'
        style={{
          left: `${SECTION_LEFT_REM}rem`,
          top: `${TABLE_TOP_REM}rem`,
          width: `${FORM_WIDTH_REM}rem`,
          height: `${TABLE_HEIGHT_REM}rem`
        }}
      >
        <div className='h-full w-full'>
          <div
            className='grid border-b border-border text-body-md font-medium text-neutral-600'
            style={tableGridStyles}
          >
            {['Hora', 'Paciente', 'Concepto', 'Cantidad', 'Método'].map((header, index) => (
              <div
                key={`${header}-${index}`}
                className={`flex items-center px-[0.5rem] py-[0.25rem] ${
                  index < 4 ? 'border-r border-border' : ''
                }`}
              >
                {header}
              </div>
            ))}
          </div>

          <div>
            {CASH_CLOSING_ROWS.map((row) => (
              <div
                key={`${row.time}-${row.patient}`}
                className='grid border-b border-border text-body-md text-neutral-900'
                style={tableGridStyles}
              >
                <Cell>{row.time}</Cell>
                <Cell>{row.patient}</Cell>
                <Cell>{row.concept}</Cell>
                <Cell>{row.amount}</Cell>
                <Cell border={false}>{row.method}</Cell>
              </div>
            ))}
          </div>
        </div>
      </section>

      <button
        type='button'
        onClick={onContinue}
        className='absolute flex items-center justify-center rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-brand-900 shadow-cta transition-colors hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50'
        style={{
          left: `${CTA_LEFT_REM}rem`,
          top: `${CTA_TOP_REM}rem`,
          width: `${CTA_WIDTH_REM}rem`,
          minHeight: `${CTA_HEIGHT_REM}rem`
        }}
      >
        Continuar
      </button>
    </>
  )
}

type RecountStepProps = {
  descriptionId: string
  values: Record<RecountFieldId, string>
  onChange: (fieldId: RecountFieldId, value: string) => void
  onContinue: () => void
}

function RecountStep({ descriptionId, values, onChange, onContinue }: RecountStepProps) {
  return (
    <>
      <section
        className='absolute'
        style={{
          left: `${RECOUNT_LABEL_LEFT_REM}rem`,
          top: `${RECOUNT_HEADER_TOP_REM}rem`,
          width: `${RECOUNT_INPUT_LEFT_REM + RECOUNT_INPUT_WIDTH_REM - RECOUNT_LABEL_LEFT_REM}rem`
        }}
      >
        <p id={descriptionId} className='text-title-sm font-medium text-fg'>
          Recuento de ingresos y gastos
        </p>
      </section>

      {RECOUNT_FIELDS.map((field, index) => {
        const top = RECOUNT_LABEL_TOP_START_REM + index * RECOUNT_LABEL_ROW_GAP_REM
        return (
          <React.Fragment key={field.id}>
            <p
              className='absolute text-body-md text-fg'
              style={{ left: `${RECOUNT_LABEL_LEFT_REM}rem`, top: `${top}rem` }}
            >
              {field.label}
            </p>

            <div
              className='absolute flex flex-col gap-[0.25rem]'
              style={{
                left: `${RECOUNT_INPUT_LEFT_REM}rem`,
                top: `${top}rem`,
                width: `${RECOUNT_INPUT_WIDTH_REM}rem`
              }}
            >
              <label className='flex h-[3rem] items-center rounded-lg border border-border bg-neutral-50 px-[0.625rem] focus-within:ring-2 focus-within:ring-brandSemantic'>
                <input
                  type='text'
                  value={values[field.id]}
                  onChange={(event) => onChange(field.id, event.target.value)}
                  placeholder='Value'
                  className='w-full bg-transparent text-body-md text-fg placeholder:text-neutral-400 focus:outline-none'
                />
              </label>
              <p className='text-label-sm font-medium text-neutral-600'>
                Debería haber <span className='font-bold text-fg'>{field.should}</span>
              </p>
            </div>
          </React.Fragment>
        )
      })}

      <button
        type='button'
        onClick={onContinue}
        className='absolute flex items-center justify-center rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-brand-900 shadow-cta transition-colors hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50'
        style={{
          left: `${RECOUNT_CTA_LEFT_REM}rem`,
          top: `${CTA_TOP_REM}rem`,
          width: `${CTA_WIDTH_REM}rem`,
          minHeight: `${CTA_HEIGHT_REM}rem`
        }}
      >
        Continuar
      </button>
    </>
  )
}


