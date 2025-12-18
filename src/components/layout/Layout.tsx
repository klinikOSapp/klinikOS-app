'use client'

import React from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import {
  BadgeRounded,
  BarChartRounded,
  CalendarMonthRounded,
  SellRounded,
  SettingsRounded
} from '@/components/icons/md3'
import { LayoutProps } from '@/types/layout'

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
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      href: '/configuracion',
      icon: <SettingsRounded />
    }
  ]

  return (
    <div className='bg-[var(--color-brand-0)] h-dvh overflow-hidden'>
      <TopBar userName='Daniel' />
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
    </div>
  )
}
