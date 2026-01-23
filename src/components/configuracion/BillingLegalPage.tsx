'use client'

import React from 'react'

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
        'pb-2 border-b-2 transition-colors whitespace-nowrap',
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
    <div className={['flex flex-col gap-2', widthClass ?? 'w-full'].join(' ')}>
      <p className='text-body-sm text-[var(--color-neutral-900)]'>{label}</p>
      <div className='flex flex-col gap-1 w-full'>
        <div className='flex items-center justify-between h-[min(3rem,5vh)] w-full rounded-lg border border-neutral-300 bg-[var(--color-surface)] px-[min(0.625rem,1vw)] py-2'>
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
  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-8 pr-0 h-[2.5rem]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Facturación y textos legales
        </p>
      </div>

      {/* Content Card */}
      <div className='flex-1 ml-8 mr-0 mt-6 mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-auto'>
          {/* Tabs */}
          <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-10 pt-6 pb-2 min-h-[4rem]'>
            <div className='flex gap-6 items-center overflow-x-auto'>
              <Tab label='Datos de facturación' active />
              <Tab label='Textos legales' />
            </div>
          </div>

          {/* Content */}
          <div className='px-12 py-6'>
            <div className='max-w-4xl flex flex-col gap-10'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                  Datos de facturación
                </p>
                <button
                  type='button'
                  className='inline-flex items-center justify-center h-[min(2rem,3vh)] rounded-2xl border border-[var(--color-brand-500)] bg-[var(--color-page-bg)] px-[min(0.625rem,1vw)] py-1 self-start sm:self-auto hover:bg-[var(--color-brand-50)] transition-colors'
                  aria-label='Editar datos de facturación'
                >
                  <span className='text-body-sm text-[var(--color-brand-900)]'>Editar</span>
                </button>
              </div>

              <div className='flex flex-col gap-6'>
                <Field label='Nombre fiscal' value='Clínica Morales' />
                <Field label='CIF/NIF' />
                <Field label='Email de facturación' />
              </div>

              <section className='flex flex-col gap-4'>
                <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>Dirección</p>
                <div className='flex flex-col gap-6'>
                  <Field label='Dirección completa' />
                  <div className='flex flex-wrap gap-6'>
                    <Field label='Código Postal' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                    <Field label='Ciudad' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                  </div>
                  <div className='flex flex-wrap gap-6'>
                    <Field label='Provincia' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                    <Field label='País' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
                  </div>
                </div>
              </section>

              <section className='flex flex-col gap-4 pb-6'>
                <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                  Información bancaria
                </p>
                <Field label='Cuenta bancaria / IBAN' widthClass='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]' />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
