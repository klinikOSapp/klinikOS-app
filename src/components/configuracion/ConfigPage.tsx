'use client'

import React from 'react'
import { AddRounded, EditRounded } from '@/components/icons/md3'

type FieldProps = {
  label: string
  helper?: string
  value?: string
  widthClass?: string
}

const configNavItems = [
  'Datos de la clínica',
  'Facturación y textos legales',
  'Lista de especialistas',
  'Horarios de especialistas',
  'Tratamientos, precios, presupuestos y descuentos',
  'Finanzas: gastos fijos y variables',
  'Recordatorios & comunicación',
  'Roles y permisos',
  'Integraciones'
]

function Field({ label, helper = 'Texto descriptivo', value = 'Value', widthClass }: FieldProps) {
  return (
    <div className={['flex flex-col gap-[min(0.5rem,1vw)]', widthClass ?? 'w-full'].join(' ')}>
      <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>{label}</p>
      <div className='flex flex-col gap-[min(0.25rem,0.75vw)] w-full'>
        <div className='flex items-center justify-between h-[min(3rem,6vh)] w-full rounded-[0.5rem] border border-[#cbd3d9] bg-white px-[0.625rem] py-[0.5rem]'>
          <span className='font-inter text-[1rem] leading-[1.5rem] text-[#24282c]'>{value}</span>
          <span
            aria-hidden
            className='inline-flex items-center justify-center text-[0.75rem] leading-[0.875rem] font-medium text-[#cbd3d9]'
          >
            *
          </span>
        </div>
        <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>{helper}</p>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  return (
    <div className='bg-[var(--color-brand-0)] h-[calc(100dvh-var(--spacing-topbar))] overflow-auto'>
      <div className='mx-auto w-[min(104rem,95vw)] pt-[min(2.5rem,5vw)] pb-[min(2rem,4vw)] px-[min(3rem,5vw)]'>
        <header className='flex flex-col gap-[min(0.5rem,1vw)] w-[min(49.625rem,80vw)]'>
          <h1 className='font-inter text-[1.75rem] leading-[2.25rem] text-neutral-900'>Configuración</h1>
          <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-800'>
            Busca y filtra pacientes; confirma asistencias, reprograma citas y envía pre-registro, firmas y
            recordatorios al instante.
          </p>
        </header>

        <div
          className='mt-[min(2.5rem,5vw)] w-[min(98rem,92vw)] rounded-[0.5rem] overflow-hidden bg-white mx-auto flex'
          style={{ minHeight: 'min(71.75rem, calc(100dvh - 8rem))' }}
        >
          {/* Left rail */}
          <aside className='w-[min(19rem,32vw)] border-r border-[#f4f8fa] bg-white'>
            <nav className='flex flex-col divide-y divide-[#f4f8fa]'>
              {configNavItems.map((item, idx) => {
                const isActive = idx === 0
                return (
                  <button
                    key={item}
                    type='button'
                    className={[
                      'text-left w-full px-[1.5rem] py-[1.25rem] flex flex-col gap-[0.25rem]',
                      'font-inter text-[1.125rem] leading-[1.75rem]',
                      isActive
                        ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-900)] font-medium'
                        : 'text-neutral-800 font-normal hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-900)] transition-colors'
                    ].join(' ')}
                  >
                    {item}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Right content */}
          <section className='flex-1 bg-[#f8fafb] relative'>
            <div className='absolute left-[2rem] right-[2rem] top-[2.5rem]'>
              {/* Header row */}
              <div className='flex items-center justify-between'>
                <div className='flex flex-col gap-[0.5rem] w-[min(35.5rem,70vw)]'>
                  <p className='font-inter text-[1.75rem] leading-[2.25rem] text-neutral-900'>Datos de la clínica</p>
                  <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-800'>Explicación larga</p>
                </div>
                <div className='flex items-center gap-[1.5rem]'>
                  <div className='flex items-center gap-[0.5rem] h-[min(2.5rem,5vh)] px-[0.625rem] rounded-[1rem] border border-[#51d6c7] bg-[var(--color-brand-50)]'>
                    <EditRounded className='text-[var(--color-brand-900)]' />
                    <span className='font-inter text-[0.875rem] leading-[1.25rem] text-[var(--color-brand-900)]'>
                      Editar
                    </span>
                  </div>
                  <div className='flex items-center gap-[0.5rem] h-[min(2.5rem,5vh)] px-[1rem] rounded-[8.5rem] border border-[#cbd3d9] bg-[var(--color-brand-50)]'>
                    <AddRounded className='text-neutral-900' />
                    <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 whitespace-nowrap'>
                      Añadir Nueva Clínica
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className='mt-[min(1.5rem,3vw)] flex gap-[1.5rem] items-center'>
                <div className='pb-[0.5rem] border-b border-[#51d6c7]'>
                  <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                    Información general
                  </p>
                </div>
                <div className='pb-[0.5rem]'>
                  <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-600'>
                    Sucursales
                  </p>
                </div>
              </div>
            </div>

            <div className='absolute left-[2rem] right-[2rem] top-[6rem] bottom-[2rem]'>
              <div className='bg-white border border-[#e2e7ea] rounded-[0.5rem] h-full overflow-auto px-[2.4375rem] py-[min(2.5rem,5vw)] flex flex-col gap-[2.5rem]'>
                <div className='flex flex-col gap-[1.5rem]'>
                  <div className='flex items-center justify-between'>
                    <p className='font-inter text-[1.5rem] leading-[2rem] font-medium text-neutral-900'>Clínica Morales</p>
                  </div>

                  {/* Información */}
                  <section className='flex flex-col gap-[1rem]'>
                    <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                      Información
                    </p>
                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Nombre comercial' />
                      <div className='flex flex-wrap gap-[1.5rem]'>
                        <Field label='Razón social' widthClass='min-w-[18rem] flex-1' />
                        <Field label='CIF/NIF' widthClass='min-w-[18rem] flex-1' />
                      </div>
                    </div>
                  </section>

                  {/* Dirección */}
                  <section className='flex flex-col gap-[1rem]'>
                    <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>Dirección</p>
                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Dirección completa' />
                      <div className='flex flex-wrap gap-[1.5rem]'>
                        <Field label='Población' widthClass='min-w-[18rem] flex-1' />
                        <Field label='Código Postal' widthClass='min-w-[18rem] flex-1' />
                      </div>
                    </div>
                  </section>

                  {/* Información de contacto */}
                  <section className='flex flex-col gap-[1rem]'>
                    <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                      Información de contacto
                    </p>
                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Teléfono' widthClass='min-w-[18rem] w-[min(23.75rem,50%)]' />
                      <Field label='Correo electrónico' widthClass='min-w-[18rem] w-[min(23.75rem,50%)]' />
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

