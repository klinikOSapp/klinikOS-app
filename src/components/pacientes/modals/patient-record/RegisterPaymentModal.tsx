'use client'

import { CloseRounded } from '@/components/icons/md3'
import { MD3Icon } from '@/components/icons/MD3Icon'
import {
  DatePickerInput,
  SelectInput,
  TextArea
} from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import React from 'react'
import { createPortal } from 'react-dom'

// Tipos para pagos parciales
type PaymentInfo = {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  currency: string
}

type InstallmentPlan = {
  totalInstallments: number
  currentInstallment: number
  amountPerInstallment: number
}

type RegisterPaymentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (data: RegisterPaymentFormData) => void
  // Data from the invoice row
  invoiceId: string
  treatment: string
  amount: string
  // Nuevos props para pagos parciales
  paymentInfo?: PaymentInfo
  installmentPlan?: InstallmentPlan
}

export type RegisterPaymentFormData = {
  paymentMethod: string
  paymentDate: Date | null
  reference: string
  amountToPay: number // Monto que se va a pagar (puede ser parcial)
}

// Mock data for dropdowns
const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' }
]

type PaymentOption = 'installment' | 'custom' | 'full'

export default function RegisterPaymentModal({
  open,
  onClose,
  onSubmit,
  invoiceId,
  treatment,
  amount,
  paymentInfo,
  installmentPlan
}: RegisterPaymentModalProps) {
  // Calcular el monto pendiente
  const pendingAmount = paymentInfo?.pendingAmount ?? (parseFloat(amount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0)
  const currency = paymentInfo?.currency ?? '€'
  const hasInstallmentPlan = !!installmentPlan

  // Opción de pago seleccionada
  const [paymentOption, setPaymentOption] = React.useState<PaymentOption>(
    hasInstallmentPlan ? 'installment' : 'full'
  )

  // Estado del formulario
  const [formData, setFormData] = React.useState<Omit<RegisterPaymentFormData, 'amountToPay'>>({
    paymentMethod: '',
    paymentDate: null,
    reference: ''
  })

  // Monto personalizado (solo cuando paymentOption === 'custom')
  const [customAmount, setCustomAmount] = React.useState<string>('')
  const [amountError, setAmountError] = React.useState<string>('')

  // Calcular el monto a pagar según la opción seleccionada
  const getAmountToPay = (): number => {
    if (paymentOption === 'installment' && installmentPlan) {
      return installmentPlan.amountPerInstallment
    }
    if (paymentOption === 'custom') {
      const parsed = parseFloat(customAmount.replace(',', '.'))
      return isNaN(parsed) ? 0 : parsed
    }
    // 'full' - pagar todo el pendiente
    return pendingAmount
  }

  const amountToPay = getAmountToPay()
  const remainingAfterPayment = Math.max(0, pendingAmount - amountToPay)

  // Auto-set today's date when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        paymentDate: new Date()
      }))
      // Reset payment option based on installment plan
      setPaymentOption(hasInstallmentPlan ? 'installment' : 'full')
      setCustomAmount('')
      setAmountError('')
    }
  }, [open, hasInstallmentPlan])

  // Validar monto personalizado
  React.useEffect(() => {
    if (paymentOption === 'custom' && customAmount) {
      const parsed = parseFloat(customAmount.replace(',', '.'))
      if (isNaN(parsed) || parsed <= 0) {
        setAmountError('Introduce un monto válido')
      } else if (parsed > pendingAmount) {
        setAmountError(`El monto no puede ser mayor que el pendiente (${pendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currency})`)
      } else {
        setAmountError('')
      }
    } else {
      setAmountError('')
    }
  }, [customAmount, paymentOption, pendingAmount, currency])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (date: Date) => {
    setFormData((prev) => ({ ...prev, paymentDate: date }))
  }

  const setToday = () => {
    setFormData((prev) => ({ ...prev, paymentDate: new Date() }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que hay un monto válido
    if (amountToPay <= 0) {
      setAmountError('Introduce un monto válido')
      return
    }
    if (amountToPay > pendingAmount) {
      setAmountError('El monto no puede ser mayor que el pendiente')
      return
    }

    onSubmit?.({
      ...formData,
      amountToPay
    })
    onClose()
  }

  const resetForm = () => {
    setFormData({
      paymentMethod: '',
      paymentDate: null,
      reference: ''
    })
    setCustomAmount('')
    setAmountError('')
    setPaymentOption(hasInstallmentPlan ? 'installment' : 'full')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={handleClose}
      />

      {/* Modal - 602px = 37.625rem */}
      <div
        className='relative bg-white rounded-lg w-[37.625rem] max-h-[90vh] overflow-y-auto'
        data-node-id='3092:12114'
      >
        {/* Header - 56px height */}
        <div className='sticky top-0 z-10 flex items-center justify-between h-14 px-8 border-b border-neutral-300 bg-white'>
          <h2 className='text-title-md text-neutral-900'>Registrar pago</h2>
          <button
            type='button'
            onClick={handleClose}
            className='text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-[0.875rem]' />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className='flex flex-col gap-8 px-8 py-6'
        >
          {/* Info del tratamiento */}
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p className='text-body-sm text-neutral-600'>Factura</p>
              <p className='text-body-md text-neutral-900'>{invoiceId}</p>
            </div>

            <div className='flex flex-col gap-1'>
              <p className='text-body-sm text-neutral-600'>Tratamiento</p>
              <p className='text-body-md text-neutral-900'>{treatment}</p>
            </div>
          </div>

          {/* Resumen de pagos */}
          {paymentInfo && (
            <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-4'>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-body-sm text-neutral-600'>Total tratamiento:</span>
                  <span className='text-body-md font-medium text-neutral-900'>
                    {paymentInfo.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-body-sm text-neutral-600'>Ya pagado:</span>
                  <span className='text-body-md font-medium text-green-600'>
                    {paymentInfo.paidAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                <div className='h-px bg-neutral-200' />
                <div className='flex items-center justify-between'>
                  <span className='text-body-sm font-medium text-neutral-900'>Pendiente:</span>
                  <span className='text-title-md font-semibold text-amber-600'>
                    {pendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
                  </span>
                </div>
                
                {/* Barra de progreso */}
                <div className='mt-1'>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-neutral-200'>
                    <div 
                      className='h-full rounded-full bg-green-500 transition-all duration-300'
                      style={{ 
                        width: `${paymentInfo.totalAmount > 0 
                          ? Math.min(100, (paymentInfo.paidAmount / paymentInfo.totalAmount) * 100) 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selector de tipo de pago */}
          <div className='flex flex-col gap-3'>
            <p className='text-title-sm text-neutral-900'>¿Cuánto desea pagar?</p>
            
            <div className='flex flex-col gap-2'>
              {/* Opción: Pagar cuota completa (solo si hay plan) */}
              {hasInstallmentPlan && installmentPlan && (
                <label className='flex items-center gap-3 rounded-lg border border-neutral-200 p-3 cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50'>
                  <input
                    type='radio'
                    name='paymentOption'
                    value='installment'
                    checked={paymentOption === 'installment'}
                    onChange={() => setPaymentOption('installment')}
                    className='h-4 w-4 text-brand-500 accent-brand-500'
                  />
                  <div className='flex-1'>
                    <p className='text-body-md text-neutral-900'>
                      Pagar cuota {installmentPlan.currentInstallment} de {installmentPlan.totalInstallments}
                    </p>
                    <p className='text-body-sm text-neutral-600'>
                      {installmentPlan.amountPerInstallment.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
                    </p>
                  </div>
                  <MD3Icon name='CalendarMonthRounded' size={1.25} className='text-neutral-400' />
                </label>
              )}

              {/* Opción: Pagar todo el pendiente */}
              <label className='flex items-center gap-3 rounded-lg border border-neutral-200 p-3 cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50'>
                <input
                  type='radio'
                  name='paymentOption'
                  value='full'
                  checked={paymentOption === 'full'}
                  onChange={() => setPaymentOption('full')}
                  className='h-4 w-4 text-brand-500 accent-brand-500'
                />
                <div className='flex-1'>
                  <p className='text-body-md text-neutral-900'>Pagar todo el pendiente</p>
                  <p className='text-body-sm text-neutral-600'>
                    {pendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
                  </p>
                </div>
                <MD3Icon name='CheckCircleRounded' size={1.25} className='text-neutral-400' />
              </label>

              {/* Opción: Pago personalizado */}
              <label className='flex items-start gap-3 rounded-lg border border-neutral-200 p-3 cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50'>
                <input
                  type='radio'
                  name='paymentOption'
                  value='custom'
                  checked={paymentOption === 'custom'}
                  onChange={() => setPaymentOption('custom')}
                  className='mt-1 h-4 w-4 text-brand-500 accent-brand-500'
                />
                <div className='flex-1'>
                  <p className='text-body-md text-neutral-900'>Pago personalizado</p>
                  {paymentOption === 'custom' && (
                    <div className='mt-2'>
                      <div className='relative'>
                        <input
                          type='text'
                          inputMode='decimal'
                          placeholder='0,00'
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className={`w-full rounded-lg border ${amountError ? 'border-red-500' : 'border-neutral-300'} bg-white px-3 py-2 pr-8 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500`}
                        />
                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-body-md text-neutral-500'>
                          {currency}
                        </span>
                      </div>
                      {amountError && (
                        <p className='mt-1 text-body-sm text-red-500'>{amountError}</p>
                      )}
                    </div>
                  )}
                </div>
                <MD3Icon name='EditRounded' size={1.25} className='text-neutral-400' />
              </label>
            </div>
          </div>

          {/* Vista previa del resultado */}
          {amountToPay > 0 && !amountError && (
            <div className='flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3'>
              <div className='flex items-center gap-2'>
                <MD3Icon name='InfoRounded' size={1} className='text-brand-700' />
                <span className='text-body-sm text-brand-900'>
                  Quedará pendiente después del pago:
                </span>
              </div>
              <span className={`text-title-sm font-semibold ${remainingAfterPayment === 0 ? 'text-green-600' : 'text-brand-900'}`}>
                {remainingAfterPayment.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
                {remainingAfterPayment === 0 && ' ✓'}
              </span>
            </div>
          )}

          {/* Campos del formulario */}
          <div className='flex flex-col gap-4'>
            <p className='text-title-sm text-neutral-900'>Detalles del pago</p>

            <div className='flex flex-col gap-4'>
              {/* Método de pago */}
              <div className='flex flex-col gap-2'>
                <label className='text-body-sm text-neutral-900'>
                  Método de pago
                </label>
                <SelectInput
                  placeholder='Seleccionar método'
                  value={formData.paymentMethod}
                  onChange={(v) => handleChange('paymentMethod', v)}
                  options={PAYMENT_METHODS}
                />
              </div>

              {/* Fecha de pago */}
              <div className='flex flex-col gap-2'>
                <label className='text-body-sm text-neutral-900'>
                  Fecha de pago
                </label>
                <div className='flex items-center gap-2'>
                  <div className='flex-1'>
                    <DatePickerInput
                      value={formData.paymentDate}
                      onChange={handleDateChange}
                    />
                  </div>
                  <button
                    type='button'
                    onClick={setToday}
                    className='h-12 px-3 rounded-lg border border-neutral-300 bg-neutral-50 text-body-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer whitespace-nowrap'
                  >
                    Hoy
                  </button>
                </div>
              </div>

              {/* Referencia (opcional) */}
              <div className='flex flex-col gap-2'>
                <label className='text-body-sm text-neutral-900'>
                  Referencia (opcional)
                </label>
                <TextArea
                  placeholder='Escribe una referencia'
                  value={formData.reference}
                  onChange={(v) => handleChange('reference', v)}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-neutral-200'>
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={amountToPay <= 0 || !!amountError}
              className='px-6 py-2 rounded-[8.5rem] bg-brand-500 text-title-sm text-brand-900 hover:bg-brand-400 active:bg-brand-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Registrar pago de {amountToPay.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {currency}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
