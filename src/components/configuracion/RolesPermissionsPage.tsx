'use client'

import {
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  SearchRounded
} from '@/components/icons/md3'
import { useClinic } from '@/context/ClinicContext'
import { useConfiguration } from '@/context/ConfigurationContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import SpecialistListModal from './SpecialistListModal'

type Role = {
  id: number
  nombre: string
  slug: string
  usuariosAsignados: number
}

type ActionKey = 'can_view' | 'can_create' | 'can_edit' | 'can_delete'

type PermissionMatrixRow = {
  id: string
  moduleId: number
  moduleName: string
  moduleDescription: string
  action: ActionKey
  actionLabel: string
  description: string
  byRole: Record<number, { permissionId: string | null; enabled: boolean }>
}

type ModalSpecialist = {
  id: string
  nombre: string
  especialidad: string
  color: 'Morado' | 'Naranja' | 'Verde' | 'Azul' | 'Rojo'
  estado: 'activo' | 'inactivo'
  avatarUrl?: string
}

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

function slugifyRoleName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function mapColorLabelToModalColor(
  colorLabel: string
): 'Morado' | 'Naranja' | 'Verde' | 'Azul' | 'Rojo' {
  const normalized = colorLabel.toLowerCase()
  if (normalized.includes('naranja')) return 'Naranja'
  if (normalized.includes('verde')) return 'Verde'
  if (normalized.includes('azul')) return 'Azul'
  if (normalized.includes('rojo')) return 'Rojo'
  return 'Morado'
}

function normalizeRoleKey(value: string): string {
  const slug = slugifyRoleName(value)
  if (!slug) return ''

  if (
    slug.includes('gerencia') ||
    slug.includes('manager') ||
    slug === 'admin'
  ) {
    return 'gerencia'
  }
  if (
    slug.includes('recepcion') ||
    slug.includes('administrativ') ||
    slug.includes('auxiliar')
  ) {
    return 'recepcion'
  }
  if (slug.includes('higien')) return 'higienista'
  if (
    slug.includes('doctor') ||
    slug.includes('odont') ||
    slug.includes('dentist')
  ) {
    return 'doctor'
  }

  return slug
}

function mapProfessionalToRoleKey(value: string): string {
  const slug = slugifyRoleName(value)
  if (!slug) return ''
  if (slug.includes('higien')) return 'higienista'
  if (
    slug.includes('recepcion') ||
    slug.includes('administrativ') ||
    slug.includes('auxiliar')
  ) {
    return 'recepcion'
  }
  if (slug.includes('gerencia') || slug.includes('manager')) return 'gerencia'
  if (
    slug.includes('doctor') ||
    slug.includes('odont') ||
    slug.includes('dent') ||
    slug.includes('orto') ||
    slug.includes('periodon') ||
    slug.includes('endodon') ||
    slug.includes('ciruj') ||
    slug.includes('implant')
  ) {
    return 'doctor'
  }
  return normalizeRoleKey(slug)
}

const ACTION_DEFINITIONS: Array<{
  key: ActionKey
  label: string
  description: string
}> = [
  { key: 'can_view', label: 'Ver', description: 'Puede ver contenido' },
  { key: 'can_create', label: 'Crear', description: 'Puede crear registros' },
  { key: 'can_edit', label: 'Editar', description: 'Puede editar registros' },
  { key: 'can_delete', label: 'Eliminar', description: 'Puede eliminar registros' }
]

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permisos'>('roles')
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionMatrixRows, setPermissionMatrixRows] = useState<
    PermissionMatrixRow[]
  >([])
  const [policyWarning, setPolicyWarning] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showSpecialistModal, setShowSpecialistModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [roleUserIdsById, setRoleUserIdsById] = useState<
    Record<number, string[]>
  >({})
  const [roleUserIdsByKey, setRoleUserIdsByKey] = useState<
    Record<string, string[]>
  >({})
  const [staffProfileById, setStaffProfileById] = useState<
    Record<string, ModalSpecialist>
  >({})

  const { activeClinicId } = useClinic()
  const { professionals } = useConfiguration()

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()

      let roleQuery = supabase
        .from('roles')
        .select('id, clinic_id, display_name, name, is_active')
        .order('display_name', { ascending: true })
      if (activeClinicId) {
        roleQuery = roleQuery.or(`clinic_id.is.null,clinic_id.eq.${activeClinicId}`)
      } else {
        roleQuery = roleQuery.is('clinic_id', null)
      }

      const { data: roleRows, error: rolesError } = await roleQuery

      if (rolesError || !roleRows) {
        if (rolesError?.code === '42P17' && activeClinicId) {
          const { data: currentRoleInfo } = await supabase.rpc('get_my_role_info', {
            p_clinic_id: activeClinicId
          })
          const currentRole =
            Array.isArray(currentRoleInfo) && currentRoleInfo.length > 0
              ? (currentRoleInfo[0] as Record<string, unknown>)
              : null

          if (currentRole) {
            const roleDisplayName = String(
              currentRole.role_display_name || currentRole.role_name || 'Mi rol'
            )
            const roleId = Number(currentRole.role_id || 0)
            const permissionsJson = (currentRole.permissions ||
              {}) as Record<string, unknown>

            const fallbackRows: PermissionMatrixRow[] = []
            Object.entries(permissionsJson).forEach(
              ([moduleName, permissionValue]) => {
                const permission = (permissionValue || {}) as Record<string, unknown>
                ACTION_DEFINITIONS.forEach((actionDef) => {
                  fallbackRows.push({
                    id: `fallback-${moduleName}-${actionDef.key}`,
                    moduleId: -1,
                    moduleName,
                    moduleDescription: '',
                    action: actionDef.key,
                    actionLabel: actionDef.label,
                    description: actionDef.description,
                    byRole: {
                      [roleId || 0]: {
                        permissionId: null,
                        enabled: Boolean(permission[actionDef.key.replace('can_', '')])
                      }
                    }
                  })
                })
              }
            )

            setRoles([
              {
                id: roleId || 0,
                nombre: roleDisplayName,
                slug: slugifyRoleName(
                  String(currentRole.role_name || roleDisplayName)
                ),
                usuariosAsignados: 1
              }
            ])
            setRoleUserIdsById({})
            setRoleUserIdsByKey({})
            setStaffProfileById({})
            setPermissionMatrixRows(fallbackRows)
            setPolicyWarning(
              'La política RLS de roles tiene recursión; mostrando vista de fallback (rol actual).'
            )
            return
          }
        }

        console.warn('No se pudieron cargar roles desde DB', rolesError)
        setRoles([])
        setRoleUserIdsById({})
        setRoleUserIdsByKey({})
        setStaffProfileById({})
        setPermissionMatrixRows([])
        setPolicyWarning(
          rolesError?.message || 'No se pudieron cargar roles y permisos.'
        )
        return
      }

      setPolicyWarning(null)

      const roleIds = roleRows.map((row) => Number(row.id))
      const rolesBase: Role[] = roleRows
        .filter((row) => row.is_active !== false)
        .map((row) => ({
          id: Number(row.id),
          nombre: String(row.display_name || row.name || `Rol ${row.id}`),
          slug: slugifyRoleName(
            String(row.name || row.display_name || `rol_${row.id}`)
          ),
          usuariosAsignados: 0
        }))

      const assignmentClinicIds: string[] = activeClinicId
        ? [activeClinicId]
        : []

      const permissionsPromise =
        roleIds.length > 0
          ? supabase
              .from('permissions')
              .select(
                'id, role_id, module_id, can_view, can_create, can_edit, can_delete, modules:module_id(id, name, display_name, description)'
              )
              .in('role_id', roleIds)
          : Promise.resolve({ data: [], error: null } as const)

      const staffRolesPromise =
        assignmentClinicIds.length > 0
          ? supabase
              .from('staff_clinics')
              .select('staff_id, clinic_id, role_id, role')
              .in('clinic_id', assignmentClinicIds)
          : Promise.resolve({ data: [], error: null } as const)

      const assignmentRolesPromise =
        assignmentClinicIds.length > 0
          ? supabase
              .from('roles')
              .select('id, clinic_id, name, display_name')
              .in('clinic_id', assignmentClinicIds)
          : Promise.resolve({ data: [], error: null } as const)

      const [permissionsResponse, staffRolesResponse, assignmentRolesResponse] =
        await Promise.all([
        permissionsPromise,
        staffRolesPromise,
        assignmentRolesPromise
      ])

      if (permissionsResponse.error) {
        console.warn(
          'No se pudieron cargar permisos desde DB',
          permissionsResponse.error
        )
      }
      if (staffRolesResponse.error) {
        console.warn(
          'No se pudieron cargar asignaciones de usuarios por rol',
          staffRolesResponse.error
        )
      }
      if (assignmentRolesResponse.error) {
        console.warn(
          'No se pudieron cargar roles por clínica para asignaciones',
          assignmentRolesResponse.error
        )
      }

      const assignmentRoleNameById = new Map<number, string>()
      ;(
        (assignmentRolesResponse.data || []) as Array<{
          id?: number
          name?: string | null
          display_name?: string | null
        }>
      ).forEach((row) => {
        const roleId = Number(row.id || 0)
        if (!roleId) return
        assignmentRoleNameById.set(
          roleId,
          String(row.name || row.display_name || '')
        )
      })

      const staffRoleRows = (staffRolesResponse.data || []) as Array<{
        staff_id?: string
        role_id?: number
        role?: string
      }>
      const staffIds = Array.from(
        new Set(
          staffRoleRows
            .map((row) => String(row.staff_id || ''))
            .filter(Boolean)
        )
      )
      const { data: staffRows, error: staffRowsError } =
        staffIds.length > 0
          ? await supabase
              .from('staff')
              .select('id, full_name, specialties, is_active, avatar_url')
              .in('id', staffIds)
          : { data: [], error: null }
      if (staffRowsError) {
        console.warn('No se pudieron cargar perfiles de staff', staffRowsError)
      }

      const professionalById = new Map(professionals.map((item) => [item.id, item]))
      const profileByStaffId = new Map<string, ModalSpecialist>()
      ;(
        (staffRows || []) as Array<{
          id?: string
          full_name?: string | null
          specialties?: string[] | null
          is_active?: boolean
          avatar_url?: string | null
        }>
      ).forEach((row) => {
        const staffId = String(row.id || '')
        if (!staffId) return
        const specialty = Array.isArray(row.specialties)
          ? String(row.specialties[0] || 'Profesional')
          : 'Profesional'
        profileByStaffId.set(staffId, {
          id: staffId,
          nombre: String(row.full_name || 'Profesional'),
          especialidad: specialty,
          color: 'Morado',
          estado: row.is_active === false ? 'inactivo' : 'activo',
          avatarUrl:
            typeof row.avatar_url === 'string' ? row.avatar_url : undefined
        })
      })

      const userIdsByRoleId = new Map<number, Set<string>>()
      const userIdsByRoleKey = new Map<string, Set<string>>()
      staffRoleRows.forEach((row) => {
        const staffId = String(row.staff_id || '')
        if (!staffId) return

        const roleId = Number(row.role_id || 0)
        if (roleId > 0) {
          if (!userIdsByRoleId.has(roleId)) userIdsByRoleId.set(roleId, new Set())
          userIdsByRoleId.get(roleId)?.add(staffId)
        }

        const roleName =
          assignmentRoleNameById.get(roleId) || String(row.role || '')
        const roleKey = normalizeRoleKey(roleName)
        if (roleKey) {
          if (!userIdsByRoleKey.has(roleKey)) {
            userIdsByRoleKey.set(roleKey, new Set())
          }
          userIdsByRoleKey.get(roleKey)?.add(staffId)
        }

        if (!profileByStaffId.has(staffId)) {
          const professionalFallback = professionalById.get(staffId)
          if (professionalFallback) {
            profileByStaffId.set(staffId, {
              id: professionalFallback.id,
              nombre: professionalFallback.name,
              especialidad: professionalFallback.role,
              color: mapColorLabelToModalColor(professionalFallback.colorLabel),
              estado:
                professionalFallback.status === 'Activo'
                  ? 'activo'
                  : 'inactivo',
              avatarUrl: professionalFallback.photoUrl
            })
          }
        }
      })

      if (staffRoleRows.length === 0) {
        professionals.forEach((professional) => {
          const staffId = String(professional.id || '')
          if (!staffId) return

          if (!profileByStaffId.has(staffId)) {
            profileByStaffId.set(staffId, {
              id: professional.id,
              nombre: professional.name,
              especialidad: professional.role,
              color: mapColorLabelToModalColor(professional.colorLabel),
              estado:
                professional.status === 'Activo' ? 'activo' : 'inactivo',
              avatarUrl: professional.photoUrl
            })
          }

          const roleKey = mapProfessionalToRoleKey(professional.role)
          if (!roleKey) return
          if (!userIdsByRoleKey.has(roleKey)) {
            userIdsByRoleKey.set(roleKey, new Set())
          }
          userIdsByRoleKey.get(roleKey)?.add(staffId)
        })
      }

      setStaffProfileById(
        Object.fromEntries(Array.from(profileByStaffId.entries()))
      )
      setRoleUserIdsById(
        Object.fromEntries(
          Array.from(userIdsByRoleId.entries()).map(([roleId, ids]) => [
            roleId,
            Array.from(ids)
          ])
        )
      )
      setRoleUserIdsByKey(
        Object.fromEntries(
          Array.from(userIdsByRoleKey.entries()).map(([roleKey, ids]) => [
            roleKey,
            Array.from(ids)
          ])
        )
      )

      const usersByRole = new Map<number, number>()
      userIdsByRoleId.forEach((ids, roleId) => {
        usersByRole.set(roleId, ids.size)
      })
      const usersByRoleKey = new Map<string, number>()
      userIdsByRoleKey.forEach((ids, roleKey) => {
        usersByRoleKey.set(roleKey, ids.size)
      })

      const mappedRoles: Role[] = rolesBase.map((role) => ({
        ...role,
        usuariosAsignados: (() => {
          const roleKey = normalizeRoleKey(role.slug || role.nombre)
          return (
            usersByRole.get(role.id) ||
            usersByRoleKey.get(roleKey) ||
            0
          )
        })()
      }))

      const permissionRows = (permissionsResponse.data ||
        []) as Array<Record<string, unknown>>

      const moduleMap = new Map<
        number,
        {
          moduleId: number
          moduleName: string
          moduleDescription: string
          byRole: Map<
            number,
            {
              permissionId: string
              can_view: boolean
              can_create: boolean
              can_edit: boolean
              can_delete: boolean
            }
          >
        }
      >()

      permissionRows.forEach((row) => {
        const moduleId = Number(row.module_id || 0)
        const roleId = Number(row.role_id || 0)
        if (!moduleId || !roleId) return

        const moduleInfo = row.modules as
          | {
              id?: number | null
              name?: string | null
              display_name?: string | null
              description?: string | null
            }
          | Array<{
              id?: number | null
              name?: string | null
              display_name?: string | null
              description?: string | null
            }>
          | null

        const resolvedModuleInfo = Array.isArray(moduleInfo)
          ? moduleInfo[0]
          : moduleInfo
        const moduleName = String(
          resolvedModuleInfo?.display_name ||
            resolvedModuleInfo?.name ||
            `Módulo ${moduleId}`
        )
        const moduleDescription = String(resolvedModuleInfo?.description || '')

        if (!moduleMap.has(moduleId)) {
          moduleMap.set(moduleId, {
            moduleId,
            moduleName,
            moduleDescription,
            byRole: new Map()
          })
        }

        const moduleEntry = moduleMap.get(moduleId)
        if (!moduleEntry) return

        moduleEntry.byRole.set(roleId, {
          permissionId: String(row.id || ''),
          can_view: Boolean(row.can_view),
          can_create: Boolean(row.can_create),
          can_edit: Boolean(row.can_edit),
          can_delete: Boolean(row.can_delete)
        })
      })

      const matrixRows: PermissionMatrixRow[] = []
      Array.from(moduleMap.values())
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName, 'es'))
        .forEach((moduleEntry) => {
          ACTION_DEFINITIONS.forEach((actionDef) => {
            const byRole: Record<
              number,
              { permissionId: string | null; enabled: boolean }
            > = {}
            mappedRoles.forEach((role) => {
              const rolePermission = moduleEntry.byRole.get(role.id)
              byRole[role.id] = {
                permissionId: rolePermission?.permissionId || null,
                enabled: Boolean(rolePermission?.[actionDef.key])
              }
            })

            matrixRows.push({
              id: `${moduleEntry.moduleId}:${actionDef.key}`,
              moduleId: moduleEntry.moduleId,
              moduleName: moduleEntry.moduleName,
              moduleDescription: moduleEntry.moduleDescription,
              action: actionDef.key,
              actionLabel: actionDef.label,
              description: actionDef.description,
              byRole
            })
          })
        })

      setRoles(mappedRoles)
      setPermissionMatrixRows(matrixRows)
    } catch (error) {
      console.warn('Error cargando roles y permisos', error)
      setRoles([])
      setRoleUserIdsById({})
      setRoleUserIdsByKey({})
      setStaffProfileById({})
      setPermissionMatrixRows([])
    } finally {
      setIsLoading(false)
    }
  }, [activeClinicId, professionals])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const togglePermission = useCallback(
    async (row: PermissionMatrixRow, roleId: number) => {
      if (!activeClinicId) return
      if (policyWarning) return

      const supabase = createSupabaseBrowserClient()
      const currentCell = row.byRole[roleId]
      const nextValue = !currentCell?.enabled

      try {
        if (currentCell?.permissionId) {
          const payload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            [row.action]: nextValue
          }
          const { error } = await supabase
            .from('permissions')
            .update(payload)
            .eq('id', currentCell.permissionId)
            .eq('role_id', roleId)
          if (error) {
            console.warn('No se pudo actualizar permiso', error)
            return
          }
        } else {
          const payload = {
            role_id: roleId,
            module_id: row.moduleId,
            can_view: row.action === 'can_view' ? nextValue : false,
            can_create: row.action === 'can_create' ? nextValue : false,
            can_edit: row.action === 'can_edit' ? nextValue : false,
            can_delete: row.action === 'can_delete' ? nextValue : false
          }
          const { error } = await supabase.from('permissions').insert(payload)
          if (error) {
            console.warn('No se pudo crear permiso', error)
            return
          }
        }

        await loadData()
      } catch (error) {
        console.warn('Error actualizando permiso', error)
      }
    },
    [activeClinicId, loadData, policyWarning]
  )

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return roles
    return roles.filter((role) => role.nombre.toLowerCase().includes(term))
  }, [roles, search])

  const filteredPermissionRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return permissionMatrixRows
    return permissionMatrixRows.filter(
      (row) =>
        row.moduleName.toLowerCase().includes(term) ||
        row.actionLabel.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term)
    )
  }, [permissionMatrixRows, search])

  const permissionsByModule = useMemo(() => {
    const groups: Record<string, PermissionMatrixRow[]> = {}
    filteredPermissionRows.forEach((row) => {
      if (!groups[row.moduleName]) groups[row.moduleName] = []
      groups[row.moduleName].push(row)
    })
    return groups
  }, [filteredPermissionRows])

  const roleSpecialists = useMemo<ModalSpecialist[]>(() => {
    if (!selectedRole) return []
    const roleKey = normalizeRoleKey(selectedRole.slug || selectedRole.nombre)
    const userIdsFromDb =
      roleUserIdsById[selectedRole.id] || roleUserIdsByKey[roleKey] || []

    return userIdsFromDb
      .map((staffId) => staffProfileById[staffId])
      .map((professional) => ({
        id: professional?.id || '',
        nombre: professional?.nombre || 'Profesional',
        especialidad: professional?.especialidad || 'Profesional',
        color: professional?.color || 'Morado',
        estado: professional?.estado || 'activo',
        avatarUrl: professional?.avatarUrl
      }))
      .filter((item) => Boolean(item.id))
  }, [
    roleUserIdsById,
    roleUserIdsByKey,
    selectedRole,
    staffProfileById
  ])

  const handleViewUserList = useCallback((role: Role) => {
    setSelectedRole(role)
    setShowSpecialistModal(true)
  }, [])

  const handleCloseSpecialistModal = useCallback(() => {
    setShowSpecialistModal(false)
    setSelectedRole(null)
  }, [])

  const resultCount =
    activeTab === 'roles' ? filteredRoles.length : filteredPermissionRows.length

  return (
    <>
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Roles y permisos
        </p>
      </div>

      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-hidden flex flex-col'>
          <div className='flex-none px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-[min(1rem,1.5vh)]'>
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

            <div className='flex items-end justify-between'>
              <div className='flex flex-col gap-1'>
                <p className='text-label-sm text-[var(--color-neutral-500)]'>
                  {isLoading
                    ? 'Cargando...'
                    : `${resultCount} Resultados totales`}
                </p>
                {policyWarning ? (
                  <p className='text-label-sm text-[var(--color-error-600)]'>
                    {policyWarning}
                  </p>
                ) : null}
              </div>
              <div className='flex items-center gap-2'>
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

          <div className='flex-1 overflow-auto px-[min(2.5rem,3vw)]'>
            {activeTab === 'roles' ? (
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
                    ([moduleName, moduleRows]) => (
                      <Fragment key={moduleName}>
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
                        {moduleRows.map((row) => (
                          <tr
                            key={row.id}
                            className='hover:bg-[var(--color-neutral-50)] transition-colors'
                          >
                            <td className='px-3 py-2.5 border-b border-neutral-200'>
                              <div className='flex flex-col gap-0.5'>
                                <span className='text-body-sm font-medium text-[var(--color-neutral-900)]'>
                                  {row.actionLabel}
                                </span>
                                <span className='text-[0.75rem] leading-[1rem] text-[var(--color-neutral-500)]'>
                                  {row.description}
                                </span>
                              </div>
                            </td>
                            {roles.map((role) => {
                              const cell = row.byRole[role.id]
                              const hasPermission = Boolean(cell?.enabled)
                              return (
                                <td
                                  key={`${role.id}-${row.id}`}
                                  className='text-center border-b border-neutral-200'
                                >
                                  <button
                                    type='button'
                                    onClick={() => void togglePermission(row, role.id)}
                                    className={`inline-flex items-center justify-center cursor-pointer transition-colors ${
                                      hasPermission
                                        ? 'text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)]'
                                        : 'text-neutral-300 hover:text-neutral-400'
                                    }`}
                                    aria-label={`${hasPermission ? 'Desactivar' : 'Activar'} ${row.actionLabel} para ${role.nombre}`}
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

      <SpecialistListModal
        open={showSpecialistModal}
        onClose={handleCloseSpecialistModal}
        roleName={selectedRole?.nombre ?? ''}
        specialists={roleSpecialists}
      />
    </>
  )
}
