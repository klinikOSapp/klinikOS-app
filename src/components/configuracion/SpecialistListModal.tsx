'use client'

import { CloseRounded, SearchRounded } from '@/components/icons/md3'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Portal from '@/components/ui/Portal'
import { useEffect, useMemo, useState } from 'react'

type SpecialistListModalProps = {
  open: boolean
  onClose: () => void
  roleName: string
  roleId: string | null
}

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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-body-md ${
        active
          ? 'bg-[#e0f2fe] text-[#075985]'
          : 'bg-neutral-300 text-[var(--color-neutral-900)]'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

type StaffInfo = {
  id: string
  full_name: string
  specialties: string[] | null
  avatar_url: string | null
  is_active: boolean
}

export default function SpecialistListModal({
  open,
  onClose,
  roleName,
  roleId
}: SpecialistListModalProps) {
  const { activeClinicId } = useClinic()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [staffList, setStaffList] = useState<StaffInfo[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch staff assigned to this role (two queries: staff_clinics → staff)
  useEffect(() => {
    if (!open || !roleId || !activeClinicId) {
      setStaffList([])
      return
    }

    let active = true
    setLoading(true)

    async function load() {
      const supabase = createSupabaseBrowserClient()

      // Step 1: get staff_ids for this role + clinic
      const { data: scRows, error: scErr } = await supabase
        .from('staff_clinics')
        .select('staff_id')
        .eq('role_id', Number(roleId))
        .eq('clinic_id', activeClinicId)

      if (!active) return

      if (scErr || !scRows || scRows.length === 0) {
        if (scErr) console.error('Error loading staff_clinics:', scErr)
        setStaffList([])
        setLoading(false)
        return
      }

      const staffIds = scRows.map((r) => String((r as Record<string, unknown>).staff_id))

      // Step 2: get staff details
      const { data: staffRows, error: staffErr } = await supabase
        .from('staff')
        .select('id, full_name, specialties, avatar_url, is_active')
        .in('id', staffIds)
        .order('full_name', { ascending: true })

      if (!active) return

      if (staffErr) {
        console.error('Error loading staff:', staffErr)
        setStaffList([])
      } else {
        setStaffList((staffRows || []) as StaffInfo[])
      }
      setLoading(false)
    }

    void load()
    return () => { active = false }
  }, [open, roleId, activeClinicId])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return staffList
    return staffList.filter((s) => {
      const name = s.full_name?.toLowerCase() || ''
      const spec = (s.specialties?.[0] || '').toLowerCase()
      return name.includes(term) || spec.includes(term)
    })
  }, [staffList, search])

  if (!open) return null

  return (
    <Portal>
      <div
        className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center'
        onClick={onClose}
      >
        <div
          className='bg-white rounded-lg w-[min(48rem,95vw)] max-h-[min(40rem,90vh)] flex flex-col overflow-hidden shadow-xl'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex-none flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
            <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
              {roleName} — Usuarios asignados
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
            <div className='flex-none flex items-center justify-between mb-4'>
              <p className='text-body-sm text-[var(--color-neutral-600)]'>
                {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className='flex items-center gap-2'>
                {showSearch && (
                  <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Buscar...'
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

            {/* Table */}
            <div className='flex-1 overflow-y-auto min-h-0'>
              {loading ? (
                <div className='flex items-center justify-center py-12'>
                  <p className='text-body-md text-[var(--color-neutral-500)]'>Cargando...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className='flex items-center justify-center py-12'>
                  <p className='text-body-md text-[var(--color-neutral-500)]'>
                    No hay usuarios asignados a este rol
                  </p>
                </div>
              ) : (
                <table className='w-full border-collapse'>
                  <thead className='sticky top-0 bg-white z-10'>
                    <tr>
                      <th className='h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                        Nombre
                      </th>
                      <th className='h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                        Especialidad
                      </th>
                      <th className='h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-300'>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((staff) => {
                      const specialty = staff.specialties?.[0] || '—'
                      return (
                        <tr
                          key={staff.id}
                          className='h-12 hover:bg-[var(--color-neutral-50)] transition-colors'
                        >
                          <td className='px-2 border-b border-neutral-200'>
                            <div className='flex items-center gap-2'>
                              <Avatar name={staff.full_name || ''} url={staff.avatar_url || undefined} />
                              <span className='text-body-md text-[var(--color-neutral-900)]'>
                                {staff.full_name || 'Sin nombre'}
                              </span>
                            </div>
                          </td>
                          <td className='px-2 border-b border-neutral-200'>
                            <span className='text-body-md text-[var(--color-neutral-900)]'>
                              {specialty}
                            </span>
                          </td>
                          <td className='px-2 border-b border-neutral-200'>
                            <StatusBadge active={staff.is_active !== false} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
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
