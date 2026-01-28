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
import { MD3Icon } from '@/components/icons/MD3Icon'
import { SelectInput } from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import ExpandedTextInput from '@/components/pacientes/shared/ExpandedTextInput'
import { RowActionsMenu } from '@/components/pacientes/shared/RowActionsMenu'
import { StatusBadge } from '@/components/pacientes/shared/StatusBadge'
import type {
  Treatment,
  TreatmentStatus
} from '@/components/pacientes/shared/treatmentTypes'
import {
  PROFESSIONALS,
  TREATMENT_CATALOG
} from '@/components/pacientes/shared/treatmentTypes'
import { useTreatmentFilter } from '@/hooks/useTreatmentFilter'
import { setPendingAppointmentData } from '@/utils/appointmentPrefill'
import { useRouter } from 'next/navigation'
import React from 'react'

// Table cell components (same as parte-diario)
function TableHeaderCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope='col'
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function TableBodyCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <td
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] align-middle text-body-md text-[var(--color-neutral-900)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </td>
  )
}

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

// StatusBadge, RowActionsMenu and calculateFinalAmount imported from shared components

type TreatmentsProps = {
  onCreateBudget?: (selectedTreatments: Treatment[]) => void
  onCreateAppointment?: (treatment: Treatment) => void
  onCancel?: () => void
  onClose?: () => void
  patientId?: string
  patientName?: string
}

export default function Treatments({
  onCreateBudget,
  onCreateAppointment,
  onCancel,
  onClose,
  patientId,
  patientName
}: TreatmentsProps) {
  const router = useRouter()

  const [pendingTreatments, setPendingTreatments] =
    React.useState<Treatment[]>(PENDING_TREATMENTS)
  const [historyTreatments, setHistoryTreatments] =
    React.useState<Treatment[]>(HISTORY_TREATMENTS)
  const [searchPending, setSearchPending] = React.useState('')
  const [searchHistory, setSearchHistory] = React.useState('')
  const [dateFilter, setDateFilter] = React.useState('Últimos 6 meses')

  // Estado para el menú de acciones rápidas
  const [activeMenu, setActiveMenu] = React.useState<{
    treatment: Treatment
    section: 'pending' | 'history'
    index: number
    triggerRect?: DOMRect
  } | null>(null)

  // Handler para abrir el menú de acciones
  const handleOpenMenu = (
    treatment: Treatment,
    section: 'pending' | 'history',
    index: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setActiveMenu({ treatment, section, index, triggerRect: rect })
  }

  // Handler para crear presupuesto desde el menú
  const handleMenuCreateBudget = () => {
    if (activeMenu) {
      onCreateBudget?.([activeMenu.treatment])
    }
  }

  // Handler para crear cita desde el menú (con campos pre-rellenados)
  const handleMenuCreateAppointment = () => {
    if (activeMenu) {
      const treatment = activeMenu.treatment
      // Guardar datos del tratamiento y paciente para pre-rellenar la cita
      setPendingAppointmentData({
        paciente: patientName,
        pacienteId: patientId,
        observaciones: `Tratamiento: ${treatment.id} - ${treatment.description}\nProfesional sugerido: ${treatment.professional}`,
        linkedTreatments: [
          {
            id: treatment.id,
            description: treatment.description,
            amount: treatment.amount
          }
        ]
      })
      // Navegar a la agenda
      router.push('/agenda')
    }
  }

  // Handler para cambiar estado (aceptado/no aceptado)
  const handleToggleStatus = () => {
    if (!activeMenu) return
    const { treatment, section } = activeMenu

    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) => {
          if (t === treatment) {
            const newStatus: TreatmentStatus =
              t.status === 'Aceptado' ? 'No aceptado' : 'Aceptado'
            return { ...t, status: newStatus }
          }
          return t
        })
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) => {
          if (t === treatment) {
            const newStatus: TreatmentStatus =
              t.status === 'Aceptado' ? 'No aceptado' : 'Aceptado'
            return { ...t, status: newStatus }
          }
          return t
        })
      )
    }
  }

  // Handler para eliminar tratamiento
  const handleDeleteTreatment = () => {
    if (!activeMenu) return
    const { treatment, section } = activeMenu

    if (section === 'pending') {
      setPendingTreatments((prev) => prev.filter((t) => t !== treatment))
    } else {
      setHistoryTreatments((prev) => prev.filter((t) => t !== treatment))
    }
  }

  const toggleSelection = (
    treatment: Treatment,
    section: 'pending' | 'history'
  ) => {
    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) => (t === treatment ? { ...t, selected: !t.selected } : t))
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) => (t === treatment ? { ...t, selected: !t.selected } : t))
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

  // Use shared hook for filtering
  const filteredPending = useTreatmentFilter(pendingTreatments, searchPending)
  const filteredHistory = useTreatmentFilter(historyTreatments, searchHistory)

  // Obtener el índice original en el array sin filtrar para usar como key estable
  const getStableKey = (
    treatment: Treatment,
    index: number,
    section: 'pending' | 'history'
  ) => {
    // Si el tratamiento tiene un ID interno, usarlo (más estable)
    if (treatment._internalId) {
      return `${section}-${treatment._internalId}`
    }
    // Si no, usar el índice del array original
    const sourceArray =
      section === 'pending' ? pendingTreatments : historyTreatments
    const originalIndex = sourceArray.findIndex((t) => t === treatment)
    return originalIndex >= 0
      ? `${section}-${originalIndex}`
      : `${section}-new-${index}`
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
                    <TableHeaderCell className='w-10 sticky left-0 z-20 bg-[var(--color-neutral-50)]'>
                      <span className='sr-only'>Seleccionar</span>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[106px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='SellRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>ID</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[342px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='DescriptionRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Descripción</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[116px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='CalendarMonthRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Fecha</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[88px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='PaymentsRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Monto</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[117px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='CheckCircleRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Estado</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[211px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='AccountCircleRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Profesional</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-10 sticky right-0 z-20 bg-[var(--color-neutral-50)]'>
                      <span className='sr-only'>Acciones</span>
                    </TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((treatment, index) => {
                    const stableKey = getStableKey(treatment, index, 'pending')
                    const rowBg = treatment.selected
                      ? 'bg-[var(--color-brand-50)]'
                      : 'bg-[var(--color-neutral-0)]'
                    return (
                      <tr
                        key={stableKey}
                        className={[
                          'group transition-colors',
                          treatment.selected
                            ? 'bg-[var(--color-brand-50)]'
                            : 'hover:bg-[var(--color-neutral-50)]'
                        ].join(' ')}
                      >
                        <TableBodyCell className={`w-10 sticky left-0 z-10 ${rowBg} group-hover:bg-[var(--color-neutral-50)]`}>
                          <button
                            type='button'
                            onClick={() =>
                              toggleSelection(treatment, 'pending')
                            }
                            className='cursor-pointer'
                          >
                            {treatment.selected ? (
                              <CheckBoxRounded className='w-6 h-6 text-[var(--color-brand-500)]' />
                            ) : (
                              <CheckBoxOutlineBlankRounded className='w-6 h-6 text-[var(--color-neutral-400)]' />
                            )}
                          </button>
                        </TableBodyCell>
                        <TableBodyCell className='w-[106px]'>
                          <input
                            type='text'
                            value={treatment.id}
                            onChange={(e) =>
                              updateTreatmentField(
                                treatment,
                                'id',
                                e.target.value,
                                'pending'
                              )
                            }
                            className='w-full text-body-md font-semibold text-[var(--color-brand-700)] bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='ID'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[342px]'>
                          <ExpandedTextInput
                            value={treatment.description}
                            onChange={(value) =>
                              updateTreatmentField(
                                treatment,
                                'description',
                                value,
                                'pending'
                              )
                            }
                            placeholder='Descripción del tratamiento'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[116px]'>
                          <input
                            type='text'
                            value={treatment.date}
                            onChange={(e) =>
                              updateTreatmentField(
                                treatment,
                                'date',
                                e.target.value,
                                'pending'
                              )
                            }
                            className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='DD/MM/AA'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[88px]'>
                          <input
                            type='text'
                            value={treatment.amount}
                            onChange={(e) =>
                              updateTreatmentField(
                                treatment,
                                'amount',
                                e.target.value,
                                'pending'
                              )
                            }
                            className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='0 €'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[117px]'>
                          <StatusBadge status={treatment.status} />
                        </TableBodyCell>
                        <TableBodyCell className='w-[211px]'>
                          <SelectInput
                            placeholder='Seleccionar profesional'
                            value={treatment.professional || undefined}
                            onChange={(v) =>
                              updateTreatmentField(
                                treatment,
                                'professional',
                                v || '',
                                'pending'
                              )
                            }
                            options={PROFESSIONALS}
                          />
                        </TableBodyCell>
                        <TableBodyCell className={`w-10 sticky right-0 z-10 ${rowBg} group-hover:bg-[var(--color-neutral-50)]`} align='right'>
                          <button
                            type='button'
                            onClick={(e) =>
                              handleOpenMenu(treatment, 'pending', index, e)
                            }
                            className='p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                            aria-label='Acciones rápidas'
                          >
                            <MoreVertRounded className='w-5 h-5 text-[var(--color-neutral-600)]' />
                          </button>
                        </TableBodyCell>
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
                <KeyboardArrowDownRounded className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-neutral-500)] pointer-events-none' />
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className='bg-[var(--color-neutral-0)] rounded-lg overflow-hidden'>
            <div className='overflow-x-auto overflow-y-auto'>
              <table className='w-full table-fixed border-collapse text-left'>
                <thead className='sticky top-0 z-10 bg-[var(--color-neutral-50)]'>
                  <tr>
                    <TableHeaderCell className='w-10 sticky left-0 z-20 bg-[var(--color-neutral-50)]'>
                      <span className='sr-only'>Seleccionar</span>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[106px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='SellRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>ID</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[342px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='DescriptionRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Descripción</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[116px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='CalendarMonthRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Fecha</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[105px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='PaymentsRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Monto</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[110px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='CheckCircleRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Estado</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-[203px]'>
                      <div className='flex items-center gap-1'>
                        <MD3Icon
                          name='AccountCircleRounded'
                          size='xs'
                          className='text-[var(--color-neutral-600)]'
                        />
                        <span>Profesional</span>
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className='w-10 sticky right-0 z-20 bg-[var(--color-neutral-50)]'>
                      <span className='sr-only'>Acciones</span>
                    </TableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((treatment, index) => {
                    const stableKey = getStableKey(treatment, index, 'history')
                    const rowBg = treatment.selected
                      ? 'bg-[var(--color-brand-50)]'
                      : 'bg-[var(--color-neutral-0)]'
                    return (
                      <tr
                        key={stableKey}
                        className={[
                          'group transition-colors',
                          treatment.selected
                            ? 'bg-[var(--color-brand-50)]'
                            : 'hover:bg-[var(--color-neutral-50)]'
                        ].join(' ')}
                      >
                        <TableBodyCell className={`w-10 sticky left-0 z-10 ${rowBg} group-hover:bg-[var(--color-neutral-50)]`}>
                          <button
                            type='button'
                            onClick={() =>
                              toggleSelection(treatment, 'history')
                            }
                            className='cursor-pointer'
                          >
                            {treatment.selected ? (
                              <CheckBoxRounded className='w-6 h-6 text-[var(--color-brand-500)]' />
                            ) : (
                              <CheckBoxOutlineBlankRounded className='w-6 h-6 text-[var(--color-neutral-400)]' />
                            )}
                          </button>
                        </TableBodyCell>
                        <TableBodyCell className='w-[106px]'>
                          <input
                            type='text'
                            value={treatment.id}
                            onChange={(e) =>
                              updateTreatmentField(
                                treatment,
                                'id',
                                e.target.value,
                                'history'
                              )
                            }
                            className='w-full text-body-md font-semibold text-[var(--color-brand-700)] bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='ID'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[342px]'>
                          <ExpandedTextInput
                            value={treatment.description}
                            onChange={(value) =>
                              updateTreatmentField(
                                treatment,
                                'description',
                                value,
                                'history'
                              )
                            }
                            placeholder='Descripción del tratamiento'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[116px]'>
                          <input
                            type='text'
                            value={treatment.date}
                            onChange={(e) =>
                              updateTreatmentField(
                                treatment,
                                'date',
                                e.target.value,
                                'history'
                              )
                            }
                            className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='DD/MM/AA'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[105px]'>
                          <input
                            type='text'
                            value={treatment.amount}
                            onChange={(e) =>
                              updateTreatmentField(
                                treatment,
                                'amount',
                                e.target.value,
                                'history'
                              )
                            }
                            className='w-full text-body-md text-neutral-900 bg-transparent border-none outline-none focus:bg-[var(--color-neutral-50)] px-1 py-0.5 rounded'
                            placeholder='0 €'
                          />
                        </TableBodyCell>
                        <TableBodyCell className='w-[110px]'>
                          <StatusBadge status={treatment.status} />
                        </TableBodyCell>
                        <TableBodyCell className='w-[203px]'>
                          <SelectInput
                            placeholder='Seleccionar profesional'
                            value={treatment.professional || undefined}
                            onChange={(v) =>
                              updateTreatmentField(
                                treatment,
                                'professional',
                                v || '',
                                'history'
                              )
                            }
                            options={PROFESSIONALS}
                          />
                        </TableBodyCell>
                        <TableBodyCell className={`w-10 sticky right-0 z-10 ${rowBg} group-hover:bg-[var(--color-neutral-50)]`} align='right'>
                          <button
                            type='button'
                            onClick={(e) =>
                              handleOpenMenu(treatment, 'history', index, e)
                            }
                            className='p-2 hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                            aria-label='Acciones rápidas'
                          >
                            <MoreVertRounded className='w-5 h-5 text-[var(--color-neutral-600)]' />
                          </button>
                        </TableBodyCell>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Menú de acciones rápidas */}
      {activeMenu && (
        <RowActionsMenu
          treatment={activeMenu.treatment}
          onClose={() => setActiveMenu(null)}
          triggerRect={activeMenu.triggerRect}
          onCreateBudget={handleMenuCreateBudget}
          onCreateAppointment={handleMenuCreateAppointment}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteTreatment}
        />
      )}

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
