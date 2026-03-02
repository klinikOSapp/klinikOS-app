'use client'

import {
  AddRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  CloseRounded,
  DeleteRounded,
  FilterAltRounded,
  FirstPageRounded,
  LastPageRounded,
  MoreHorizRounded,
  SearchRounded
} from '@/components/icons/md3'
import { type BudgetTypeData } from '@/components/pacientes/shared/budgetTypeData'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AddTreatmentModal, { type TreatmentFormData } from './AddTreatmentModal'
import BudgetTypeEditorModal from './BudgetTypeEditorModal'

// ============================================
// TYPES
// ============================================

type Treatment = {
  id: string
  name: string
  code: string
  basePrice: number
  estimatedTime: string
  iva: string
  selected: boolean
}

type Category = {
  id: string
  name: string
  treatments: Treatment[]
}

type TabKey = 'treatments' | 'budgetType' | 'discounts' | 'medications'

// Budget type row extends the shared BudgetTypeData with selected state
type BudgetTypeRow = BudgetTypeData & { selected: boolean }

type DiscountType = 'percentage' | 'fixed'

type Discount = {
  id: string
  name: string
  type: DiscountType
  value: number
  notes: string
  isActive: boolean
}

type ServiceCatalogRow = {
  id: number
  name: string
  treatment_code: string | null
  standard_price: number | string
  category: string | null
  default_duration_minutes: number | null
  organization_id?: string | null
}

function slugCategoryId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toCategoryLabel(value: unknown): string {
  if (typeof value !== 'string') return 'General'
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'General'
}

function frequencyToDurationText(minutes?: number | null): string {
  if (!minutes || !Number.isFinite(minutes)) return '-'
  return `${minutes} min`
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'treatments', label: 'Lista de tratamientos' },
  { key: 'budgetType', label: 'Presupuestos tipo' },
  { key: 'discounts', label: 'Descuentos (convenios)' },
  { key: 'medications', label: 'Medicamentos con autoguardado' }
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
    <div className={BUDGET_TYPE_GRID_CLASSES}>
      {headers.map((label, i) => (
        <div
          key={`bt-header-${i}`}
          className='flex items-center border-b border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'
        >
          <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
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
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p
          className='text-body-md text-[var(--color-neutral-900)] truncate'
          title={budget.name}
        >
          {budget.name}
        </p>
      </div>
      {/* Description */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p
          className='text-body-md text-[var(--color-neutral-600)] truncate'
          title={budget.description}
        >
          {budget.description}
        </p>
      </div>
      {/* Treatments Count */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          {budget.treatments.length}
        </p>
      </div>
      {/* Total Price */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          {budget.totalPrice.toLocaleString('es-ES')} €
        </p>
      </div>
      {/* Status */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] px-2 py-1.5 h-[2.5rem] min-w-0'>
        {budget.isActive ? (
          <span className='bg-[#D3F7F3] text-[#1E4947] px-2 py-0.5 rounded text-body-md'>
            Activo
          </span>
        ) : (
          <span className='bg-[var(--color-neutral-200)] text-[var(--color-neutral-600)] px-2 py-0.5 rounded text-body-md'>
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
    <div className={DISCOUNTS_GRID_CLASSES}>
      {headers.map((label, i) => (
        <div
          key={`disc-header-${i}`}
          className='flex items-center border-b border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'
        >
          <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
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
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p
          className='text-body-md text-[var(--color-neutral-900)] truncate'
          title={discount.name}
        >
          {discount.name}
        </p>
      </div>
      {/* Type */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          {discount.type === 'percentage' ? '%' : 'Precio fijo'}
        </p>
      </div>
      {/* Value */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] p-2 h-[2.5rem] min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          {discount.type === 'percentage'
            ? `${discount.value}%`
            : `${discount.value}€`}
        </p>
      </div>
      {/* Notes */}
      <NotesCell value={discount.notes || ''} onChange={onNotesChange} />
      {/* Status */}
      <div className='flex items-center border-b border-r border-[var(--color-neutral-300)] px-2 py-1.5 h-[2.5rem] min-w-0'>
        {discount.isActive ? (
          <span className='bg-[#E0F2FE] text-[#075985] px-2 py-0.5 rounded text-body-md'>
            Activo
          </span>
        ) : (
          <span className='bg-[var(--color-neutral-300)] text-[var(--color-neutral-900)] px-2 py-0.5 rounded text-body-md'>
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
  onToggle
}: {
  treatment: Treatment
  onToggle: () => void
}) {
  return (
    <div
      className={`${TABLE_GRID_CLASSES} min-h-[3.5rem] cursor-pointer transition-colors ${
        treatment.selected
          ? 'bg-[var(--color-brand-50)] border-l-2 border-l-[var(--color-brand-500)]'
          : 'hover:bg-[var(--color-neutral-50)] border-l-2 border-l-transparent'
      }`}
    >
      {/* Checkbox */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10'>
        <button
          type='button'
          onClick={onToggle}
          className='text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors'
          aria-label={
            treatment.selected
              ? `Deseleccionar ${treatment.name}`
              : `Seleccionar ${treatment.name}`
          }
        >
          {treatment.selected ? (
            <CheckBoxRounded className='size-[1.125rem]' />
          ) : (
            <CheckBoxOutlineBlankRounded className='size-[1.125rem]' />
          )}
        </button>
      </div>
      {/* Code */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {treatment.code}
        </p>
      </div>
      {/* Name */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p
          className='text-body-md text-[var(--color-neutral-900)] truncate'
          title={treatment.name}
        >
          {treatment.name}
        </p>
      </div>
      {/* Price */}
      <div className='flex items-center border-b border-r border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {treatment.basePrice}€
        </p>
      </div>
      {/* Estimated Time */}
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-10 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
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
  const { activeClinicId } = useClinic()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [activeTab, setActiveTab] = useState<TabKey>('treatments')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddTreatment, setShowAddTreatment] = useState(false)

  // Budget Types state
  const [budgetTypes, setBudgetTypes] = useState<BudgetTypeRow[]>([])
  const [qbSearchVisible, setQbSearchVisible] = useState(false)
  const [qbSearchTerm, setQbSearchTerm] = useState('')
  const [qbCurrentPage, setQbCurrentPage] = useState(1)
  const qbItemsPerPage = 5

  // Budget Type Editor Modal state
  const [showBudgetTypeEditor, setShowBudgetTypeEditor] = useState(false)
  const [editingBudgetType, setEditingBudgetType] =
    useState<BudgetTypeData | null>(null)

  // Discounts state
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [discSearchVisible, setDiscSearchVisible] = useState(false)
  const [discSearchTerm, setDiscSearchTerm] = useState('')
  const [discCurrentPage, setDiscCurrentPage] = useState(1)
  const discItemsPerPage = 5

  const serviceRowsByCode = useMemo(() => {
    const map = new Map<string, ServiceCatalogRow>()
    categories.forEach((category) => {
      category.treatments.forEach((treatment) => {
        const normalizedCode = treatment.code.trim().toUpperCase()
        if (!normalizedCode || map.has(normalizedCode)) return
        map.set(normalizedCode, {
          id: Number(treatment.id),
          name: treatment.name,
          treatment_code: normalizedCode,
          standard_price: treatment.basePrice,
          category: category.name,
          default_duration_minutes: Number.parseInt(
            treatment.estimatedTime.replace(/[^\d]/g, ''),
            10
          )
        })
      })
    })
    return map
  }, [categories])

  const loadConfigurationData = useCallback(async () => {
    if (!activeClinicId) {
      setCategories([])
      setBudgetTypes([])
      setDiscounts([])
      setOrganizationId(null)
      setSelectedCategoryId('')
      return
    }

    setIsLoadingData(true)
    setCategories([])
    setBudgetTypes([])
    setDiscounts([])
    try {
      let resolvedOrganizationId: string | null = null

      const { data: clinicRow, error: clinicError } = await supabase
        .from('clinics')
        .select('organization_id')
        .eq('id', activeClinicId)
        .single()

      if (clinicError) {
        console.warn('No se pudo cargar organización de clínica', clinicError)
      } else {
        const orgId = String(
          (clinicRow as { organization_id?: string | null })?.organization_id || ''
        )
        if (orgId) {
          resolvedOrganizationId = orgId
          setOrganizationId(orgId)
        }
      }

      let serviceRows: ServiceCatalogRow[] = []
      const baseServiceSelect =
        'id, name, treatment_code, standard_price, category, default_duration_minutes'
      if (resolvedOrganizationId) {
        const { data, error } = await supabase
          .from('service_catalog')
          .select(`${baseServiceSelect}, organization_id`)
          .eq('organization_id', resolvedOrganizationId)
          .order('category', { ascending: true })
          .order('name', { ascending: true })
        if (error) {
          console.warn('No se pudieron cargar tratamientos por organización', error)
          if (String((error as { code?: string })?.code || '') === '42703') {
            const { data: legacyRows, error: legacyError } = await supabase
              .from('service_catalog')
              .select(baseServiceSelect)
              .order('category', { ascending: true })
              .order('name', { ascending: true })
            if (legacyError) {
              console.warn('No se pudieron cargar tratamientos (schema legacy)', legacyError)
            } else {
              serviceRows = (legacyRows || []) as ServiceCatalogRow[]
            }
          }
        } else {
          serviceRows = (data || []) as ServiceCatalogRow[]
        }
      }

      if (!resolvedOrganizationId || serviceRows.length === 0) {
        const { data, error } = await supabase
          .from('service_catalog')
          .select(`${baseServiceSelect}, organization_id`)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (error) {
          if (String((error as { code?: string })?.code || '') === '42703') {
            const { data: legacyRows, error: legacyError } = await supabase
              .from('service_catalog')
              .select(baseServiceSelect)
              .order('category', { ascending: true })
              .order('name', { ascending: true })
            if (legacyError) {
              console.warn('No se pudieron cargar tratamientos', legacyError)
            } else {
              serviceRows = (legacyRows || []) as ServiceCatalogRow[]
            }
          } else {
            console.warn('No se pudieron cargar tratamientos', error)
          }
        } else {
          serviceRows = (data || []) as ServiceCatalogRow[]
          if (!resolvedOrganizationId) {
            const inferredOrg = String(serviceRows[0]?.organization_id || '')
            if (inferredOrg) {
              resolvedOrganizationId = inferredOrg
              setOrganizationId(inferredOrg)
            }
          }
        }
      }

      if (serviceRows.length > 0) {
        const grouped = new Map<string, Category>()
        serviceRows.forEach((row) => {
          const categoryName = toCategoryLabel(row.category)
          const categoryId = slugCategoryId(categoryName) || 'general'
          if (!grouped.has(categoryId)) {
            grouped.set(categoryId, {
              id: categoryId,
              name: categoryName,
              treatments: []
            })
          }
          grouped.get(categoryId)?.treatments.push({
            id: String(row.id),
            code: String(row.treatment_code || `TRT-${row.id}`),
            name: String(row.name || ''),
            basePrice: Number(row.standard_price || 0),
            estimatedTime: frequencyToDurationText(row.default_duration_minutes),
            iva: '0%',
            selected: false
          })
        })

        const mappedCategories = Array.from(grouped.values())
        setCategories(mappedCategories)
        setSelectedCategoryId((prev) =>
          mappedCategories.some((category) => category.id === prev)
            ? prev
            : mappedCategories[0]?.id || ''
        )
      } else {
        setSelectedCategoryId('')
      }

      // Load budget templates from quote_templates if available, fallback to service_packages.
      const { data: templateRows, error: templateError } = await supabase
        .from('quote_templates')
        .select(
          'id, name, notes, is_active, quote_template_items(quantity, override_unit_price, service_id, service_catalog:service_id(id, name, treatment_code, standard_price))'
        )
        .eq('clinic_id', activeClinicId)
        .order('name', { ascending: true })

      if (!templateError) {
        const mappedBudgetTypes = ((templateRows || []) as Array<Record<string, unknown>>).map(
          (row) => {
            const items = (row.quote_template_items as Array<Record<string, unknown>> | null) || []
            const treatments = items.map((item) => {
              const serviceInfo = Array.isArray(item.service_catalog)
                ? item.service_catalog[0]
                : item.service_catalog
              const quantity = Number(item.quantity || 1)
              const unitPrice = Number(
                item.override_unit_price ??
                  (serviceInfo as { standard_price?: number | string } | undefined)
                    ?.standard_price ??
                  0
              )
              return {
                codigo: String(
                  (serviceInfo as { treatment_code?: string } | undefined)
                    ?.treatment_code || item.service_id || ''
                ),
                tratamiento: String(
                  (serviceInfo as { name?: string } | undefined)?.name || ''
                ),
                precio: unitPrice * quantity
              }
            })
            return {
              id: String(row.id),
              name: String(row.name || ''),
              description: String(row.notes || ''),
              treatments,
              totalPrice: treatments.reduce((sum, t) => sum + Number(t.precio || 0), 0),
              isActive: row.is_active !== false,
              selected: false
            } satisfies BudgetTypeRow
          }
        )
        setBudgetTypes(mappedBudgetTypes)
      } else {
        if (!resolvedOrganizationId) {
          console.warn(
            'No se pudo resolver organization_id para cargar service_packages.'
          )
          return
        }
        const { data: packageRows, error: packageError } = await supabase
          .from('service_packages')
          .select(
            'id, name, description, is_active, service_package_items(quantity, custom_price, service_id, service_catalog:service_id(id, name, treatment_code, standard_price))'
          )
          .eq('organization_id', resolvedOrganizationId)
          .order('name', { ascending: true })

        if (packageError) {
          console.warn('No se pudieron cargar presupuestos tipo', packageError)
        } else {
          const mappedPackages = ((packageRows || []) as Array<Record<string, unknown>>).map(
            (row) => {
              const items = (row.service_package_items as Array<Record<string, unknown>> | null) || []
              const treatments = items.map((item) => {
                const serviceInfo = Array.isArray(item.service_catalog)
                  ? item.service_catalog[0]
                  : item.service_catalog
                const quantity = Number(item.quantity || 1)
                const unitPrice = Number(
                  item.custom_price ??
                    (serviceInfo as { standard_price?: number | string } | undefined)
                      ?.standard_price ??
                    0
                )
                return {
                  codigo: String(
                    (serviceInfo as { treatment_code?: string } | undefined)
                      ?.treatment_code || item.service_id || ''
                  ),
                  tratamiento: String(
                    (serviceInfo as { name?: string } | undefined)?.name || ''
                  ),
                  precio: unitPrice * quantity
                }
              })
              return {
                id: String(row.id),
                name: String(row.name || ''),
                description: String(row.description || ''),
                treatments,
                totalPrice: treatments.reduce(
                  (sum, treatment) => sum + Number(treatment.precio || 0),
                  0
                ),
                isActive: row.is_active !== false,
                selected: false
              } satisfies BudgetTypeRow
            }
          )
          setBudgetTypes(mappedPackages)
        }
      }

      const { data: discountRows, error: discountError } = await supabase
        .from('clinic_discounts')
        .select('id, name, discount_type, value, notes, is_active')
        .eq('clinic_id', activeClinicId)
        .order('name', { ascending: true })

      if (discountError) {
        const { data: fallbackDiscountRows, error: fallbackDiscountError } =
          await supabase
            .from('discounts')
            .select('id, name, discount_type, value, notes, is_active')
            .eq('clinic_id', activeClinicId)
            .order('name', { ascending: true })

        if (fallbackDiscountError) {
          console.warn('No se pudieron cargar descuentos', fallbackDiscountError)
        } else {
          const mappedFallbackDiscounts = (
            (fallbackDiscountRows || []) as Array<Record<string, unknown>>
          ).map((row) => ({
            id: String(row.id),
            name: String(row.name || ''),
            type:
              String(row.discount_type || 'percentage') === 'fixed'
                ? 'fixed'
                : 'percentage',
            value: Number(row.value || 0),
            notes: String(row.notes || ''),
            isActive: row.is_active !== false
          })) as Discount[]
          if (mappedFallbackDiscounts.length > 0) {
            setDiscounts(mappedFallbackDiscounts)
          }
        }
      } else {
        const mappedDiscounts = (
          (discountRows || []) as Array<Record<string, unknown>>
        ).map((row) => ({
          id: String(row.id),
          name: String(row.name || ''),
          type: String(row.discount_type || 'percentage') === 'fixed' ? 'fixed' : 'percentage',
          value: Number(row.value || 0),
          notes: String(row.notes || ''),
          isActive: row.is_active !== false
        })) as Discount[]
        setDiscounts(mappedDiscounts)
      }
    } finally {
      setIsLoadingData(false)
    }
  }, [activeClinicId, supabase])

  useEffect(() => {
    void loadConfigurationData()
  }, [loadConfigurationData])

  // Get current category
  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  // Get selected treatments for filter tags
  const selectedTreatments = useMemo(() => {
    return categories.flatMap((c) => c.treatments).filter((t) => t.selected)
  }, [categories])

  const budgetEditorTreatmentOptions = useMemo(() => {
    const byCode = new Map<
      string,
      { code: string; description: string; price: number; familia?: string }
    >()
    categories.forEach((category) => {
      category.treatments.forEach((treatment) => {
        const code = String(treatment.code || '')
          .trim()
          .toUpperCase()
        if (!code || byCode.has(code)) return
        byCode.set(code, {
          code,
          description: treatment.name,
          price: Number(treatment.basePrice || 0),
          familia: category.name
        })
      })
    })
    return Array.from(byCode.values())
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

  // Add treatment to current category in DB, then reload from source of truth
  const handleAddTreatment = useCallback((data: TreatmentFormData) => {
    if (!organizationId) {
      alert('No se pudo resolver la organización de la clínica activa.')
      return
    }

    const treatmentName = data.name.trim()
    if (!treatmentName) return
    const treatmentCode = data.code.trim().toUpperCase()
    const price = Number(data.basePrice || 0)
    if (!Number.isFinite(price) || price < 0) {
      alert('El precio no es válido.')
      return
    }

    const duration = Number.parseInt(String(data.estimatedTime || '').replace(/[^\d]/g, ''), 10)
    const categoryName = currentCategory?.name || 'General'

    const createTreatment = async () => {
      const { error } = await supabase.from('service_catalog').insert({
        organization_id: organizationId,
        name: treatmentName.trim(),
        treatment_code: treatmentCode || null,
        category: categoryName,
        standard_price: price,
        default_duration_minutes: Number.isFinite(duration) ? duration : null,
        is_active: true
      })
      if (error) {
        console.warn('No se pudo crear tratamiento', error)
        alert('No se pudo crear el tratamiento.')
        return
      }
      await loadConfigurationData()
      setShowAddTreatment(false)
    }

    void createTreatment()
  }, [currentCategory?.name, loadConfigurationData, organizationId, supabase])

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

  // Toggle budget type selection
  const toggleBudgetTypeSelect = useCallback((budgetId: string) => {
    setBudgetTypes((prev) =>
      prev.map((bt) =>
        bt.id === budgetId ? { ...bt, selected: !bt.selected } : bt
      )
    )
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
    if (!activeClinicId) return

    const duplicateTemplates = async () => {
      for (const bt of selectedBudgetTypes) {
        const { data: templateRow, error: templateError } = await supabase
          .from('quote_templates')
          .insert({
            clinic_id: activeClinicId,
            name: `${bt.name} (copia)`,
            notes: bt.description || null,
            is_active: bt.isActive
          })
          .select('id')
          .single()

        if (templateError || !templateRow?.id) {
          console.warn('No se pudo duplicar presupuesto tipo', templateError)
          continue
        }

        const templateId = Number(templateRow.id)
        const itemPayload: Array<Record<string, unknown>> = []
        for (const treatment of bt.treatments) {
          const normalizedCode = String(treatment.codigo || '')
            .trim()
            .toUpperCase()
          const serviceMatch = serviceRowsByCode.get(normalizedCode)
          if (!serviceMatch?.id) continue
          itemPayload.push({
            template_id: templateId,
            service_id: serviceMatch.id,
            quantity: 1,
            override_unit_price: Number(treatment.precio || 0)
          })
        }
        if (itemPayload.length > 0) {
          const { error: itemError } = await supabase
            .from('quote_template_items')
            .insert(itemPayload)
          if (itemError) {
            console.warn('No se pudieron duplicar items de plantilla', itemError)
          }
        }
      }
      await loadConfigurationData()
    }

    void duplicateTemplates()
  }, [
    activeClinicId,
    loadConfigurationData,
    selectedBudgetTypes,
    serviceRowsByCode,
    supabase
  ])

  const handleBtDelete = useCallback(() => {
    const deleteTemplates = async () => {
      const selectedIds = selectedBudgetTypes
        .map((bt) => Number(bt.id))
        .filter((id) => Number.isFinite(id))
      if (selectedIds.length === 0) return
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .in('id', selectedIds)
      if (error) {
        console.warn('No se pudieron eliminar plantillas', error)
        alert('No se pudieron eliminar las plantillas seleccionadas.')
        return
      }
      await loadConfigurationData()
    }
    void deleteTemplates()
  }, [loadConfigurationData, selectedBudgetTypes, supabase])

  const handleBtMore = useCallback(() => {
    alert(
      `Plantillas seleccionadas: ${selectedBudgetTypes
        .map((bt) => bt.name)
        .join(', ')}`
    )
  }, [selectedBudgetTypes])

  const handleAddTemplate = useCallback(() => {
    setEditingBudgetType(null)
    setShowBudgetTypeEditor(true)
  }, [])

  // Handle save from editor modal
  const handleSaveBudgetType = useCallback(
    (budgetTypeData: Omit<BudgetTypeData, 'id'> | BudgetTypeData) => {
      if (!activeClinicId) return

      const persistTemplate = async () => {
        let templateId: number | null = null

        if ('id' in budgetTypeData && budgetTypeData.id) {
          templateId = Number(budgetTypeData.id)
          const { error: templateError } = await supabase
            .from('quote_templates')
            .update({
              name: budgetTypeData.name,
              notes: budgetTypeData.description || null,
              is_active: budgetTypeData.isActive
            })
            .eq('id', templateId)
            .eq('clinic_id', activeClinicId)
          if (templateError) {
            console.warn('No se pudo actualizar plantilla', templateError)
            alert('No se pudo actualizar la plantilla.')
            return
          }

          await supabase
            .from('quote_template_items')
            .delete()
            .eq('template_id', templateId)
        } else {
          const { data: insertedTemplate, error: insertedTemplateError } =
            await supabase
              .from('quote_templates')
              .insert({
                clinic_id: activeClinicId,
                name: budgetTypeData.name,
                notes: budgetTypeData.description || null,
                is_active: budgetTypeData.isActive
              })
              .select('id')
              .single()
          if (insertedTemplateError || !insertedTemplate?.id) {
            console.warn(
              'No se pudo crear plantilla de presupuesto',
              insertedTemplateError
            )
            alert('No se pudo crear la plantilla.')
            return
          }
          templateId = Number(insertedTemplate.id)
        }

        if (!templateId) return

        const itemPayload: Array<Record<string, unknown>> = []
        for (const treatment of budgetTypeData.treatments) {
          const normalizedCode = String(treatment.codigo || '')
            .trim()
            .toUpperCase()
          let serviceId = serviceRowsByCode.get(normalizedCode)?.id || null

          if (!serviceId && organizationId) {
            const { data: createdService, error: createdServiceError } =
              await supabase
                .from('service_catalog')
                .insert({
                  organization_id: organizationId,
                  name: treatment.tratamiento,
                  category: 'General',
                  standard_price: Number(treatment.precio || 0),
                  treatment_code: normalizedCode || null
                })
                .select('id')
                .single()
            if (createdServiceError) {
              console.warn('No se pudo crear tratamiento faltante', createdServiceError)
            } else if (createdService?.id) {
              serviceId = Number(createdService.id)
            }
          }

          if (!serviceId) continue

          itemPayload.push({
            template_id: templateId,
            service_id: serviceId,
            quantity: 1,
            override_unit_price: Number(treatment.precio || 0)
          })
        }

        if (itemPayload.length > 0) {
          const { error: itemInsertError } = await supabase
            .from('quote_template_items')
            .insert(itemPayload)
          if (itemInsertError) {
            console.warn('No se pudieron guardar items de plantilla', itemInsertError)
          }
        }

        await loadConfigurationData()
      }

      void persistTemplate()
    },
    [activeClinicId, loadConfigurationData, organizationId, serviceRowsByCode, supabase]
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
      setDiscounts((prev) =>
        prev.map((d) => (d.id === discountId ? { ...d, notes: newNotes } : d))
      )

      const persistNotes = async () => {
        if (!activeClinicId) return
        const payload = { notes: newNotes || null }
        const { error } = await supabase
          .from('clinic_discounts')
          .update(payload)
          .eq('id', discountId)
          .eq('clinic_id', activeClinicId)
        if (!error) return

        const { error: fallbackError } = await supabase
          .from('discounts')
          .update(payload)
          .eq('id', discountId)
          .eq('clinic_id', activeClinicId)
        if (fallbackError) {
          console.warn('No se pudieron actualizar notas del descuento', fallbackError)
          void loadConfigurationData()
        }
      }

      void persistNotes()
    },
    [activeClinicId, loadConfigurationData, supabase]
  )

  // Add new discount
  const handleAddDiscount = useCallback(() => {
    if (!activeClinicId) return

    const name = window.prompt('Nombre del descuento:')
    if (!name?.trim()) return
    const typeInput = window.prompt(
      'Tipo (percentage/fixed):',
      'percentage'
    )
    const discountType = typeInput === 'fixed' ? 'fixed' : 'percentage'
    const valueInput = window.prompt('Valor del descuento:', '10')
    const value = Number(valueInput || 0)
    if (!Number.isFinite(value) || value < 0) {
      alert('El valor del descuento no es válido.')
      return
    }
    const notes = window.prompt('Notas (opcional):', '') || ''

    const createDiscount = async () => {
      const payload = {
        clinic_id: activeClinicId,
        name: name.trim(),
        discount_type: discountType,
        value,
        notes: notes || null,
        is_active: true
      }

      const { error } = await supabase.from('clinic_discounts').insert(payload)
      if (error) {
        const { error: fallbackError } = await supabase
          .from('discounts')
          .insert(payload)
        if (fallbackError) {
          console.warn('No se pudo crear descuento', fallbackError)
          alert('No se pudo crear el descuento.')
          return
        }
      }
      await loadConfigurationData()
    }
    void createDiscount()
  }, [activeClinicId, loadConfigurationData, supabase])

  // Configure discount limits
  const handleConfigureDiscountLimits = useCallback(() => {
    const goToRoles = window.confirm(
      'Los límites de descuento por rol se configuran en Roles y permisos. ¿Quieres abrir esa sección?'
    )
    if (goToRoles) window.location.href = '/configuracion/roles'
  }, [])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Tratamientos, precios, presupuestos y descuentos
        </p>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-auto'>
          {/* Tabs */}
          <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-2 min-h-[min(4rem,6vh)]'>
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
          {isLoadingData && (
            <div className='px-[min(2.5rem,3vw)] py-3'>
              <p className='text-body-sm text-[var(--color-neutral-600)]'>
                Cargando datos de configuración...
              </p>
            </div>
          )}
          {activeTab === 'treatments' ? (
            <div className='flex min-h-0 mt-[min(1.5rem,2vh)] pb-[min(1.5rem,2vh)]'>
              {/* Categories Sidebar */}
              <aside className='w-[min(11.5rem,18vw)] flex-none border border-neutral-200 rounded-lg ml-[min(2.5rem,3vw)] mr-[min(1.5rem,2vw)] overflow-hidden'>
                <nav className='flex flex-col'>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type='button'
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={[
                        'text-left px-[0.625rem] py-[0.625rem] h-12 transition-colors',
                        selectedCategoryId === category.id
                          ? 'bg-[var(--color-neutral-200)] text-body-md font-medium text-[var(--color-neutral-900)]'
                          : 'bg-[var(--color-surface)] text-body-md font-normal text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-100)]'
                      ].join(' ')}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Treatments Content */}
              <div className='flex-1 flex flex-col min-w-0 pr-[min(2.5rem,3vw)] overflow-hidden'>
                {/* Category Header */}
                <div className='flex items-center justify-between mb-4'>
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
                  <div className='flex flex-wrap gap-2 mb-4'>
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
                <div className='flex-1 overflow-y-auto overflow-x-hidden'>
                  <TableHeader />
                  {filteredTreatments.map((treatment) => (
                    <TableRow
                      key={treatment.id}
                      treatment={treatment}
                      onToggle={() => toggleTreatment(treatment.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'budgetType' ? (
            <div className='flex flex-col min-h-0 mt-[min(1.5rem,2vh)] pb-[min(1.5rem,2vh)] px-[min(2.5rem,3vw)]'>
              {/* Action Bar */}
              <div className='flex items-end justify-between mb-6'>
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
                  {/* Configure Discount Limits */}
                  <button
                    type='button'
                    onClick={handleConfigureDiscountLimits}
                    className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-neutral-50)] hover:bg-neutral-100 transition-colors'
                  >
                    <AddRounded className='size-6 text-[var(--color-neutral-900)]' />
                    <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                      Configurar límites de descuento
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
              <div className='flex-1 overflow-y-auto overflow-x-hidden'>
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
                <div className='flex justify-end mt-6'>
                  <Pagination
                    currentPage={qbCurrentPage}
                    totalPages={qbTotalPages}
                    onPageChange={setQbCurrentPage}
                  />
                </div>
              )}
            </div>
          ) : activeTab === 'discounts' ? (
            <div className='flex flex-col min-h-0 mt-[min(1.5rem,2vh)] pb-[min(1.5rem,2vh)] px-[min(2.5rem,3vw)]'>
              {/* Action Bar */}
              <div className='flex items-end justify-between mb-6'>
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
              <div className='flex-1 overflow-y-auto overflow-x-hidden'>
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
                <div className='flex justify-end mt-6'>
                  <Pagination
                    currentPage={discCurrentPage}
                    totalPages={discTotalPages}
                    onPageChange={setDiscCurrentPage}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className='flex items-center justify-center py-20'>
              <p className='text-body-md text-[var(--color-neutral-600)]'>
                {activeTab === 'medications' &&
                  'Contenido de Medicamentos con autoguardado - Por implementar'}
              </p>
            </div>
          )}
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
        availableTreatments={budgetEditorTreatmentOptions}
      />

      {/* Add Treatment Modal */}
      <AddTreatmentModal
        open={showAddTreatment}
        onClose={() => setShowAddTreatment(false)}
        onSubmit={handleAddTreatment}
        categoryName={currentCategory?.name}
        existingCodes={allExistingCodes}
      />
    </>
  )
}
