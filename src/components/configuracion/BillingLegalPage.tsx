'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import configNavItems from './configNavItems'

type FieldProps = {
  label: string
  helper?: string
  value?: string
  widthClass?: string
}

type TabProps = {
  label: string
  active?: boolean
}

function Tab({ label, active = false }: TabProps) {
  return (
    <div
      className={[
        'pb-[min(0.5rem,1vw)] border-b-2 transition-colors whitespace-nowrap',
        active ? 'border-[var(--color-brand-500)]' : 'border-transparent'
      ].join(' ')}
    >
      <p
        className={[
          'text-title-sm font-medium',
          active ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-neutral-600)]'
        ].join(' ')}
      >
        {label}
      </p>
    </div>
  )
}

function Field({ label, helper, value = 'Value', widthClass }: FieldProps) {
  return (
    <div className={['flex flex-col gap-[min(0.5rem,1vw)]', widthClass ?? 'w-full'].join(' ')}>
      <p className='text-body-sm text-[var(--color-neutral-900)]'>{label}</p>
      <div className='flex flex-col gap-[min(0.25rem,0.5vw)] w-full'>
        <div className='flex items-center justify-between h-[min(3rem,5vh)] w-full rounded-lg border border-neutral-300 bg-[var(--color-surface)] px-[min(0.625rem,1vw)] py-[min(0.5rem,1vw)]'>
          <span className='text-body-md text-[var(--color-neutral-900)]'>{value}</span>
          <span
            aria-hidden
            className='inline-flex items-center justify-center text-label-sm font-medium text-neutral-300'
          >
            *
          </span>
        </div>
        {helper ? (
          <p className='text-label-sm font-medium text-[var(--color-neutral-600)]'>{helper}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function BillingLegalPage() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className='bg-[var(--color-page-bg)] h-[calc(100dvh-var(--spacing-topbar))] overflow-hidden'>
      <div className='w-full h-full flex flex-col px-[min(3rem,4vw)] py-[min(2.5rem,3vw)]'>
        {/* Page Header */}
        <header className='flex-none mb-[min(2.5rem,3vw)]'>
          <h1 className='text-title-lg text-[var(--color-neutral-900)]'>Configuración</h1>
        </header>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden min-h-0'>
          {/* Left Navigation Rail */}
          <aside className='w-full lg:w-[min(19rem,25vw)] flex-none border-b lg:border-b-0 lg:border-r border-neutral-100 bg-[var(--color-surface)]'>
            <nav className='flex lg:flex-col overflow-x-auto lg:overflow-x-visible divide-x lg:divide-x-0 lg:divide-y divide-neutral-100'>
              {configNavItems.map((item, idx) => {
                const isActive = item.href
                  ? pathname === item.href
                  : idx === 0 && pathname === '/configuracion'
                return (
                  <button
                    key={item.label}
                    type='button'
                    onClick={() => {
                      if (item.href) router.push(item.href)
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'text-left w-full min-w-max lg:min-w-0 px-[min(1.5rem,2vw)] py-[min(1.25rem,1.5vw)] flex flex-col gap-[min(0.25rem,0.5vw)]',
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
            {/* Section Header */}
            <div className='flex-none px-[min(2rem,3vw)] py-[min(1rem,2vw)] lg:py-0 lg:pt-0'>
              <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
                Facturación y textos legales
              </p>
            </div>

            {/* Content Card */}
            <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vw)] mb-[min(2rem,3vw)] min-h-0'>
              <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-auto'>
                {/* Tabs */}
                <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-[min(2.5rem,4vw)] pt-[min(1.5rem,2vw)] pb-[min(0.5rem,1vw)]'>
                  <div className='flex gap-[min(1.5rem,2vw)] items-center overflow-x-auto'>
                    <Tab label='Datos de facturación' active />
                    <Tab label='Textos legales' />
                  </div>
                </div>

                {/* Content */}
                <div className='px-[min(2.5rem,4vw)] py-[min(1.5rem,2vw)]'>
                  <div className='max-w-4xl flex flex-col gap-[min(2.5rem,4vw)]'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[min(1rem,1.5vw)]'>
                      <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                        Datos de facturación
                      </p>
                      <button
                        type='button'
                        className='inline-flex items-center justify-center h-[min(2rem,3vh)] rounded-2xl border border-[var(--color-brand-500)] bg-[var(--color-page-bg)] px-[min(0.75rem,1vw)] py-[min(0.25rem,0.5vw)] self-start sm:self-auto hover:bg-[var(--color-brand-50)] transition-colors'
                        aria-label='Editar datos de facturación'
                      >
                        <span className='text-body-sm text-[var(--color-brand-900)]'>Editar</span>
                      </button>
                    </div>

                    <div className='flex flex-col gap-[min(1.5rem,2vw)]'>
                      <Field label='Nombre fiscal' value='Clínica Morales' />
                      <Field label='CIF/NIF' />
                      <Field label='Email de facturación' />
                    </div>

                    <section className='flex flex-col gap-[min(1rem,1.5vw)]'>
                      <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>Dirección</p>
                      <div className='flex flex-col gap-[min(1.5rem,2vw)]'>
                        <Field label='Dirección completa' />
                        <div className='flex flex-wrap gap-[min(1.5rem,2vw)]'>
                          <Field label='Código Postal' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                          <Field label='Ciudad' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                        </div>
                        <div className='flex flex-wrap gap-[min(1.5rem,2vw)]'>
                          <Field label='Provincia' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                          <Field label='País' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                        </div>
                      </div>
                    </section>

                    <section className='flex flex-col gap-[min(1rem,1.5vw)] pb-[min(1.5rem,2vw)]'>
                      <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                        Información bancaria
                      </p>
                      <Field label='Cuenta bancaria / IBAN' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

