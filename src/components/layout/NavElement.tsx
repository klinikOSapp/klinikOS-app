'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

export interface NavElementProps {
  href: string
  label: string
  icon?: React.ReactNode
  collapsed?: boolean
  isChild?: boolean
  isActiveOverride?: boolean
  hasActiveChild?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export function NavElement({
  href,
  label,
  icon,
  collapsed,
  isChild = false,
  isActiveOverride,
  hasActiveChild = false,
  onClick
}: NavElementProps) {
  const pathname = usePathname()
  const isActive = isActiveOverride ?? pathname === href
  const isHighlighted = isActive || hasActiveChild

  const horizontalPadding = collapsed
    ? 'justify-center gap-0 px-0'
    : isChild
      ? 'pl-[calc(var(--spacing-plnav)+var(--spacing-gapmd))] pr-[var(--spacing-plnav)]'
      : 'px-[var(--spacing-plnav)]'

  const iconSizeClass = isChild ? 'size-5' : 'size-6'

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'flex items-center h-[var(--spacing-nav-item)] w-full',
        collapsed ? 'gap-0' : 'gap-[var(--spacing-gapmd)]',
        horizontalPadding,
        isActive
          ? 'bg-[var(--color-brand-900)] text-[var(--color-neutral-50)] shadow-[inset_4px_0_0_0_var(--color-brand-200)]'
          : hasActiveChild
            ? 'text-[var(--color-brand-900)] shadow-[inset_4px_0_0_0_var(--color-brand-200)] bg-[var(--color-brand-50)]'
            : isChild
              ? 'text-[var(--color-brand-800)]'
              : 'text-[var(--color-brand-900)]',
        'transition-colors duration-200 ease-out',
        !isHighlighted &&
          'hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-900)]'
      ].join(' ')}
    >
      <span className={[iconSizeClass, 'shrink-0 flex items-center justify-center'].join(' ')}>
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
