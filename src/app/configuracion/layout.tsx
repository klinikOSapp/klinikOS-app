'use client'

import ClientLayout from '@/app/client-layout'
import configNavItems from '@/components/configuracion/configNavItems'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

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
        <div className='w-full h-full flex flex-col px-[min(3rem,3vw)] pt-[min(2.125rem,3vh)] pb-[min(2rem,3vh)]'>
          {/* Page Header */}
          <header className='flex-none mb-[min(2.125rem,3vh)]'>
            <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
              Configuración
            </h1>
          </header>

          {/* Main Content Area */}
          <div className='flex-1 flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden min-h-0'>
            {/* Left Navigation Rail */}
            <aside className='w-full lg:w-[min(16rem,20vw)] flex-none border-b lg:border-b-0 lg:border-r border-neutral-100 bg-[var(--color-surface)] rounded-l-lg overflow-y-auto'>
              <nav
                className='flex lg:flex-col overflow-x-auto lg:overflow-x-visible'
                role='navigation'
                aria-label='Configuración'
              >
                {configNavItems.map((item, idx) => {
                  const isActive = item.href
                    ? pathname === item.href
                    : idx === 0 && pathname === '/configuracion'
                  const isDisabled = !item.href
                  return (
                    <button
                      key={item.label}
                      type='button'
                      onClick={() => {
                        if (item.href) router.push(item.href)
                      }}
                      disabled={isDisabled}
                      aria-current={isActive ? 'page' : undefined}
                      aria-disabled={isDisabled}
                      className={[
                        'text-left w-full min-w-max lg:min-w-0 px-[min(1.5rem,2vw)] py-[min(1.25rem,2vh)] flex flex-col gap-1',
                        'text-title-sm whitespace-nowrap lg:whitespace-normal',
                        isDisabled
                          ? 'text-[var(--color-neutral-400)] font-normal cursor-not-allowed opacity-60'
                          : isActive
                          ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-900)] font-medium'
                          : 'text-[var(--color-neutral-800)] font-normal hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-900)] transition-colors cursor-pointer'
                      ].join(' ')}
                    >
                      <span className='flex items-center gap-2'>
                        {item.label}
                        {isDisabled && (
                          <span className='text-label-sm bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)] px-1.5 py-0.5 rounded-full'>
                            Próximamente
                          </span>
                        )}
                      </span>
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
