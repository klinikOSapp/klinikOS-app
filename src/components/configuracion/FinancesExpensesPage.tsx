'use client'

import {
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  FilterAltRounded,
  FirstPageRounded,
  LastPageRounded,
  MoreVertRounded,
  SearchRounded,
  VisibilityOffOutlined,
  VisibilityOutlined
} from '@/components/icons/md3'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

// Types
type ExpenseStatus = 'activo' | 'inactivo'
type ExpenseCategory = string

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
  categoryId?: number | null
  expenseType?: 'fixed' | 'variable'
}

type ExpenseDbRow = {
  id: number
  category_id: number | null
  expense_type: 'fixed' | 'variable'
  description: string
  amount: number | string
  frequency: string | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  is_active: boolean | null
  expense_categories?:
    | { name?: string | null }
    | Array<{ name?: string | null }>
    | null
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

function normalizeDateInput(value?: string | null): string {
  if (!value) return ''
  // DB date is YYYY-MM-DD, keep compatible with <input type="date" />
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function frequencyDbToUi(value?: string | null): string {
  switch (value) {
    case 'monthly':
      return 'Mensual'
    case 'quarterly':
      return 'Trimestral'
    case 'annual':
      return 'Anual'
    case 'one_time':
      return 'Puntual'
    default:
      return 'Puntual'
  }
}

function frequencyUiToDb(value: string): 'monthly' | 'quarterly' | 'annual' | 'one_time' {
  const normalized = value.trim().toLowerCase()
  if (normalized.startsWith('mens')) return 'monthly'
  if (normalized.startsWith('trim')) return 'quarterly'
  if (normalized.startsWith('anual')) return 'annual'
  return 'one_time'
}

function mapDbRowToExpense(row: ExpenseDbRow): Expense {
  const categoryRecord = Array.isArray(row.expense_categories)
    ? row.expense_categories[0]
    : row.expense_categories
  return {
    id: String(row.id),
    nombre: row.description || '',
    importe: Number(row.amount || 0),
    frecuencia: frequencyDbToUi(row.frequency),
    categoria: String(categoryRecord?.name || 'Otros'),
    fechaInicio: normalizeDateInput(row.start_date),
    fechaFin: normalizeDateInput(row.end_date),
    notas: String(row.notes || ''),
    estado: row.is_active === false ? 'inactivo' : 'activo',
    categoryId: row.category_id,
    expenseType: row.expense_type
  }
}

// Row Actions Menu component
function ExpenseActionsMenu({
  expense,
  onClose,
  triggerRect,
  onEdit,
  onToggleArchive,
  onDelete
}: {
  expense: Expense
  onClose: () => void
  triggerRect?: DOMRect
  onEdit: () => void
  onToggleArchive: () => void
  onDelete: () => void
}) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const isArchived = expense.estado === 'inactivo'

  // Calculate position from triggerRect
  const menuStyle: React.CSSProperties = triggerRect
    ? {
        top: triggerRect.bottom + 4,
        right: window.innerWidth - triggerRect.right
      }
    : {}

  return createPortal(
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[12rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={menuStyle}
      role='menu'
      aria-label='Acciones rápidas'
    >
      {/* Edit action */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onEdit()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none cursor-pointer'
        >
          <EditRounded className='size-[1.125rem] text-[var(--color-neutral-600)]' />
          <span>Editar gasto</span>
        </button>
      </div>

      {/* Separator */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Archive/Unarchive action */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onToggleArchive()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none cursor-pointer'
        >
          {isArchived ? (
            <>
              <VisibilityOutlined className='size-[1.125rem] text-[var(--color-neutral-600)]' />
              <span>Activar gasto</span>
            </>
          ) : (
            <>
              <VisibilityOffOutlined className='size-[1.125rem] text-[var(--color-neutral-600)]' />
              <span>Archivar gasto</span>
            </>
          )}
        </button>
      </div>

      {/* Separator */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Delete action */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onDelete()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[#DC2626] transition-colors hover:bg-[#FEE2E2] focus:bg-[#FEE2E2] focus:outline-none cursor-pointer'
        >
          <DeleteRounded className='size-[1.125rem] text-[#DC2626]' />
          <span>Eliminar gasto</span>
        </button>
      </div>
    </div>,
    document.body
  )
}

// Edit/Create Expense Modal
function EditExpenseModal({
  open,
  onClose,
  expense,
  onSave,
  categoryOptions
}: {
  open: boolean
  onClose: () => void
  expense: Expense | null
  onSave: (updatedExpense: Expense, isNew: boolean) => Promise<boolean>
  categoryOptions: string[]
}) {
  const isNew = expense === null
  const [formData, setFormData] = useState<Expense | null>(null)

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (open) {
      if (expense) {
        setFormData({ ...expense })
      } else {
        // Initialize empty form for new expense
        setFormData({
          id: `exp-${Date.now()}`,
          nombre: '',
          importe: 0,
          frecuencia: 'Mensual',
          categoria: 'Otros',
          fechaInicio: new Date().toISOString().split('T')[0],
          fechaFin: '',
          notas: '',
          estado: 'activo'
        })
      }
    }
  }, [open, expense])

  if (!open || !formData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData) {
      const saved = await onSave(formData, isNew)
      if (saved) onClose()
    }
  }

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div className='absolute inset-0 bg-neutral-900/90' onClick={onClose} />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[min(36rem,92vw)] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            {isNew ? 'Nuevo gasto' : 'Editar gasto'}
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
        <form onSubmit={handleSubmit} className='flex flex-col gap-6 px-8 py-6'>
          {/* Expense name */}
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='expense-name'
              className='text-title-sm text-neutral-900'
            >
              Nombre del gasto
            </label>
            <input
              id='expense-name'
              type='text'
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              required
            />
          </div>

          {/* Amount and Frequency row */}
          <div className='flex gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <label
                htmlFor='expense-amount'
                className='text-title-sm text-neutral-900'
              >
                Importe (€)
              </label>
              <input
                id='expense-amount'
                type='number'
                step='0.01'
                min='0'
                value={formData.importe}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    importe: parseFloat(e.target.value) || 0
                  })
                }
                className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                required
              />
            </div>
            <div className='flex-1 flex flex-col gap-1'>
              <label
                htmlFor='expense-frequency'
                className='text-title-sm text-neutral-900'
              >
                Frecuencia
              </label>
              <input
                id='expense-frequency'
                type='text'
                value={formData.frecuencia}
                onChange={(e) =>
                  setFormData({ ...formData, frecuencia: e.target.value })
                }
                placeholder='Mensual / Trimestral / Anual / Puntual'
                className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='expense-category'
              className='text-title-sm text-neutral-900'
            >
              Categoría
            </label>
            <select
              id='expense-category'
              value={formData.categoria}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categoria: e.target.value as ExpenseCategory
                })
              }
              className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white cursor-pointer'
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Dates row */}
          <div className='flex gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <label
                htmlFor='expense-start-date'
                className='text-title-sm text-neutral-900'
              >
                Fecha inicio
              </label>
              <input
                id='expense-start-date'
                type='date'
                value={formData.fechaInicio}
                onChange={(e) =>
                  setFormData({ ...formData, fechaInicio: e.target.value })
                }
                className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              />
            </div>
            <div className='flex-1 flex flex-col gap-1'>
              <label
                htmlFor='expense-end-date'
                className='text-title-sm text-neutral-900'
              >
                Fecha fin
              </label>
              <input
                id='expense-end-date'
                type='date'
                value={formData.fechaFin}
                onChange={(e) =>
                  setFormData({ ...formData, fechaFin: e.target.value })
                }
                className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Notes */}
          <div className='flex flex-col gap-1'>
            <label
              htmlFor='expense-notes'
              className='text-title-sm text-neutral-900'
            >
              Notas
            </label>
            <textarea
              id='expense-notes'
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              placeholder='Añade notas sobre el gasto...'
              rows={3}
              className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
            />
          </div>

          {/* Footer buttons */}
          <div className='flex justify-end gap-3 mt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='px-4 py-2 rounded-[8.5rem] bg-[var(--color-brand-500)] text-white text-title-sm hover:bg-[var(--color-brand-600)] transition-colors cursor-pointer'
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// DB-first: local fallback list intentionally empty
const initialExpenses: Expense[] = []

const ITEMS_PER_PAGE = 15

export default function FinancesExpensesPage() {
  const { activeClinicId } = useClinic()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([
    'Servicios',
    'Material',
    'Nóminas',
    'Alquiler',
    'Suministros',
    'Otros'
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)

  // Actions menu state
  const [activeMenu, setActiveMenu] = useState<{
    expense: Expense
    triggerRect: DOMRect
  } | null>(null)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  const loadExpenses = useCallback(async () => {
    if (!activeClinicId) {
      setExpenses([])
      return
    }

    setIsLoading(true)
    try {
      const { data: categoriesRows, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('id, name')
        .eq('clinic_id', activeClinicId)
        .order('name', { ascending: true })

      if (categoriesError) {
        console.warn('No se pudieron cargar categorías de gastos', categoriesError)
      } else {
        const names = Array.from(
          new Set(
            (categoriesRows || [])
              .map((row) => String((row as { name?: string }).name || '').trim())
              .filter(Boolean)
          )
        )
        if (names.length > 0) {
          setCategoryOptions(names)
        }
      }

      const { data: expenseRows, error: expenseRowsError } = await supabase
        .from('expenses')
        .select(
          'id, category_id, expense_type, description, amount, frequency, start_date, end_date, notes, is_active, expense_categories(name)'
        )
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: false })

      if (expenseRowsError) {
        console.warn('No se pudieron cargar gastos', expenseRowsError)
        setExpenses([])
      } else {
        setExpenses(((expenseRows || []) as ExpenseDbRow[]).map(mapDbRowToExpense))
      }
    } finally {
      setIsLoading(false)
    }
  }, [activeClinicId, supabase])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

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
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE))
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredExpenses, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleAddExpense = useCallback(() => {
    // Open modal to add new expense (null expense means create mode)
    setEditingExpense(null)
    setEditModalOpen(true)
  }, [])

  // Handler to open actions menu
  const handleOpenMenu = useCallback(
    (expense: Expense, event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      setActiveMenu({ expense, triggerRect: rect })
    },
    []
  )

  // Handler to close actions menu
  const handleCloseMenu = useCallback(() => {
    setActiveMenu(null)
  }, [])

  // Handler to edit expense
  const handleEditExpense = useCallback((expense: Expense) => {
    setEditingExpense(expense)
    setEditModalOpen(true)
  }, [])

  // Handler to save edited or new expense
  const handleSaveExpense = useCallback(
    async (updatedExpense: Expense, isNew: boolean): Promise<boolean> => {
      if (!activeClinicId) return false

      const normalizedCategory = updatedExpense.categoria.trim() || 'Otros'
      let categoryId = updatedExpense.categoryId || null

      if (!categoryId) {
        const { data: existingCategory } = await supabase
          .from('expense_categories')
          .select('id, name')
          .eq('clinic_id', activeClinicId)
          .ilike('name', normalizedCategory)
          .maybeSingle()

        if (existingCategory?.id) {
          categoryId = Number(existingCategory.id)
        } else {
          const { data: insertedCategory, error: insertedCategoryError } =
            await supabase
              .from('expense_categories')
              .insert({
                clinic_id: activeClinicId,
                name: normalizedCategory,
                is_system: false
              })
              .select('id')
              .single()
          if (insertedCategoryError) {
            console.warn(
              'No se pudo crear categoría de gasto',
              insertedCategoryError
            )
          } else if (insertedCategory?.id) {
            categoryId = Number(insertedCategory.id)
            setCategoryOptions((prev) =>
              prev.includes(normalizedCategory)
                ? prev
                : [...prev, normalizedCategory].sort((a, b) =>
                    a.localeCompare(b, 'es')
                  )
            )
          }
        }
      }

      const payload = {
        clinic_id: activeClinicId,
        category_id: categoryId,
        expense_type: updatedExpense.expenseType || 'fixed',
        description: updatedExpense.nombre.trim(),
        amount: updatedExpense.importe,
        frequency: frequencyUiToDb(updatedExpense.frecuencia),
        start_date: updatedExpense.fechaInicio || null,
        end_date: updatedExpense.fechaFin || null,
        notes: updatedExpense.notas || null,
        is_active: updatedExpense.estado === 'activo'
      }

      if (isNew) {
        const { error } = await supabase.from('expenses').insert(payload)
        if (error) {
          console.warn('No se pudo crear gasto', error)
          alert('No se pudo guardar el gasto.')
          return false
        }
      } else {
        const { error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', Number(updatedExpense.id))
          .eq('clinic_id', activeClinicId)
        if (error) {
          console.warn('No se pudo actualizar gasto', error)
          alert('No se pudo actualizar el gasto.')
          return false
        }
      }

      await loadExpenses()
      return true
    },
    [activeClinicId, loadExpenses, supabase]
  )

  // Handler to toggle archive status
  const handleToggleArchive = useCallback(
    async (expense: Expense) => {
      if (!activeClinicId) return
      const { error } = await supabase
        .from('expenses')
        .update({ is_active: expense.estado !== 'activo' })
        .eq('id', Number(expense.id))
        .eq('clinic_id', activeClinicId)
      if (error) {
        console.warn('No se pudo actualizar estado de gasto', error)
        alert('No se pudo actualizar el estado del gasto.')
        return
      }
      await loadExpenses()
    },
    [activeClinicId, loadExpenses, supabase]
  )

  // Handler to open delete confirmation dialog
  const handleDeleteExpense = useCallback((expense: Expense) => {
    setExpenseToDelete(expense)
    setDeleteDialogOpen(true)
    setActiveMenu(null) // Close the actions menu
  }, [])

  // Handler to confirm deletion
  const confirmDeleteExpense = useCallback(async () => {
    if (!expenseToDelete || !activeClinicId) return
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', Number(expenseToDelete.id))
      .eq('clinic_id', activeClinicId)
    if (error) {
      console.warn('No se pudo eliminar gasto', error)
      alert('No se pudo eliminar el gasto.')
      return
    }
    setExpenseToDelete(null)
    setDeleteDialogOpen(false)
    await loadExpenses()
  }, [activeClinicId, expenseToDelete, loadExpenses, supabase])

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
                <div className='relative'>
                  <SearchRounded className='size-5 text-[var(--color-neutral-700)] absolute left-2 top-1/2 -translate-y-1/2' />
                  <input
                    type='search'
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder='Buscar gasto...'
                    className='h-8 w-44 rounded-full pl-8 pr-3 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                    aria-label='Buscar gastos'
                  />
                </div>

                {/* Filter */}
                <button
                  type='button'
                  className='flex items-center gap-0.5 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors cursor-pointer'
                >
                  <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>
                    Todos
                  </span>
                </button>

                {/* Toggle archived */}
                <button
                  type='button'
                  className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer'
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <AddRounded className='text-[var(--color-neutral-900)] size-6' />
                  <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
                    {showArchived
                      ? 'Ocultar archivados'
                      : 'Ver gastos archivados'}
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
                  <th className='w-[20%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Nombre del gasto
                  </th>
                  <th className='w-[10%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Importe
                  </th>
                  <th className='w-[10%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Frecuencia
                  </th>
                  <th className='w-[12%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Categoría
                  </th>
                  <th className='w-[16%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Fecha inicio/fin
                  </th>
                  <th className='w-[10%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Notas
                  </th>
                  <th className='w-[10%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    Estado
                  </th>
                  <th className='w-[4%] h-10 text-center px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                    <span className='sr-only'>Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className='py-12 text-center'>
                      <p className='text-body-md text-[var(--color-neutral-500)]'>
                        Cargando gastos...
                      </p>
                    </td>
                  </tr>
                ) : paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className='py-12 text-center'>
                      <div className='flex flex-col items-center gap-2'>
                        <p className='text-body-lg text-[var(--color-neutral-500)]'>
                          {search
                            ? 'No se encontraron gastos'
                            : 'No hay gastos registrados'}
                        </p>
                        <p className='text-body-sm text-[var(--color-neutral-400)]'>
                          {search
                            ? 'Intenta con otros términos de búsqueda'
                            : 'Añade un nuevo gasto para comenzar'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className='h-10 bg-white hover:bg-[var(--color-neutral-50)] transition-colors'
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
                          {expense.fechaInicio || '—'} - {expense.fechaFin || '—'}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <button
                          type='button'
                          onClick={() => alert(expense.notas || 'Sin notas')}
                          className='text-body-md font-medium text-[var(--color-brand-600)] hover:underline cursor-pointer'
                        >
                          Ver nota
                        </button>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <StatusBadge status={expense.estado} />
                      </td>
                      <td className='px-2 border-b border-neutral-300 text-center'>
                        <button
                          type='button'
                          onClick={(e) => handleOpenMenu(expense, e)}
                          className='p-1 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                          aria-label='Acciones rápidas'
                        >
                          <MoreVertRounded className='size-5 text-[var(--color-neutral-600)]' />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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

      {/* Actions Menu */}
      {activeMenu && (
        <ExpenseActionsMenu
          expense={activeMenu.expense}
          onClose={handleCloseMenu}
          triggerRect={activeMenu.triggerRect}
          onEdit={() => handleEditExpense(activeMenu.expense)}
          onToggleArchive={() => handleToggleArchive(activeMenu.expense)}
          onDelete={() => handleDeleteExpense(activeMenu.expense)}
        />
      )}

      {/* Edit Modal */}
      <EditExpenseModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingExpense(null)
        }}
        expense={editingExpense}
        onSave={handleSaveExpense}
        categoryOptions={categoryOptions}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setExpenseToDelete(null)
        }}
        onConfirm={confirmDeleteExpense}
        title='Eliminar gasto'
        message={`¿Estás seguro de que quieres eliminar el gasto "${expenseToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel='Eliminar'
        cancelLabel='Cancelar'
        variant='danger'
      />
    </>
  )
}
