'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { ChevronLeftRounded, ChevronRightRounded } from '@/components/icons/md3'
import { SidebarProps } from '@/types/layout'
import CTANav from './CTANav'
import NavElement from './NavElement'

export default function Sidebar({
  itemsTop,
  itemsBottom,
  cta,
  collapsed = false,
  onToggleCollapsed
}: SidebarProps) {
  const widthClass = collapsed
    ? 'w-[min(var(--spacing-sidebar-collapsed),95vw)]'
    : 'w-[min(var(--spacing-sidebar),95vw)]'

  return (
    <aside
      className={[
        'bg-[var(--color-brand-0)]',
        widthClass,
        'h-[calc(100dvh-var(--spacing-topbar))]',
        'pt-6',
        'relative',
        'z-10',
        'transition-[width] duration-300 ease-in-out'
      ].join(' ')}
      aria-label='Sidebar navigation'
    >
      <div className='px-6 flex items-center justify-between gap-3'>
        {cta && (
          <div className='h-cta flex items-center'>
            <CTANav
              label={cta.label}
              onClick={cta.onClick}
              collapsed={collapsed}
              menuItems={[
                { id: 'nueva-cita', label: 'Nueva cita' },
                { id: 'nuevo-presupuesto', label: 'Nuevo presupuesto' },
                { id: 'nuevo-paciente', label: 'Nuevo paciente' }
              ]}
            />
          </div>
        )}
        {onToggleCollapsed && (
          <button
            type='button'
            onClick={() => onToggleCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            aria-pressed={collapsed}
            className='size-10 rounded-full border border-[var(--color-brand-200)] bg-[var(--color-neutral-50)] text-[var(--color-brand-900)] flex items-center justify-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.15)] hover:bg-[var(--color-brand-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)] transition-colors duration-150 ease-out'
          >
            {collapsed ? (
              <ChevronRightRounded fontSize='small' />
            ) : (
              <ChevronLeftRounded fontSize='small' />
            )}
          </button>
        )}
      </div>

      <div className='px-6'>
        <div className='mt-8'>
          <p
            className={[
              'text-body-md text-neutral-600 transition-opacity duration-200',
              collapsed ? 'sr-only opacity-0' : 'opacity-100'
            ].join(' ')}
          >
            Administración
          </p>
          <nav className='mt-2 grid gap-0 -mx-6'>
            {itemsTop.map((it) => (
              <NavElement
                key={it.id}
                href={it.href}
                label={it.label}
                icon={it.icon}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>
        {itemsBottom && itemsBottom.length > 0 && (
          <div className='mt-8'>
            <p
              className={[
                'text-body-md text-neutral-600 transition-opacity duration-200',
                collapsed ? 'sr-only opacity-0' : 'opacity-100'
              ].join(' ')}
            >
              Gestión
            </p>
            <nav className='mt-2 grid gap-0 -mx-6'>
              {itemsBottom.map((it) => (
                <NavElement
                  key={it.id}
                  href={it.href}
                  label={it.label}
                  icon={it.icon}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
}
