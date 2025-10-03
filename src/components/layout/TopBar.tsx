'use client'

import React from 'react'
import Image from 'next/image'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import { TopBarProps } from '@/types/layout'

export default function TopBar({ userName, userAvatarUrl }: TopBarProps) {
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
        <div className='size-8 rounded-xl overflow-hidden bg-white'>
          {userAvatarUrl ? (
            <Image
              src={userAvatarUrl}
              alt='User avatar'
              width={32}
              height={32}
            />
          ) : null}
        </div>
        <span className='text-title-md font-inter text-neutral-900'>
          {userName}
        </span>
        <button
          type='button'
          className='size-8 grid place-items-center text-neutral-900'
          aria-label='Settings'
        >
          <SettingsRounded className='size-6' />
        </button>
      </div>
    </header>
  )
}
