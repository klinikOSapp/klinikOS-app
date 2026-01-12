'use client'

import { CloseRounded } from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type TraceabilityModalProps = {
  open: boolean
  onClose: () => void
  // Invoice data
  invoiceId: string
  treatment: string
  amount: string
  invoiceDate: string
  invoiceStatus: string
  paymentMethod: string
  insurer: string
  // Additional data (could come from related records)
  patientName?: string
  professional?: string
  budgetId?: string
  budgetDate?: string
  budgetStatus?: string
  productionId?: string
  productionDate?: string
  productionStatus?: string
  paymentDate?: string
}

export default function TraceabilityModal({
  open,
  onClose,
  invoiceId,
  treatment,
  amount,
  invoiceDate,
  invoiceStatus,
  paymentMethod,
  insurer,
  patientName = 'Pablo Cuesta González',
  professional = 'Dra. Andrea',
  budgetId,
  budgetDate,
  budgetStatus = 'Aceptado',
  productionId,
  productionDate,
  productionStatus = 'Facturado',
  paymentDate
}: TraceabilityModalProps) {
  if (!open) return null

  // Generate related IDs if not provided
  const displayBudgetId = budgetId || `PR-${invoiceId.replace('F-', '').padStart(3, '0')}`
  const displayProductionId = productionId || displayBudgetId
  const displayBudgetDate = budgetDate || invoiceDate
  const displayProductionDate = productionDate || invoiceDate
  const displayPaymentDate = paymentDate || (invoiceStatus === 'Cobrado' ? invoiceDate : '-')

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={onClose}
      />

      {/* Modal - 602px = 37.625rem */}
      <div className='relative bg-white rounded-lg w-[37.625rem] overflow-hidden'>
        {/* Header - 56px height */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            Trazabilidad del tratamiento
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
          {/* General Info Section */}
          <div className='flex flex-col gap-4'>
            {/* Row 1: Paciente | Tratamiento */}
            <div className='flex gap-8'>
              <div className='flex-1'>
                <p className='text-title-md text-neutral-900'>Paciente</p>
                <p className='text-body-md text-neutral-900'>{patientName}</p>
              </div>
              <div className='flex-1'>
                <p className='text-title-md text-neutral-900'>Tratamiento</p>
                <p className='text-body-md text-neutral-900'>{treatment}</p>
              </div>
            </div>

            {/* Row 2: Profesional */}
            <div>
              <p className='text-title-md text-neutral-900'>Profesional</p>
              <p className='text-body-md text-neutral-900'>{professional}</p>
            </div>

            {/* Row 3: Monto | Aseguradora */}
            <div className='flex gap-8'>
              <div className='flex-1'>
                <p className='text-title-md text-neutral-900'>Monto</p>
                <p className='text-body-md text-neutral-900'>{amount}</p>
              </div>
              <div className='flex-1'>
                <p className='text-title-md text-neutral-900'>Aseguradora</p>
                <p className='text-body-md text-neutral-900'>{insurer || '-'}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Presupuesto Section */}
          <div className='flex flex-col gap-2'>
            <p className='text-title-md text-neutral-900 font-semibold'>
              Presupuesto
            </p>
            <div className='flex gap-8'>
              <div className='flex-1'>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>ID:</span> {displayBudgetId}
                </p>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Estado:</span> {budgetStatus}
                </p>
              </div>
              <div className='flex-1'>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Fecha:</span> {displayBudgetDate}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Producción Section */}
          <div className='flex flex-col gap-2'>
            <p className='text-title-md text-neutral-900 font-semibold'>
              Producción
            </p>
            <div className='flex gap-8'>
              <div className='flex-1'>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>ID:</span> {displayProductionId}
                </p>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Estado:</span> {productionStatus}
                </p>
              </div>
              <div className='flex-1'>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Fecha producción:</span>{' '}
                  {displayProductionDate}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className='h-px bg-neutral-200' />

          {/* Factura Section */}
          <div className='flex flex-col gap-2'>
            <p className='text-title-md text-neutral-900 font-semibold'>
              Factura
            </p>
            <div className='flex gap-8'>
              <div className='flex-1'>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>ID:</span> {invoiceId}
                </p>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Método de pago:</span>{' '}
                  {paymentMethod || '-'}
                </p>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Estado:</span> {invoiceStatus}
                </p>
              </div>
              <div className='flex-1'>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Fecha factura:</span>{' '}
                  {invoiceDate}
                </p>
                <p className='text-body-md text-neutral-900'>
                  <span className='text-neutral-600'>Fecha cobro:</span>{' '}
                  {displayPaymentDate}
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className='flex justify-end mt-4'>
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
