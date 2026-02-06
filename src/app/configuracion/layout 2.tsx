'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ClientLayout from '@/app/client-layout'
import configNavItems from '@/components/configuracion/configNavItems'

export default function ConfiguracionLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <ClientLayout>
      <div className='bg-[var(--color-page-bg)] h-[calc(100dvh-var(--spacing-topbar))] overflow-hidden'>
        <div className='w-full h-full flex flex-col pl-12 pr-12 pt-[2.125rem] pb-[4.25rem]'>
          {/* Page Header */}
          <header className='flex-none mb-[2.125rem]'>
            <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
              Configuración
            </h1>
          </header>

          {/* Main Content Area */}
          <div className='flex-1 flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden min-h-0'>
            {/* Left Navigation Rail */}
            <aside className='w-full lg:w-[min(19rem,25vw)] h-[35rem] flex-none border-b lg:border-b-0 lg:border-r border-neutral-100 bg-[var(--color-surface)] rounded-l-lg'>
              <nav className='flex lg:flex-col overflow-x-auto lg:overflow-x-visible'>
                {configNavItems.map((item, idx) => {
                  const isActive = item.href ? pathname === item.href : idx === 0 && pathname === '/configuracion'
                  return (
                    <button
                      key={item.label}
                      type='button'
                      onClick={() => {
                        if (item.href) router.push(item.href)
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'text-left w-full min-w-max lg:min-w-0 px-6 py-5 flex flex-col gap-1',
                        'text-title-sm whitespace-nowrap lg:whitespace-normal',
                        isActive
                          ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-900)] font-medium'
                          : 'text-[var(--color-neutral-800)] font-normal hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-900)] transition-colors'
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Right Content */}
            <section className='flex-1 flex flex-col min-w-0 bg-[var(--color-page-bg)] overflow-hidden'>
              {children}
            </section>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
