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
  { id: 'initial', label: 'Caja inicial', placeholder: '0,00 €', required: false },
  { id: 'day', label: 'Caja del día', placeholder: '0,00 €', required: false },
  { id: 'outflow', label: 'Salida de caja', placeholder: '0,00 €', required: true },
  { id: 'rest', label: 'Resto de caja', placeholder: '0,00 €', required: false }
] as const

type CashTotalFieldId = (typeof CASH_TOTAL_FIELDS)[number]['id']

const INITIAL_TOTAL_VALUES: Record<CashTotalFieldId, string> = {
  initial: '0.00 €',
  day: '0.00 €',
  rest: '0.00 €',
  outflow: '0.00 €' // Default to 0 as requested
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

// Helper function to format date in local timezone (YYYY-MM-DD)
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to create date in local timezone (avoiding timezone issues)
const createLocalDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month, day, 12, 0, 0) // Use noon to avoid timezone edge cases
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

  // Reset modal state when opening (only when open changes, not date)
  React.useEffect(() => {
    if (open) {
      setStep('select')
      // Ensure date is in local timezone (create new date at noon to avoid timezone issues)
      const initialDate = date instanceof Date 
        ? createLocalDate(date.getFullYear(), date.getMonth(), date.getDate())
        : new Date()
      console.log(`[CashClosingModal] Opening modal, initial date:`, initialDate, `Formatted:`, formatDateForAPI(initialDate))
      setSelectedDate(initialDate)
      setSelectedStaffId('')
      setStaffList([]) // Reset staff list to show loading state
      setRecountValues(INITIAL_RECOUNT_VALUES) // Reset recount values to empty - humans must manually enter
      setTotalValues(INITIAL_TOTAL_VALUES) // Reset total values to defaults
      setPaymentMethodBreakdown({ cash: 0, card: 0, transfer: 0, check: 0 }) // Reset breakdown
      setExistingClosing(null) // Reset existing closing
    }
  }, [open]) // Removed 'date' from dependencies to prevent infinite loop

  // Fetch staff list when modal opens
  React.useEffect(() => {
    if (!open || step !== 'select') return

    let cancelled = false
    fetch('/api/caja/closing/staff')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff)
        } else {
          console.warn('No staff data received:', data)
          setStaffList([])
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Error fetching staff:', error)
        setStaffList([])
      })

    return () => {
      cancelled = true
    }
  }, [open, step])

  // Fetch daily movements, calculated totals, and existing closing data when moving to summary step
  React.useEffect(() => {
    if (!open || step !== 'summary') return

    setIsLoading(true)
    // Format date in local timezone to avoid UTC conversion issues
    const dateStr = formatDateForAPI(selectedDate)
    
    console.log(`[CashClosingModal] Fetching data for date:`, selectedDate, `Formatted:`, dateStr)

    // Fetch calculated totals (starter_box_amount and daily_box_amount)
    Promise.all([
      fetch(`/api/caja/closing/calculate-totals?date=${dateStr}`).then((res) => res.json()),
      fetch(`/api/caja/closing/daily-movements?date=${dateStr}`).then((res) => res.json()),
      fetch(`/api/caja/closing?date=${dateStr}`).then((res) => res.json())
    ])
      .then(([totalsData, movementsData, closingData]) => {
        // Calculate values from API responses
        const initialValue = closingData.closing?.starter_box_amount !== null && closingData.closing?.starter_box_amount !== undefined
          ? Number(closingData.closing.starter_box_amount)
          : totalsData.starterBoxAmount !== undefined
            ? Number(totalsData.starterBoxAmount)
            : 0

        const dayValue = closingData.closing?.daily_box_amount !== null && closingData.closing?.daily_box_amount !== undefined
          ? Number(closingData.closing.daily_box_amount)
          : totalsData.dailyBoxAmount !== undefined
            ? Number(totalsData.dailyBoxAmount)
            : 0

        // Outflow defaults to 0 if no existing closing
        const outflowValue = closingData.closing?.cash_withdrawals !== null && closingData.closing?.cash_withdrawals !== undefined
          ? Number(closingData.closing.cash_withdrawals)
          : 0

        // Calculate rest: Caja inicial + Caja del día - Salida de caja
        const restValue = initialValue + dayValue - outflowValue

        // Set all values at once to ensure rest is calculated correctly
        setTotalValues({
          initial: `${initialValue.toFixed(2)} €`,
          day: `${dayValue.toFixed(2)} €`,
          outflow: `${outflowValue.toFixed(2)} €`,
          rest: `${restValue.toFixed(2)} €`
        })

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
            // Parse amount - handle both "200,00 €" and "200.00 €" formats
            const amountStr = movement.amount.replace(/[^\d,.-]/g, '').replace(',', '.')
            const amount = parseFloat(amountStr) || 0
            const method = movement.method.toLowerCase().trim()

            console.log(`[Payment Breakdown] Processing movement: method="${movement.method}" (normalized: "${method}"), amount=${amount}`)

            // Match payment methods (case-insensitive, handle all variations)
            // Efectivo (Cash)
            if (method.includes('efectivo') || method === 'cash') {
              breakdown.cash += amount
              console.log(`[Payment Breakdown] Matched as cash, total cash: ${breakdown.cash}`)
            }
            // TPV / Card / Credit/Debit Card (all card payments go to TPV)
            else if (
              method.includes('tpv') ||
              method.includes('tarjeta') ||
              method.includes('card') ||
              method.includes('crédito') ||
              method.includes('débito') ||
              method.includes('credit') ||
              method.includes('debit')
            ) {
              breakdown.card += amount
              console.log(`[Payment Breakdown] Matched as card/TPV, total card: ${breakdown.card}`)
            }
            // Transferencia bancaria (Bank transfer)
            else if (
              method.includes('transferencia') ||
              method.includes('transfer') ||
              method.includes('bancaria') ||
              method.includes('bank')
            ) {
              breakdown.transfer += amount
              console.log(`[Payment Breakdown] Matched as transfer, total transfer: ${breakdown.transfer}`)
            }
            // Cheque (Check)
            else if (method.includes('cheque') || method === 'check') {
              breakdown.check += amount
              console.log(`[Payment Breakdown] Matched as check, total check: ${breakdown.check}`)
            }
            // Financiado (Financed) - goes to card/TPV category
            else if (method.includes('financiado') || method.includes('financed') || method.includes('financiación')) {
              breakdown.card += amount
              console.log(`[Payment Breakdown] Matched as financed (TPV), total card: ${breakdown.card}`)
            }
            // Billetera digital (Digital wallet) - goes to card/TPV category
            else if (method.includes('billetera') || method.includes('wallet') || method.includes('digital')) {
              breakdown.card += amount
              console.log(`[Payment Breakdown] Matched as digital wallet (TPV), total card: ${breakdown.card}`)
            }
            // Criptomonedas (Cryptocurrency) - goes to transfer category
            else if (method.includes('cripto') || method.includes('crypto')) {
              breakdown.transfer += amount
              console.log(`[Payment Breakdown] Matched as cryptocurrency (transfer), total transfer: ${breakdown.transfer}`)
            }
            // Pago a plazos (Installment payment) - goes to card/TPV category
            else if (method.includes('plazos') || method.includes('installment') || method.includes('installments')) {
              breakdown.card += amount
              console.log(`[Payment Breakdown] Matched as installment (TPV), total card: ${breakdown.card}`)
            }
            // Unknown payment method - default to card/TPV (most common case)
            else {
              console.warn(`[Payment Breakdown] Unknown payment method: "${movement.method}", amount: ${amount} - defaulting to TPV`)
              breakdown.card += amount
            }
          })

          console.log(`[Payment Breakdown] Final breakdown:`, breakdown)
          setPaymentMethodBreakdown(breakdown)
          // Note: We do NOT pre-populate recount values - humans must manually enter them
          // The "Debería haber..." text will show the expected amount from breakdown
        }

        // Load existing closing data if exists
        // Only populate recount values if there's an existing closing (user is editing/reviewing)
        // For new closings, fields should be empty so humans can manually enter values
        if (closingData.closing) {
          setExistingClosing(closingData.closing)

          // Populate payment method breakdown if exists (support both English and Spanish keys)
          // This only happens when editing an existing closing
          if (closingData.closing.payment_method_breakdown) {
            const breakdown = closingData.closing.payment_method_breakdown
            setRecountValues({
              cash: breakdown.cash ? `${breakdown.cash.toFixed(2)} €` : breakdown.efectivo ? `${breakdown.efectivo.toFixed(2)} €` : '',
              tpv: breakdown.card ? `${breakdown.card.toFixed(2)} €` : breakdown.tpv ? `${breakdown.tpv.toFixed(2)} €` : '',
              transfer: breakdown.transfer ? `${breakdown.transfer.toFixed(2)} €` : breakdown.transferencia ? `${breakdown.transferencia.toFixed(2)} €` : '',
              cheque: breakdown.check ? `${breakdown.check.toFixed(2)} €` : breakdown.cheque ? `${breakdown.cheque.toFixed(2)} €` : ''
            })
            console.log(`[CashClosingModal] Loaded recount values from existing closing`)
          }
        }
        // For new closings, recount values remain empty (INITIAL_RECOUNT_VALUES) so humans can manually enter

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
      // Validate required field - allow 0 as valid value (default)
      if (!totalValues.outflow || totalValues.outflow.trim() === '') {
        alert('Por favor, ingresa la salida de caja (requerido)')
        return
      }
      
      // Note: We do NOT pre-populate recount values - humans must manually enter them
      // The "Debería haber..." text in RecountStep will show the expected amount from paymentMethodBreakdown
      setStep('recount')
      return
    }

    if (step === 'recount') {
      // VALIDATION: All payment methods must be validated
      // Critical: Efectivo (Cash) must match - blocks closure
      // Warning: Other payment methods - flags discrepancy but allows continuation
      
      const discrepancies: Array<{ method: string; expected: number; actual: number }> = []
      
      // Validate Efectivo (Cash) - CRITICAL: Blocks closure if doesn't match
      const expectedCash = paymentMethodBreakdown.cash
      const actualCash = parseFloat(recountValues.cash.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      
      if (expectedCash > 0) {
        // System expects cash - must match exactly (allow 0.01€ rounding)
        if (Math.abs(actualCash - expectedCash) > 0.01) {
          alert(`⚠️ Validación crítica: El efectivo físico (${actualCash.toFixed(2)} €) no coincide con los registros del sistema (${expectedCash.toFixed(2)} €).\n\nNo se puede completar el cierre si el efectivo no coincide. Por favor, verifica el recuento de efectivo antes de continuar.`)
          return
        }
      } else if (actualCash > 0 && expectedCash === 0) {
        // User entered cash but system shows no cash transactions - CRITICAL: blocks closure
        alert(`⚠️ Validación crítica: Has ingresado ${actualCash.toFixed(2)} € en efectivo, pero el sistema no registra transacciones en efectivo para este día.\n\nNo se puede completar el cierre si el efectivo no coincide. Por favor, verifica el recuento de efectivo antes de continuar.`)
        return
      }
      
      // Validate TPV (Card) - WARNING: Flags discrepancy but allows continuation
      const expectedTPV = paymentMethodBreakdown.card
      const actualTPV = parseFloat(recountValues.tpv.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      if (expectedTPV > 0 && Math.abs(actualTPV - expectedTPV) > 0.01) {
        discrepancies.push({ method: 'TPV', expected: expectedTPV, actual: actualTPV })
      } else if (actualTPV > 0 && expectedTPV === 0) {
        discrepancies.push({ method: 'TPV', expected: expectedTPV, actual: actualTPV })
      }
      
      // Validate Transferencia (Transfer) - WARNING: Flags discrepancy but allows continuation
      const expectedTransfer = paymentMethodBreakdown.transfer
      const actualTransfer = parseFloat(recountValues.transfer.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      if (expectedTransfer > 0 && Math.abs(actualTransfer - expectedTransfer) > 0.01) {
        discrepancies.push({ method: 'Transferencia', expected: expectedTransfer, actual: actualTransfer })
      } else if (actualTransfer > 0 && expectedTransfer === 0) {
        discrepancies.push({ method: 'Transferencia', expected: expectedTransfer, actual: actualTransfer })
      }
      
      // Validate Cheque (Check) - WARNING: Flags discrepancy but allows continuation
      const expectedCheque = paymentMethodBreakdown.check
      const actualCheque = parseFloat(recountValues.cheque.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      if (expectedCheque > 0 && Math.abs(actualCheque - expectedCheque) > 0.01) {
        discrepancies.push({ method: 'Cheque', expected: expectedCheque, actual: actualCheque })
      } else if (actualCheque > 0 && expectedCheque === 0) {
        discrepancies.push({ method: 'Cheque', expected: expectedCheque, actual: actualCheque })
      }
      
      // If there are discrepancies in non-cash payment methods, warn but allow continuation
      if (discrepancies.length > 0) {
        const discrepancyList = discrepancies
          .map(d => `  • ${d.method}: Esperado ${d.expected.toFixed(2)} €, Ingresado ${d.actual.toFixed(2)} €`)
          .join('\n')
        
        const confirm = window.confirm(
          `⚠️ Advertencia: Se detectaron discrepancias en los siguientes métodos de pago:\n\n${discrepancyList}\n\nEstas discrepancias se registrarán para revisión. ¿Deseas continuar con el cierre?`
        )
        if (!confirm) {
          return
        }
      }

      // Save closing data
      setIsLoading(true)
      // Format date in local timezone to avoid UTC conversion issues
      const dateStr = formatDateForAPI(selectedDate)
      console.log(`[CashClosingModal] Saving closing for date:`, selectedDate, `Formatted:`, dateStr)

      // Parse values
      const starterBoxAmount = parseFloat(totalValues.initial.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const dailyBoxAmount = parseFloat(totalValues.day.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const cashWithdrawals = parseFloat(totalValues.outflow.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const cashBalance = parseFloat(totalValues.rest.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0

      // Parse payment method breakdown (using English keys)
      const breakdown: PaymentMethodBreakdown = {
        cash: actualCash,
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
    step === 'summary' ? MODAL_WIDTH_REM : step === 'recount' ? RECOUNT_MODAL_WIDTH_REM : step === 'select' ? MODAL_WIDTH_REM : RECOUNT_MODAL_WIDTH_REM
  const modalScaleFormula =
    step === 'summary' ? MODAL_SCALE_FORMULA : step === 'select' ? MODAL_SCALE_FORMULA : RECOUNT_MODAL_SCALE_FORMULA

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
  // Use year-month string as key to avoid Date object comparison issues
  const selectedYearMonth = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`
  const [calendarMonth, setCalendarMonth] = React.useState(() =>
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  )
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [calendarPosition, setCalendarPosition] = React.useState<{ top: number; left: number; width: number } | null>(null)
  const dateInputRef = React.useRef<HTMLButtonElement>(null)
  const calendarPopupRef = React.useRef<HTMLDivElement>(null)

  // Update calendar month when selectedDate's year/month changes
  React.useEffect(() => {
    setCalendarMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [selectedYearMonth]) // Only depend on year-month string

  // Calculate calendar position when opening
  React.useEffect(() => {
    if (!isCalendarOpen || !dateInputRef.current) {
      setCalendarPosition(null)
      return
    }

    const updatePosition = () => {
      if (dateInputRef.current) {
        const rect = dateInputRef.current.getBoundingClientRect()
        setCalendarPosition({
          top: rect.bottom + window.scrollY + 8, // 8px gap
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 320) // Minimum 20rem
        })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isCalendarOpen])

  // Close calendar when clicking outside
  React.useEffect(() => {
    if (!isCalendarOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dateInputRef.current &&
        calendarPopupRef.current &&
        !dateInputRef.current.contains(event.target as Node) &&
        !calendarPopupRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCalendarOpen])

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    return firstDay.getDay() === 0 ? 7 : firstDay.getDay() // Monday = 1, Sunday = 7
  }

  const navigateMonth = (direction: 1 | -1) => {
    setCalendarMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const handleDateClick = (day: number) => {
    // Create date in local timezone using helper function
    const newDate = createLocalDate(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    console.log(`[Calendar] Date clicked: day=${day}, month=${calendarMonth.getMonth() + 1}, year=${calendarMonth.getFullYear()}, created date:`, newDate, `Formatted:`, formatDateForAPI(newDate))
    onDateChange(newDate)
    setIsCalendarOpen(false) // Close calendar after selection
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const isSelectedDate = (day: number) => {
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === calendarMonth.getMonth() &&
      selectedDate.getFullYear() === calendarMonth.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === calendarMonth.getMonth() &&
      today.getFullYear() === calendarMonth.getFullYear()
    )
  }

  const monthName = calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(calendarMonth)
  const firstDay = getFirstDayOfMonth(calendarMonth)
  const daysBeforeMonth = firstDay - 1
  const prevMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()

  // Build calendar grid
  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = []

  // Previous month days
  for (let i = daysBeforeMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day)
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      date: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    })
  }

  // Next month days to fill grid (6 rows × 7 days = 42 cells)
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, day)
    })
  }

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

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
          width: `${FORM_WIDTH_REM}rem`,
          maxWidth: '100%'
        }}
      >
        {/* Professional Selection */}
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
                <>
                  <option value=''>Selecciona un profesional</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>

        {/* Date and Period Selection - Side by Side */}
        <div className='flex items-start gap-[1.5rem]'>
          {/* Fecha del cierre - Left */}
          <div className='relative flex flex-1 flex-col gap-[0.5rem]'>
            <p className='text-body-sm text-fg'>Fecha del cierre</p>
            <button
              ref={dateInputRef}
              type='button'
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className='flex h-[3rem] items-center justify-between rounded-lg border border-border bg-neutral-50 px-[0.625rem] text-left text-body-md text-fg transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brandSemantic'
            >
              <span>{formatDate(selectedDate)}</span>
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className={`transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`}
              >
                <path
                  d='M6 9L12 15L18 9'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </div>

          {/* Calendar Popup - Rendered via Portal */}
          {isCalendarOpen && calendarPosition && createPortal(
            <div
              ref={calendarPopupRef}
              className='fixed z-[100] flex flex-col rounded-lg border border-border bg-neutral-0 p-[1rem] shadow-elevation-popover'
              style={{
                top: `${calendarPosition.top}px`,
                left: `${calendarPosition.left}px`,
                width: `${calendarPosition.width}px`
              }}
            >
              {/* Month Navigation */}
              <div className='mb-[1rem] flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => navigateMonth(-1)}
                  className='flex items-center justify-center rounded-lg p-[0.5rem] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900'
                  aria-label='Mes anterior'
                >
                  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M15 18L9 12L15 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                </button>
                <h3 className='text-title-md font-medium text-fg capitalize'>{monthName}</h3>
                <button
                  type='button'
                  onClick={() => navigateMonth(1)}
                  className='flex items-center justify-center rounded-lg p-[0.5rem] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900'
                  aria-label='Mes siguiente'
                >
                  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                    <path d='M9 18L15 12L9 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                </button>
              </div>

              {/* Week Days Header */}
              <div className='mb-[0.5rem] grid grid-cols-7 gap-[0.25rem]'>
                {weekDays.map((day) => (
                  <div key={day} className='flex items-center justify-center py-[0.5rem] text-label-md font-medium text-neutral-600'>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className='grid w-full grid-cols-7 gap-[0.25rem]'>
                {calendarDays.map(({ day, isCurrentMonth, date }, index) => {
                  const selected = isSelectedDate(day) && isCurrentMonth
                  const today = isToday(day) && isCurrentMonth

                  return (
                    <button
                      key={`${date.getTime()}-${index}`}
                      type='button'
                      onClick={() => isCurrentMonth && handleDateClick(day)}
                      disabled={!isCurrentMonth}
                      className={`flex h-[2.5rem] min-w-0 items-center justify-center rounded-lg text-body-md transition-colors ${
                        !isCurrentMonth
                          ? 'cursor-not-allowed text-neutral-400'
                          : selected
                            ? 'bg-brand-500 font-bold text-brand-900'
                            : today
                              ? 'border-2 border-brand-500 font-medium text-brand-500'
                              : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body
          )}

          {/* Periodo - Right */}
          <div className='flex flex-1 flex-col gap-[0.5rem]'>
            <p className='text-body-sm text-fg'>Periodo</p>
            <label className='flex h-[3rem] items-center rounded-lg border border-border bg-neutral-50 px-[0.625rem] focus-within:ring-2 focus-within:ring-brandSemantic'>
              <select
                defaultValue='custom'
                className='w-full bg-transparent text-body-md text-fg focus:outline-none'
              >
                <option value='custom'>Personalizado</option>
              </select>
            </label>
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

      {(() => {
        console.log(`[RecountStep] Payment method breakdown:`, paymentMethodBreakdown)
        // Show ALL payment methods for reconciliation (even if amount is 0)
        // This allows users to verify all payment methods, not just the ones with transactions
        const fields = [
          { id: 'cash' as const, label: 'Efectivo', should: paymentMethodBreakdown.cash },
          { id: 'tpv' as const, label: 'TPV', should: paymentMethodBreakdown.card },
          { id: 'transfer' as const, label: 'Transferencia', should: paymentMethodBreakdown.transfer },
          { id: 'cheque' as const, label: 'Cheque', should: paymentMethodBreakdown.check }
        ]
        console.log(`[RecountStep] Showing ${fields.length} payment methods:`, fields.map(f => `${f.label} (${f.should})`))
        return fields
      })().map((field, index) => {
          console.log(`[RecountStep] Rendering ${field.label} with amount: ${field.should}`)
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


