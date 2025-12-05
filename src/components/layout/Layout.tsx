'use client'

import { AllPermissions, PermissionAction, RoleContext, UserRole } from '@/context/role-context'
import { getSignedUrl } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { LayoutProps } from '@/types/layout'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import SellRounded from '@mui/icons-material/SellRounded'
import type { User } from '@supabase/supabase-js'
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
  permissions: AllPermissions
}

export default function Layout({ children }: LayoutProps) {
  const itemsTop = [
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/agenda',
      icon: <CalendarMonthRounded />
    },
    { id: 'caja', label: 'Caja', href: '/caja', icon: <SellRounded /> },
    {
      id: 'pacientes',
      label: 'Pacientes',
      href: '/pacientes',
      icon: <BadgeRounded />
    }
  ]

  const itemsBottom = [
    {
      id: 'gestion',
      label: 'Gestión',
      href: '/gestion',
      icon: <BarChartRounded />
    }
  ]

  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [user, setUser] = React.useState<User | null>(null)
  const [staffProfile, setStaffProfile] = React.useState<StaffProfile | null>(null)
  const [displayName, setDisplayName] = React.useState('Usuario')
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined)
  const [accountOpen, setAccountOpen] = React.useState(false)
  const [isManager, setIsManager] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  
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
    
    async function fetchRoleInfo(clinicId: string) {
      try {
        // Use new get_my_role_info RPC
        const { data, error } = await supabase
          .rpc('get_my_role_info', { p_clinic_id: clinicId })
          .single<RoleInfoResponse>()

        if (!active) return
        
        if (error) {
          console.error('Error fetching role info:', error)
          // Fallback to old method
          const { data: legacyRole } = await supabase.rpc('get_my_role_in_clinic', {
            p_clinic_id: clinicId
          })
          if (legacyRole) {
            setRoleInfo({
              roleId: null,
              roleName: legacyRole as string,
              roleDisplayName: legacyRole as string,
              isSystemRole: true,
              permissions: getFallbackPermissions(legacyRole as UserRole)
            })
            setIsManager(legacyRole === 'gerencia')
          }
          return
        }

        if (data) {
          setRoleInfo({
            roleId: data.role_id,
            roleName: data.role_name,
            roleDisplayName: data.role_display_name,
            isSystemRole: data.is_system_role,
            permissions: data.permissions || {}
          })
          setIsManager(data.role_name === 'gerencia')
        }
      } catch (error) {
        console.error('Error in fetchRoleInfo:', error)
      }
    }
    
    async function determineRoleAccess() {
      try {
        const { data: clinics, error } = await supabase.rpc('get_my_clinics')
        if (!active) return
        if (error || !Array.isArray(clinics) || clinics.length === 0) {
          setIsManager(false)
          setRoleInfo({
            roleId: null,
            roleName: null,
            roleDisplayName: null,
            isSystemRole: false,
            permissions: {}
          })
          return
        }
        
        // Get role info for first clinic
        const firstClinicId = clinics[0] as string
        if (firstClinicId) {
          await fetchRoleInfo(firstClinicId)
        }
      } catch (error) {
        if (active) {
          console.error('Error determining role access', error)
          setIsManager(false)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

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
        setIsManager(false)
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
      await determineRoleAccess()
    }
    void loadProfile()
    return () => {
      active = false
    }
  }, [supabase])

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

  // Helper function to check permissions
  const can = React.useCallback(
    (module: keyof AllPermissions, action: PermissionAction): boolean => {
      const modulePerms = roleInfo.permissions[module]
      if (!modulePerms) return false
      return modulePerms[action] ?? false
    },
    [roleInfo.permissions]
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
          />
          <main className='bg-white rounded-tl-[var(--radius-xl)] w-full h-[calc(100dvh-var(--spacing-topbar))] min-h-0 overflow-hidden'>
            {children}
          </main>
        </div>
        <AccountPanel
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          user={user}
          staff={staffProfile}
          canManage={isManager}
          onProfileUpdated={handleProfileUpdated}
        />
      </RoleContext.Provider>
    </div>
  )
}

// Fallback permissions for legacy roles (used when get_my_role_info fails)
function getFallbackPermissions(role: UserRole): AllPermissions {
  switch (role) {
    case 'gerencia':
      return {
        patients: { view: true, create: true, edit: true, delete: true },
        appointments: { view: true, create: true, edit: true, delete: true },
        clinical_notes: { view: true, create: true, edit: true, delete: true },
        invoices: { view: true, create: true, edit: true, delete: true },
        payments: { view: true, create: true, edit: true, delete: true },
        staff: { view: true, create: true, edit: true, delete: true },
        settings: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: false, edit: false, delete: false },
        expenses: { view: true, create: true, edit: true, delete: true },
        calls: { view: true, create: true, edit: true, delete: true },
        leads: { view: true, create: true, edit: true, delete: true }
      }
    case 'recepcion':
      return {
        patients: { view: true, create: true, edit: true, delete: false },
        appointments: { view: true, create: true, edit: true, delete: true },
        clinical_notes: { view: true, create: false, edit: false, delete: false },
        invoices: { view: true, create: true, edit: true, delete: false },
        payments: { view: true, create: true, edit: false, delete: false },
        staff: { view: true, create: false, edit: false, delete: false },
        reports: { view: true, create: false, edit: false, delete: false },
        calls: { view: true, create: true, edit: true, delete: false },
        leads: { view: true, create: true, edit: true, delete: false }
      }
    case 'doctor':
    case 'higienista':
      return {
        patients: { view: true, create: false, edit: true, delete: false, custom: { medical_only: true } },
        appointments: { view: true, create: false, edit: false, delete: false },
        clinical_notes: { view: true, create: true, edit: true, delete: false },
        staff: { view: true, create: false, edit: false, delete: false },
        reports: { view: true, create: false, edit: false, delete: false }
      }
    default:
      return {}
  }
}
