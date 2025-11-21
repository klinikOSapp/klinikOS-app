'use client'

import { useUserRole } from '@/context/role-context'
import React from 'react'
import CTANav from './CTANav'
import NavElement from './NavElement'
import { SidebarProps } from '@/types/layout'

export default function Sidebar({
  itemsTop,
  itemsBottom,
  cta,
  collapsed,
  onToggleCollapsed
}: SidebarProps) {
  const { role, canViewFinancials } = useUserRole()
  const widthClass = collapsed
    ? 'w-[var(--spacing-sidebar-collapsed)]'
    : 'w-[var(--spacing-sidebar)]'
  const filteredTop = React.useMemo(
    () =>
      itemsTop.filter((item) => {
        if (item.id === 'caja') {
          return canViewFinancials
        }
        return true
      }),
    [itemsTop, canViewFinancials]
  )
  const filteredBottom = React.useMemo(
    () =>
      itemsBottom?.filter((item) => {
        if (item.id === 'gestion') {
          return role === 'gerencia'
        }
        return true
      }) ?? [],
    [itemsBottom, role]
  )
  return (
    <aside
      className={[
        'bg-[var(--color-brand-0)]',
        widthClass,
        'h-[calc(100dvh-var(--spacing-topbar))]',
        'pt-6',
        'relative'
      ].join(' ')}
      aria-label='Sidebar navigation'
    >
      <div className='px-6'>
        {cta && (
          <div className='h-cta flex items-center'>
            <CTANav
              label={cta.label}
              onClick={cta.onClick}
              menuItems={[
                { id: 'nueva-cita', label: 'Nueva cita' },
                { id: 'nuevo-presupuesto', label: 'Nuevo presupuesto' },
                { id: 'nuevo-paciente', label: 'Nuevo paciente' }
              ]}
            />
          </div>
        )}
        <div className='mt-8'>
          <p className='text-body-md text-neutral-600'>
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Administración'}
          </p>
          <nav className='mt-2 grid gap-0 -mx-6'>
            {filteredTop.map((it) => (
              <NavElement
                key={it.id}
                href={it.href}
                label={it.label}
                icon={it.icon}
              />
            ))}
          </nav>
        </div>
        {filteredBottom.length > 0 && (
          <div className='mt-8'>
            <p className='text-body-md text-neutral-600'>Gestión</p>
            <nav className='mt-2 grid gap-0 -mx-6'>
              {filteredBottom.map((it) => (
                <NavElement
                  key={it.id}
                  href={it.href}
                  label={it.label}
                  icon={it.icon}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
}
