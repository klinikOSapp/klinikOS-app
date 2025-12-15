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

type RecountFieldId = 'cash' | 'tpv' | 'transfer' | 'cheque'

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
  date?: Date // Date for which to close cash
}

type ModalStep = 'select' | 'summary' | 'recount' | 'confirmation'

type DailyMovement = {
  time: string
  patient: string
  concept: string
  amount: string
  method: string
}

type PaymentMethodBreakdown = {
  cash: number
  card: number
  transfer: number
  check: number
  [key: string]: number
}

type StaffMember = {
  id: string
  name: string
  email: string
}

export function CashClosingModal({ open, onClose, date = new Date() }: CashClosingModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [totalValues, setTotalValues] = React.useState(INITIAL_TOTAL_VALUES)
  const [recountValues, setRecountValues] = React.useState(INITIAL_RECOUNT_VALUES)
  const [step, setStep] = React.useState<ModalStep>('select')
  const [selectedDate, setSelectedDate] = React.useState<Date>(date)
  const [selectedStaffId, setSelectedStaffId] = React.useState<string>('')
  const [staffList, setStaffList] = React.useState<StaffMember[]>([])
  const [dailyMovements, setDailyMovements] = React.useState<DailyMovement[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = React.useState<PaymentMethodBreakdown>({
    cash: 0,
    card: 0,
    transfer: 0,
    check: 0
  })
  const [existingClosing, setExistingClosing] = React.useState<any>(null)

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

  // Fetch daily movements, calculated totals, and existing closing data when moving to summary step
  React.useEffect(() => {
    if (!open || step !== 'summary') return

    setIsLoading(true)
    const dateStr = selectedDate.toISOString().split('T')[0]

    // Fetch calculated totals (starter_box_amount and daily_box_amount)
    Promise.all([
      fetch(`/api/caja/closing/calculate-totals?date=${dateStr}`).then((res) => res.json()),
      fetch(`/api/caja/closing/daily-movements?date=${dateStr}`).then((res) => res.json()),
      fetch(`/api/caja/closing?date=${dateStr}`).then((res) => res.json())
    ])
      .then(([totalsData, movementsData, closingData]) => {
        // Set calculated totals
        if (totalsData.starterBoxAmount !== undefined) {
          setTotalValues((prev) => ({
            ...prev,
            initial: `${Number(totalsData.starterBoxAmount).toFixed(2)} €`
          }))
        }
        if (totalsData.dailyBoxAmount !== undefined) {
          setTotalValues((prev) => ({
            ...prev,
            day: `${Number(totalsData.dailyBoxAmount).toFixed(2)} €`
          }))
        }

        // Set daily movements and calculate payment method breakdown
        if (movementsData.movements) {
          setDailyMovements(movementsData.movements)

          // Calculate payment method breakdown from movements (using English keys)
          const breakdown: PaymentMethodBreakdown = {
            cash: 0,
            card: 0,
            transfer: 0,
            check: 0
          }

          movementsData.movements.forEach((movement: DailyMovement) => {
            const amount = parseFloat(movement.amount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
            const method = movement.method.toLowerCase()

            if (method.includes('efectivo') || method.includes('cash')) {
              breakdown.cash += amount
            } else if (method.includes('tpv') || method.includes('tarjeta') || method.includes('card')) {
              breakdown.card += amount
            } else if (method.includes('transferencia') || method.includes('transfer')) {
              breakdown.transfer += amount
            } else if (method.includes('cheque') || method.includes('check')) {
              breakdown.check += amount
            }
          })

          setPaymentMethodBreakdown(breakdown)
        }

        // Load existing closing data if exists
        if (closingData.closing) {
          setExistingClosing(closingData.closing)

          // Populate form with existing data
          if (closingData.closing.starter_box_amount !== null) {
            setTotalValues((prev) => ({
              ...prev,
              initial: `${Number(closingData.closing.starter_box_amount).toFixed(2)} €`
            }))
          }
          if (closingData.closing.daily_box_amount !== null) {
            setTotalValues((prev) => ({
              ...prev,
              day: `${Number(closingData.closing.daily_box_amount).toFixed(2)} €`
            }))
          }
          if (closingData.closing.cash_withdrawals !== null) {
            setTotalValues((prev) => ({
              ...prev,
              outflow: `${Number(closingData.closing.cash_withdrawals).toFixed(2)} €`
            }))
          }
          if (closingData.closing.cash_balance !== null) {
            setTotalValues((prev) => ({
              ...prev,
              rest: `${Number(closingData.closing.cash_balance).toFixed(2)} €`
            }))
          }

          // Populate payment method breakdown if exists (support both English and Spanish keys)
          if (closingData.closing.payment_method_breakdown) {
            const breakdown = closingData.closing.payment_method_breakdown
            setRecountValues({
              cash: breakdown.cash ? `${breakdown.cash.toFixed(2)} €` : breakdown.efectivo ? `${breakdown.efectivo.toFixed(2)} €` : '',
              tpv: breakdown.card ? `${breakdown.card.toFixed(2)} €` : breakdown.tpv ? `${breakdown.tpv.toFixed(2)} €` : '',
              transfer: breakdown.transfer ? `${breakdown.transfer.toFixed(2)} €` : breakdown.transferencia ? `${breakdown.transferencia.toFixed(2)} €` : '',
              cheque: breakdown.check ? `${breakdown.check.toFixed(2)} €` : breakdown.cheque ? `${breakdown.cheque.toFixed(2)} €` : ''
            })
          }
        }

        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching data:', error)
        setIsLoading(false)
      })
  }, [open, step, selectedDate])

  const handleInputChange = (fieldId: CashTotalFieldId, value: string) => {
    setTotalValues((prev) => {
      const updated = { ...prev, [fieldId]: value }

      // Auto-calculate cash balance when starter, day, or outflow changes
      if (fieldId === 'initial' || fieldId === 'day' || fieldId === 'outflow') {
        const initial = parseFloat(updated.initial.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        const day = parseFloat(updated.day.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        const outflow = parseFloat(updated.outflow.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        const balance = initial + day - outflow
        updated.rest = `${balance.toFixed(2)} €`
      }

      return updated
    })
  }

  const handleRecountInputChange = (fieldId: RecountFieldId, value: string) => {
    setRecountValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleClose = () => {
    setStep('select')
    onClose()
  }

  const handleContinue = async () => {
    if (step === 'select') {
      // Validate professional and date selection
      if (!selectedStaffId) {
        alert('Por favor, selecciona un profesional')
        return
      }
      if (!selectedDate) {
        alert('Por favor, selecciona una fecha')
        return
      }
      setStep('summary')
      return
    }

    if (step === 'summary') {
      // Validate required field
      if (!totalValues.outflow || totalValues.outflow === '0,00 €' || totalValues.outflow === '0.00 €') {
        alert('Por favor, ingresa la salida de caja (requerido)')
        return
      }
      setStep('recount')
      return
    }

    if (step === 'recount') {
      // Save closing data
      setIsLoading(true)
      const dateStr = selectedDate.toISOString().split('T')[0]

      // Parse values
      const starterBoxAmount = parseFloat(totalValues.initial.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const dailyBoxAmount = parseFloat(totalValues.day.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const cashWithdrawals = parseFloat(totalValues.outflow.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const cashBalance = parseFloat(totalValues.rest.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0

      // Parse payment method breakdown (using English keys)
      const breakdown: PaymentMethodBreakdown = {
        cash: parseFloat(recountValues.cash.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
        card: parseFloat(recountValues.tpv.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
        transfer: parseFloat(recountValues.transfer.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
        check: parseFloat(recountValues.cheque.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      }

      try {
        const response = await fetch('/api/caja/closing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            staffId: selectedStaffId,
            starterBoxAmount,
            dailyBoxAmount,
            cashWithdrawals,
            cashBalance,
            paymentMethodBreakdown: breakdown
          })
        })

        const data = await response.json()
        if (response.ok) {
          setStep('confirmation')
          // Auto-close after 2 seconds
          setTimeout(() => {
            handleClose()
          }, 2000)
        } else {
          alert(`Error al guardar: ${data.error || 'Error desconocido'}`)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error saving closing:', error)
        alert('Error al guardar el cierre de caja')
        setIsLoading(false)
      }
      return
    }

    // Step 3: Confirmation - already handled above
    handleClose()
  }

  if (!open || !mounted) return null

  const modalWidthRem =
    step === 'summary' ? MODAL_WIDTH_REM : step === 'recount' ? RECOUNT_MODAL_WIDTH_REM : RECOUNT_MODAL_WIDTH_REM
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
    step === 'select'
      ? 'cash-close-select-description'
      : step === 'summary'
        ? 'cash-close-dialog-description'
        : step === 'recount'
          ? 'cash-close-recount-description'
          : 'cash-close-confirmation-description'

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

              {step === 'select' ? (
                <SelectStep
                  descriptionId={descriptionId}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedStaffId={selectedStaffId}
                  onStaffChange={setSelectedStaffId}
                  staffList={staffList}
                  onContinue={handleContinue}
                />
              ) : step === 'summary' ? (
                <SummaryStep
                  descriptionId={descriptionId}
                  totalValues={totalValues}
                  onChange={handleInputChange}
                  tableGridStyles={tableGridStyles}
                  onContinue={handleContinue}
                  dailyMovements={dailyMovements}
                  isLoading={isLoading}
                />
              ) : step === 'recount' ? (
                <RecountStep
                  descriptionId={descriptionId}
                  values={recountValues}
                  onChange={handleRecountInputChange}
                  onContinue={handleContinue}
                  paymentMethodBreakdown={paymentMethodBreakdown}
                  isLoading={isLoading}
                />
              ) : (
                <ConfirmationStep descriptionId={descriptionId} />
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

type SelectStepProps = {
  descriptionId: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  selectedStaffId: string
  onStaffChange: (staffId: string) => void
  staffList: StaffMember[]
  onContinue: () => void
}

function SelectStep({
  descriptionId,
  selectedDate,
  onDateChange,
  selectedStaffId,
  onStaffChange,
  staffList,
  onContinue
}: SelectStepProps) {
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
        <p className='text-headline-sm text-fg'>Seleccionar profesional y fecha</p>
        <p id={descriptionId} className='text-body-sm text-fg'>
          Selecciona el profesional que realiza el cierre y la fecha del cierre.
        </p>
      </section>

      <section
        className='absolute flex flex-col gap-[1.5rem]'
        style={{
          left: `${SECTION_LEFT_REM}rem`,
          top: `${FORM_TOP_REM}rem`,
          width: `${FORM_WIDTH_REM}rem`
        }}
      >
        <div className='flex flex-col gap-[0.5rem]'>
          <p className='text-body-sm text-fg'>Profesional</p>
          <label className='flex h-[3rem] items-center rounded-lg border border-border bg-neutral-50 px-[0.625rem] focus-within:ring-2 focus-within:ring-brandSemantic'>
            <select
              value={selectedStaffId}
              onChange={(e) => onStaffChange(e.target.value)}
              className='w-full bg-transparent text-body-md text-fg focus:outline-none'
            >
              {staffList.length === 0 ? (
                <option value=''>Cargando...</option>
              ) : (
                staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        <div className='flex flex-col gap-[0.5rem]'>
          <p className='text-body-sm text-fg'>Fecha del cierre</p>
          <div className='flex flex-col gap-[0.75rem]'>
            <div className='flex flex-col gap-[0.5rem]'>
              <p className='text-label-sm text-neutral-600'>Periodo</p>
              <label className='flex h-[3rem] items-center rounded-lg border border-border bg-neutral-50 px-[0.625rem] focus-within:ring-2 focus-within:ring-brandSemantic'>
                <select
                  defaultValue='custom'
                  className='w-full bg-transparent text-body-md text-fg focus:outline-none'
                >
                  <option value='custom'>Personalizado</option>
                </select>
              </label>
            </div>
            <div className='flex flex-col gap-[0.5rem]'>
              <label className='flex h-[3rem] items-center rounded-lg border border-border bg-neutral-50 px-[0.625rem] focus-within:ring-2 focus-within:ring-brandSemantic'>
                <input
                  type='date'
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => onDateChange(new Date(e.target.value))}
                  className='w-full bg-transparent text-body-md text-fg focus:outline-none'
                />
              </label>
            </div>
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

type SummaryStepProps = {
  descriptionId: string
  totalValues: Record<CashTotalFieldId, string>
  onChange: (fieldId: CashTotalFieldId, value: string) => void
  tableGridStyles: React.CSSProperties
  onContinue: () => void
  dailyMovements: DailyMovement[]
  isLoading: boolean
}

function SummaryStep({
  descriptionId,
  totalValues,
  onChange,
  tableGridStyles,
  onContinue,
  dailyMovements,
  isLoading
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
        {CASH_TOTAL_FIELDS.map((field) => {
          const isReadOnly = field.id === 'initial' || field.id === 'day' || field.id === 'rest'
          return (
            <div key={field.id} className='flex flex-1 flex-col gap-[0.5rem]'>
              <p className='text-body-sm text-fg'>{field.label}</p>
              <label
                className={`flex h-[3rem] items-center justify-between rounded-lg border border-border bg-neutral-50 px-[0.625rem] ${
                  isReadOnly ? '' : 'focus-within:ring-2 focus-within:ring-brandSemantic'
                }`}
              >
                <input
                  type='text'
                  value={totalValues[field.id]}
                  onChange={(event) => onChange(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  readOnly={isReadOnly}
                  className='w-full bg-transparent text-body-md text-fg placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75'
                  aria-required={field.required}
                  disabled={isReadOnly}
                />
                {field.required && (
                  <span className='text-body-lg font-medium leading-none text-error-600'>*</span>
                )}
              </label>
            </div>
          )
        })}
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
            {isLoading ? (
              <div className='flex h-full items-center justify-center text-body-md text-neutral-600'>
                Cargando movimientos...
              </div>
            ) : dailyMovements.length === 0 ? (
              <div className='flex h-full items-center justify-center text-body-md text-neutral-600'>
                No hay movimientos para este día
              </div>
            ) : (
              dailyMovements.map((row, index) => (
                <div
                  key={`${row.time}-${row.patient}-${index}`}
                  className='grid border-b border-border text-body-md text-neutral-900'
                  style={tableGridStyles}
                >
                  <Cell>{row.time}</Cell>
                  <Cell>{row.patient}</Cell>
                  <Cell>{row.concept}</Cell>
                  <Cell>{row.amount}</Cell>
                  <Cell border={false}>{row.method}</Cell>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <button
        type='button'
        onClick={onContinue}
        disabled={isLoading}
        className='absolute flex items-center justify-center rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-brand-900 shadow-cta transition-colors hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
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
  paymentMethodBreakdown: PaymentMethodBreakdown
  isLoading: boolean
}

function RecountStep({
  descriptionId,
  values,
  onChange,
  onContinue,
  paymentMethodBreakdown,
  isLoading
}: RecountStepProps) {
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

      {[
        { id: 'cash' as const, label: 'Efectivo', should: paymentMethodBreakdown.cash },
        { id: 'tpv' as const, label: 'TPV', should: paymentMethodBreakdown.card },
        { id: 'transfer' as const, label: 'Transferencia', should: paymentMethodBreakdown.transfer },
        { id: 'cheque' as const, label: 'Cheque', should: paymentMethodBreakdown.check }
      ]
        .filter((field) => field.should > 0) // Only show methods with amounts
        .map((field, index) => {
          const top = RECOUNT_LABEL_TOP_START_REM + index * RECOUNT_LABEL_ROW_GAP_REM
          const shouldAmount = `${field.should.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
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
                    disabled={isLoading}
                  />
                </label>
                <p className='text-label-sm font-medium text-neutral-600'>
                  Debería haber <span className='font-bold text-fg'>{shouldAmount}</span>
                </p>
              </div>
            </React.Fragment>
          )
        })}

      <button
        type='button'
        onClick={onContinue}
        disabled={isLoading}
        className='absolute flex items-center justify-center rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-brand-900 shadow-cta transition-colors hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed'
        style={{
          left: `${RECOUNT_CTA_LEFT_REM}rem`,
          top: `${CTA_TOP_REM}rem`,
          width: `${CTA_WIDTH_REM}rem`,
          minHeight: `${CTA_HEIGHT_REM}rem`
        }}
      >
        {isLoading ? 'Guardando...' : 'Continuar'}
      </button>
    </>
  )
}

type ConfirmationStepProps = {
  descriptionId: string
}

function ConfirmationStep({ descriptionId }: ConfirmationStepProps) {
  return (
    <div className='absolute inset-0 flex items-center justify-center'>
      <div className='flex flex-col items-center gap-[1rem] text-center'>
        <div className='flex size-[4rem] items-center justify-center rounded-full bg-brand-100'>
          <span className='material-symbols-rounded text-[2.5rem] text-brand-600'>check_circle</span>
        </div>
        <p id={descriptionId} className='text-title-md font-medium text-fg'>
          Cierre de caja guardado correctamente
        </p>
        <p className='text-body-sm text-neutral-600'>El cierre se ha registrado en el sistema</p>
      </div>
    </div>
  )
}


