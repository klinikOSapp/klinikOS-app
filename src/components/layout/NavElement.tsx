'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export interface NavElementProps {
  href: string
  label: string
  icon?: React.ReactNode
  collapsed?: boolean
}

export function NavElement({ href, label, icon, collapsed }: NavElementProps) {
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
          'hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-900)]',
        collapsed ? 'justify-center gap-0 px-0' : ''
      ].join(' ')}
    >
      <span className='size-6 shrink-0 flex items-center justify-center'>
        {icon}
      </span>
      <span
        className={[
          'font-inter text-title-md font-medium transition-opacity duration-200',
          collapsed ? 'sr-only opacity-0' : 'opacity-100'
        ].join(' ')}
      >
        {label}
      </span>
    </Link>
  )
}

export default NavElement
