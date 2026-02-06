'use client'

import React, { useMemo, useState } from 'react'
import { CloseRounded, AddRounded, SearchRounded, FilterAltRounded, MonitorHeartRounded } from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'

// Types
type SpecialistColor = 'Morado' | 'Naranja' | 'Verde' | 'Azul' | 'Rojo'
type SpecialistStatus = 'activo' | 'inactivo'

type Specialist = {
  id: string
  nombre: string
  especialidad: string
  color: SpecialistColor
  estado: SpecialistStatus
  avatarUrl?: string
}

type SpecialistListModalProps = {
  open: boolean
  onClose: () => void
  roleName: string
  specialists: Specialist[]
}

// Color badge configuration
const COLOR_CONFIG: Record<SpecialistColor, { bg: string; text: string }> = {
  Morado: { bg: 'bg-[#f3eaff]', text: 'text-[#7725eb]' },
  Naranja: { bg: 'bg-[#fff7e8]', text: 'text-[#d97706]' },
  Verde: { bg: 'bg-[#e9f8f1]', text: 'text-[#2e7d5b]' },
  Azul: { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' },
  Rojo: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]' }
}

// ColorBadge component
function ColorBadge({ color }: { color: SpecialistColor }) {
  const config = COLOR_CONFIG[color]
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-body-md ${config.bg} ${config.text}`}
    >
      {color}
    </span>
  )
}

// StatusBadge component
function StatusBadge({ status }: { status: SpecialistStatus }) {
  const isActive = status === 'activo'
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-body-md ${
        isActive
          ? 'bg-[#e0f2fe] text-[#075985]'
          : 'bg-neutral-300 text-[var(--color-neutral-900)]'
      }`}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  )
}

// Avatar component
function Avatar({ name, url }: { name: string; url?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className='size-8 rounded-full object-cover'
      />
    )
  }

  return (
    <div className='size-8 rounded-full bg-neutral-200 flex items-center justify-center'>
      <span className='text-label-sm text-[var(--color-neutral-600)]'>{initials}</span>
    </div>
  )
}

// Sample specialists data
const sampleSpecialists: Specialist[] = [
  { id: 's1', nombre: 'Fernandino Fernández', especialidad: 'Odontólogo', color: 'Morado', estado: 'inactivo' },
  { id: 's2', nombre: 'Carlos Pérez', especialidad: 'Ortodoncista', color: 'Naranja', estado: 'activo' },
  { id: 's3', nombre: 'Fernandino Fernández', especialidad: 'Odontólogo', color: 'Morado', estado: 'activo' },
  { id: 's4', nombre: 'Javier Herrera', especialidad: 'Higienista', color: 'Verde', estado: 'activo' },
  { id: 's5', nombre: 'Javier Herrera', especialidad: 'Higienista', color: 'Verde', estado: 'activo' },
  { id: 's6', nombre: 'Javier Herrera', especialidad: 'Higienista', color: 'Verde', estado: 'activo' },
  { id: 's7', nombre: 'Carlos Pérez', especialidad: 'Ortodoncista', color: 'Naranja', estado: 'activo' },
  { id: 's8', nombre: 'Fernandino Fernández', especialidad: 'Odontólogo', color: 'Morado', estado: 'activo' },
  { id: 's9', nombre: 'Fernandino Fernández', especialidad: 'Odontólogo', color: 'Morado', estado: 'activo' },
  { id: 's10', nombre: 'Carlos Pérez', especialidad: 'Ortodoncista', color: 'Naranja', estado: 'activo' }
]

export default function SpecialistListModal({
  open,
  onClose,
  roleName,
  specialists = sampleSpecialists
}: SpecialistListModalProps) {
  const [search, setSearch] = useState('')

  // Filter specialists
  const filteredSpecialists = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return specialists
    return specialists.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.especialidad.toLowerCase().includes(term) ||
        s.color.toLowerCase().includes(term)
    )
  }, [specialists, search])

  if (!open) return null

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center'
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className='bg-white rounded-lg w-[min(53rem,95vw)] max-h-[min(52rem,90vh)] flex flex-col overflow-hidden shadow-xl'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex-none flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
            <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
              Lista de Especialistas
            </p>
            <button
              type='button'
              onClick={onClose}
              className='p-1 hover:bg-neutral-100 rounded transition-colors cursor-pointer'
              aria-label='Cerrar'
            >
              <CloseRounded className='size-4 text-[var(--color-neutral-900)]' />
            </button>
          </div>

          {/* Content */}
          <div className='flex-1 flex flex-col px-8 py-6 overflow-hidden'>
            {/* Toolbar */}
            <div className='flex-none flex items-center justify-between mb-6'>
              <p className='text-body-sm text-[var(--color-neutral-600)]'>
                {filteredSpecialists.length} Resultados totales
              </p>
              <div className='flex items-center gap-2'>
                {/* Search */}
                <button
                  type='button'
                  className='p-1 hover:bg-neutral-100 rounded transition-colors cursor-pointer'
                  aria-label='Buscar'
                >
                  <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                </button>

                {/* Filter */}
                <button
                  type='button'
                  className='flex items-center gap-0.5 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors cursor-pointer'
                >
                  <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>Todos</span>
                </button>

                {/* Add specialist */}
                <button
                  type='button'
                  className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer'
                >
                  <AddRounded className='text-[var(--color-neutral-900)] size-6' />
                  <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                    Añadir especialista
                  </span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className='flex-1 overflow-auto min-h-0'>
              <table className='w-full min-w-[49rem] border-collapse'>
                <thead className='sticky top-0 bg-white z-10'>
                  <tr>
                    <th className='min-w-[18.5rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      <div className='flex items-center gap-2'>
                        <MonitorHeartRounded className='size-4 text-[var(--color-neutral-600)]' />
                        <span>Doctor</span>
                      </div>
                    </th>
                    <th className='min-w-[11.25rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Especialidad
                    </th>
                    <th className='min-w-[9.5rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Color
                    </th>
                    <th className='min-w-[9.75rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecialists.map((specialist) => (
                    <tr
                      key={specialist.id}
                      className='h-12 bg-white hover:bg-[var(--color-neutral-50)] transition-colors'
                    >
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <div className='flex items-center gap-2'>
                          <Avatar name={specialist.nombre} url={specialist.avatarUrl} />
                          <span className='text-body-md text-[var(--color-neutral-900)]'>
                            {specialist.nombre}
                          </span>
                        </div>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span className='text-body-md text-[var(--color-neutral-900)]'>
                          {specialist.especialidad}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <ColorBadge color={specialist.color} />
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <StatusBadge status={specialist.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className='flex-none flex justify-end px-8 pb-6'>
            <button
              type='button'
              onClick={onClose}
              className='flex items-center justify-center h-10 px-4 rounded-full bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] transition-colors cursor-pointer min-w-[10rem]'
            >
              <span className='text-body-md font-medium text-[var(--color-brand-900)]'>
                Aceptar
              </span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
