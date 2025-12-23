'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import configNavItems from './configNavItems'
import AddProfessionalModal, { ProfessionalFormData } from './AddProfessionalModal'

const ICON_HEART = 'http://localhost:3845/assets/cdb93707ac12a23a8385b257aa1b4e624414e81b.svg'
const ICON_FILTER = 'http://localhost:3845/assets/cccab81c301913a8203e5aae99ef088f545f72be.svg'
const ICON_SEARCH = 'http://localhost:3845/assets/19f4eecf65c525d41a751b542cd6230b4a4d4dfe.svg'
const ICON_FIRST = 'http://localhost:3845/assets/b8fb007a2b85d9ae3ee89d0d8cc29a5897221245.svg'
const ICON_PREV = 'http://localhost:3845/assets/5d2185e396aaaed3c50d1be6fdd20e718dc6196f.svg'
const ICON_NEXT = 'http://localhost:3845/assets/ba0f2f5a5f0d38e98223d7bd103f1caccfc08882.svg'
const ICON_LAST = 'http://localhost:3845/assets/fc38c0250e3ec6a56267ab34409369f5f45313e2.svg'
const ICON_ADD = 'http://localhost:3845/assets/63c407761ce9918ca4aaf1d01039aee414a2bc91.svg'
const ICON_DELETE = 'http://localhost:3845/assets/19a4f818969ca650a79b24af986f0c4075633e8c.svg'
const ICON_MORE = 'http://localhost:3845/assets/07d75c832e2862ac5dc6e7352f602b84d4692c2b.svg'

type Specialist = {
  id: string
  name: string
  role: string
  phone: string
  email: string
  colorLabel: string
  colorTone: 'morado' | 'naranja' | 'verde'
  commission: string
  status: 'Activo' | 'Inactivo'
}

const initialSpecialistsData: Array<Omit<Specialist, 'id'>> = [
  {
    name: 'Fernandino Fernández',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'fernandino@gmail.com',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Inactivo'
  },
  {
    name: 'Carlos Pérez',
    role: 'Ortodoncista',
    phone: '608020203',
    email: 'carlitosperez@gmail.com',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Fernandino Fernández',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'fernandino@gmail.com',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Fernandino Fernández',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'fernandino@gmail.com',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Javier Herrera',
    role: 'Higienista',
    phone: '608020203',
    email: 'javier_1890@gmail.com',
    colorLabel: 'Verde',
    colorTone: 'verde',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Carlos Pérez',
    role: 'Ortodoncista',
    phone: '608020203',
    email: 'carlitosperez@gmail.com',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Inactivo'
  },
  {
    name: 'Carlos Pérez',
    role: 'Ortodoncista',
    phone: '608020203',
    email: 'carlitosperez@gmail.com',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Javier Herrera',
    role: 'Higienista',
    phone: '608020203',
    email: 'javier_1890@gmail.com',
    colorLabel: 'Verde',
    colorTone: 'verde',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Fernandino Fernández',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'fernandino@gmail.com',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Carlos Pérez',
    role: 'Ortodoncista',
    phone: '608020203',
    email: 'carlitosperez@gmail.com',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Carlos Pérez',
    role: 'Ortodoncista',
    phone: '608020203',
    email: 'carlitosperez@gmail.com',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Activo'
  },
  {
    name: 'Fernandino Fernández',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'fernandino@gmail.com',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Activo'
  }
] as const

const initialSpecialists: Specialist[] = initialSpecialistsData.map((item, idx) => ({
  ...item,
  id: `s${idx + 1}`
}))

const colorToneStyles: Record<Specialist['colorTone'], { bg: string; text: string }> = {
  morado: { bg: 'bg-[#f3eaff]', text: 'text-[#7725eb]' },
  naranja: { bg: 'bg-[#fff7e8]', text: 'text-[#d97706]' },
  verde: { bg: 'bg-[#e9f8f1]', text: 'text-[#2e7d5b]' }
}

const statusStyles: Record<Specialist['status'], { bg: string; text: string }> = {
  Activo: { bg: 'bg-[#e0f2fe]', text: 'text-[#075985]' },
  Inactivo: { bg: 'bg-[#cbd3d9]', text: 'text-[#24282c]' }
}

function TableHeader({
  allSelected,
  indeterminate,
  onToggleAll
}: {
  allSelected: boolean
  indeterminate: boolean
  onToggleAll: () => void
}) {
  const headers = [
    '',
    'Profesional',
    'Especialidad',
    'Teléfono',
    'Email',
    'Color',
    '% comisión',
    'Estado'
  ]

  const widths = ['1.5rem', '16.125rem', '9.875rem', '8.5rem', '16.875rem', '7.625rem', '6.375rem', '7.125rem']

  return (
    <div className='flex w-full'>
      {headers.map((h, i) => (
        <div
          key={`${h}-${i}`}
          className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
          style={{ width: widths[i], minWidth: widths[i], height: '3rem' }}
        >
          {i === 0 ? (
            <input
              type='checkbox'
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = indeterminate
              }}
              onChange={onToggleAll}
              className='size-4 accent-[#338f88] cursor-pointer'
              aria-label='Seleccionar todos'
            />
          ) : (
            <>
              {i === 1 && (
                <img
                  src={ICON_HEART}
                  alt=''
                  className='mr-[0.375rem] size-4'
                  aria-hidden
                />
              )}
              <p className='font-inter text-[1rem] leading-[1.5rem] text-neutral-700'>{h}</p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function TableRow({
  specialist,
  selected,
  onToggle
}: {
  specialist: Specialist
  selected: boolean
  onToggle: () => void
}) {
  return (
    <div
      className='flex w-full'
      style={{ background: selected ? '#e9fbf9' : 'transparent', height: '3rem' }}
    >
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '1.5rem', minWidth: '1.5rem' }}
      >
        <input
          type='checkbox'
          checked={selected}
          onChange={onToggle}
          className='size-4 accent-[#338f88] cursor-pointer'
          aria-label={`Seleccionar ${specialist.name}`}
        />
      </div>
      <div
        className='flex items-center gap-[0.5rem] border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '16.125rem', minWidth: '16.125rem' }}
      >
        <div className='size-8 rounded-full bg-neutral-200' />
        <p className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900'>{specialist.name}</p>
      </div>
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '9.875rem', minWidth: '9.875rem' }}
      >
        <p className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900'>{specialist.role}</p>
      </div>
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '8.5rem', minWidth: '8.5rem' }}
      >
        <p className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900'>{specialist.phone}</p>
      </div>
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '16.875rem', minWidth: '16.875rem' }}
      >
        <p className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900'>{specialist.email}</p>
      </div>
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '7.625rem', minWidth: '7.625rem' }}
      >
        <span
          className={[
            'inline-flex items-center justify-center px-[0.5rem] py-[0.125rem] rounded-[0.25rem]',
            colorToneStyles[specialist.colorTone].bg
          ].join(' ')}
        >
          <p
            className={[
              'font-inter text-[1rem] leading-[1.5rem]',
              colorToneStyles[specialist.colorTone].text
            ].join(' ')}
          >
            {specialist.colorLabel}
          </p>
        </span>
      </div>
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '6.375rem', minWidth: '6.375rem' }}
      >
        <p className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900'>{specialist.commission}</p>
      </div>
      <div
        className='flex items-center border-b border-neutral-300 px-[0.5rem] py-[0.5rem]'
        style={{ width: '7.125rem', minWidth: '7.125rem' }}
      >
        <span
          className={[
            'inline-flex items-center justify-center px-[0.5rem] py-[0.125rem] rounded-[0.25rem]',
            statusStyles[specialist.status].bg
          ].join(' ')}
        >
          <p
            className={[
              'font-inter text-[1rem] leading-[1.5rem]',
              statusStyles[specialist.status].text
            ].join(' ')}
          >
            {specialist.status}
          </p>
        </span>
      </div>
    </div>
  )
}

export default function SpecialistsListPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [data, setData] = React.useState<Specialist[]>(initialSpecialists)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(initialSpecialists.length ? [initialSpecialists[3]?.id ?? initialSpecialists[0].id] : [])
  )
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const selectionCount = selectedIds.size
  const allSelected = selectionCount > 0 && selectionCount === data.length
  const indeterminate = selectionCount > 0 && selectionCount < data.length
  const editingSpecialist = editingId ? data.find((s) => s.id === editingId) : undefined

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === data.length) return new Set<string>()
      return new Set(data.map((s) => s.id))
    })
  }

  const handleAddProfessional = (form: ProfessionalFormData) => {
    const colorTone: Specialist['colorTone'] =
      form.color === 'morado' ? 'morado' : form.color === 'naranja' ? 'naranja' : 'verde'

    setData((prev) => [
      ...prev,
      {
        id: `s${prev.length + 1}`,
        name: form.nombre || 'Nuevo profesional',
        role: form.especialidad || 'Especialidad',
        phone: form.telefono || '—',
        email: form.email || '—',
        colorLabel:
          form.color === 'morado'
            ? 'Morado'
            : form.color === 'naranja'
            ? 'Naranja'
            : 'Verde',
        colorTone,
        commission: form.comision && form.comision.trim() ? form.comision : '—',
        status: form.estado
      }
    ])
    setShowAddModal(false)
  }

  const handleEditProfessional = (form: ProfessionalFormData) => {
    const colorTone: Specialist['colorTone'] =
      form.color === 'morado' ? 'morado' : form.color === 'naranja' ? 'naranja' : 'verde'
    setData((prev) =>
      prev.map((s) =>
        s.id === editingId
          ? {
              ...s,
              name: form.nombre || s.name,
              role: form.especialidad || s.role,
              phone: form.telefono || s.phone,
              email: form.email || s.email,
              colorLabel:
                form.color === 'morado'
                  ? 'Morado'
                  : form.color === 'naranja'
                  ? 'Naranja'
                  : 'Verde',
              colorTone,
              commission: form.comision && form.comision.trim() ? form.comision : s.commission,
              status: form.estado
            }
          : s
      )
    )
    setShowAddModal(false)
    setEditingId(null)
  }

  const handleSubmitModal = (form: ProfessionalFormData) => {
    if (editingId) {
      handleEditProfessional(form)
    } else {
      handleAddProfessional(form)
    }
  }

  const handleOpenEdit = () => {
    if (selectionCount !== 1) return
    const onlyId = Array.from(selectedIds)[0]
    setEditingId(onlyId)
    setShowAddModal(true)
  }

  const modalInitialData = editingSpecialist
    ? {
        nombre: editingSpecialist.name,
        telefono: editingSpecialist.phone,
        email: editingSpecialist.email,
        especialidad: editingSpecialist.role,
        color: editingSpecialist.colorTone,
        estado: editingSpecialist.status,
        comision: editingSpecialist.commission
      }
    : undefined

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
              <header className='mb-[1.5rem] pt-[0.5rem] flex items-start justify-between pr-[2.5rem]'>
                <div>
                  <h2 className='font-inter text-[1.75rem] leading-[2.25rem] text-neutral-900'>Lista de especialistas</h2>
                </div>
                <button
                  type='button'
                  className='inline-flex items-center gap-[0.5rem] px-[1rem] py-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-page-bg)]'
                  aria-label='Nuevo especialista'
                  style={{ minHeight: '2.5rem' }}
                  onClick={() => setShowAddModal(true)}
                >
                  <img src={ICON_ADD} alt='' className='size-6' />
                  <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 whitespace-nowrap'>Nuevo especialista</span>
                </button>
              </header>

              <section
                className='relative bg-white border border-neutral-200 rounded-[0.5rem] shadow-[0_1px_2px_rgba(36,40,44,0.04)]'
                style={{
                  width: 'min(77rem, calc(100vw - 7rem))',
                  minHeight: 'min(48.25rem, calc(100vh - 12rem))'
                }}
              >
                <div className='flex items-center justify-between px-[1.625rem] pt-[1.25rem] pb-[0.75rem]'>
                  <div className='flex items-center'>
                    <div
                      className='flex items-center bg-[#f0fafa] text-[#338f88] px-[0.5rem] py-[0.25rem] rounded-bl-[0.25rem] rounded-tl-[0.25rem]'
                      style={{ border: '0.5px solid #a8efe7' }}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>
                        {selectionCount === 0
                          ? '0 seleccionado'
                          : `${selectionCount} seleccionado${selectionCount > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem]'
                      onClick={selectionCount === 1 ? handleOpenEdit : undefined}
                      aria-disabled={selectionCount !== 1}
                      style={{
                        cursor: selectionCount === 1 ? 'pointer' : 'not-allowed',
                        borderTop: '0.5px solid #cbd3d9',
                        borderBottom: '0.5px solid #cbd3d9',
                        borderRight: '0.5px solid #cbd3d9'
                      }}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>Editar</span>
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem]'
                      style={{ borderTop: '0.5px solid #cbd3d9', borderBottom: '0.5px solid #cbd3d9', borderRight: '0.5px solid #cbd3d9' }}
                    >
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>Desactivar</span>
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem]'
                      style={{ borderTop: '0.5px solid #cbd3d9', borderBottom: '0.5px solid #cbd3d9', borderRight: '0.5px solid #cbd3d9' }}
                    >
                      <img src={ICON_DELETE} alt='' className='size-5' />
                    </div>
                    <div
                      className='flex items-center bg-[var(--color-page-bg)] text-neutral-700 px-[0.5rem] py-[0.25rem]'
                      style={{ borderTop: '0.5px solid #cbd3d9', borderBottom: '0.5px solid #cbd3d9', borderRight: '0.5px solid #cbd3d9' }}
                    >
                      <img src={ICON_MORE} alt='' className='size-5' />
                    </div>
                  </div>

                  <div className='flex items-center gap-[0.5rem]'>
                    <button
                      type='button'
                      className='flex items-center justify-center size-8 rounded-full border border-transparent'
                      aria-label='Buscar'
                    >
                      <img src={ICON_SEARCH} alt='' className='size-6' />
                    </button>
                    <button
                      type='button'
                      className='flex items-center gap-[0.25rem] px-[0.5rem] py-[0.25rem] rounded-[2rem] border border-[#535c66] text-neutral-700'
                      style={{ minHeight: '2rem' }}
                    >
                      <img src={ICON_FILTER} alt='' className='size-6' />
                      <span className='font-inter text-[0.875rem] leading-[1.25rem]'>Todos</span>
                    </button>
                  </div>
                </div>

                <div className='px-[1.625rem] pb-[1.5rem] overflow-auto'>
                  <div className='border border-neutral-300 rounded-[0.25rem] overflow-hidden'>
                    <TableHeader allSelected={allSelected} indeterminate={indeterminate} onToggleAll={toggleAll} />
                    {data.map((s) => (
                      <TableRow
                        key={s.id}
                        specialist={s}
                        selected={selectedIds.has(s.id)}
                        onToggle={() => toggleRow(s.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className='absolute right-[1.5rem] bottom-[1.25rem] flex items-center gap-[0.75rem] text-neutral-700'>
                  <div className='flex items-center gap-[0.25rem]'>
                    <img src={ICON_FIRST} alt='' className='size-6' />
                    <img src={ICON_PREV} alt='' className='size-6' />
                  </div>
                  <div className='flex items-center gap-[0.375rem]'>
                    <span className='font-inter text-[0.875rem] leading-[1rem] font-bold underline text-[#24282c]'>1</span>
                    <span className='font-inter text-[0.875rem] leading-[1rem] text-neutral-500'>2</span>
                    <span className='font-inter text-[0.875rem] leading-[1rem] text-neutral-500'>...</span>
                    <span className='font-inter text-[0.875rem] leading-[1rem] text-neutral-500'>12</span>
                  </div>
                  <div className='flex items-center gap-[0.25rem]'>
                    <img src={ICON_NEXT} alt='' className='size-6' />
                    <img src={ICON_LAST} alt='' className='size-6' />
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
      <AddProfessionalModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingId(null)
        }}
        onSubmit={handleSubmitModal}
        title={editingId ? 'Editar especialista' : 'Nuevo profesional'}
        submitLabel={editingId ? 'Guardar cambios' : 'Añadir profesional'}
        initialData={modalInitialData}
      />
    </div>
  )
}

