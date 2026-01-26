'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MD3Icon } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'
import { useAppointments, type PaymentRecord } from '@/context/AppointmentsContext'

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
  /** Ancho en porcentaje del total de la tabla */
  widthPercent: number
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

// Convertir PaymentRecord del contexto a CashMovement
function paymentRecordToMovement(payment: PaymentRecord): CashMovement {
  const paymentDate = new Date(payment.paymentDate)
  const dateStr = paymentDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  
  // Mapear método de pago a categoría
  const methodToCategory: Record<string, PaymentCategory> = {
    efectivo: 'Efectivo',
    tarjeta: 'TPV',
    transferencia: 'Financiación',
    bizum: 'TPV'
  }
  
  return {
    date: payment.paymentDate.toISOString().split('T')[0],
    time: dateStr,
    patient: payment.patientName,
    concept: payment.treatment,
    amount: `${payment.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${payment.currency}`,
    status: 'Cobrado',
    produced: 'Hecho',
    method: payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1),
    insurer: '—',
    paymentCategory: methodToCategory[payment.paymentMethod.toLowerCase()] ?? 'Efectivo'
  }
}

export default function CashMovementsTable({
  onViewPatient
}: CashMovementsTableProps) {
  // Obtener pagos del contexto
  const { payments } = useAppointments()
  
  const [query, setQuery] = useState('')
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')
  const [activePaymentFilters, setActivePaymentFilters] = useState<
    PaymentCategory[]
  >([])
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
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-actions-dropdown]')) return
      setOpenActionsMenu(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
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
    // Anchos en porcentaje - total = 100%
    // Basado en proporciones de Figma pero usando % para responsividad
    const COLUMN_WIDTHS_PERCENT = {
      time: 8,        // Día (antes 7rem)
      patient: 17,    // Paciente (antes 17.875rem)
      concept: 24,    // Concepto (antes 25.75rem)
      amount: 9,      // Cantidad (antes 9rem)
      status: 8,      // Estado (antes 7.0625rem)
      produced: 10,   // Producido (antes 10.5625rem)
      method: 12,     // Método (antes 12.5rem)
      insurer: 9,     // Aseguradora (antes 8.6875rem)
      actions: 3      // Acciones (antes 1.5rem)
    } as const

    return [
      {
        id: 'time',
        label: 'Día',
        widthPercent: COLUMN_WIDTHS_PERCENT.time,
        render: (movement) => (
          <span className='whitespace-nowrap'>{movement.time}</span>
        )
      },
      {
        id: 'patient',
        label: 'Paciente',
        widthPercent: COLUMN_WIDTHS_PERCENT.patient,
        render: (movement) => (
          <span className='block truncate'>{movement.patient}</span>
        )
      },
      {
        id: 'concept',
        label: 'Concepto',
        widthPercent: COLUMN_WIDTHS_PERCENT.concept,
        render: (movement) => (
          <span className='block truncate'>{movement.concept}</span>
        )
      },
      {
        id: 'amount',
        label: 'Cantidad',
        widthPercent: COLUMN_WIDTHS_PERCENT.amount,
        render: (movement) => (
          <span className='whitespace-nowrap'>{movement.amount}</span>
        )
      },
      {
        id: 'status',
        label: 'Estado',
        widthPercent: COLUMN_WIDTHS_PERCENT.status,
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentStatus = rowStatuses[id] ?? movement.status
          return <StaticStatusBadge status={currentStatus} />
        }
      },
      {
        id: 'produced',
        label: 'Producido',
        widthPercent: COLUMN_WIDTHS_PERCENT.produced,
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentProduced = rowProduced[id] ?? movement.produced
          return <StaticProductionBadge state={currentProduced} />
        }
      },
      {
        id: 'method',
        label: 'Método',
        widthPercent: COLUMN_WIDTHS_PERCENT.method,
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentMethod = rowMethods[id] ?? movement.method
          return (
            <span className='block truncate text-body-md text-[var(--color-neutral-900)]'>
              {currentMethod}
            </span>
          )
        }
      },
      {
        id: 'insurer',
        label: 'Aseguradora',
        widthPercent: COLUMN_WIDTHS_PERCENT.insurer,
        render: (movement) => (
          <span className='block truncate'>{movement.insurer}</span>
        )
      },
      {
        id: 'actions',
        label: '',
        widthPercent: COLUMN_WIDTHS_PERCENT.actions,
        align: 'center',
        cellClassName: 'px-0',
        cellStyle: { paddingLeft: 0, paddingRight: 0 },
        render: (movement) => {
          const id = `${movement.time}-${movement.patient}`
          const currentStatus = rowStatuses[id] ?? movement.status
          const currentProduced = rowProduced[id] ?? movement.produced
          const currentMethod = rowMethods[id] ?? movement.method
          return (
            <RowActionsButton
              ariaLabel={`Acciones para ${movement.patient}`}
              iconColor='var(--color-neutral-900)'
              isOpen={openActionsMenu === id}
              currentStatus={currentStatus}
              currentProduced={currentProduced}
              currentMethod={currentMethod}
              methodOptions={methodOptions}
              onToggle={() => {
                setOpenActionsMenu((prev) => (prev === id ? null : id))
              }}
              onViewPatient={() => {
                onViewPatient?.(movement)
                setOpenActionsMenu(null)
              }}
              onViewInvoice={() => {
                // TODO: Implementar ver factura
                console.log('Ver factura para:', movement.patient)
                setOpenActionsMenu(null)
              }}
              onNewPayment={() => {
                // TODO: Implementar nuevo pago
                console.log('Nuevo pago para:', movement.patient)
                setOpenActionsMenu(null)
              }}
              onPrintReceipt={() => {
                // TODO: Implementar impresión de recibo
                console.log('Imprimir recibo para:', movement.patient)
                setOpenActionsMenu(null)
              }}
              onStatusChange={(newStatus) => {
                setRowStatuses((prev) => ({ ...prev, [id]: newStatus }))
                setOpenActionsMenu(null)
              }}
              onProducedChange={(newProduced) => {
                setRowProduced((prev) => ({ ...prev, [id]: newProduced }))
                setOpenActionsMenu(null)
              }}
              onMethodChange={(newMethod) => {
                setRowMethods((prev) => ({ ...prev, [id]: newMethod }))
                setOpenActionsMenu(null)
              }}
            />
          )
        }
      }
    ]
  }, [
    openActionsMenu,
    rowStatuses,
    rowProduced,
    rowMethods,
    methodOptions,
    onViewPatient
  ])

  // Combinar movimientos mock con pagos reales del contexto
  const allMovements = useMemo(() => {
    const contextPayments = payments.map(paymentRecordToMovement)
    // Los pagos del contexto van primero (más recientes)
    return [...contextPayments, ...MOVEMENTS]
  }, [payments])

  const filteredMovements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const fromDate = parseDDMMYYYY(fromDateInput)
    const toDate = parseDDMMYYYY(toDateInput)

    return allMovements.filter((movement) => {
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
  }, [query, activePaymentFilters, fromDateInput, toDateInput, allMovements])
  const totalColumns = columns.length
  return (
    <section
      className='flex h-full flex-col flex-1 overflow-hidden'
      style={{
        marginTop: 'min(0.4375rem, 0.6vh)',
        width: '100%'
      }}
    >
      <div className='flex flex-wrap items-center justify-between gap-gapsm'>
        <DateRangeFilter
          fromValue={fromDateInput}
          toValue={toDateInput}
          onFromChange={setFromDateInput}
          onToChange={setToDateInput}
        />
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
            <MD3Icon
              name='SearchRounded'
              size='sm'
              className='text-[var(--color-neutral-900)]'
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Buscar por paciente, concepto,...'
              className='bg-transparent outline-none text-body-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-900)] w-[14rem]'
            />
          </div>
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

      <div className='mt-6 flex-1 overflow-hidden rounded-lg'>
        <div className='h-full overflow-y-auto overflow-x-auto'>
          <table className='w-full min-w-[50rem] table-fixed border-collapse text-left'>
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
                    style={{ width: `${column.widthPercent}%` }}
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
                        width: `${column.widthPercent}%`,
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

// Badges estáticos (sin dropdown) - solo se modifican desde acciones rápidas
function StaticStatusBadge({ status }: { status: InvoiceStatus }) {
  const isCollected = status === 'Cobrado'
  const badgeClass = isCollected
    ? 'bg-brand-50 text-brand-900'
    : 'bg-warning-50 text-warning-200'

  return (
    <span
      className={`inline-flex h-[2rem] items-center justify-center rounded-full px-[0.75rem] text-label-sm font-medium ${badgeClass}`}
    >
      {status}
    </span>
  )
}

function StaticProductionBadge({ state }: { state: ProductionState }) {
  const isDone = state === 'Hecho'
  const badgeClass = isDone
    ? 'bg-success-200 text-success-800'
    : 'bg-neutral-200 text-neutral-700'

  return (
    <span
      className={`inline-flex h-[2rem] items-center justify-center rounded-full px-[0.75rem] text-label-sm font-medium ${badgeClass}`}
    >
      {state}
    </span>
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
  onViewPatient,
  onViewInvoice,
  onNewPayment,
  onPrintReceipt,
  onStatusChange,
  onProducedChange,
  onMethodChange,
  currentStatus,
  currentProduced,
  currentMethod,
  methodOptions
}: {
  ariaLabel: string
  iconColor: string
  isOpen: boolean
  onToggle: () => void
  onViewPatient: () => void
  onViewInvoice?: () => void
  onNewPayment?: () => void
  onPrintReceipt?: () => void
  onStatusChange?: (status: InvoiceStatus) => void
  onProducedChange?: (produced: ProductionState) => void
  onMethodChange?: (method: string) => void
  currentStatus?: InvoiceStatus
  currentProduced?: ProductionState
  currentMethod?: string
  methodOptions?: string[]
}) {
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false)
  const [showProducedSubmenu, setShowProducedSubmenu] = useState(false)
  const [showMethodSubmenu, setShowMethodSubmenu] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top?: number
    bottom?: number
    right: number
  }>({ right: 0 })

  const statusOptions: InvoiceStatus[] = ['Cobrado', 'Por cobrar']
  const producedOptions: ProductionState[] = ['Hecho', 'Pendiente']

  // Calcular posición óptima del menú cuando se abre
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const calculatePosition = () => {
      const buttonRect = buttonRef.current!.getBoundingClientRect()
      const menuHeight = 420 // Altura aproximada del menú con todos los submenús cerrados
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const margin = 8

      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top

      // Calcular posición horizontal (alineado a la derecha del botón)
      const right = Math.max(margin, viewportWidth - buttonRect.right)

      // Determinar si abrir arriba o abajo
      if (spaceBelow >= menuHeight + margin) {
        // Hay espacio abajo
        setMenuPosition({
          top: buttonRect.bottom + margin,
          right
        })
      } else if (spaceAbove >= menuHeight + margin) {
        // Hay espacio arriba
        setMenuPosition({
          bottom: viewportHeight - buttonRect.top + margin,
          right
        })
      } else {
        // No hay espacio suficiente ni arriba ni abajo, centrar verticalmente
        const centeredTop = Math.max(
          margin,
          Math.min(
            viewportHeight - menuHeight - margin,
            buttonRect.top + buttonRect.height / 2 - menuHeight / 2
          )
        )
        setMenuPosition({
          top: centeredTop,
          right
        })
      }
    }

    calculatePosition()

    // Recalcular en scroll y resize
    window.addEventListener('scroll', calculatePosition, true)
    window.addEventListener('resize', calculatePosition)

    return () => {
      window.removeEventListener('scroll', calculatePosition, true)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [isOpen])

  return (
    <div className='relative inline-flex' data-actions-dropdown>
      <button
        ref={buttonRef}
        type='button'
        aria-label={ariaLabel}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
          // Reset submenus cuando se cierra
          if (isOpen) {
            setShowStatusSubmenu(false)
            setShowProducedSubmenu(false)
            setShowMethodSubmenu(false)
          }
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

      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            data-actions-dropdown
            className='fixed z-[9999] min-w-[14rem] max-h-[calc(100vh-1rem)] overflow-y-auto overflow-x-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
            style={{
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              right: menuPosition.right
            }}
            role='menu'
            aria-label='Acciones rápidas'
          >
          {/* Acciones principales */}
          <div className='py-1'>
            <button
              type='button'
              role='menuitem'
              onClick={(event) => {
                event.stopPropagation()
                onViewPatient()
              }}
              className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <MD3Icon
                name='AccountCircleRounded'
                size={1.125}
                className='text-[var(--color-neutral-600)]'
              />
              <span>Ver paciente</span>
            </button>
            <button
              type='button'
              role='menuitem'
              onClick={(event) => {
                event.stopPropagation()
                onViewInvoice?.()
              }}
              className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <MD3Icon
                name='ReceiptLongRounded'
                size={1.125}
                className='text-[var(--color-neutral-600)]'
              />
              <span>Ver factura</span>
            </button>
            <button
              type='button'
              role='menuitem'
              onClick={(event) => {
                event.stopPropagation()
                onNewPayment?.()
              }}
              className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <MD3Icon
                name='PaymentsRounded'
                size={1.125}
                className='text-[var(--color-neutral-600)]'
              />
              <span>Nuevo pago</span>
            </button>
            <button
              type='button'
              role='menuitem'
              onClick={(event) => {
                event.stopPropagation()
                onPrintReceipt?.()
              }}
              className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <MD3Icon
                name='PrintRounded'
                size={1.125}
                className='text-[var(--color-neutral-600)]'
              />
              <span>Imprimir recibo</span>
            </button>
          </div>

          {/* Separador */}
          <div className='my-1 h-px bg-[var(--color-border-default)]' />

          {/* Estado (acordeón) */}
          <div className='py-1'>
            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                setShowStatusSubmenu(!showStatusSubmenu)
              }}
              className='flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <div className='flex items-center gap-3'>
                <span
                  className='h-3 w-3 shrink-0 rounded-full'
                  style={{
                    backgroundColor: currentStatus === 'Cobrado' ? 'var(--color-brand-500)' : 'var(--color-warning-500)'
                  }}
                />
                <span>Estado</span>
              </div>
              <MD3Icon
                name={showStatusSubmenu ? 'KeyboardArrowUpRounded' : 'KeyboardArrowDownRounded'}
                size='sm'
                className='text-[var(--color-neutral-500)]'
              />
            </button>

            {/* Submenu de estados */}
            {showStatusSubmenu && (
              <div className='bg-[var(--color-neutral-50)] py-1'>
                {statusOptions.map((status) => {
                  const isSelected = status === currentStatus
                  return (
                    <button
                      key={status}
                      type='button'
                      onClick={(event) => {
                        event.stopPropagation()
                        onStatusChange?.(status)
                      }}
                      className={[
                        'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-[var(--color-brand-0)]'
                          : 'hover:bg-[var(--color-neutral-100)]'
                      ].join(' ')}
                    >
                      <span
                        className='h-2.5 w-2.5 shrink-0 rounded-full'
                        style={{
                          backgroundColor: status === 'Cobrado' ? 'var(--color-brand-500)' : 'var(--color-warning-500)'
                        }}
                      />
                      <span
                        className={isSelected ? 'font-medium text-[var(--color-brand-700)]' : 'text-[var(--color-neutral-800)]'}
                      >
                        {status}
                      </span>
                      {isSelected && (
                        <MD3Icon
                          name='CheckRounded'
                          size='sm'
                          className='ml-auto text-[var(--color-brand-600)]'
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Producido (acordeón) */}
          <div className='py-1'>
            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                setShowProducedSubmenu(!showProducedSubmenu)
              }}
              className='flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <div className='flex items-center gap-3'>
                <span
                  className='h-3 w-3 shrink-0 rounded-full'
                  style={{
                    backgroundColor: currentProduced === 'Hecho' ? 'var(--color-success-500)' : 'var(--color-neutral-400)'
                  }}
                />
                <span>Producido</span>
              </div>
              <MD3Icon
                name={showProducedSubmenu ? 'KeyboardArrowUpRounded' : 'KeyboardArrowDownRounded'}
                size='sm'
                className='text-[var(--color-neutral-500)]'
              />
            </button>

            {/* Submenu de producido */}
            {showProducedSubmenu && (
              <div className='bg-[var(--color-neutral-50)] py-1'>
                {producedOptions.map((produced) => {
                  const isSelected = produced === currentProduced
                  return (
                    <button
                      key={produced}
                      type='button'
                      onClick={(event) => {
                        event.stopPropagation()
                        onProducedChange?.(produced)
                      }}
                      className={[
                        'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-[var(--color-brand-0)]'
                          : 'hover:bg-[var(--color-neutral-100)]'
                      ].join(' ')}
                    >
                      <span
                        className='h-2.5 w-2.5 shrink-0 rounded-full'
                        style={{
                          backgroundColor: produced === 'Hecho' ? 'var(--color-success-500)' : 'var(--color-neutral-400)'
                        }}
                      />
                      <span
                        className={isSelected ? 'font-medium text-[var(--color-brand-700)]' : 'text-[var(--color-neutral-800)]'}
                      >
                        {produced}
                      </span>
                      {isSelected && (
                        <MD3Icon
                          name='CheckRounded'
                          size='sm'
                          className='ml-auto text-[var(--color-brand-600)]'
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Método (acordeón) */}
          <div className='py-1'>
            <button
              type='button'
              onClick={(event) => {
                event.stopPropagation()
                setShowMethodSubmenu(!showMethodSubmenu)
              }}
              className='flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <div className='flex items-center gap-3'>
                <MD3Icon
                  name='PaymentsRounded'
                  size={0.75}
                  className='text-[var(--color-neutral-600)]'
                />
                <span>Método</span>
              </div>
              <MD3Icon
                name={showMethodSubmenu ? 'KeyboardArrowUpRounded' : 'KeyboardArrowDownRounded'}
                size='sm'
                className='text-[var(--color-neutral-500)]'
              />
            </button>

            {/* Submenu de método */}
            {showMethodSubmenu && methodOptions && (
              <div className='bg-[var(--color-neutral-50)] py-1'>
                {methodOptions.map((method) => {
                  const isSelected = method === currentMethod
                  return (
                    <button
                      key={method}
                      type='button'
                      onClick={(event) => {
                        event.stopPropagation()
                        onMethodChange?.(method)
                      }}
                      className={[
                        'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-[var(--color-brand-0)]'
                          : 'hover:bg-[var(--color-neutral-100)]'
                      ].join(' ')}
                    >
                      <span
                        className={isSelected ? 'font-medium text-[var(--color-brand-700)]' : 'text-[var(--color-neutral-800)]'}
                      >
                        {method}
                      </span>
                      {isSelected && (
                        <MD3Icon
                          name='CheckRounded'
                          size='sm'
                          className='ml-auto text-[var(--color-brand-600)]'
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}
