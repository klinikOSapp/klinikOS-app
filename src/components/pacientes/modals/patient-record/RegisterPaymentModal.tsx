'use client'

import { CloseRounded } from '@/components/icons/md3'
import {
  DatePickerInput,
  SelectInput,
  TextArea
} from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import React from 'react'
import { createPortal } from 'react-dom'

type RegisterPaymentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (data: RegisterPaymentFormData) => void
  // Data from the invoice row
  invoiceId: string
  treatment: string
  amount: string
}

type RegisterPaymentFormData = {
  paymentMethod: string
  paymentDate: Date | null
  reference: string
}

// Mock data for dropdowns
const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' }
]

export default function RegisterPaymentModal({
  open,
  onClose,
  onSubmit,
  invoiceId,
  treatment,
  amount
}: RegisterPaymentModalProps) {
  const [formData, setFormData] = React.useState<RegisterPaymentFormData>({
    paymentMethod: '',
    paymentDate: null,
    reference: ''
  })

  // Auto-set today's date when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        paymentDate: new Date()
      }))
    }
  }, [open])

  const handleChange = (field: keyof RegisterPaymentFormData, value: string) => {
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
    onSubmit?.(formData)
    onClose()
  }

  const resetForm = () => {
    setFormData({
      paymentMethod: '',
      paymentDate: null,
      reference: ''
    })
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
        className='relative bg-white rounded-lg w-[37.625rem] overflow-hidden'
        data-node-id='3092:12114'
      >
        {/* Header - 56px height */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
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

        {/* Content - padding 32px */}
        <form
          onSubmit={handleSubmit}
          className='flex flex-col gap-11 items-end px-8 py-6'
        >
          <div className='flex flex-col gap-8 w-full'>
            {/* Invoice info section */}
            <div className='flex flex-col gap-6 w-full'>
              {/* Factura */}
              <div className='flex flex-col gap-2'>
                <p className='text-title-md text-neutral-900'>Factura</p>
                <p className='text-body-md text-neutral-900'>{invoiceId}</p>
              </div>

              {/* Tratamiento */}
              <div className='flex flex-col gap-2'>
                <p className='text-title-md text-neutral-900'>Tratamiento</p>
                <p className='text-body-md text-neutral-900'>{treatment}</p>
              </div>

              {/* Monto */}
              <div className='flex flex-col gap-2'>
                <p className='text-title-md text-neutral-900'>Monto</p>
                <p className='text-body-md text-neutral-900'>{amount}</p>
              </div>
            </div>

            {/* Form fields section */}
            <div className='flex flex-col gap-4 w-full'>
              <p className='text-title-sm text-neutral-900'>
                Completa los campos
              </p>

              <div className='flex flex-col gap-6 w-full'>
                {/* Método de pago */}
                <div className='flex flex-col gap-2 w-full'>
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
                <div className='flex flex-col gap-2 w-full'>
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
                <div className='flex flex-col gap-2 w-full'>
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
          </div>

          {/* Buttons */}
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='w-[12.1875rem] px-4 py-2 rounded-[8.5rem] bg-brand-500 text-title-sm text-brand-900 hover:bg-brand-400 active:bg-brand-600 transition-colors cursor-pointer'
            >
              Registrar pago
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
