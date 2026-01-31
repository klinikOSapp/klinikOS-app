'use client'

import React from 'react'
import { createPortal } from 'react-dom'

import {
  useCashClosing,
  type CashTransaction,
  type DaySummary
} from '@/context/CashClosingContext'
import {
  downloadCashClosingExcel,
  type CashClosingTransaction,
  type CashClosingSummary
} from '@/utils/exportUtils'

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

type PaymentMethodFilter = 'all' | 'efectivo' | 'tpv' | 'transferencia' | 'financiacion'

const PAYMENT_METHOD_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  efectivo: {
    label: 'Efectivo',
    color: 'text-success-700',
    bgColor: 'bg-success-50',
    icon: 'payments'
  },
  tpv: {
    label: 'TPV',
    color: 'text-brand-700',
    bgColor: 'bg-brand-50',
    icon: 'credit_card'
  },
  transferencia: {
    label: 'Transferencia',
    color: 'text-info-700',
    bgColor: 'bg-info-50',
    icon: 'account_balance'
  },
  financiacion: {
    label: 'Financiación',
    color: 'text-warning-700',
    bgColor: 'bg-warning-50',
    icon: 'schedule'
  },
  otros: {
    label: 'Otros',
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100',
    icon: 'more_horiz'
  }
}

const FILTER_OPTIONS: { id: PaymentMethodFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'tpv', label: 'TPV' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'financiacion', label: 'Financiación' }
]

type CashClosingModalProps = {
  open: boolean
  onClose: () => void
  initialDate?: string // ISO date string YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function CashClosingModal({
  open,
  onClose,
  initialDate
}: CashClosingModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [cashOutflow, setCashOutflow] = React.useState('')
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [methodFilter, setMethodFilter] = React.useState<PaymentMethodFilter>('all')
  const [showDatePicker, setShowDatePicker] = React.useState(false)

  const {
    getAvailableDates,
    getDaySummary,
    isDayClosed,
    closeDay,
    reopenDay
  } = useCashClosing()

  const availableDates = getAvailableDates()

  // Initialize selected date
  React.useEffect(() => {
    if (open) {
      const dateToSelect = initialDate ?? availableDates[0] ?? ''
      setSelectedDate(dateToSelect)
      setCashOutflow('')
      setIsConfirming(false)
      setSearchQuery('')
      setMethodFilter('all')
    }
  }, [open, initialDate, availableDates])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDatePicker) {
          setShowDatePicker(false)
        } else if (!isConfirming) {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open, isConfirming, showDatePicker])

  // Close date picker when clicking outside
  const datePickerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!showDatePicker) return

    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    // Use mousedown instead of click to fire before other handlers
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDatePicker])

  // Get summary for selected date
  const daySummary = React.useMemo(() => {
    if (!selectedDate) return null
    return getDaySummary(selectedDate)
  }, [selectedDate, getDaySummary])

  const dayIsClosed = selectedDate ? isDayClosed(selectedDate) : false

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    if (!daySummary) return []

    return daySummary.transactions.filter((t) => {
      // Method filter
      if (methodFilter !== 'all' && t.payment_method !== methodFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesPatient = t.patient_name.toLowerCase().includes(query)
        const matchesConcept = t.concept.toLowerCase().includes(query)
        if (!matchesPatient && !matchesConcept) {
          return false
        }
      }

      return true
    })
  }, [daySummary, methodFilter, searchQuery])

  // Calculate filtered totals
  const filteredTotals = React.useMemo(() => {
    let total = 0
    const byMethod = {
      efectivo: 0,
      tpv: 0,
      transferencia: 0,
      financiacion: 0,
      otros: 0
    }

    filteredTransactions.forEach((t) => {
      if (t.payment_status === 'cobrado') {
        total += t.amount
        byMethod[t.payment_method] += t.amount
      }
    })

    return { total, byMethod }
  }, [filteredTransactions])

  const handleConfirm = () => {
    if (!selectedDate || !daySummary) return

    if (dayIsClosed && !isConfirming) {
      // Show warning for reopening
      setIsConfirming(true)
      return
    }

    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    // Actually close or reopen
    if (dayIsClosed) {
      reopenDay(selectedDate)
    } else {
      const outflowValue = parseFloat(cashOutflow.replace(',', '.')) || 0
      closeDay(selectedDate, outflowValue)
    }

    onClose()
  }

  const handleCancel = () => {
    if (isConfirming) {
      setIsConfirming(false)
      return
    }
    onClose()
  }

  const handleExport = () => {
    if (!daySummary) return

    const transactions: CashClosingTransaction[] = filteredTransactions.map((t) => ({
      date: t.transaction_date,
      patientName: t.patient_name,
      concept: t.concept,
      amount: t.amount,
      paymentMethod: t.payment_method,
      paymentStatus: t.payment_status,
      productionStatus: t.production_status
    }))

    const summary: CashClosingSummary = {
      closingDate: selectedDate,
      initialCash: daySummary.initialCash,
      totalIncome: daySummary.totalIncome,
      totalExpenses: daySummary.totalExpenses,
      cashOutflow: parseFloat(cashOutflow.replace(',', '.')) || 0,
      finalBalance: daySummary.finalBalance,
      incomeByMethod: daySummary.incomeByMethod,
      transactionCount: filteredTransactions.length
    }

    downloadCashClosingExcel(transactions, summary)
  }

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (!open || !mounted) return null

  const content = (
    <div
      className='fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-[2px]'
      onClick={handleCancel}
      aria-hidden='true'
    >
      <div
        className='relative flex h-[min(55rem,90vh)] w-[min(75rem,95vw)] flex-col overflow-hidden rounded-2xl bg-neutral-0 shadow-elevation-popover'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='cash-close-title'
      >
        {/* Header */}
        <header className='flex h-[4rem] shrink-0 items-center justify-between border-b border-border bg-neutral-0 px-8'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-brand-100'>
              <span className='material-symbols-rounded text-[1.25rem] text-brand-600'>
                point_of_sale
              </span>
            </div>
            <div>
              <h2
                id='cash-close-title'
                className='text-title-md font-semibold text-fg'
              >
                Cierre de caja
              </h2>
              {selectedDate && (
                <p className='text-label-sm text-neutral-500'>
                  {formatDateLabel(selectedDate)}
                </p>
              )}
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {/* Date Selector */}
            <div className='relative' ref={datePickerRef}>
              <button
                type='button'
                onClick={() => setShowDatePicker(!showDatePicker)}
                className='flex items-center gap-2 rounded-lg border border-border bg-neutral-0 px-3 py-2 text-label-md text-fg transition-colors hover:bg-neutral-50'
              >
                <span className='material-symbols-rounded text-[1rem]'>
                  calendar_today
                </span>
                {selectedDate ? formatShortDate(selectedDate) : 'Seleccionar día'}
                <span className='material-symbols-rounded text-[1rem]'>
                  expand_more
                </span>
              </button>

              {showDatePicker && (
                <div className='absolute right-0 top-[calc(100%+0.5rem)] z-[100] max-h-[20rem] min-w-[14rem] overflow-y-auto rounded-xl border border-border bg-neutral-0 py-2 shadow-elevation-popover'>
                  {availableDates.map((date) => {
                    const isClosed = isDayClosed(date)
                    const isSelected = date === selectedDate
                    return (
                      <button
                        key={date}
                        type='button'
                        onClick={() => {
                          setSelectedDate(date)
                          setShowDatePicker(false)
                          setIsConfirming(false)
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-body-sm transition-colors hover:bg-neutral-50 ${
                          isSelected ? 'bg-brand-50' : ''
                        }`}
                      >
                        <span className={isSelected ? 'font-medium text-brand-700' : 'text-fg'}>
                          {formatShortDate(date)}
                        </span>
                        {isClosed && (
                          <span className='rounded-full bg-success-100 px-2 py-0.5 text-label-xs font-medium text-success-700'>
                            Cerrado
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {dayIsClosed && (
              <span className='flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1.5 text-label-sm font-medium text-success-700'>
                <span className='material-symbols-rounded text-[1rem]'>
                  check_circle
                </span>
                Cerrado
              </span>
            )}

            <button
              type='button'
              className='flex size-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700'
              onClick={handleCancel}
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-[1.25rem]'>
                close
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Left Panel - Summary */}
          <div className='flex w-[22rem] shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-neutral-50/50 p-6'>
            {daySummary ? (
              <>
                {/* Summary Cards */}
                <section>
                  <h3 className='mb-4 text-title-sm font-medium text-fg'>
                    Resumen del día
                  </h3>
                  <div className='flex flex-col gap-3'>
                    <SummaryCard
                      icon='account_balance_wallet'
                      iconColor='text-neutral-600'
                      iconBg='bg-neutral-100'
                      label='Caja inicial'
                      value={`${daySummary.initialCash.toFixed(2)} €`}
                    />
                    <SummaryCard
                      icon='trending_up'
                      iconColor='text-success-600'
                      iconBg='bg-success-50'
                      label='Ingresos del día'
                      value={`+${daySummary.totalIncome.toFixed(2)} €`}
                      valueColor='text-success-600'
                    />
                    <SummaryCard
                      icon='trending_down'
                      iconColor='text-error-600'
                      iconBg='bg-error-50'
                      label='Gastos del día'
                      value={`-${daySummary.totalExpenses.toFixed(2)} €`}
                      valueColor='text-error-600'
                    />
                    <div className='my-1 border-t border-dashed border-neutral-300' />
                    <SummaryCard
                      icon='savings'
                      iconColor='text-brand-600'
                      iconBg='bg-brand-100'
                      label='Balance final'
                      value={`${daySummary.finalBalance.toFixed(2)} €`}
                      valueColor='text-brand-600'
                      highlight
                    />
                  </div>
                </section>

                {/* By Payment Method */}
                <section>
                  <h3 className='mb-4 text-title-sm font-medium text-fg'>
                    Desglose por método
                  </h3>
                  <div className='flex flex-col gap-2'>
                    {Object.entries(daySummary.incomeByMethod).map(
                      ([method, amount]) => (
                        <div
                          key={method}
                          className='flex items-center justify-between rounded-lg bg-neutral-0 px-3 py-2.5 shadow-sm'
                        >
                          <div className='flex items-center gap-2'>
                            <span
                              className={`material-symbols-rounded text-[1rem] ${
                                PAYMENT_METHOD_CONFIG[method]?.color ||
                                'text-neutral-600'
                              }`}
                            >
                              {PAYMENT_METHOD_CONFIG[method]?.icon || 'payments'}
                            </span>
                            <span className='text-body-sm text-fg'>
                              {PAYMENT_METHOD_CONFIG[method]?.label || method}
                            </span>
                          </div>
                          <span className='text-body-sm font-medium text-fg'>
                            {amount.toFixed(2)} €
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* Cash Outflow Input */}
                {!dayIsClosed && (
                  <section>
                    <h3 className='mb-3 text-title-sm font-medium text-fg'>
                      Salida de caja
                    </h3>
                    <p className='mb-3 text-label-sm text-neutral-500'>
                      Indica el efectivo que retiras de caja al finalizar el día.
                    </p>
                    <div className='relative'>
                      <input
                        type='text'
                        value={cashOutflow}
                        onChange={(e) => setCashOutflow(e.target.value)}
                        placeholder='0,00'
                        className='h-12 w-full rounded-xl border border-border bg-neutral-0 pl-4 pr-10 text-body-md text-fg placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
                      />
                      <span className='absolute right-4 top-1/2 -translate-y-1/2 text-body-md text-neutral-500'>
                        €
                      </span>
                    </div>
                  </section>
                )}

                {/* Closed info */}
                {dayIsClosed && daySummary.closing && (
                  <section className='rounded-xl bg-success-50 p-4'>
                    <div className='flex items-center gap-2 text-success-700'>
                      <span className='material-symbols-rounded text-[1.25rem]'>
                        verified
                      </span>
                      <span className='text-title-sm font-medium'>
                        Día cerrado
                      </span>
                    </div>
                    <p className='mt-2 text-label-sm text-success-600'>
                      Salida de caja: {daySummary.closing.cash_outflow.toFixed(2)} €
                    </p>
                    <p className='text-label-sm text-success-600'>
                      Cerrado el{' '}
                      {new Date(daySummary.closing.created_at).toLocaleDateString(
                        'es-ES',
                        {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }
                      )}
                    </p>
                  </section>
                )}
              </>
            ) : (
              <div className='flex flex-1 items-center justify-center text-neutral-500'>
                Selecciona un día para ver el resumen
              </div>
            )}
          </div>

          {/* Right Panel - Transactions Table */}
          <div className='flex flex-1 flex-col overflow-hidden'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border bg-neutral-0 px-6 py-4'>
              <div>
                <h3 className='text-title-sm font-medium text-fg'>
                  Movimientos del día
                </h3>
                <p className='text-label-sm text-neutral-500'>
                  {filteredTransactions.length} transacciones
                  {methodFilter !== 'all' && ` (filtrado)`}
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                {/* Search */}
                <div className='flex items-center gap-2 rounded-lg border border-border bg-neutral-0 px-3 py-2'>
                  <span className='material-symbols-rounded text-[1rem] text-neutral-500'>
                    search
                  </span>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Buscar paciente...'
                    className='w-[10rem] bg-transparent text-body-sm text-fg placeholder:text-neutral-400 focus:outline-none'
                  />
                </div>

                {/* Filter Chips */}
                <FilterChips
                  activeFilter={methodFilter}
                  onFilterChange={setMethodFilter}
                />

                {/* Export Button */}
                <button
                  type='button'
                  onClick={handleExport}
                  disabled={!daySummary || filteredTransactions.length === 0}
                  className='flex items-center gap-1.5 rounded-lg border border-border bg-neutral-0 px-3 py-2 text-label-md text-fg transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <span className='material-symbols-rounded text-[1rem]'>
                    download
                  </span>
                  Exportar
                </button>
              </div>
            </div>

            {/* Table */}
            <div className='flex-1 overflow-auto'>
              <table className='w-full'>
                <thead className='sticky top-0 z-10 bg-neutral-50'>
                  <tr className='border-b border-border'>
                    <th className='px-6 py-3 text-left text-label-sm font-medium text-neutral-500'>
                      Paciente
                    </th>
                    <th className='px-4 py-3 text-left text-label-sm font-medium text-neutral-500'>
                      Concepto
                    </th>
                    <th className='px-4 py-3 text-right text-label-sm font-medium text-neutral-500'>
                      Importe
                    </th>
                    <th className='px-4 py-3 text-left text-label-sm font-medium text-neutral-500'>
                      Método
                    </th>
                    <th className='px-6 py-3 text-left text-label-sm font-medium text-neutral-500'>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border bg-neutral-0'>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className='px-6 py-12 text-center text-body-sm text-neutral-500'
                      >
                        {searchQuery || methodFilter !== 'all'
                          ? 'No hay transacciones que coincidan con los filtros'
                          : 'No hay transacciones para este día'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Total */}
            <div className='flex items-center justify-between border-t border-border bg-neutral-50 px-6 py-3'>
              <span className='text-body-sm text-neutral-500'>
                Total de {filteredTransactions.length} movimientos
              </span>
              <div className='flex items-center gap-2'>
                <span className='text-body-sm text-neutral-500'>
                  Total cobrado:
                </span>
                <span className='text-title-sm font-semibold text-brand-600'>
                  {filteredTotals.total.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className='flex h-[4.5rem] shrink-0 items-center justify-between border-t border-border bg-neutral-0 px-8'>
          <div className='flex items-center gap-2 text-label-sm text-neutral-500'>
            <span className='material-symbols-rounded text-[1rem]'>info</span>
            {isConfirming
              ? dayIsClosed
                ? 'Vas a reabrir el cierre de caja. Podrás volver a cerrarlo después.'
                : 'Confirma el cierre de caja. Esta acción se puede deshacer.'
              : 'Revisa los datos antes de confirmar el cierre.'}
          </div>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={handleCancel}
              className='h-10 rounded-xl border border-border bg-neutral-0 px-5 text-title-sm font-medium text-fg transition-colors hover:bg-neutral-50'
            >
              {isConfirming ? 'Volver' : 'Cancelar'}
            </button>
            <button
              type='button'
              onClick={handleConfirm}
              disabled={!selectedDate}
              className={`flex h-10 items-center gap-2 rounded-xl px-5 text-title-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                dayIsClosed
                  ? 'bg-warning-500 text-neutral-0 hover:bg-warning-600'
                  : isConfirming
                    ? 'bg-success-500 text-neutral-0 hover:bg-success-600'
                    : 'bg-brand-500 text-brand-900 hover:bg-brand-400'
              }`}
            >
              {dayIsClosed ? (
                <>
                  <span className='material-symbols-rounded text-[1.125rem]'>
                    lock_open
                  </span>
                  {isConfirming ? 'Confirmar reapertura' : 'Reabrir cierre'}
                </>
              ) : isConfirming ? (
                <>
                  <span className='material-symbols-rounded text-[1.125rem]'>
                    check_circle
                  </span>
                  Confirmar cierre
                </>
              ) : (
                <>
                  <span className='material-symbols-rounded text-[1.125rem]'>
                    lock
                  </span>
                  Cerrar caja
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

type SummaryCardProps = {
  icon: string
  iconColor: string
  iconBg: string
  label: string
  value: string
  valueColor?: string
  highlight?: boolean
}

function SummaryCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  valueColor = 'text-fg',
  highlight = false
}: SummaryCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 ${
        highlight
          ? 'bg-brand-50 ring-1 ring-brand-200'
          : 'bg-neutral-0 shadow-sm'
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <span className={`material-symbols-rounded text-[1.25rem] ${iconColor}`}>
          {icon}
        </span>
      </div>
      <div className='flex flex-1 flex-col'>
        <span className='text-label-sm text-neutral-500'>{label}</span>
        <span className={`text-title-sm font-semibold ${valueColor}`}>
          {value}
        </span>
      </div>
    </div>
  )
}

function FilterChips({
  activeFilter,
  onFilterChange
}: {
  activeFilter: PaymentMethodFilter
  onFilterChange: (filter: PaymentMethodFilter) => void
}) {
  return (
    <div className='flex items-center gap-1'>
      {FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.id
        return (
          <button
            key={option.id}
            type='button'
            onMouseDown={(e) => {
              e.preventDefault()
              onFilterChange(option.id)
            }}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-label-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-500 text-brand-900'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: CashTransaction }) {
  const config = PAYMENT_METHOD_CONFIG[transaction.payment_method] || {
    label: transaction.payment_method,
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100',
    icon: 'payments'
  }

  return (
    <tr className='transition-colors hover:bg-neutral-50/50'>
      <td className='px-6 py-3.5'>
        <span className='text-body-sm font-medium text-fg'>
          {transaction.patient_name}
        </span>
      </td>
      <td className='px-4 py-3.5 text-body-sm text-neutral-600'>
        {transaction.concept}
      </td>
      <td className='whitespace-nowrap px-4 py-3.5 text-right text-body-sm font-medium text-fg'>
        {transaction.amount.toFixed(2)} €
      </td>
      <td className='px-4 py-3.5'>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-medium ${config.bgColor} ${config.color}`}
        >
          <span className='material-symbols-rounded text-[0.875rem]'>
            {config.icon}
          </span>
          {config.label}
        </span>
      </td>
      <td className='px-6 py-3.5'>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-label-sm font-medium ${
            transaction.payment_status === 'cobrado'
              ? 'bg-success-100 text-success-700'
              : 'bg-warning-100 text-warning-700'
          }`}
        >
          {transaction.payment_status === 'cobrado' ? 'Cobrado' : 'Pendiente'}
        </span>
      </td>
    </tr>
  )
}
