'use client'

import {
  AddRounded,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  ElectricBoltRounded,
  FilterListRounded,
  KeyboardArrowDownRounded,
  MoreVertRounded,
  SearchRounded
} from '@/components/icons/md3'
import CatalogoTratamientos from '@/components/pacientes/shared/CatalogoTratamientos'
import CellSelect from '@/components/pacientes/shared/CellSelect'
import ExpandedTextInput from '@/components/pacientes/shared/ExpandedTextInput'
import OdontogramaCompacto from '@/components/pacientes/shared/OdontogramaCompacto'
import { RowActionsMenu } from '@/components/pacientes/shared/RowActionsMenu'
import {
  convertBudgetTypeToTreatmentsV2,
  type BudgetTypeData
} from '@/components/pacientes/shared/budgetTypeData'
import type {
  OdontogramaState,
  TreatmentCatalogEntry,
  TreatmentV2
} from '@/components/pacientes/shared/treatmentTypes'
import {
  FAMILY_TO_SPECIALTY,
  TREATMENT_CATALOG
} from '@/components/pacientes/shared/treatmentTypes'
import { useConfiguration } from '@/context/ConfigurationContext'
import { usePatients, type PatientTreatment } from '@/context/PatientsContext'
import { setPendingAppointmentData } from '@/utils/appointmentPrefill'
import { useRouter } from 'next/navigation'
import React from 'react'
import AddTreatmentsToBudgetModal from './AddTreatmentsToBudgetModal'
import BudgetTypeListModal from './BudgetTypeListModal'
import type { BudgetRow } from './BudgetsPayments'

// Helper para convertir PatientTreatment del contexto a TreatmentV2 para la tabla
function convertPatientTreatmentToV2(
  treatment: PatientTreatment,
  index: number
): TreatmentV2 {
  // Parsear el diente a número si existe
  const toothNumber = treatment.tooth
    ? parseInt(treatment.tooth.split(',')[0].trim())
    : undefined

  return {
    _internalId: treatment.id,
    pieza: toothNumber,
    codigo: treatment.code,
    tratamiento: treatment.description,
    precio: treatment.amountFormatted,
    importe: treatment.amountFormatted,
    descuento: '0 €',
    porcentajeDescuento: 0,
    descripcionAnotaciones: treatment.notes || '',
    doctor: treatment.professional,
    selected: treatment.markedForNextAppointment || false,
    // Campos para historial
    estado:
      treatment.status === 'Completado'
        ? 'completado'
        : treatment.status === 'En curso'
          ? 'en_progreso'
          : treatment.status === 'Cancelado'
            ? 'cancelado'
            : 'pendiente',
    fechaCreacion: treatment.createdAt,
    fechaRealizacion: treatment.completedDate
  }
}

// ============================================
// Mock Data - Nuevo formato V2
// ============================================
const MOCK_ODONTOGRAMA_STATE: OdontogramaState = {
  22: 'pendiente',
  23: 'finalizado',
  26: 'finalizado',
  35: 'finalizado',
  37: 'pendiente',
  38: 'pendiente',
  46: 'finalizado'
}

const PENDING_TREATMENTS_V2: TreatmentV2[] = [
  {
    _internalId: 'pending-0',
    pieza: 23,
    cara: 'Vestibular',
    codigo: 'CZ',
    tratamiento: 'Carilla de Zirconio',
    precio: '500€',
    porcentajeDescuento: 14,
    descuento: '72 €',
    importe: '400 €',
    importeSeguro: '72 €',
    descripcionAnotaciones: 'Exodoncia simple, muy bien',
    doctor: 'Dr. Guillermo',
    selected: false
  },
  {
    _internalId: 'pending-1',
    pieza: 23,
    cara: 'Vestibular',
    codigo: 'CPDC',
    tratamiento: 'Corona Preformada Dentición Perm...',
    precio: '500€',
    porcentajeDescuento: 14,
    descuento: '72 €',
    importe: '400 €',
    importeSeguro: '72 €',
    descripcionAnotaciones: 'Exodoncia simple, muy bien',
    doctor: 'Dr. Guillermo',
    selected: false
  }
]

const HISTORY_TREATMENTS_V2: TreatmentV2[] = [
  {
    _internalId: 'history-0',
    pieza: 23,
    cara: 'Vestibular',
    codigo: 'CZ',
    tratamiento: 'Carilla de Zirconio',
    precio: '500€',
    porcentajeDescuento: 14,
    descuento: '72 €',
    importe: '400 €',
    importeSeguro: '72 €',
    descripcionAnotaciones: 'Exodoncia simple, muy bien',
    doctor: 'Dr. Guillermo',
    selected: false
  },
  {
    _internalId: 'history-1',
    pieza: 23,
    cara: 'Vestibular',
    codigo: 'CZ',
    tratamiento: 'Carilla de Zirconio',
    precio: '500€',
    porcentajeDescuento: 14,
    descuento: '72 €',
    importe: '400 €',
    importeSeguro: '72 €',
    descripcionAnotaciones: 'Exodoncia simple, muy bien',
    doctor: 'Dr. Guillermo',
    selected: false
  },
  {
    _internalId: 'history-2',
    pieza: 23,
    cara: 'Vestibular',
    codigo: 'CZ',
    tratamiento: 'Carilla de Zirconio',
    precio: '500€',
    porcentajeDescuento: 14,
    descuento: '72 €',
    importe: '400 €',
    importeSeguro: '72 €',
    descripcionAnotaciones: 'Exodoncia simple, muy bien',
    doctor: 'Dr. Guillermo',
    selected: false
  },
  {
    _internalId: 'history-3',
    pieza: 23,
    cara: 'Vestibular',
    codigo: 'CZ',
    tratamiento: 'Carilla de Zirconio',
    precio: '500€',
    porcentajeDescuento: 14,
    descuento: '72 €',
    importe: '400 €',
    importeSeguro: '72 €',
    descripcionAnotaciones: 'Exodoncia simple, muy bien',
    doctor: 'Dr. Guillermo',
    selected: false
  }
]

// ============================================
// Table Components
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
        'border-b-[0.5px] border-[#CBD3D9] px-[0.5rem] py-[0.25rem] text-left text-[1rem] leading-[1.5rem] font-normal text-[#535C66]',
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
        'border-b-[0.5px] border-[#CBD3D9] px-[0.5rem] py-[0.5rem] text-[1rem] leading-[1.5rem] text-[#24282C]',
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
      className={`w-full bg-transparent border-none outline-none text-[0.875rem] leading-[1.25rem] text-[#24282C] 
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
    value: string | number | undefined | boolean
  ) => void
  onUpdateMultipleFields?: (updates: Partial<TreatmentV2>) => void
  isNewRow?: boolean
  onNewRowMounted?: () => void
  isHistoryTable?: boolean // HU-011: Flag to show history-specific columns (fechaRealizacion, facturado)
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
  isHistoryTable = false,
  professionals
}: TreatmentRowProps) {
  const rowRef = React.useRef<HTMLTableRowElement>(null)
  const firstInputRef = React.useRef<HTMLInputElement>(null)

  // Focus first input when it's a new row (scroll only if needed)
  React.useEffect(() => {
    if (isNewRow && rowRef.current) {
      // Solo hacer scroll si la fila no está visible, usando 'nearest' para minimizar el movimiento
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Focus the first input after a brief delay
      setTimeout(() => {
        firstInputRef.current?.focus()
        firstInputRef.current?.select()
        onNewRowMounted?.()
      }, 100)
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
      {/* Cara - Custom Select */}
      <TableBodyCell width='6.625rem'>
        <CellSelect
          value={treatment.cara || ''}
          onChange={(v) => onUpdateField('cara', v || undefined)}
          placeholder='-'
          options={[
            { value: '', label: '-' },
            { value: 'Vestibular', label: 'Vestibular' },
            { value: 'Oclusal', label: 'Oclusal' },
            { value: 'Mesial', label: 'Mesial' },
            { value: 'Distal', label: 'Distal' },
            { value: 'Lingual', label: 'Lingual' },
            { value: 'Palatino', label: 'Palatino' },
            { value: 'Incisal', label: 'Incisal' }
          ]}
        />
      </TableBodyCell>
      {/* Código - Editable con autocompletado del catálogo */}
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
        <span className='text-[0.875rem] leading-[1.25rem] text-[#24282C] px-1'>
          {treatment.descuento || '-'}
        </span>
      </TableBodyCell>
      {/* Importe - Autocalculado (read-only) */}
      <TableBodyCell width='6.25rem'>
        <span className='text-[0.875rem] leading-[1.25rem] text-[#24282C] px-1'>
          {treatment.importe}
        </span>
      </TableBodyCell>

      {/* HU-011: Columnas específicas de historial vs pendientes */}
      {isHistoryTable ? (
        <>
          {/* Fecha realización - Solo historial */}
          <TableBodyCell width='7rem'>
            <span className='text-[0.875rem] leading-[1.25rem] text-[#24282C] px-1'>
              {treatment.fechaRealizacion
                ? new Date(treatment.fechaRealizacion).toLocaleDateString(
                    'es-ES',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    }
                  )
                : '-'}
            </span>
          </TableBodyCell>
          {/* Facturado - Solo historial */}
          <TableBodyCell width='5.5rem'>
            <div className='flex items-center gap-1'>
              {treatment.facturado ? (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-[0.75rem] font-medium'>
                  Sí
                </span>
              ) : (
                <span className='inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] text-[0.75rem] font-medium'>
                  No
                </span>
              )}
              {treatment.facturaNumero && (
                <span className='text-[0.75rem] text-[var(--color-neutral-500)]'>
                  #{treatment.facturaNumero}
                </span>
              )}
            </div>
          </TableBodyCell>
        </>
      ) : (
        /* Imp. seguro - Solo pendientes (Editable) */
        <TableBodyCell width='6.875rem'>
          <EditableCell
            value={treatment.importeSeguro || ''}
            onChange={(v) => onUpdateField('importeSeguro', v)}
            placeholder='-'
          />
        </TableBodyCell>
      )}

      {/* Descripción/Anotaciones - con ExpandedTextInput */}
      <TableBodyCell className='max-w-[21.375rem]'>
        <ExpandedTextInput
          value={treatment.descripcionAnotaciones || ''}
          onChange={(v) => onUpdateField('descripcionAnotaciones', v)}
          placeholder='Añadir anotaciones...'
        />
      </TableBodyCell>
      {/* Doctor - Custom Select */}
      <TableBodyCell width='14.1875rem'>
        <CellSelect
          value={treatment.doctor || ''}
          onChange={(v) => onUpdateField('doctor', v || undefined)}
          placeholder='Sin asignar'
          options={[
            { value: '', label: 'Sin asignar' },
            ...professionals
          ]}
        />
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
// Main Component
// ============================================
type TreatmentsProps = {
  onCreateBudget?: (selectedTreatments: TreatmentV2[]) => void
  onCreateAppointment?: (treatment: TreatmentV2) => void
  onAddBudget?: (budget: BudgetRow) => void
  onCancel?: () => void
  onClose?: () => void
  patientId?: string
  patientName?: string
  openAddTreatment?: boolean
  onAddTreatmentOpened?: () => void
}

export default function Treatments({
  onCreateBudget,
  onAddBudget,
  onCancel,
  onClose,
  patientId,
  patientName,
  openAddTreatment,
  onAddTreatmentOpened
}: TreatmentsProps) {
  const router = useRouter()

  // Contexto de configuración
  const { professionalNameOptions, activeProfessionals, addBudgetType } =
    useConfiguration()

  const getSmartDoctor = React.useCallback(
    (familia?: string): string | undefined => {
      if (!familia) return undefined
      const compatibleSpecialties = FAMILY_TO_SPECIALTY[familia]
      if (!compatibleSpecialties) return undefined
      const matches = activeProfessionals.filter((p) =>
        compatibleSpecialties.includes(p.role)
      )
      return matches.length === 1 ? matches[0].name : undefined
    },
    [activeProfessionals]
  )

  // Contexto de pacientes
  const {
    getPendingTreatments,
    getTreatmentsByPatient,
    toggleTreatmentForNextAppointment,
    updateTreatment
  } = usePatients()

  // State
  const [odontogramaState, setOdontogramaState] =
    React.useState<OdontogramaState>(MOCK_ODONTOGRAMA_STATE)
  const [pendingTreatments, setPendingTreatments] = React.useState<
    TreatmentV2[]
  >([])
  const [historyTreatments, setHistoryTreatments] = React.useState<
    TreatmentV2[]
  >([])
  const [searchPending, setSearchPending] = React.useState('')
  const [searchHistory, setSearchHistory] = React.useState('')
  const [dateFilter, setDateFilter] = React.useState('Últimos 6 meses')

  // Cargar tratamientos del contexto cuando hay patientId
  React.useEffect(() => {
    if (patientId) {
      // Cargar tratamientos pendientes (Pendiente + En curso)
      const pending = getPendingTreatments(patientId)
      const pendingV2 = pending.map((t, i) => convertPatientTreatmentToV2(t, i))
      setPendingTreatments(pendingV2)

      // Cargar historial (Completados + Cancelados)
      const allTreatments = getTreatmentsByPatient(patientId)
      const completed = allTreatments.filter(
        (t) => t.status === 'Completado' || t.status === 'Cancelado'
      )
      const historyV2 = completed.map((t, i) =>
        convertPatientTreatmentToV2(t, i)
      )
      setHistoryTreatments(historyV2)

      // Actualizar odontograma basado en los tratamientos
      const newOdontogramaState: OdontogramaState = {}
      allTreatments.forEach((t) => {
        if (t.tooth) {
          // Puede tener múltiples piezas separadas por coma
          const teeth = t.tooth
            .split(',')
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n))
          teeth.forEach((toothId) => {
            if (t.status === 'Completado') {
              newOdontogramaState[toothId] = 'finalizado'
            } else if (t.status === 'Pendiente' || t.status === 'En curso') {
              // Solo marcar como pendiente si no está ya finalizado
              if (newOdontogramaState[toothId] !== 'finalizado') {
                newOdontogramaState[toothId] = 'pendiente'
              }
            }
          })
        }
      })
      setOdontogramaState(newOdontogramaState)
    }
  }, [patientId, getPendingTreatments, getTreatmentsByPatient])

  // Estado para el tratamiento seleccionado del catálogo (esperando asignar pieza dental)
  const [selectedCatalogTreatment, setSelectedCatalogTreatment] =
    React.useState<{
      codigo: string
      entry: TreatmentCatalogEntry
    } | null>(null)

  // Estado para las piezas seleccionadas temporalmente (antes de confirmar - para añadir tratamientos)
  const [selectedTeeth, setSelectedTeeth] = React.useState<number[]>([])

  // Estado para mostrar el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = React.useState(false)

  // Estado para filtrar tratamientos por piezas (cuando NO hay tratamiento del catálogo seleccionado)
  const [filterByTeeth, setFilterByTeeth] = React.useState<number[]>([])

  // Menú de acciones
  const [activeMenu, setActiveMenu] = React.useState<{
    treatment: TreatmentV2
    section: 'pending' | 'history'
    triggerRect?: DOMRect
  } | null>(null)

  // Estado para trackear la nueva fila añadida manualmente
  const [newRowId, setNewRowId] = React.useState<string | null>(null)

  // Estado para mostrar el modal de crear presupuesto
  const [showBudgetModal, setShowBudgetModal] = React.useState(false)

  // Estado para el modal de presupuestos tipo
  const [showBudgetTypeModal, setShowBudgetTypeModal] = React.useState(false)
  const [budgetTypeTreatments, setBudgetTypeTreatments] = React.useState<
    TreatmentV2[] | undefined
  >(undefined)
  const [budgetTypeName, setBudgetTypeName] = React.useState<string>('')

  // Estado para crear nuevo presupuesto tipo
  const [showCreateBudgetTypeModal, setShowCreateBudgetTypeModal] =
    React.useState(false)

  // Handler para seleccionar un presupuesto tipo
  const handleBudgetTypeSelect = React.useCallback(
    (budgetType: BudgetTypeData) => {
      const treatments = convertBudgetTypeToTreatmentsV2(budgetType)
      setBudgetTypeTreatments(treatments)
      setBudgetTypeName(budgetType.name)
      setShowBudgetTypeModal(false)
      setShowBudgetModal(true)
    },
    []
  )

  // Handler para abrir el modal de crear nuevo presupuesto tipo
  const handleCreateNewBudgetType = React.useCallback(() => {
    setShowBudgetTypeModal(false)
    setShowCreateBudgetTypeModal(true)
  }, [])

  // Handler para guardar el nuevo presupuesto tipo
  const handleSaveBudgetType = React.useCallback(
    (budgetType: Omit<BudgetTypeData, 'id'>) => {
      addBudgetType(budgetType)
      setShowCreateBudgetTypeModal(false)
    },
    [addBudgetType]
  )

  // Handlers
  const handleToothClick = (toothId: number) => {
    // Si hay un tratamiento seleccionado del catálogo, añadir/quitar pieza de la selección temporal (para añadir tratamientos)
    if (selectedCatalogTreatment) {
      setSelectedTeeth((prev) => {
        if (prev.includes(toothId)) {
          return prev.filter((id) => id !== toothId)
        }
        return [...prev, toothId]
      })
      return
    }

    // Si NO hay tratamiento del catálogo, usar el clic para filtrar tratamientos por pieza
    setFilterByTeeth((prev) => {
      if (prev.includes(toothId)) {
        // Si ya está en el filtro, quitarla
        return prev.filter((id) => id !== toothId)
      }
      // Si no está, añadirla al filtro
      return [...prev, toothId]
    })
  }

  // Confirmar y añadir los tratamientos
  const handleConfirmTreatments = () => {
    if (!selectedCatalogTreatment || selectedTeeth.length === 0) return

    const { codigo, entry } = selectedCatalogTreatment

    // Crear un tratamiento por cada pieza seleccionada
    const smartDoctor = getSmartDoctor(entry.familia)
    const newTreatments: TreatmentV2[] = selectedTeeth.map((toothId) => ({
      _internalId: `new-${Date.now()}-${Math.random()}-${toothId}`,
      pieza: toothId,
      codigo,
      tratamiento: entry.description,
      precio: entry.amount,
      importe: entry.amount,
      doctor: smartDoctor,
      selected: false
    }))

    // Añadir a tratamientos pendientes
    setPendingTreatments((prev) => [...prev, ...newTreatments])

    // Actualizar el odontograma
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

  const handleSelectTreatmentFromCatalog = (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => {
    // Si se hace clic en el mismo tratamiento ya seleccionado, deseleccionarlo
    if (selectedCatalogTreatment?.codigo === codigo) {
      setSelectedCatalogTreatment(null)
      setSelectedTeeth([])
      return
    }
    // Seleccionar el tratamiento (queda esperando que el usuario seleccione piezas)
    setSelectedCatalogTreatment({ codigo, entry })
    setSelectedTeeth([]) // Limpiar piezas anteriores al cambiar de tratamiento
  }

  // Handler para doble clic: añadir tratamiento directamente sin seleccionar pieza
  const handleDoubleClickTreatmentFromCatalog = (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => {
    const newTreatment: TreatmentV2 = {
      _internalId: `new-${Date.now()}-${Math.random()}`,
      pieza: undefined,
      codigo,
      tratamiento: entry.description,
      precio: entry.amount,
      importe: entry.amount,
      descuento: '0 €',
      porcentajeDescuento: 0,
      doctor: getSmartDoctor(entry.familia),
      selected: false
    }

    // Añadir a tratamientos pendientes
    setPendingTreatments((prev) => [...prev, newTreatment])

    // Marcar como nueva fila para hacer scroll y focus
    setNewRowId(newTreatment._internalId)

    // Limpiar cualquier selección previa del catálogo
    setSelectedCatalogTreatment(null)
    setSelectedTeeth([])
  }

  const toggleSelection = (
    internalId: string,
    section: 'pending' | 'history'
  ) => {
    // Actualizar estado local para UI
    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) =>
          t._internalId === internalId ? { ...t, selected: !t.selected } : t
        )
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) =>
          t._internalId === internalId ? { ...t, selected: !t.selected } : t
        )
      )
    }

    // Sincronizar con el contexto de pacientes si hay patientId
    // El internalId corresponde al treatment.id del contexto
    if (patientId) {
      toggleTreatmentForNextAppointment(patientId, internalId)
    }
  }

  const updateField = (
    internalId: string,
    field: keyof TreatmentV2,
    value: string | number | boolean | undefined,
    section: 'pending' | 'history'
  ) => {
    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) =>
          t._internalId === internalId ? { ...t, [field]: value } : t
        )
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) =>
          t._internalId === internalId ? { ...t, [field]: value } : t
        )
      )
    }
  }

  // Actualizar múltiples campos a la vez (para autocompletado del catálogo)
  const updateMultipleFields = (
    internalId: string,
    updates: Partial<TreatmentV2>,
    section: 'pending' | 'history'
  ) => {
    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) =>
          t._internalId === internalId ? { ...t, ...updates } : t
        )
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) =>
          t._internalId === internalId ? { ...t, ...updates } : t
        )
      )
    }
  }

  // Handler para añadir fila vacía
  const handleAddEmptyRow = React.useCallback(() => {
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
      doctor: undefined,
      selected: false
    }
    setPendingTreatments((prev) => [...prev, newTreatment])
    setNewRowId(newId)
  }, [])

  // Effect to auto-add empty row when navigating from Resumen with "add treatment" action
  React.useEffect(() => {
    if (openAddTreatment) {
      handleAddEmptyRow()
      onAddTreatmentOpened?.()
    }
  }, [openAddTreatment, handleAddEmptyRow, onAddTreatmentOpened])

  const handleOpenMenu = (
    treatment: TreatmentV2,
    section: 'pending' | 'history',
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setActiveMenu({ treatment, section, triggerRect: rect })
  }

  const handleMenuCreateBudget = () => {
    if (activeMenu) {
      // Convert TreatmentV2 to legacy Treatment format for compatibility
      const legacyTreatment = {
        id: activeMenu.treatment.codigo,
        description: activeMenu.treatment.tratamiento,
        date: 'Sin fecha' as const,
        amount: activeMenu.treatment.precio,
        status: 'Aceptado' as const,
        professional: activeMenu.treatment.doctor,
        selected: false
      }
      onCreateBudget?.([activeMenu.treatment])
    }
  }

  const handleMenuCreateAppointment = () => {
    if (activeMenu) {
      const treatment = activeMenu.treatment
      setPendingAppointmentData({
        paciente: patientName,
        pacienteId: patientId,
        observaciones: `Tratamiento: ${treatment.codigo} - ${treatment.tratamiento}\nProfesional sugerido: ${treatment.doctor}`,
        linkedTreatments: [
          {
            id: treatment.codigo,
            description: treatment.tratamiento,
            amount: treatment.precio
          }
        ]
      })
      router.push('/agenda')
    }
  }

  const handleDeleteTreatment = () => {
    if (!activeMenu) return
    const { treatment, section } = activeMenu

    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.filter((t) => t._internalId !== treatment._internalId)
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.filter((t) => t._internalId !== treatment._internalId)
      )
    }
    setActiveMenu(null)
  }

  // Handler para marcar tratamiento como completado
  const handleMarkComplete = () => {
    if (!activeMenu || !patientId) return
    const { treatment } = activeMenu

    // Solo actualizar en el contexto - el useEffect recargará los datos automáticamente
    updateTreatment(patientId, treatment._internalId, {
      status: 'Completado',
      completedDate: new Date().toISOString().split('T')[0]
    })

    setActiveMenu(null)
  }

  // Handler para cancelar tratamiento
  const handleMarkCancelled = () => {
    if (!activeMenu || !patientId) return
    const { treatment } = activeMenu

    // Solo actualizar en el contexto - el useEffect recargará los datos automáticamente
    updateTreatment(patientId, treatment._internalId, { status: 'Cancelado' })

    setActiveMenu(null)
  }

  const selectedCount = React.useMemo(() => {
    return (
      pendingTreatments.filter((t) => t.selected).length +
      historyTreatments.filter((t) => t.selected).length
    )
  }, [pendingTreatments, historyTreatments])

  // Filtrado
  const filteredPending = React.useMemo(() => {
    let result = pendingTreatments

    // Filtro por piezas seleccionadas en el odontograma
    if (filterByTeeth.length > 0) {
      result = result.filter((t) => t.pieza && filterByTeeth.includes(t.pieza))
    }

    // Filtro por búsqueda de texto
    if (searchPending) {
      const term = searchPending.toLowerCase()
      result = result.filter(
        (t) =>
          t.codigo.toLowerCase().includes(term) ||
          t.tratamiento.toLowerCase().includes(term) ||
          (t.doctor?.toLowerCase().includes(term) ?? false)
      )
    }

    return result
  }, [pendingTreatments, searchPending, filterByTeeth])

  const filteredHistory = React.useMemo(() => {
    let result = historyTreatments

    // Filtro por piezas seleccionadas en el odontograma
    if (filterByTeeth.length > 0) {
      result = result.filter((t) => t.pieza && filterByTeeth.includes(t.pieza))
    }

    // Filtro por búsqueda de texto
    if (searchHistory) {
      const term = searchHistory.toLowerCase()
      result = result.filter(
        (t) =>
          t.codigo.toLowerCase().includes(term) ||
          t.tratamiento.toLowerCase().includes(term) ||
          (t.doctor?.toLowerCase().includes(term) ?? false)
      )
    }

    return result
  }, [historyTreatments, searchHistory, filterByTeeth])

  // Abrir el modal de crear presupuesto con los tratamientos pendientes
  const handleOpenBudgetModal = () => {
    setShowBudgetModal(true)
  }

  return (
    <div className='w-full h-full flex flex-col bg-[#F8FAFB] relative'>
      {/* Sección superior fija: Odontograma + Catálogo */}
      <section className='p-[min(1rem,2vw)] bg-[#F8FAFB] z-10 shrink-0'>
        <div className='bg-white border border-[#E2E7EA] rounded-[0.5rem] p-[min(2rem,3vw)] flex gap-[min(2.25rem,3vw)] flex-wrap lg:flex-nowrap'>
          {/* Columna izquierda: Odontograma + Banner */}
          <div className='shrink-0 flex flex-col gap-[0.75rem]'>
            <OdontogramaCompacto
              state={odontogramaState}
              onToothClick={handleToothClick}
              isSelectionMode={!!selectedCatalogTreatment}
              selectedTeeth={
                selectedCatalogTreatment ? selectedTeeth : filterByTeeth
              }
            />

            {/* Banner de tratamiento seleccionado - debajo del odontograma */}
            {selectedCatalogTreatment && (
              <div className='p-[0.75rem] bg-[#E9FBF9] border border-[var(--color-brand-500)] rounded-[0.5rem] flex flex-col gap-[0.5rem]'>
                <div className='flex items-center gap-[0.5rem]'>
                  <span className='w-[0.5rem] h-[0.5rem] rounded-full bg-[var(--color-brand-500)] animate-pulse shrink-0' />
                  <span className='text-[0.875rem] leading-[1.25rem] text-[var(--color-brand-700)]'>
                    <strong>{selectedCatalogTreatment.codigo}</strong> -{' '}
                    {selectedCatalogTreatment.entry.description}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-[0.5rem]'>
                  {selectedTeeth.length === 0 ? (
                    <span className='text-[0.8125rem] leading-[1.125rem] text-[#535C66]'>
                      → Selecciona las piezas
                    </span>
                  ) : (
                    <span className='text-[0.8125rem] leading-[1.125rem] text-[var(--color-brand-600)]'>
                      Piezas:{' '}
                      <strong>
                        {selectedTeeth.sort((a, b) => a - b).join(', ')}
                      </strong>
                    </span>
                  )}
                  <div className='flex items-center gap-[0.375rem]'>
                    {selectedTeeth.length > 0 && (
                      <button
                        type='button'
                        onClick={handleConfirmTreatments}
                        className='px-[0.75rem] py-[0.25rem] text-[0.8125rem] font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-full transition-colors cursor-pointer'
                      >
                        Confirmar ({selectedTeeth.length})
                      </button>
                    )}
                    <button
                      type='button'
                      onClick={handleCancelSelection}
                      className='px-[0.5rem] py-[0.25rem] text-[0.8125rem] text-[#535C66] hover:text-[#24282C] hover:bg-[rgba(0,0,0,0.05)] rounded-full transition-colors cursor-pointer'
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Separador vertical */}
          <div className='w-0 border-l border-[#CBD3D9] self-stretch' />

          {/* Catálogo de tratamientos */}
          <div className='flex-1 min-w-0'>
            <CatalogoTratamientos
              onSelectTreatment={handleSelectTreatmentFromCatalog}
              onDoubleClickTreatment={handleDoubleClickTreatmentFromCatalog}
              selectedTreatmentCode={selectedCatalogTreatment?.codigo}
            />
          </div>
        </div>
      </section>

      {/* Banner de filtro por piezas activo */}
      {filterByTeeth.length > 0 && !selectedCatalogTreatment && (
        <div className='mx-[min(2rem,4vw)] mb-[0.75rem] p-[0.75rem] bg-[#FFF8E6] border border-[#D97706] rounded-[0.5rem] flex items-center justify-between'>
          <div className='flex items-center gap-[0.75rem]'>
            <span className='text-[0.9375rem] leading-[1.375rem] text-[#92400E]'>
              Filtrando por pieza{filterByTeeth.length > 1 ? 's' : ''}:{' '}
              <strong>{filterByTeeth.sort((a, b) => a - b).join(', ')}</strong>
            </span>
            <span className='text-[0.875rem] leading-[1.25rem] text-[#B45309]'>
              ({filteredPending.length + filteredHistory.length} tratamiento
              {filteredPending.length + filteredHistory.length !== 1 ? 's' : ''}
              )
            </span>
          </div>
          <button
            type='button'
            onClick={() => setFilterByTeeth([])}
            className='px-[0.75rem] py-[0.25rem] text-[0.875rem] text-[#92400E] hover:text-[#78350F] hover:bg-[rgba(0,0,0,0.05)] rounded-full transition-colors cursor-pointer'
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* Contenido scrolleable: Tablas */}
      <div className='flex-1 overflow-auto'>
        {/* Sección: Tratamientos pendientes */}
        <section className='px-[min(2rem,4vw)] pb-[min(1.5rem,3vw)]'>
          <div className='flex items-center justify-between mb-[1rem]'>
            <h2 className='text-[1.75rem] leading-[2.25rem] text-[#24282C]'>
              Tratamientos pendientes
            </h2>
            <div className='flex items-center gap-[0.5rem]'>
              {/* Search */}
              <button
                type='button'
                className='p-[0.25rem] hover:bg-[var(--color-neutral-100)] rounded transition-colors cursor-pointer'
                onClick={() => {
                  const term = prompt('Buscar:', searchPending)
                  if (term !== null) setSearchPending(term)
                }}
              >
                <SearchRounded className='w-[1.5rem] h-[1.5rem] text-[#535C66]' />
              </button>
              {/* Filtro Presupuestos */}
              <button
                type='button'
                className='flex items-center gap-[0.5rem] px-[1rem] py-[0.375rem] border border-[#CBD3D9] rounded-[8.5rem] bg-white hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
              >
                <FilterListRounded className='w-[1.25rem] h-[1.25rem] text-[#535C66]' />
                <span className='text-[0.875rem] leading-[1.25rem] text-[#535C66]'>
                  Presupuestos
                </span>
              </button>
              {/* Añadir tratamiento */}
              <button
                type='button'
                onClick={handleAddEmptyRow}
                className='flex items-center gap-[0.5rem] px-[1rem] py-[0.375rem] border border-[var(--color-brand-400)] bg-[#E9FBF9] rounded-[8.5rem] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
              >
                <AddRounded className='w-[1.25rem] h-[1.25rem] text-[var(--color-brand-700)]' />
                <span className='text-[0.875rem] leading-[1.25rem] font-medium text-[var(--color-brand-700)]'>
                  Añadir tratamiento
                </span>
              </button>
            </div>
          </div>

          {/* Tabla Tratamientos Pendientes */}
          <div className='bg-white rounded-[0.5rem] overflow-hidden'>
            <div className='table-scroll-x'>
              <table className='w-full border-collapse min-w-[106rem]'>
                <thead>
                  <tr className='bg-[#F8FAFB]'>
                    <TableHeaderCell
                      width='2.5rem'
                      sticky
                      stickyPosition='left'
                    />
                    <TableHeaderCell width='4.625rem'>Pieza</TableHeaderCell>
                    <TableHeaderCell width='6.625rem'>Cara</TableHeaderCell>
                    <TableHeaderCell width='5.875rem'>Código</TableHeaderCell>
                    <TableHeaderCell width='19.5rem'>
                      Tratamiento
                    </TableHeaderCell>
                    <TableHeaderCell width='7.25rem'>Precio</TableHeaderCell>
                    <TableHeaderCell width='5.5rem'>%</TableHeaderCell>
                    <TableHeaderCell width='5.5rem'>Dto</TableHeaderCell>
                    <TableHeaderCell width='6.25rem'>Importe</TableHeaderCell>
                    <TableHeaderCell width='6.875rem'>
                      Imp. seguro
                    </TableHeaderCell>
                    <TableHeaderCell>Descripción/ Anotaciones</TableHeaderCell>
                    <TableHeaderCell width='14.1875rem'>Doctor</TableHeaderCell>
                    <TableHeaderCell
                      width='2.25rem'
                      sticky
                      stickyPosition='right'
                    />
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((treatment) => (
                    <TreatmentRow
                      key={treatment._internalId}
                      treatment={treatment}
                      onToggleSelection={() =>
                        toggleSelection(treatment._internalId, 'pending')
                      }
                      onOpenMenu={(e) =>
                        handleOpenMenu(treatment, 'pending', e)
                      }
                      onUpdateField={(field, value) =>
                        updateField(
                          treatment._internalId,
                          field,
                          value,
                          'pending'
                        )
                      }
                      onUpdateMultipleFields={(updates) =>
                        updateMultipleFields(
                          treatment._internalId,
                          updates,
                          'pending'
                        )
                      }
                      isNewRow={treatment._internalId === newRowId}
                      onNewRowMounted={() => setNewRowId(null)}
                      professionals={professionalNameOptions}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sección: Historial */}
        <section className='px-[min(2rem,4vw)] pb-[min(2rem,4vw)]'>
          <div className='flex items-center justify-between mb-[1rem]'>
            <h2 className='text-[1.75rem] leading-[2.25rem] text-[#24282C]'>
              Historial
            </h2>
            <div className='flex items-center gap-[0.5rem]'>
              {/* Search */}
              <button
                type='button'
                className='p-[0.25rem] hover:bg-[var(--color-neutral-100)] rounded transition-colors cursor-pointer'
                onClick={() => {
                  const term = prompt('Buscar:', searchHistory)
                  if (term !== null) setSearchHistory(term)
                }}
              >
                <SearchRounded className='w-[1.5rem] h-[1.5rem] text-[#535C66]' />
              </button>
              {/* Filtro Todos */}
              <button
                type='button'
                className='flex items-center gap-[0.5rem] px-[1rem] py-[0.375rem] border border-[#CBD3D9] rounded-[8.5rem] bg-white hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
              >
                <FilterListRounded className='w-[1.25rem] h-[1.25rem] text-[#535C66]' />
                <span className='text-[0.875rem] leading-[1.25rem] text-[#535C66]'>
                  Todos
                </span>
              </button>
              {/* Filtro temporal */}
              <div className='relative'>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className='appearance-none pl-[1rem] pr-[2rem] py-[0.375rem] border border-[#CBD3D9] rounded-[8.5rem] bg-white text-[0.875rem] leading-[1.25rem] text-[#535C66] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]'
                >
                  <option>Últimos 6 meses</option>
                  <option>Últimos 3 meses</option>
                  <option>Último año</option>
                  <option>Todos</option>
                </select>
                <KeyboardArrowDownRounded className='absolute right-[0.5rem] top-1/2 -translate-y-1/2 w-[1.25rem] h-[1.25rem] text-[#535C66] pointer-events-none' />
              </div>
            </div>
          </div>

          {/* Tabla Historial */}
          <div className='bg-white rounded-[0.5rem] overflow-hidden'>
            <div className='table-scroll-x'>
              <table className='w-full border-collapse min-w-[120rem]'>
                <thead>
                  <tr className='bg-[#F8FAFB]'>
                    <TableHeaderCell
                      width='2.5rem'
                      sticky
                      stickyPosition='left'
                    />
                    <TableHeaderCell width='4.625rem'>Pieza</TableHeaderCell>
                    <TableHeaderCell width='6.625rem'>Cara</TableHeaderCell>
                    <TableHeaderCell width='5.875rem'>Código</TableHeaderCell>
                    <TableHeaderCell width='16rem'>Tratamiento</TableHeaderCell>
                    <TableHeaderCell width='7.25rem'>Precio</TableHeaderCell>
                    <TableHeaderCell width='5rem'>%</TableHeaderCell>
                    <TableHeaderCell width='5rem'>Dto</TableHeaderCell>
                    <TableHeaderCell width='6.25rem'>Importe</TableHeaderCell>
                    <TableHeaderCell width='7rem'>
                      Fecha realización
                    </TableHeaderCell>
                    <TableHeaderCell width='5.5rem'>Facturado</TableHeaderCell>
                    <TableHeaderCell>Descripción/ Anotaciones</TableHeaderCell>
                    <TableHeaderCell width='12rem'>Doctor</TableHeaderCell>
                    <TableHeaderCell
                      width='2.25rem'
                      sticky
                      stickyPosition='right'
                    />
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((treatment) => (
                    <TreatmentRow
                      key={treatment._internalId}
                      treatment={treatment}
                      onToggleSelection={() =>
                        toggleSelection(treatment._internalId, 'history')
                      }
                      onOpenMenu={(e) =>
                        handleOpenMenu(treatment, 'history', e)
                      }
                      onUpdateField={(field, value) =>
                        updateField(
                          treatment._internalId,
                          field,
                          value,
                          'history'
                        )
                      }
                      onUpdateMultipleFields={(updates) =>
                        updateMultipleFields(
                          treatment._internalId,
                          updates,
                          'history'
                        )
                      }
                      isHistoryTable={true}
                      professionals={professionalNameOptions}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Menú de acciones rápidas */}
      {activeMenu && (
        <RowActionsMenu
          treatment={{
            id: activeMenu.treatment.codigo,
            description: activeMenu.treatment.tratamiento,
            date: 'Sin fecha',
            amount: activeMenu.treatment.precio,
            status: 'Aceptado',
            professional: activeMenu.treatment.doctor || '',
            selected: false
          }}
          onClose={() => setActiveMenu(null)}
          triggerRect={activeMenu.triggerRect}
          onCreateBudget={handleMenuCreateBudget}
          onCreateAppointment={handleMenuCreateAppointment}
          onToggleStatus={() => {}}
          onDelete={handleDeleteTreatment}
          // Solo mostrar opciones de completar/cancelar para tratamientos pendientes
          onMarkComplete={
            activeMenu.section === 'pending' ? handleMarkComplete : undefined
          }
          onMarkCancelled={
            activeMenu.section === 'pending' ? handleMarkCancelled : undefined
          }
        />
      )}

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
                  <strong>{selectedCatalogTreatment.entry.amount}</strong>
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
                      const priceStr = selectedCatalogTreatment.entry.amount
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

      {/* Footer con blur - Figma design */}
      <footer className='sticky bottom-0 backdrop-blur-[8px] bg-[rgba(255,255,255,0.7)] flex items-center justify-between p-[1rem] shrink-0'>
        <p className='text-[1rem] leading-[1.5rem] text-[#3D434A]'>
          {selectedCount > 0
            ? `${selectedCount} tratamiento${
                selectedCount !== 1 ? 's' : ''
              } marcado${selectedCount !== 1 ? 's' : ''} para próxima cita`
            : 'Selecciona tratamientos para la próxima cita'}
        </p>
        <div className='flex gap-[0.75rem] items-center'>
          {/* Botón Imprimir */}
          <button
            type='button'
            className='px-[1rem] py-[0.5rem] border border-[#CBD3D9] rounded-full text-[1rem] leading-[1.5rem] font-medium text-[#24282C] hover:bg-[rgba(0,0,0,0.05)] transition-colors cursor-pointer'
          >
            Imprimir
          </button>
          {/* Botón Presupuesto tipo */}
          <button
            type='button'
            onClick={() => setShowBudgetTypeModal(true)}
            className='flex items-center gap-[0.5rem] px-[1rem] py-[0.5rem] rounded-full text-[1rem] leading-[1.5rem] font-medium text-[#24282C] hover:bg-[rgba(0,0,0,0.05)] transition-colors cursor-pointer'
          >
            <ElectricBoltRounded className='w-[1.5rem] h-[1.5rem]' />
            Presupuesto tipo
          </button>
          {/* Botón Crear presupuesto - Siempre activo */}
          <button
            type='button'
            onClick={handleOpenBudgetModal}
            className='w-[12.1875rem] px-[1rem] py-[0.5rem] rounded-full text-[1rem] leading-[1.5rem] font-medium transition-colors bg-[#51D6C7] text-[#1E4947] hover:bg-[#3ECBBB] cursor-pointer'
          >
            Crear presupuesto
          </button>
        </div>
      </footer>

      {/* Modal para crear presupuesto con tratamientos pendientes */}
      <AddTreatmentsToBudgetModal
        open={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false)
          // Clear budget type data when modal closes
          setBudgetTypeTreatments(undefined)
          setBudgetTypeName('')
        }}
        treatments={budgetTypeTreatments || pendingTreatments}
        initialBudgetName={budgetTypeName}
        onCreateBudget={(treatments, budgetInfo) => {
          // Create budget row and add to the budgets table
          if (onAddBudget) {
            // Calculate validity date (30 days from now)
            const validUntilDate = new Date()
            validUntilDate.setDate(validUntilDate.getDate() + 30)

            const newBudget: BudgetRow = {
              id: `PRE-${Date.now().toString().slice(-6)}`,
              description: budgetInfo.name,
              amount: `${budgetInfo.total.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} €`,
              date: new Date().toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              }),
              status: 'Pendiente',
              professional: treatments[0]?.doctor || '',
              insurer: '',
              // Extended fields
              subtotal: budgetInfo.subtotal,
              generalDiscount:
                budgetInfo.generalDiscountAmount > 0
                  ? { type: 'fixed', value: budgetInfo.generalDiscountAmount }
                  : undefined,
              validUntil: validUntilDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              }),
              treatments: treatments.map((t) => ({
                pieza: t.pieza,
                cara: t.cara,
                codigo: t.codigo,
                tratamiento: t.tratamiento,
                precio: t.precio,
                porcentajeDescuento: t.porcentajeDescuento,
                descuento: t.descuento || '0 €',
                importe: t.importe,
                doctor: t.doctor
              })),
              history: [
                {
                  date: new Date().toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  action: 'Presupuesto creado',
                  user: treatments[0]?.doctor || 'Sistema'
                }
              ]
            }
            onAddBudget(newBudget)
          }
          // Also call the legacy callback if provided
          onCreateBudget?.(treatments)
          // Close the modal
          setShowBudgetModal(false)
          // Clear budget type data
          setBudgetTypeTreatments(undefined)
          setBudgetTypeName('')
        }}
      />

      {/* Modal para seleccionar presupuesto tipo */}
      <BudgetTypeListModal
        open={showBudgetTypeModal}
        onClose={() => setShowBudgetTypeModal(false)}
        onSelect={handleBudgetTypeSelect}
        onCreateNew={handleCreateNewBudgetType}
      />

      {/* Modal para crear nuevo presupuesto tipo */}
      <AddTreatmentsToBudgetModal
        open={showCreateBudgetTypeModal}
        onClose={() => setShowCreateBudgetTypeModal(false)}
        onCreateBudget={() => {}}
        onCreateBudgetType={handleSaveBudgetType}
        treatments={pendingTreatments}
        mode='budgetType'
      />
    </div>
  )
}
