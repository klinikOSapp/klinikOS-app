'use client'

import { SearchRounded } from '@/components/icons/md3'
import { useConfiguration } from '@/context/ConfigurationContext'
import type { ConfigRole } from '@/types/configRoles'
import { useCallback, useMemo, useState } from 'react'
import SpecialistListModal from './SpecialistListModal'

type Role = ConfigRole

export default function RolesPermissionsPage() {
  const { roles } = useConfiguration()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showSpecialistModal, setShowSpecialistModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return roles
    return roles.filter((r) => r.nombre.toLowerCase().includes(term))
  }, [roles, search])

  const handleViewUserList = useCallback((role: Role) => {
    setSelectedRole(role)
    setShowSpecialistModal(true)
  }, [])

  const handleCloseSpecialistModal = useCallback(() => {
    setShowSpecialistModal(false)
    setSelectedRole(null)
  }, [])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Roles
        </p>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-hidden flex flex-col'>
          {/* Toolbar */}
          <div className='flex-none px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-[min(1rem,1.5vh)]'>
            <div className='flex items-end justify-between'>
              <p className='text-label-sm text-[var(--color-neutral-500)]'>
                {filteredRoles.length} Resultados totales
              </p>
              <div className='flex items-center gap-2'>
                {showSearch && (
                  <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Buscar rol...'
                    className='h-8 px-3 text-body-sm border border-neutral-200 rounded-lg outline-none focus:border-[var(--color-brand-500)] transition-colors'
                    autoFocus
                  />
                )}
                <button
                  type='button'
                  className='p-1 hover:bg-neutral-100 rounded transition-colors cursor-pointer'
                  aria-label='Buscar'
                  onClick={() => {
                    setShowSearch(!showSearch)
                    if (showSearch) setSearch('')
                  }}
                >
                  <SearchRounded className='size-6 text-[var(--color-neutral-700)]' />
                </button>
              </div>
            </div>
          </div>

          {/* Roles Table */}
          <div className='flex-1 overflow-auto px-[min(2.5rem,3vw)]'>
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
          </div>
        </div>
      </div>

      {/* Specialist List Modal */}
      <SpecialistListModal
        open={showSpecialistModal}
        onClose={handleCloseSpecialistModal}
        roleName={selectedRole?.nombre ?? ''}
        roleId={selectedRole?.id ?? null}
      />
    </>
  )
}
