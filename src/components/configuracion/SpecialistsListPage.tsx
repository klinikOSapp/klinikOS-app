'use client'

/* eslint-disable @next/next/no-img-element */

import React from 'react'
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
  return (
    <div className='grid grid-cols-[2.5rem_1fr_0.7fr_0.6fr_1fr_0.5fr_0.5fr_0.5fr] w-full'>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
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
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <img src={ICON_HEART} alt='' className='mr-1.5 size-4 flex-shrink-0' aria-hidden />
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>Profesional</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>Especialidad</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>Teléfono</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>Email</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>Color</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>% comisión</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 h-[3rem]'>
        <p className='text-body-md text-[var(--color-neutral-600)] truncate'>Estado</p>
      </div>
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
      className='grid grid-cols-[2.5rem_1fr_0.7fr_0.6fr_1fr_0.5fr_0.5fr_0.5fr] w-full h-[3rem]'
      style={{ background: selected ? 'var(--color-brand-50)' : 'transparent' }}
    >
      <div className='flex items-center border-b border-neutral-300 px-2 py-2'>
        <input
          type='checkbox'
          checked={selected}
          onChange={onToggle}
          className='size-4 accent-[#338f88] cursor-pointer'
          aria-label={`Seleccionar ${specialist.name}`}
        />
      </div>
      <div className='flex items-center gap-2 border-b border-neutral-300 px-2 py-2 min-w-0'>
        <div className='size-8 rounded-full bg-neutral-200 flex-shrink-0' />
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>{specialist.name}</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>{specialist.role}</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>{specialist.phone}</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>{specialist.email}</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <span
          className={[
            'inline-flex items-center justify-center px-2 py-0.5 rounded',
            colorToneStyles[specialist.colorTone].bg
          ].join(' ')}
        >
          <p
            className={[
              'text-body-md truncate',
              colorToneStyles[specialist.colorTone].text
            ].join(' ')}
          >
            {specialist.colorLabel}
          </p>
        </span>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <p className='text-body-md text-[var(--color-neutral-900)] truncate'>{specialist.commission}</p>
      </div>
      <div className='flex items-center border-b border-neutral-300 px-2 py-2 min-w-0'>
        <span
          className={[
            'inline-flex items-center justify-center px-2 py-0.5 rounded',
            statusStyles[specialist.status].bg
          ].join(' ')}
        >
          <p
            className={[
              'text-body-md truncate',
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
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Lista de especialistas
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          aria-label='Nuevo especialista'
          onClick={() => setShowAddModal(true)}
        >
          <img src={ICON_ADD} alt='' className='size-6' />
          <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>Nuevo especialista</span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-hidden flex flex-col'>
          {/* Toolbar */}
          <div className='flex-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-[min(1.5rem,2vw)] py-[min(1rem,1.5vh)] min-h-[min(4rem,6vh)]'>
            <div className='flex items-center'>
              <div className='flex items-center bg-[var(--color-brand-0)] text-[var(--color-brand-700)] px-2 py-1 rounded-l border border-[var(--color-brand-200)]'>
                <span className='text-body-sm'>
                  {selectionCount === 0
                    ? '0 seleccionado'
                    : `${selectionCount} seleccionado${selectionCount > 1 ? 's' : ''}`}
                </span>
              </div>
              <button
                type='button'
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                onClick={selectionCount === 1 ? handleOpenEdit : undefined}
                disabled={selectionCount !== 1}
              >
                <span className='text-body-sm'>Editar</span>
              </button>
              <button
                type='button'
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
              >
                <span className='text-body-sm'>Desactivar</span>
              </button>
              <button
                type='button'
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
              >
                <img src={ICON_DELETE} alt='Eliminar' className='size-5' />
              </button>
              <button
                type='button'
                className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 rounded-r border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
              >
                <img src={ICON_MORE} alt='Más opciones' className='size-5' />
              </button>
            </div>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                className='flex items-center justify-center size-8 rounded-full hover:bg-neutral-100 transition-colors'
                aria-label='Buscar'
              >
                <img src={ICON_SEARCH} alt='' className='size-6' />
              </button>
              <button
                type='button'
                className='flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
              >
                <img src={ICON_FILTER} alt='' className='size-6' />
                <span className='text-body-sm text-[var(--color-neutral-700)]'>Todos</span>
              </button>
            </div>
          </div>

          {/* Table with scroll */}
          <div className='flex-1 overflow-auto px-[min(1.5rem,2vw)] pb-[min(1.5rem,2vh)]'>
            <div className='border border-neutral-300 rounded overflow-hidden'>
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

          {/* Pagination */}
          <div className='flex-none flex items-center justify-end gap-3 px-[min(1.5rem,2vw)] pb-[min(1rem,1.5vh)] text-[var(--color-neutral-700)]'>
            <div className='flex items-center gap-1'>
              <button type='button' className='p-1 hover:bg-neutral-100 rounded transition-colors'>
                <img src={ICON_FIRST} alt='Primera página' className='size-6' />
              </button>
              <button type='button' className='p-1 hover:bg-neutral-100 rounded transition-colors'>
                <img src={ICON_PREV} alt='Anterior' className='size-6' />
              </button>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-body-sm font-bold underline text-[var(--color-neutral-900)]'>1</span>
              <span className='text-body-sm text-[var(--color-neutral-500)]'>2</span>
              <span className='text-body-sm text-[var(--color-neutral-500)]'>...</span>
              <span className='text-body-sm text-[var(--color-neutral-500)]'>12</span>
            </div>
            <div className='flex items-center gap-1'>
              <button type='button' className='p-1 hover:bg-neutral-100 rounded transition-colors'>
                <img src={ICON_NEXT} alt='Siguiente' className='size-6' />
              </button>
              <button type='button' className='p-1 hover:bg-neutral-100 rounded transition-colors'>
                <img src={ICON_LAST} alt='Última página' className='size-6' />
              </button>
            </div>
          </div>
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
    </>
  )
}
