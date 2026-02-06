'use client'

import {
  CloseRounded,
  ReceiptLongRounded,
  WarningRounded
} from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type GenerateInvoicePromptProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  patientName: string
  concept: string
  amount: string
}

export default function GenerateInvoicePrompt({
  open,
  onClose,
  onConfirm,
  patientName,
  concept,
  amount
}: GenerateInvoicePromptProps) {
  if (!open) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[28rem] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-6 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            Generar factura
          </h2>
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
          {/* Warning icon and message */}
          <div className='flex items-start gap-4 p-4 bg-warning-50 rounded-lg border border-warning-200'>
            <WarningRounded className='size-6 text-warning-600 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-body-md text-warning-800 font-medium'>
                Esta transacción no tiene factura asociada
              </p>
              <p className='text-body-sm text-warning-700 mt-1'>
                ¿Desea generar una factura ahora?
              </p>
            </div>
          </div>

          {/* Transaction details */}
          <div className='flex flex-col gap-3 p-4 bg-neutral-50 rounded-lg'>
            <div className='flex items-center gap-2 text-neutral-600'>
              <ReceiptLongRounded className='size-5' />
              <span className='text-body-sm font-medium'>Detalles de la transacción</span>
            </div>
            <div className='grid gap-2 pl-7'>
              <div>
                <p className='text-body-sm text-neutral-500'>Paciente</p>
                <p className='text-body-md text-neutral-900'>{patientName}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>Concepto</p>
                <p className='text-body-md text-neutral-900'>{concept}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>Importe</p>
                <p className='text-body-md text-neutral-900 font-semibold'>{amount}</p>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className='flex justify-end gap-3 mt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-body-md text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='button'
              onClick={handleConfirm}
              className='px-4 py-2 rounded-[8.5rem] bg-brand-500 text-body-md text-white hover:bg-brand-600 transition-colors cursor-pointer'
            >
              Generar factura
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
