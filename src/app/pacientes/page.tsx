'use client'

import React from 'react'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import { useRouter } from 'next/navigation'
import AddPatientModal from '@/components/pacientes/AddPatientModal'
import PatientFichaModal from '@/components/pacientes/PatientFichaModal'

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
      <p className='text-lg leading-7 font-medium text-[var(--color-neutral-600)]'>
        {title}
      </p>
      <div className='flex items-baseline justify-between'>
        <p className='text-[min(3.25rem,5vw)] leading-[1.2] text-[var(--color-neutral-900)] font-medium'>
          {value}
        </p>
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

function StatusPill({ type }: { type: 'Activo' | 'Hecho' }) {
  if (type === 'Activo') {
    return (
      <span className='inline-flex items-center'>
        <Chip color='sky' size='md'>
          Activo
        </Chip>
      </span>
    )
  }
  return (
    <span className='inline-flex items-center'>
      <Chip color='green' rounded='full' size='md'>
        Hecho
      </Chip>
    </span>
  )
}

function TableHeaderCell({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={[
        'text-base leading-6 font-normal text-[var(--color-neutral-600)] text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function Row() {
  const router = useRouter()
  return (
    <tr
      className='cursor-pointer hover:bg-[var(--color-neutral-50)]'
      onClick={() => router.push('/pacientes/ficha')}
    >
      <td className='py-1 pr-2 w-[240px]'>
        <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
          Laura Rivas
        </p>
      </td>
      <td className='py-1 pr-2 w-[191px]'>
        <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
      <td className='py-1 pr-2 w-[154px]'>
        <StatusPill type='Activo' />
      </td>
      <td className='py-1 pr-2 w-[196px]'>
        <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
          888 888 888
        </p>
      </td>
      <td className='py-1 pr-2 w-[151px]'>
        <StatusPill type='Hecho' />
      </td>
      <td className='py-1 pr-2 w-[120px]'>
        <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
          No
        </p>
      </td>
      <td className='py-1 pr-2 w-[120px]'>
        <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
          380€
        </p>
      </td>
      <td className='py-1 pr-2 w-[204px]'>
        <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
    </tr>
  )
}

type PatientRow = {
  id: string
  name: string
  nextDate: string
  status: 'Activo' | 'Hecho'
  phone: string
  checkin: 'Hecho' | 'Pendiente'
  financing: 'Sí' | 'No'
  debt: string
  lastContact: string
  tags?: Array<'deuda' | 'activo' | 'recall'>
}

const MOCK_PATIENTS: PatientRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `p-${i}`,
  name: 'Laura Rivas',
  nextDate: 'DD/MM/AAAA',
  status: 'Activo',
  phone: '888 888 888',
  checkin: 'Hecho',
  financing: 'No',
  debt: '380€',
  lastContact: 'DD/MM/AAAA',
  tags: i % 3 === 0 ? ['deuda'] : i % 2 === 0 ? ['activo'] : ['recall']
}))

export default function PacientesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'activos' | 'recall'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>(
    []
  )
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)

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

  return (
    <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] p-[min(3rem,4vw)] flex flex-col overflow-auto'>
      <AddPatientModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <PatientFichaModal
        open={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
      />

      {/* Header Section - Fixed size */}
      <div className='flex-shrink-0'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-[28px] leading-[36px] text-[var(--color-neutral-900)]'>
              Pacientes
            </h1>
            <Chip color='teal' rounded='full' size='xs'>
              Recepción
            </Chip>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-base leading-6 text-[var(--color-neutral-900)] bg-[#F8FAFB] border border-[#CBD3D9] hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947] transition-colors cursor-pointer'
            >
              <span className='text-[20px] leading-[20px]'>＋</span>
              <span className='font-medium'>Añadir paciente</span>
            </button>
            <button
              className='size-6 grid place-items-center text-[var(--color-neutral-900)] cursor-pointer'
              aria-label='Más opciones'
            >
              ⋮
            </button>
          </div>
        </div>
        <p className='text-[14px] leading-[20px] text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
          Busca y filtra pacientes; confirma asistencias, reprograma citas y
          envía pre-registro, firmas y recordatorios al instante.
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
          value='2'
          badge={
            <span className='text-base leading-6 text-[var(--color-success-600)]'>
              24%
            </span>
          }
        />
        <KpiCard
          title='Pacientes semana'
          value='16'
          badge={
            <span className='text-base leading-6 text-[var(--color-success-600)]'>
              8%
            </span>
          }
        />
        <KpiCard
          title='Pacientes recibidos'
          value='4/16'
          badge={
            <span className='text-base leading-6 text-[#d97706]'>25%</span>
          }
        />
        <KpiCard
          title='Citas confirmadas'
          value='12/16'
          badge={
            <span className='text-base leading-6 text-[var(--color-success-600)]'>
              75%
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
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-[14px] leading-[20px] text-[var(--color-neutral-700)] cursor-pointer'>
              Estado
            </button>
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-[14px] leading-[20px] text-[var(--color-neutral-700)] cursor-pointer'>
              Check-in
            </button>
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
              🗑️
            </button>
            <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
              ⋯
            </button>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
              <span className='text-[var(--color-neutral-900)]'>🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Buscar por nombre, email, teléfono,...'
                className='bg-transparent outline-none text-[14px] leading-[20px] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-900)]'
              />
            </div>
            <button
              onClick={clearFilters}
              className={[
                'flex items-center gap-2 px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                selectedFilters.length === 0
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              <svg
                aria-hidden='true'
                viewBox='0 0 24 24'
                className='size-4'
                fill='none'
              >
                <path
                  d='M4 5h16l-6 8v6l-4-2v-4L4 5z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinejoin='round'
                />
              </svg>
              <span>Todos</span>
            </button>
            <button
              onClick={() => toggleFilter('deuda')}
              className={[
                'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('deuda')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              En deuda
            </button>
            <button
              onClick={() => toggleFilter('activos')}
              className={[
                'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('activos')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Activos
            </button>
            <button
              onClick={() => toggleFilter('recall')}
              className={[
                'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('recall')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Recall
            </button>
          </div>
        </div>

        <div className='flex-1 rounded-[8px] overflow-auto'>
          <table className='w-full table-fixed'>
            <thead>
              <tr>
                <TableHeaderCell className='py-1 pr-2 w-[40px]'>
                  <span className='sr-only'>Seleccionar fila</span>
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <AccountCircleRounded className='size-4 text-[var(--color-neutral-700)]' />
                    <span>Paciente</span>
                  </div>
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[140px]'>
                  Próxima cita
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[120px]'>
                  Estado
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[140px]'>
                  Teléfono
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[100px]'>
                  Check-in
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[100px]'>
                  Financiación
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[100px]'>
                  Deuda
                </TableHeaderCell>
                <TableHeaderCell className='py-1 pr-2 w-[140px]'>
                  Último contacto
                </TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {MOCK_PATIENTS.filter((p) => {
                const q = query.trim().toLowerCase()
                const matchesQuery = q
                  ? p.name.toLowerCase().includes(q) ||
                    p.phone.toLowerCase().includes(q)
                  : true
                const matchesFilter = (() => {
                  if (selectedFilters.length === 0) return true
                  const tagMap: Record<
                    FilterKey,
                    'deuda' | 'activo' | 'recall'
                  > = {
                    deuda: 'deuda',
                    activos: 'activo',
                    recall: 'recall'
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
                  <td className='py-2 pr-2 w-[40px]'>
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
                      <svg
                        aria-hidden='true'
                        viewBox='0 0 24 24'
                        className={[
                          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                          'size-4 text-[#1E4947] transition-opacity',
                          isPatientSelected(row.id)
                            ? 'opacity-100'
                            : 'opacity-0'
                        ].join(' ')}
                      >
                        <path
                          d='M5 12l4 4L19 7'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                      <span className='sr-only'>Seleccionar fila</span>
                    </button>
                  </td>
                  <td className='py-2 pr-2 w-[200px]'>
                    <p className='text-base leading-6 text-[var(--color-neutral-900)] truncate'>
                      {row.name}
                    </p>
                  </td>
                  <td className='py-2 pr-2 w-[140px]'>
                    <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
                      {row.nextDate}
                    </p>
                  </td>
                  <td className='py-2 pr-2 w-[120px]'>
                    <StatusPill type={row.status} />
                  </td>
                  <td className='py-2 pr-2 w-[140px]'>
                    <p className='text-base leading-6 text-[var(--color-neutral-900)] truncate'>
                      {row.phone}
                    </p>
                  </td>
                  <td className='py-2 pr-2 w-[100px]'>
                    <span className='inline-flex items-center'>
                      <Chip color='green' rounded='full'>
                        {row.checkin}
                      </Chip>
                    </span>
                  </td>
                  <td className='py-2 pr-2 w-[100px]'>
                    <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
                      {row.financing}
                    </p>
                  </td>
                  <td className='py-2 pr-2 w-[100px]'>
                    <p className='text-base leading-6 text-[var(--color-neutral-900)]'>
                      {row.debt}
                    </p>
                  </td>
                  <td className='py-2 pr-2 w-[140px]'>
                    <p className='text-base leading-6 text-[var(--color-neutral-900)] truncate'>
                      {row.lastContact}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            «
          </button>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            ‹
          </button>
          <span className='font-bold underline'>1</span>
          <span>2</span>
          <span>…</span>
          <span>12</span>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            ›
          </button>
          <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
            »
          </button>
        </div>
      </div>
    </div>
  )
}
