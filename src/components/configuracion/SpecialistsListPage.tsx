'use client'

import {
  AccessTimeFilledRounded,
  AddRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  ContrastRounded,
  DeleteRounded,
  EmailRounded,
  FilterListRounded,
  FirstPageRounded,
  KeyboardArrowDownRounded,
  LastPageRounded,
  LocalHospitalRounded,
  MoreHorizRounded,
  PaymentsRounded,
  PersonRounded,
  PhoneRounded,
  SearchRounded
} from '@/components/icons/md3'
import { Professional, useConfiguration } from '@/context/ConfigurationContext'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import AddProfessionalModal, {
  ProfessionalFormData
} from './AddProfessionalModal'
import ProfessionalScheduleModal from './ProfessionalScheduleModal'

type StatusFilter = 'all' | 'active' | 'inactive'
type SpecialtyFilter = string | null

type Specialist = Professional

export const initialSpecialistsData: Array<Omit<Specialist, 'id'>> = [
  {
    name: 'Dra. María García',
    role: 'Ortodoncista',
    phone: '600000001',
    email: 'maria@clinicamorales.es',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Dr. Antonio Ruiz',
    role: 'Odontólogo',
    phone: '600000002',
    email: 'antonio@clinicamorales.es',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Javier Herrera',
    role: 'Higienista',
    phone: '600000003',
    email: 'javier@clinicamorales.es',
    colorLabel: 'Verde',
    colorTone: 'verde',
    commission: '25%',
    status: 'Inactivo'
  }
]

const colorToneStyles: Record<
  Specialist['colorTone'],
  { bg: string; text: string }
> = {
  morado: { bg: 'bg-[#f3eaff]', text: 'text-[#7725eb]' },
  naranja: { bg: 'bg-[#fff7e8]', text: 'text-[#d97706]' },
  verde: { bg: 'bg-[#e9f8f1]', text: 'text-[#2e7d5b]' },
  azul: { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' },
  rojo: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]' }
}

const statusStyles: Record<Specialist['status'], { bg: string; text: string }> =
  {
    Activo: { bg: 'bg-[#e0f2fe]', text: 'text-[#075985]' },
    Inactivo: { bg: 'bg-[#cbd3d9]', text: 'text-[#24282c]' }
  }

function TableHeader({
  allSelected,
  indeterminate,
  onToggleAll
}: {
  allSelected: boolean
  indeterminate: boolean
  onToggleAll: () => void
}) {
  return (
    <div className='grid grid-cols-[2.5rem_1fr_0.7fr_0.6fr_1fr_0.5fr_0.5fr_0.5fr] w-full sticky top-0 z-10 bg-[var(--color-surface)]'>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <input
          type='checkbox'
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate
          }}
          onChange={onToggleAll}
          className='size-4 accent-[var(--color-brand-500)] cursor-pointer'
          aria-label='Seleccionar todos'
        />
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <PersonRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          Profesional
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <LocalHospitalRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          Especialidad
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <PhoneRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          Teléfono
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <EmailRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          Email
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <ContrastRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          Color
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <PaymentsRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          % comisión
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <CheckCircleRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>
          Estado
        </p>
      </div>
    </div>
  )
}

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function TableRow({
  specialist,
  selected,
  onToggle,
  onRowClick
}: {
  specialist: Specialist
  selected: boolean
  onToggle: () => void
  onRowClick: () => void
}) {
  const initials = getInitials(specialist.name)

  return (
    <div
      className={`grid grid-cols-[2.5rem_1fr_0.7fr_0.6fr_1fr_0.5fr_0.5fr_0.5fr] w-full h-[3rem] cursor-pointer transition-colors ${
        selected
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
        className='flex items-center border-b border-neutral-300 px-2 py-2'
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type='checkbox'
          checked={selected}
          onChange={onToggle}
          className='size-4 accent-[var(--color-brand-500)] cursor-pointer'
          aria-label={`Seleccionar ${specialist.name}`}
        />
      </div>
      <div className='flex items-center gap-2 border-b border-neutral-300 px-2 py-2 min-w-0'>
        <div
          className={`size-8 rounded-full flex-shrink-0 flex items-center justify-center text-body-sm font-medium ${
            colorToneStyles[specialist.colorTone].bg
          } ${colorToneStyles[specialist.colorTone].text}`}
        >
          {initials}
        </div>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {specialist.name}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {specialist.role}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {specialist.phone}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {specialist.email}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <span
          className={[
            'inline-flex items-center justify-center px-2 py-0.5 rounded',
            colorToneStyles[specialist.colorTone].bg
          ].join(' ')}
        >
          <p
            className={[
              'text-body-md truncate',
              colorToneStyles[specialist.colorTone].text
            ].join(' ')}
          >
            {specialist.colorLabel}
          </p>
        </span>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>
          {specialist.commission}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <span
          className={[
            'inline-flex items-center justify-center px-2 py-0.5 rounded',
            statusStyles[specialist.status].bg
          ].join(' ')}
        >
          <p
            className={[
              'text-body-md truncate',
              statusStyles[specialist.status].text
            ].join(' ')}
          >
            {specialist.status}
          </p>
        </span>
      </div>
    </div>
  )
}

export default function SpecialistsListPage() {
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Search and filter state
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
  const [specialtyFilter, setSpecialtyFilter] =
    React.useState<SpecialtyFilter>(null)
  const [showFilterDropdown, setShowFilterDropdown] = React.useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = React.useState(false)
  const [scheduleEditingId, setScheduleEditingId] = React.useState<string | null>(null)

  // Get configuration context for professionals
  const { professionals, addProfessional, updateProfessional, deleteProfessional } =
    useConfiguration()
  const data = professionals

  // Get unique specialties from data
  const uniqueSpecialties = useMemo(() => {
    const roles = new Set(data.map((s) => s.role))
    return Array.from(roles).sort()
  }, [data])

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter((specialist) => {
      // Search filter
      const searchLower = search.toLowerCase().trim()
      if (searchLower) {
        const matchesSearch =
          specialist.name.toLowerCase().includes(searchLower) ||
          specialist.email.toLowerCase().includes(searchLower) ||
          specialist.role.toLowerCase().includes(searchLower) ||
          specialist.phone.includes(searchLower)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter === 'active' && specialist.status !== 'Activo')
        return false
      if (statusFilter === 'inactive' && specialist.status !== 'Inactivo')
        return false

      // Specialty filter
      if (specialtyFilter && specialist.role !== specialtyFilter) return false

      return true
    })
  }, [data, search, statusFilter, specialtyFilter])

  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(data.map((item) => item.id))
      return new Set(Array.from(prev).filter((id) => validIds.has(id)))
    })
  }, [data])

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectionCount = selectedIds.size
  const allSelected =
    selectionCount > 0 && selectionCount === filteredData.length
  const indeterminate =
    selectionCount > 0 && selectionCount < filteredData.length
  const editingSpecialist = editingId
    ? data.find((s) => s.id === editingId)
    : undefined

  // Get current filter label
  const getFilterLabel = (): string => {
    if (specialtyFilter) return specialtyFilter
    if (statusFilter === 'active') return 'Activos'
    if (statusFilter === 'inactive') return 'Inactivos'
    return 'Todos'
  }

  const clearFilters = useCallback(() => {
    setStatusFilter('all')
    setSpecialtyFilter(null)
    setShowFilterDropdown(false)
  }, [])

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredData.length) return new Set<string>()
      return new Set(filteredData.map((s) => s.id))
    })
  }, [filteredData])

  const handleRowClick = useCallback((id: string) => {
    setEditingId(id)
    setShowAddModal(true)
  }, [])

  const handleAddProfessional = (form: ProfessionalFormData) => {
    addProfessional({
      name: form.nombre || 'Nuevo profesional',
      role: form.especialidad || 'Profesional',
      phone: form.telefono || '',
      email: form.email || '',
      colorLabel:
        form.color === 'morado'
          ? 'Morado'
          : form.color === 'naranja'
          ? 'Naranja'
          : 'Verde',
      colorTone: form.color,
      commission: form.comision && form.comision.trim() ? form.comision : '0%',
      status: form.estado
    })
    setShowAddModal(false)
  }

  const handleEditProfessional = (form: ProfessionalFormData) => {
    if (!editingId) return
    updateProfessional(editingId, {
      name: form.nombre || undefined,
      role: form.especialidad || undefined,
      phone: form.telefono || undefined,
      email: form.email || undefined,
      colorLabel:
        form.color === 'morado'
          ? 'Morado'
          : form.color === 'naranja'
          ? 'Naranja'
          : 'Verde',
      colorTone: form.color,
      commission: form.comision && form.comision.trim() ? form.comision : '0%',
      status: form.estado
    })
    setShowAddModal(false)
    setEditingId(null)
  }

  const handleSubmitModal = (form: ProfessionalFormData) => {
    if (editingId) {
      handleEditProfessional(form)
    } else {
      handleAddProfessional(form)
    }
  }

  const handleOpenEdit = () => {
    if (selectionCount !== 1) return
    const onlyId = Array.from(selectedIds)[0]
    setEditingId(onlyId)
    setShowAddModal(true)
  }

  const handleDeactivateSelected = () => {
    if (selectionCount === 0) return
    Array.from(selectedIds).forEach((id) =>
      updateProfessional(id, { status: 'Inactivo' })
    )
    setSelectedIds(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectionCount === 0) return
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar ${selectionCount} especialista${
          selectionCount > 1 ? 's' : ''
        }?`
      )
    ) {
      Array.from(selectedIds).forEach((id) => deleteProfessional(id))
      setSelectedIds(new Set())
    }
  }

  const modalInitialData = editingSpecialist
    ? {
        nombre: editingSpecialist.name,
        telefono: editingSpecialist.phone,
        email: editingSpecialist.email,
        especialidad: editingSpecialist.role,
        color:
          editingSpecialist.colorTone === 'morado' ||
          editingSpecialist.colorTone === 'naranja' ||
          editingSpecialist.colorTone === 'verde'
            ? editingSpecialist.colorTone
            : 'verde',
        estado: editingSpecialist.status,
        comision: editingSpecialist.commission
      }
    : undefined

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Lista de especialistas
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          aria-label='Nuevo especialista'
          onClick={() => setShowAddModal(true)}
        >
          <AddRounded className='size-6 text-[var(--color-neutral-900)]' />
          <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
            Nuevo especialista
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-hidden flex flex-col'>
          {/* Toolbar */}
          <div className='flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-[min(1.5rem,2vw)] py-[min(1rem,1.5vh)] min-h-[min(4rem,6vh)]'>
            <div className='flex items-center'>
              <div className='flex items-center bg-[var(--color-brand-0)] text-[var(--color-brand-700)] px-2 py-1 rounded-l border border-[var(--color-brand-200)]'>
                <span className='text-body-sm'>
                  {selectionCount === 0
                    ? '0 seleccionado'
                    : `${selectionCount} seleccionado${
                        selectionCount > 1 ? 's' : ''
                      }`}
                </span>
              </div>
              <button
                type='button'
                title='Editar especialista seleccionado'
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                onClick={selectionCount === 1 ? handleOpenEdit : undefined}
                disabled={selectionCount !== 1}
              >
                <span className='text-body-sm'>Editar</span>
              </button>
              <button
                type='button'
                title='Gestionar horarios del especialista'
                className='flex items-center gap-1 bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                onClick={() => {
                  if (selectionCount === 1) {
                    const onlyId = Array.from(selectedIds)[0]
                    setScheduleEditingId(onlyId)
                    setShowScheduleModal(true)
                  }
                }}
                disabled={selectionCount !== 1}
              >
                <AccessTimeFilledRounded className='size-4' />
                <span className='text-body-sm'>Horarios</span>
              </button>
              <button
                type='button'
                title='Desactivar especialistas seleccionados'
                onClick={handleDeactivateSelected}
                disabled={selectionCount === 0}
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <span className='text-body-sm'>Desactivar</span>
              </button>
              <button
                type='button'
                title='Eliminar especialistas seleccionados'
                aria-label='Eliminar'
                onClick={handleDeleteSelected}
                disabled={selectionCount === 0}
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <DeleteRounded className='size-5 text-[var(--color-neutral-700)]' />
              </button>
              <button
                type='button'
                title='Más opciones'
                aria-label='Más opciones'
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 rounded-r border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
              >
                <MoreHorizRounded className='size-5 text-[var(--color-neutral-700)]' />
              </button>
            </div>

            <div className='flex items-center gap-2'>
              {/* Search Input */}
              <div className='relative'>
                <SearchRounded className='absolute left-2.5 top-1/2 -translate-y-1/2 size-5 text-[var(--color-neutral-500)]' />
                <input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Buscar especialistas...'
                  aria-label='Buscar especialistas'
                  className='h-8 w-40 lg:w-48 rounded-full pl-9 pr-3 text-body-sm border border-neutral-300 outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors placeholder:text-[var(--color-neutral-400)]'
                />
                {search && (
                  <button
                    type='button'
                    onClick={() => setSearch('')}
                    className='absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-100 rounded-full transition-colors'
                    aria-label='Limpiar búsqueda'
                  >
                    <CloseRounded className='size-4 text-[var(--color-neutral-500)]' />
                  </button>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className='relative' ref={filterDropdownRef}>
                <button
                  type='button'
                  aria-label='Filtrar especialistas'
                  aria-expanded={showFilterDropdown}
                  aria-haspopup='listbox'
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${
                    statusFilter !== 'all' || specialtyFilter
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                      : 'border-neutral-300 hover:bg-neutral-100 text-[var(--color-neutral-700)]'
                  }`}
                >
                  <FilterListRounded className='size-5' />
                  <span className='text-body-sm'>{getFilterLabel()}</span>
                  <KeyboardArrowDownRounded
                    className={`size-5 transition-transform ${
                      showFilterDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showFilterDropdown && (
                  <div
                    className='absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] border border-neutral-200 rounded-lg shadow-lg z-20 py-1'
                    role='listbox'
                  >
                    <p className='px-3 py-1.5 text-label-sm text-[var(--color-neutral-500)] font-medium'>
                      Estado
                    </p>
                    <button
                      type='button'
                      role='option'
                      aria-selected={statusFilter === 'all' && !specialtyFilter}
                      onClick={() => {
                        clearFilters()
                      }}
                      className={`w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50 transition-colors ${
                        statusFilter === 'all' && !specialtyFilter
                          ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                          : 'text-[var(--color-neutral-700)]'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type='button'
                      role='option'
                      aria-selected={statusFilter === 'active'}
                      onClick={() => {
                        setStatusFilter('active')
                        setSpecialtyFilter(null)
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50 transition-colors ${
                        statusFilter === 'active'
                          ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                          : 'text-[var(--color-neutral-700)]'
                      }`}
                    >
                      Activos
                    </button>
                    <button
                      type='button'
                      role='option'
                      aria-selected={statusFilter === 'inactive'}
                      onClick={() => {
                        setStatusFilter('inactive')
                        setSpecialtyFilter(null)
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50 transition-colors ${
                        statusFilter === 'inactive'
                          ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                          : 'text-[var(--color-neutral-700)]'
                      }`}
                    >
                      Inactivos
                    </button>

                    <div className='border-t border-neutral-200 my-1' />

                    <p className='px-3 py-1.5 text-label-sm text-[var(--color-neutral-500)] font-medium'>
                      Especialidad
                    </p>
                    {uniqueSpecialties.map((specialty) => (
                      <button
                        key={specialty}
                        type='button'
                        role='option'
                        aria-selected={specialtyFilter === specialty}
                        onClick={() => {
                          setSpecialtyFilter(specialty)
                          setStatusFilter('all')
                          setShowFilterDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50 transition-colors ${
                          specialtyFilter === specialty
                            ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                            : 'text-[var(--color-neutral-700)]'
                        }`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table with scroll */}
          <div className='flex-1 min-h-0 px-[min(1.5rem,2vw)] pb-[min(1.5rem,2vh)]'>
            {filteredData.length === 0 ? (
              /* Empty State */
              <div className='flex flex-col items-center justify-center py-16 border border-neutral-300 rounded bg-[var(--color-surface)]'>
                <PersonRounded className='size-12 text-[var(--color-neutral-300)]' />
                <p className='text-body-md text-[var(--color-neutral-500)] mt-4'>
                  {search || statusFilter !== 'all' || specialtyFilter
                    ? 'No se encontraron especialistas con los filtros aplicados'
                    : 'No hay especialistas registrados'}
                </p>
                {(search || statusFilter !== 'all' || specialtyFilter) && (
                  <button
                    type='button'
                    onClick={() => {
                      setSearch('')
                      clearFilters()
                    }}
                    className='mt-4 px-4 py-2 text-body-sm text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-lg transition-colors'
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className='border border-neutral-300 rounded overflow-auto h-full'>
                <TableHeader
                  allSelected={allSelected}
                  indeterminate={indeterminate}
                  onToggleAll={toggleAll}
                />
                {filteredData.map((s) => (
                  <TableRow
                    key={s.id}
                    specialist={s}
                    selected={selectedIds.has(s.id)}
                    onToggle={() => toggleRow(s.id)}
                    onRowClick={() => handleRowClick(s.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className='flex-none flex items-center justify-end gap-3 px-[min(1.5rem,2vw)] pb-[min(1rem,1.5vh)] text-[var(--color-neutral-700)]'>
            <div className='flex items-center gap-1'>
              <button
                type='button'
                aria-label='Primera página'
                className='p-1 hover:bg-neutral-100 rounded transition-colors'
              >
                <FirstPageRounded className='size-6 text-[var(--color-neutral-600)]' />
              </button>
              <button
                type='button'
                aria-label='Página anterior'
                className='p-1 hover:bg-neutral-100 rounded transition-colors'
              >
                <ChevronLeftRounded className='size-6 text-[var(--color-neutral-600)]' />
              </button>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-body-sm font-bold underline text-[var(--color-neutral-900)]'>
                1
              </span>
              <span className='text-body-sm text-[var(--color-neutral-500)]'>
                2
              </span>
              <span className='text-body-sm text-[var(--color-neutral-500)]'>
                ...
              </span>
              <span className='text-body-sm text-[var(--color-neutral-500)]'>
                12
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <button
                type='button'
                aria-label='Página siguiente'
                className='p-1 hover:bg-neutral-100 rounded transition-colors'
              >
                <ChevronRightRounded className='size-6 text-[var(--color-neutral-600)]' />
              </button>
              <button
                type='button'
                aria-label='Última página'
                className='p-1 hover:bg-neutral-100 rounded transition-colors'
              >
                <LastPageRounded className='size-6 text-[var(--color-neutral-600)]' />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddProfessionalModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingId(null)
        }}
        onSubmit={handleSubmitModal}
        title={editingId ? 'Editar especialista' : 'Nuevo profesional'}
        submitLabel={editingId ? 'Guardar cambios' : 'Añadir profesional'}
        initialData={modalInitialData}
      />

      <ProfessionalScheduleModal
        open={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setScheduleEditingId(null)
        }}
        professional={(() => {
          if (!scheduleEditingId) return null
          return professionals.find((p) => p.id === scheduleEditingId) || null
        })()}
      />
    </>
  )
}
