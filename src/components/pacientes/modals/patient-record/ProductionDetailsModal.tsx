'use client'

import {
  CloseRounded,
  DescriptionRounded,
  ReceiptLongRounded
} from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type ProductionDetailsModalProps = {
  open: boolean
  onClose: () => void
  // Production data
  productionId: string
  description: string
  amount: string
  date: string
  status: 'Producido' | 'Pendiente' | 'Facturado'
  professional: string
  // Related data
  patientName?: string
  budgetId?: string
  invoiceId?: string
  notes?: string
  productionDate?: string
  // Callbacks for navigation
  onViewBudget?: () => void
  onViewInvoice?: () => void
}

export default function ProductionDetailsModal({
  open,
  onClose,
  productionId,
  description,
  amount,
  date,
  status,
  professional,
  patientName = 'Pablo Cuesta González',
  budgetId,
  invoiceId,
  notes,
  productionDate,
  onViewBudget,
  onViewInvoice
}: ProductionDetailsModalProps) {
  if (!open) return null

  // Status badge styles
  const getStatusStyles = () => {
    switch (status) {
      case 'Producido':
        return 'bg-success-100 text-success-700 border-success-300'
      case 'Pendiente':
        return 'bg-warning-100 text-warning-700 border-warning-300'
      case 'Facturado':
        return 'bg-brand-100 text-brand-700 border-brand-300'
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300'
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
      <div className='relative bg-white rounded-lg w-[40rem] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            Detalles de producción
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
          {/* ID and Status */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-body-sm text-neutral-500'>ID Producción</p>
              <p className='text-title-md text-neutral-900'>{productionId}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-body-sm border ${getStatusStyles()}`}
            >
              {status}
            </span>
          </div>

          {/* Treatment/Description */}
          <div>
            <p className='text-body-sm text-neutral-500'>Tratamiento</p>
            <p className='text-title-md text-neutral-900'>{description}</p>
          </div>

          {/* Amount and Professional */}
          <div className='flex gap-8'>
            <div className='flex-1'>
              <p className='text-body-sm text-neutral-500'>Importe</p>
              <p className='text-title-md text-neutral-900'>{amount}</p>
            </div>
            <div className='flex-1'>
              <p className='text-body-sm text-neutral-500'>Profesional</p>
              <p className='text-title-md text-neutral-900'>{professional}</p>
            </div>
          </div>

          {/* Dates */}
          <div className='flex gap-8'>
            <div className='flex-1'>
              <p className='text-body-sm text-neutral-500'>Fecha registro</p>
              <p className='text-body-md text-neutral-900'>{date}</p>
            </div>
            {productionDate && (
              <div className='flex-1'>
                <p className='text-body-sm text-neutral-500'>Fecha producción</p>
                <p className='text-body-md text-neutral-900'>{productionDate}</p>
              </div>
            )}
          </div>

          {/* Patient */}
          <div>
            <p className='text-body-sm text-neutral-500'>Paciente</p>
            <p className='text-body-md text-neutral-900'>{patientName}</p>
          </div>

          {/* Notes */}
          {notes && (
            <div>
              <p className='text-body-sm text-neutral-500'>Notas</p>
              <p className='text-body-md text-neutral-900'>{notes}</p>
            </div>
          )}

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Related Documents */}
          <div className='flex flex-col gap-3'>
            <p className='text-title-sm text-neutral-900'>Documentos relacionados</p>
            
            <div className='flex gap-3'>
              {/* Budget link */}
              {budgetId && (
                <button
                  type='button'
                  onClick={onViewBudget}
                  className='flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer'
                >
                  <DescriptionRounded className='size-5 text-brand-500' />
                  <span className='text-body-md text-neutral-900'>
                    Presupuesto {budgetId}
                  </span>
                </button>
              )}

              {/* Invoice link - only for Facturado status */}
              {status === 'Facturado' && invoiceId && (
                <button
                  type='button'
                  onClick={onViewInvoice}
                  className='flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer'
                >
                  <ReceiptLongRounded className='size-5 text-brand-500' />
                  <span className='text-body-md text-neutral-900'>
                    Factura {invoiceId}
                  </span>
                </button>
              )}

              {!budgetId && !(status === 'Facturado' && invoiceId) && (
                <p className='text-body-sm text-neutral-500 italic'>
                  No hay documentos relacionados
                </p>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className='flex justify-end mt-2'>
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
