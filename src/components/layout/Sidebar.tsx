'use client'

import { ChevronLeftRounded, ChevronRightRounded } from '@/components/icons/md3'
import { SidebarProps } from '@/types/layout'
import { usePathname } from 'next/navigation'
import ClinicCard from './ClinicCard'
import CTANav from './CTANav'
import NavElement from './NavElement'

export default function Sidebar({
  itemsTop,
  itemsBottom,
  cta,
  ctaMenuItems,
  collapsed = false,
  onToggleCollapsed,
  isHydrated = true
}: SidebarProps) {
  const widthClass = collapsed
    ? 'w-[min(var(--spacing-sidebar-collapsed),95vw)]'
    : 'w-[min(var(--spacing-sidebar),95vw)]'

  const pathname = usePathname()

  const menuItems =
    ctaMenuItems ??
    [
      { id: 'nueva-cita', label: 'Nueva cita' },
      { id: 'nuevo-presupuesto', label: 'Nuevo presupuesto' },
      { id: 'nuevo-paciente', label: 'Nuevo paciente' }
    ]

  return (
    <aside
      className={[
        'bg-[var(--color-brand-0)]',
        widthClass,
        'h-[calc(100dvh-var(--spacing-topbar))]',
        'pt-6',
        'relative',
        'z-30',
        'flex flex-col',
        isHydrated ? 'transition-[width] duration-300 ease-in-out opacity-100' : 'opacity-0'
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
              menuItems={menuItems}
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

      <div className='px-6 flex-1 overflow-y-auto'>
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
            {itemsTop.map((it) => {
              const childActive = it.children?.some((child) => pathname === child.href) ?? false
              const sectionActive = pathname === it.href

              return (
                <div key={it.id} className='group/navitem relative'>
                  <NavElement
                    href={it.href}
                    label={it.label}
                    icon={it.icon}
                    collapsed={collapsed}
                    isActiveOverride={sectionActive}
                  />
                  {it.children && it.children.length > 0 && (
                    <>
                      {/* Submenú expandido (sidebar abierto) */}
                      {!collapsed && (
                        <div
                          className={[
                            'grid gap-0 overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out',
                            childActive
                              ? 'max-h-24 opacity-100 translate-y-0'
                              : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none group-hover/navitem:max-h-24 group-hover/navitem:opacity-100 group-hover/navitem:translate-y-0 group-hover/navitem:pointer-events-auto group-focus-within/navitem:max-h-24 group-focus-within/navitem:opacity-100 group-focus-within/navitem:translate-y-0 group-focus-within/navitem:pointer-events-auto'
                          ].join(' ')}
                        >
                          {it.children.map((child) => (
                            <NavElement
                              key={child.id}
                              href={child.href}
                              label={child.label}
                              icon={child.icon}
                              collapsed={collapsed}
                              isChild
                              isActiveOverride={pathname === child.href}
                            />
                          ))}
                        </div>
                      )}
                      {/* Popover (sidebar colapsado) */}
                      {collapsed && (
                        <div
                          className='absolute left-full top-0 ml-2 min-w-[10rem] bg-white rounded-xl shadow-lg border border-[var(--color-brand-100)] py-2 opacity-0 invisible translate-x-[-0.5rem] transition-all duration-200 ease-out group-hover/navitem:opacity-100 group-hover/navitem:visible group-hover/navitem:translate-x-0 group-focus-within/navitem:opacity-100 group-focus-within/navitem:visible group-focus-within/navitem:translate-x-0 z-50'
                        >
                          {it.children.map((child) => (
                            <NavElement
                              key={child.id}
                              href={child.href}
                              label={child.label}
                              icon={child.icon}
                              collapsed={false}
                              isChild
                              isActiveOverride={pathname === child.href}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
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
              {itemsBottom.map((it) => {
                // Check if current path starts with item href (for nested routes like /configuracion/facturacion)
                const isActive = pathname === it.href || pathname.startsWith(`${it.href}/`)
                return (
                  <NavElement
                    key={it.id}
                    href={it.href}
                    label={it.label}
                    icon={it.icon}
                    collapsed={collapsed}
                    isActiveOverride={isActive}
                  />
                )
              })}
            </nav>
          </div>
        )}
      </div>
      <ClinicCard collapsed={collapsed} />
    </aside>
  )
}
