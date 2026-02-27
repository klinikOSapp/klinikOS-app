'use client'

import {
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  SearchRounded
} from '@/components/icons/md3'
import { useConfiguration } from '@/context/ConfigurationContext'
import type { ConfigRole } from '@/types/configRoles'
import { Fragment, useCallback, useMemo, useState } from 'react'
import SpecialistListModal from './SpecialistListModal'

// Local aliases
type Role = ConfigRole

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

export default function RolesPermissionsPage() {
  const { roles, permissions, toggleRolePermission } = useConfiguration()
  const [activeTab, setActiveTab] = useState<'roles' | 'permisos'>('roles')
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

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const groups: Record<string, typeof permissions> = {}
    for (const p of filteredPermissions) {
      if (!groups[p.modulo]) groups[p.modulo] = []
      groups[p.modulo].push(p)
    }
    return groups
  }, [filteredPermissions])

  const handleViewUserList = useCallback((role: Role) => {
    setSelectedRole(role)
    setShowSpecialistModal(true)
  }, [])

  const handleCloseSpecialistModal = useCallback(() => {
    setShowSpecialistModal(false)
    setSelectedRole(null)
  }, [])

  const resultCount =
    activeTab === 'roles' ? filteredRoles.length : filteredPermissions.length

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Roles y permisos
        </p>
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
                    <th className='w-[35%] h-10 text-left px-3 text-body-sm text-[var(--color-neutral-600)] border-b border-neutral-200'>
                      Nombre del rol
                    </th>
                    <th className='w-[40%] h-10 text-left px-3 text-body-sm text-[var(--color-neutral-600)] border-b border-neutral-200'>
                      Nº de usuarios asignados
                    </th>
                    <th className='w-[25%] h-10 text-left px-3 text-body-sm text-[var(--color-neutral-600)] border-b border-neutral-200'>
                      Lista usuarios asignados
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className='h-10 hover:bg-[var(--color-neutral-50)] transition-colors'
                    >
                      <td className='px-3 border-b border-neutral-200'>
                        <span className='text-body-sm font-medium text-[var(--color-neutral-900)] truncate block'>
                          {role.nombre}
                        </span>
                      </td>
                      <td className='px-3 border-b border-neutral-200'>
                        <span className='text-body-sm text-[var(--color-neutral-900)]'>
                          {role.usuariosAsignados}
                        </span>
                      </td>
                      <td className='px-3 border-b border-neutral-200'>
                        <button
                          type='button'
                          className='text-body-sm font-medium text-[var(--color-brand-600)] hover:underline cursor-pointer'
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
              /* Permissions Matrix: rows = permissions grouped by module, columns = roles */
              <table className='w-full border-collapse'>
                <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                  <tr>
                    <th className='min-w-[14rem] h-10 text-left px-3 text-body-sm text-[var(--color-neutral-600)] border-b border-neutral-200'>
                      Permiso
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className='h-10 text-center px-3 text-body-sm text-[var(--color-neutral-600)] border-b border-neutral-200 whitespace-nowrap'
                      >
                        {role.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissionsByModule).map(
                    ([moduleName, modulePermissions]) => (
                      <Fragment key={moduleName}>
                        {/* Module group header */}
                        <tr>
                          <td
                            colSpan={1 + roles.length}
                            className='px-3 pt-4 pb-2 border-b border-neutral-200'
                          >
                            <span className='text-body-sm font-semibold text-[var(--color-neutral-500)] uppercase tracking-wide'>
                              {moduleName}
                            </span>
                          </td>
                        </tr>
                        {/* Permission rows */}
                        {modulePermissions.map((permission) => (
                          <tr
                            key={permission.id}
                            className='hover:bg-[var(--color-neutral-50)] transition-colors'
                          >
                            <td className='px-3 py-2.5 border-b border-neutral-200'>
                              <div className='flex flex-col gap-0.5'>
                                <span className='text-body-sm font-medium text-[var(--color-neutral-900)]'>
                                  {permission.nombre}
                                </span>
                                <span className='text-[0.75rem] leading-[1rem] text-[var(--color-neutral-500)]'>
                                  {permission.descripcion}
                                </span>
                              </div>
                            </td>
                            {roles.map((role) => {
                              const hasPermission =
                                role.permisos.includes(permission.id)
                              return (
                                <td
                                  key={`${role.id}-${permission.id}`}
                                  className='text-center border-b border-neutral-200'
                                >
                                  <button
                                    type='button'
                                    onClick={() =>
                                      toggleRolePermission(
                                        role.id,
                                        permission.id
                                      )
                                    }
                                    className={`inline-flex items-center justify-center cursor-pointer transition-colors ${
                                      hasPermission
                                        ? 'text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]'
                                        : 'text-neutral-300 hover:text-neutral-400'
                                    }`}
                                    aria-label={`${hasPermission ? 'Desactivar' : 'Activar'} ${permission.nombre} para ${role.nombre}`}
                                  >
                                    {hasPermission ? (
                                      <CheckBoxRounded className='size-5' />
                                    ) : (
                                      <CheckBoxOutlineBlankRounded className='size-5' />
                                    )}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    )
                  )}
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
