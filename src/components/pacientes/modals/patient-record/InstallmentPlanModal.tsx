'use client'

import { CloseRounded, PaymentsRounded } from '@/components/icons/md3'
import type { BudgetInstallmentPlan } from '@/types/payments'
import { createInstallmentPlan } from '@/types/payments'
import React from 'react'
import { createPortal } from 'react-dom'

type InstallmentPlanModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (plan: BudgetInstallmentPlan | null) => void
  budgetId: string
  budgetDescription: string
  totalAmount: number
}

type PaymentType = 'single' | 'installments'

export default function InstallmentPlanModal({
  open,
  onClose,
  onConfirm,
  budgetId,
  budgetDescription,
  totalAmount
}: InstallmentPlanModalProps) {
  const [paymentType, setPaymentType] = React.useState<PaymentType>('single')
  const [numberOfInstallments, setNumberOfInstallments] = React.useState<number>(3)
  const [customInstallments, setCustomInstallments] = React.useState<string>('')

  // Calcular monto por cuota
  const installmentAmount = React.useMemo(() => {
    const num = customInstallments ? parseInt(customInstallments) : numberOfInstallments
    if (num > 0) {
      return Math.round((totalAmount / num) * 100) / 100
    }
    return 0
  }, [totalAmount, numberOfInstallments, customInstallments])

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setPaymentType('single')
      setNumberOfInstallments(3)
      setCustomInstallments('')
    }
  }, [open])

  const handleConfirm = () => {
    if (paymentType === 'single') {
      onConfirm(null)
    } else {
      const numInstallments = customInstallments 
        ? parseInt(customInstallments) 
        : numberOfInstallments
      
      const plan = createInstallmentPlan({
        budgetId,
        totalAmount,
        numberOfInstallments: numInstallments,
        startDate: new Date().toISOString().split('T')[0],
        frequency: 'monthly'
      })
      
      onConfirm(plan)
    }
    onClose()
  }

  const presetInstallments = [2, 3, 6, 12]

  if (!open) return null

  const modalContent = (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div
        className='relative bg-white rounded-2xl shadow-xl overflow-hidden'
        style={{
          width: 'min(32rem, 92vw)',
          maxHeight: '85vh'
        }}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center'>
              <PaymentsRounded className='w-5 h-5 text-brand-700' />
            </div>
            <div>
              <h2 className='text-title-md text-neutral-900'>
                Configurar forma de pago
              </h2>
              <p className='text-body-sm text-neutral-500'>
                {budgetDescription}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-2 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            <CloseRounded className='w-5 h-5 text-neutral-500' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6 overflow-y-auto' style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Total Amount Display */}
          <div className='bg-neutral-50 rounded-xl p-4 text-center'>
            <p className='text-body-sm text-neutral-500 mb-1'>Total del presupuesto</p>
            <p className='text-3xl font-semibold text-neutral-900'>
              {totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </p>
          </div>

          {/* Payment Type Selection */}
          <div className='space-y-3'>
            <p className='text-title-sm text-neutral-700'>¿Cómo va a pagar el paciente?</p>
            
            {/* Single Payment Option */}
            <button
              type='button'
              onClick={() => setPaymentType('single')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                paymentType === 'single'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'single'
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-neutral-300'
                  }`}
                >
                  {paymentType === 'single' && (
                    <div className='w-2 h-2 rounded-full bg-white' />
                  )}
                </div>
                <div>
                  <p className='text-title-sm text-neutral-900'>Pago único</p>
                  <p className='text-body-sm text-neutral-500'>
                    El paciente pagará el total en un solo pago
                  </p>
                </div>
              </div>
            </button>

            {/* Installments Option */}
            <button
              type='button'
              onClick={() => setPaymentType('installments')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                paymentType === 'installments'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'installments'
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-neutral-300'
                  }`}
                >
                  {paymentType === 'installments' && (
                    <div className='w-2 h-2 rounded-full bg-white' />
                  )}
                </div>
                <div>
                  <p className='text-title-sm text-neutral-900'>Pago fraccionado</p>
                  <p className='text-body-sm text-neutral-500'>
                    Dividir el pago en varias cuotas mensuales
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Installments Configuration */}
          {paymentType === 'installments' && (
            <div className='space-y-4 animate-in slide-in-from-top-2 duration-200'>
              <p className='text-title-sm text-neutral-700'>Número de cuotas</p>
              
              {/* Preset Options */}
              <div className='flex gap-2'>
                {presetInstallments.map((num) => (
                  <button
                    key={num}
                    type='button'
                    onClick={() => {
                      setNumberOfInstallments(num)
                      setCustomInstallments('')
                    }}
                    className={`flex-1 py-3 rounded-lg border-2 text-title-sm transition-all cursor-pointer ${
                      numberOfInstallments === num && !customInstallments
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className='flex items-center gap-3'>
                <span className='text-body-sm text-neutral-500'>o escribe otro:</span>
                <input
                  type='number'
                  min='2'
                  max='48'
                  value={customInstallments}
                  onChange={(e) => setCustomInstallments(e.target.value)}
                  placeholder='Ej: 18'
                  className='w-24 px-3 py-2 border border-neutral-300 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                />
              </div>

              {/* Summary */}
              <div className='bg-brand-50 rounded-xl p-4 space-y-2'>
                <div className='flex justify-between text-body-md'>
                  <span className='text-neutral-600'>Número de cuotas:</span>
                  <span className='font-medium text-neutral-900'>
                    {customInstallments || numberOfInstallments}
                  </span>
                </div>
                <div className='flex justify-between text-body-md'>
                  <span className='text-neutral-600'>Importe por cuota:</span>
                  <span className='font-semibold text-brand-700'>
                    {installmentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <div className='flex justify-between text-body-sm pt-2 border-t border-brand-200'>
                  <span className='text-neutral-500'>Frecuencia:</span>
                  <span className='text-neutral-600'>Mensual</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
          <button
            type='button'
            onClick={onClose}
            className='px-5 py-2.5 rounded-lg border border-neutral-300 text-title-sm text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleConfirm}
            className='px-5 py-2.5 rounded-lg bg-brand-500 text-white text-title-sm hover:bg-brand-600 transition-colors cursor-pointer'
          >
            {paymentType === 'single' ? 'Confirmar pago único' : `Crear ${customInstallments || numberOfInstallments} cuotas`}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
