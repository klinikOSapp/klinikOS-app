'use client'

import {
  CheckCircleRounded,
  CloseRounded,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  TimelineRounded
} from '@/components/icons/md3'
import type {
  BudgetInstallment,
  BudgetPayment,
  PaymentMethod
} from '@/types/payments'
import {
  calculatePaymentSummary,
  formatInstallmentStatus,
  formatPaymentMethod,
  getInstallmentStatusColor
} from '@/types/payments'
import React from 'react'
import { createPortal } from 'react-dom'
import type { BudgetRow } from './BudgetsPayments'

type BudgetQuickPaymentModalProps = {
  open: boolean
  onClose: () => void
  onPaymentSubmit: (data: QuickPaymentFormData) => void
  patientName: string
  patientId: string
  budgets: BudgetRow[]
}

export type QuickPaymentFormData = {
  budgetId: string
  installmentIds: string[]
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
  notes?: string
  generateReceipt: boolean
  generateInvoice: boolean // Facturación flexible - el usuario decide cuándo facturar
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'financiacion', label: 'Financiación' }
]

export default function BudgetQuickPaymentModal({
  open,
  onClose,
  onPaymentSubmit,
  patientName,
  patientId,
  budgets
}: BudgetQuickPaymentModalProps) {
  // Filter budgets with installment plans and pending amounts
  const budgetsWithInstallments = React.useMemo(() => {
    return budgets.filter(
      (b) =>
        b.installmentPlan &&
        b.installmentPlan.installments.some(
          (i) => i.status === 'pending' || i.status === 'partial'
        )
    )
  }, [budgets])

  // State
  const [selectedBudgetId, setSelectedBudgetId] = React.useState<string | null>(
    null
  )
  const [selectedInstallments, setSelectedInstallments] = React.useState<
    Set<string>
  >(new Set())
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('tarjeta')
  const [reference, setReference] = React.useState<string>('')
  const [generateReceipt, setGenerateReceipt] = React.useState<boolean>(true)
  const [generateInvoice, setGenerateInvoice] = React.useState<boolean>(false)
  const [expandedHistories, setExpandedHistories] = React.useState<Set<string>>(
    new Set()
  )

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedBudgetId(budgetsWithInstallments[0]?.id ?? null)
      setSelectedInstallments(new Set())
      setPaymentMethod('tarjeta')
      setReference('')
      setGenerateReceipt(true)
      setGenerateInvoice(false)
      setExpandedHistories(new Set())
    }
  }, [open, budgetsWithInstallments])

  // Get selected budget
  const selectedBudget = React.useMemo(() => {
    return budgetsWithInstallments.find((b) => b.id === selectedBudgetId)
  }, [budgetsWithInstallments, selectedBudgetId])

  // Calculate total amount to pay
  const totalToPay = React.useMemo(() => {
    if (!selectedBudget?.installmentPlan) return 0
    let total = 0
    for (const instId of selectedInstallments) {
      const inst = selectedBudget.installmentPlan.installments.find(
        (i) => i.id === instId
      )
      if (inst) {
        total += inst.amount - inst.paidAmount
      }
    }
    return Math.round(total * 100) / 100
  }, [selectedBudget, selectedInstallments])

  // Toggle installment selection
  const toggleInstallment = (installmentId: string) => {
    const newSet = new Set(selectedInstallments)
    if (newSet.has(installmentId)) {
      newSet.delete(installmentId)
    } else {
      newSet.add(installmentId)
    }
    setSelectedInstallments(newSet)
  }

  // Select all pending installments
  const selectAllPending = () => {
    if (!selectedBudget?.installmentPlan) return
    const pendingIds = selectedBudget.installmentPlan.installments
      .filter((i) => i.status === 'pending' || i.status === 'partial')
      .map((i) => i.id)
    setSelectedInstallments(new Set(pendingIds))
  }

  // Toggle history expansion
  const toggleHistory = (budgetId: string) => {
    const newSet = new Set(expandedHistories)
    if (newSet.has(budgetId)) {
      newSet.delete(budgetId)
    } else {
      newSet.add(budgetId)
    }
    setExpandedHistories(newSet)
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedBudgetId || selectedInstallments.size === 0 || totalToPay <= 0)
      return

    onPaymentSubmit({
      budgetId: selectedBudgetId,
      installmentIds: Array.from(selectedInstallments),
      amount: totalToPay,
      paymentMethod,
      reference: reference || undefined,
      generateReceipt,
      generateInvoice
    })

    onClose()
  }

  // Render installment row
  const renderInstallment = (
    installment: BudgetInstallment,
    isSelectable: boolean
  ) => {
    const colors = getInstallmentStatusColor(installment.status)
    const isSelected = selectedInstallments.has(installment.id)
    const remainingAmount = installment.amount - installment.paidAmount

    return (
      <div
        key={installment.id}
        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
          isSelectable ? 'cursor-pointer hover:bg-neutral-50' : ''
        } ${isSelected ? 'bg-brand-50 ring-1 ring-brand-300' : ''}`}
        onClick={() => isSelectable && toggleInstallment(installment.id)}
      >
        {/* Checkbox/Status indicator */}
        {isSelectable ? (
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              isSelected
                ? 'bg-brand-500 border-brand-500'
                : 'border-neutral-300'
            }`}
          >
            {isSelected && (
              <CheckCircleRounded className='w-4 h-4 text-white' />
            )}
          </div>
        ) : (
          <div
            className='w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0'
            style={{ backgroundColor: colors.bg }}
          >
            <CheckCircleRounded
              className='w-3 h-3'
              style={{ color: colors.text }}
            />
          </div>
        )}

        {/* Installment info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between'>
            <span className='text-body-md font-medium text-neutral-900'>
              Cuota {installment.installmentNumber}
            </span>
            <span
              className='text-body-md font-semibold'
              style={{ color: installment.status === 'paid' ? colors.text : undefined }}
            >
              {remainingAmount.toLocaleString('es-ES', {
                minimumFractionDigits: 2
              })}{' '}
              €
            </span>
          </div>
          <div className='flex items-center justify-between mt-0.5'>
            <span
              className='text-body-sm px-2 py-0.5 rounded-full'
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {formatInstallmentStatus(installment.status)}
            </span>
            {installment.dueDate && (
              <span className='text-body-sm text-neutral-500'>
                Vence:{' '}
                {new Date(installment.dueDate).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short'
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render payment history
  const renderPaymentHistory = (payments: BudgetPayment[] | undefined) => {
    if (!payments || payments.length === 0) {
      return (
        <p className='text-body-sm text-neutral-400 italic py-2'>
          No hay pagos registrados
        </p>
      )
    }

    return (
      <div className='space-y-2'>
        {payments.map((payment) => (
          <div
            key={payment.id}
            className='flex items-center justify-between p-2 bg-neutral-50 rounded-lg'
          >
            <div className='flex items-center gap-2'>
              <ReceiptLongRounded className='w-4 h-4 text-neutral-400' />
              <div>
                <p className='text-body-sm text-neutral-700'>
                  {payment.amount.toLocaleString('es-ES', {
                    minimumFractionDigits: 2
                  })}{' '}
                  €
                </p>
                <p className='text-body-xs text-neutral-500'>
                  {formatPaymentMethod(payment.paymentMethod)} · Cuotas{' '}
                  {payment.installmentIds.length}
                </p>
              </div>
            </div>
            <span className='text-body-sm text-neutral-500'>
              {new Date(payment.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
              })}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (!open) return null

  const modalContent = (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div
        className='relative bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col'
        style={{
          width: 'min(48rem, 95vw)',
          height: 'min(42rem, 90vh)'
        }}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center'>
              <PaymentsRounded className='w-5 h-5 text-brand-700' />
            </div>
            <div>
              <h2 className='text-title-md text-neutral-900'>Cobrar cuotas</h2>
              <p className='text-body-sm text-neutral-500'>{patientName}</p>
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
        <div className='flex-1 overflow-hidden flex'>
          {/* Left Panel - Budgets List */}
          <div className='w-[45%] border-r border-neutral-200 overflow-y-auto p-4'>
            <p className='text-title-sm text-neutral-700 mb-3'>
              Presupuestos con cuotas pendientes
            </p>

            {budgetsWithInstallments.length === 0 ? (
              <div className='text-center py-8'>
                <PaymentsRounded className='w-12 h-12 text-neutral-300 mx-auto mb-3' />
                <p className='text-body-md text-neutral-500'>
                  No hay presupuestos con cuotas pendientes
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {budgetsWithInstallments.map((budget) => {
                  const summary = calculatePaymentSummary(
                    budget.installmentPlan,
                    budget.payments
                  )
                  const isSelected = budget.id === selectedBudgetId
                  const isHistoryExpanded = expandedHistories.has(budget.id)

                  return (
                    <div
                      key={budget.id}
                      className={`rounded-xl border-2 overflow-hidden transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Budget Header */}
                      <button
                        type='button'
                        onClick={() => {
                          setSelectedBudgetId(budget.id)
                          setSelectedInstallments(new Set())
                        }}
                        className='w-full p-4 text-left cursor-pointer'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1 min-w-0'>
                            <p className='text-title-sm text-neutral-900 truncate'>
                              {budget.description}
                            </p>
                            <p className='text-body-sm text-neutral-500 mt-0.5'>
                              {budget.treatments?.map((t) => t.tratamiento).join(', ')}
                            </p>
                          </div>
                          <div className='text-right ml-3'>
                            <p className='text-title-sm text-neutral-900'>
                              {summary?.totalAmount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2
                              })}{' '}
                              €
                            </p>
                            <p className='text-body-sm text-brand-600'>
                              {summary?.pendingInstallments} cuotas pend.
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {summary && (
                          <div className='mt-3'>
                            <div className='h-2 bg-neutral-200 rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-brand-500 rounded-full transition-all'
                                style={{
                                  width: `${(summary.paidAmount / summary.totalAmount) * 100}%`
                                }}
                              />
                            </div>
                            <div className='flex justify-between mt-1'>
                              <span className='text-body-xs text-neutral-500'>
                                Pagado:{' '}
                                {summary.paidAmount.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2
                                })}{' '}
                                €
                              </span>
                              <span className='text-body-xs text-neutral-500'>
                                Pendiente:{' '}
                                {summary.pendingAmount.toLocaleString('es-ES', {
                                  minimumFractionDigits: 2
                                })}{' '}
                                €
                              </span>
                            </div>
                          </div>
                        )}
                      </button>

                      {/* History Toggle */}
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleHistory(budget.id)
                        }}
                        className='w-full flex items-center justify-center gap-2 py-2 border-t border-neutral-200 text-body-sm text-neutral-500 hover:bg-neutral-50 cursor-pointer'
                      >
                        <TimelineRounded className='w-4 h-4' />
                        <span>Historial de pagos</span>
                        {isHistoryExpanded ? (
                          <KeyboardArrowUpRounded className='w-4 h-4' />
                        ) : (
                          <KeyboardArrowDownRounded className='w-4 h-4' />
                        )}
                      </button>

                      {/* Payment History */}
                      {isHistoryExpanded && (
                        <div className='px-4 pb-4 border-t border-neutral-100'>
                          {renderPaymentHistory(budget.payments)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Panel - Installments Selection */}
          <div className='w-[55%] flex flex-col overflow-hidden'>
            {selectedBudget ? (
              <>
                {/* Installments Header */}
                <div className='flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0'>
                  <p className='text-title-sm text-neutral-700'>
                    Selecciona cuotas a cobrar
                  </p>
                  <button
                    type='button'
                    onClick={selectAllPending}
                    className='text-body-sm text-brand-600 hover:text-brand-700 cursor-pointer'
                  >
                    Seleccionar todas
                  </button>
                </div>

                {/* Installments List */}
                <div className='flex-1 overflow-y-auto p-4'>
                  <div className='space-y-2'>
                    {selectedBudget.installmentPlan?.installments.map(
                      (installment) =>
                        renderInstallment(
                          installment,
                          installment.status !== 'paid'
                        )
                    )}
                  </div>
                </div>

                {/* Payment Form */}
                <div className='border-t border-neutral-200 p-4 bg-neutral-50 flex-shrink-0'>
                  {/* Selected Summary */}
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <p className='text-body-sm text-neutral-500'>
                        {selectedInstallments.size} cuota
                        {selectedInstallments.size !== 1 ? 's' : ''} seleccionada
                        {selectedInstallments.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-body-sm text-neutral-500'>Total a cobrar</p>
                      <p className='text-2xl font-semibold text-neutral-900'>
                        {totalToPay.toLocaleString('es-ES', {
                          minimumFractionDigits: 2
                        })}{' '}
                        €
                      </p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='text-body-sm text-neutral-600 mb-1 block'>
                        Método de pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as PaymentMethod)
                        }
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer'
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className='text-body-sm text-neutral-600 mb-1 block'>
                        Referencia (opcional)
                      </label>
                      <input
                        type='text'
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder='Nº transacción'
                        className='w-full px-3 py-2 border border-neutral-300 rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-brand-500'
                      />
                    </div>
                  </div>

                  {/* Generate Receipt Checkbox */}
                  <label className='flex items-center gap-2 mb-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={generateReceipt}
                      onChange={(e) => setGenerateReceipt(e.target.checked)}
                      className='w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500'
                    />
                    <span className='text-body-sm text-neutral-600'>
                      Generar recibo de pago
                    </span>
                  </label>

                  {/* Generate Invoice Checkbox - Facturación flexible */}
                  <label className='flex items-center gap-2 mb-4 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={generateInvoice}
                      onChange={(e) => setGenerateInvoice(e.target.checked)}
                      className='w-4 h-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500'
                    />
                    <span className='text-body-sm text-neutral-600'>
                      Generar factura
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type='button'
                    onClick={handleSubmit}
                    disabled={selectedInstallments.size === 0 || totalToPay <= 0}
                    className={`w-full py-3 rounded-xl text-title-sm transition-colors ${
                      selectedInstallments.size > 0 && totalToPay > 0
                        ? 'bg-brand-500 text-white hover:bg-brand-600 cursor-pointer'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    Cobrar{' '}
                    {totalToPay.toLocaleString('es-ES', {
                      minimumFractionDigits: 2
                    })}{' '}
                    €
                  </button>
                </div>
              </>
            ) : (
              <div className='flex-1 flex items-center justify-center'>
                <p className='text-body-md text-neutral-400'>
                  Selecciona un presupuesto
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
