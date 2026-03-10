'use client'

import {
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  DeleteRounded,
  FilterAltRounded,
  FirstPageRounded,
  LastPageRounded,
  MoreHorizRounded,
  SearchRounded
} from '@/components/icons/md3'
import {
  type BudgetTypeData
} from '@/components/pacientes/shared/budgetTypeData'
import { useConfiguration } from '@/context/ConfigurationContext'
import type { ConfigCategory, ConfigDiscount, ConfigTreatment } from '@/types/treatments'
import { useCallback, useMemo, useState } from 'react'
import AddFamilyModal from './AddFamilyModal'
import AddTreatmentModal, { type TreatmentFormData } from './AddTreatmentModal'
import BudgetTypeEditorModal from './BudgetTypeEditorModal'

// Re-export types for consumers that still import from here
export type { ConfigCategory, ConfigDiscount, ConfigTreatment, DiscountType } from '@/types/treatments'

// ============================================
// TYPES
// ============================================

type TabKey = 'treatments' | 'budgetType' | 'discounts'

// Budget type row extends the shared BudgetTypeData with selected state
type BudgetTypeRow = BudgetTypeData & { selected: boolean }

// Keep local aliases for backward compat within this file
type Treatment = ConfigTreatment
type Category = ConfigCategory
type Discount = ConfigDiscount

// ============================================
// DATA
// ============================================

// ============================================
// Discounts, budget types, and treatments are now managed via ConfigurationContext
// (initialCategories mock data removed — all treatments load from service_catalog via ConfigurationContext)


const tabs: { key: TabKey; label: string }[] = [
  { key: 'treatments', label: 'Lista de tratamientos' },
  { key: 'budgetType', label: 'Presupuestos tipo' },
  { key: 'discounts', label: 'Descuentos (convenios)' }
]

// ============================================
// FILTER TAG COMPONENT
// ============================================

function FilterTag({
  label,
  onRemove
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <div className='bg-[var(--color-success-50)] inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full'>
      <button
        type='button'
        onClick={onRemove}
        className='flex items-center justify-center size-5 rounded-full text-[var(--color-success-600)] hover:text-[var(--color-success-700)] hover:bg-[var(--color-success-100)] transition-colors'
        aria-label={`Eliminar filtro ${label}`}
      >
        <CloseRounded className='size-3.5' />
      </button>
      <span className='text-body-sm text-[var(--color-success-600)] leading-none'>
        {label}
      </span>
    </div>
  )
}

// ============================================
// BUDGET TYPE TABLE COMPONENTS
// ============================================

// Grid template for budget types: name | description | count | price | status
const BUDGET_TYPE_GRID_CLASSES =
  'grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] w-full'

function BudgetTypeTableHeader() {
  const headers = [
    'Nombre',
    'Descripción',
    'Nº tratamientos',
    'Precio total',
    'Estado'
  ]

  return (
    <div className={`${BUDGET_TYPE_GRID_CLASSES} sticky top-0 z-10 bg-[var(--color-surface)]`}>
      {headers.map((label, i) => (
        <div
          key={`bt-header-${i}`}
          className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'
        >
          <p className='text-body-sm text-[var(--color-neutral-600)]'>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

function BudgetTypeTableRow({
  budget,
  onToggleSelect
}: {
  budget: BudgetTypeRow
  onToggleSelect: () => void
}) {
  return (
    <div
      className={`${BUDGET_TYPE_GRID_CLASSES} ${
        budget.selected
          ? 'bg-[var(--color-brand-50)]'
          : 'hover:bg-[var(--color-neutral-50)]'
      } transition-colors cursor-pointer`}
      onClick={onToggleSelect}
    >
      {/* Name */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p
          className='text-body-sm font-medium text-[var(--color-neutral-900)] truncate'
          title={budget.name}
        >
          {budget.name}
        </p>
      </div>
      {/* Description */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p
          className='text-body-sm text-[var(--color-neutral-600)] truncate'
          title={budget.description}
        >
          {budget.description}
        </p>
      </div>
      {/* Treatments Count */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)]'>
          {budget.treatments.length}
        </p>
      </div>
      {/* Total Price */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)]'>
          {budget.totalPrice.toLocaleString('es-ES')} €
        </p>
      </div>
      {/* Status */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        {budget.isActive ? (
          <span className='bg-[#D3F7F3] text-[#1E4947] px-2 py-0.5 rounded-sm text-body-sm'>
            Activo
          </span>
        ) : (
          <span className='bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] px-2 py-0.5 rounded-sm text-body-sm'>
            Inactivo
          </span>
        )}
      </div>
    </div>
  )
}

// Selection action bar component
function SelectionActionBar({
  selectedCount,
  onEdit,
  onDuplicate,
  onDelete,
  onMore
}: {
  selectedCount: number
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMore: () => void
}) {
  return (
    <div className='flex items-center'>
      {/* Selected count */}
      <div className='bg-[var(--color-brand-0)] border-[0.5px] border-[var(--color-brand-200)] flex items-center justify-center px-2 py-1 rounded-l'>
        <span className='text-body-sm text-[var(--color-brand-700)]'>
          {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
        </span>
      </div>
      {/* Edit */}
      <button
        type='button'
        onClick={onEdit}
        className='bg-[var(--color-neutral-50)] border-y-[0.5px] border-r-[0.5px] border-[var(--color-neutral-300)] flex items-center justify-center px-2 py-1 hover:bg-[var(--color-neutral-100)] transition-colors'
      >
        <span className='text-body-sm text-[var(--color-neutral-700)]'>
          Editar
        </span>
      </button>
      {/* Duplicate */}
      <button
        type='button'
        onClick={onDuplicate}
        className='bg-[var(--color-neutral-50)] border-y-[0.5px] border-r-[0.5px] border-[var(--color-neutral-300)] flex items-center justify-center px-2 py-1 hover:bg-[var(--color-neutral-100)] transition-colors'
      >
        <span className='text-body-sm text-[var(--color-neutral-700)]'>
          Duplicar
        </span>
      </button>
      {/* Delete */}
      <button
        type='button'
        onClick={onDelete}
        className='bg-[var(--color-neutral-50)] border-y-[0.5px] border-r-[0.5px] border-[var(--color-neutral-300)] flex items-center justify-center px-2 py-1 hover:bg-[var(--color-neutral-100)] transition-colors'
      >
        <DeleteRounded className='size-5 text-[var(--color-neutral-700)]' />
      </button>
      {/* More */}
      <button
        type='button'
        onClick={onMore}
        className='bg-[var(--color-neutral-50)] border-y-[0.5px] border-r-[0.5px] border-[var(--color-neutral-300)] flex items-center justify-center px-2 py-1 rounded-r hover:bg-[var(--color-neutral-100)] transition-colors'
      >
        <MoreHorizRounded className='size-5 text-[var(--color-neutral-700)]' />
      </button>
    </div>
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
  const renderPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      if (!pages.includes(totalPages)) pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className='flex items-center gap-3'>
      {/* First & Previous */}
      <div className='flex items-center'>
        <button
          type='button'
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className='size-6 flex items-center justify-center text-[var(--color-neutral-600)] disabled:opacity-40 hover:text-[var(--color-neutral-900)] transition-colors'
          aria-label='Primera página'
        >
          <FirstPageRounded className='size-6' />
        </button>
        <button
          type='button'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='size-6 flex items-center justify-center text-[var(--color-neutral-600)] disabled:opacity-40 hover:text-[var(--color-neutral-900)] transition-colors'
          aria-label='Página anterior'
        >
          <ChevronLeftRounded className='size-6' />
        </button>
      </div>
      {/* Page Numbers */}
      <div className='flex items-center gap-2'>
        {renderPageNumbers().map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={idx}
              type='button'
              onClick={() => onPageChange(page)}
              className={`text-sm ${
                page === currentPage
                  ? 'font-bold underline text-[var(--color-neutral-900)]'
                  : 'font-normal text-[var(--color-neutral-900)] hover:underline'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className='text-sm text-[var(--color-neutral-900)]'>
              {page}
            </span>
          )
        )}
      </div>
      {/* Next & Last */}
      <div className='flex items-center'>
        <button
          type='button'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='size-6 flex items-center justify-center text-[var(--color-neutral-600)] disabled:opacity-40 hover:text-[var(--color-neutral-900)] transition-colors'
          aria-label='Página siguiente'
        >
          <ChevronRightRounded className='size-6' />
        </button>
        <button
          type='button'
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className='size-6 flex items-center justify-center text-[var(--color-neutral-600)] disabled:opacity-40 hover:text-[var(--color-neutral-900)] transition-colors'
          aria-label='Última página'
        >
          <LastPageRounded className='size-6' />
        </button>
      </div>
    </div>
  )
}

// ============================================
// NOTES CELL - Hover to preview, click to edit
// ============================================

function NotesCell({
  value,
  onChange
}: {
  value: string
  onChange: (newValue: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isHovered, setIsHovered] = useState(false)

  const handleOpen = () => {
    setDraft(value)
    setIsEditing(true)
  }

  const handleSave = () => {
    onChange(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  return (
    <div
      className='relative flex items-center border-b border-neutral-200 px-2 py-2 min-h-[3.5rem] min-w-0 cursor-pointer'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpen}
    >
      <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
        {value || <span className='italic text-[var(--color-neutral-400)]'>Añadir nota...</span>}
      </p>

      {/* Hover preview card */}
      {isHovered && !isEditing && value && (
        <div className='absolute left-0 top-full mt-1 z-30 w-[min(20rem,90vw)] rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] p-3 shadow-lg'>
          <p className='text-body-sm italic text-[var(--color-neutral-600)] whitespace-pre-wrap'>
            {value}
          </p>
        </div>
      )}

      {/* Edit popover */}
      {isEditing && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={(e) => {
              e.stopPropagation()
              handleCancel()
            }}
          />
          <div
            className='absolute left-0 top-full mt-1 z-50 w-[min(22rem,90vw)] rounded-lg bg-[var(--color-surface)] border border-[var(--color-neutral-300)] shadow-xl'
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='Escribe una nota...'
              rows={4}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel()
                if (e.key === 'Enter' && e.metaKey) handleSave()
              }}
              className='w-full rounded-t-lg border-0 bg-transparent px-3 py-3 text-body-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] outline-none resize-none'
            />
            <div className='flex items-center justify-between border-t border-[var(--color-neutral-200)] px-3 py-2'>
              <span className='text-[0.6875rem] text-[var(--color-neutral-400)]'>
                ⌘ Enter para guardar
              </span>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='px-3 py-1 rounded-full text-body-sm text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)] transition-colors'
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  onClick={handleSave}
                  className='px-3 py-1 rounded-full bg-[var(--color-brand-500)] text-body-sm font-medium text-[var(--color-brand-900)] hover:bg-[var(--color-brand-400)] transition-colors'
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// DISCOUNTS TABLE COMPONENTS
// ============================================

// Grid template for discounts: name | type | value | notes | status
const DISCOUNTS_GRID_CLASSES =
  'grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,0.6fr)] w-full'

function DiscountsTableHeader() {
  const headers = [
    'Nombre de descuento',
    'Tipo de descuento',
    'Valor',
    'Notas',
    'Estado'
  ]

  return (
    <div className={`${DISCOUNTS_GRID_CLASSES} sticky top-0 z-10 bg-[var(--color-surface)]`}>
      {headers.map((label, i) => (
        <div
          key={`disc-header-${i}`}
          className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'
        >
          <p className='text-body-sm text-[var(--color-neutral-600)]'>
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}

function DiscountsTableRow({
  discount,
  onNotesChange
}: {
  discount: Discount
  onNotesChange: (newNotes: string) => void
}) {
  return (
    <div
      className={`${DISCOUNTS_GRID_CLASSES} hover:bg-[var(--color-neutral-50)] transition-colors`}
    >
      {/* Name */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p
          className='text-body-sm font-medium text-[var(--color-neutral-900)] truncate'
          title={discount.name}
        >
          {discount.name}
        </p>
      </div>
      {/* Type */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)]'>
          {discount.type === 'percentage' ? '%' : 'Precio fijo'}
        </p>
      </div>
      {/* Value */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)]'>
          {discount.type === 'percentage'
            ? `${discount.value}%`
            : `${discount.value}€`}
        </p>
      </div>
      {/* Notes */}
      <NotesCell value={discount.notes || ''} onChange={onNotesChange} />
      {/* Status */}
      <div className='flex items-center border-b border-neutral-200 px-3 py-2 h-10 min-w-0'>
        {discount.isActive ? (
          <span className='bg-[#E0F2FE] text-[#075985] px-2 py-0.5 rounded-sm text-body-sm'>
            Activo
          </span>
        ) : (
          <span className='bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] px-2 py-0.5 rounded-sm text-body-sm'>
            Inactivo
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================
// TABLE COMPONENTS
// ============================================

// Grid template: checkbox(fixed) | code(flex) | name(flex) | price(flex) | time(flex)
// Note: IVA column hidden but data maintained internally for invoicing (dental=0%, estética=10%)
const TABLE_GRID_CLASSES =
  'grid grid-cols-[2.5rem_0.8fr_2fr_0.8fr_1fr] w-full'

function TableHeader() {
  return (
    <div className={`${TABLE_GRID_CLASSES} sticky top-0 z-10 bg-[var(--color-surface)]`}>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]' />
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Código
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Nombre del tratamiento
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Precio base
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Tiempo estimado
        </p>
      </div>
    </div>
  )
}

function TableRow({
  treatment,
  onToggle,
  onRowClick
}: {
  treatment: Treatment
  onToggle: () => void
  onRowClick: () => void
}) {
  return (
    <div
      className={`${TABLE_GRID_CLASSES} min-h-[3.5rem] cursor-pointer transition-colors ${
        treatment.selected
          ? 'bg-[var(--color-brand-50)] border-l-2 border-l-[var(--color-brand-500)]'
          : 'hover:bg-[var(--color-neutral-50)] border-l-2 border-l-transparent'
      }`}
      onClick={onRowClick}
      role='row'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onRowClick()
      }}
    >
      <div
        className='flex items-center border-b border-neutral-200 px-2 py-2'
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type='checkbox'
          checked={treatment.selected}
          onChange={onToggle}
          className='size-4 accent-[var(--color-brand-500)] cursor-pointer'
          aria-label={`Seleccionar ${treatment.name}`}
        />
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {treatment.code}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p
          className='text-body-sm font-medium text-[var(--color-neutral-900)] truncate'
          title={treatment.name}
        >
          {treatment.name}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {treatment.basePrice}€
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {treatment.estimatedTime}
        </p>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TreatmentsPage() {
  // Use ConfigurationContext for shared state
  const {
    treatmentCategories: categories,
    setTreatmentCategories: setCategories,
    discounts,
    setDiscounts,
    addDiscount: addDiscountCtx,
    updateDiscount: updateDiscountCtx,
    deleteDiscount: deleteDiscountCtx,
    budgetTypes: budgetTypesFromCtx,
    setBudgetTypes: setBudgetTypesCtx,
    addBudgetType: addBudgetTypeCtx,
    updateBudgetType: updateBudgetTypeCtx,
    deleteBudgetType: deleteBudgetTypeCtx,
    addTreatmentToDb,
    updateTreatmentInDb,
    addCategoryToDb
  } = useConfiguration()

  const [activeTab, setActiveTab] = useState<TabKey>('treatments')
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>('estetica')
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddTreatment, setShowAddTreatment] = useState(false)
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null)
  const [showAddFamily, setShowAddFamily] = useState(false)

  // Budget Types state - derive from context, add local 'selected' state
  const [budgetTypeSelections, setBudgetTypeSelections] = useState<Record<string, boolean>>({})
  const budgetTypes: BudgetTypeRow[] = useMemo(
    () => budgetTypesFromCtx.map((bt) => ({ ...bt, selected: budgetTypeSelections[bt.id] || false })),
    [budgetTypesFromCtx, budgetTypeSelections]
  )
  const setBudgetTypes = useCallback((rows: BudgetTypeRow[]) => {
    // Update context with core data (without 'selected')
    setBudgetTypesCtx(rows.map(({ selected, ...rest }) => rest))
    // Update local selection state
    const selections: Record<string, boolean> = {}
    rows.forEach((r) => { selections[r.id] = r.selected })
    setBudgetTypeSelections(selections)
  }, [setBudgetTypesCtx])

  const [qbSearchVisible, setQbSearchVisible] = useState(false)
  const [qbSearchTerm, setQbSearchTerm] = useState('')
  const [qbCurrentPage, setQbCurrentPage] = useState(1)
  const qbItemsPerPage = 5

  // Budget Type Editor Modal state
  const [showBudgetTypeEditor, setShowBudgetTypeEditor] = useState(false)
  const [editingBudgetType, setEditingBudgetType] =
    useState<BudgetTypeData | null>(null)
  const [discSearchVisible, setDiscSearchVisible] = useState(false)
  const [discSearchTerm, setDiscSearchTerm] = useState('')
  const [discCurrentPage, setDiscCurrentPage] = useState(1)
  const discItemsPerPage = 5

  // Get current category
  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  // Get selected treatments for filter tags
  const selectedTreatments = useMemo(() => {
    return categories.flatMap((c) => c.treatments).filter((t) => t.selected)
  }, [categories])

  // Filter treatments by search term
  const filteredTreatments = useMemo(() => {
    if (!currentCategory) return []
    if (!searchTerm.trim()) return currentCategory.treatments
    const term = searchTerm.toLowerCase()
    return currentCategory.treatments.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term)
    )
  }, [currentCategory, searchTerm])

  // Toggle treatment selection
  const toggleTreatment = useCallback((treatmentId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        treatments: category.treatments.map((t) =>
          t.id === treatmentId ? { ...t, selected: !t.selected } : t
        )
      }))
    )
  }, [])

  // Remove filter tag
  const removeFilter = useCallback((treatmentId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        treatments: category.treatments.map((t) =>
          t.id === treatmentId ? { ...t, selected: false } : t
        )
      }))
    )
  }, [])

  // All existing treatment codes across all categories (for uniqueness check)
  const allExistingCodes = useMemo(
    () => categories.flatMap((c) => c.treatments.map((t) => t.code)),
    [categories]
  )

  // Add treatment to current category (with DB persistence)
  const handleAddTreatment = useCallback(
    async (data: TreatmentFormData) => {
      const categoryName = currentCategory?.name || 'General'
      const dbId = await addTreatmentToDb(
        {
          name: data.name,
          code: data.code,
          basePrice: parseFloat(data.basePrice) || 0,
          estimatedTime: data.estimatedTime,
          iva: data.iva
        },
        categoryName
      )
      const newTreatment: Treatment = {
        id: dbId || `treat-${Date.now()}`,
        name: data.name,
        code: data.code,
        basePrice: parseFloat(data.basePrice) || 0,
        estimatedTime: data.estimatedTime,
        iva: data.iva,
        selected: false
      }
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategoryId
            ? { ...cat, treatments: [...cat.treatments, newTreatment] }
            : cat
        )
      )
      setShowAddTreatment(false)
    },
    [selectedCategoryId, setCategories, currentCategory, addTreatmentToDb]
  )

  // Create new family/category
  const handleAddFamily = useCallback(
    async (familyName: string) => {
      await addCategoryToDb(familyName)
      const slugCatId = (v: string) =>
        v
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      setSelectedCategoryId(slugCatId(familyName) || 'general')
      setShowAddFamily(false)
    },
    [addCategoryToDb]
  )

  // Open edit modal when clicking a treatment row
  const handleTreatmentRowClick = useCallback((treatmentId: string) => {
    setEditingTreatmentId(treatmentId)
    setShowAddTreatment(true)
  }, [])

  // Find the treatment being edited and its current category
  const editingTreatment = useMemo(() => {
    if (!editingTreatmentId) return null
    for (const cat of categories) {
      const t = cat.treatments.find((tr) => tr.id === editingTreatmentId)
      if (t) return { ...t, categoryName: cat.name }
    }
    return null
  }, [editingTreatmentId, categories])

  // Edit treatment handler (with DB persistence)
  const handleEditTreatment = useCallback(
    async (data: TreatmentFormData) => {
      if (!editingTreatmentId) return

      const newCategoryName = data.category || editingTreatment?.categoryName
      const ok = await updateTreatmentInDb(editingTreatmentId, {
        name: data.name,
        code: data.code,
        basePrice: parseFloat(data.basePrice) || 0,
        estimatedTime: data.estimatedTime,
        iva: data.iva,
        category: newCategoryName
      })

      if (!ok) {
        console.warn('No se pudo guardar el tratamiento')
        return
      }

      const updatedTreatment: Treatment = {
        id: editingTreatmentId,
        name: data.name,
        code: data.code,
        basePrice: parseFloat(data.basePrice) || 0,
        estimatedTime: data.estimatedTime,
        iva: data.iva,
        selected: false
      }

      const oldCategoryName = editingTreatment?.categoryName
      const categoryChanged = newCategoryName && newCategoryName !== oldCategoryName

      if (categoryChanged) {
        // Move treatment from old category to new category
        const slugCatId = (name: string) =>
          name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')
        const newCatId = slugCatId(newCategoryName)
        setCategories((prev) =>
          prev.map((cat) => {
            if (cat.treatments.some((t) => t.id === editingTreatmentId)) {
              // Remove from old category
              return { ...cat, treatments: cat.treatments.filter((t) => t.id !== editingTreatmentId) }
            }
            if (cat.id === newCatId || cat.name === newCategoryName) {
              // Add to new category
              return { ...cat, treatments: [...cat.treatments, updatedTreatment] }
            }
            return cat
          })
        )
      } else {
        // Update in-place
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            treatments: cat.treatments.map((t) =>
              t.id === editingTreatmentId ? updatedTreatment : t
            )
          }))
        )
      }

      setShowAddTreatment(false)
      setEditingTreatmentId(null)
    },
    [editingTreatmentId, editingTreatment, setCategories, updateTreatmentInDb]
  )

  // ============================================
  // BUDGET TYPES FUNCTIONS
  // ============================================

  // Get selected budget types
  const selectedBudgetTypes = useMemo(() => {
    return budgetTypes.filter((bt) => bt.selected)
  }, [budgetTypes])

  // Filter budget types by search term
  const filteredBudgetTypes = useMemo(() => {
    if (!qbSearchTerm.trim()) return budgetTypes
    const term = qbSearchTerm.toLowerCase()
    return budgetTypes.filter(
      (bt) =>
        bt.name.toLowerCase().includes(term) ||
        bt.description.toLowerCase().includes(term)
    )
  }, [budgetTypes, qbSearchTerm])

  // Paginated budget types
  const paginatedBudgetTypes = useMemo(() => {
    const startIndex = (qbCurrentPage - 1) * qbItemsPerPage
    return filteredBudgetTypes.slice(startIndex, startIndex + qbItemsPerPage)
  }, [filteredBudgetTypes, qbCurrentPage, qbItemsPerPage])

  // Total pages for budget types
  const qbTotalPages = useMemo(() => {
    return Math.ceil(filteredBudgetTypes.length / qbItemsPerPage)
  }, [filteredBudgetTypes.length, qbItemsPerPage])

  // Toggle budget type selection (only updates local selection state, not context)
  const toggleBudgetTypeSelect = useCallback((budgetId: string) => {
    setBudgetTypeSelections((prev) => ({
      ...prev,
      [budgetId]: !prev[budgetId]
    }))
  }, [])

  // Budget type actions
  const handleBtEdit = useCallback(() => {
    if (selectedBudgetTypes.length === 1) {
      const budgetToEdit = selectedBudgetTypes[0]
      // Remove the selected property for editing
      const { selected, ...budgetData } = budgetToEdit
      setEditingBudgetType(budgetData)
      setShowBudgetTypeEditor(true)
    }
  }, [selectedBudgetTypes])

  const handleBtDuplicate = useCallback(() => {
    selectedBudgetTypes.forEach((bt) => {
      const { id, selected, ...rest } = bt
      addBudgetTypeCtx({
        ...rest,
        name: `${bt.name} (copia)`
      })
    })
  }, [selectedBudgetTypes, addBudgetTypeCtx])

  const handleBtDelete = useCallback(() => {
    selectedBudgetTypes.forEach((bt) => {
      deleteBudgetTypeCtx(bt.id)
    })
  }, [selectedBudgetTypes, deleteBudgetTypeCtx])

  const handleBtMore = useCallback(() => {
    console.log(
      'More options for:',
      selectedBudgetTypes.map((bt) => bt.id)
    )
    // TODO: Implement more options dropdown
  }, [selectedBudgetTypes])

  const handleAddTemplate = useCallback(() => {
    setEditingBudgetType(null)
    setShowBudgetTypeEditor(true)
  }, [])

  // Handle save from editor modal
  const handleSaveBudgetType = useCallback(
    (budgetTypeData: Omit<BudgetTypeData, 'id'> | BudgetTypeData) => {
      if ('id' in budgetTypeData && budgetTypeData.id) {
        // Update existing via context
        updateBudgetTypeCtx(budgetTypeData.id, budgetTypeData)
      } else {
        // Create new via context
        addBudgetTypeCtx(budgetTypeData as Omit<BudgetTypeData, 'id'>)
      }
      setShowBudgetTypeEditor(false)
      setEditingBudgetType(null)
    },
    [addBudgetTypeCtx, updateBudgetTypeCtx]
  )

  // ============================================
  // DISCOUNTS FUNCTIONS
  // ============================================

  // Filter discounts by search term
  const filteredDiscounts = useMemo(() => {
    if (!discSearchTerm.trim()) return discounts
    const term = discSearchTerm.toLowerCase()
    return discounts.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.notes.toLowerCase().includes(term)
    )
  }, [discounts, discSearchTerm])

  // Paginated discounts
  const paginatedDiscounts = useMemo(() => {
    const startIndex = (discCurrentPage - 1) * discItemsPerPage
    return filteredDiscounts.slice(startIndex, startIndex + discItemsPerPage)
  }, [filteredDiscounts, discCurrentPage, discItemsPerPage])

  // Total pages for discounts
  const discTotalPages = useMemo(() => {
    return Math.ceil(filteredDiscounts.length / discItemsPerPage)
  }, [filteredDiscounts.length, discItemsPerPage])

  // Update discount notes
  const handleDiscountNotesChange = useCallback(
    (discountId: string, newNotes: string) => {
      updateDiscountCtx(discountId, { notes: newNotes })
    },
    [updateDiscountCtx]
  )

  // Add new discount
  const handleAddDiscount = useCallback(() => {
    addDiscountCtx({
      name: 'Nuevo descuento',
      type: 'percentage',
      value: 10,
      notes: '',
      isActive: true
    })
  }, [addDiscountCtx])


  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Tratamientos, precios, presupuestos y descuentos
        </p>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-hidden flex flex-col'>
          {/* Tabs */}
          <div className='flex-none bg-[var(--color-surface)] px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-2 min-h-[min(4rem,6vh)]'>
            <div className='flex gap-6 items-center overflow-x-auto'>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type='button'
                  onClick={() => setActiveTab(tab.key)}
                  className={`p-2 border-b transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-[var(--color-brand-500)]'
                      : 'border-transparent'
                  }`}
                >
                  <p
                    className={`text-title-sm font-medium ${
                      activeTab === tab.key
                        ? 'text-[var(--color-neutral-900)]'
                        : 'text-[var(--color-neutral-600)]'
                    }`}
                  >
                    {tab.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'treatments' ? (
            <div className='flex flex-1 min-h-0 mt-[min(1.5rem,2vh)] pb-[min(1.5rem,2vh)]'>
              {/* Categories Sidebar */}
              <aside className='w-[min(11.5rem,18vw)] flex-none min-h-0 self-stretch flex flex-col border border-neutral-200 rounded-lg ml-[min(2.5rem,3vw)] mr-[min(1.5rem,2vw)]'>
                <nav className='flex flex-col flex-1 min-h-0 overflow-y-auto'>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type='button'
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={[
                        'text-left px-[0.625rem] py-[0.625rem] h-12 transition-colors shrink-0',
                        selectedCategoryId === category.id
                          ? 'bg-[var(--color-neutral-200)] text-body-md font-medium text-[var(--color-neutral-900)]'
                          : 'bg-[var(--color-surface)] text-body-md font-normal text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]'
                      ].join(' ')}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
                <button
                  type='button'
                  onClick={() => setShowAddFamily(true)}
                  className='flex items-center gap-1.5 px-[0.625rem] py-[0.625rem] h-12 shrink-0 text-body-md font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] transition-colors border-t border-neutral-200'
                >
                  <AddRounded className='size-5' />
                  Crear familia
                </button>
              </aside>

              {/* Treatments Content */}
              <div className='flex-1 flex flex-col min-w-0 min-h-0 pr-[min(2.5rem,3vw)] overflow-hidden'>
                {/* Category Header */}
                <div className='flex-none flex items-center justify-between mb-4'>
                  <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                    {currentCategory?.name || ''}
                  </p>
                  <div className='flex items-center gap-2'>
                    {/* Search */}
                    {searchVisible ? (
                      <div className='relative'>
                        <input
                          type='search'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder='Buscar tratamientos...'
                          aria-label='Buscar tratamientos'
                          className='h-8 w-40 rounded-full px-3 pr-8 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                          autoFocus
                        />
                        <button
                          type='button'
                          onClick={() => {
                            setSearchVisible(false)
                            setSearchTerm('')
                          }}
                          className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)]'
                        >
                          <CloseRounded className='size-4' />
                        </button>
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => setSearchVisible(true)}
                        className='p-1 hover:bg-neutral-100 rounded transition-colors'
                        aria-label='Buscar'
                      >
                        <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                      </button>
                    )}
                    {/* Filter */}
                    <button
                      type='button'
                      className='flex items-center gap-[0.125rem] px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                    >
                      <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                      <span className='text-body-sm text-[var(--color-neutral-700)]'>
                        Todos
                      </span>
                    </button>
                    {/* Add Treatment */}
                    <button
                      type='button'
                      onClick={() => setShowAddTreatment(true)}
                      className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors'
                    >
                      <AddRounded className='size-6 text-[var(--color-neutral-900)]' />
                      <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                        Añadir Tratamiento
                      </span>
                    </button>
                  </div>
                </div>

                {/* Filter Tags */}
                {selectedTreatments.length > 0 && (
                  <div className='flex-none flex flex-wrap gap-2 mb-4'>
                    {selectedTreatments.map((t) => (
                      <FilterTag
                        key={t.id}
                        label={t.name}
                        onRemove={() => removeFilter(t.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Treatments Table */}
                <div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden'>
                  <TableHeader />
                  {filteredTreatments.map((treatment) => (
                    <TableRow
                      key={treatment.id}
                      treatment={treatment}
                      onToggle={() => toggleTreatment(treatment.id)}
                      onRowClick={() => handleTreatmentRowClick(treatment.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'budgetType' ? (
            <div className='flex-1 flex flex-col min-h-0 mt-[min(1.5rem,2vh)] pb-[min(1.5rem,2vh)] px-[min(2.5rem,3vw)]'>
              {/* Action Bar */}
              <div className='flex-none flex items-end justify-between mb-6'>
                {/* Selection Actions */}
                {selectedBudgetTypes.length > 0 ? (
                  <SelectionActionBar
                    selectedCount={selectedBudgetTypes.length}
                    onEdit={handleBtEdit}
                    onDuplicate={handleBtDuplicate}
                    onDelete={handleBtDelete}
                    onMore={handleBtMore}
                  />
                ) : (
                  <div />
                )}

                {/* Right Actions */}
                <div className='flex items-center gap-2'>
                  {/* Search */}
                  {qbSearchVisible ? (
                    <div className='relative'>
                      <input
                        type='search'
                        value={qbSearchTerm}
                        onChange={(e) => {
                          setQbSearchTerm(e.target.value)
                          setQbCurrentPage(1)
                        }}
                        placeholder='Buscar paquetes...'
                        aria-label='Buscar paquetes de presupuesto'
                        className='h-8 w-40 rounded-full px-3 pr-8 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                        autoFocus
                      />
                      <button
                        type='button'
                        onClick={() => {
                          setQbSearchVisible(false)
                          setQbSearchTerm('')
                        }}
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)]'
                      >
                        <CloseRounded className='size-4' />
                      </button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => setQbSearchVisible(true)}
                      className='p-1 hover:bg-neutral-100 rounded transition-colors'
                      aria-label='Buscar'
                    >
                      <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                    </button>
                  )}
                  {/* Filter */}
                  <button
                    type='button'
                    className='flex items-center gap-[0.125rem] px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                  >
                    <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                    <span className='text-body-sm text-[var(--color-neutral-700)]'>
                      Todos
                    </span>
                  </button>
                  {/* Add Template */}
                  <button
                    type='button'
                    onClick={handleAddTemplate}
                    className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-neutral-50)] hover:bg-neutral-100 transition-colors'
                  >
                    <AddRounded className='size-6 text-[var(--color-neutral-900)]' />
                    <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                      Añadir plantilla
                    </span>
                  </button>
                </div>
              </div>

              {/* Budget Types Table */}
              <div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden'>
                <BudgetTypeTableHeader />
                {paginatedBudgetTypes.map((budget) => (
                  <BudgetTypeTableRow
                    key={budget.id}
                    budget={budget}
                    onToggleSelect={() => toggleBudgetTypeSelect(budget.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {qbTotalPages > 1 && (
                <div className='flex-none flex justify-end mt-6'>
                  <Pagination
                    currentPage={qbCurrentPage}
                    totalPages={qbTotalPages}
                    onPageChange={setQbCurrentPage}
                  />
                </div>
              )}
            </div>
          ) : activeTab === 'discounts' ? (
            <div className='flex-1 flex flex-col min-h-0 mt-[min(1.5rem,2vh)] pb-[min(1.5rem,2vh)] px-[min(2.5rem,3vw)]'>
              {/* Action Bar */}
              <div className='flex-none flex items-end justify-between mb-6'>
                {/* Results Counter */}
                <p className='text-label-sm text-[var(--color-neutral-500)]'>
                  {filteredDiscounts.length} Resultados totales
                </p>

                {/* Right Actions */}
                <div className='flex items-center gap-2'>
                  {/* Search */}
                  {discSearchVisible ? (
                    <div className='relative'>
                      <input
                        type='search'
                        value={discSearchTerm}
                        onChange={(e) => {
                          setDiscSearchTerm(e.target.value)
                          setDiscCurrentPage(1)
                        }}
                        placeholder='Buscar descuentos...'
                        aria-label='Buscar descuentos'
                        className='h-8 w-40 rounded-full px-3 pr-8 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                        autoFocus
                      />
                      <button
                        type='button'
                        onClick={() => {
                          setDiscSearchVisible(false)
                          setDiscSearchTerm('')
                        }}
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)]'
                      >
                        <CloseRounded className='size-4' />
                      </button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => setDiscSearchVisible(true)}
                      className='p-1 hover:bg-neutral-100 rounded transition-colors'
                      aria-label='Buscar'
                    >
                      <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                    </button>
                  )}
                  {/* Filter */}
                  <button
                    type='button'
                    className='flex items-center gap-[0.125rem] px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                  >
                    <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                    <span className='text-body-sm text-[var(--color-neutral-700)]'>
                      Todos
                    </span>
                  </button>
                  {/* Add Discount */}
                  <button
                    type='button'
                    onClick={handleAddDiscount}
                    className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-neutral-50)] hover:bg-neutral-100 transition-colors'
                  >
                    <AddRounded className='size-6 text-[var(--color-neutral-900)]' />
                    <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                      Añadir descuento
                    </span>
                  </button>
                </div>
              </div>

              {/* Discounts Table */}
              <div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden'>
                <DiscountsTableHeader />
                {paginatedDiscounts.map((discount) => (
                  <DiscountsTableRow
                    key={discount.id}
                    discount={discount}
                    onNotesChange={(newNotes) => handleDiscountNotesChange(discount.id, newNotes)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {discTotalPages > 1 && (
                <div className='flex-none flex justify-end mt-6'>
                  <Pagination
                    currentPage={discCurrentPage}
                    totalPages={discTotalPages}
                    onPageChange={setDiscCurrentPage}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Budget Type Editor Modal */}
      <BudgetTypeEditorModal
        open={showBudgetTypeEditor}
        onClose={() => {
          setShowBudgetTypeEditor(false)
          setEditingBudgetType(null)
        }}
        onSave={handleSaveBudgetType}
        editingBudgetType={editingBudgetType}
      />

      {/* Add/Edit Treatment Modal */}
      <AddTreatmentModal
        open={showAddTreatment}
        onClose={() => {
          setShowAddTreatment(false)
          setEditingTreatmentId(null)
        }}
        onSubmit={editingTreatmentId ? handleEditTreatment : handleAddTreatment}
        title={editingTreatmentId ? 'Editar tratamiento' : 'Nuevo tratamiento'}
        submitLabel={editingTreatmentId ? 'Guardar cambios' : 'Añadir tratamiento'}
        categoryName={editingTreatmentId ? undefined : currentCategory?.name}
        existingCodes={allExistingCodes}
        initialData={
          editingTreatment
            ? {
                name: editingTreatment.name,
                code: editingTreatment.code,
                basePrice: String(editingTreatment.basePrice),
                estimatedTime: editingTreatment.estimatedTime,
                iva: editingTreatment.iva,
                category: editingTreatment.categoryName
              }
            : undefined
        }
        categories={editingTreatmentId ? categories.map((c) => ({ id: c.id, name: c.name })) : undefined}
      />

      {/* Add Family Modal */}
      <AddFamilyModal
        open={showAddFamily}
        onClose={() => setShowAddFamily(false)}
        onSubmit={handleAddFamily}
        existingNames={categories.map((c) => c.name)}
      />
    </>
  )
}
