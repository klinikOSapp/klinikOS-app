'use client'

import {
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  DeleteRounded,
  DescriptionRounded,
  DownloadRounded,
  EditRounded,
  EmailRounded,
  ReceiptLongRounded,
  CancelRounded
} from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'
import type { BudgetRow, BudgetStatusType } from './BudgetsPayments'

type BudgetDetailsModalProps = {
  open: boolean
  onClose: () => void
  budget: BudgetRow | null
  patientName?: string
  onStatusChange: (budgetId: string, newStatus: BudgetStatusType) => void
  onDuplicate: (budget: BudgetRow) => void
  onDelete: (budgetId: string) => void
  onDownloadPdf: (budget: BudgetRow) => void
  onSendEmail: (budget: BudgetRow) => void
  onCreateAppointments: (budget: BudgetRow) => void
  onEdit?: (budget: BudgetRow) => void
  onConvertToInvoice?: (budget: BudgetRow) => void
}

// Status badge component
function StatusBadge({ status }: { status: BudgetStatusType }) {
  const config = {
    Pendiente: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-300'
    },
    Aceptado: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-300'
    },
    Rechazado: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300'
    }
  }
  
  const { bg, text, border } = config[status]
  
  return (
    <span className={`px-3 py-1 rounded-full text-[0.75rem] font-medium ${bg} ${text} border ${border}`}>
      {status}
    </span>
  )
}

export default function BudgetDetailsModal({
  open,
  onClose,
  budget,
  patientName = 'Paciente',
  onStatusChange,
  onDuplicate,
  onDelete,
  onDownloadPdf,
  onSendEmail,
  onCreateAppointments,
  onEdit,
  onConvertToInvoice
}: BudgetDetailsModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Escape key handler
  React.useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open || !mounted || !budget) return null

  // Calculate financial summary
  const subtotal = budget.subtotal ?? 0
  const generalDiscountAmount = budget.generalDiscount
    ? budget.generalDiscount.type === 'percentage'
      ? subtotal * (budget.generalDiscount.value / 100)
      : budget.generalDiscount.value
    : 0
  const total = subtotal - generalDiscountAmount

  // Parse amount from string if subtotal not provided
  const displayTotal = budget.amount

  const content = (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Detalles del presupuesto'
          onClick={(e) => e.stopPropagation()}
          className='relative w-[min(50rem,90vw)] max-h-[85vh] bg-white rounded-xl overflow-hidden flex flex-col shadow-xl'
        >
          {/* Header */}
          <header className='flex items-start justify-between px-6 py-4 border-b border-[#E2E7EA] bg-[#FAFCFD]'>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-3'>
                <h2 className='text-[1.125rem] font-semibold text-[#24282C]'>
                  Presupuesto {budget.id}
                </h2>
                <StatusBadge status={budget.status} />
              </div>
              <p className='text-[0.9375rem] text-[#535C66]'>
                {budget.description}
              </p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='p-1 hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
              aria-label='Cerrar'
            >
              <CloseRounded className='w-5 h-5 text-[#535C66]' />
            </button>
          </header>

          {/* Content - Scrollable */}
          <div className='flex-1 overflow-y-auto p-6 space-y-6'>
            {/* Información General */}
            <section>
              <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                Información General
              </h3>
              <div className='bg-[#F8FAFB] border border-[#E2E7EA] rounded-lg p-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-[0.75rem] text-[#AEB8C2]'>Paciente</p>
                    <p className='text-[0.875rem] font-medium text-[#24282C]'>{patientName}</p>
                  </div>
                  <div>
                    <p className='text-[0.75rem] text-[#AEB8C2]'>Fecha de creación</p>
                    <p className='text-[0.875rem] font-medium text-[#24282C]'>{budget.date}</p>
                  </div>
                  <div>
                    <p className='text-[0.75rem] text-[#AEB8C2]'>Profesional</p>
                    <p className='text-[0.875rem] font-medium text-[#24282C]'>{budget.professional}</p>
                  </div>
                  <div>
                    <p className='text-[0.75rem] text-[#AEB8C2]'>Válido hasta</p>
                    <p className='text-[0.875rem] font-medium text-[#24282C]'>
                      {budget.validUntil || '30 días desde creación'}
                    </p>
                  </div>
                  {budget.insurer && (
                    <div>
                      <p className='text-[0.75rem] text-[#AEB8C2]'>Aseguradora</p>
                      <p className='text-[0.875rem] font-medium text-[#24282C]'>{budget.insurer}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Tratamientos Incluidos */}
            {budget.treatments && budget.treatments.length > 0 && (
              <section>
                <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                  Tratamientos Incluidos ({budget.treatments.length})
                </h3>
                <div className='border border-[#E2E7EA] rounded-lg overflow-hidden'>
                  <table className='w-full'>
                    <thead>
                      <tr className='bg-[#F8FAFB] border-b border-[#E2E7EA]'>
                        <th className='px-4 py-2 text-left text-[0.75rem] font-medium text-[#535C66]'>Pieza</th>
                        <th className='px-4 py-2 text-left text-[0.75rem] font-medium text-[#535C66]'>Tratamiento</th>
                        <th className='px-4 py-2 text-right text-[0.75rem] font-medium text-[#535C66]'>Precio</th>
                        <th className='px-4 py-2 text-right text-[0.75rem] font-medium text-[#535C66]'>Dto.</th>
                        <th className='px-4 py-2 text-right text-[0.75rem] font-medium text-[#535C66]'>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budget.treatments.map((treatment, idx) => (
                        <tr key={idx} className='border-b border-[#E2E7EA] last:border-b-0'>
                          <td className='px-4 py-3 text-[0.8125rem] text-[#24282C]'>
                            {treatment.pieza || '-'}
                          </td>
                          <td className='px-4 py-3 text-[0.8125rem] text-[#24282C]'>
                            {treatment.tratamiento}
                          </td>
                          <td className='px-4 py-3 text-[0.8125rem] text-[#535C66] text-right'>
                            {treatment.precio}
                          </td>
                          <td className='px-4 py-3 text-[0.8125rem] text-[#535C66] text-right'>
                            {treatment.descuento}
                          </td>
                          <td className='px-4 py-3 text-[0.8125rem] font-medium text-[#24282C] text-right'>
                            {treatment.importe}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Resumen Financiero */}
            <section>
              <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                Resumen Financiero
              </h3>
              <div className='bg-[#F8FAFB] border border-[#E2E7EA] rounded-lg p-4'>
                <div className='space-y-2'>
                  {budget.subtotal !== undefined && (
                    <div className='flex justify-between items-center'>
                      <span className='text-[0.8125rem] text-[#535C66]'>Subtotal tratamientos</span>
                      <span className='text-[0.875rem] text-[#24282C]'>
                        {subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                  )}
                  {budget.generalDiscount && budget.generalDiscount.value > 0 && (
                    <div className='flex justify-between items-center'>
                      <span className='text-[0.8125rem] text-[#535C66]'>
                        Descuento general ({budget.generalDiscount.type === 'percentage' 
                          ? `${budget.generalDiscount.value}%` 
                          : `${budget.generalDiscount.value} €`})
                      </span>
                      <span className='text-[0.875rem] text-[#22C55E]'>
                        -{generalDiscountAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                  )}
                  <div className='border-t border-[#E2E7EA] pt-2 mt-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-[0.9375rem] font-semibold text-[#24282C]'>TOTAL</span>
                      <span className='text-[1.125rem] font-bold text-[var(--color-brand-700)]'>
                        {budget.subtotal !== undefined 
                          ? `${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
                          : displayTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Historial */}
            {budget.history && budget.history.length > 0 && (
              <section>
                <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                  Historial
                </h3>
                <div className='bg-[#F8FAFB] border border-[#E2E7EA] rounded-lg p-4'>
                  <div className='space-y-3'>
                    {budget.history.map((entry, idx) => (
                      <div key={idx} className='flex items-start gap-3'>
                        <div className='w-2 h-2 rounded-full bg-[var(--color-brand-400)] mt-1.5 shrink-0' />
                        <div className='flex-1'>
                          <p className='text-[0.8125rem] text-[#24282C]'>{entry.action}</p>
                          <p className='text-[0.6875rem] text-[#AEB8C2]'>
                            {entry.date} {entry.user && `• ${entry.user}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Footer with actions */}
          <footer className='border-t border-[#E2E7EA] bg-[#FAFCFD] p-4'>
            {/* Secondary actions */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-2'>
                {budget.status === 'Pendiente' && onEdit && (
                  <button
                    type='button'
                    onClick={() => onEdit(budget)}
                    className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-[#535C66] hover:text-[#24282C] hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
                  >
                    <EditRounded className='w-4 h-4' />
                    Editar
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => onDuplicate(budget)}
                  className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-[#535C66] hover:text-[#24282C] hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
                >
                  <DescriptionRounded className='w-4 h-4' />
                  Duplicar
                </button>
                <button
                  type='button'
                  onClick={() => onDownloadPdf(budget)}
                  className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-[#535C66] hover:text-[#24282C] hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
                >
                  <DownloadRounded className='w-4 h-4' />
                  PDF
                </button>
                <button
                  type='button'
                  onClick={() => onSendEmail(budget)}
                  className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-[#535C66] hover:text-[#24282C] hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
                >
                  <EmailRounded className='w-4 h-4' />
                  Email
                </button>
                {budget.status === 'Aceptado' && (
                  <>
                    <button
                      type='button'
                      onClick={() => onCreateAppointments(budget)}
                      className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-[#535C66] hover:text-[#24282C] hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
                    >
                      <CalendarMonthRounded className='w-4 h-4' />
                      Crear citas
                    </button>
                    {onConvertToInvoice && (
                      <button
                        type='button'
                        onClick={() => onConvertToInvoice(budget)}
                        className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-[#535C66] hover:text-[#24282C] hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
                      >
                        <ReceiptLongRounded className='w-4 h-4' />
                        Facturar
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                type='button'
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
                    onDelete(budget.id)
                    onClose()
                  }
                }}
                className='flex items-center gap-1.5 px-3 py-1.5 text-[0.75rem] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
              >
                <DeleteRounded className='w-4 h-4' />
                Eliminar
              </button>
            </div>

            {/* Primary actions based on status */}
            <div className='flex items-center justify-end gap-3'>
              {budget.status === 'Pendiente' && (
                <>
                  <button
                    type='button'
                    onClick={() => {
                      onStatusChange(budget.id, 'Rechazado')
                      onClose()
                    }}
                    className='flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-full text-[0.875rem] font-medium transition-colors cursor-pointer'
                  >
                    <CancelRounded className='w-4 h-4' />
                    Rechazar
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      onStatusChange(budget.id, 'Aceptado')
                      onClose()
                    }}
                    className='flex items-center gap-2 px-5 py-2 bg-[#51D6C7] hover:bg-[#3ECBBB] text-[#1E4947] rounded-full text-[0.875rem] font-medium transition-colors cursor-pointer'
                  >
                    <CheckCircleRounded className='w-4 h-4' />
                    Aceptar presupuesto
                  </button>
                </>
              )}
              {budget.status === 'Rechazado' && (
                <button
                  type='button'
                  onClick={() => {
                    onStatusChange(budget.id, 'Pendiente')
                    onClose()
                  }}
                  className='flex items-center gap-2 px-5 py-2 bg-[#51D6C7] hover:bg-[#3ECBBB] text-[#1E4947] rounded-full text-[0.875rem] font-medium transition-colors cursor-pointer'
                >
                  <CheckCircleRounded className='w-4 h-4' />
                  Reabrir presupuesto
                </button>
              )}
              {budget.status === 'Aceptado' && (
                <button
                  type='button'
                  onClick={onClose}
                  className='px-5 py-2 bg-[#E2E7EA] hover:bg-[#CBD3D9] text-[#24282C] rounded-full text-[0.875rem] font-medium transition-colors cursor-pointer'
                >
                  Cerrar
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
