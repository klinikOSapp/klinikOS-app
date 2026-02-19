'use client'

import {
  CloseRounded,
  DownloadRounded,
  AttachEmailRounded
} from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type InvoiceDetailsModalProps = {
  open: boolean
  onClose: () => void
  // Invoice data
  invoiceId: string
  description: string
  amount: string
  date: string
  status: 'Cobrado' | 'Pendiente'
  paymentMethod: string
  insurer: string
  // Additional data
  patientName?: string
  patientNIF?: string
  professional?: string
  budgetId?: string
  // Treatment type for IVA calculation (dental = 0%, estetica = 10%)
  treatmentType?: 'dental' | 'estetica'
  // Payment info (for Cobrado status)
  paymentDate?: string
  paymentReference?: string
  // Callbacks
  onDownloadPdf?: () => void
  onSendEmail?: () => void
}

export default function InvoiceDetailsModal({
  open,
  onClose,
  invoiceId,
  description,
  amount,
  date,
  status,
  paymentMethod,
  insurer,
  patientName = '-',
  patientNIF = '-',
  professional = '-',
  budgetId,
  treatmentType = 'dental',
  paymentDate,
  paymentReference,
  onDownloadPdf,
  onSendEmail
}: InvoiceDetailsModalProps) {
  if (!open) return null

  // Status badge styles
  const getStatusStyles = () => {
    switch (status) {
      case 'Cobrado':
        return 'bg-success-100 text-success-700 border-success-300'
      case 'Pendiente':
        return 'bg-warning-100 text-warning-700 border-warning-300'
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300'
    }
  }

  // Parse amount to get base and IVA
  // IVA rates: dental = 0% (exento), estética = 10% (tipo reducido)
  const parseAmount = (amountStr: string, type: 'dental' | 'estetica') => {
    const numericAmount = parseFloat(
      amountStr.replace(/[€\s.]/g, '').replace(',', '.')
    ) || 0
    
    // IVA según tipo: dental = 0%, estética = 10%
    const ivaRate = type === 'estetica' ? 0.10 : 0
    const baseAmount = numericAmount / (1 + ivaRate)
    const ivaAmount = numericAmount - baseAmount
    
    return {
      base: baseAmount.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      iva: ivaAmount.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      ivaRate: ivaRate * 100, // Porcentaje para mostrar
      hasIva: ivaRate > 0, // Flag para renderizado condicional
      total: numericAmount.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }

  const amounts = parseAmount(amount, treatmentType)

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[44rem] max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300 shrink-0'>
          <h2 className='text-title-md text-neutral-900'>
            Detalle de factura
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
        <div className='flex flex-col gap-6 px-8 py-6 overflow-y-auto'>
          {/* Invoice Header */}
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-headline-sm text-neutral-900'>Factura {invoiceId}</p>
              <p className='text-body-sm text-neutral-500'>Fecha: {date}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-body-sm border ${getStatusStyles()}`}
            >
              {status}
            </span>
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Client Info */}
          <div className='flex flex-col gap-3'>
            <p className='text-title-sm text-neutral-900 font-semibold'>
              Datos del cliente
            </p>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-body-sm text-neutral-500'>Nombre</p>
                <p className='text-body-md text-neutral-900'>{patientName}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>NIF/CIF</p>
                <p className='text-body-md text-neutral-900'>{patientNIF}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>Aseguradora</p>
                <p className='text-body-md text-neutral-900'>{insurer || '-'}</p>
              </div>
              <div>
                <p className='text-body-sm text-neutral-500'>Profesional</p>
                <p className='text-body-md text-neutral-900'>{professional}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Concept/Treatment */}
          <div className='flex flex-col gap-3'>
            <p className='text-title-sm text-neutral-900 font-semibold'>
              Conceptos facturados
            </p>
            <div className='border border-neutral-200 rounded-lg overflow-hidden'>
              {/* Table header */}
              <div className='flex items-center h-10 px-4 bg-neutral-50 border-b border-neutral-200'>
                <p className='flex-1 text-title-sm text-neutral-700'>Descripción</p>
                <p className='w-24 text-title-sm text-neutral-700 text-right'>Importe</p>
              </div>
              {/* Table row */}
              <div className='flex items-center h-12 px-4'>
                <p className='flex-1 text-body-md text-neutral-900'>{description}</p>
                <p className='w-24 text-body-md text-neutral-900 text-right'>{amount}</p>
              </div>
            </div>
          </div>

          {/* Amounts Summary */}
          <div className='flex flex-col gap-2 items-end'>
            {/* Base imponible - siempre visible */}
            <div className='w-64 flex justify-between'>
              <p className='text-body-md text-neutral-500'>Base imponible:</p>
              <p className='text-body-md text-neutral-900'>{amounts.base} €</p>
            </div>
            {/* IVA - solo si aplica (estética = 10%) */}
            {amounts.hasIva && (
              <div className='w-64 flex justify-between'>
                <p className='text-body-md text-neutral-500'>IVA ({amounts.ivaRate}%):</p>
                <p className='text-body-md text-neutral-900'>{amounts.iva} €</p>
              </div>
            )}
            {/* Total - siempre visible */}
            <div className='w-64 flex justify-between pt-2 border-t border-neutral-200'>
              <p className='text-title-md text-neutral-900'>Total:</p>
              <p className='text-title-md text-neutral-900'>{amounts.total} €</p>
            </div>
          </div>

          {/* Payment Info (only for Cobrado) */}
          {status === 'Cobrado' && (
            <>
              <div className='h-px bg-neutral-200' />
              <div className='flex flex-col gap-3'>
                <p className='text-title-sm text-neutral-900 font-semibold'>
                  Información de pago
                </p>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-body-sm text-neutral-500'>Método de pago</p>
                    <p className='text-body-md text-neutral-900'>{paymentMethod || '-'}</p>
                  </div>
                  <div>
                    <p className='text-body-sm text-neutral-500'>Fecha de pago</p>
                    <p className='text-body-md text-neutral-900'>{paymentDate || date}</p>
                  </div>
                  {paymentReference && (
                    <div>
                      <p className='text-body-sm text-neutral-500'>Referencia</p>
                      <p className='text-body-md text-neutral-900'>{paymentReference}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Related Budget */}
          {budgetId && (
            <>
              <div className='h-px bg-neutral-200' />
              <div className='flex flex-col gap-2'>
                <p className='text-body-sm text-neutral-500'>Presupuesto asociado</p>
                <p className='text-body-md text-neutral-900'>{budgetId}</p>
              </div>
            </>
          )}

          {/* Footer buttons */}
          <div className='flex justify-between items-center mt-4'>
            {/* Action buttons */}
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={onDownloadPdf}
                className='flex items-center gap-2 px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-body-md text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
              >
                <DownloadRounded className='size-5' />
                Descargar PDF
              </button>
              <button
                type='button'
                onClick={onSendEmail}
                className='flex items-center gap-2 px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-body-md text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
              >
                <AttachEmailRounded className='size-5' />
                Enviar por email
              </button>
            </div>

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
