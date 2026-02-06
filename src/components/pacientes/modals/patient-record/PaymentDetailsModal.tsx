'use client'

import {
  CloseRounded,
  CheckCircleRounded,
  ReceiptLongRounded,
  DownloadRounded
} from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type PaymentDetailsModalProps = {
  open: boolean
  onClose: () => void
  // Invoice/Payment data
  invoiceId: string
  description: string
  amount: string
  invoiceDate: string
  // Payment details
  paymentMethod: string
  paymentDate: string
  paymentReference?: string
  // Additional info
  patientName?: string
  professional?: string
  insurer?: string
  // Callbacks
  onDownloadReceipt?: () => void
}

export default function PaymentDetailsModal({
  open,
  onClose,
  invoiceId,
  description,
  amount,
  invoiceDate,
  paymentMethod,
  paymentDate,
  paymentReference,
  patientName = 'Pablo Cuesta González',
  professional = 'Dra. Andrea',
  insurer,
  onDownloadReceipt
}: PaymentDetailsModalProps) {
  if (!open) return null

  // Format payment method display
  const getPaymentMethodIcon = () => {
    switch (paymentMethod.toLowerCase()) {
      case 'efectivo':
        return '💵'
      case 'tarjeta':
        return '💳'
      case 'transferencia':
        return '🏦'
      case 'financiación':
        return '📅'
      default:
        return '💰'
    }
  }

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[36rem] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            Detalle del pago
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
        <div className='flex flex-col gap-6 px-8 py-6'>
          {/* Success indicator */}
          <div className='flex items-center gap-3 p-4 bg-success-50 rounded-lg border border-success-200'>
            <CheckCircleRounded className='size-8 text-success-600' />
            <div>
              <p className='text-title-md text-success-700'>Pago registrado</p>
              <p className='text-body-sm text-success-600'>
                El pago se ha procesado correctamente
              </p>
            </div>
          </div>

          {/* Payment amount highlight */}
          <div className='flex items-center justify-center py-6 bg-neutral-50 rounded-lg'>
            <div className='text-center'>
              <p className='text-body-sm text-neutral-500'>Importe pagado</p>
              <p className='text-headline-md text-neutral-900'>{amount}</p>
            </div>
          </div>

          {/* Payment details grid */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-body-sm text-neutral-500'>Método de pago</p>
              <p className='text-body-md text-neutral-900'>
                {getPaymentMethodIcon()} {paymentMethod}
              </p>
            </div>
            <div>
              <p className='text-body-sm text-neutral-500'>Fecha de pago</p>
              <p className='text-body-md text-neutral-900'>{paymentDate}</p>
            </div>
            {paymentReference && (
              <div>
                <p className='text-body-sm text-neutral-500'>Referencia</p>
                <p className='text-body-md text-neutral-900 font-mono'>
                  {paymentReference}
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Invoice info */}
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <ReceiptLongRounded className='size-5 text-neutral-500' />
              <p className='text-title-sm text-neutral-900'>Datos de la factura</p>
            </div>
            <div className='grid grid-cols-2 gap-4 pl-7'>
              <div>
                <p className='text-body-sm text-neutral-500'>Factura</p>
                <p className='text-body-md text-neutral-900'>{invoiceId}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>Fecha factura</p>
                <p className='text-body-md text-neutral-900'>{invoiceDate}</p>
              </div>
              <div className='col-span-2'>
                <p className='text-body-sm text-neutral-500'>Concepto</p>
                <p className='text-body-md text-neutral-900'>{description}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Client info */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-body-sm text-neutral-500'>Paciente</p>
              <p className='text-body-md text-neutral-900'>{patientName}</p>
            </div>
            <div>
              <p className='text-body-sm text-neutral-500'>Profesional</p>
              <p className='text-body-md text-neutral-900'>{professional}</p>
            </div>
            {insurer && (
              <div>
                <p className='text-body-sm text-neutral-500'>Aseguradora</p>
                <p className='text-body-md text-neutral-900'>{insurer}</p>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className='flex justify-between items-center mt-4'>
            {/* Download receipt */}
            <button
              type='button'
              onClick={onDownloadReceipt}
              className='flex items-center gap-2 px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-body-md text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              <DownloadRounded className='size-5' />
              Descargar recibo
            </button>

            {/* Close button */}
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
