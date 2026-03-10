'use client'

import AlertsDropdown from '@/components/alerts/AlertsDropdown'
import { NotificationsActiveRounded, SettingsRounded } from '@/components/icons/md3'
import { useAlerts } from '@/context/AlertsContext'
import { TopBarProps } from '@/types/layout'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

function initialsFromName(name?: string) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export default function TopBar({
  userName,
  userAvatarUrl,
  onAccountClick,
  onSettingsClick
}: TopBarProps) {
  const initials = useMemo(() => initialsFromName(userName), [userName])
  const { pendingCount } = useAlerts()
  const router = useRouter()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const alertsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!alertsOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current?.contains(event.target as Node)) return
      setAlertsOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAlertsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [alertsOpen])

  return (
    <header className='bg-[var(--color-brand-0)] h-[var(--spacing-topbar)] w-full flex items-center justify-between px-6'>
      <div className='flex items-center gap-4'>
        <Image src='/logo.svg' alt='Logo' width={32} height={32} priority />
        <Image
          src='/logo-expanded.svg'
          alt='Logo expanded'
          width={96}
          height={20}
          priority
        />
      </div>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={onAccountClick}
          className='flex items-center gap-3 rounded-xl px-2 py-1 text-neutral-900 transition hover:bg-white/60 focus-visible:outline focus-visible:outline-brand-200'
        >
          <span className='size-8 rounded-xl overflow-hidden bg-white flex items-center justify-center text-title-sm text-neutral-600'>
            {userAvatarUrl ? (
              <Image src={userAvatarUrl} alt='User avatar' width={32} height={32} />
            ) : (
              initials
            )}
          </span>
          <span className='text-title-md font-inter text-neutral-900'>
            {userName}
          </span>
        </button>
        <div className='relative' ref={alertsRef}>
          <button
            type='button'
            className='relative size-9 grid place-items-center rounded-xl text-neutral-900 transition hover:bg-white/60'
            aria-label='Abrir central de alertas'
            onClick={() => setAlertsOpen((prev) => !prev)}
          >
            <NotificationsActiveRounded />
            {pendingCount > 0 && (
              <span className='absolute -right-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-[var(--color-error-500)] px-1 text-[0.625rem] font-semibold leading-5 text-white'>
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <AlertsDropdown
              onOpenPatient={(patientId) => {
                setAlertsOpen(false)
                router.push(`/pacientes?patientId=${patientId}`)
              }}
            />
          )}
        </div>
        <button
          type='button'
          className='size-8 grid place-items-center text-neutral-900 hover:text-neutral-700'
          aria-label='Configuración de cuenta'
          onClick={onSettingsClick}
        >
          <SettingsRounded className='size-6' />
        </button>
      </div>
    </header>
  )
}
