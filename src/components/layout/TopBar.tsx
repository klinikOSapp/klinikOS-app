'use client'

import React from 'react'
import Image from 'next/image'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import { TopBarProps } from '@/types/layout'

function initialsFromName(name?: string) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export default function TopBar({ userName, userAvatarUrl, onAccountClick }: TopBarProps) {
  const initials = React.useMemo(() => initialsFromName(userName), [userName])
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
        <button
          type='button'
          className='size-8 grid place-items-center text-neutral-900 hover:text-neutral-700'
          aria-label='Configuración de cuenta'
          onClick={onAccountClick}
        >
          <SettingsRounded className='size-6' />
        </button>
      </div>
    </header>
  )
}
