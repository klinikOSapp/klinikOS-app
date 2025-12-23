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
        'pb-[0.5rem] border-b',
        active ? 'border-brand-500' : 'border-transparent'
      ].join(' ')}
    >
      <p
        className={[
          'font-inter text-[1.125rem] leading-[1.75rem] font-medium',
          active ? 'text-neutral-900' : 'text-neutral-600'
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
      <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>{label}</p>
      <div className='flex flex-col gap-[min(0.25rem,0.75vw)] w-full'>
        <div className='flex items-center justify-between h-[3rem] w-full rounded-[0.5rem] border border-neutral-300 bg-[var(--color-surface)] px-[0.625rem] py-[0.5rem]'>
          <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900'>{value}</span>
          <span
            aria-hidden
            className='inline-flex items-center justify-center text-[0.75rem] leading-[0.875rem] font-medium text-neutral-300'
          >
            *
          </span>
        </div>
        {helper ? (
          <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>{helper}</p>
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
      <div
        className='ml-[3rem] w-full max-w-none'
        style={{
          width: 'min(98rem, calc(100vw - 3rem))',
          height: 'calc(100vh - var(--spacing-topbar))',
          paddingTop: '2.5rem',
          paddingBottom: '2.5rem'
        }}
      >
        <header className='flex flex-col gap-[min(0.5rem,1vw)] w-[min(49.625rem,80vw)]'>
          <h1 className='font-inter text-[1.75rem] leading-[2.25rem] text-neutral-900'>Configuración</h1>
        </header>

        <div
          className='mt-[2.5rem] rounded-[0.5rem] overflow-hidden bg-[var(--color-page-bg)] flex items-start'
          style={{
            width: 'min(98rem, calc(100vw - 3rem))',
            height: 'calc(100vh - var(--spacing-topbar) - 2.5rem)'
          }}
        >
          {/* Left rail */}
          <aside
            className='w-[19rem] h-auto flex-none self-start border-r border-neutral-100 bg-[var(--color-surface)]'
            style={{ height: 'auto' }}
          >
            <nav className='flex flex-col divide-y divide-neutral-100'>
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
                      'text-left w-full px-[1.5rem] py-[1.25rem] flex flex-col gap-[0.25rem]',
                      'font-inter text-[1.125rem] leading-[1.75rem]',
                      isActive
                        ? 'bg-[var(--color-brand-50)] text-brand-900 font-medium'
                        : 'text-neutral-800 font-normal hover:bg-[var(--color-brand-50)] hover:text-brand-900 transition-colors'
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Right content */}
          <section className='relative w-[79rem] flex-none bg-[var(--color-page-bg)]' style={{ height: '100%' }}>
            <div className='absolute left-[2rem] right-0 top-0 bottom-0 overflow-auto pr-[2rem]'>
              <header className='mb-[1.5rem] pt-[0.5rem]'>
                <h2 className='font-inter text-[1.75rem] leading-[2.25rem] text-neutral-900'>
                  Facturación y textos legales
                </h2>
              </header>

              <section
                className='relative bg-white border border-neutral-200 rounded-[0.5rem] shadow-[0_1px_2px_rgba(36,40,44,0.04)]'
                style={{
                  width: 'min(77rem, calc(100vw - 7rem))',
                  minHeight: 'min(65.75rem, calc(100vh - 9rem))'
                }}
              >
                {/* Tabs */}
                <div className='absolute left-[2.4375rem] top-[1.9375rem] flex items-center gap-[1.5rem]'>
                  <Tab label='Datos de facturación' active />
                  <Tab label='Textos legales' />
                </div>

                {/* Content */}
                <div className='pt-[5.9375rem] pb-[2.5rem] px-[2.4375rem]'>
                  <div className='w-[49rem] flex flex-col gap-[2.5rem]'>
                    <div className='flex items-center justify-between w-full'>
                      <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                        Datos de facturación
                      </p>
                      <button
                        type='button'
                        className='inline-flex items-center justify-center h-[2rem] rounded-[1rem] border border-brand-500 bg-[var(--color-page-bg)] px-[0.625rem] py-[0.25rem]'
                        aria-label='Editar datos de facturación'
                      >
                        <span className='font-inter text-[0.875rem] leading-[1.25rem] text-brand-900'>Editar</span>
                      </button>
                    </div>

                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Nombre fiscal' value='Clínica Morales' />
                      <Field label='CIF/NIF' />
                      <Field label='Email de facturación' />
                    </div>

                    <section className='flex flex-col gap-[1rem]'>
                      <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>Dirección</p>
                      <div className='flex flex-col gap-[1.5rem]'>
                        <Field label='Dirección completa' />
                        <div className='flex flex-wrap gap-[1.5rem]'>
                          <Field label='Código Postal' widthClass='w-[23.75rem]' />
                          <Field label='Ciudad' widthClass='w-[23.75rem]' />
                        </div>
                        <div className='flex flex-wrap gap-[1.5rem]'>
                          <Field label='Provincia' widthClass='w-[23.75rem]' />
                          <Field label='País' widthClass='w-[23.75rem]' />
                        </div>
                      </div>
                    </section>

                    <section className='flex flex-col gap-[1rem] pb-[1.5rem]'>
                      <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                        Información bancaria
                      </p>
                      <Field label='Cuenta bancaria / IBAN' widthClass='w-[23.75rem]' />
                    </section>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

