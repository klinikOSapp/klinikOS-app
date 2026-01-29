'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { AddRounded, SearchRounded, FilterAltRounded } from '@/components/icons/md3'
import SpecialistListModal from './SpecialistListModal'

// Types
type Role = {
  id: string
  nombre: string
  usuariosAsignados: number
}

type Permission = {
  id: string
  nombre: string
  descripcion: string
  modulo: string
  activo: boolean
}

// Tab component
function Tab({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`h-10 px-2 flex items-center cursor-pointer transition-colors ${
        active
          ? 'border-b border-[var(--color-brand-500)] text-[var(--color-neutral-900)]'
          : 'text-[var(--color-neutral-600)]'
      }`}
    >
      <span className='text-title-md font-medium'>{label}</span>
    </button>
  )
}

// Sample roles data
const initialRoles: Role[] = [
  {
    id: 'r1',
    nombre: 'Doctor',
    usuariosAsignados: 32
  },
  {
    id: 'r2',
    nombre: 'Administrativo',
    usuariosAsignados: 4
  },
  {
    id: 'r3',
    nombre: 'Higienista',
    usuariosAsignados: 8
  },
  {
    id: 'r4',
    nombre: 'Auxiliar',
    usuariosAsignados: 2
  }
]

// Sample permissions data
const initialPermissions: Permission[] = [
  {
    id: 'p1',
    nombre: 'Gestión de pacientes',
    descripcion: 'Crear, editar y eliminar pacientes',
    modulo: 'Pacientes',
    activo: true
  },
  {
    id: 'p2',
    nombre: 'Ver historial clínico',
    descripcion: 'Acceso a historiales clínicos de pacientes',
    modulo: 'Pacientes',
    activo: true
  },
  {
    id: 'p3',
    nombre: 'Gestión de citas',
    descripcion: 'Crear, modificar y cancelar citas',
    modulo: 'Agenda',
    activo: true
  },
  {
    id: 'p4',
    nombre: 'Ver agenda',
    descripcion: 'Visualizar la agenda de citas',
    modulo: 'Agenda',
    activo: true
  },
  {
    id: 'p5',
    nombre: 'Gestión de facturación',
    descripcion: 'Crear y gestionar facturas',
    modulo: 'Facturación',
    activo: true
  },
  {
    id: 'p6',
    nombre: 'Acceso a caja',
    descripcion: 'Gestionar movimientos de caja',
    modulo: 'Caja',
    activo: false
  },
  {
    id: 'p7',
    nombre: 'Configuración',
    descripcion: 'Acceso a configuración del sistema',
    modulo: 'Sistema',
    activo: false
  },
  {
    id: 'p8',
    nombre: 'Gestión de usuarios',
    descripcion: 'Crear y gestionar usuarios del sistema',
    modulo: 'Sistema',
    activo: false
  }
]

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permisos'>('roles')
  const [roles] = useState<Role[]>(initialRoles)
  const [permissions] = useState<Permission[]>(initialPermissions)
  const [search, setSearch] = useState('')
  const [showSpecialistModal, setShowSpecialistModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Filter roles
  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return roles
    return roles.filter((r) => r.nombre.toLowerCase().includes(term))
  }, [roles, search])

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return permissions
    return permissions.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.descripcion.toLowerCase().includes(term) ||
        p.modulo.toLowerCase().includes(term)
    )
  }, [permissions, search])

  const handleAddRole = useCallback(() => {
    // TODO: Open modal to add new role
    console.log('Add new role')
  }, [])

  const handleViewUserList = useCallback((role: Role) => {
    setSelectedRole(role)
    setShowSpecialistModal(true)
  }, [])

  const handleCloseSpecialistModal = useCallback(() => {
    setShowSpecialistModal(false)
    setSelectedRole(null)
  }, [])

  const resultCount = activeTab === 'roles' ? filteredRoles.length : filteredPermissions.length

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <p className='text-headline-sm font-normal text-[var(--color-neutral-900)]'>
          Roles y permisos
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          onClick={handleAddRole}
        >
          <AddRounded className='text-[var(--color-neutral-900)] size-6' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
            Añadir rol
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-hidden flex flex-col'>
          {/* Tabs and Toolbar */}
          <div className='flex-none px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-[min(1rem,1.5vh)]'>
            {/* Tabs */}
            <div className='flex gap-6 items-center mb-4'>
              <Tab
                label='Roles'
                active={activeTab === 'roles'}
                onClick={() => setActiveTab('roles')}
              />
              <Tab
                label='Permisos'
                active={activeTab === 'permisos'}
                onClick={() => setActiveTab('permisos')}
              />
            </div>

            {/* Toolbar */}
            <div className='flex items-end justify-between'>
              <p className='text-label-sm text-[var(--color-neutral-500)]'>
                {resultCount} Resultados totales
              </p>
              <div className='flex items-center gap-2'>
                {/* Search */}
                <div className='flex items-center'>
                  <button
                    type='button'
                    className='p-1 hover:bg-neutral-100 rounded transition-colors cursor-pointer'
                    aria-label='Buscar'
                  >
                    <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                  </button>
                </div>

                {/* Filter */}
                <button
                  type='button'
                  className='flex items-center gap-0.5 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors cursor-pointer'
                >
                  <FilterAltRounded className='size-6 text-[var(--color-neutral-700)]' />
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>Todos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className='flex-1 overflow-auto px-[min(2.5rem,3vw)]'>
            {activeTab === 'roles' ? (
              /* Roles Table */
              <table className='w-full border-collapse table-fixed'>
                <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                  <tr>
                    <th className='w-[35%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Nombre del rol
                    </th>
                    <th className='w-[40%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Nº de usuarios asignados
                    </th>
                    <th className='w-[25%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Lista usuarios asignados
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className='h-10 bg-white hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
                    >
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                          {role.nombre}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span className='text-body-md text-[var(--color-neutral-900)]'>
                          {role.usuariosAsignados}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <button
                          type='button'
                          className='text-body-md font-medium text-[var(--color-brand-600)] hover:underline cursor-pointer'
                          onClick={() => handleViewUserList(role)}
                        >
                          Ver lista
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* Permissions Table */
              <table className='w-full border-collapse table-fixed'>
                <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                  <tr>
                    <th className='w-[25%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Nombre del permiso
                    </th>
                    <th className='w-[40%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Descripción
                    </th>
                    <th className='w-[17%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Módulo
                    </th>
                    <th className='w-[18%] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className='h-10 bg-white hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
                    >
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                          {permission.nombre}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                          {permission.descripcion}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                          {permission.modulo}
                        </span>
                      </td>
                      <td className='px-2 border-b border-r border-neutral-300'>
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-body-md ${
                            permission.activo
                              ? 'bg-[#e0f2fe] text-[#075985]'
                              : 'bg-neutral-300 text-[var(--color-neutral-900)]'
                          }`}
                        >
                          {permission.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Specialist List Modal */}
      <SpecialistListModal
        open={showSpecialistModal}
        onClose={handleCloseSpecialistModal}
        roleName={selectedRole?.nombre ?? ''}
        specialists={[]}
      />
    </>
  )
}
