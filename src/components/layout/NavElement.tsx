'use client'

import React from 'react'
import { NavState } from '@/types/layout'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavElementProps {
  href: string
  label: string
  icon?: React.ReactNode
}

export function NavElement({ href, label, icon }: NavElementProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex items-center gap-[var(--spacing-gapmd)] h-[var(--spacing-nav-item)] w-full px-6',
        isActive
          ? 'bg-[var(--color-brand-900)] text-[var(--color-neutral-50)] shadow-[inset_4px_0_0_0_#a8efe7]'
          : 'text-[var(--color-brand-900)]',
        'transition-colors duration-200 ease-out',
        !isActive &&
          'hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-900)]'
      ].join(' ')}
    >
      <span className='size-6 shrink-0 flex items-center justify-center'>
        {icon}
      </span>
      <span className='font-inter text-title-md font-medium'>
        {label}
      </span>
    </Link>
  )
}

export default NavElement
