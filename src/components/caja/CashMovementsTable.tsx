'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

type InvoiceStatus = 'Aceptado' | 'Enviado'
type ProductionState = 'Hecho' | 'Pendiente'
type PaymentCategory = 'Efectivo' | 'TPV' | 'Transferencia' | 'Financiación'
type CollectionStatus = 'Cobrado' | 'Por cobrar'

type CashMovement = {
  id: string // Unique identifier for React keys
  invoiceId: string
  day: string
  time: string
  patient: string
  concept: string
  amount: string
  status: InvoiceStatus
  collectionStatus: CollectionStatus
  outstandingAmount: number
  produced: ProductionState
  method: string
  insurer: string
  paymentCategory: PaymentCategory
  quoteId?: string | null
  productionStatus?: 'Done' | 'Pending' | null
  productionDate?: string | null
}

// MOVEMENTS removed - now fetched from API

const TABLE_WIDTH_REM = 101 // 1616px ÷ 16
const TABLE_HEIGHT_REM = 27.5 // 440px ÷ 16
const SEARCH_WIDTH_REM = 23 // 368px ÷ 16
const CONTROL_HEIGHT_REM = 2 // 32px ÷ 16

const COLUMN_WIDTHS_REM = {
  time: 5.4, // 86.4px (90% of 96px)
  patient: 17.875, // 286px
  concept: 25.75, // 412px
  amount: 10.375, // 166px
  status: 7.0625, // 113px
  produced: 10.5625, // 169px
  method: 12.5, // 200px
  insurer: 8.6875, // 139px
  actions: 3 // ~48px
} as const

type ColumnId =
  | 'time'
  | 'patient'
  | 'concept'
  | 'amount'
  | 'status'
  | 'produced'
  | 'method'
  | 'insurer'
  | 'actions'

type ColumnDefinition = {
  id: ColumnId
  label: string
  widthRem: number
  align?: 'left' | 'right'
  render: (movement: CashMovement) => React.ReactNode
}

const columns: ColumnDefinition[] = [
  {
    id: 'time',
    label: 'Día',
    widthRem: COLUMN_WIDTHS_REM.time,
    render: (movement) => {
      // Show DD/MM/YYYY (v2.0)
      const [y, m, d] = movement.day.split('-')
      return d && m && y ? `${d}/${m}/${y}` : movement.day
    }
  },
  {
    id: 'patient',
    label: 'Paciente',
    widthRem: COLUMN_WIDTHS_REM.patient,
    render: (movement) => movement.patient
  },
  {
    id: 'concept',
    label: 'Concepto',
    widthRem: COLUMN_WIDTHS_REM.concept,
    render: (movement) => movement.concept
  },
  {
    id: 'amount',
    label: 'Cantidad',
    widthRem: COLUMN_WIDTHS_REM.amount,
    render: (movement) => movement.amount
  },
  {
    id: 'status',
    label: 'Estado',
    widthRem: COLUMN_WIDTHS_REM.status,
    render: (movement) => <StatusCell movement={movement} />
  },
  {
    id: 'produced',
    label: 'Producido',
    widthRem: COLUMN_WIDTHS_REM.produced,
    render: (movement) => <ProductionBadge movement={movement} />
  },
  {
    id: 'method',
    label: 'Método',
    widthRem: COLUMN_WIDTHS_REM.method,
    render: (movement) => movement.method
  },
  {
    id: 'insurer',
    label: 'Aseguradora',
    widthRem: COLUMN_WIDTHS_REM.insurer,
    render: (movement) => movement.insurer
  },
  {
    id: 'actions',
    label: '',
    widthRem: COLUMN_WIDTHS_REM.actions,
    align: 'right',
    render: (movement) => <ActionsMenu movement={movement} />
  }
]

const totalColumns = columns.length

const getHeaderCellClasses = (index: number, align: 'left' | 'right' = 'left') => {
  const borders =
    index < totalColumns - 1 ? 'border-hairline-b border-hairline-r' : 'border-hairline-b'
  const textAlign = align === 'right' ? 'text-right' : 'text-left'
  return `${borders} py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)] ${textAlign}`
}

const getBodyCellClasses = (index: number, align: 'left' | 'right' = 'left') => {
  const borders =
    index < totalColumns - 1 ? 'border-hairline-b border-hairline-r' : 'border-hairline-b'
  const textAlign = align === 'right' ? 'text-right' : 'text-left'
  return `${borders} py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-body-md text-neutral-900 ${textAlign}`
}

const PAYMENT_FILTERS: PaymentCategory[] = [
  'Efectivo',
  'TPV',
  'Transferencia',
  'Financiación'
]

const COLLECTION_STATUS_FILTERS: CollectionStatus[] = ['Cobrado', 'Por cobrar']

type CashMovementsTableProps = {
  date: Date
  timeScale: 'day' | 'week' | 'month'
}

export default function CashMovementsTable({ date, timeScale }: CashMovementsTableProps) {
  const [query, setQuery] = useState('')
  const [patientSuggestions, setPatientSuggestions] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'' | PaymentCategory>('')
  const [paymentStatus, setPaymentStatus] = useState<'' | CollectionStatus>('')
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 50
    const raw = window.localStorage.getItem('caja.movements.pageSize')
    const v = Number(raw)
    return v === 20 || v === 50 || v === 100 ? v : 50
  })
  const lastHashRef = useRef<string>('')
  const [paymentsModal, setPaymentsModal] = useState<{
    open: boolean
    movement: CashMovement | null
    loading: boolean
    invoice?: {
      id: string
      invoiceNumber: string | null
      totalAmount: number
      amountPaid: number
      outstandingAmount: number
    }
    payments?: Array<{
      id: string
      amount: number
      transactionDate: string
      paymentMethod: string
    }>
  }>({ open: false, movement: null, loading: false })

  const formatMadridDate = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d)

  const computeRangeFromToolbar = (anchor: Date, scale: 'day' | 'week' | 'month') => {
    const dateStr = formatMadridDate(anchor) // YYYY-MM-DD (Madrid)
    const start = new Date(`${dateStr}T00:00:00Z`)
    const end = new Date(`${dateStr}T00:00:00Z`)

    if (scale === 'week') {
      const day = start.getUTCDay() // 0=Sun..6=Sat
      const diffToMonday = (day + 6) % 7
      start.setUTCDate(start.getUTCDate() - diffToMonday)
      end.setUTCDate(start.getUTCDate() + 6)
    } else if (scale === 'month') {
      start.setUTCDate(1)
      const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
      end.setUTCDate(lastDay.getUTCDate())
    }

    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    }
  }

  // Reset date-range when toolbar changes (v2 Phase 1 default behavior)
  useEffect(() => {
    const range = computeRangeFromToolbar(date, timeScale)
    setFromDate(range.from)
    setToDate(range.to)
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('caja.movements.pageSize', String(pageSize))
  }, [pageSize])

  // Patient autocomplete (v2 Phase 1): debounce 300ms
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setPatientSuggestions([])
      setIsSuggesting(false)
      return
    }

    const controller = new AbortController()
    setIsSuggesting(true)
    const t = window.setTimeout(() => {
      fetch(`/api/caja/patients-search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal
      })
        .then((res) => res.json())
        .then((data) => {
          if (controller.signal.aborted) return
          setPatientSuggestions(Array.isArray(data.patients) ? data.patients : [])
          setIsSuggesting(false)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          console.error('Error fetching patient suggestions:', err)
          setIsSuggesting(false)
        })
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(t)
    }
  }, [query])

  useEffect(() => {
    const handler = (e: any) => {
      const invoiceId = e?.detail?.invoiceId as string | undefined
      if (!invoiceId) return
      const movement = movements.find((m) => m.invoiceId === invoiceId) || null
      if (!movement) return
      openPaymentsModal(movement)
    }
    window.addEventListener('caja:open-invoice-payments', handler as EventListener)
    return () => window.removeEventListener('caja:open-invoice-payments', handler as EventListener)
  }, [movements])

  const hashMovements = (items: CashMovement[]) =>
    items
      .map((m) => `${m.id}|${m.day}|${m.collectionStatus}|${m.produced}|${m.method}|${m.amount}`)
      .join('||')

  const fetchMovements = (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent)
    if (!silent) setIsLoading(true)
    const params = new URLSearchParams()
    params.set('date', formatMadridDate(date))
    params.set('timeScale', timeScale)
    if (fromDate) params.set('from', fromDate)
    if (toDate) params.set('to', toDate)
    if (query.trim()) params.set('patient', query.trim())
    if (paymentMethod) params.set('paymentMethod', paymentMethod)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)

    fetch(`/api/caja/movements?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const next = Array.isArray(data.movements) ? (data.movements as CashMovement[]) : []
        const nextHash = hashMovements(next)
        if (nextHash !== lastHashRef.current) {
          lastHashRef.current = nextHash
          setMovements(next)
        }
        if (!silent) setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching movements:', error)
        if (!silent) setIsLoading(false)
      })
  }

  // Fetch movements from API
  useEffect(() => {
    setCurrentPage(1)
    fetchMovements({ silent: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus])

  // Real-time polling (simple + robust): refresh every 15s and on window focus
  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchMovements({ silent: true })
    }, 60000)

    const onFocus = () => fetchMovements({ silent: true })
    window.addEventListener('focus', onFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeScale, fromDate, toDate, paymentMethod, paymentStatus, query])

  useEffect(() => {
    const container = tableContainerRef.current
    if (!container || typeof window === 'undefined') return

    const updateScale = () => {
      const { width } = container.getBoundingClientRect()
      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const availableRem = width / rootFontSize
      const nextScale = Math.min(1, availableRem / TABLE_WIDTH_REM)

      setScaleFactor((prev) => (Math.abs(prev - nextScale) < 0.001 ? prev : nextScale))
    }

    updateScale()

    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const openPaymentsModal = async (movement: CashMovement) => {
    setPaymentsModal({ open: true, movement, loading: true })
    try {
      const res = await fetch(`/api/caja/invoice-payments?invoiceId=${movement.invoiceId}`)
      const data = await res.json()
      setPaymentsModal((prev) => ({
        ...prev,
        loading: false,
        invoice: data.invoice,
        payments: data.payments || []
      }))
    } catch (e) {
      console.error('Failed to fetch invoice payments', e)
      setPaymentsModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const filteredMovements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return movements.filter((movement) => {
      const matchesQuery = normalizedQuery
        ? [
            movement.patient,
            movement.concept,
            movement.method,
            movement.insurer,
            movement.time
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        : true

      const matchesMethod = paymentMethod ? movement.paymentCategory === paymentMethod : true
      const matchesPaymentStatus = paymentStatus
        ? movement.collectionStatus === paymentStatus
        : true

      return matchesQuery && matchesMethod && matchesPaymentStatus
    })
  }, [movements, query, paymentMethod, paymentStatus])

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredMovements.slice(start, start + pageSize)
  }, [filteredMovements, page, pageSize])

  return (
    <section
      className='flex h-full flex-col flex-1 overflow-hidden'
      style={{
        marginTop: 'min(0.4375rem, 0.6vh)',
        width: '100%'
      }}
    >
      <div className='flex flex-wrap items-center gap-gapsm'>
        <SearchInput
          value={query}
          onChange={setQuery}
          suggestions={patientSuggestions}
          loading={isSuggesting}
          onPickSuggestion={(name) => setQuery(name)}
        />
        <div className='flex flex-wrap items-center gap-gapsm'>
          <DateField label='Desde' value={fromDate} onChange={setFromDate} />
          <DateField label='Hasta' value={toDate} onChange={setToDate} />
        </div>
        <div className='ml-auto flex flex-wrap items-center gap-gapsm'>
          <SelectField
            label='Método'
            value={paymentMethod}
            options={[
              { value: '', label: 'Todos' },
              ...PAYMENT_FILTERS.map((v) => ({ value: v, label: v }))
            ]}
            onChange={(v) => setPaymentMethod(v as any)}
          />
          <SelectField
            label='Estado'
            value={paymentStatus}
            options={[
              { value: '', label: 'Todos' },
              ...COLLECTION_STATUS_FILTERS.map((v) => ({ value: v, label: v }))
            ]}
            onChange={(v) => setPaymentStatus(v as any)}
          />
          <SelectField
            label='Filas'
            value={String(pageSize)}
            options={[
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' }
            ]}
            onChange={(v) => setPageSize(Number(v))}
          />
        </div>
      </div>

      <div ref={tableContainerRef} className='mt-6 flex-1 overflow-hidden rounded-lg'>
        <div className='h-full overflow-y-auto overflow-x-hidden'>
          <table className='w-full table-fixed border-collapse text-left'>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.id}
                    className={getHeaderCellClasses(index, column.align)}
                    scope='col'
                    style={{ width: `${column.widthRem * scaleFactor}rem` }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={totalColumns} className='text-center py-8 text-neutral-500'>
                    Cargando movimientos...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className='text-center py-8 text-neutral-500'>
                    No hay movimientos para este período
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement) => (
                <tr key={movement.id}>
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.id}
                      className={getBodyCellClasses(colIndex, column.align)}
                      style={{ width: `${column.widthRem * scaleFactor}rem` }}
                    >
                      {column.render(movement)}
                    </td>
                  ))}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
        <PaginationIcon
          icon='first_page'
          ariaLabel='Primera página'
          disabled={page <= 1}
          onClick={() => setCurrentPage(1)}
        />
        <PaginationIcon
          icon='chevron_left'
          ariaLabel='Página anterior'
          disabled={page <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        />
        <span className='tabular-nums'>
          {page} / {totalPages}
        </span>
        <PaginationIcon
          icon='chevron_right'
          ariaLabel='Página siguiente'
          disabled={page >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        />
        <PaginationIcon
          icon='last_page'
          ariaLabel='Última página'
          disabled={page >= totalPages}
          onClick={() => setCurrentPage(totalPages)}
        />
      </div>

      {paymentsModal.open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'
          role='dialog'
          aria-modal='true'
        >
          <div className='w-[min(40rem,90vw)] rounded-lg bg-surface shadow-elevation-card p-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-title-sm font-medium text-fg'>
                Historial de cobros
              </h3>
              <button
                type='button'
                className='size-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100'
                onClick={() =>
                  setPaymentsModal({ open: false, movement: null, loading: false })
                }
                aria-label='Cerrar'
              >
                <span className='material-symbols-rounded text-[1.25rem]'>close</span>
              </button>
            </div>

            {paymentsModal.loading ? (
              <div className='py-6 text-neutral-600'>Cargando...</div>
            ) : (
              <>
                <div className='mt-4 grid grid-cols-3 gap-3 text-body-sm text-neutral-700'>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Total</div>
                    <div className='font-medium'>
                      {paymentsModal.invoice?.totalAmount?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Cobrado</div>
                    <div className='font-medium'>
                      {paymentsModal.invoice?.amountPaid?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                  <div className='rounded-md bg-neutral-50 p-3'>
                    <div className='text-neutral-500'>Pendiente</div>
                    <div className='font-medium'>
                      {paymentsModal.invoice?.outstandingAmount?.toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      €
                    </div>
                  </div>
                </div>

                <div className='mt-4 rounded-md border border-border overflow-hidden'>
                  <div className='grid grid-cols-3 bg-neutral-50 px-4 py-2 text-label-sm text-neutral-600'>
                    <div>Fecha</div>
                    <div>Método</div>
                    <div className='text-right'>Importe</div>
                  </div>
                  {(paymentsModal.payments || []).length === 0 ? (
                    <div className='px-4 py-4 text-neutral-600'>
                      No hay cobros registrados para esta factura.
                    </div>
                  ) : (
                    (paymentsModal.payments || []).map((p) => (
                      <div
                        key={p.id}
                        className='grid grid-cols-3 px-4 py-2 border-t border-border text-body-sm text-neutral-800'
                      >
                        <div>
                          {new Intl.DateTimeFormat('es-ES', {
                            timeZone: 'Europe/Madrid',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          }).format(new Date(p.transactionDate))}
                        </div>
                        <div>{p.paymentMethod}</div>
                        <div className='text-right'>
                          {Number(p.amount).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          €
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function SearchInput({
  value,
  onChange,
  suggestions,
  loading,
  onPickSuggestion
}: {
  value: string
  onChange: (value: string) => void
  suggestions?: Array<{ id: string; name: string }>
  loading?: boolean
  onPickSuggestion?: (name: string) => void
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <div className='relative' style={{ width: `min(${SEARCH_WIDTH_REM}rem, 100%)` }}>
      <form
        onSubmit={handleSubmit}
        className='flex items-center rounded-full border border-border bg-surface px-[0.75rem] text-neutral-600 focus-within:ring-2 focus-within:ring-brandSemantic'
        style={{
          width: '100%',
          height: `${CONTROL_HEIGHT_REM}rem`
        }}
      >
        <span className='material-symbols-rounded text-[1rem] text-neutral-500'>search</span>
        <input
          className='ml-[0.5rem] w-full bg-transparent text-body-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none'
          placeholder='Buscar paciente'
          aria-label='Buscar paciente'
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {loading ? (
          <span className='material-symbols-rounded ml-[0.25rem] text-[1rem] text-neutral-400'>
            progress_activity
          </span>
        ) : null}
      </form>

      {onPickSuggestion && (suggestions?.length || 0) > 0 && value.trim().length >= 2 && (
        <div className='absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[30] rounded-lg border border-border bg-neutral-0 shadow-elevation-popover'>
          <ul className='max-h-[14rem] overflow-auto py-[0.25rem]'>
            {suggestions!.map((p) => (
              <li key={p.id}>
                <button
                  type='button'
                  onClick={() => onPickSuggestion(p.name)}
                  className='flex w-full items-center px-[0.75rem] py-[0.5rem] text-left text-body-sm text-neutral-900 hover:bg-neutral-50'
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className='flex items-center gap-[0.5rem] text-label-sm text-neutral-600'>
      <span className='whitespace-nowrap'>{label}</span>
      <input
        type='date'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='h-full rounded-full border border-border bg-surface px-[0.75rem] text-body-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brandSemantic'
        style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className='flex items-center gap-[0.5rem] text-label-sm text-neutral-600'>
      <span className='whitespace-nowrap'>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='h-full rounded-full border border-border bg-surface px-[0.75rem] text-body-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brandSemantic'
        style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterChip({
  label,
  icon,
  active,
  onClick
}: {
  label: string
  icon?: string
  active?: boolean
  onClick: () => void
}) {
  const baseClass =
    'inline-flex items-center justify-center gap-[0.375rem] rounded-full border px-[0.75rem] text-label-sm font-medium transition-colors'

  const activeClass = 'border-brand-200 bg-brand-50 text-brand-900'
  const inactiveClass = 'border-border text-neutral-600 hover:bg-neutral-50'

  return (
    <button
      type='button'
      className={`${baseClass} ${active ? activeClass : inactiveClass}`}
      style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon && <span className='material-symbols-rounded text-[1rem]'>{icon}</span>}
      {label}
    </button>
  )
}

function StatusCell({ movement }: { movement: CashMovement }) {
  // Bubble click to table component via event delegation (keeps column API simple)
  const handleClick = () => {
    // v2.0: interaction is only required for "Por cobrar"
    if (movement.collectionStatus !== 'Por cobrar') return
    window.dispatchEvent(
      new CustomEvent('caja:open-invoice-payments', {
        detail: { invoiceId: movement.invoiceId }
      })
    )
  }
  return (
    <button
      type='button'
      onClick={handleClick}
      className='text-left'
      aria-label='Ver historial de cobros'
    >
      <EstadoPill collectionStatus={movement.collectionStatus} />
    </button>
  )
}

function EstadoPill({ collectionStatus }: { collectionStatus: CollectionStatus }) {
  // v2.0: ESTADO column is ONLY payment status (Cobrado / Por cobrar)
  const textClass =
    collectionStatus === 'Cobrado' ? 'text-success-800' : 'text-warning-200'
  const borderClass =
    collectionStatus === 'Cobrado' ? 'border-success-800' : 'border-warning-200'
  const bgClass = collectionStatus === 'Cobrado' ? 'bg-success-50' : 'bg-warning-50'

  return (
    <span
      className={`inline-flex h-[1.75rem] items-center justify-center rounded-full border px-[0.75rem] text-label-sm font-medium ${bgClass} ${borderClass}`}
    >
      <span className={textClass}>{collectionStatus}</span>
    </span>
  )
}

function ProductionBadge({ movement }: { movement: CashMovement }) {
  const isDone = movement.produced === 'Hecho'
  const badgeClass = isDone
    ? 'bg-success-200 text-success-800'
    : 'bg-neutral-200 text-neutral-700'
  const icon = isDone ? 'check_box' : 'check_box_outline_blank'

  const toggle = async () => {
    if (!movement.quoteId) return
    const nextStatus = isDone ? 'Pending' : 'Done'
    try {
      await fetch('/api/caja/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: movement.quoteId,
          productionStatus: nextStatus
        })
      })
    } catch (e) {
      console.error('Failed to update production status', e)
    }
  }

  return (
    <button
      type='button'
      onClick={toggle}
      disabled={!movement.quoteId}
      className='flex items-center gap-[0.25rem] disabled:opacity-50 disabled:cursor-not-allowed'
      aria-label='Cambiar estado de producción'
    >
      <span
        className={`material-symbols-rounded text-[1.25rem] ${
          isDone ? 'text-success-800' : 'text-neutral-500'
        }`}
      >
        {icon}
      </span>
      <span
        className={`inline-flex h-[1.75rem] items-center rounded-full px-[0.75rem] text-label-sm font-medium ${badgeClass}`}
      >
        {isDone ? 'Hecho' : 'Pendiente'}
      </span>
    </button>
  )
}

function ActionsMenu({ movement }: { movement: CashMovement }) {
  return (
    <button
      type='button'
      aria-label='Acciones'
      className='size-8 inline-flex items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
      onClick={() => {
        // Placeholder: wired later to open invoice / patient actions menu
        console.log('Actions for', movement.id)
      }}
    >
      <span className='material-symbols-rounded text-[1.25rem] leading-5'>more_vert</span>
    </button>
  )
}

function PaginationIcon({
  icon,
  ariaLabel,
  disabled,
  onClick
}: {
  icon: string
  ariaLabel: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      aria-label={ariaLabel}
      className='size-6 inline-flex items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed'
      disabled={disabled}
      onClick={onClick}
    >
      <span className='material-symbols-rounded text-[1rem]'>{icon}</span>
    </button>
  )
}




