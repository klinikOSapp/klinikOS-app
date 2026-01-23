'use client'

import {
  AddRounded,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  FilterListRounded,
  KeyboardArrowDownRounded,
  MoreVertRounded,
  SearchRounded
} from '@/components/icons/md3'
import { SelectInput } from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import React from 'react'

type TreatmentStatus = 'Aceptado' | 'Recall' | 'Pagado' | 'Sin pagar'

type Treatment = {
  id: string
  description: string
  date: string | 'Sin fecha'
  amount: string
  discount?: number // Porcentaje de descuento (0-100)
  status: TreatmentStatus
  professional: string
  selected?: boolean
  _internalId?: string // ID interno único que no cambia, usado para React keys
}

// Catálogo de tratamientos por acrónimo
type TreatmentCatalog = {
  [acronym: string]: {
    description: string
    amount: string
  }
}

const TREATMENT_CATALOG: TreatmentCatalog = {
  LDE: {
    description: 'Limpieza dental',
    amount: '72 €'
  },
  BLD: {
    description: 'Blanqueamiento dental',
    amount: '200 €'
  },
  OPM: {
    description: 'Operación mandíbula',
    amount: '2.300 €'
  },
  CI: {
    description: 'Consulta inicial',
    amount: '150 €'
  },
  RX: {
    description: 'Radiografía',
    amount: '100 €'
  },
  EXM: {
    description: 'Extracción de muela',
    amount: '500 €'
  },
  IMP: {
    description: 'Implante dental',
    amount: '1.200 €'
  },
  FER: {
    description: 'Férula de descarga',
    amount: '300 €'
  },
  EMP: {
    description: 'Empaste / Obturación',
    amount: '80 €'
  },
  END: {
    description: 'Endodoncia',
    amount: '400 €'
  },
  COR: {
    description: 'Corona dental',
    amount: '600 €'
  },
  ORT: {
    description: 'Revisión ortodoncia',
    amount: '120 €'
  },
  PER: {
    description: 'Tratamiento periodontal',
    amount: '800 €'
  },
  CAR: {
    description: 'Carillas estéticas',
    amount: '350 €'
  }
}

// Lista de profesionales disponibles
const PROFESSIONALS = [
  { value: 'Dr. Guillermo', label: 'Dr. Guillermo' },
  { value: 'Dra. Andrea', label: 'Dra. Andrea' }
]

// Mock data basado en Figma
const PENDING_TREATMENTS: Treatment[] = [
  {
    id: 'LDE',
    description: 'Limpieza dental',
    date: '22/12/25',
    amount: '72 €',
    discount: 10,
    status: 'Aceptado',
    professional: 'Dr. Guillermo',
    selected: false,
    _internalId: 'pending-0'
  },
  {
    id: 'LDE',
    description: 'Blanqueamiento dental',
    date: 'Sin fecha',
    amount: '200 €',
    discount: 0,
    status: 'Recall',
    professional: 'Dra. Andrea',
    selected: false,
    _internalId: 'pending-1'
  }
]

const HISTORY_TREATMENTS: Treatment[] = [
  {
    id: 'LDE',
    description: 'Operación mandíbula',
    date: '22/12/25',
    amount: '2.300 €',
    discount: 5,
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: false,
    _internalId: 'history-0'
  },
  {
    id: 'LDE',
    description: 'Consulta inicial',
    date: '18/12/25',
    amount: '150 €',
    discount: 0,
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: false,
    _internalId: 'history-1'
  },
  {
    id: 'LDE',
    description: 'Radiografía',
    date: '01/12/25',
    amount: '100 €',
    discount: 15,
    status: 'Sin pagar',
    professional: 'Dra. Andrea',
    selected: false,
    _internalId: 'history-2'
  },
  {
    id: 'LDE',
    description: 'Extracción de muela',
    date: '01/12/25',
    amount: '500 €',
    discount: 0,
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: false,
    _internalId: 'history-3'
  },
  {
    id: 'LDE',
    description: 'Implante dental',
    date: '01/12/25',
    amount: '1.200 €',
    discount: 10,
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: false,
    _internalId: 'history-4'
  },
  {
    id: 'LDE',
    description: 'Férula de descarga',
    date: '01/12/25',
    amount: '300 €',
    discount: 0,
    status: 'Sin pagar',
    professional: 'Dr. Guillermo',
    selected: false,
    _internalId: 'history-5'
  }
]

function StatusBadge({ status }: { status: TreatmentStatus }) {
  // Colores exactos según Figma - pixel perfect
  if (status === 'Aceptado') {
    return (
      <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#00BFFF] px-2 py-1 text-label-sm bg-[#E0F7FA] text-[#00BFFF]'>
        {status}
      </span>
    )
  }
  if (status === 'Pagado') {
    return (
      <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#28A745] px-2 py-1 text-label-sm bg-[#E8FFF3] text-[#28A745]'>
        {status}
      </span>
    )
  }
  // Recall y Sin pagar - mismo estilo (amarillo)
  return (
    <span className='inline-flex items-center justify-center rounded-[5rem] border border-[#FFC107] px-2 py-1 text-label-sm bg-[#FFF8DC] text-[#FFC107]'>
      {status}
    </span>
  )
}

// Helper function para calcular el monto final
function calculateFinalAmount(amount: string, discount?: number): string {
  if (!discount || discount === 0) return amount
  
  // Extraer el número del string "72 €" o "2.300 €" (puntos como separadores de miles)
  const cleaned = amount.replace(/[^\d,.-]/g, '').trim()
  // Reemplazar punto (separador de miles) y coma (decimal) para parsear correctamente
  const numericValue = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  if (isNaN(numericValue)) return amount
  
  // Calcular el descuento
  const discountAmount = (numericValue * discount) / 100
  const finalAmount = numericValue - discountAmount
  
  // Formatear el resultado con el mismo formato que el original (puntos como separadores de miles)
  const formatted = finalAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).replace(/,/g, '.')
  
  return `${formatted} €`
}

type TreatmentsProps = {
  onCreateBudget?: (selectedTreatments: Treatment[]) => void
  onCancel?: () => void
  onClose?: () => void
}

export default function Treatments({
  onCreateBudget,
  onCancel,
  onClose
}: TreatmentsProps) {
  const [pendingTreatments, setPendingTreatments] = React.useState<
    Treatment[]
  >(PENDING_TREATMENTS)
  const [historyTreatments, setHistoryTreatments] = React.useState<Treatment[]>(
    HISTORY_TREATMENTS
  )
  const [searchPending, setSearchPending] = React.useState('')
  const [searchHistory, setSearchHistory] = React.useState('')
  const [dateFilter, setDateFilter] = React.useState('Últimos 6 meses')

  const toggleSelection = (
    treatment: Treatment,
    section: 'pending' | 'history'
  ) => {
    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) =>
          t === treatment
            ? { ...t, selected: !t.selected }
            : t
        )
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) =>
          t === treatment
            ? { ...t, selected: !t.selected }
            : t
        )
      )
    }
  }

  const updateTreatmentField = (
    treatment: Treatment,
    field: keyof Treatment,
    value: string | number | undefined,
    section: 'pending' | 'history'
  ) => {
    const updateTreatment = (t: Treatment) => {
      if (t === treatment) {
        const updated = { ...t, [field]: value }
        
        // Si se cambió el ID y coincide con un tratamiento del catálogo, autocompletar
        if (field === 'id' && typeof value === 'string') {
          const catalogEntry = TREATMENT_CATALOG[value.toUpperCase()]
          if (catalogEntry) {
            return {
              ...updated,
              description: catalogEntry.description,
              amount: catalogEntry.amount
            }
          }
        }
        
        return updated
      }
      return t
    }

    if (section === 'pending') {
      setPendingTreatments((prev) => prev.map(updateTreatment))
    } else {
      setHistoryTreatments((prev) => prev.map(updateTreatment))
    }
  }

  const selectedCount = React.useMemo(() => {
    return (
      pendingTreatments.filter((t) => t.selected).length +
      historyTreatments.filter((t) => t.selected).length
    )
  }, [pendingTreatments, historyTreatments])

  const filteredPending = React.useMemo(() => {
    if (!searchPending) return pendingTreatments
    const query = searchPending.toLowerCase()
    return pendingTreatments.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.professional.toLowerCase().includes(query)
    )
  }, [pendingTreatments, searchPending])

  const filteredHistory = React.useMemo(() => {
    if (!searchHistory) return historyTreatments
    const query = searchHistory.toLowerCase()
    return historyTreatments.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.professional.toLowerCase().includes(query)
    )
  }, [historyTreatments, searchHistory])

  // Obtener el índice original en el array sin filtrar para usar como key estable
  const getStableKey = (treatment: Treatment, index: number, section: 'pending' | 'history') => {
    // Si el tratamiento tiene un ID interno, usarlo (más estable)
    if (treatment._internalId) {
      return `${section}-${treatment._internalId}`
    }
    // Si no, usar el índice del array original
    const sourceArray = section === 'pending' ? pendingTreatments : historyTreatments
    const originalIndex = sourceArray.findIndex((t) => t === treatment)
    return originalIndex >= 0 ? `${section}-${originalIndex}` : `${section}-new-${index}`
  }

  const handleCreateBudget = () => {
    const selected = [
      ...pendingTreatments.filter((t) => t.selected),
      ...historyTreatments.filter((t) => t.selected)
    ]
    onCreateBudget?.(selected)
  }

  const handleAddTreatment = () => {
    const newTreatment: Treatment = {
      id: '', // Campo vacío para que el usuario escriba el acrónimo
      description: '',
      date: '',
      amount: '',
      discount: undefined,
      status: 'Aceptado',
      professional: '',
      selected: false,
      _internalId: `new-${Date.now()}-${Math.random()}` // ID interno único que no cambia
    }
    setPendingTreatments((prev) => [...prev, newTreatment])
  }

  return (
    <div className='w-full h-full flex flex-col bg-[var(--color-neutral-50)] relative'>
      <div className='flex-1 overflow-auto'>
        {/* Sección: Tratamientos pendientes */}
        <section className='p-8'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-title-md font-medium text-[var(--color-neutral-900)]'>
              Tratamientos pendientes
            </h2>
            <div className='flex items-center gap-4'>
              {/* Search bar */}
              <div className='relative'>
                <SearchRounded
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral-500)]'
                  style={{ pointerEvents: 'none' }}
                />
                <input
                  type='text'
                  placeholder='Buscar...'
                  value={searchPending}
                  onChange={(e) => setSearchPending(e.target.value)}
                  className='w-[20rem] pl-10 pr-4 py-2 border border-[var(--color-neutral-300)] rounded-lg text-body-sm bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent'
                />
              </div>
              {/* Filtro "Todos" */}
              <button
                type='button'
                className='flex items-center gap-2 px-4 py-2 border border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-neutral-0)] hover:bg-[var(--color-neutral-50)] transition-colors'
              >
                <FilterListRounded className='w-5 h-5 text-[var(--color-neutral-700)]' />
                <span className='text-body-sm text-[var(--color-neutral-900)]'>
                  Todos
                </span>
              </button>
              {/* Botón Añadir tratamiento */}
              <button
                type='button'
                className='flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
                onClick={handleAddTreatment}
              >
                <AddRounded className='size-6' />
                <span className='font-medium'>Añadir tratamiento</span>
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className='bg-[var(--color-neutral-0)] rounded-lg overflow-hidden'>
            <div className='overflow-x-auto overflow-y-auto'>
              <table className='w-full table-fixed border-collapse text-left'>
                <thead className='sticky top-0 z-10 bg-[var(--color-neutral-50)]'>
                  <tr>
                    <th className='w-12 border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left'>
                      {/* Checkbox header */}
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      ID
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Descripción
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Fecha
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Monto
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Descuento
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Monto final
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Estado
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Profesional
                    </th>
                    <th className='w-12 border-hairline-b py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-right'>
                      {/* Menú */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((treatment, index) => {
                    const stableKey = getStableKey(treatment, index, 'pending')
                    return (
                    <tr
                      key={stableKey}
                      className={[
                        'transition-colors',
                        treatment.selected
                          ? 'bg-[var(--color-brand-50)]'
                          : 'hover:bg-[var(--color-neutral-50)]'
                      ].join(' ')}
                    >
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <button
                          type='button'
                          onClick={() => toggleSelection(treatment, 'pending')}
                          className='cursor-pointer'
                        >
                          {treatment.selected ? (
                            <CheckBoxRounded className='w-6 h-6 text-[var(--color-brand-500)]' />
                          ) : (
                            <CheckBoxOutlineBlankRounded className='w-6 h-6 text-[var(--color-neutral-400)]' />
                          )}
                        </button>
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.id}
                          onChange={(e) => updateTreatmentField(treatment, 'id', e.target.value, 'pending')}
                          className='w-full text-body-md font-semibold text-[var(--color-brand-700)] bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                          placeholder='ID'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.description}
                          onChange={(e) => updateTreatmentField(treatment, 'description', e.target.value, 'pending')}
                          className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.date}
                          onChange={(e) => updateTreatmentField(treatment, 'date', e.target.value, 'pending')}
                          className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                          placeholder='DD/MM/AA'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.amount}
                          onChange={(e) => updateTreatmentField(treatment, 'amount', e.target.value, 'pending')}
                          className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                          placeholder='0 €'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <div className='flex items-center'>
                          <input
                            type='number'
                            value={treatment.discount ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value)
                              updateTreatmentField(treatment, 'discount', value, 'pending')
                            }}
                            className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='0'
                            min='0'
                            max='100'
                          />
                          {treatment.discount !== undefined && treatment.discount > 0 && (
                            <span className='text-body-md text-neutral-900 ml-1'>%</span>
                          )}
                        </div>
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-body-md text-neutral-900'>
                        {calculateFinalAmount(treatment.amount, treatment.discount)}
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <StatusBadge status={treatment.status} />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <SelectInput
                          placeholder='Seleccionar profesional'
                          value={treatment.professional || undefined}
                          onChange={(v) => updateTreatmentField(treatment, 'professional', v || '', 'pending')}
                          options={PROFESSIONALS}
                        />
                      </td>
                      <td className='border-hairline-b py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-right'>
                        <button
                          type='button'
                          className='p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                        >
                          <MoreVertRounded className='w-5 h-5 text-[var(--color-neutral-600)]' />
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sección: Historial */}
        <section className='p-8 pb-8'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-title-md font-medium text-[var(--color-neutral-900)]'>
              Historial
            </h2>
            <div className='flex items-center gap-4'>
              {/* Search bar */}
              <div className='relative'>
                <SearchRounded
                  className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral-500)]'
                  style={{ pointerEvents: 'none' }}
                />
                <input
                  type='text'
                  placeholder='Buscar...'
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className='w-[20rem] pl-10 pr-4 py-2 border border-[var(--color-neutral-300)] rounded-lg text-body-sm bg-[var(--color-neutral-0)] text-[var(--color-neutral-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent'
                />
              </div>
              {/* Filtro "Todos" */}
              <button
                type='button'
                className='flex items-center gap-2 px-4 py-2 border border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-neutral-0)] hover:bg-[var(--color-neutral-50)] transition-colors'
              >
                <FilterListRounded className='w-5 h-5 text-[var(--color-neutral-700)]' />
                <span className='text-body-sm text-[var(--color-neutral-900)]'>
                  Todos
                </span>
              </button>
              {/* Dropdown "Últimos 6 meses" */}
              <div className='relative'>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className='appearance-none pl-4 pr-8 py-2 border border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-neutral-0)] text-body-sm text-[var(--color-neutral-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent cursor-pointer'
                >
                  <option>Últimos 6 meses</option>
                  <option>Últimos 3 meses</option>
                  <option>Último año</option>
                  <option>Todos</option>
                </select>
                <KeyboardArrowDownRounded
                  className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral-500)] pointer-events-none'
                />
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className='bg-[var(--color-neutral-0)] rounded-lg overflow-hidden'>
            <div className='overflow-x-auto overflow-y-auto'>
              <table className='w-full table-fixed border-collapse text-left'>
                <thead className='sticky top-0 z-10 bg-[var(--color-neutral-50)]'>
                  <tr>
                    <th className='w-12 border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left'>
                      {/* Checkbox header */}
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      ID
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Descripción
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Fecha
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Monto
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Descuento
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Monto final
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Estado
                    </th>
                    <th className='border-hairline-b border-hairline-r py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-left text-body-md font-normal text-[var(--color-neutral-600)]'>
                      Profesional
                    </th>
                    <th className='w-12 border-hairline-b py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-right'>
                      {/* Menú */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((treatment, index) => {
                    const stableKey = getStableKey(treatment, index, 'history')
                    return (
                    <tr
                      key={stableKey}
                      className={[
                        'transition-colors',
                        treatment.selected
                          ? 'bg-[var(--color-brand-50)]'
                          : 'hover:bg-[var(--color-neutral-50)]'
                      ].join(' ')}
                    >
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <button
                          type='button'
                          onClick={() => toggleSelection(treatment, 'history')}
                          className='cursor-pointer'
                        >
                          {treatment.selected ? (
                            <CheckBoxRounded className='w-6 h-6 text-[var(--color-brand-500)]' />
                          ) : (
                            <CheckBoxOutlineBlankRounded className='w-6 h-6 text-[var(--color-neutral-400)]' />
                          )}
                        </button>
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.id}
                          onChange={(e) => updateTreatmentField(treatment, 'id', e.target.value, 'history')}
                          className='w-full text-body-md font-semibold text-[var(--color-brand-700)] bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                          placeholder='ID'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.description}
                          onChange={(e) => updateTreatmentField(treatment, 'description', e.target.value, 'history')}
                          className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.date}
                          onChange={(e) => updateTreatmentField(treatment, 'date', e.target.value, 'history')}
                          className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                          placeholder='DD/MM/AA'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <input
                          type='text'
                          value={treatment.amount}
                          onChange={(e) => updateTreatmentField(treatment, 'amount', e.target.value, 'history')}
                          className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                          placeholder='0 €'
                        />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <div className='flex items-center'>
                          <input
                            type='number'
                            value={treatment.discount ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : Number(e.target.value)
                              updateTreatmentField(treatment, 'discount', value, 'history')
                            }}
                            className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='0'
                            min='0'
                            max='100'
                          />
                          {treatment.discount !== undefined && treatment.discount > 0 && (
                            <span className='text-body-md text-neutral-900 ml-1'>%</span>
                          )}
                        </div>
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-body-md text-neutral-900'>
                        {calculateFinalAmount(treatment.amount, treatment.discount)}
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <StatusBadge status={treatment.status} />
                      </td>
                      <td className='border-hairline-b border-hairline-r py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem]'>
                        <SelectInput
                          placeholder='Seleccionar profesional'
                          value={treatment.professional || undefined}
                          onChange={(v) => updateTreatmentField(treatment, 'professional', v || '', 'history')}
                          options={PROFESSIONALS}
                        />
                      </td>
                      <td className='border-hairline-b py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] text-right'>
                        <button
                          type='button'
                          className='p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                        >
                          <MoreVertRounded className='w-5 h-5 text-[var(--color-neutral-600)]' />
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Footer sticky */}
      <footer className='sticky bottom-0 h-20 bg-[var(--color-neutral-0)] border-t border-[var(--color-neutral-300)] flex items-center justify-between px-8 shrink-0'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          Has seleccionado {selectedCount} tratamientos
        </p>
        <div className='flex gap-4'>
          <button
            type='button'
            onClick={onCancel || onClose}
            className='px-6 py-3 bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)] rounded-lg text-body-md font-medium hover:bg-[var(--color-neutral-200)] transition-colors'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleCreateBudget}
            disabled={selectedCount === 0}
            className={[
              'px-6 py-3 rounded-lg text-body-md font-medium transition-colors',
              selectedCount === 0
                ? 'bg-[var(--color-neutral-200)] text-[var(--color-neutral-400)] cursor-not-allowed'
                : 'bg-[var(--color-brand-500)] text-[var(--color-neutral-0)] hover:bg-[var(--color-brand-600)] cursor-pointer'
            ].join(' ')}
          >
            Crear presupuesto
          </button>
        </div>
      </footer>
    </div>
  )
}
