'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

type InvoiceStatus = 'Aceptado' | 'Enviado'
type ProductionState = 'Hecho' | 'Pendiente'
type PaymentCategory = 'Efectivo' | 'TPV' | 'Financiación'

type CashMovement = {
  id: string // Unique identifier for React keys
  time: string
  patient: string
  concept: string
  amount: string
  status: InvoiceStatus
  produced: ProductionState
  method: string
  insurer: string
  paymentCategory: PaymentCategory
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
  insurer: 8.6875 // 139px
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
    label: 'Hora',
    widthRem: COLUMN_WIDTHS_REM.time,
    render: (movement) => movement.time
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
    render: (movement) => <StatusBadge status={movement.status} />
  },
  {
    id: 'produced',
    label: 'Producido',
    widthRem: COLUMN_WIDTHS_REM.produced,
    render: (movement) => <ProductionBadge state={movement.produced} />
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
  'Financiación'
]

type CashMovementsTableProps = {
  date: Date
  timeScale: 'day' | 'week' | 'month'
}

export default function CashMovementsTable({ date, timeScale }: CashMovementsTableProps) {
  const [query, setQuery] = useState('')
  const [activePaymentFilters, setActivePaymentFilters] = useState<
    PaymentCategory[]
  >([])
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch movements from API
  useEffect(() => {
    setIsLoading(true)
    const dateStr = date.toISOString().split('T')[0]
    fetch(`/api/caja/movements?date=${dateStr}&timeScale=${timeScale}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.movements) {
          setMovements(data.movements)
        }
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching movements:', error)
        setIsLoading(false)
      })
  }, [date, timeScale])

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

  const toggleFilter = (filter: PaymentCategory) => {
    setActivePaymentFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((item) => item !== filter)
        : [...prev, filter]
    )
  }

  const clearFilters = () => setActivePaymentFilters([])

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

      const matchesFilter =
        activePaymentFilters.length === 0
          ? true
          : activePaymentFilters.includes(movement.paymentCategory)

      return matchesQuery && matchesFilter
    })
  }, [movements, query, activePaymentFilters])

  return (
    <section
      className='flex h-full flex-col flex-1 overflow-hidden'
      style={{
        marginTop: 'min(0.4375rem, 0.6vh)',
        width: '100%'
      }}
    >
      <div className='flex flex-wrap items-center gap-gapsm'>
        <SearchInput value={query} onChange={setQuery} />
        <div className='ml-auto flex flex-wrap items-center gap-gapsm'>
          <FilterChip
            label='Todos'
            icon='filter_alt'
            active={activePaymentFilters.length === 0}
            onClick={clearFilters}
          />
          {PAYMENT_FILTERS.map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              active={activePaymentFilters.includes(filter)}
              onClick={() => toggleFilter(filter)}
            />
          ))}
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
                filteredMovements.map((movement) => (
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
        <PaginationIcon icon='first_page' ariaLabel='Primera página' />
        <PaginationIcon icon='chevron_left' ariaLabel='Página anterior' />
        <span className='font-bold underline'>1</span>
        <span>2</span>
        <span>…</span>
        <span>12</span>
        <PaginationIcon icon='chevron_right' ariaLabel='Página siguiente' />
        <PaginationIcon icon='last_page' ariaLabel='Última página' />
      </div>
    </section>
  )
}

function SearchInput({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex items-center rounded-full border border-border bg-surface px-[0.75rem] text-neutral-600 focus-within:ring-2 focus-within:ring-brandSemantic'
      style={{
        width: `min(${SEARCH_WIDTH_REM}rem, 100%)`,
        height: `${CONTROL_HEIGHT_REM}rem`
      }}
    >
      <span className='material-symbols-rounded text-[1rem] text-neutral-500'>search</span>
      <input
        className='ml-[0.5rem] w-full bg-transparent text-body-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none'
        placeholder='Buscar'
        aria-label='Buscar en caja diaria'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </form>
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

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const isAccepted = status === 'Aceptado'
  const className = isAccepted
    ? 'bg-brand-50 text-brand-900'
    : 'bg-warning-50 text-warning-200'

  return (
    <span
      className={`inline-flex h-[2rem] items-center justify-center rounded-full px-[0.75rem] text-label-sm font-medium ${className}`}
    >
      {status}
    </span>
  )
}

function ProductionBadge({ state }: { state: ProductionState }) {
  const isDone = state === 'Hecho'
  const badgeClass = isDone
    ? 'bg-success-200 text-success-800'
    : 'bg-neutral-200 text-neutral-700'
  const icon = isDone ? 'check_box' : 'check_box_outline_blank'

  return (
    <div className='flex items-center gap-[0.25rem]'>
      <span className='material-symbols-rounded text-[1.25rem] text-neutral-500'>
        {icon}
      </span>
      <span
        className={`inline-flex h-[2rem] items-center rounded-full px-[0.75rem] text-label-sm font-medium ${badgeClass}`}
      >
        {state}
      </span>
    </div>
  )
}

function PaginationIcon({ icon, ariaLabel }: { icon: string; ariaLabel: string }) {
  return (
    <button
      type='button'
      aria-label={ariaLabel}
      className='size-6 inline-flex items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
    >
      <span className='material-symbols-rounded text-[1rem]'>{icon}</span>
    </button>
  )
}


