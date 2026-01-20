'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AddRounded, KeyboardArrowDownRounded } from '@/components/icons/md3'
import AddClinicModal, { ClinicFormData } from './AddClinicModal'
import configNavItems from './configNavItems'

type FieldProps = {
  label: string
  helper?: string
  value?: string
  fullWidth?: boolean
}

type Clinica = {
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
    <div className={`flex flex-col gap-2 ${fullWidth ? 'w-full' : 'w-full md:w-[min(23.75rem,calc(50%-0.75rem))]'}`}>
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

export default function ConfigPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<'general' | 'clinicas'>('general')
  const [showClinicModal, setShowClinicModal] = useState(false)

  const [rows, setRows] = useState<Clinica[]>([
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

  const handleCreateClinica = useCallback((data: ClinicFormData) => {
    const horario =
      data.horarioApertura && data.horarioCierre
        ? `${data.horarioApertura} - ${data.horarioCierre}`
        : data.horarioApertura || data.horarioCierre || '08:00 - 20:00'
    
    setRows((prev) => [
      ...prev,
      {
        id: `c${prev.length + 1}`,
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
      <div className='w-full h-full flex flex-col pl-12 pr-12 pt-10 pb-0'>
        {/* Page Header */}
        <header className='flex-none mb-10'>
          <h1 className='text-headline-sm text-[var(--color-neutral-900)]'>
            Configuración
          </h1>
        </header>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden min-h-0'>
          {/* Left Navigation Rail */}
          <aside className='w-full lg:w-[min(19rem,25vw)] flex-none border-b lg:border-b-0 lg:border-r border-neutral-100 bg-[var(--color-surface)] rounded-l-lg'>
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
                      'text-title-md whitespace-nowrap lg:whitespace-normal',
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
            <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-8 pr-0 py-4 lg:py-0 lg:pt-0'>
              <p className='text-headline-sm font-normal text-[var(--color-neutral-900)]'>
                Datos de la clínica
              </p>
              <button
                type='button'
                className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
                onClick={() => setShowClinicModal(true)}
              >
                <AddRounded className='text-[var(--color-neutral-900)] size-6' />
                <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
                  Añadir Nueva Clínica
                </span>
              </button>
            </div>

            {/* Content Card */}
            <div className='flex-1 ml-8 mr-0 mt-6 mb-0 min-h-0'>
              <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-auto'>
                {/* Tabs */}
                <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-10 pt-6 pb-2'>
                  <div className='flex gap-6 items-center overflow-x-auto'>
                    <button
                      type='button'
                      onClick={() => setActiveTab('general')}
                      className={`p-2 border-b transition-colors whitespace-nowrap ${
                        activeTab === 'general' ? 'border-[var(--color-brand-500)]' : 'border-transparent'
                      }`}
                    >
                      <p
                        className={`text-title-md font-medium ${
                          activeTab === 'general' ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-neutral-600)]'
                        }`}
                      >
                        Información general
                      </p>
                    </button>
                    <button
                      type='button'
                      onClick={() => setActiveTab('clinicas')}
                      className={`p-2 border-b transition-colors whitespace-nowrap ${
                        activeTab === 'clinicas' ? 'border-[var(--color-brand-500)]' : 'border-transparent'
                      }`}
                    >
                      <p
                        className={`text-title-md font-medium ${
                          activeTab === 'clinicas' ? 'text-[var(--color-neutral-900)]' : 'text-[var(--color-neutral-600)]'
                        }`}
                      >
                        Clínicas
                      </p>
                    </button>
                  </div>
                </div>

                {activeTab === 'general' ? (
                  <div className='px-12 py-6'>
                    {/* Clinic Selector with Chevron */}
                    <div className='flex items-center justify-between pb-4 border-b border-neutral-200 mb-10'>
                      <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                        Clínica Morales
                      </p>
                      <KeyboardArrowDownRounded className='size-6 text-[var(--color-neutral-900)] cursor-pointer' />
                    </div>

                    {/* Form content */}
                    <div className='flex flex-col gap-10 max-w-[min(49rem,100%)] pb-6'>
                      {/* Información */}
                      <section className='flex flex-col gap-4'>
                        <div className='flex items-center justify-between'>
                          <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                            Información
                          </p>
                          <button
                            type='button'
                            className='bg-[var(--color-page-bg)] border border-[var(--color-brand-500)] rounded-2xl flex items-center justify-center px-[min(0.625rem,1vw)] py-1 h-[min(2rem,3vh)] hover:bg-[var(--color-brand-50)] transition-colors'
                          >
                            <span className='text-body-sm text-[var(--color-brand-900)]'>Editar</span>
                          </button>
                        </div>
                        <div className='flex flex-col gap-6'>
                          <Field label='Nombre comercial' value='Clínica Morales' fullWidth />
                          <div className='flex flex-wrap gap-6'>
                            <Field label='Razón social' />
                            <Field label='CIF/NIF' />
                          </div>
                        </div>
                      </section>

                      {/* Dirección */}
                      <section className='flex flex-col gap-4'>
                        <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                          Dirección
                        </p>
                        <div className='flex flex-col gap-6'>
                          <Field label='Dirección completa' fullWidth />
                          <div className='flex flex-wrap gap-6'>
                            <Field label='Población' />
                            <Field label='Código Postal' />
                          </div>
                        </div>
                      </section>

                      {/* Información de contacto */}
                      <section className='flex flex-col gap-4'>
                        <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                          Información de contacto
                        </p>
                        <div className='flex flex-wrap gap-6'>
                          <Field label='Teléfono' />
                          <Field label='Email' />
                        </div>
                      </section>

                      {/* Información bancaria */}
                      <section className='flex flex-col gap-4'>
                        <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                          Información bancaria
                        </p>
                        <div className='flex flex-wrap gap-6'>
                          <Field label='IBAN' />
                          <Field label='Email' />
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className='px-10 py-6 flex flex-col h-full min-h-0'>
                    {/* Title */}
                    <p className='text-title-lg font-medium text-[var(--color-neutral-900)] mb-6'>
                      Clínica Morales
                    </p>

                    {/* Toolbar */}
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
                      {/* Selection Actions */}
                      <div className='flex items-center'>
                        <div className='flex items-center bg-[var(--color-brand-0)] text-[var(--color-brand-700)] px-2 py-1 rounded-l border border-[var(--color-brand-200)]'>
                          <span className='text-body-sm'>
                            {selectionCount === 0 ? '0 seleccionado' : `${selectionCount} seleccionado${selectionCount > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <button
                          type='button'
                          className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
                        >
                          <span className='text-body-sm'>Editar</span>
                        </button>
                        <button
                          type='button'
                          className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 cursor-pointer hover:bg-neutral-100 transition-colors disabled:opacity-50'
                          onClick={selectionCount === 0 ? undefined : deleteSelected}
                          disabled={selectionCount === 0}
                        >
                          <span className='text-body-sm' aria-hidden>🗑</span>
                        </button>
                        <button
                          type='button'
                          className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 rounded-r border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
                        >
                          <span className='text-body-sm'>⋯</span>
                        </button>
                      </div>

                      {/* Search & Filters */}
                      <div className='flex flex-wrap items-center gap-2'>
                        <input
                          type='search'
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder='Buscar'
                          className='h-8 w-full sm:w-40 lg:w-48 rounded-full px-3 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                        />
                        <button
                          type='button'
                          className='flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                        >
                          <span role='img' aria-label='filter'>⚙️</span>
                          <span className='text-body-sm text-[var(--color-neutral-700)]'>Todos</span>
                        </button>
                        <button
                          type='button'
                          className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors'
                          onClick={() => setShowClinicModal(true)}
                        >
                          <AddRounded className='text-[var(--color-neutral-900)] size-5' />
                          <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
                            Añadir Clínica
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Table Container with horizontal scroll */}
                    <div className='flex-1 overflow-auto min-h-0'>
                      <table className='w-full min-w-[50rem] border-collapse'>
                        <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                          <tr>
                            <th className='w-10 h-10 text-center text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'></th>
                            <th className='min-w-[12rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Nombre de la clínica
                            </th>
                            <th className='min-w-[14rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Dirección completa
                            </th>
                            <th className='min-w-[8rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Horario
                            </th>
                            <th className='min-w-[7rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Teléfono
                            </th>
                            <th className='min-w-[14rem] h-10 text-left px-2 text-body-md font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                              Email
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((clinica) => (
                            <tr
                              key={clinica.id}
                              className={`h-12 ${clinica.selected ? 'bg-[var(--color-brand-50)]' : 'bg-white'} hover:bg-[var(--color-neutral-50)] transition-colors`}
                            >
                              <td className='text-center border-b border-neutral-300'>
                                <input
                                  type='checkbox'
                                  checked={clinica.selected}
                                  onChange={() => toggleRow(clinica.id)}
                                  className='accent-[var(--color-brand-500)] cursor-pointer size-4'
                                />
                              </td>
                              <td className='px-2 border-b border-neutral-300'>
                                <div className='flex items-center gap-2'>
                                  <span
                                    className='flex-none size-8 rounded-full bg-neutral-100'
                                    aria-hidden
                                  />
                                  <span className='text-body-md text-[var(--color-neutral-900)] truncate'>
                                    {clinica.nombre}
                                  </span>
                                </div>
                              </td>
                              <td className='px-2 border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {clinica.direccion}
                                </span>
                              </td>
                              <td className='px-2 border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {clinica.horario}
                                </span>
                              </td>
                              <td className='px-2 border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {clinica.telefono}
                                </span>
                              </td>
                              <td className='px-2 border-b border-neutral-300'>
                                <span className='text-body-md text-[var(--color-neutral-900)] truncate block'>
                                  {clinica.email}
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
        onSubmit={handleCreateClinica}
        title='Añadir nueva clínica'
        submitLabel='Crear clínica'
      />
    </div>
  )
}

