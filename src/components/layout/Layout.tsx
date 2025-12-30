'use client'

import React, { useState } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import {
  BadgeRounded,
  BarChartRounded,
  ArticleRounded,
  CalendarMonthRounded,
  SellRounded,
  SettingsRounded
} from '@/components/icons/md3'
import { LayoutProps } from '@/types/layout'

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  const itemsTop = [
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/agenda',
      icon: <CalendarMonthRounded />
    },
    {
      id: 'parte-diario',
      label: 'Parte Diario',
      href: '/parte-diario',
      icon: <ArticleRounded />
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
          collapsed={collapsed}
          onToggleCollapsed={setCollapsed}
        />
        <main className='bg-white rounded-tl-[var(--radius-xl)] w-full h-[calc(100dvh-var(--spacing-topbar))] min-h-0 overflow-hidden'>
          {children}
        </main>
      </div>
    </div>
  )
}
