'use client'

import { RoleContext, UserRole } from '@/context/role-context'
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
  contact_info: Record<string, any> | null
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
  const [userRole, setUserRole] = React.useState<UserRole>(null)

  const resolveRolePriority = React.useCallback((current: UserRole, candidate: UserRole) => {
    if (!candidate) return current
    if (!current) return candidate
    const priority = ['gerencia', 'recepcion', 'doctor', 'higienista'] as const
    const currentIdx = priority.indexOf(current as (typeof priority)[number])
    const candidateIdx = priority.indexOf(candidate as (typeof priority)[number])
    if (candidateIdx === -1) return current
    if (currentIdx === -1 || candidateIdx < currentIdx) {
      return candidate
    }
    return current
  }, [])

  React.useEffect(() => {
    let active = true
    async function determineRoleAccess() {
      try {
        const { data: clinics, error } = await supabase.rpc('get_my_clinics')
        if (!active) return
        if (error || !Array.isArray(clinics) || clinics.length === 0) {
          setIsManager(false)
          setUserRole(null)
          return
        }
        let resolvedRole: UserRole = null
        for (const clinicId of clinics as string[]) {
          if (!clinicId) continue
          const { data: role, error: roleError } = await supabase.rpc('get_my_role_in_clinic', {
            p_clinic_id: clinicId
          })
          if (!active) return
          if (roleError || !role) {
            continue
          }
          resolvedRole = resolveRolePriority(resolvedRole, role as UserRole)
          if (resolvedRole === 'gerencia') {
            break
          }
        }
        setIsManager(resolvedRole === 'gerencia')
        setUserRole(resolvedRole)
      } catch (error) {
        if (active) {
          console.error('Error determining manager privileges', error)
          setIsManager(false)
          setUserRole(null)
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
  }, [resolveRolePriority, supabase])

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

  const roleContextValue = React.useMemo(
    () => ({
      role: userRole,
      canViewFinancials: userRole === 'gerencia' || userRole === 'recepcion',
      canManageAppointments: userRole === 'gerencia' || userRole === 'recepcion',
      canAssignStaff: userRole === 'gerencia' || userRole === 'recepcion'
    }),
    [userRole]
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
