'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import ClientLayout from '@/app/client-layout'
import { MD3Icon } from '@/components/icons/MD3Icon'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────────────────────
   PatientActionsMenu - Dropdown de acciones por paciente
   Estilo unificado con AppointmentContextMenu de la agenda
   ───────────────────────────────────────────────────────────── */
function PatientActionsMenu({
  onClose,
  onViewFile,
  onCreateBudget,
  onEdit,
  onDelete,
  triggerRect
}: {
  onClose: () => void
  onViewFile: () => void
  onCreateBudget: () => void
  onEdit: () => void
  onDelete: () => void
  triggerRect?: DOMRect
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<{
    top?: number
    bottom?: number
    right?: number
  }>({})

  // Calcular posición óptima del menú
  useEffect(() => {
    if (!menuRef.current || !triggerRect) return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const margin = 8

    // Espacio disponible arriba y abajo del trigger
    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    // Decidir si mostrar arriba o abajo
    if (spaceBelow >= menuRect.height + margin) {
      // Hay espacio abajo
      setPosition({
        top: triggerRect.bottom + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else if (spaceAbove >= menuRect.height + margin) {
      // Mostrar arriba
      setPosition({
        bottom: viewportHeight - triggerRect.top + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else {
      // No hay espacio suficiente, centrar verticalmente
      const centeredTop = Math.max(
        margin,
        Math.min(
          viewportHeight - menuRect.height - margin,
          triggerRect.top + triggerRect.height / 2 - menuRect.height / 2
        )
      )
      setPosition({
        top: centeredTop,
        right: window.innerWidth - triggerRect.right
      })
    }
  }, [triggerRect])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Pequeño delay para evitar que el mismo click que abre el menú lo cierre
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[12rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={{
        top: position.top,
        bottom: position.bottom,
        right: position.right
      }}
      role='menu'
      aria-label='Acciones rápidas de paciente'
    >
      {/* Opciones del menú */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={onViewFile}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='FolderOpenRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Ver ficha</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={onCreateBudget}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='ReceiptLongRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Crear presupuesto</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={onEdit}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='EditRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Editar datos</span>
        </button>
      </div>

      {/* Separador antes de la acción destructiva */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Acción destructiva */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={onDelete}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-error-600)] transition-colors hover:bg-[var(--color-error-50)] focus:bg-[var(--color-error-50)] focus:outline-none'
        >
          <MD3Icon
            name='DeleteRounded'
            size={1.125}
            className='text-[var(--color-error-600)]'
          />
          <span>Eliminar paciente</span>
        </button>
      </div>
    </div>
  )
}

const CTA_WIDTH_REM = 7.3125 // 117px ÷ 16
const CTA_HEIGHT_REM = 2.5 // 40px ÷ 16

function Chip({
  children,
  color = 'teal',
  rounded = 'lg',
  size = 'sm'
}: {
  children: React.ReactNode
  color?: 'teal' | 'sky' | 'green' | 'gray'
  rounded?: 'lg' | 'full'
  size?: 'xs' | 'sm' | 'md'
}) {
  const styles = {
    teal: 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-[var(--color-success-200)] text-[var(--color-success-800)]',
    gray: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]'
  }[color]
  const radius = rounded === 'full' ? 'rounded-[80px]' : 'rounded-[4px]'
  const sizeClass =
    size === 'xs'
      ? 'text-label-sm font-normal'
      : size === 'md'
      ? 'text-body-md'
      : 'text-body-sm'

  return (
    <span className={['px-2 py-0.5', sizeClass, styles, radius].join(' ')}>
      {children}
    </span>
  )
}

function StatusPill({ type }: { type: 'Activo' | 'Hecho' }) {
  if (type === 'Activo') {
    return (
      <span className='inline-flex items-center'>
        <Chip color='sky' size='md'>
          Activo
        </Chip>
      </span>
    )
  }
  return (
    <span className='inline-flex items-center'>
      <Chip color='green' rounded='full' size='md'>
        Hecho
      </Chip>
    </span>
  )
}

function TableHeaderCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope='col'
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function TableBodyCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <td
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] align-middle text-body-md text-[var(--color-neutral-900)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </td>
  )
}

function Row() {
  const router = useRouter()
  return (
    <tr
      className='cursor-pointer hover:bg-[var(--color-neutral-50)]'
      onClick={() => router.push('/pacientes/ficha')}
    >
      <td className='py-1 pr-2 w-[240px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          Laura Rivas
        </p>
      </td>
      <td className='py-1 pr-2 w-[191px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
      <td className='py-1 pr-2 w-[154px]'>
        <StatusPill type='Activo' />
      </td>
      <td className='py-1 pr-2 w-[196px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          888 888 888
        </p>
      </td>
      <td className='py-1 pr-2 w-[151px]'>
        <StatusPill type='Hecho' />
      </td>
      <td className='py-1 pr-2 w-[120px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>No</p>
      </td>
      <td className='py-1 pr-2 w-[120px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>380€</p>
      </td>
      <td className='py-1 pr-2 w-[204px]'>
        <p className='text-body-md text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
    </tr>
  )
}

type PatientRow = {
  id: string
  name: string
  nextDate: string
  status: 'Activo' | 'Hecho'
  phone: string
  checkin: 'Hecho' | 'Pendiente'
  financing: 'Sí' | 'No'
  debt: string
  tags?: Array<'deuda' | 'activo' | 'recall'>
}

const MOCK_PATIENTS: PatientRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `p-${i}`,
  name: 'Laura Rivas',
  nextDate: 'DD/MM/AAAA',
  status: 'Activo',
  phone: '888 888 888',
  checkin: 'Hecho',
  financing: 'No',
  debt: '380€',
  tags: i % 3 === 0 ? ['deuda'] : i % 2 === 0 ? ['activo'] : ['recall']
}))

function PacientesPageContent() {
  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'activos'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>(
    []
  )
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)
  const [openBudgetCreation, setOpenBudgetCreation] = React.useState(false)
  const [openEditMode, setOpenEditMode] = React.useState(false)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [menuTriggerRect, setMenuTriggerRect] = React.useState<DOMRect | null>(null)
  const searchParams = useSearchParams()
  const navRouter = useRouter()

  useEffect(() => {
    const shouldOpen = searchParams.get('openCreate') === '1'
    if (!shouldOpen) return
    window.dispatchEvent(new CustomEvent('patients:open-add-patient'))
    navRouter.replace('/pacientes')
  }, [navRouter, searchParams])

  const isPatientSelected = (patientId: string) =>
    selectedPatientIds.includes(patientId)

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatientIds((prevSelected) =>
      prevSelected.includes(patientId)
        ? prevSelected.filter((id) => id !== patientId)
        : [...prevSelected, patientId]
    )
  }

  const isFilterActive = (key: FilterKey) => selectedFilters.includes(key)
  const toggleFilter = (key: FilterKey) => {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
  const clearFilters = () => setSelectedFilters([])

  const searchCtaStyles: React.CSSProperties = {
    width: `min(${CTA_WIDTH_REM}rem, 100%)`,
    minHeight: `min(${CTA_HEIGHT_REM}rem, 6vh)`
  }

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] px-[min(3rem,4vw)] py-[min(1.5rem,2vw)] flex flex-col overflow-auto'>
        <PatientRecordModal
          open={isFichaModalOpen}
          onClose={() => {
            setIsFichaModalOpen(false)
            setOpenBudgetCreation(false)
            setOpenEditMode(false)
          }}
          initialTab={openBudgetCreation ? 'Presupuestos y pagos' : 'Resumen'}
          openBudgetCreation={openBudgetCreation}
          openInEditMode={openEditMode}
        />

        {/* Header Section - Fixed size */}
        <div className='flex-shrink-0'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
                Pacientes
              </h1>
              <Chip color='teal' rounded='full' size='xs'>
                Recepción
              </Chip>
            </div>
            <div className='flex items-center gap-3'>
              {/* <button
                type='button'
                className='inline-flex items-center justify-center gap-gapsm rounded-full bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-neutral-900 shadow-cta transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app'
                style={searchCtaStyles}
              >
                <MD3Icon
                  name='SearchRounded'
                  size='md'
                  className='text-neutral-900'
                />
                <span>Buscar</span>
              </button> */}
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('patients:open-add-patient')
                  )
                }
                className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-[var(--color-neutral-900)] bg-[#F8FAFB] border border-[#CBD3D9] hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947] transition-colors cursor-pointer'
              >
                <MD3Icon name='AddRounded' size='md' />
                <span className='font-medium'>Añadir paciente</span>
              </button>
            </div>
          </div>
          <p className='text-body-sm text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
            Busca y filtra pacientes; confirma asistencias, reprograma citas y
            envía pre-registro, firmas y recordatorios al instante.
          </p>
        </div>

        {/* Table Section - Flexible container */}
        <div className='flex-1 flex flex-col mt-[min(4.25rem,6vw)] overflow-hidden'>
          <div className='flex-shrink-0 mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {selectedPatientIds.length > 0 && (
                <Chip color='teal'>{selectedPatientIds.length} selected</Chip>
              )}
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-body-sm text-[var(--color-neutral-700)] cursor-pointer'>
                Estado
              </button>
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-body-sm text-[var(--color-neutral-700)] cursor-pointer'>
                Check-in
              </button>
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
                <MD3Icon name='DeleteRounded' size='md' />
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
                <MD3Icon
                  name='SearchRounded'
                  size='sm'
                  className='text-[var(--color-neutral-900)]'
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Buscar por nombre, email, teléfono,...'
                  className='bg-transparent outline-none text-body-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-900)]'
                />
              </div>
              <button
                onClick={clearFilters}
                className={[
                  'flex items-center gap-2 px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  selectedFilters.length === 0
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                <MD3Icon name='FilterListRounded' size='sm' />
                <span>Todos</span>
              </button>
              <button
                onClick={() => toggleFilter('deuda')}
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  isFilterActive('deuda')
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                En deuda
              </button>
              <button
                onClick={() => toggleFilter('activos')}
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  isFilterActive('activos')
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                Activos
              </button>
            </div>
          </div>

          <div className='flex-1 rounded-[8px] overflow-hidden'>
            <table className='w-full table-fixed border-collapse'>
              <thead>
                <tr>
                  <TableHeaderCell className='w-[3%] min-w-[2rem] pr-1'>
                    <span className='sr-only'>Seleccionar fila</span>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[28%] pr-2'>
                    <div className='flex items-center gap-2'>
                      <MD3Icon
                        name='AccountCircleRounded'
                        size='sm'
                        className='text-[var(--color-neutral-700)]'
                      />
                      <span>Paciente</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[16%] pr-2'>
                    Teléfono
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[18%] pr-2'>
                    Próxima cita
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[14%] pr-2'>
                    Estado
                  </TableHeaderCell>
                  <TableHeaderCell
                    className='w-[12%] pr-2'
                    align='right'
                  >
                    Deuda
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[5%] min-w-[2.5rem] pr-2 text-right sticky right-0 bg-[var(--color-surface-app)]'>
                    <span className='sr-only'>Acciones</span>
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {MOCK_PATIENTS.filter((p) => {
                  const q = query.trim().toLowerCase()
                  const matchesQuery = q
                    ? p.name.toLowerCase().includes(q) ||
                      p.phone.toLowerCase().includes(q)
                    : true
                  const matchesFilter = (() => {
                    if (selectedFilters.length === 0) return true
                    const tagMap: Record<FilterKey, 'deuda' | 'activo'> = {
                      deuda: 'deuda',
                      activos: 'activo'
                    }
                    return selectedFilters.some((k) =>
                      p.tags?.includes(tagMap[k])
                    )
                  })()
                  return Boolean(matchesQuery && matchesFilter)
                }).map((row, i) => (
                  <tr
                    key={row.id}
                    className={[
                      'group hover:bg-[var(--color-neutral-50)]',
                      isPatientSelected(row.id) ? 'bg-[#E9FBF9]' : ''
                    ].join(' ')}
                  >
                    <TableBodyCell className='w-[3%] min-w-[2rem] pr-1'>
                      <button
                        type='button'
                        onClick={() => togglePatientSelection(row.id)}
                        aria-pressed={isPatientSelected(row.id)}
                        className='relative size-6 inline-flex items-center justify-center cursor-pointer'
                      >
                        {/* Outline box on hover */}
                        <span className='absolute inset-0 rounded-[4px] border border-[var(--color-neutral-300)] bg-white opacity-0 group-hover:opacity-100 transition-opacity' />
                        {/* Selected border */}
                        <span
                          className={[
                            'absolute inset-0 rounded-[4px] border-2 transition-opacity',
                            isPatientSelected(row.id)
                              ? 'border-[#1E4947] opacity-100'
                              : 'opacity-0'
                          ].join(' ')}
                        />
                        {/* Check icon when selected */}
                        <MD3Icon
                          aria-hidden='true'
                          name='CheckRounded'
                          size='sm'
                          className={[
                            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                            'text-[#1E4947] transition-opacity',
                            isPatientSelected(row.id)
                              ? 'opacity-100'
                              : 'opacity-0'
                          ].join(' ')}
                        />
                        <span className='sr-only'>Seleccionar fila</span>
                      </button>
                    </TableBodyCell>
                    <TableBodyCell className='w-[28%] pr-2'>
                      <button
                        type='button'
                        onClick={() => setIsFichaModalOpen(true)}
                        className='truncate hover:underline cursor-pointer text-left w-full'
                      >
                        {row.name}
                      </button>
                    </TableBodyCell>
                    <TableBodyCell className='w-[16%] pr-2'>
                      <p className='truncate'>{row.phone}</p>
                    </TableBodyCell>
                    <TableBodyCell className='w-[18%] pr-2'>
                      <span className='truncate'>{row.nextDate}</span>
                    </TableBodyCell>
                    <TableBodyCell className='w-[14%] pr-2'>
                      <StatusPill type={row.status} />
                    </TableBodyCell>
                    <TableBodyCell
                      className='w-[12%] pr-2'
                      align='right'
                    >
                      {row.debt}
                    </TableBodyCell>
                    <TableBodyCell
                      className='w-[5%] min-w-[2.5rem] pr-2 sticky right-0 bg-[var(--color-surface-app)] group-hover:bg-[var(--color-neutral-50)]'
                      align='right'
                    >
                      <div className='relative'>
                        <button
                          type='button'
                          onClick={(e) => {
                            if (openMenuId === row.id) {
                              setOpenMenuId(null)
                              setMenuTriggerRect(null)
                            } else {
                              setOpenMenuId(row.id)
                              setMenuTriggerRect(e.currentTarget.getBoundingClientRect())
                            }
                          }}
                          aria-label='Abrir acciones'
                          aria-expanded={openMenuId === row.id}
                          className='inline-flex size-8 items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-300)]'
                        >
                          <MD3Icon
                            name='MoreVertRounded'
                            size='md'
                            className='text-[var(--color-neutral-700)]'
                          />
                        </button>
                        {openMenuId === row.id && menuTriggerRect && (
                          <PatientActionsMenu
                            triggerRect={menuTriggerRect}
                            onClose={() => {
                              setOpenMenuId(null)
                              setMenuTriggerRect(null)
                            }}
                            onViewFile={() => {
                              setOpenMenuId(null)
                              setMenuTriggerRect(null)
                              setIsFichaModalOpen(true)
                            }}
                            onCreateBudget={() => {
                              setOpenMenuId(null)
                              setMenuTriggerRect(null)
                              setOpenBudgetCreation(true)
                              setIsFichaModalOpen(true)
                            }}
                            onEdit={() => {
                              setOpenMenuId(null)
                              setMenuTriggerRect(null)
                              setOpenEditMode(true)
                              setIsFichaModalOpen(true)
                            }}
                            onDelete={() => {
                              setOpenMenuId(null)
                              setMenuTriggerRect(null)
                              // TODO: Implementar eliminar con confirmación
                              console.log('Eliminar:', row.name)
                            }}
                          />
                        )}
                      </div>
                    </TableBodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='FirstPageRounded' size='md' />
            </button>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='ChevronLeftRounded' size='md' />
            </button>
            <span className='font-bold underline'>1</span>
            <span>2</span>
            <span>…</span>
            <span>12</span>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='ChevronRightRounded' size='md' />
            </button>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='LastPageRounded' size='md' />
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

export default function PacientesPage() {
  return (
    <Suspense fallback={null}>
      <PacientesPageContent />
    </Suspense>
  )
}
