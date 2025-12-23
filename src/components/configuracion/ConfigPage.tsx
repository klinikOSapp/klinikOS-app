'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AddRounded, EditRounded } from '@/components/icons/md3'
import AddClinicModal, { ClinicFormData } from './AddClinicModal'
import configNavItems from './configNavItems'

type FieldProps = {
  label: string
  helper?: string
  value?: string
  widthClass?: string
}

type Sucursal = {
  id: string
  nombre: string
  direccion: string
  horario: string
  telefono: string
  email: string
  selected: boolean
}

function Field({ label, helper, value = 'Value', widthClass }: FieldProps) {
  return (
    <div className={['flex flex-col gap-[min(0.5rem,1vw)]', widthClass ?? 'w-full'].join(' ')}>
      <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>{label}</p>
      <div className='flex flex-col gap-[min(0.25rem,0.75vw)] w-full'>
        <div className='flex items-center justify-between h-[min(3rem,6vh)] w-full rounded-[0.5rem] border border-neutral-300 bg-[var(--color-surface)] px-[0.625rem] py-[0.5rem]'>
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

export default function ConfigPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'general' | 'sucursales'>('general')
  const [showClinicModal, setShowClinicModal] = useState(false)

  const [rows, setRows] = useState<Sucursal[]>([
    {
      id: 's1',
      nombre: 'Clínica Morales Ruzafa',
      direccion: 'C/ Universidad, 2, Valencia',
      horario: '08:00 - 20:00',
      telefono: '608020203',
      email: 'clinicamorales@morales.es',
      selected: false
    },
    {
      id: 's2',
      nombre: 'Clínica Morales Albal',
      direccion: 'C/ Madrid, 12, Catarroja',
      horario: '09:30 - 20:00',
      telefono: '608020203',
      email: 'clinicamorales@morales.es',
      selected: false
    },
    {
      id: 's3',
      nombre: 'Clínica Morales Blasco',
      direccion: 'C/ José María Hoyo, 34, Valencia',
      horario: '08:30 - 19:30',
      telefono: '608020203',
      email: 'clinicamorales@morales.es',
      selected: true
    }
  ])
  const [search, setSearch] = useState('')

  const selectionCount = useMemo(() => rows.filter((r) => r.selected).length, [rows])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(term) ||
        r.direccion.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.telefono.toLowerCase().includes(term)
    )
  }, [rows, search])

  const toggleRow = useCallback((id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)))
  }, [])

  const deleteSelected = useCallback(() => {
    setRows((prev) => prev.filter((r) => !r.selected))
  }, [])

  const handleCreateSucursal = useCallback((data: ClinicFormData) => {
    setRows((prev) => [
      ...prev,
      {
        id: `s${prev.length + 1}`,
        nombre: data.nombre || `Nueva sucursal ${prev.length + 1}`,
        direccion: data.direccion || 'Dirección pendiente',
        horario:
          data.horarioApertura && data.horarioCierre
            ? `${data.horarioApertura} - ${data.horarioCierre}`
            : data.horarioApertura || data.horarioCierre || 'Horario pendiente',
        telefono: data.telefono || '—',
        email: data.email || '—',
        selected: false
      }
    ])
    setShowClinicModal(false)
  }, [])

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
            {/* Header text at 40px from viewport top (2.5rem) */}
            <div className='absolute left-[2rem] top-0'>
              <p className='font-inter text-[1.75rem] leading-[2.25rem] font-normal text-neutral-900'>Datos de la clínica</p>
            </div>
            {/* Add button aligned to header row */}
            <div
              className='absolute top-0 flex items-center gap-[0.5rem] px-[1rem] py-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-page-bg)]'
              style={{ left: 'calc(81.25% + 0.875rem)' }}
                onClick={() => setShowClinicModal(true)}
            >
              <AddRounded className='text-neutral-900' />
              <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 whitespace-nowrap'>Añadir Nueva Clínica</span>
            </div>

            <div
              className='absolute left-[2rem] right-0'
              style={{
                top: '3.5rem',
                height: 'calc(100% - 3.5rem)'
              }}
            >
              <div
                className='bg-[var(--color-surface)] border border-neutral-200 rounded-[0.5rem] h-full overflow-auto relative'
                style={{ width: '77rem' }}
              >
                {/* Tabs */}
                <div className='absolute left-[2.4375rem] top-[1.9375rem] flex gap-[1.5rem] items-center'>
                  <button
                    type='button'
                    onClick={() => setActiveTab('general')}
                    className='pb-[0.5rem] border-b'
                    style={{ borderColor: activeTab === 'general' ? '#51d6c7' : 'transparent' }}
                  >
                    <p
                      className='font-inter text-[1.125rem] leading-[1.75rem] font-medium'
                      style={{ color: activeTab === 'general' ? '#24282c' : '#6d7783' }}
                    >
                      Información general
                    </p>
                  </button>
                  <button
                    type='button'
                    onClick={() => setActiveTab('sucursales')}
                    className='pb-[0.5rem] border-b'
                    style={{ borderColor: activeTab === 'sucursales' ? '#51d6c7' : 'transparent' }}
                  >
                    <p
                      className='font-inter text-[1.125rem] leading-[1.75rem] font-medium'
                      style={{ color: activeTab === 'sucursales' ? '#24282c' : '#6d7783' }}
                    >
                      Sucursales
                    </p>
                  </button>
                </div>

            {activeTab === 'general' ? (
              <>
                {/* Title */}
                <p className='absolute left-[2.4375rem] top-[6.4375rem] font-inter text-[1.5rem] leading-[2rem] font-medium text-neutral-900'>
                  Clínica Morales
                </p>

                {/* Edit button */}
                <div className='absolute left-[47.75rem] top-[9.9375rem]'>
                  <div className='bg-[var(--color-page-bg)] border border-brand-500 rounded-[1rem] flex items-center justify-center px-[0.625rem] py-[0.25rem] h-[2.5rem]'>
                    <EditRounded className='text-brand-900' />
                    <span className='ml-[0.5rem] font-inter text-[0.875rem] leading-[1.25rem] text-brand-900'>Editar</span>
                  </div>
                </div>

                {/* Form content */}
                <div className='absolute left-[2.4375rem] top-[9.9375rem] w-[49rem] flex flex-col gap-[2.5rem] pb-[2.5rem]'>
                  {/* Información */}
                  <section className='flex flex-col gap-[1rem]'>
                    <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>Información</p>
                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Nombre comercial' value='Clínica Morales' />
                      <div className='flex gap-[1.5rem]'>
                        <Field label='Razón social' widthClass='w-[23.75rem]' />
                        <Field label='CIF/NIF' widthClass='w-[23.75rem]' />
                      </div>
                    </div>
                  </section>

                  {/* Dirección */}
                  <section className='flex flex-col gap-[1rem]'>
                    <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>Dirección</p>
                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Dirección completa' />
                      <div className='flex gap-[1.5rem]'>
                        <Field label='Población' widthClass='w-[23.75rem]' />
                        <Field label='Código Postal' widthClass='w-[23.75rem]' />
                      </div>
                    </div>
                  </section>

                  {/* Información de contacto */}
                  <section className='flex flex-col gap-[1rem]'>
                    <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                      Información de contacto
                    </p>
                    <div className='flex flex-col gap-[1.5rem]'>
                      <Field label='Teléfono' widthClass='w-[23.75rem]' />
                      <Field label='Correo electrónico' widthClass='w-[23.75rem]' />
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <>
                {/* Title */}
                <p className='absolute left-[2.4375rem] top-[6.4375rem] font-inter text-[1.5rem] leading-[2rem] font-medium text-neutral-900'>
                  Clínica Morales
                </p>

                {/* Toolbar */}
                <div className='absolute left-[2.4375rem] top-[9.9375rem] w-[72rem] flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div
                      className='flex items-center bg-[var(--color-brand-0)] text-brand-700 px-[0.5rem] py-[0.25rem] rounded-bl-[0.25rem] rounded-tl-[0.25rem]'
                      style={{ border: '0.5px solid #a8efe7' }}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>
                        {selectionCount === 0 ? '0 seleccionado' : `${selectionCount} seleccionado${selectionCount > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem]'
                      style={{ borderTop: '0.5px solid #cbd3d9', borderBottom: '0.5px solid #cbd3d9', borderRight: '0.5px solid #cbd3d9' }}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>Editar</span>
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem] cursor-pointer'
                      style={{ borderTop: '0.5px solid #cbd3d9', borderBottom: '0.5px solid #cbd3d9', borderRight: '0.5px solid #cbd3d9' }}
                      onClick={selectionCount === 0 ? undefined : deleteSelected}
                      aria-disabled={selectionCount === 0}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]' aria-hidden>
                        🗑
                      </span>
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem] rounded-br-[0.25rem] rounded-tr-[0.25rem]'
                      style={{ borderTop: '0.5px solid #cbd3d9', borderBottom: '0.5px solid #cbd3d9', borderRight: '0.5px solid #cbd3d9' }}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>⋯</span>
                    </div>
                  </div>

                  <div className='flex items-center gap-[0.5rem]'>
                    <input
                      type='search'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder='Buscar'
                      className='h-[2rem] rounded-[32px] px-3 text-[0.875rem] leading-[1.25rem] border border-[#535c66] outline-none bg-[var(--color-page-bg)]'
                      style={{ minWidth: '10rem' }}
                    />
                    <div
                      className='flex items-center gap-[0.25rem] px-[0.5rem] py-[0.25rem] rounded-[32px]'
                      style={{ border: '0.5px solid #535c66' }}
                    >
                      <span role='img' aria-label='filter'>
                        ⚙️
                      </span>
                      <span className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-700'>Todos</span>
                    </div>
                    <div className='flex items-center gap-[0.5rem] h-[2rem] px-[1rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-page-bg)]'>
                      <button type='button' className='flex items-center gap-[0.5rem]' onClick={() => setShowClinicModal(true)}>
                        <AddRounded className='text-neutral-900' />
                        <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 whitespace-nowrap'>Añadir Sucursal</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className='absolute left-[2.4375rem] top-[13rem] w-[72rem]'>
                  <div className='grid grid-cols-[1.5rem_16rem_19.125rem_10.625rem_8.5rem_17.75rem]'>
                    <div className='h-[2.5rem] flex items-center justify-center text-[1rem] leading-[1.5rem] text-neutral-700 border-b border-neutral-200'></div>
                    <div className='h-[2.5rem] flex items-center px-[0.5rem] text-[1rem] leading-[1.5rem] text-neutral-700 border-b border-neutral-200'>
                      Nombre de la sucursal
                    </div>
                    <div className='h-[2.5rem] flex items-center px-[0.5rem] text-[1rem] leading-[1.5rem] text-neutral-700 border-b border-neutral-200'>
                      Dirección completa
                    </div>
                    <div className='h-[2.5rem] flex items-center px-[0.5rem] text-[1rem] leading-[1.5rem] text-neutral-700 border-b border-neutral-200'>
                      Horario
                    </div>
                    <div className='h-[2.5rem] flex items-center px-[0.5rem] text-[1rem] leading-[1.5rem] text-neutral-700 border-b border-neutral-200'>
                      Teléfono
                    </div>
                    <div className='h-[2.5rem] flex items-center px-[0.5rem] text-[1rem] leading-[1.5rem] text-neutral-700 border-b border-neutral-200'>
                      Email
                    </div>
                  </div>

                  <div className='flex flex-col'>
                    {filteredRows.map((sucursal) => {
                      const bg = sucursal.selected ? '#e9fbf9' : 'white'
                      const borderColor = '#cbd3d9'
                      return (
                        <div
                          key={sucursal.id}
                          className='grid grid-cols-[1.5rem_16rem_19.125rem_10.625rem_8.5rem_17.75rem] h-[3rem]'
                          style={{ background: bg }}
                        >
                          <div className='flex items-center justify-center border-b' style={{ borderColor }}>
                            <input
                              type='checkbox'
                              checked={sucursal.selected}
                              onChange={() => toggleRow(sucursal.id)}
                              className='accent-[var(--color-brand-500)] cursor-pointer'
                            />
                          </div>
                          <div className='flex items-center gap-[0.5rem] px-[0.5rem] border-b' style={{ borderColor }}>
                            <span
                              className='block rounded-full'
                              style={{ width: '2rem', height: '2rem', background: '#eef2f4' }}
                              aria-hidden
                            />
                            <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 truncate'>{sucursal.nombre}</span>
                          </div>
                          <div className='flex items-center px-[0.5rem] border-b' style={{ borderColor }}>
                            <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 truncate'>{sucursal.direccion}</span>
                          </div>
                          <div className='flex items-center px-[0.5rem] border-b' style={{ borderColor }}>
                            <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 truncate'>{sucursal.horario}</span>
                          </div>
                          <div className='flex items-center px-[0.5rem] border-b' style={{ borderColor }}>
                            <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 truncate'>{sucursal.telefono}</span>
                          </div>
                          <div className='flex items-center px-[0.5rem] border-b' style={{ borderColor }}>
                            <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 truncate'>{sucursal.email}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
              </div>
            </div>
          </section>
        </div>
      </div>
      <AddClinicModal
        open={showClinicModal}
        onClose={() => setShowClinicModal(false)}
        onSubmit={handleCreateSucursal}
        title='Añadir nueva clínica'
        submitLabel='Crear sucursal'
      />
    </div>
  )
}

