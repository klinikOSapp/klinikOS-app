'use client'

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
      href: '/',
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

  React.useEffect(() => {
    let active = true
    async function determineManagerAccess() {
      try {
        const { data: clinics, error } = await supabase.rpc('get_my_clinics')
        if (!active) return
        if (error || !Array.isArray(clinics) || clinics.length === 0) {
          setIsManager(false)
          return
        }
        for (const clinicId of clinics as string[]) {
          if (!clinicId) continue
          const { data: role, error: roleError } = await supabase.rpc('get_my_role_in_clinic', {
            p_clinic_id: clinicId
          })
          if (!active) return
          if (roleError) {
            continue
          }
          if (role === 'gerencia') {
            setIsManager(true)
            return
          }
        }
        setIsManager(false)
      } catch (error) {
        if (active) {
          console.error('Error determining manager privileges', error)
          setIsManager(false)
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
      await determineManagerAccess()
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

  return (
    <div className='bg-[var(--color-brand-0)] h-dvh overflow-hidden'>
      <TopBar
        userName={displayName}
        userAvatarUrl={avatarUrl}
        onAccountClick={() => setAccountOpen(true)}
      />
      <div className='flex'>
        <Sidebar
          itemsTop={itemsTop}
          itemsBottom={itemsBottom}
          cta={{ label: 'Añadir' }}
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
    </div>
  )
}
