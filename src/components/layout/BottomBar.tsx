'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChartRounded,
  CalendarMonthRounded,
  DescriptionRounded,
  PeopleRounded
} from '@/components/icons/md3'

const items = [
  {
    id: 'calendar',
    label: 'Calendario',
    href: '/',
    icon: CalendarMonthRounded
  },
  { id: 'finance', label: 'Finanzas', href: '/caja', icon: BarChartRounded },
  {
    id: 'patients',
    label: 'Pacientes',
    href: '/pacientes',
    icon: PeopleRounded
  },
  {
    id: 'charts',
    label: 'Informes',
    href: '/informes',
    icon: DescriptionRounded
  }
]

export function BottomBar() {
  const pathname = usePathname()
  return (
    <nav className='h-bottombar-mobile bg-white border-t border-neutral-200 grid grid-cols-4'>
      {items.map((it) => {
        const Icon = it.icon
        const active = pathname === it.href
        return (
          <Link
            key={it.id}
            href={it.href}
            className='flex flex-col items-center justify-center gap-1'
          >
            <Icon className={active ? 'text-brand-900' : 'text-neutral-600'} />
            <span
              className={[
                'font-inter text-label-sm',
                active ? 'text-brand-900' : 'text-neutral-600'
              ].join(' ')}
            >
              {it.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
