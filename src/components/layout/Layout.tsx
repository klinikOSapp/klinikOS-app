'use client'

import { useClinic } from '@/context/ClinicContext'
import { AllPermissions, getPermissionsForRole, PermissionAction, RoleContext, UserRole } from '@/context/role-context'
import {
  ArticleRounded,
  BadgeRounded,
  BarChartRounded,
  CalendarMonthRounded,
  SellRounded,
  SettingsRounded,
  SupportAgentRounded
} from '@/components/icons/md3'
import { getSignedUrl } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { LayoutProps } from '@/types/layout'
import type { User } from '@supabase/supabase-js'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
import AccountPanel from './AccountPanel'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

type StaffProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  contact_info: Record<string, unknown> | null
}

type RoleInfo = {
  roleId: number | null
  roleName: string | null
  roleDisplayName: string | null
  isSystemRole: boolean
  permissions: AllPermissions
}

type RoleInfoResponse = {
  role_id: number
  role_name: string
  role_display_name: string
  is_system_role: boolean
  permissions: unknown
}

type RawModulePermission = {
  view?: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
  can_view?: boolean
  can_create?: boolean
  can_edit?: boolean
  can_delete?: boolean
  custom?: Record<string, unknown>
}

type ClinicModuleResponse = {
  module_name: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function normalizeModulePermission(raw: unknown) {
  if (!isRecord(raw)) return null
  const typed = raw as RawModulePermission
  return {
    view: typed.view ?? typed.can_view ?? false,
    create: typed.create ?? typed.can_create ?? false,
    edit: typed.edit ?? typed.can_edit ?? false,
    delete: typed.delete ?? typed.can_delete ?? false,
    custom: typed.custom
  }
}

function normalizePermissions(raw: unknown): AllPermissions {
  if (!isRecord(raw)) return {}

  const normalized: AllPermissions = {}
  for (const [moduleKey, moduleValue] of Object.entries(raw)) {
    const modulePermissions = normalizeModulePermission(moduleValue)
    if (!modulePermissions) continue
    ;(normalized as Record<string, unknown>)[moduleKey] = modulePermissions
  }

  return normalized
}

export default function Layout({ children, ctaMenuItems }: LayoutProps) {
  const baseItemsTop = [
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/agenda',
      icon: <CalendarMonthRounded />,
      children: [
        {
          id: 'parte-diario',
          label: 'Parte Diario',
          href: '/parte-diario',
          icon: <ArticleRounded fontSize='small' />
        }
      ]
    },
    { id: 'caja', label: 'Caja', href: '/caja', icon: <SellRounded /> },
    {
      id: 'pacientes',
      label: 'Pacientes',
      href: '/pacientes',
      icon: <BadgeRounded />
    }
  ]

  const baseItemsBottom = [
    {
      id: 'gestion',
      label: 'Gestión',
      href: '/gestion',
      icon: <BarChartRounded />
    },
    {
      id: 'agente-voz',
      label: 'Agente de Voz',
      href: '/agente-voz',
      icon: <SupportAgentRounded />
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      href: '/configuracion',
      icon: <SettingsRounded />
    }
  ]

  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const router = useRouter()
  const pathname = usePathname()
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [user, setUser] = React.useState<User | null>(null)
  const [staffProfile, setStaffProfile] = React.useState<StaffProfile | null>(null)
  const [displayName, setDisplayName] = React.useState('Usuario')
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined)
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [isSidebarHydrated, setIsSidebarHydrated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [enabledModules, setEnabledModules] = React.useState<Set<string> | null>(null)
  
  // New permission-based state
  const [roleInfo, setRoleInfo] = React.useState<RoleInfo>({
    roleId: null,
    roleName: null,
    roleDisplayName: null,
    isSystemRole: false,
    permissions: {}
  })

  React.useEffect(() => {
    let active = true
    async function loadProfile() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!active) return
      if (!user) {
        setUser(null)
        setStaffProfile(null)
        setDisplayName('Usuario')
        setAvatarUrl(undefined)
        setIsLoading(false)
        return
      }
      setUser(user)
      const { data: staff } = await supabase
        .from('staff')
        .select('id, full_name, avatar_url, contact_info')
        .eq('id', user.id)
        .maybeSingle()
      if (!active) return
      if (staff) {
        setStaffProfile(staff as StaffProfile)
        if (staff.full_name) {
          setDisplayName(staff.full_name)
        } else {
          const metadataName =
            (user.user_metadata?.full_name as string | undefined) ||
            [user.user_metadata?.first_name, user.user_metadata?.last_name]
              .filter(Boolean)
              .join(' ')
          if (metadataName) {
            setDisplayName(metadataName)
          } else {
            setDisplayName(user.email ?? 'Usuario')
          }
        }
        if (staff.avatar_url) {
          try {
            const signed = await getSignedUrl(staff.avatar_url)
            if (active) setAvatarUrl(signed)
          } catch {
            if (active) setAvatarUrl(undefined)
          }
        } else {
          setAvatarUrl(undefined)
        }
      } else {
        const fallbackName =
          (user.user_metadata?.full_name as string | undefined) ||
          [user.user_metadata?.first_name, user.user_metadata?.last_name]
            .filter(Boolean)
            .join(' ')
        setDisplayName(fallbackName || user.email || 'Usuario')
        setStaffProfile(null)
        setAvatarUrl(undefined)
      }
    }
    void loadProfile()
    return () => {
      active = false
    }
  }, [supabase])

  React.useEffect(() => {
    let active = true

    async function loadRoleInfo() {
      if (!isClinicInitialized) return
      if (!user) return

      if (!activeClinicId) {
        if (!active) return
          setRoleInfo({
              roleId: null,
              roleName: null,
              roleDisplayName: null,
              isSystemRole: false,
              permissions: {}
            })
            setIsLoading(false)
            return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .rpc('get_my_role_info', { p_clinic_id: activeClinicId })
          .single<RoleInfoResponse>()

        if (!active) return

        if (error) {
          console.error('Error fetching role info:', error)
          const { data: legacyRole } = await supabase.rpc('get_my_role_in_clinic', {
            p_clinic_id: activeClinicId
          })
          if (!active) return

          if (legacyRole) {
            setRoleInfo({
              roleId: null,
              roleName: legacyRole as string,
              roleDisplayName: legacyRole as string,
              isSystemRole: true,
              // Controlled legacy fallback: only when role-info RPC fails.
              permissions: getPermissionsForRole(legacyRole as string)
            })
          } else {
            setRoleInfo({
              roleId: null,
              roleName: null,
              roleDisplayName: null,
              isSystemRole: false,
              permissions: {}
            })
          }
          return
        }

        setRoleInfo({
          roleId: data.role_id,
          roleName: data.role_name,
          roleDisplayName: data.role_display_name,
          isSystemRole: data.is_system_role,
          permissions: normalizePermissions(data.permissions)
        })
      } catch (error) {
        if (active) {
          console.error('Error loading role info:', error)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadRoleInfo()
    return () => {
      active = false
    }
  }, [activeClinicId, isClinicInitialized, supabase, user])

  React.useEffect(() => {
    let active = true

    async function loadClinicModules() {
      if (!isClinicInitialized) return

      if (!activeClinicId) {
        if (active) setEnabledModules(null)
        return
      }

      try {
        const { data, error } = await supabase
          .rpc('get_clinic_modules', { p_clinic_id: activeClinicId })
          .returns<ClinicModuleResponse[]>()

        if (!active) return
        if (error) {
          console.error('Error loading clinic modules:', error)
          setEnabledModules(null)
          return
        }

        const enabled = new Set(
          (Array.isArray(data) ? data : [])
            .map((row) => row.module_name)
            .filter((name): name is string => typeof name === 'string' && name.length > 0)
        )
        setEnabledModules(enabled)
      } catch (error) {
        if (active) {
          console.error('Error fetching clinic modules:', error)
          setEnabledModules(null)
        }
      }
    }

    void loadClinicModules()
    return () => {
      active = false
    }
  }, [activeClinicId, isClinicInitialized, supabase])

  const handleProfileUpdated = React.useCallback(
    async ({ fullName, avatarUrl: path }: { fullName: string; avatarUrl?: string | null }) => {
      setDisplayName(fullName)
      setStaffProfile((prev) =>
        prev ? { ...prev, full_name: fullName, avatar_url: path ?? null } : prev
      )
      if (path) {
        try {
          const signed = await getSignedUrl(path)
          setAvatarUrl(signed)
        } catch {
          setAvatarUrl(undefined)
        }
      } else {
        setAvatarUrl(undefined)
      }
    },
    []
  )

  const isModuleEnabled = React.useCallback(
    (module: keyof AllPermissions): boolean => {
      if (!enabledModules) return true
      return enabledModules.has(module)
    },
    [enabledModules]
  )

  const can = React.useCallback(
    (module: keyof AllPermissions, action: PermissionAction): boolean => {
      if (!isModuleEnabled(module)) return false
      const modulePerms = roleInfo.permissions[module]
      if (!modulePerms) return false
      return modulePerms[action] ?? false
    },
    [isModuleEnabled, roleInfo.permissions]
  )

  const roleContextValue = React.useMemo(
    () => ({
      // Legacy properties (backwards compatibility)
      role: roleInfo.roleName as UserRole,
      canViewFinancials: can('invoices', 'view') || can('payments', 'view') || can('expenses', 'view'),
      canManageAppointments: can('appointments', 'create') || can('appointments', 'edit'),
      canAssignStaff: can('staff', 'edit'),
      
      // New permission-based properties
      roleId: roleInfo.roleId,
      roleName: roleInfo.roleName,
      roleDisplayName: roleInfo.roleDisplayName,
      isSystemRole: roleInfo.isSystemRole,
      permissions: roleInfo.permissions,
      can,
      isLoading
    }),
    [roleInfo, can, isLoading]
  )

  const showCta = roleContextValue.canManageAppointments

  const handleOpenCreateAppointment = React.useCallback(() => {
    if (pathname === '/agenda') {
      window.dispatchEvent(new CustomEvent('agenda:open-create-appointment'))
      return
    }
    router.push('/agenda?openCreate=1')
  }, [pathname, router])

  const handleOpenCreatePatient = React.useCallback(() => {
    router.push('/pacientes?openCreate=1')
  }, [router])

  const menuItems = React.useMemo(
    () =>
      ctaMenuItems ?? [
        {
          id: 'nueva-cita',
          label: 'Nueva cita',
          onClick: handleOpenCreateAppointment
        },
        {
          id: 'nuevo-paciente',
          label: 'Nuevo paciente',
          onClick: handleOpenCreatePatient
        }
      ],
    [ctaMenuItems, handleOpenCreateAppointment, handleOpenCreatePatient]
  )

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem('klinikos.sidebar.collapsed')
      if (stored === '1') setSidebarCollapsed(true)
      if (stored === '0') setSidebarCollapsed(false)
    } catch {
      // Ignore storage access errors.
    } finally {
      setIsSidebarHydrated(true)
    }
  }, [])

  const handleToggleSidebarCollapsed = React.useCallback((next: boolean) => {
    setSidebarCollapsed(next)
    try {
      window.localStorage.setItem('klinikos.sidebar.collapsed', next ? '1' : '0')
    } catch {
      // Ignore storage access errors.
    }
  }, [])

  const itemsTop = React.useMemo(() => {
    return baseItemsTop.filter((item) => {
      if (item.id === 'agenda') return can('appointments', 'view')
      if (item.id === 'caja') return can('payments', 'view') || can('invoices', 'view')
      if (item.id === 'pacientes') return can('patients', 'view')
      return true
    })
  }, [baseItemsTop, can])

  const itemsBottom = React.useMemo(() => {
    return baseItemsBottom.filter((item) => {
      if (item.id === 'gestion') return can('reports', 'view')
      if (item.id === 'agente-voz') {
        return can('calls', 'view')
      }
      if (item.id === 'configuracion') return can('settings', 'view')
      return true
    })
  }, [baseItemsBottom, can])

  return (
    <div className='bg-[var(--color-brand-0)] h-dvh overflow-hidden'>
      <RoleContext.Provider value={roleContextValue}>
        <TopBar
          userName={displayName}
          userAvatarUrl={avatarUrl}
          onAccountClick={() => setAccountOpen(true)}
        />
        <div className='flex'>
          <Sidebar
            itemsTop={itemsTop}
            itemsBottom={itemsBottom}
            cta={showCta ? { label: 'Añadir' } : undefined}
            ctaMenuItems={menuItems}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={handleToggleSidebarCollapsed}
            isHydrated={isSidebarHydrated}
          />
          <main className='relative z-0 isolate bg-white rounded-tl-[var(--radius-xl)] flex-1 min-w-0 h-[calc(100dvh-var(--spacing-topbar))] min-h-0 overflow-hidden'>
            {children}
          </main>
        </div>
        <AccountPanel
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          user={user}
          staff={staffProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      </RoleContext.Provider>
    </div>
  )
}

