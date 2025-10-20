'use client'

import React from 'react'
import AddRounded from '@mui/icons-material/AddRounded'

export interface CTANavProps {
  label: string
  onClick?: () => void
  menuItems?: { id: string; label: string; onClick?: () => void }[]
}

export default function CTANav({ label, onClick, menuItems }: CTANavProps) {
  const hasMenu = Boolean(menuItems && menuItems.length)

  return (
    <div className='relative group' tabIndex={-1}>
      <button
        type='button'
        onClick={onClick}
        className='bg-[var(--color-neutral-50)] rounded-[var(--radius-xl)] shadow-[var(--shadow-cta)] px-4 h-[var(--spacing-cta)] inline-flex items-center gap-[var(--spacing-gapsm)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-200)] focus:bg-[var(--color-brand-200)] active:bg-[var(--color-brand-900)] active:text-[var(--color-neutral-50)] transition-colors duration-150 ease-out'
        aria-label={label}
        aria-haspopup={hasMenu ? 'menu' : undefined}
        aria-expanded={undefined}
      >
        <AddRounded className='size-5' aria-hidden='true' />
        <span className='font-inter text-title-md'>{label}</span>
      </button>

      {hasMenu && (
        <div
          role='menu'
          className='absolute left-0 top-full w-48 rounded-lg bg-[var(--color-neutral-50)] shadow-[var(--shadow-cta)] z-10 py-2 inline-flex flex-col justify-center items-start opacity-0 pointer-events-none translate-y-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0'
        >
          {menuItems!.map((mi) => (
            <button
              key={mi.id}
              type='button'
              role='menuitem'
              onClick={() => {
                mi.onClick?.()
              }}
              className='self-stretch px-3 py-2 bg-[var(--color-neutral-50)] inline-flex justify-start items-center gap-2 rounded-[8px] text-left hover:bg-[var(--color-brand-200)]'
            >
              <span className='text-[var(--color-neutral-900)] text-body-md font-normal'>
                {mi.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
