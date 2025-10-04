'use client'

import React from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import BarChartRounded from '@mui/icons-material/BarChartRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import SellRounded from '@mui/icons-material/SellRounded'
import AnalyticsRounded from '@mui/icons-material/AnalyticsRounded'
import { LayoutProps } from '@/types/layout'

export default function Layout({ children }: LayoutProps) {
  const itemsTop = [
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/',
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
      id: 'informes',
      label: 'Informes',
      href: '/informes',
      icon: <AnalyticsRounded />
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
        <main className='bg-white rounded-tl-[var(--radius-xl)] w-full h-[calc(100dvh-var(--spacing-topbar))] overflow-hidden'>
          {children}
        </main>
      </div>
    </div>
  )
}
