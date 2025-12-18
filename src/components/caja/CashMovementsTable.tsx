'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MD3Icon } from '@/components/icons/MD3Icon'

type InvoiceStatus = 'Cobrado' | 'Por cobrar'
type ProductionState = 'Hecho' | 'Pendiente'
type PaymentCategory = 'Efectivo' | 'TPV' | 'Financiación'

type CashMovement = {
  date: string // ISO date YYYY-MM-DD (para filtros)
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
  align?: 'left' | 'right' | 'center'
  headerClassName?: string
  cellClassName?: string
  cellStyle?: CSSProperties
  render: (movement: CashMovement) => ReactNode
}

type CashMovementsTableProps = {
  onViewPatient?: (movement: CashMovement) => void
}

const MOVEMENTS: CashMovement[] = [
  {
    date: '2024-12-15',
    time: '15 Dic. 2024',
    patient: 'Carlos Martínez Pérez',
    concept: 'Operación mandíbula',
    amount: '2.300 €',
    status: 'Cobrado',
    produced: 'Hecho',
    method: 'Financiado',
    insurer: 'Adeslas',
    paymentCategory: 'Financiación'
  },
  {
    date: '2024-12-15',
    time: '15 Dic. 2024',
    patient: 'Nacho Nieto Iniesta',
    concept: 'Consulta inicial',
    amount: '150 €',
    status: 'Cobrado',
    produced: 'Hecho',
    method: 'TPV',
    insurer: 'Sanitas',
    paymentCategory: 'TPV'
  },
  {
    date: '2024-12-16',
    time: '16 Dic. 2024',
    patient: 'Sofía Rodríguez López',
    concept: 'Radiografía',
    amount: '100 €',
    status: 'Por cobrar',
    produced: 'Pendiente',
    method: 'Efectivo',
    insurer: 'DKV',
    paymentCategory: 'Efectivo'
  },
  {
    date: '2024-12-16',
    time: '16 Dic. 2024',
    patient: 'Elena García Santos',
    concept: 'Extracción de muela',
    amount: '500 €',
    status: 'Cobrado',
    produced: 'Pendiente',
    method: 'Tarjeta de crédito',
    insurer: 'DKV',
    paymentCategory: 'TPV'
  },
  {
    date: '2024-12-17',
    time: '17 Dic. 2024',
    patient: 'Javier Fernández Torres',
    concept: 'Implante dental',
    amount: '1.200 €',
    status: 'Cobrado',
    produced: 'Hecho',
    method: 'Transferencia bancaria',
    insurer: 'Adelas',
    paymentCategory: 'Financiación'
  },
  {
    date: '2024-12-17',
    time: '17 Dic. 2024',
    patient: 'Lucía Pérez Gómez',
    concept: 'Férula de descarga',
    amount: '300 €',
    status: 'Por cobrar',
    produced: 'Pendiente',
    method: 'Billetera digital',
    insurer: 'Sanitas',
    paymentCategory: 'TPV'
  },
  {
    date: '2024-12-18',
    time: '18 Dic. 2024',
    patient: 'Andrés Jiménez Ortega',
    concept: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    status: 'Cobrado',
    produced: 'Pendiente',
    method: 'Criptomonedas',
    insurer: 'DKV',
    paymentCategory: 'TPV'
  },
  {
    date: '2024-12-18',
    time: '18 Dic. 2024',
    patient: 'María del Mar Ruiz',
    concept: 'Consulta de seguimiento',
    amount: '100 €',
    status: 'Por cobrar',
    produced: 'Pendiente',
    method: 'Cheque',
    insurer: 'Sanitas',
    paymentCategory: 'Efectivo'
  },
  {
    date: '2024-12-19',
    time: '19 Dic. 2024',
    patient: 'Pablo Sánchez Delgado',
    concept: 'Blanqueamiento dental',
    amount: '400 €',
    status: 'Por cobrar',
    produced: 'Pendiente',
    method: 'Pago a plazos',
    insurer: 'Sanitas',
    paymentCategory: 'Financiación'
  }
]

const TABLE_WIDTH_REM = 101 // 1616px ÷ 16
const TABLE_HEIGHT_REM = 27.5 // 440px ÷ 16
const SEARCH_WIDTH_REM = 23 // 368px ÷ 16
const CONTROL_HEIGHT_REM = 2 // 32px ÷ 16

const getHeaderCellClasses = (
  index: number,
  totalColumns: number,
  align: 'left' | 'right' | 'center' = 'left'
) => {
  const borders =
    index < totalColumns - 1
      ? 'border-hairline-b border-hairline-r'
      : 'border-hairline-b'
  const textAlign =
    align === 'right'
      ? 'text-right'
      : align === 'center'
      ? 'text-center'
      : 'text-left'
  return `${borders} py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)] ${textAlign}`
}

const getBodyCellClasses = (
  index: number,
  totalColumns: number,
  align: 'left' | 'right' | 'center' = 'left'
) => {
  const borders =
    index < totalColumns - 1
      ? 'border-hairline-b border-hairline-r'
      : 'border-hairline-b'
  const textAlign =
    align === 'right'
      ? 'text-right'
      : align === 'center'
      ? 'text-center'
      : 'text-left'
  return `${borders} py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-body-md text-neutral-900 ${textAlign}`
}

const PAYMENT_FILTERS: PaymentCategory[] = ['Efectivo', 'TPV', 'Financiación']

const parseDDMMYYYY = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return null
  const [_, dd, mm, yyyy] = match
  const iso = `${yyyy}-${mm}-${dd}T00:00:00`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''
  if (digits.length <= 2)
    return `${digits.slice(0, 2)}${digits.length === 2 ? '/' : ''}`
  if (digits.length <= 4) {
    const dd = digits.slice(0, 2)
    const mm = digits.slice(2, 4)
    const suffix = digits.length === 4 ? '/' : ''
    return `${dd}/${mm}${suffix}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export default function CashMovementsTable({
  onViewPatient
}: CashMovementsTableProps) {
  const [query, setQuery] = useState('')
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')
  const [activePaymentFilters, setActivePaymentFilters] = useState<
    PaymentCategory[]
  >([])
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null)
  const [openProducedMenu, setOpenProducedMenu] = useState<string | null>(null)
  const [openMethodMenu, setOpenMethodMenu] = useState<string | null>(null)
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null)
  const [rowStatuses, setRowStatuses] = useState<Record<string, InvoiceStatus>>(
    () => {
      const map: Record<string, InvoiceStatus> = {}
      MOVEMENTS.forEach((movement) => {
        const id = `${movement.time}-${movement.patient}`
        map[id] = movement.status
      })
      return map
    }
  )
  const [rowProduced, setRowProduced] = useState<
    Record<string, ProductionState>
  >(() => {
    const map: Record<string, ProductionState> = {}
    MOVEMENTS.forEach((movement) => {
      const id = `${movement.time}-${movement.patient}`
      map[id] = movement.produced
    })
    return map
  })
  const [rowMethods, setRowMethods] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    MOVEMENTS.forEach((movement) => {
      const id = `${movement.time}-${movement.patient}`
      map[id] = movement.method
    })
    return map
  })

  useEffect(() => {
    const container = tableContainerRef.current
    if (!container || typeof window === 'undefined') return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.closest('[data-status-dropdown]') ||
        target?.closest('[data-produced-dropdown]') ||
        target?.closest('[data-method-dropdown]') ||
        target?.closest('[data-actions-dropdown]')
      )
        return
      setOpenStatusMenu(null)
      setOpenProducedMenu(null)
      setOpenMethodMenu(null)
      setOpenActionsMenu(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)

    const updateScale = () => {
      const { width } = container.getBoundingClientRect()
      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const availableRem = width / rootFontSize
      const nextScale = Math.min(1, availableRem / TABLE_WIDTH_REM)

      setScaleFactor((prev) =>
        Math.abs(prev - nextScale) < 0.001 ? prev : nextScale
      )
    }

    updateScale()

    const resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      document.removeEventListener('mousedown', handleOutsideClick)
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

  const methodOptions = useMemo(() => {
    const blacklist = new Set([
      'Tarjeta de crédito',
      'Billetera digital',
      'Criptomonedas',
      'Cheque'
    ])
    return Array.from(new Set(MOVEMENTS.map((m) => m.method))).filter(
      (method) => !blacklist.has(method)
    )
  }, [])

  const columns: ColumnDefinition[] = useMemo(() => {
    const COLUMN_WIDTHS_REM = {
      time: 7, // 112px (Figma)
      patient: 17.875, // 286px (Figma)
      concept: 25.75, // 412px
      amount: 9, // 144px (reduce to evitar wrap en Día)
      status: 7.0625, // 113px
      produced: 10.5625, // 169px
      method: 12.5, // 200px
      insurer: 8.6875, // 139px
      actions: 1.5 // 24px
    } as const

    return [
      {
        id: 'time',
        label: 'Día',
        widthRem: COLUMN_WIDTHS_REM.time,
        render: (movement) => (
          <span className='whitespace-nowrap'>{movement.time}</span>
        )
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
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentStatus = rowStatuses[id] ?? movement.status
          return (
            <StatusBadge
              id={id}
              status={currentStatus}
              isOpen={openStatusMenu === id}
              onToggle={() =>
                setOpenStatusMenu((prev) => (prev === id ? null : id))
              }
              onSelect={(nextStatus) => {
                setRowStatuses((prev) => ({ ...prev, [id]: nextStatus }))
                setOpenStatusMenu(null)
              }}
            />
          )
        }
      },
      {
        id: 'produced',
        label: 'Producido',
        widthRem: COLUMN_WIDTHS_REM.produced,
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentProduced = rowProduced[id] ?? movement.produced
          return (
            <ProductionBadge
              id={id}
              state={currentProduced}
              isOpen={openProducedMenu === id}
              onToggle={() =>
                setOpenProducedMenu((prev) => (prev === id ? null : id))
              }
              onSelect={(nextState) => {
                setRowProduced((prev) => ({ ...prev, [id]: nextState }))
                setOpenProducedMenu(null)
              }}
            />
          )
        }
      },
      {
        id: 'method',
        label: 'Método',
        widthRem: COLUMN_WIDTHS_REM.method,
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentMethod = rowMethods[id] ?? movement.method
          return (
            <PaymentMethodBadge
              id={id}
              method={currentMethod}
              options={methodOptions}
              isOpen={openMethodMenu === id}
              onToggle={() =>
                setOpenMethodMenu((prev) => (prev === id ? null : id))
              }
              onSelect={(nextMethod) => {
                setRowMethods((prev) => ({ ...prev, [id]: nextMethod }))
                setOpenMethodMenu(null)
              }}
            />
          )
        }
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
        align: 'center',
        cellClassName: 'px-0',
        cellStyle: { paddingLeft: 0, paddingRight: 0 },
        render: (movement) => (
          <RowActionsButton
            ariaLabel={`Acciones para ${movement.patient}`}
            iconColor='var(--color-neutral-900)'
            isOpen={openActionsMenu === `${movement.time}-${movement.patient}`}
            onToggle={() => {
              const id = `${movement.time}-${movement.patient}`
              setOpenActionsMenu((prev) => (prev === id ? null : id))
            }}
            onViewPatient={() => {
              onViewPatient?.(movement)
              setOpenActionsMenu(null)
            }}
          />
        )
      }
    ]
  }, [
    openStatusMenu,
    openProducedMenu,
    openMethodMenu,
    openActionsMenu,
    rowStatuses,
    rowProduced,
    rowMethods,
    methodOptions,
    onViewPatient
  ])

  const filteredMovements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const fromDate = parseDDMMYYYY(fromDateInput)
    const toDate = parseDDMMYYYY(toDateInput)

    return MOVEMENTS.filter((movement) => {
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

      const movementDate = new Date(`${movement.date}T00:00:00`)
      const matchesFrom = fromDate ? movementDate >= fromDate : true
      const matchesTo = toDate ? movementDate <= toDate : true

      return matchesQuery && matchesFilter && matchesFrom && matchesTo
    })
  }, [query, activePaymentFilters, fromDateInput, toDateInput])
  const totalColumns = columns.length
  return (
    <section
      className='flex h-full flex-col flex-1 overflow-hidden'
      style={{
        marginTop: 'min(0.4375rem, 0.6vh)',
        width: '100%'
      }}
    >
      <div className='flex flex-wrap items-end gap-gapsm'>
        <SearchInput value={query} onChange={setQuery} />
        <DateRangeFilter
          fromValue={fromDateInput}
          toValue={toDateInput}
          onFromChange={setFromDateInput}
          onToChange={setToDateInput}
        />
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

      <div
        ref={tableContainerRef}
        className='mt-6 flex-1 overflow-hidden rounded-lg'
      >
        <div className='h-full overflow-y-auto overflow-x-hidden'>
          <table className='w-full table-fixed border-collapse text-left'>
            <thead className='sticky top-0 z-10 bg-[var(--color-neutral-50)]'>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.id}
                    className={`${getHeaderCellClasses(
                      index,
                      totalColumns,
                      column.align
                    )} ${column.headerClassName ?? ''}`}
                    scope='col'
                    style={{ width: `${column.widthRem * scaleFactor}rem` }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={`${movement.time}-${movement.patient}`}>
                  {columns.map((column, index) => (
                    <td
                      key={column.id}
                      className={`${getBodyCellClasses(
                        index,
                        totalColumns,
                        column.align
                      )} ${column.cellClassName ?? ''}`}
                      style={{
                        width: `${column.widthRem * scaleFactor}rem`,
                        ...(column.cellStyle ?? {})
                      }}
                    >
                      {column.render(movement)}
                    </td>
                  ))}
                </tr>
              ))}
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
      className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1 text-neutral-600'
      style={{ width: `min(${SEARCH_WIDTH_REM}rem, 100%)` }}
    >
      <span className='material-symbols-rounded text-[var(--color-neutral-900)]'>
        search
      </span>
      <input
        className='w-full bg-transparent text-body-sm text-[var(--color-neutral-900)] placeholder:[color:var(--color-neutral-900)] focus:outline-none'
        placeholder='Buscar'
        aria-label='Buscar en caja diaria'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </form>
  )
}

function DateRangeFilter({
  fromValue,
  toValue,
  onFromChange,
  onToChange
}: {
  fromValue: string
  toValue: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}) {
  return (
    <div className='flex flex-wrap items-center gap-gapsm'>
      <label className='flex items-center gap-2 px-1 py-1 text-body-sm text-[var(--color-neutral-900)]'>
        <span className='text-body-sm leading-[1.25rem]'>Desde</span>
        <input
          className='w-[8rem] bg-transparent text-body-sm leading-[1.25rem] text-[var(--color-neutral-900)] placeholder:[color:var(--color-neutral-900)] focus:outline-none'
          placeholder='DD/MM/AAAA'
          value={fromValue}
          onChange={(event) =>
            onFromChange(formatDateInput(event.target.value))
          }
          inputMode='numeric'
          autoComplete='off'
          aria-label='Filtrar desde fecha'
          style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
        />
      </label>
      <label className='flex items-center gap-2 px-1 py-1 text-body-sm text-[var(--color-neutral-900)]'>
        <span className='text-body-sm leading-[1.25rem]'>Hasta</span>
        <input
          className='w-[8rem] bg-transparent text-body-sm leading-[1.25rem] text-[var(--color-neutral-900)] placeholder:[color:var(--color-neutral-900)] focus:outline-none'
          placeholder='DD/MM/AAAA'
          value={toValue}
          onChange={(event) => onToChange(formatDateInput(event.target.value))}
          inputMode='numeric'
          autoComplete='off'
          aria-label='Filtrar hasta fecha'
          style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
        />
      </label>
    </div>
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
    'inline-flex items-center justify-center gap-2 rounded-[32px] px-2 py-1 text-body-sm border cursor-pointer transition-colors'

  const activeClass = 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
  const inactiveClass =
    'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)] hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]'

  return (
    <button
      type='button'
      className={`${baseClass} ${active ? activeClass : inactiveClass}`}
      style={{ height: `${CONTROL_HEIGHT_REM}rem` }}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon && (
        <span className='material-symbols-rounded text-[1rem]'>{icon}</span>
      )}
      {label}
    </button>
  )
}

function StatusBadge({
  id,
  status,
  isOpen,
  onToggle,
  onSelect
}: {
  id: string
  status: InvoiceStatus
  isOpen: boolean
  onToggle: () => void
  onSelect: (status: InvoiceStatus) => void
}) {
  const isCollected = status === 'Cobrado'
  const badgeClass = isCollected
    ? 'bg-brand-50 text-brand-900'
    : 'bg-warning-50 text-warning-200'

  const options: InvoiceStatus[] = ['Cobrado', 'Por cobrar']

  return (
    <div className='relative inline-flex' data-status-dropdown>
      <button
        type='button'
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className={`inline-flex h-[2rem] items-center justify-center rounded-full px-[0.75rem] text-label-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic ${badgeClass}`}
      >
        {status}
      </button>

      {isOpen ? (
        <div className='absolute left-0 top-[calc(100%+0.25rem)] z-10 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-neutral-0 shadow-elevation-popover'>
          {options.map((option) => (
            <button
              key={`${id}-${option}`}
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                onSelect(option)
              }}
              className={`flex w-full items-center justify-between px-[0.75rem] py-[0.5rem] text-label-sm text-fg transition-colors hover:bg-neutral-50 ${
                option === status ? 'font-semibold' : ''
              }`}
            >
              <span>{option}</span>
              {option === status ? (
                <span className='material-symbols-rounded text-[1rem] text-brandSemantic'>
                  check
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ProductionBadge({
  id,
  state,
  isOpen,
  onToggle,
  onSelect
}: {
  id: string
  state: ProductionState
  isOpen: boolean
  onToggle: () => void
  onSelect: (state: ProductionState) => void
}) {
  const isDone = state === 'Hecho'
  const badgeClass = isDone
    ? 'bg-success-200 text-success-800'
    : 'bg-neutral-200 text-neutral-700'

  const options: ProductionState[] = ['Hecho', 'Pendiente']

  return (
    <div className='relative inline-flex' data-produced-dropdown>
      <button
        type='button'
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className={`inline-flex h-[2rem] items-center justify-center rounded-full px-[0.75rem] text-label-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic ${badgeClass}`}
      >
        {state}
      </button>

      {isOpen ? (
        <div className='absolute left-0 top-[calc(100%+0.25rem)] z-10 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-neutral-0 shadow-elevation-popover'>
          {options.map((option) => (
            <button
              key={`${id}-${option}`}
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                onSelect(option)
              }}
              className={`flex w-full items-center justify-between px-[0.75rem] py-[0.5rem] text-label-sm text-fg transition-colors hover:bg-neutral-50 ${
                option === state ? 'font-semibold' : ''
              }`}
            >
              <span>{option}</span>
              {option === state ? (
                <span className='material-symbols-rounded text-[1rem] text-brandSemantic'>
                  check
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PaymentMethodBadge({
  id,
  method,
  options,
  isOpen,
  onToggle,
  onSelect
}: {
  id: string
  method: string
  options: string[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (method: string) => void
}) {
  return (
    <div className='relative inline-flex' data-method-dropdown>
      <button
        type='button'
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className='inline-flex items-center text-body-md text-[var(--color-neutral-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        {method}
      </button>

      {isOpen ? (
        <div className='absolute left-0 top-[calc(100%+0.25rem)] z-10 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-neutral-0 shadow-elevation-popover'>
          {options.map((option) => (
            <button
              key={`${id}-${option}`}
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                onSelect(option)
              }}
              className={`flex w-full items-center justify-between px-[0.75rem] py-[0.5rem] text-label-sm text-fg transition-colors hover:bg-neutral-50 ${
                option === method ? 'font-semibold' : ''
              }`}
            >
              <span>{option}</span>
              {option === method ? (
                <span className='material-symbols-rounded text-[1rem] text-brandSemantic'>
                  check
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PaginationIcon({
  icon,
  ariaLabel
}: {
  icon: string
  ariaLabel: string
}) {
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

function RowActionsButton({
  ariaLabel,
  iconColor,
  isOpen,
  onToggle,
  onViewPatient
}: {
  ariaLabel: string
  iconColor: string
  isOpen: boolean
  onToggle: () => void
  onViewPatient: () => void
}) {
  return (
    <div className='relative inline-flex' data-actions-dropdown>
      <button
        type='button'
        aria-label={ariaLabel}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className='mx-auto flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-full text-[var(--color-neutral-900)] transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
      >
        <MD3Icon
          name='MoreVertRounded'
          size='lg'
          className='text-[var(--color-neutral-900)]'
          aria-label={ariaLabel}
          style={{ color: iconColor }}
        />
      </button>

      {isOpen ? (
        <div className='absolute right-0 top-[calc(100%+0.25rem)] z-10 min-w-[9.5rem] overflow-hidden rounded-lg border border-border bg-neutral-0 shadow-elevation-popover'>
          <button
            type='button'
            onClick={(event) => {
              event.stopPropagation()
              onViewPatient()
            }}
            className='flex w-full items-center gap-2 px-[0.75rem] py-[0.5rem] text-label-sm text-fg transition-colors hover:bg-neutral-50'
          >
            <span>Ver paciente</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
