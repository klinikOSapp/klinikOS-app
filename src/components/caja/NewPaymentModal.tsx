'use client'

import {
  CloseRounded,
  PaymentsRounded,
  CheckCircleRounded
} from '@/components/icons/md3'
import type { PaymentMethod } from '@/types/payments'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type NewPaymentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: NewPaymentFormData) => Promise<{
    ok: boolean
    error?: string
  }>
  // Datos del movimiento original
  patientId: string
  patientName: string
  concept: string
  pendingAmount: number
  originalTransactionId: string
}

export type NewPaymentFormData = {
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
  generateReceipt: boolean
  generateInvoice: boolean
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'financiacion', label: 'Financiación', icon: '📅' }
]

export default function NewPaymentModal({
  open,
  onClose,
  onSubmit,
  patientId,
  patientName,
  concept,
  pendingAmount,
  originalTransactionId
}: NewPaymentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo')
  const [reference, setReference] = useState<string>('')
  const [generateReceipt, setGenerateReceipt] = useState<boolean>(true)
  const [generateInvoice, setGenerateInvoice] = useState<boolean>(false)
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount(pendingAmount.toFixed(2))
      setPaymentMethod('efectivo')
      setReference('')
      setGenerateReceipt(true)
      setGenerateInvoice(false)
      setShowSuccess(false)
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }, [open, pendingAmount])

  if (!open) return null

  const numericAmount = parseFloat(amount) || 0
  const isValidAmount = numericAmount > 0 && numericAmount <= pendingAmount
  const canSubmit = isValidAmount

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only valid decimal numbers
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitError(null)
    setIsSubmitting(true)
    let result: { ok: boolean; error?: string }
    try {
      result = await onSubmit({
        amount: numericAmount,
        paymentMethod,
        reference: reference || undefined,
        generateReceipt,
        generateInvoice
      })
    } catch (error: any) {
      result = {
        ok: false,
        error: error?.message || 'No se pudo registrar el pago'
      }
    }

    if (!result.ok) {
      setSubmitError(result.error || 'No se pudo registrar el pago')
      setIsSubmitting(false)
      return
    }

    setShowSuccess(true)
    
    // Close after showing success
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const formatAmount = (value: number) => {
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Success state
  if (showSuccess) {
    return createPortal(
      <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
        <div className='absolute inset-0 bg-neutral-900/90' />
        <div className='relative bg-white rounded-lg w-[24rem] p-8 text-center'>
          <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 flex items-center justify-center'>
            <CheckCircleRounded className='size-10 text-success-600' />
          </div>
          <h3 className='text-title-lg text-neutral-900 mb-2'>Pago registrado</h3>
          <p className='text-body-md text-neutral-600'>
            Se ha cobrado {formatAmount(numericAmount)} € correctamente
          </p>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[32rem] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-6 border-b border-neutral-300'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center'>
              <PaymentsRounded className='size-4 text-brand-700' />
            </div>
            <h2 className='text-title-md text-neutral-900'>Nuevo pago</h2>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-[0.875rem]' />
          </button>
        </div>

        {/* Content */}
        <div className='flex flex-col gap-5 px-6 py-5'>
          {/* Patient and concept info */}
          <div className='p-4 bg-neutral-50 rounded-lg'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-body-sm text-neutral-500'>Paciente</p>
                <p className='text-body-md text-neutral-900 font-medium'>{patientName}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>Pendiente</p>
                <p className='text-body-md text-warning-600 font-semibold'>
                  {formatAmount(pendingAmount)} €
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-body-sm text-neutral-500'>Concepto</p>
                <p className='text-body-md text-neutral-900'>{concept}</p>
              </div>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className='text-body-sm text-neutral-600 mb-2 block'>
              Importe a cobrar
            </label>
            <div className='relative'>
              <input
                type='text'
                inputMode='decimal'
                value={amount}
                onChange={handleAmountChange}
                className={`w-full px-4 py-3 pr-12 text-2xl font-semibold border rounded-lg text-right focus:outline-none focus:ring-2 ${
                  isValidAmount
                    ? 'border-neutral-300 focus:ring-brand-500'
                    : numericAmount > pendingAmount
                    ? 'border-error-300 focus:ring-error-500'
                    : 'border-neutral-300 focus:ring-brand-500'
                }`}
                placeholder='0.00'
              />
              <span className='absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-neutral-400'>
                €
              </span>
            </div>
            {numericAmount > pendingAmount && (
              <p className='text-body-sm text-error-600 mt-1'>
                El importe no puede superar el pendiente ({formatAmount(pendingAmount)} €)
              </p>
            )}
          </div>

          {/* Payment method selector */}
          <div>
            <label className='text-body-sm text-neutral-600 mb-2 block'>
              Método de pago
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type='button'
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                    paymentMethod === method.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className='text-lg'>{method.icon}</span>
                  <span className={`text-body-md ${
                    paymentMethod === method.value
                      ? 'text-brand-700 font-medium'
                      : 'text-neutral-700'
                  }`}>
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference input */}
          <div>
            <label className='text-body-sm text-neutral-600 mb-2 block'>
              Referencia (opcional)
            </label>
            <input
              type='text'
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className='w-full px-4 py-2 border border-neutral-300 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-brand-500'
              placeholder='Nº transacción, autorización...'
            />
          </div>

          {submitError ? (
            <p className='text-body-sm text-error-600'>{submitError}</p>
          ) : null}

          {/* Checkboxes */}
          <div className='flex flex-col gap-2'>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={generateReceipt}
                onChange={(e) => setGenerateReceipt(e.target.checked)}
                className='w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500'
              />
              <span className='text-body-md text-neutral-700'>
                Generar recibo de pago
              </span>
            </label>
            <label className='flex items-center gap-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={generateInvoice}
                onChange={(e) => setGenerateInvoice(e.target.checked)}
                className='w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500'
              />
              <span className='text-body-md text-neutral-700'>
                Generar factura
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type='button'
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`w-full py-3 rounded-xl text-title-sm transition-colors ${
              canSubmit && !isSubmitting
                ? 'bg-brand-500 text-white hover:bg-brand-600 cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting
              ? 'Guardando...'
              : `Cobrar ${formatAmount(numericAmount)} €`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
