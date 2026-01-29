'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { AddRounded, SearchRounded, FilterAltRounded, FirstPageRounded, ChevronLeftRounded, ChevronRightRounded, LastPageRounded } from '@/components/icons/md3'

// Types
type ExpenseStatus = 'activo' | 'inactivo'
type ExpenseCategory = 'Servicios' | 'Material' | 'Nóminas' | 'Alquiler' | 'Suministros' | 'Otros'

type Expense = {
  id: string
  nombre: string
  importe: number
  frecuencia: string
  categoria: ExpenseCategory
  fechaInicio: string
  fechaFin: string
  notas: string
  estado: ExpenseStatus
}

// StatusBadge component
function StatusBadge({ status }: { status: ExpenseStatus }) {
  const isActive = status === 'activo'
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-body-md ${
        isActive
          ? 'bg-[#e0f2fe] text-[#075985]'
          : 'bg-neutral-300 text-[var(--color-neutral-900)]'
      }`}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  )
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pages = useMemo(() => {
    const result: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) result.push(i)
    } else {
      result.push(1)
      if (currentPage > 3) result.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) result.push(i)
      if (currentPage < totalPages - 2) result.push('...')
      result.push(totalPages)
    }
    return result
  }, [currentPage, totalPages])

  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center'>
        <button
          type='button'
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className='size-6 flex items-center justify-center disabled:opacity-50 cursor-pointer'
          aria-label='Primera página'
        >
          <FirstPageRounded className='size-6 text-[var(--color-neutral-900)]' />
        </button>
        <button
          type='button'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='size-6 flex items-center justify-center disabled:opacity-50 cursor-pointer'
          aria-label='Página anterior'
        >
          <ChevronLeftRounded className='size-6 text-[var(--color-neutral-900)]' />
        </button>
      </div>
      <div className='flex items-center gap-2 text-sm text-[var(--color-neutral-900)]'>
        {pages.map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={page}
              type='button'
              onClick={() => onPageChange(page)}
              className={`cursor-pointer ${
                page === currentPage ? 'font-bold underline' : 'font-normal'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`}>{page}</span>
          )
        )}
      </div>
      <div className='flex items-center'>
        <button
          type='button'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='size-6 flex items-center justify-center disabled:opacity-50 cursor-pointer'
          aria-label='Página siguiente'
        >
          <ChevronRightRounded className='size-6 text-[var(--color-neutral-900)]' />
        </button>
        <button
          type='button'
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className='size-6 flex items-center justify-center disabled:opacity-50 cursor-pointer'
          aria-label='Última página'
        >
          <LastPageRounded className='size-6 text-[var(--color-neutral-900)]' />
        </button>
      </div>
    </div>
  )
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Sample data
const initialExpenses: Expense[] = [
  {
    id: 'e1',
    nombre: 'KH7 Limpieza',
    importe: 1265.0,
    frecuencia: '3 días',
    categoria: 'Servicios',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Contrato limpieza oficinas',
    estado: 'activo'
  },
  {
    id: 'e2',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e3',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e4',
    nombre: 'KH7 Limpieza',
    importe: 1265.0,
    frecuencia: '3 días',
    categoria: 'Servicios',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Contrato limpieza oficinas',
    estado: 'activo'
  },
  {
    id: 'e5',
    nombre: 'KH7 Limpieza',
    importe: 1265.0,
    frecuencia: '3 días',
    categoria: 'Servicios',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Contrato limpieza oficinas',
    estado: 'activo'
  },
  {
    id: 'e6',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e7',
    nombre: 'KH7 Limpieza',
    importe: 1265.0,
    frecuencia: '3 días',
    categoria: 'Servicios',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Contrato limpieza oficinas',
    estado: 'activo'
  },
  {
    id: 'e8',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'inactivo'
  },
  {
    id: 'e9',
    nombre: 'KH7 Limpieza',
    importe: 1265.0,
    frecuencia: '3 días',
    categoria: 'Servicios',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Contrato limpieza oficinas',
    estado: 'activo'
  },
  {
    id: 'e10',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e11',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e12',
    nombre: 'KH7 Limpieza',
    importe: 1265.0,
    frecuencia: '3 días',
    categoria: 'Servicios',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Contrato limpieza oficinas',
    estado: 'activo'
  },
  {
    id: 'e13',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e14',
    nombre: 'Cubeta universal superior',
    importe: 25329.0,
    frecuencia: '28 días',
    categoria: 'Material',
    fechaInicio: '12/07/25',
    fechaFin: '28/09/25',
    notas: 'Material dental',
    estado: 'activo'
  },
  {
    id: 'e15',
    nombre: 'Alquiler local',
    importe: 2500.0,
    frecuencia: 'Mensual',
    categoria: 'Alquiler',
    fechaInicio: '01/01/25',
    fechaFin: '31/12/25',
    notas: 'Alquiler mensual local comercial',
    estado: 'activo'
  }
]

const ITEMS_PER_PAGE = 15

export default function FinancesExpensesPage() {
  const [expenses] = useState<Expense[]>(initialExpenses)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const term = search.trim().toLowerCase()
    let filtered = expenses

    // Filter by archived status
    if (!showArchived) {
      filtered = filtered.filter((e) => e.estado === 'activo')
    }

    // Filter by search term
    if (term) {
      filtered = filtered.filter(
        (e) =>
          e.nombre.toLowerCase().includes(term) ||
          e.categoria.toLowerCase().includes(term) ||
          e.notas.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [expenses, search, showArchived])

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE)
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredExpenses, currentPage])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleAddExpense = useCallback(() => {
    // TODO: Open modal to add new expense
    console.log('Add new expense')
  }, [])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <p className='text-headline-sm font-normal text-[var(--color-neutral-900)]'>
          Finanzas, gastos fijos y nóminas
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          onClick={handleAddExpense}
        >
          <AddRounded className='text-[var(--color-neutral-900)] size-6' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
            Añadir gasto
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-hidden flex flex-col'>
          {/* Toolbar */}
          <div className='flex-none px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-[min(1rem,1.5vh)]'>
            <div className='flex items-end justify-between'>
              <p className='text-label-sm text-[var(--color-neutral-500)]'>
                {filteredExpenses.length} Resultados totales
              </p>
              <div className='flex items-center gap-2'>
                {/* Search */}
                <div className='flex items-center'>
                  <button
                    type='button'
                    className='p-1 hover:bg-neutral-100 rounded transition-colors cursor-pointer'
                    aria-label='Buscar'
                  >
                    <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                  </button>
                </div>

                {/* Filter */}
                <button
                  type='button'
                  className='flex items-center gap-0.5 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors cursor-pointer'
                >
                  <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>Todos</span>
                </button>

                {/* Toggle archived */}
                <button
                  type='button'
                  className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer'
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <AddRounded className='text-[var(--color-neutral-900)] size-6' />
                  <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
                    {showArchived ? 'Ocultar archivados' : 'Ver gastos archivados'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className='flex-1 overflow-auto px-[min(2.5rem,3vw)]'>
            <table className='w-full border-collapse table-fixed'>
              <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                <tr>
                  <th className='w-[22%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Nombre del gasto
                  </th>
                  <th className='w-[12%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Importe
                  </th>
                  <th className='w-[12%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Frecuencia
                  </th>
                  <th className='w-[12%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Categoría
                  </th>
                  <th className='w-[18%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Fecha inicio/fin
                  </th>
                  <th className='w-[12%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Notas
                  </th>
                  <th className='w-[12%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className='h-10 bg-white hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
                  >
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                        {expense.nombre}
                      </span>
                    </td>
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                        {formatCurrency(expense.importe)}
                      </span>
                    </td>
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                        {expense.frecuencia}
                      </span>
                    </td>
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                        {expense.categoria}
                      </span>
                    </td>
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                        {expense.fechaInicio} - {expense.fechaFin}
                      </span>
                    </td>
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <button
                        type='button'
                        className='text-body-md font-medium text-[var(--color-brand-600)] hover:underline cursor-pointer'
                      >
                        Ver nota
                      </button>
                    </td>
                    <td className='px-2 border-b border-r border-neutral-300'>
                      <StatusBadge status={expense.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex-none flex justify-end px-[min(2.5rem,3vw)] py-[min(1rem,1.5vh)]'>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </>
  )
}
