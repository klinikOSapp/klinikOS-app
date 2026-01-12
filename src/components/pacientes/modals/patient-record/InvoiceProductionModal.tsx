'use client'

import { CloseRounded } from '@/components/icons/md3'
import {
  DatePickerInput,
  TextInput
} from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import React from 'react'
import { createPortal } from 'react-dom'

type InvoiceProductionModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (data: InvoiceFormData) => void
  // Data from the production row
  treatment: string
  productionDate: string
  amount: string
}

type InvoiceFormData = {
  invoiceNumber: string
  invoiceDate: Date | null
}

// Generate a random invoice number
function generateInvoiceNumber(): string {
  const num = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, '0')
  return `F-${num}`
}

export default function InvoiceProductionModal({
  open,
  onClose,
  onSubmit,
  treatment,
  productionDate,
  amount
}: InvoiceProductionModalProps) {
  const [formData, setFormData] = React.useState<InvoiceFormData>({
    invoiceNumber: '',
    invoiceDate: null
  })

  // Generate invoice number and set today's date when modal opens
  React.useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date()
      }))
    }
  }, [open])

  const handleChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (date: Date) => {
    setFormData((prev) => ({ ...prev, invoiceDate: date }))
  }

  const setToday = () => {
    setFormData((prev) => ({ ...prev, invoiceDate: new Date() }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
    onClose()
  }

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      invoiceDate: null
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
        data-node-id='3092:14505'
      >
        {/* Header - 56px height */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            Facturar producción
          </h2>
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
            {/* Production info section */}
            <div className='flex flex-col gap-6 w-full'>
              {/* Tratamiento */}
              <div className='flex flex-col gap-2'>
                <p className='text-title-md text-neutral-900'>Tratamiento</p>
                <p className='text-body-md text-neutral-900'>{treatment}</p>
              </div>

              {/* Fecha producción */}
              <div className='flex flex-col gap-2'>
                <p className='text-title-md text-neutral-900'>
                  Fecha producción
                </p>
                <p className='text-body-md text-neutral-900'>{productionDate}</p>
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
                {/* Número factura */}
                <div className='flex flex-col gap-2 w-full'>
                  <label className='text-body-sm text-neutral-900'>
                    Número factura
                  </label>
                  <TextInput
                    placeholder='F-00000'
                    value={formData.invoiceNumber}
                    onChange={(v) => handleChange('invoiceNumber', v)}
                  />
                </div>

                {/* Fecha factura */}
                <div className='flex flex-col gap-2 w-full'>
                  <label className='text-body-sm text-neutral-900'>
                    Fecha factura
                  </label>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1'>
                      <DatePickerInput
                        value={formData.invoiceDate}
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
              Facturar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
