'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import ClientLayout from '@/app/client-layout'
import ParteDiarioModal from '@/components/agenda/modals/ParteDiarioModal'
import { MD3Icon } from '@/components/icons/MD3Icon'
import AddPatientModal from '@/components/pacientes/modals/add-patient/AddPatientModal'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import React from 'react'

const CTA_WIDTH_REM = 7.3125 // 117px ÷ 16
const CTA_HEIGHT_REM = 2.5 // 40px ÷ 16

function KpiCard({
  title,
  value,
  badge
}: {
  title: string
  value: string
  badge?: React.ReactNode
}) {
  return (
    <div className='bg-white rounded-[8px] p-[min(1rem,1.5vw)] h-[min(8rem,12vw)] flex flex-col justify-between shadow-[1px_1px_2px_0_rgba(0,0,0,0.05)] border border-[var(--color-neutral-200)]'>
      <p className='text-title-sm font-medium text-[var(--color-neutral-600)]'>
        {title}
      </p>
      <div className='flex items-baseline justify-between'>
        <p className='text-kpi text-[var(--color-neutral-900)]'>{value}</p>
        {badge}
      </div>
    </div>
  )
}

function Chip({
  children,
  color = 'teal',
  rounded = 'lg',
  size = 'sm'
}: {
  children: React.ReactNode
  color?: 'teal' | 'sky' | 'green' | 'gray'
  rounded?: 'lg' | 'full'
  size?: 'xs' | 'sm' | 'md'
}) {
  const styles = {
    teal: 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-[var(--color-success-200)] text-[var(--color-success-800)]',
    gray: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]'
  }[color]
  const radius = rounded === 'full' ? 'rounded-[80px]' : 'rounded-[4px]'
  const sizeClass =
    size === 'xs'
      ? 'text-label-sm font-normal'
      : size === 'md'
      ? 'text-body-md'
      : 'text-body-sm'

  return (
    <span className={['px-2 py-0.5', sizeClass, styles, radius].join(' ')}>
      {children}
    </span>
  )
}

function StatusPill({
  type
}: {
  type: 'Confirmada' | 'No confirmada' | 'Reagendar'
}) {
  if (type === 'Confirmada') {
    return (
      <span className='inline-flex items-center bg-[#e0f2fe] text-[#075985] px-2 py-1 rounded-[4px] text-body-sm'>
        Confirmada
      </span>
    )
  }
  if (type === 'Reagendar') {
    return (
      <span className='inline-flex items-center bg-[var(--color-neutral-200)] text-[var(--color-neutral-900)] px-2 py-1 rounded-[4px] text-body-sm'>
        Reagendar
      </span>
    )
  }
  return (
    <span className='inline-flex items-center bg-[var(--color-neutral-200)] text-[var(--color-neutral-900)] px-2 py-1 rounded-[4px] text-body-sm'>
      No confirmada
    </span>
  )
}

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

type DailyRow = {
  id: string
  day: string
  hour: string
  name: string
  professional?: string
  reason: string
  phone: string
  status: 'Confirmada' | 'No confirmada' | 'Reagendar'
  charge: 'Si' | 'No'
  tags?: Array<'deuda' | 'confirmada'>
}

const MOCK_PATIENTS: DailyRow[] = [
  {
    id: 'row-1',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'No confirmada',
    charge: 'Si'
  },
  {
    id: 'row-2',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'Reagendar',
    charge: 'Si'
  },
  {
    id: 'row-3',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'No confirmada',
    charge: 'No'
  },
  {
    id: 'row-4',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'Confirmada',
    charge: 'Si',
    tags: ['confirmada']
  },
  {
    id: 'row-5',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'No confirmada',
    charge: 'No'
  },
  {
    id: 'row-6',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'Confirmada',
    charge: 'Si',
    tags: ['confirmada']
  },
  {
    id: 'row-7',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'No confirmada',
    charge: 'No'
  },
  {
    id: 'row-8',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'Confirmada',
    charge: 'No',
    tags: ['confirmada']
  },
  {
    id: 'row-9',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'Confirmada',
    charge: 'No',
    tags: ['confirmada']
  },
  {
    id: 'row-10',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'No confirmada',
    charge: 'No'
  },
  {
    id: 'row-11',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'Confirmada',
    charge: 'No',
    tags: ['confirmada']
  },
  {
    id: 'row-12',
    day: '17 Sep',
    hour: '00:00',
    name: 'Nombre apellido',
    reason: '888 888 888',
    phone: '888 888 888',
    status: 'No confirmada',
    charge: 'Si'
  }
]

export default function ParteDiarioPage() {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'confirmada'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>(
    []
  )
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)
  const [isParteModalOpen, setIsParteModalOpen] = React.useState(false)

  const isPatientSelected = (patientId: string) =>
    selectedPatientIds.includes(patientId)

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatientIds((prevSelected) =>
      prevSelected.includes(patientId)
        ? prevSelected.filter((id) => id !== patientId)
        : [...prevSelected, patientId]
    )
  }

  const isFilterActive = (key: FilterKey) => selectedFilters.includes(key)
  const toggleFilter = (key: FilterKey) => {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
  const clearFilters = () => setSelectedFilters([])

  const searchCtaStyles: React.CSSProperties = {
    width: `min(${CTA_WIDTH_REM}rem, 100%)`,
    minHeight: `min(${CTA_HEIGHT_REM}rem, 6vh)`
  }

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] px-[min(3rem,4vw)] py-[min(1.5rem,2vw)] flex flex-col overflow-auto'>
        <AddPatientModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        <PatientRecordModal
          open={isFichaModalOpen}
          onClose={() => setIsFichaModalOpen(false)}
        />
        <ParteDiarioModal
          isOpen={isParteModalOpen}
          onClose={() => setIsParteModalOpen(false)}
        />

        {/* Header Section - Fixed size */}
        <div className='flex-shrink-0'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
                Parte diario
              </h1>
              <Chip color='teal' rounded='full' size='xs'>
                Recepción
              </Chip>
            </div>
            <div className='flex items-center gap-3'>
              <button
                className='size-6 grid place-items-center text-[var(--color-neutral-900)] cursor-pointer'
                aria-label='Más opciones'
              >
                <MD3Icon
                  name='MoreVertRounded'
                  size='md'
                  className='text-[var(--color-neutral-900)]'
                />
              </button>
              <button
                type='button'
                onClick={() => setIsParteModalOpen(true)}
                className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-[#24282c] bg-[#D3F7F3] border border-[#7DE7DC] hover:bg-[#c3f3ee] hover:border-[#6ad6cd] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947] transition-colors cursor-pointer'
              >
                <MD3Icon name='AddRounded' size='md' />
                <span className='font-medium'>Exportar parte</span>
              </button>
            </div>
          </div>
          <p className='text-body-sm text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
            Exporta el parte diario de la semana actual para que tus
            profesionales puedan ver sus citas.
          </p>
        </div>

        <div
          className='flex-shrink-0 grid gap-[min(1rem,1.5vw)] mt-8'
          style={{
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(15.5rem, 100%), 1fr))'
          }}
        >
          <KpiCard
            title='Pacientes hoy'
            value='16'
            badge={
              <span className='text-body-md text-[var(--color-success-600)]'>
                24%
              </span>
            }
          />
          <KpiCard
            title='Pacientes semana'
            value='4/16'
            badge={<span className='text-body-md text-[#d97706]'>25%</span>}
          />
          <KpiCard
            title='Pacientes recibidos'
            value='12/16'
            badge={
              <span className='text-body-md text-[var(--color-success-600)]'>
                75%
              </span>
            }
          />
          <KpiCard
            title='Citas confirmadas'
            value='1'
            badge={
              <span className='text-body-md text-[var(--color-success-600)]'>
                8%
              </span>
            }
          />
        </div>

        {/* Table Section - Flexible container */}
        <div className='flex-1 flex flex-col mt-8 overflow-hidden'>
          <div className='flex-shrink-0 mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {selectedPatientIds.length > 0 && (
                <Chip color='teal'>{selectedPatientIds.length} selected</Chip>
              )}
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-body-sm text-[var(--color-neutral-700)] cursor-pointer'>
                Estado
              </button>
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-body-sm text-[var(--color-neutral-700)] cursor-pointer'>
                Check-in
              </button>
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
                <MD3Icon name='DeleteRounded' size='md' />
              </button>
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
                <MD3Icon name='MoreHorizRounded' size='md' />
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 px-2 py-1'>
                <MD3Icon
                  name='SearchRounded'
                  size='sm'
                  className='text-[var(--color-neutral-900)]'
                />
              </div>
              <button
                onClick={clearFilters}
                className={[
                  'flex items-center gap-2 px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  selectedFilters.length === 0
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                <MD3Icon name='FilterListRounded' size='sm' />
                <span>Todos</span>
              </button>
              <button
                onClick={() => toggleFilter('deuda')}
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  isFilterActive('deuda')
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                En deuda
              </button>
              <button
                onClick={() => toggleFilter('confirmada')}
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  isFilterActive('confirmada')
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                Confirmada
              </button>
            </div>
          </div>

          <div className='flex-1 rounded-[8px] overflow-auto'>
            <table className='w-full table-fixed border-collapse'>
              <thead>
                <tr>
                  <TableHeaderCell className='w-[40px] pr-2'>
                    <span className='sr-only'>Seleccionar fila</span>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[120px] pr-2'>
                    Día
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[120px] pr-2'>
                    Hora
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[220px] pr-2'>
                    <div className='flex items-center gap-2'>
                      <MD3Icon
                        name='AccountCircleRounded'
                        size='sm'
                        className='text-[var(--color-neutral-700)]'
                      />
                      <span>Paciente</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[200px] pr-2'>
                    Profesional
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[320px] pr-2'>
                    Motivo consulta
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[180px] pr-2'>
                    Teléfono
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[160px] pr-2'>
                    Estado
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[120px] pr-2'>
                    A cobrar
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {MOCK_PATIENTS.filter((p) => {
                  const q = query.trim().toLowerCase()
                  const matchesQuery = q
                    ? p.name.toLowerCase().includes(q) ||
                      p.phone.toLowerCase().includes(q) ||
                      p.reason.toLowerCase().includes(q) ||
                      p.professional?.toLowerCase().includes(q)
                    : true
                  const matchesFilter = (() => {
                    if (selectedFilters.length === 0) return true
                    const tagMap: Record<FilterKey, 'deuda' | 'confirmada'> = {
                      deuda: 'deuda',
                      confirmada: 'confirmada'
                    }
                    return selectedFilters.some((k) =>
                      p.tags?.includes(tagMap[k])
                    )
                  })()
                  return Boolean(matchesQuery && matchesFilter)
                }).map((row, i) => (
                  <tr
                    key={row.id}
                    className='group hover:bg-[var(--color-neutral-50)]'
                    onClick={() => setIsFichaModalOpen(true)}
                  >
                    <TableBodyCell className='w-[40px] pr-2'>
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePatientSelection(row.id)
                        }}
                        aria-pressed={isPatientSelected(row.id)}
                        className='relative size-6 inline-flex items-center justify-center cursor-pointer'
                      >
                        {/* Outline box on hover */}
                        <span className='absolute inset-0 rounded-[4px] border border-[var(--color-neutral-300)] bg-white opacity-0 group-hover:opacity-100 transition-opacity' />
                        {/* Selected border */}
                        <span
                          className={[
                            'absolute inset-0 rounded-[4px] border-2 transition-opacity',
                            isPatientSelected(row.id)
                              ? 'border-[#1E4947] opacity-100'
                              : 'opacity-0'
                          ].join(' ')}
                        />
                        {/* Check icon when selected */}
                        <MD3Icon
                          aria-hidden='true'
                          name='CheckRounded'
                          size='sm'
                          className={[
                            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                            'text-[#1E4947] transition-opacity',
                            isPatientSelected(row.id)
                              ? 'opacity-100'
                              : 'opacity-0'
                          ].join(' ')}
                        />
                        <span className='sr-only'>Seleccionar fila</span>
                      </button>
                    </TableBodyCell>
                    <TableBodyCell className='w-[120px] pr-2'>
                      {row.day}
                    </TableBodyCell>
                    <TableBodyCell className='w-[120px] pr-2'>
                      {row.hour}
                    </TableBodyCell>
                    <TableBodyCell className='w-[220px] pr-2'>
                      <p className='truncate'>{row.name}</p>
                    </TableBodyCell>
                    <TableBodyCell className='w-[200px] pr-2'>
                      <p className='truncate'>{row.professional ?? '—'}</p>
                    </TableBodyCell>
                    <TableBodyCell className='w-[320px] pr-2'>
                      <p className='truncate'>{row.reason}</p>
                    </TableBodyCell>
                    <TableBodyCell className='w-[180px] pr-2'>
                      <p className='truncate'>{row.phone}</p>
                    </TableBodyCell>
                    <TableBodyCell className='w-[160px] pr-2'>
                      <StatusPill type={row.status} />
                    </TableBodyCell>
                    <TableBodyCell className='w-[120px] pr-2'>
                      {row.charge}
                    </TableBodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='FirstPageRounded' size='md' />
            </button>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='ChevronLeftRounded' size='md' />
            </button>
            <span className='font-bold underline'>1</span>
            <span>2</span>
            <span>…</span>
            <span>12</span>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='ChevronRightRounded' size='md' />
            </button>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='LastPageRounded' size='md' />
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
