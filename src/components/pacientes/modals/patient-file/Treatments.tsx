'use client'

import {
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  FilterListRounded,
  KeyboardArrowDownRounded,
  MoreVertRounded,
  SearchRounded
} from '@/components/icons/md3'
import React from 'react'

type TreatmentStatus = 'Aceptado' | 'Recall' | 'Pagado' | 'Sin pagar'

type Treatment = {
  id: string
  description: string
  date: string | 'Sin fecha'
  amount: string
  status: TreatmentStatus
  professional: string
  selected?: boolean
}

// Mock data basado en Figma
const PENDING_TREATMENTS: Treatment[] = [
  {
    id: 'LDE',
    description: 'Limpieza dental',
    date: '22/12/25',
    amount: '72 €',
    status: 'Aceptado',
    professional: 'Dr. Guillermo',
    selected: false
  },
  {
    id: 'LDE',
    description: 'Blanqueamiento dental',
    date: 'Sin fecha',
    amount: '200 €',
    status: 'Recall',
    professional: 'Dra. Andrea',
    selected: true
  }
]

const HISTORY_TREATMENTS: Treatment[] = [
  {
    id: 'LDE',
    description: 'Operación mandíbula',
    date: '22/12/25',
    amount: '2.300 €',
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: false
  },
  {
    id: 'LDE',
    description: 'Consulta inicial',
    date: '18/12/25',
    amount: '150 €',
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: true
  },
  {
    id: 'LDE',
    description: 'Radiografía',
    date: '01/12/25',
    amount: '100 €',
    status: 'Sin pagar',
    professional: 'Dra. Andrea',
    selected: false
  },
  {
    id: 'LDE',
    description: 'Extracción de muela',
    date: '01/12/25',
    amount: '500 €',
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: true
  },
  {
    id: 'LDE',
    description: 'Implante dental',
    date: '01/12/25',
    amount: '1.200 €',
    status: 'Pagado',
    professional: 'Dr. Guillermo',
    selected: false
  },
  {
    id: 'LDE',
    description: 'Férula de descarga',
    date: '01/12/25',
    amount: '300 €',
    status: 'Sin pagar',
    professional: 'Dr. Guillermo',
    selected: false
  }
]

function StatusBadge({ status }: { status: TreatmentStatus }) {
  const isAcceptedOrPaid = status === 'Aceptado' || status === 'Pagado'
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full px-[min(0.5rem,1vw)] py-[min(0.25rem,0.5vh)] text-label-sm',
        isAcceptedOrPaid
          ? 'bg-[#E3F2FD] text-[#1976D2] border border-[#BBDEFB]'
          : 'bg-[#FFF3E0] text-[#F57C00] border border-[#FFE0B2]'
      ].join(' ')}
    >
      {status}
    </span>
  )
}

type TreatmentsProps = {
  onCreateBudget?: (selectedTreatments: Treatment[]) => void
  onCancel?: () => void
}

export default function Treatments({
  onCreateBudget,
  onCancel
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
    id: string,
    section: 'pending' | 'history'
  ) => {
    if (section === 'pending') {
      setPendingTreatments((prev) =>
        prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
      )
    } else {
      setHistoryTreatments((prev) =>
        prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
      )
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

  const handleCreateBudget = () => {
    const selected = [
      ...pendingTreatments.filter((t) => t.selected),
      ...historyTreatments.filter((t) => t.selected)
    ]
    onCreateBudget?.(selected)
  }

  return (
    <div className='w-full h-full flex flex-col bg-[var(--color-neutral-50)] relative'>
      <div className='flex-1 overflow-auto'>
        {/* Sección: Tratamientos pendientes */}
        <section className='p-[min(2rem,4vw)]'>
        <div className='flex items-center justify-between mb-[min(1.5rem,3vh)]'>
          <h2 className='text-[min(1.125rem,2vw)] font-medium text-[var(--color-neutral-900)]'>
            Tratamientos pendientes
          </h2>
          <div className='flex items-center gap-[min(1rem,2vw)]'>
            {/* Search bar */}
            <div className='relative'>
              <SearchRounded
                className='absolute left-[min(0.75rem,1.5vw)] top-1/2 -translate-y-1/2 w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-500)]'
                style={{ pointerEvents: 'none' }}
              />
              <input
                type='text'
                placeholder='Buscar...'
                value={searchPending}
                onChange={(e) => setSearchPending(e.target.value)}
                className='w-[min(20rem,40vw)] pl-[min(2.5rem,5vw)] pr-[min(1rem,2vw)] py-[min(0.625rem,1.25vh)] border border-[var(--color-neutral-300)] rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent'
              />
            </div>
            {/* Filtro "Todos" */}
            <button
              type='button'
              className='flex items-center gap-[min(0.5rem,1vw)] px-[min(1rem,2vw)] py-[min(0.625rem,1.25vh)] border border-[var(--color-neutral-300)] rounded-lg bg-white hover:bg-[var(--color-neutral-50)] transition-colors'
            >
              <FilterListRounded className='w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-700)]' />
              <span className='text-body-sm text-[var(--color-neutral-900)]'>
                Todos
              </span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className='bg-white rounded-[min(1rem,2vw)] overflow-hidden border border-[var(--color-neutral-200)]'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]'>
                  <th className='w-[min(3rem,6vw)] px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left'>
                    {/* Checkbox header */}
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    ID
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Descripción/Anotaciones
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Fecha
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Monto
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Estado
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Profesional
                  </th>
                  <th className='w-[min(3rem,6vw)] px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-right'>
                    {/* Menú */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((treatment, index) => (
                  <tr
                    key={`pending-${treatment.id}-${index}`}
                    className={[
                      'border-b border-[var(--color-neutral-200)] transition-colors',
                      treatment.selected ? 'bg-[#E9FBF9]' : 'hover:bg-[var(--color-neutral-50)]'
                    ].join(' ')}
                  >
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)]'>
                      <button
                        type='button'
                        onClick={() => toggleSelection(treatment.id, 'pending')}
                        className='cursor-pointer'
                      >
                        {treatment.selected ? (
                          <CheckBoxRounded className='w-[min(1.5rem,3vw)] h-[min(1.5rem,3vw)] text-[var(--color-brand-500)]' />
                        ) : (
                          <CheckBoxOutlineBlankRounded className='w-[min(1.5rem,3vw)] h-[min(1.5rem,3vw)] text-[var(--color-neutral-400)]' />
                        )}
                      </button>
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md font-semibold text-[var(--color-brand-700)]'>
                      {treatment.id}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.description}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.date}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.amount}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)]'>
                      <StatusBadge status={treatment.status} />
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.professional}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-right'>
                      <button
                        type='button'
                        className='p-[min(0.5rem,1vw)] hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                      >
                        <MoreVertRounded className='w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-600)]' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sección: Historial */}
      <section className='p-[min(2rem,4vw)] pb-[min(2rem,4vw)]'>
        <div className='flex items-center justify-between mb-[min(1.5rem,3vh)]'>
          <h2 className='text-[min(1.125rem,2vw)] font-medium text-[var(--color-neutral-900)]'>
            Historial
          </h2>
          <div className='flex items-center gap-[min(1rem,2vw)]'>
            {/* Search bar */}
            <div className='relative'>
              <SearchRounded
                className='absolute left-[min(0.75rem,1.5vw)] top-1/2 -translate-y-1/2 w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-500)]'
                style={{ pointerEvents: 'none' }}
              />
              <input
                type='text'
                placeholder='Buscar...'
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className='w-[min(20rem,40vw)] pl-[min(2.5rem,5vw)] pr-[min(1rem,2vw)] py-[min(0.625rem,1.25vh)] border border-[var(--color-neutral-300)] rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent'
              />
            </div>
            {/* Filtro "Todos" */}
            <button
              type='button'
              className='flex items-center gap-[min(0.5rem,1vw)] px-[min(1rem,2vw)] py-[min(0.625rem,1.25vh)] border border-[var(--color-neutral-300)] rounded-lg bg-white hover:bg-[var(--color-neutral-50)] transition-colors'
            >
              <FilterListRounded className='w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-700)]' />
              <span className='text-body-sm text-[var(--color-neutral-900)]'>
                Todos
              </span>
            </button>
            {/* Dropdown "Últimos 6 meses" */}
            <div className='relative'>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='appearance-none pl-[min(1rem,2vw)] pr-[min(2rem,4vw)] py-[min(0.625rem,1.25vh)] border border-[var(--color-neutral-300)] rounded-lg bg-white text-body-sm text-[var(--color-neutral-900)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent cursor-pointer'
              >
                <option>Últimos 6 meses</option>
                <option>Últimos 3 meses</option>
                <option>Último año</option>
                <option>Todos</option>
              </select>
              <KeyboardArrowDownRounded
                className='absolute right-[min(0.75rem,1.5vw)] top-1/2 -translate-y-1/2 w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-500)] pointer-events-none'
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className='bg-white rounded-[min(1rem,2vw)] overflow-hidden border border-[var(--color-neutral-200)]'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]'>
                  <th className='w-[min(3rem,6vw)] px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left'>
                    {/* Checkbox header */}
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    ID
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Descripción/Anotaciones
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Fecha
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Monto
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Estado
                  </th>
                  <th className='px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-left text-label-sm font-medium text-[var(--color-neutral-700)]'>
                    Profesional
                  </th>
                  <th className='w-[min(3rem,6vw)] px-[min(1rem,2vw)] py-[min(0.75rem,1.5vh)] text-right'>
                    {/* Menú */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((treatment, index) => (
                  <tr
                    key={`history-${treatment.id}-${index}`}
                    className={[
                      'border-b border-[var(--color-neutral-200)] transition-colors',
                      treatment.selected ? 'bg-[#E9FBF9]' : 'hover:bg-[var(--color-neutral-50)]'
                    ].join(' ')}
                  >
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)]'>
                      <button
                        type='button'
                        onClick={() => toggleSelection(treatment.id, 'history')}
                        className='cursor-pointer'
                      >
                        {treatment.selected ? (
                          <CheckBoxRounded className='w-[min(1.5rem,3vw)] h-[min(1.5rem,3vw)] text-[var(--color-brand-500)]' />
                        ) : (
                          <CheckBoxOutlineBlankRounded className='w-[min(1.5rem,3vw)] h-[min(1.5rem,3vw)] text-[var(--color-neutral-400)]' />
                        )}
                      </button>
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md font-semibold text-[var(--color-brand-700)]'>
                      {treatment.id}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.description}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.date}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.amount}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)]'>
                      <StatusBadge status={treatment.status} />
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-body-md text-[var(--color-neutral-900)]'>
                      {treatment.professional}
                    </td>
                    <td className='px-[min(1rem,2vw)] py-[min(1rem,2vh)] text-right'>
                      <button
                        type='button'
                        className='p-[min(0.5rem,1vw)] hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
                      >
                        <MoreVertRounded className='w-[min(1.25rem,2.5vw)] h-[min(1.25rem,2.5vw)] text-[var(--color-neutral-600)]' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>

      {/* Footer fijo */}
      <footer className='sticky bottom-0 h-[min(5rem,10vh)] bg-white border-t border-[var(--color-neutral-300)] flex items-center justify-between px-[min(2rem,4vw)] shrink-0'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          Has seleccionado {selectedCount} tratamientos
        </p>
        <div className='flex gap-[min(1rem,2vw)]'>
          <button
            type='button'
            onClick={onCancel}
            className='px-[min(1.5rem,3vw)] py-[min(0.75rem,1.5vh)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)] rounded-lg text-body-md font-medium hover:bg-[var(--color-neutral-200)] transition-colors'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleCreateBudget}
            disabled={selectedCount === 0}
            className={[
              'px-[min(1.5rem,3vw)] py-[min(0.75rem,1.5vh)] rounded-lg text-body-md font-medium transition-colors',
              selectedCount === 0
                ? 'bg-[var(--color-neutral-200)] text-[var(--color-neutral-400)] cursor-not-allowed'
                : 'bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] cursor-pointer'
            ].join(' ')}
          >
            Crear presupuesto
          </button>
        </div>
      </footer>
    </div>
  )
}
