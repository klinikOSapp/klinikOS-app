'use client'

import {
  AddRounded,
  ArrowBackRounded,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  CloseRounded,
  DownloadRounded,
  EditRounded,
  FilterListRounded,
  MoreVertRounded,
  PictureAsPdfRounded,
  SearchRounded
} from '@/components/icons/md3'
import type { BudgetTypeData } from '@/components/pacientes/shared/budgetTypeData'
import CatalogoTratamientos from '@/components/pacientes/shared/CatalogoTratamientos'
import ExpandedTextInput from '@/components/pacientes/shared/ExpandedTextInput'
import OdontogramaCompacto from '@/components/pacientes/shared/OdontogramaCompacto'
import { RowActionsMenu } from '@/components/pacientes/shared/RowActionsMenu'
import type {
  OdontogramaState,
  TreatmentCatalogEntry,
  TreatmentV2
} from '@/components/pacientes/shared/treatmentTypes'
import { TREATMENT_CATALOG } from '@/components/pacientes/shared/treatmentTypes'
import { useConfiguration } from '@/context/ConfigurationContext'
import {
  downloadDocument,
  formatBudgetFilename,
  generateBudgetPDF,
  type BudgetOptions,
  type GeneratedDocument
} from '@/utils/exportUtils'
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// ============================================
// Mock Data - Formato TreatmentV2
// ============================================
const PENDING_TREATMENTS_V2: TreatmentV2[] = [
  {
    _internalId: 'budget-pending-0',
    pieza: 11,
    cara: 'Vestibular',
    codigo: 'BD',
    tratamiento: 'Blanqueamiento dental',
    precio: '200 €',
    porcentajeDescuento: 0,
    descuento: '0 €',
    importe: '200 €',
    importeSeguro: '',
    descripcionAnotaciones: '',
    doctor: 'Dra. Andrea',
    selected: false
  },
  {
    _internalId: 'budget-pending-1',
    pieza: 21,
    cara: 'Oclusal',
    codigo: 'LD',
    tratamiento: 'Limpieza dental',
    precio: '72 €',
    porcentajeDescuento: 0,
    descuento: '0 €',
    importe: '72 €',
    importeSeguro: '',
    descripcionAnotaciones: '',
    doctor: 'Dr. Guillermo',
    selected: false
  },
  {
    _internalId: 'budget-pending-2',
    pieza: 22,
    cara: 'Oclusal',
    codigo: 'LD',
    tratamiento: 'Limpieza dental',
    precio: '72 €',
    porcentajeDescuento: 0,
    descuento: '0 €',
    importe: '72 €',
    importeSeguro: '',
    descripcionAnotaciones: '',
    doctor: 'Dr. Guillermo',
    selected: false
  },
  {
    _internalId: 'budget-pending-3',
    pieza: 31,
    cara: 'Vestibular',
    codigo: 'BD',
    tratamiento: 'Blanqueamiento dental',
    precio: '200 €',
    porcentajeDescuento: 10,
    descuento: '20 €',
    importe: '180 €',
    importeSeguro: '50 €',
    descripcionAnotaciones: 'Paciente con sensibilidad',
    doctor: 'Dra. Andrea',
    selected: false
  },
  {
    _internalId: 'budget-pending-4',
    pieza: 41,
    cara: 'Oclusal',
    codigo: 'LD',
    tratamiento: 'Limpieza dental',
    precio: '72 €',
    porcentajeDescuento: 0,
    descuento: '0 €',
    importe: '72 €',
    importeSeguro: '',
    descripcionAnotaciones: '',
    doctor: 'Dr. Guillermo',
    selected: false
  }
]

// ============================================
// Table Components (from Treatments.tsx)
// ============================================
function TableHeaderCell({
  children,
  className,
  width,
  sticky,
  stickyPosition = 'left'
}: {
  children?: React.ReactNode
  className?: string
  width?: string
  sticky?: boolean
  stickyPosition?: 'left' | 'right'
}) {
  const stickyClasses = sticky
    ? `sticky ${
        stickyPosition === 'left' ? 'left-0' : 'right-0'
      } z-10 bg-[#F8FAFB]`
    : ''
  return (
    <th
      scope='col'
      className={[
        'border-b-[0.5px] border-[#CBD3D9] px-[0.375rem] py-[0.125rem] text-left text-[0.75rem] leading-[1.125rem] font-normal text-[#535C66]',
        stickyClasses,
        className
      ].join(' ')}
      style={{ width }}
    >
      {children}
    </th>
  )
}

function TableBodyCell({
  children,
  className,
  width,
  sticky,
  stickyPosition = 'left',
  rowSelected
}: {
  children: React.ReactNode
  className?: string
  width?: string
  sticky?: boolean
  stickyPosition?: 'left' | 'right'
  rowSelected?: boolean
}) {
  const stickyClasses = sticky
    ? `sticky ${stickyPosition === 'left' ? 'left-0' : 'right-0'} z-10 ${
        rowSelected ? 'bg-[#E9FBF9]' : 'bg-white'
      }`
    : ''
  return (
    <td
      className={[
        'border-b-[0.5px] border-[#CBD3D9] px-[0.375rem] py-[0.375rem] text-[0.75rem] leading-[1.125rem] text-[#24282C]',
        stickyClasses,
        className
      ].join(' ')}
      style={{ width }}
    >
      {children}
    </td>
  )
}

// ============================================
// Editable Cell Component
// ============================================
type EditableCellProps = {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  className?: string
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}

function EditableCell({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  className = '',
  disabled = false,
  inputRef
}: EditableCellProps) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-transparent border-none outline-none text-[0.6875rem] leading-[1rem] text-[#24282C] 
        focus:bg-[var(--color-neutral-50)] rounded px-1 py-0.5 transition-colors
        disabled:text-[#AEB8C2] disabled:cursor-not-allowed
        ${className}`}
    />
  )
}

// ============================================
// Treatment Row Component
// ============================================
type TreatmentRowProps = {
  treatment: TreatmentV2
  onToggleSelection: () => void
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>) => void
  onUpdateField: (
    field: keyof TreatmentV2,
    value: string | number | undefined
  ) => void
  onUpdateMultipleFields?: (updates: Partial<TreatmentV2>) => void
  isNewRow?: boolean
  onNewRowMounted?: () => void
  professionals: Array<{ value: string; label: string }>
}

function TreatmentRow({
  treatment,
  onToggleSelection,
  onOpenMenu,
  onUpdateField,
  onUpdateMultipleFields,
  isNewRow,
  onNewRowMounted,
  professionals
}: TreatmentRowProps) {
  const rowRef = React.useRef<HTMLTableRowElement>(null)
  const firstInputRef = React.useRef<HTMLInputElement>(null)

  // Scroll to row and focus first input when it's a new row
  React.useEffect(() => {
    if (isNewRow && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Focus the first input after scroll animation
      setTimeout(() => {
        firstInputRef.current?.focus()
        firstInputRef.current?.select()
        onNewRowMounted?.()
      }, 300)
    }
  }, [isNewRow, onNewRowMounted])

  const rowBg = treatment.selected
    ? 'bg-[#E9FBF9]'
    : isNewRow
      ? 'bg-[#FEF9C3] animate-pulse'
      : 'bg-white hover:bg-[var(--color-neutral-50)]'

  // Parsear precio para cálculos (remove € y espacios)
  const parsePrice = (price: string): number => {
    const cleaned = price.replace(/[€\s]/g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  // Formatear precio con €
  const formatPrice = (num: number): string => {
    return `${num.toFixed(2).replace('.', ',')} €`
  }

  // Handler para cambio de precio - recalcula importe
  const handlePrecioChange = (value: string) => {
    onUpdateField('precio', value)
    // Recalcular descuento e importe
    const precioNum = parsePrice(value)
    const porcentaje = treatment.porcentajeDescuento || 0
    const descuentoNum = precioNum * (porcentaje / 100)
    const importeNum = precioNum - descuentoNum
    onUpdateField('descuento', formatPrice(descuentoNum))
    onUpdateField('importe', formatPrice(importeNum))
  }

  // Handler para cambio de porcentaje - recalcula descuento e importe
  const handlePorcentajeChange = (value: string) => {
    const porcentaje = parseFloat(value) || 0
    onUpdateField('porcentajeDescuento', porcentaje)
    // Recalcular descuento e importe
    const precioNum = parsePrice(treatment.precio)
    const descuentoNum = precioNum * (porcentaje / 100)
    const importeNum = precioNum - descuentoNum
    onUpdateField('descuento', formatPrice(descuentoNum))
    onUpdateField('importe', formatPrice(importeNum))
  }

  // Handler para cambio de código - busca en catálogo y autocompleta
  const handleCodigoChange = (value: string) => {
    // Buscar en el catálogo (case insensitive)
    const upperCode = value.toUpperCase().trim()
    const catalogEntry = TREATMENT_CATALOG[upperCode]

    if (catalogEntry && onUpdateMultipleFields) {
      // Encontrado: autocompletar todos los campos de una sola vez
      onUpdateMultipleFields({
        codigo: value,
        tratamiento: catalogEntry.description,
        precio: catalogEntry.amount,
        importe: catalogEntry.amount,
        descuento: '0 €',
        porcentajeDescuento: 0
      })
    } else {
      // No encontrado: solo actualizar el código
      onUpdateField('codigo', value)
    }
  }

  return (
    <tr ref={rowRef} className={`${rowBg} transition-colors`}>
      {/* Checkbox - Sticky left */}
      <TableBodyCell
        width='2.5rem'
        sticky
        stickyPosition='left'
        rowSelected={treatment.selected}
      >
        <button
          type='button'
          onClick={onToggleSelection}
          className='cursor-pointer'
        >
          {treatment.selected ? (
            <CheckBoxRounded className='w-[1rem] h-[1rem] text-[var(--color-brand-500)]' />
          ) : (
            <CheckBoxOutlineBlankRounded className='w-[1rem] h-[1rem] text-[var(--color-neutral-400)]' />
          )}
        </button>
      </TableBodyCell>
      {/* Pieza - Editable */}
      <TableBodyCell width='4.625rem'>
        <EditableCell
          value={treatment.pieza?.toString() || ''}
          onChange={(v) => onUpdateField('pieza', v ? parseInt(v) : undefined)}
          type='number'
          placeholder='-'
        />
      </TableBodyCell>
      {/* Cara - Select */}
      <TableBodyCell width='6.625rem'>
        <select
          value={treatment.cara || ''}
          onChange={(e) => onUpdateField('cara', e.target.value || undefined)}
          className='w-full bg-transparent border-none outline-none text-[0.6875rem] leading-[1rem] text-[#24282C] 
            focus:bg-[var(--color-neutral-50)] rounded px-1 py-0.5 cursor-pointer'
        >
          <option value=''>-</option>
          <option value='Vestibular'>Vestibular</option>
          <option value='Oclusal'>Oclusal</option>
          <option value='Mesial'>Mesial</option>
          <option value='Distal'>Distal</option>
          <option value='Lingual'>Lingual</option>
          <option value='Palatino'>Palatino</option>
          <option value='Incisal'>Incisal</option>
        </select>
      </TableBodyCell>
      {/* Código - Editable (busca en catálogo al escribir) */}
      <TableBodyCell width='5.875rem'>
        <EditableCell
          value={treatment.codigo}
          onChange={handleCodigoChange}
          placeholder='Código'
          inputRef={isNewRow ? firstInputRef : undefined}
        />
      </TableBodyCell>
      {/* Tratamiento - Editable */}
      <TableBodyCell width='19.5rem'>
        <EditableCell
          value={treatment.tratamiento}
          onChange={(v) => onUpdateField('tratamiento', v)}
          placeholder='Tratamiento'
          className='truncate'
        />
      </TableBodyCell>
      {/* Precio - Editable, recalcula */}
      <TableBodyCell width='7.25rem'>
        <EditableCell
          value={treatment.precio}
          onChange={handlePrecioChange}
          placeholder='0,00 €'
        />
      </TableBodyCell>
      {/* % - Editable, recalcula */}
      <TableBodyCell width='5.5rem'>
        <EditableCell
          value={treatment.porcentajeDescuento?.toString() || ''}
          onChange={handlePorcentajeChange}
          type='number'
          placeholder='0'
        />
      </TableBodyCell>
      {/* Dto - Autocalculado (read-only) */}
      <TableBodyCell width='5.5rem'>
        <span className='text-[0.6875rem] leading-[1rem] text-[#24282C] px-1'>
          {treatment.descuento || '-'}
        </span>
      </TableBodyCell>
      {/* Importe - Autocalculado (read-only) */}
      <TableBodyCell width='6.25rem'>
        <span className='text-[0.6875rem] leading-[1rem] text-[#24282C] px-1'>
          {treatment.importe}
        </span>
      </TableBodyCell>
      {/* Imp. seguro - Editable */}
      <TableBodyCell width='6.875rem'>
        <EditableCell
          value={treatment.importeSeguro || ''}
          onChange={(v) => onUpdateField('importeSeguro', v)}
          placeholder='-'
        />
      </TableBodyCell>
      {/* Descripción/Anotaciones - con ExpandedTextInput */}
      <TableBodyCell className='max-w-[21.375rem]'>
        <ExpandedTextInput
          value={treatment.descripcionAnotaciones || ''}
          onChange={(v) => onUpdateField('descripcionAnotaciones', v)}
          placeholder='Añadir anotaciones...'
          compact
        />
      </TableBodyCell>
      {/* Doctor - Select */}
      <TableBodyCell width='14.1875rem'>
        <select
          value={treatment.doctor}
          onChange={(e) => onUpdateField('doctor', e.target.value)}
          className='w-full bg-transparent border-none outline-none text-[0.6875rem] leading-[1rem] text-[#24282C] 
            focus:bg-[var(--color-neutral-50)] rounded px-1 py-0.5 cursor-pointer'
        >
          {professionals.map((prof) => (
            <option key={prof.value} value={prof.value}>
              {prof.label}
            </option>
          ))}
        </select>
      </TableBodyCell>
      {/* Acciones - Sticky right */}
      <TableBodyCell
        width='2.25rem'
        sticky
        stickyPosition='right'
        rowSelected={treatment.selected}
      >
        <button
          type='button'
          onClick={onOpenMenu}
          className='p-[0.25rem] hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
          aria-label='Acciones rápidas'
        >
          <MoreVertRounded className='w-[1.25rem] h-[1.25rem] text-[var(--color-neutral-600)]' />
        </button>
      </TableBodyCell>
    </tr>
  )
}

// ============================================
// PDF Preview Component
// ============================================
function BudgetPdfPreview({
  document,
  onDownload,
  onClose,
  onConfirm
}: {
  document: GeneratedDocument
  onDownload: () => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className='flex flex-col h-full'>
      {/* Preview Header */}
      <div className='flex items-center justify-between px-6 py-3 border-b border-[#E2E7EA] bg-[#F8FAFB]'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={onClose}
            className='flex items-center gap-1 text-[0.875rem] text-[#535C66] hover:text-[#24282C] transition-colors cursor-pointer'
          >
            <ArrowBackRounded className='w-[1.25rem] h-[1.25rem]' />
            <span>Volver</span>
          </button>
          <div className='h-5 w-px bg-[#CBD3D9]' />
          <span className='text-[1rem] font-medium text-[#24282C]'>
            Vista previa del presupuesto
          </span>
        </div>
      </div>

      {/* Document info bar */}
      <div className='flex items-center justify-between px-6 py-2 border-b border-[#E2E7EA] bg-white'>
        <div className='flex items-center gap-3'>
          <PictureAsPdfRounded className='w-[1.5rem] h-[1.5rem] text-[#E53935]' />
          <div>
            <p className='text-[0.875rem] font-medium text-[#24282C]'>
              {document.professional}
            </p>
            <p className='text-[0.75rem] text-[#535C66]'>{document.filename}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onDownload}
            className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9FBF9] border border-[var(--color-brand-300)] text-[0.875rem] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
          >
            <DownloadRounded className='w-[1rem] h-[1rem]' />
            <span>Descargar</span>
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className='flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#51D6C7] text-[0.875rem] font-medium text-[#1E4947] hover:bg-[#3ECBBB] transition-colors cursor-pointer'
          >
            <span>Guardar presupuesto</span>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className='flex-1 bg-[#E2E7EA] p-4 overflow-auto'>
        <iframe
          src={document.url}
          className='w-full h-full rounded-lg shadow-lg bg-white'
          title={`Preview: ${document.filename}`}
        />
      </div>
    </div>
  )
}

// ============================================
// Budget Info Type (exported for parent components)
// ============================================
export type BudgetInfo = {
  name: string
  subtotal: number
  generalDiscountAmount: number
  total: number
}

// ============================================
// Main Component
// ============================================
type AddTreatmentsToBudgetModalProps = {
  open: boolean
  onClose: () => void
  onCreateBudget: (
    selectedTreatments: TreatmentV2[],
    budgetInfo: BudgetInfo
  ) => void
  onCreateBudgetType?: (budgetType: Omit<BudgetTypeData, 'id'>) => void
  treatments?: TreatmentV2[]
  initialBudgetName?: string
  mode?: 'budget' | 'budgetType'
}

export default function AddTreatmentsToBudgetModal({
  open,
  onClose,
  onCreateBudget,
  onCreateBudgetType,
  treatments: initialTreatments = PENDING_TREATMENTS_V2,
  initialBudgetName = '',
  mode = 'budget'
}: AddTreatmentsToBudgetModalProps) {
  const { professionalNameOptions } = useConfiguration()
  const defaultDoctor = professionalNameOptions[0]?.value || ''

  const [mounted, setMounted] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showSearch, setShowSearch] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // === Estados para tratamientos ===
  const [treatments, setTreatments] =
    React.useState<TreatmentV2[]>(initialTreatments)

  // === Estados para Odontograma y Catálogo ===
  const [odontogramaState, setOdontogramaState] =
    React.useState<OdontogramaState>({})
  const [filterByTeeth, setFilterByTeeth] = React.useState<number[]>([])
  const [selectedCatalogTreatment, setSelectedCatalogTreatment] =
    React.useState<{
      codigo: string
      entry: TreatmentCatalogEntry
    } | null>(null)
  const [selectedTeeth, setSelectedTeeth] = React.useState<number[]>([])
  const [newRowId, setNewRowId] = React.useState<string | null>(null)

  // Estado para mostrar el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = React.useState(false)

  // Menú de acciones
  const [activeMenu, setActiveMenu] = React.useState<{
    treatment: TreatmentV2
    triggerRect?: DOMRect
  } | null>(null)

  // === Estados para preview del PDF ===
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [generatedDocument, setGeneratedDocument] =
    useState<GeneratedDocument | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // === Estados para nombre y descuento general del presupuesto ===
  const [budgetName, setBudgetName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [generalDiscount, setGeneralDiscount] = useState<{
    type: 'percentage' | 'fixed'
    value: number
  }>({ type: 'percentage', value: 0 })
  const budgetNameInputRef = React.useRef<HTMLInputElement>(null)

  // Mount state
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setShowSearch(false)
      setTreatments(initialTreatments)
      setOdontogramaState({})
      setFilterByTeeth([])
      setSelectedCatalogTreatment(null)
      setSelectedTeeth([])
      setNewRowId(null)
      setShowConfirmModal(false)
      setActiveMenu(null)
      // Reset preview state
      if (generatedDocument?.url) {
        URL.revokeObjectURL(generatedDocument.url)
      }
      setGeneratedDocument(null)
      setIsPreviewMode(false)
      setIsGenerating(false)
      // Reset budget name and general discount
      setBudgetName('')
      setIsEditingName(false)
      setGeneralDiscount({ type: 'percentage', value: 0 })
    }
  }, [open, initialTreatments, generatedDocument])

  // Focus search input when opened
  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Scroll to top when modal opens
  React.useEffect(() => {
    if (open && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [open])

  // Initialize treatments, odontograma and budget name when modal opens
  React.useEffect(() => {
    if (open) {
      // Set treatments from props
      setTreatments(initialTreatments)

      // Initialize odontograma with teeth from treatments
      const initialOdontogramaState: OdontogramaState = {}
      initialTreatments.forEach((t) => {
        if (t.pieza) {
          initialOdontogramaState[t.pieza] = 'pendiente'
        }
      })
      setOdontogramaState(initialOdontogramaState)

      // Set budget name from prop (for budget type templates)
      if (initialBudgetName) {
        setBudgetName(initialBudgetName)
      }
    }
  }, [open, initialTreatments, initialBudgetName])

  // Escape key handler
  React.useEffect(() => {
    if (!open) return undefined
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Si estamos en modo preview, volver al formulario
        if (isPreviewMode) {
          setIsPreviewMode(false)
          return
        }
        // Si hay tratamiento seleccionado, primero deseleccionarlo
        if (selectedCatalogTreatment) {
          setSelectedCatalogTreatment(null)
          setSelectedTeeth([])
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open, selectedCatalogTreatment, isPreviewMode])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (generatedDocument?.url) {
        URL.revokeObjectURL(generatedDocument.url)
      }
    }
  }, [generatedDocument])

  // === Handlers para Odontograma y Catálogo ===
  const handleToothClick = (toothId: number) => {
    if (selectedCatalogTreatment) {
      // Modo selección: añadir/quitar diente para el tratamiento seleccionado
      setSelectedTeeth((prev) => {
        if (prev.includes(toothId)) {
          return prev.filter((id) => id !== toothId)
        }
        return [...prev, toothId]
      })
    } else {
      // Modo filtro: añadir/quitar diente del filtro
      setFilterByTeeth((prev) => {
        if (prev.includes(toothId)) {
          return prev.filter((id) => id !== toothId)
        }
        return [...prev, toothId]
      })
    }
  }

  const handleSelectTreatmentFromCatalog = (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => {
    if (selectedCatalogTreatment?.codigo === codigo) {
      // Deseleccionar si se hace clic en el mismo tratamiento
      setSelectedCatalogTreatment(null)
      setSelectedTeeth([])
      return
    }
    // Seleccionar tratamiento (esperando que el usuario seleccione piezas)
    setSelectedCatalogTreatment({ codigo, entry })
    setSelectedTeeth([])
  }

  // Handler para doble clic: añadir tratamiento directamente sin seleccionar pieza
  const handleDoubleClickTreatmentFromCatalog = (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => {
    const newId = `TR-NEW-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`
    const newTreatment: TreatmentV2 = {
      _internalId: newId,
      pieza: undefined, // Sin pieza asignada
      codigo,
      tratamiento: entry.description,
      precio: entry.amount,
      importe: entry.amount,
      descuento: '0 €',
      porcentajeDescuento: 0,
      doctor: defaultDoctor,
      selected: true // Seleccionar automáticamente para el presupuesto
    }

    // Añadir a la lista de tratamientos
    setTreatments((prev) => [...prev, newTreatment])

    // Marcar como nueva fila para hacer scroll y focus
    setNewRowId(newId)

    // Limpiar cualquier selección previa del catálogo
    setSelectedCatalogTreatment(null)
    setSelectedTeeth([])
  }

  const handleConfirmTreatments = () => {
    if (!selectedCatalogTreatment || selectedTeeth.length === 0) return

    const { codigo, entry } = selectedCatalogTreatment

    // Crear un tratamiento por cada pieza seleccionada
    const newTreatments: TreatmentV2[] = selectedTeeth.map((toothId) => ({
      _internalId: `TR-NEW-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}-${toothId}`,
      pieza: toothId,
      codigo,
      tratamiento: entry.description,
      precio: entry.amount,
      importe: entry.amount,
      descuento: '0 €',
      porcentajeDescuento: 0,
      doctor: defaultDoctor,
      selected: true // Seleccionar automáticamente los nuevos
    }))

    // Añadir a la lista de tratamientos
    setTreatments((prev) => [...prev, ...newTreatments])

    // Actualizar estado del odontograma
    setOdontogramaState((prev) => {
      const newState = { ...prev }
      selectedTeeth.forEach((toothId) => {
        newState[toothId] = 'pendiente'
      })
      return newState
    })

    // Limpiar estados
    setSelectedTeeth([])
    setSelectedCatalogTreatment(null)
    setShowConfirmModal(false)
  }

  // Cancelar la selección
  const handleCancelSelection = () => {
    setSelectedTeeth([])
    setSelectedCatalogTreatment(null)
    setShowConfirmModal(false)
  }

  // Handler para abrir el menú de acciones
  const handleOpenMenu = (
    treatment: TreatmentV2,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setActiveMenu({ treatment, triggerRect: rect })
  }

  // Handler para eliminar tratamiento
  const handleDeleteTreatment = () => {
    if (!activeMenu) return
    setTreatments((prev) =>
      prev.filter((t) => t._internalId !== activeMenu.treatment._internalId)
    )
    setActiveMenu(null)
  }

  // === Handler para añadir fila vacía ===
  const handleAddEmptyRow = () => {
    const newId = `TR-EMPTY-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`
    const newTreatment: TreatmentV2 = {
      _internalId: newId,
      codigo: '',
      tratamiento: '',
      precio: '0 €',
      importe: '0 €',
      descuento: '0 €',
      porcentajeDescuento: 0,
      doctor: defaultDoctor,
      selected: false
    }
    setTreatments((prev) => [...prev, newTreatment])
    setNewRowId(newId)
  }

  // === Toggle selection ===
  const toggleSelection = (internalId: string) => {
    setTreatments((prev) =>
      prev.map((t) =>
        t._internalId === internalId ? { ...t, selected: !t.selected } : t
      )
    )
  }

  // === Update field ===
  const updateField = (
    internalId: string,
    field: keyof TreatmentV2,
    value: string | number | undefined
  ) => {
    setTreatments((prev) =>
      prev.map((t) =>
        t._internalId === internalId ? { ...t, [field]: value } : t
      )
    )
  }

  // Update multiple fields at once (for catalog auto-fill)
  const updateMultipleFields = (
    internalId: string,
    updates: Partial<TreatmentV2>
  ) => {
    setTreatments((prev) =>
      prev.map((t) => (t._internalId === internalId ? { ...t, ...updates } : t))
    )
  }

  // Filter treatments by search AND by selected teeth
  const filteredTreatments = React.useMemo(() => {
    let result = treatments

    // Filtrar por dientes seleccionados en el odontograma
    if (filterByTeeth.length > 0) {
      result = result.filter((t) => t.pieza && filterByTeeth.includes(t.pieza))
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.codigo.toLowerCase().includes(query) ||
          t.tratamiento.toLowerCase().includes(query) ||
          t.doctor.toLowerCase().includes(query)
      )
    }

    return result
  }, [treatments, searchQuery, filterByTeeth])

  // Get selected treatments
  const selectedTreatments = treatments.filter((t) => t.selected)
  const selectedCount = selectedTreatments.length

  // === Cálculos financieros del presupuesto ===
  // Helper para parsear precios (remove € y espacios, convertir comas a puntos)
  const parsePriceToNumber = (price: string): number => {
    const cleaned = price
      .replace(/[€\s]/g, '')
      .replace('.', '')
      .replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  // Subtotal: suma de todos los importes de tratamientos seleccionados
  const subtotal = React.useMemo(() => {
    return selectedTreatments.reduce((sum, t) => {
      return sum + parsePriceToNumber(t.importe)
    }, 0)
  }, [selectedTreatments])

  // Descuento general calculado
  const generalDiscountAmount = React.useMemo(() => {
    if (generalDiscount.value <= 0) return 0
    if (generalDiscount.type === 'percentage') {
      // Limitar al 100%
      const percentage = Math.min(generalDiscount.value, 100)
      return subtotal * (percentage / 100)
    }
    // Limitar al subtotal para evitar negativos
    return Math.min(generalDiscount.value, subtotal)
  }, [generalDiscount, subtotal])

  // Total final
  const totalFinal = React.useMemo(() => {
    return Math.max(0, subtotal - generalDiscountAmount)
  }, [subtotal, generalDiscountAmount])

  // Formatear número a precio español
  const formatPriceDisplay = (num: number): string => {
    return (
      num.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + ' €'
    )
  }

  // Handle create budget - generate PDF and show preview
  const handleCreateBudget = useCallback(async () => {
    if (selectedCount === 0) return

    setIsGenerating(true)

    // Small delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      // Use "Paciente" as placeholder - ideally this would be passed as prop
      const patientName = 'Paciente'

      // Convert TreatmentV2 to BudgetTreatment format
      const budgetTreatments = selectedTreatments.map((t) => ({
        pieza: t.pieza,
        cara: t.cara,
        codigo: t.codigo,
        tratamiento: t.tratamiento,
        precio: t.precio,
        porcentajeDescuento: t.porcentajeDescuento,
        descuento: t.descuento,
        importe: t.importe,
        importeSeguro: t.importeSeguro,
        descripcionAnotaciones: t.descripcionAnotaciones,
        doctor: t.doctor
      }))

      // Prepare budget options with name and general discount
      const budgetOptions: BudgetOptions = {
        budgetName: budgetName || undefined,
        generalDiscount:
          generalDiscount.value > 0 ? generalDiscount : undefined,
        subtotal,
        generalDiscountAmount,
        totalFinal
      }

      const blob = generateBudgetPDF(
        budgetTreatments,
        patientName,
        budgetOptions
      )
      const url = URL.createObjectURL(blob)
      const filename = formatBudgetFilename(
        patientName,
        budgetName || undefined
      )

      setGeneratedDocument({
        professional: budgetName || patientName,
        filename,
        blob,
        url
      })
      setIsPreviewMode(true)
    } catch (error) {
      console.error('Error generating budget PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [
    selectedCount,
    selectedTreatments,
    budgetName,
    generalDiscount,
    subtotal,
    generalDiscountAmount,
    totalFinal
  ])

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    if (generatedDocument) {
      downloadDocument(generatedDocument)
    }
  }, [generatedDocument])

  // Handle confirm budget (after preview)
  const handleConfirmBudget = useCallback(() => {
    // Create budget info object
    const budgetInfo: BudgetInfo = {
      name:
        budgetName || `Presupuesto ${new Date().toLocaleDateString('es-ES')}`,
      subtotal,
      generalDiscountAmount,
      total: totalFinal
    }
    onCreateBudget(selectedTreatments, budgetInfo)
    // Cleanup
    if (generatedDocument?.url) {
      URL.revokeObjectURL(generatedDocument.url)
    }
    setGeneratedDocument(null)
    setIsPreviewMode(false)
  }, [
    generatedDocument,
    onCreateBudget,
    selectedTreatments,
    budgetName,
    subtotal,
    generalDiscountAmount,
    totalFinal
  ])

  // Handle close preview (go back to form)
  const handleClosePreview = useCallback(() => {
    if (generatedDocument?.url) {
      URL.revokeObjectURL(generatedDocument.url)
    }
    setGeneratedDocument(null)
    setIsPreviewMode(false)
  }, [generatedDocument])

  // Handle create budget type (when in budgetType mode)
  const handleCreateBudgetType = useCallback(() => {
    if (selectedCount === 0 || !onCreateBudgetType) return

    // Convert TreatmentV2 to BudgetTypeTreatment format
    const budgetTypeTreatments = selectedTreatments.map((t) => ({
      codigo: t.codigo,
      tratamiento: t.tratamiento,
      precio: parsePriceToNumber(t.precio),
      pieza: t.pieza,
      cara: t.cara
    }))

    // Create budget type data
    const budgetType: Omit<BudgetTypeData, 'id'> = {
      name:
        budgetName ||
        `Presupuesto tipo ${new Date().toLocaleDateString('es-ES')}`,
      description: `${selectedCount} tratamiento${
        selectedCount !== 1 ? 's' : ''
      }`,
      treatments: budgetTypeTreatments,
      totalPrice: totalFinal,
      isActive: true
    }

    onCreateBudgetType(budgetType)
    onClose()
  }, [
    selectedCount,
    selectedTreatments,
    budgetName,
    totalFinal,
    onCreateBudgetType,
    onClose
  ])

  // Calcular total del tratamiento seleccionado
  const calculateTotal = () => {
    if (!selectedCatalogTreatment || selectedTeeth.length === 0) return '0 €'
    const amount = selectedCatalogTreatment.entry.amount
    const numericValue = parseFloat(
      amount
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    )
    if (isNaN(numericValue)) return amount
    const total = numericValue * selectedTeeth.length
    return `${total.toLocaleString('es-ES')} €`
  }

  if (!open || !mounted) return null

  const content = (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Añadir tratamientos a presupuesto'
          onClick={(e) => e.stopPropagation()}
          className='relative w-[min(70rem,90vw)] h-[min(42rem,80vh)] bg-white rounded-lg overflow-hidden flex flex-col'
          data-node-id='3439:7420'
        >
          {/* Conditional rendering: Preview mode vs Form mode */}
          {isPreviewMode && generatedDocument ? (
            <BudgetPdfPreview
              document={generatedDocument}
              onDownload={handleDownloadPdf}
              onClose={handleClosePreview}
              onConfirm={handleConfirmBudget}
            />
          ) : (
            <>
              {/* Header - Proporciones reducidas */}
              <header
                className='flex h-11 items-center justify-between border-b border-neutral-300 px-6 shrink-0'
                data-node-id='3439:7421'
              >
                <p
                  className='text-[0.9375rem] leading-[1.375rem] font-medium text-neutral-900'
                  data-node-id='3439:7422'
                >
                  {mode === 'budgetType'
                    ? 'Crear presupuesto tipo'
                    : 'Añadir tratamientos a presupuesto'}
                </p>
                <button
                  type='button'
                  onClick={onClose}
                  aria-label='Cerrar'
                  className='flex items-center justify-center text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
                  data-node-id='3439:7423'
                >
                  <CloseRounded className='size-4' />
                </button>
              </header>

              {/* Budget Info Section - Nombre del presupuesto */}
              <div className='flex items-center justify-between px-6 py-2 bg-white border-b border-[#E2E7EA] shrink-0'>
                <div className='flex items-center gap-2 flex-1'>
                  {isEditingName ? (
                    <input
                      ref={budgetNameInputRef}
                      type='text'
                      value={budgetName}
                      onChange={(e) => setBudgetName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          setIsEditingName(false)
                        }
                      }}
                      placeholder={
                        mode === 'budgetType'
                          ? 'Nombre del presupuesto tipo...'
                          : 'Nombre del presupuesto...'
                      }
                      className='flex-1 max-w-[24rem] px-3 py-1.5 text-[0.9375rem] font-medium text-[#24282C] bg-[#F4F8FA] border border-[var(--color-brand-400)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand-200)]'
                      autoFocus
                    />
                  ) : (
                    <button
                      type='button'
                      onClick={() => {
                        setIsEditingName(true)
                        setTimeout(() => budgetNameInputRef.current?.focus(), 0)
                      }}
                      className='flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F4F8FA] transition-colors cursor-pointer group'
                    >
                      <EditRounded className='w-[1rem] h-[1rem] text-[#AEB8C2] group-hover:text-[var(--color-brand-500)] transition-colors' />
                      <span className='text-[0.9375rem] font-medium text-[#24282C]'>
                        {budgetName ||
                          (mode === 'budgetType'
                            ? 'Nuevo presupuesto tipo'
                            : 'Nuevo presupuesto')}
                      </span>
                    </button>
                  )}
                </div>
                <div className='flex items-center gap-2 text-[0.75rem] text-[#535C66]'>
                  <span>Creado:</span>
                  <span className='font-medium text-[#24282C]'>
                    {new Date().toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Content - Estructura proporcional (escala ~75%) */}
              <div className='flex-1 flex flex-col bg-[#F8FAFB] relative overflow-hidden'>
                {/* Sección superior fija: Odontograma + Catálogo */}
                <section className='p-[min(0.75rem,1.5vw)] bg-[#F8FAFB] z-10 shrink-0'>
                  {/* Card con Odontograma + Catálogo */}
                  <div className='bg-white border border-[#E2E7EA] rounded-[0.375rem] p-[min(0.75rem,1.5vw)] flex gap-[min(1rem,1.5vw)] items-start'>
                    {/* Columna izquierda: Odontograma + Banner */}
                    <div
                      className='shrink-0 overflow-hidden flex flex-col gap-[0.5rem]'
                      style={{ maxWidth: '28rem' }}
                    >
                      <OdontogramaCompacto
                        state={odontogramaState}
                        onToothClick={handleToothClick}
                        isSelectionMode={!!selectedCatalogTreatment}
                        selectedTeeth={
                          selectedCatalogTreatment
                            ? selectedTeeth
                            : filterByTeeth
                        }
                        showLegend={false}
                      />

                      {/* Banner cuando hay tratamiento seleccionado - debajo del odontograma */}
                      {selectedCatalogTreatment && (
                        <div className='p-[0.5rem] bg-[#E9FBF9] border border-[var(--color-brand-500)] rounded-[0.375rem] flex flex-col gap-[0.375rem]'>
                          <div className='flex items-center gap-[0.375rem]'>
                            <span className='w-[0.375rem] h-[0.375rem] rounded-full bg-[var(--color-brand-500)] animate-pulse shrink-0' />
                            <span className='text-[0.75rem] leading-[1rem] text-[var(--color-brand-700)]'>
                              <strong>{selectedCatalogTreatment.codigo}</strong>{' '}
                              - {selectedCatalogTreatment.entry.description}
                            </span>
                          </div>
                          <div className='flex items-center justify-between gap-[0.375rem]'>
                            {selectedTeeth.length === 0 ? (
                              <span className='text-[0.6875rem] leading-[0.875rem] text-[#535C66]'>
                                → Selecciona las piezas
                              </span>
                            ) : (
                              <span className='text-[0.6875rem] leading-[0.875rem] text-[var(--color-brand-600)]'>
                                Piezas:{' '}
                                <strong>
                                  {selectedTeeth
                                    .sort((a, b) => a - b)
                                    .join(', ')}
                                </strong>
                              </span>
                            )}
                            <div className='flex items-center gap-[0.25rem]'>
                              {selectedTeeth.length > 0 && (
                                <button
                                  type='button'
                                  onClick={handleConfirmTreatments}
                                  className='px-[0.5rem] py-[0.125rem] text-[0.6875rem] font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-full transition-colors cursor-pointer'
                                >
                                  Confirmar ({selectedTeeth.length})
                                </button>
                              )}
                              <button
                                type='button'
                                onClick={handleCancelSelection}
                                className='px-[0.375rem] py-[0.125rem] text-[0.6875rem] text-[#535C66] hover:text-[#24282C] hover:bg-[rgba(0,0,0,0.05)] rounded-full transition-colors cursor-pointer'
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Separador vertical */}
                    <div className='w-px bg-[#CBD3D9] self-stretch shrink-0' />

                    {/* CatalogoTratamientos */}
                    <div className='flex-1 min-w-[15rem]'>
                      <CatalogoTratamientos
                        onSelectTreatment={handleSelectTreatmentFromCatalog}
                        onDoubleClickTreatment={
                          handleDoubleClickTreatmentFromCatalog
                        }
                        selectedTreatmentCode={selectedCatalogTreatment?.codigo}
                        compact
                      />
                    </div>
                  </div>
                </section>

                {/* Banner de filtro por piezas activo */}
                {filterByTeeth.length > 0 && !selectedCatalogTreatment && (
                  <div className='mx-[min(1.5rem,3vw)] mb-[0.5rem] p-[0.5rem] bg-[#FFF8E6] border border-[#D97706] rounded-[0.375rem] flex items-center justify-between'>
                    <div className='flex items-center gap-[0.5rem]'>
                      <span className='text-[0.8125rem] leading-[1.125rem] text-[#92400E]'>
                        Filtrando por pieza{filterByTeeth.length > 1 ? 's' : ''}
                        :{' '}
                        <strong>
                          {filterByTeeth.sort((a, b) => a - b).join(', ')}
                        </strong>
                      </span>
                      <span className='text-[0.75rem] leading-[1rem] text-[#B45309]'>
                        ({filteredTreatments.length} tratamiento
                        {filteredTreatments.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => setFilterByTeeth([])}
                      className='px-[0.5rem] py-[0.125rem] text-[0.75rem] text-[#92400E] hover:text-[#78350F] hover:bg-[rgba(0,0,0,0.05)] rounded-full transition-colors cursor-pointer'
                    >
                      Limpiar filtro
                    </button>
                  </div>
                )}

                {/* Contenido scrolleable: Tablas */}
                <div ref={scrollContainerRef} className='flex-1 overflow-auto'>
                  {/* Sección: Tratamientos del presupuesto */}
                  <section className='px-[min(1.5rem,3vw)] pb-[min(1rem,2vw)]'>
                    {/* Header sticky - proporciones reducidas */}
                    <div className='sticky top-0 z-20 pt-[min(0.75rem,1.5vw)] pb-[0.375rem] bg-[#F8FAFB]'>
                      <div className='flex items-center justify-between'>
                        <h2 className='text-[1.25rem] leading-[1.75rem] text-[#24282C]'>
                          Tratamientos del presupuesto
                        </h2>
                        <div className='flex items-center gap-[0.375rem]'>
                          {/* Search */}
                          <button
                            type='button'
                            className='p-[0.125rem] hover:bg-[var(--color-neutral-100)] rounded transition-colors cursor-pointer'
                            onClick={() => {
                              const term = prompt('Buscar:', searchQuery)
                              if (term !== null) setSearchQuery(term)
                            }}
                          >
                            <SearchRounded className='w-[1.25rem] h-[1.25rem] text-[#535C66]' />
                          </button>
                          {/* Filtro Presupuestos */}
                          <button
                            type='button'
                            className='flex items-center gap-[0.375rem] px-[0.75rem] py-[0.25rem] border border-[#CBD3D9] rounded-[8.5rem] bg-white hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
                          >
                            <FilterListRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
                              Presupuestos
                            </span>
                          </button>
                          {/* Añadir tratamiento */}
                          <button
                            type='button'
                            onClick={handleAddEmptyRow}
                            className='flex items-center gap-[0.375rem] px-[0.75rem] py-[0.25rem] border border-[var(--color-brand-400)] bg-[#E9FBF9] rounded-[8.5rem] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
                          >
                            <AddRounded className='w-[1rem] h-[1rem] text-[var(--color-brand-700)]' />
                            <span className='text-[0.75rem] leading-[1rem] font-medium text-[var(--color-brand-700)]'>
                              Añadir tratamiento
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabla Tratamientos - Proporciones reducidas (~75%) */}
                    <div className='bg-white rounded-[0.375rem] overflow-hidden'>
                      <div className='table-scroll-x'>
                        <table className='w-full border-collapse min-w-[80rem]'>
                          <thead>
                            <tr className='bg-[#F8FAFB]'>
                              <TableHeaderCell
                                width='2rem'
                                sticky
                                stickyPosition='left'
                              />
                              <TableHeaderCell width='3.5rem'>
                                Pieza
                              </TableHeaderCell>
                              <TableHeaderCell width='5rem'>
                                Cara
                              </TableHeaderCell>
                              <TableHeaderCell width='4.5rem'>
                                Código
                              </TableHeaderCell>
                              <TableHeaderCell width='15rem'>
                                Tratamiento
                              </TableHeaderCell>
                              <TableHeaderCell width='5.5rem'>
                                Precio
                              </TableHeaderCell>
                              <TableHeaderCell width='4rem'>%</TableHeaderCell>
                              <TableHeaderCell width='4rem'>
                                Dto
                              </TableHeaderCell>
                              <TableHeaderCell width='5rem'>
                                Importe
                              </TableHeaderCell>
                              <TableHeaderCell width='5rem'>
                                Imp. seguro
                              </TableHeaderCell>
                              <TableHeaderCell>
                                Descripción/ Anotaciones
                              </TableHeaderCell>
                              <TableHeaderCell width='10.5rem'>
                                Doctor
                              </TableHeaderCell>
                              <TableHeaderCell
                                width='1.75rem'
                                sticky
                                stickyPosition='right'
                              />
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTreatments.length === 0 ? (
                              <tr>
                                <td colSpan={13} className='py-12 text-center'>
                                  <div className='flex flex-col items-center justify-center text-neutral-500'>
                                    <SearchRounded className='size-12 mb-3 opacity-30' />
                                    <p className='text-body-md'>
                                      No se encontraron tratamientos
                                    </p>
                                    {filterByTeeth.length > 0 && (
                                      <button
                                        type='button'
                                        onClick={() => setFilterByTeeth([])}
                                        className='mt-2 text-body-sm text-brand-600 hover:underline cursor-pointer'
                                      >
                                        Limpiar filtro de piezas
                                      </button>
                                    )}
                                    <button
                                      type='button'
                                      onClick={handleAddEmptyRow}
                                      className='mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500 text-brand-900 hover:bg-brand-400 transition-colors cursor-pointer'
                                    >
                                      <AddRounded className='size-5' />
                                      <span className='text-body-md font-medium'>
                                        Añadir tratamiento
                                      </span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              filteredTreatments.map((treatment) => (
                                <TreatmentRow
                                  key={treatment._internalId}
                                  treatment={treatment}
                                  onToggleSelection={() =>
                                    toggleSelection(treatment._internalId)
                                  }
                                  onOpenMenu={(e) =>
                                    handleOpenMenu(treatment, e)
                                  }
                                  onUpdateField={(field, value) =>
                                    updateField(
                                      treatment._internalId,
                                      field,
                                      value
                                    )
                                  }
                                  onUpdateMultipleFields={(updates) =>
                                    updateMultipleFields(
                                      treatment._internalId,
                                      updates
                                    )
                                  }
                                  isNewRow={treatment._internalId === newRowId}
                                  onNewRowMounted={() => setNewRowId(null)}
                                  professionals={professionalNameOptions}
                                />
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Modal de confirmación de tratamientos */}
                {showConfirmModal && selectedCatalogTreatment && (
                  <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-[1rem] w-[min(28rem,90vw)] max-h-[80vh] overflow-hidden shadow-xl'>
                      {/* Header */}
                      <div className='p-[1.5rem] border-b border-[#E2E7EA]'>
                        <h3 className='text-[1.25rem] leading-[1.75rem] font-medium text-[#24282C]'>
                          Confirmar tratamiento
                        </h3>
                      </div>

                      {/* Content */}
                      <div className='p-[1.5rem]'>
                        {/* Tratamiento */}
                        <div className='mb-[1.5rem]'>
                          <p className='text-[0.875rem] text-[#535C66] mb-[0.25rem]'>
                            Tratamiento
                          </p>
                          <p className='text-[1rem] font-medium text-[#24282C]'>
                            <span className='text-[var(--color-brand-600)]'>
                              {selectedCatalogTreatment.codigo}
                            </span>{' '}
                            - {selectedCatalogTreatment.entry.description}
                          </p>
                          <p className='text-[0.9375rem] text-[#535C66] mt-[0.25rem]'>
                            Precio unitario:{' '}
                            <strong>
                              {selectedCatalogTreatment.entry.amount}
                            </strong>
                          </p>
                        </div>

                        {/* Piezas */}
                        <div className='mb-[1.5rem]'>
                          <p className='text-[0.875rem] text-[#535C66] mb-[0.5rem]'>
                            Piezas seleccionadas ({selectedTeeth.length})
                          </p>
                          <div className='flex flex-wrap gap-[0.5rem]'>
                            {selectedTeeth
                              .sort((a, b) => a - b)
                              .map((tooth) => (
                                <span
                                  key={tooth}
                                  className='inline-flex items-center justify-center w-[2.5rem] h-[2rem] bg-[#E9FBF9] border border-[var(--color-brand-400)] rounded-[0.5rem] text-[0.875rem] font-medium text-[var(--color-brand-700)]'
                                >
                                  {tooth}
                                </span>
                              ))}
                          </div>
                        </div>

                        {/* Resumen */}
                        <div className='p-[1rem] bg-[#F8FAFB] rounded-[0.5rem]'>
                          <div className='flex justify-between items-center'>
                            <span className='text-[0.9375rem] text-[#535C66]'>
                              Total ({selectedTeeth.length} tratamiento
                              {selectedTeeth.length !== 1 ? 's' : ''})
                            </span>
                            <span className='text-[1.125rem] font-semibold text-[#24282C]'>
                              {(() => {
                                const priceStr =
                                  selectedCatalogTreatment.entry.amount
                                const priceNum =
                                  parseFloat(
                                    priceStr
                                      .replace(/[^\d,.-]/g, '')
                                      .replace('.', '')
                                      .replace(',', '.')
                                  ) || 0
                                const total = priceNum * selectedTeeth.length
                                return (
                                  total.toLocaleString('es-ES', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  }) + ' €'
                                )
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className='p-[1.5rem] border-t border-[#E2E7EA] flex justify-end gap-[0.75rem]'>
                        <button
                          type='button'
                          onClick={() => setShowConfirmModal(false)}
                          className='px-[1.25rem] py-[0.625rem] text-[0.9375rem] font-medium text-[#535C66] hover:bg-[#F4F8FA] rounded-full transition-colors cursor-pointer'
                        >
                          Volver
                        </button>
                        <button
                          type='button'
                          onClick={handleConfirmTreatments}
                          className='px-[1.5rem] py-[0.625rem] text-[0.9375rem] font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-full transition-colors cursor-pointer'
                        >
                          Añadir tratamientos
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menú de acciones rápidas */}
                {activeMenu && (
                  <RowActionsMenu
                    treatment={{
                      id: activeMenu.treatment.codigo,
                      description: activeMenu.treatment.tratamiento,
                      date: 'Sin fecha',
                      amount: activeMenu.treatment.precio,
                      status: 'Aceptado',
                      professional: activeMenu.treatment.doctor,
                      selected: false
                    }}
                    onClose={() => setActiveMenu(null)}
                    triggerRect={activeMenu.triggerRect}
                    onCreateBudget={() => {
                      // Already in budget creation, no action needed
                      setActiveMenu(null)
                    }}
                    onCreateAppointment={() => {
                      // Not applicable in budget modal
                      setActiveMenu(null)
                    }}
                    onToggleStatus={() => {}}
                    onDelete={handleDeleteTreatment}
                  />
                )}

                {/* Footer compacto con resumen financiero en una línea */}
                <footer className='sticky bottom-0 bg-white border-t border-[#E2E7EA] px-4 py-2 shrink-0'>
                  <div className='flex items-center justify-between gap-4'>
                    {/* Izquierda: Info de selección */}
                    <p className='text-[0.75rem] text-[#535C66] shrink-0'>
                      {selectedCount} tratamiento
                      {selectedCount !== 1 ? 's' : ''}
                    </p>

                    {/* Centro-derecha: Resumen financiero compacto */}
                    <div className='flex items-center gap-3 flex-wrap justify-end'>
                      {/* Subtotal */}
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[0.6875rem] text-[#AEB8C2]'>
                          Subtotal
                        </span>
                        <span className='text-[0.75rem] font-medium text-[#535C66]'>
                          {formatPriceDisplay(subtotal)}
                        </span>
                      </div>

                      {/* Separador visual */}
                      <div className='w-px h-4 bg-[#E2E7EA]' />

                      {/* Descuento general */}
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[0.6875rem] text-[#AEB8C2]'>
                          Dto.
                        </span>
                        {/* Toggle % / € */}
                        <div className='flex items-center bg-[#F4F8FA] rounded-full p-0.5'>
                          <button
                            type='button'
                            onClick={() =>
                              setGeneralDiscount((prev) => ({
                                ...prev,
                                type: 'percentage'
                              }))
                            }
                            className={`px-1.5 py-0.5 text-[0.625rem] font-medium rounded-full transition-colors cursor-pointer ${
                              generalDiscount.type === 'percentage'
                                ? 'bg-[var(--color-brand-500)] text-white'
                                : 'text-[#535C66] hover:text-[#24282C]'
                            }`}
                          >
                            %
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              setGeneralDiscount((prev) => ({
                                ...prev,
                                type: 'fixed'
                              }))
                            }
                            className={`px-1.5 py-0.5 text-[0.625rem] font-medium rounded-full transition-colors cursor-pointer ${
                              generalDiscount.type === 'fixed'
                                ? 'bg-[var(--color-brand-500)] text-white'
                                : 'text-[#535C66] hover:text-[#24282C]'
                            }`}
                          >
                            €
                          </button>
                        </div>
                        <input
                          type='number'
                          min='0'
                          max={
                            generalDiscount.type === 'percentage'
                              ? 100
                              : subtotal
                          }
                          value={generalDiscount.value || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setGeneralDiscount((prev) => ({
                              ...prev,
                              value: val
                            }))
                          }}
                          placeholder='0'
                          className='w-[3rem] px-1.5 py-0.5 text-[0.6875rem] text-right text-[#24282C] bg-[#F4F8FA] border border-[#CBD3D9] rounded outline-none focus:border-[var(--color-brand-400)]'
                        />
                        {generalDiscountAmount > 0 && (
                          <span className='text-[0.6875rem] font-medium text-[#22C55E]'>
                            -{formatPriceDisplay(generalDiscountAmount)}
                          </span>
                        )}
                      </div>

                      {/* Separador visual */}
                      <div className='w-px h-4 bg-[#E2E7EA]' />

                      {/* Total */}
                      <div className='flex items-center gap-1.5 bg-[#F4F8FA] px-3 py-1 rounded-lg'>
                        <span className='text-[0.75rem] font-semibold text-[#24282C]'>
                          TOTAL
                        </span>
                        <span className='text-[0.9375rem] font-bold text-[var(--color-brand-700)]'>
                          {formatPriceDisplay(totalFinal)}
                        </span>
                      </div>

                      {/* Botones */}
                      <button
                        type='button'
                        onClick={onClose}
                        className='px-3 py-1.5 border border-[#CBD3D9] rounded-full text-[0.75rem] font-medium text-[#24282C] hover:bg-[#F4F8FA] transition-colors cursor-pointer'
                      >
                        Cancelar
                      </button>
                      <button
                        type='button'
                        onClick={
                          mode === 'budgetType'
                            ? handleCreateBudgetType
                            : handleCreateBudget
                        }
                        disabled={selectedCount === 0 || isGenerating}
                        className={[
                          'px-4 py-1.5 rounded-full text-[0.75rem] font-medium transition-colors',
                          selectedCount === 0 || isGenerating
                            ? 'bg-[#E2E7EA] text-[#AEB8C2] cursor-not-allowed'
                            : 'bg-[#51D6C7] text-[#1E4947] hover:bg-[#3ECBBB] cursor-pointer'
                        ].join(' ')}
                      >
                        {isGenerating
                          ? 'Generando...'
                          : mode === 'budgetType'
                            ? 'Guardar presupuesto tipo'
                            : 'Crear presupuesto'}
                      </button>
                    </div>
                  </div>
                </footer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
