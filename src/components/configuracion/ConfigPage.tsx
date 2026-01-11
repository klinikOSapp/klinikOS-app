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
  fullWidth?: boolean
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

function Field({ label, helper, value = 'Value', fullWidth = false }: FieldProps) {
  return (
    <div className={`flex flex-col gap-[min(0.5rem,1vw)] ${fullWidth ? 'w-full' : 'w-full md:w-[min(23.75rem,calc(50%-0.75rem))]'}`}>
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
    const horario =
      data.horarioApertura && data.horarioCierre
        ? `${data.horarioApertura} - ${data.horarioCierre}`
        : data.horarioApertura || data.horarioCierre || '08:00 - 20:00'
    
    setRows((prev) => [
      ...prev,
      {
        id: `s${prev.length + 1}`,
        nombre: data.nombreComercial || `Nueva clínica ${prev.length + 1}`,
        direccion: data.direccion || 'Dirección pendiente',
        horario,
        telefono: data.telefonos.filter(t => t).join(', ') || '—',
        email: data.emails.filter(e => e).join(', ') || '—',
        selected: false
      }
    ])
    setShowClinicModal(false)
  }, [])

  return (
    <div className='bg-[var(--color-page-bg)] h-[calc(100dvh-var(--spacing-topbar))] overflow-hidden'>
      <div className='w-full h-full flex flex-col px-[min(3rem,4vw)] py-[min(2.5rem,3vw)]'>
        {/* Page Header */}
        <header className='flex-none mb-[min(2.5rem,3vw)]'>
          <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
            Configuración
          </h1>
        </header>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden min-h-0'>
          {/* Left Navigation Rail */}
          <aside className='w-full lg:w-[min(19rem,25vw)] flex-none border-b lg:border-b-0 lg:border-r border-neutral-100 bg-[var(--color-surface)]'>
            <nav className='flex lg:flex-col overflow-x-auto lg:overflow-x-visible divide-x lg:divide-x-0 lg:divide-y divide-neutral-100'>
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
            <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[min(1rem,1.5vw)] px-[min(2rem,3vw)] py-[min(1rem,2vw)] lg:py-0 lg:pt-0'>
              <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
                Datos de la clínica
              </p>
              <button
                type='button'
                className='flex items-center gap-[min(0.5rem,1vw)] px-[min(1rem,1.5vw)] py-[min(0.5rem,1vw)] rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
                onClick={() => setShowClinicModal(true)}
              >
                <AddRounded className='text-[var(--color-neutral-900)] size-[min(1.5rem,2vw)]' />
                <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                  Añadir Nueva Clínica
                </span>
              </button>
            </div>

            {/* Content Card */}
            <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vw)] mb-[min(2rem,3vw)] min-h-0'>
              <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-auto'>
                {/* Tabs */}
                <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-[min(2.5rem,4vw)] pt-[min(1.5rem,2vw)] pb-[min(0.5rem,1vw)]'>
                  <div className='flex gap-[min(1.5rem,2vw)] items-center overflow-x-auto'>
                    <button
                      type='button'
                      onClick={() => setActiveTab('general')}
                      className={`pb-[min(0.5rem,1vw)] border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'general' ? 'border-[var(--color-brand-500)]' : 'border-transparent'
                      }`}
                    >
                      <p
                        className={`text-title-sm font-medium ${
                          activeTab === 'general' ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-neutral-600)]'
                        }`}
                      >
                        Información general
                      </p>
                    </button>
                    <button
                      type='button'
                      onClick={() => setActiveTab('sucursales')}
                      className={`pb-[min(0.5rem,1vw)] border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'sucursales' ? 'border-[var(--color-brand-500)]' : 'border-transparent'
                      }`}
                    >
                      <p
                        className={`text-title-sm font-medium ${
                          activeTab === 'sucursales' ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-neutral-600)]'
                        }`}
                      >
                        Sucursales
                      </p>
                    </button>
                  </div>
                </div>

                {activeTab === 'general' ? (
                  <div className='px-[min(2.5rem,4vw)] py-[min(1.5rem,2vw)]'>
                    {/* Title & Edit Button Row */}
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[min(1rem,1.5vw)] mb-[min(2rem,3vw)]'>
                      <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                        Clínica Morales
                      </p>
                      <button
                        type='button'
                        className='bg-[var(--color-page-bg)] border border-[var(--color-brand-500)] rounded-2xl flex items-center justify-center px-[min(0.75rem,1vw)] py-[min(0.25rem,0.5vw)] h-[min(2.5rem,4vh)] self-start sm:self-auto hover:bg-[var(--color-brand-50)] transition-colors'
                      >
                        <EditRounded className='text-[var(--color-brand-900)]' />
                        <span className='ml-[min(0.5rem,1vw)] text-body-sm text-[var(--color-brand-900)]'>Editar</span>
                      </button>
                    </div>

                    {/* Form content */}
                    <div className='flex flex-col gap-[min(2.5rem,4vw)] max-w-4xl pb-[min(1.5rem,2vw)]'>
                      {/* Información */}
                      <section className='flex flex-col gap-[min(1rem,1.5vw)]'>
                        <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                          Información
                        </p>
                        <div className='flex flex-col gap-[min(1.5rem,2vw)]'>
                          <Field label='Nombre comercial' value='Clínica Morales' fullWidth />
                          <div className='flex flex-wrap gap-[min(1.5rem,2vw)]'>
                            <Field label='Razón social' />
                            <Field label='CIF/NIF' />
                          </div>
                        </div>
                      </section>

                      {/* Dirección */}
                      <section className='flex flex-col gap-[min(1rem,1.5vw)]'>
                        <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                          Dirección
                        </p>
                        <div className='flex flex-col gap-[min(1.5rem,2vw)]'>
                          <Field label='Dirección completa' fullWidth />
                          <div className='flex flex-wrap gap-[min(1.5rem,2vw)]'>
                            <Field label='Población' />
                            <Field label='Código Postal' />
                          </div>
                        </div>
                      </section>

                      {/* Información de contacto */}
                      <section className='flex flex-col gap-[min(1rem,1.5vw)]'>
                        <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                          Información de contacto
                        </p>
                        <div className='flex flex-col gap-[min(1.5rem,2vw)]'>
                          <Field label='Teléfono' />
                          <Field label='Correo electrónico' />
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className='px-[min(2.5rem,4vw)] py-[min(1.5rem,2vw)] flex flex-col h-full min-h-0'>
                    {/* Title */}
                    <p className='text-title-lg font-medium text-[var(--color-neutral-900)] mb-[min(1.5rem,2vw)]'>
                      Clínica Morales
                    </p>

                    {/* Toolbar */}
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-[min(1rem,1.5vw)] mb-[min(1.5rem,2vw)]'>
                      {/* Selection Actions */}
                      <div className='flex items-center'>
                        <div className='flex items-center bg-[var(--color-brand-0)] text-[var(--color-brand-700)] px-[min(0.5rem,1vw)] py-[min(0.25rem,0.5vw)] rounded-l border border-[var(--color-brand-200)]'>
                          <span className='text-body-sm'>
                            {selectionCount === 0 ? '0 seleccionado' : `${selectionCount} seleccionado${selectionCount > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <button
                          type='button'
                          className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-[min(0.5rem,1vw)] py-[min(0.25rem,0.5vw)] border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
                        >
                          <span className='text-body-sm'>Editar</span>
                        </button>
                        <button
                          type='button'
                          className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-[min(0.5rem,1vw)] py-[min(0.25rem,0.5vw)] border-t border-b border-r border-neutral-300 cursor-pointer hover:bg-neutral-100 transition-colors disabled:opacity-50'
                          onClick={selectionCount === 0 ? undefined : deleteSelected}
                          disabled={selectionCount === 0}
                        >
                          <span className='text-body-sm' aria-hidden>🗑</span>
                        </button>
                        <button
                          type='button'
                          className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-[min(0.5rem,1vw)] py-[min(0.25rem,0.5vw)] rounded-r border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
                        >
                          <span className='text-body-sm'>⋯</span>
                        </button>
                      </div>

                      {/* Search & Filters */}
                      <div className='flex flex-wrap items-center gap-[min(0.5rem,1vw)]'>
                        <input
                          type='search'
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder='Buscar'
                          className='h-[min(2rem,3vh)] w-full sm:w-[min(10rem,15vw)] lg:w-[min(12rem,18vw)] rounded-full px-[min(0.75rem,1vw)] text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                        />
                        <button
                          type='button'
                          className='flex items-center gap-[min(0.25rem,0.5vw)] px-[min(0.5rem,1vw)] py-[min(0.25rem,0.5vw)] rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                        >
                          <span role='img' aria-label='filter'>⚙️</span>
                          <span className='text-body-sm text-[var(--color-neutral-700)]'>Todos</span>
                        </button>
                        <button
                          type='button'
                          className='flex items-center gap-[min(0.5rem,1vw)] h-[min(2rem,3vh)] px-[min(1rem,1.5vw)] rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors'
                          onClick={() => setShowClinicModal(true)}
                        >
                          <AddRounded className='text-[var(--color-neutral-900)] size-[min(1.25rem,2vw)]' />
                          <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
                            Añadir Sucursal
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Table Container with horizontal scroll */}
                    <div className='flex-1 overflow-auto min-h-0'>
                      <table className='w-full min-w-[50rem] border-collapse'>
                        <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                          <tr>
                            <th className='w-[min(2.5rem,4vw)] h-[min(2.5rem,4vh)] text-center text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'></th>
                            <th className='min-w-[12rem] h-[min(2.5rem,4vh)] text-left px-[min(0.5rem,1vw)] text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Nombre de la sucursal
                            </th>
                            <th className='min-w-[14rem] h-[min(2.5rem,4vh)] text-left px-[min(0.5rem,1vw)] text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Dirección completa
                            </th>
                            <th className='min-w-[8rem] h-[min(2.5rem,4vh)] text-left px-[min(0.5rem,1vw)] text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Horario
                            </th>
                            <th className='min-w-[7rem] h-[min(2.5rem,4vh)] text-left px-[min(0.5rem,1vw)] text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Teléfono
                            </th>
                            <th className='min-w-[14rem] h-[min(2.5rem,4vh)] text-left px-[min(0.5rem,1vw)] text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Email
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((sucursal) => (
                            <tr
                              key={sucursal.id}
                              className={`h-[min(3rem,5vh)] ${sucursal.selected ? 'bg-[var(--color-brand-50)]' : 'bg-white'} hover:bg-[var(--color-neutral-50)] transition-colors`}
                            >
                              <td className='text-center border-b border-neutral-300'>
                                <input
                                  type='checkbox'
                                  checked={sucursal.selected}
                                  onChange={() => toggleRow(sucursal.id)}
                                  className='accent-[var(--color-brand-500)] cursor-pointer w-[min(1rem,1.5vw)] h-[min(1rem,1.5vw)]'
                                />
                              </td>
                              <td className='px-[min(0.5rem,1vw)] border-b border-neutral-300'>
                                <div className='flex items-center gap-[min(0.5rem,1vw)]'>
                                  <span
                                    className='flex-none w-[min(2rem,3vw)] h-[min(2rem,3vw)] rounded-full bg-neutral-100'
                                    aria-hidden
                                  />
                                  <span className='text-body-md text-[var(--color-neutral-900)] truncate'>
                                    {sucursal.nombre}
                                  </span>
                                </div>
                              </td>
                              <td className='px-[min(0.5rem,1vw)] border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {sucursal.direccion}
                                </span>
                              </td>
                              <td className='px-[min(0.5rem,1vw)] border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {sucursal.horario}
                                </span>
                              </td>
                              <td className='px-[min(0.5rem,1vw)] border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {sucursal.telefono}
                                </span>
                              </td>
                              <td className='px-[min(0.5rem,1vw)] border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {sucursal.email}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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

