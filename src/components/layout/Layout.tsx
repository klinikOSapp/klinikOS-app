'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
import AddPatientModal from '@/components/pacientes/modals/add-patient/AddPatientModal'

export default function Layout({ children, ctaMenuItems }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false)
  const [initialPatientName, setInitialPatientName] = useState<string>('')
  const router = useRouter()
  const pathname = usePathname()

  const itemsTop = [
    {
      id: 'agenda',
      label: 'Agenda',
      href: '/agenda',
      icon: <CalendarMonthRounded />,
      children: [
        {
          id: 'parte-diario',
          label: 'Parte Diario',
          href: '/parte-diario',
          icon: <ArticleRounded fontSize='small' />
        }
      ]
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

  const handleOpenCreateAppointment = useCallback(() => {
    const target = '/agenda?openCreate=1'
    if (pathname === '/agenda') {
      window.dispatchEvent(new CustomEvent('agenda:open-create-appointment'))
    } else {
      router.push(target)
    }
  }, [pathname, router])

  const handleOpenCreatePatient = useCallback((name?: string) => {
    setInitialPatientName(name ?? '')
    setIsAddPatientModalOpen(true)
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ name?: string }>
      setInitialPatientName(custom.detail?.name ?? '')
      setIsAddPatientModalOpen(true)
    }
    window.addEventListener('patients:open-add-patient', handler)
    return () => {
      window.removeEventListener('patients:open-add-patient', handler)
    }
  }, [])

  const menuItems = useMemo(
    () =>
      ctaMenuItems ?? [
        { id: 'nueva-cita', label: 'Nueva cita', onClick: handleOpenCreateAppointment },
        { id: 'nuevo-presupuesto', label: 'Nuevo presupuesto' },
        { id: 'nuevo-paciente', label: 'Nuevo paciente', onClick: () => handleOpenCreatePatient() }
      ],
    [ctaMenuItems, handleOpenCreateAppointment, handleOpenCreatePatient]
  )

  return (
    <div className='bg-[var(--color-brand-0)] h-dvh overflow-hidden'>
      <AddPatientModal
        open={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        initialName={initialPatientName}
      />
      <TopBar userName='Daniel' />
      <div className='flex'>
        <Sidebar
          itemsTop={itemsTop}
          itemsBottom={itemsBottom}
          cta={{ label: 'Añadir' }}
          ctaMenuItems={menuItems}
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
