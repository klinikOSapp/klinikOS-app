'use client'

import {
  AccessTimeFilledRounded,
  AddRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
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
import { Professional, type EmploymentType, type ProfessionalColorTone, useConfiguration } from '@/context/ConfigurationContext'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import AddProfessionalModal, {
  ProfessionalFormData
} from './AddProfessionalModal'
import ProfessionalScheduleModal from './ProfessionalScheduleModal'

type StatusFilter = 'all' | 'active' | 'inactive'
type SpecialtyFilter = string | null

export type Specialist = {
  id: string
  name: string
  role: string
  phone: string
  email: string
  colorLabel: string
  colorTone: ProfessionalColorTone
  employmentType: EmploymentType
  commission?: string
  salary?: string
  status: 'Activo' | 'Inactivo'
}

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

function normalizeCommission(value: string | undefined): string {
  const trimmed = String(value || '').trim()
  if (!trimmed) return '0%'
  return trimmed.includes('%') ? trimmed : `${trimmed}%`
}

function mapProfessionalToSpecialist(professional: Professional): Specialist {
  const employmentType = professional.employmentType || 'autonomo'
  return {
    id: professional.id,
    name: professional.name,
    role: professional.role,
    phone: professional.phone || '—',
    email: professional.email || '—',
    colorLabel: professional.colorLabel,
    colorTone: professional.colorTone,
    employmentType,
    commission:
      employmentType === 'autonomo'
        ? normalizeCommission(professional.commission)
        : undefined,
    salary: employmentType === 'nomina' ? professional.salary : undefined,
    status: professional.status
  }
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
    <div className='grid grid-cols-[2.5rem_1.5fr_0.65fr_0.55fr_1.1fr_0.65fr_0.55fr] w-full sticky top-0 z-10 bg-[var(--color-surface)]'>
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
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Profesional
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <LocalHospitalRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Especialidad
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <PhoneRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Teléfono
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <EmailRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Email
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <PaymentsRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
          Compensación
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <CheckCircleRounded
          className='mr-1.5 size-4 flex-shrink-0 text-[var(--color-neutral-500)]'
          aria-hidden='true'
        />
        <p className='text-body-sm text-[var(--color-neutral-600)]'>
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
      className={`grid grid-cols-[2.5rem_1.5fr_0.65fr_0.55fr_1.1fr_0.65fr_0.55fr] w-full min-h-[3.5rem] cursor-pointer transition-colors ${
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
        className='flex items-center border-b border-neutral-200 px-2 py-2'
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
      <div className='flex items-center gap-2.5 border-b border-neutral-200 px-2 py-2 min-w-0'>
        <div
          className={`size-9 rounded-full flex-shrink-0 flex items-center justify-center text-label-sm font-semibold ${
            colorToneStyles[specialist.colorTone].bg
          } ${colorToneStyles[specialist.colorTone].text}`}
        >
          {initials}
        </div>
        <div className='flex flex-col gap-0.5 min-w-0'>
          <p className='text-body-sm font-medium text-[var(--color-neutral-900)] truncate'>
            {specialist.name}
          </p>
          <span
            className={`inline-flex items-center w-fit px-1.5 py-px rounded-sm text-[0.6875rem] leading-[1rem] font-medium ${
              specialist.employmentType === 'autonomo'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {specialist.employmentType === 'autonomo' ? 'Autónomo' : 'Empleado'}
          </span>
        </div>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {specialist.role}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {specialist.phone}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {specialist.email}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <p className='text-body-sm text-[var(--color-neutral-900)] truncate'>
          {specialist.employmentType === 'autonomo'
            ? specialist.commission || '—'
            : `${specialist.salary || '—'} €/mes`}
        </p>
      </div>
      <div className='flex items-center border-b border-neutral-200 px-2 py-2 min-w-0'>
        <span
          className={[
            'inline-flex items-center justify-center px-2 py-0.5 rounded-sm',
            statusStyles[specialist.status].bg
          ].join(' ')}
        >
          <p
            className={[
              'text-body-sm',
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
  const data = useMemo(
    () => professionals.map(mapProfessionalToSpecialist),
    [professionals]
  )

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

  useEffect(() => {
    const activeIds = new Set(data.map((specialist) => specialist.id))
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => activeIds.has(id)))
      return next.size === prev.size ? prev : next
    })
    setEditingId((prev) => (prev && activeIds.has(prev) ? prev : null))
    setScheduleEditingId((prev) => (prev && activeIds.has(prev) ? prev : null))
  }, [data])

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

  const colorToneToLabel: Record<ProfessionalColorTone, string> = {
    morado: 'Morado',
    naranja: 'Naranja',
    verde: 'Verde',
    azul: 'Azul',
    rojo: 'Rojo'
  }

  const handleAddProfessional = (form: ProfessionalFormData) => {
    const colorTone = form.color
    const empType = form.employmentType || 'autonomo'
    addProfessional({
      name: form.nombre || 'Nuevo profesional',
      role: form.especialidad || 'Especialidad',
      phone: form.telefono || '',
      email: form.email || '',
      colorLabel: colorToneToLabel[colorTone] || 'Verde',
      colorTone,
      employmentType: empType,
      commission:
        empType === 'autonomo' ? normalizeCommission(form.comision) : '0%',
      salary: empType === 'nomina' ? String(form.salary || '').trim() : undefined,
      status: form.estado
    })
    setShowAddModal(false)
  }

  const handleEditProfessional = (form: ProfessionalFormData) => {
    if (!editingId) return
    const colorTone = form.color
    const empType = form.employmentType || 'autonomo'
    updateProfessional(editingId, {
      name: form.nombre || 'Profesional',
      role: form.especialidad || 'Profesional',
      phone: form.telefono || '',
      email: form.email || '',
      colorLabel: colorToneToLabel[colorTone] || 'Verde',
      colorTone,
      employmentType: empType,
      commission:
        empType === 'autonomo' ? normalizeCommission(form.comision) : '0%',
      salary: empType === 'nomina' ? String(form.salary || '').trim() : undefined,
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
        color: editingSpecialist.colorTone,
        estado: editingSpecialist.status,
        employmentType: editingSpecialist.employmentType,
        comision: editingSpecialist.commission,
        salary: editingSpecialist.salary
      }
    : undefined

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
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
              <div className='overflow-auto h-full'>
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
          const fromContext = professionals.find((p) => p.id === scheduleEditingId)
          if (fromContext) return fromContext
          const specialist = data.find((s) => s.id === scheduleEditingId)
          if (!specialist) return null
          const colorTones: Array<'morado' | 'naranja' | 'verde' | 'azul' | 'rojo'> = ['morado', 'naranja', 'verde', 'azul', 'rojo']
          const colorIndex = data.findIndex((s) => s.id === scheduleEditingId) % colorTones.length
          return {
            id: specialist.id,
            name: specialist.name,
            role: specialist.role,
            phone: specialist.phone,
            email: specialist.email,
            colorLabel: 'Auto',
            colorTone: colorTones[colorIndex],
            employmentType: specialist.employmentType,
            commission: specialist.commission || '0%',
            salary: specialist.salary,
            status: specialist.status
          } as Professional
        })()}
      />
    </>
  )
}
