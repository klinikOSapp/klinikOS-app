'use client'

import {
  AddRounded,
  CheckRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  LocalHospitalRounded
} from '@/components/icons/md3'
import { useConfiguration, type Box } from '@/context/ConfigurationContext'
import { useCallback, useState } from 'react'

type EditingBox = {
  id: string
  label: string
  tone: Box['tone']
  isActive: boolean
}

const TONE_OPTIONS: { value: Box['tone']; label: string; color: string }[] = [
  { value: 'neutral', label: 'Neutral', color: 'bg-neutral-200' },
  { value: 'brand', label: 'Principal', color: 'bg-[var(--color-brand-200)]' },
  { value: 'success', label: 'Verde', color: 'bg-green-200' },
  { value: 'warning', label: 'Amarillo', color: 'bg-yellow-200' },
  { value: 'error', label: 'Rojo', color: 'bg-red-200' }
]

function BoxCard({
  box,
  onEdit,
  onDelete,
  onToggleActive
}: {
  box: Box
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}) {
  const toneStyle = TONE_OPTIONS.find((t) => t.value === box.tone)

  return (
    <div
      className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all ${
        box.isActive
          ? 'border-[var(--color-brand-200)] bg-white shadow-sm'
          : 'border-neutral-200 bg-neutral-50 opacity-60'
      }`}
    >
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div
            className={`flex items-center justify-center size-10 rounded-lg ${
              toneStyle?.color || 'bg-neutral-200'
            }`}
          >
            <LocalHospitalRounded className='size-5 text-neutral-700' />
          </div>
          <div>
            <h3 className='text-title-md font-medium text-[var(--color-neutral-900)]'>
              {box.label}
            </h3>
            <p className='text-body-sm text-[var(--color-neutral-500)]'>
              {box.isActive ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={onEdit}
            aria-label={`Editar ${box.label}`}
            className='flex items-center justify-center size-8 rounded-lg hover:bg-neutral-100 transition-colors'
          >
            <EditRounded className='size-4 text-[var(--color-neutral-600)]' />
          </button>
          <button
            type='button'
            onClick={onDelete}
            aria-label={`Eliminar ${box.label}`}
            className='flex items-center justify-center size-8 rounded-lg hover:bg-red-50 transition-colors'
          >
            <DeleteRounded className='size-4 text-[var(--color-error-600)]' />
          </button>
        </div>
      </div>

      {/* Toggle Active */}
      <div className='flex items-center justify-between pt-2 border-t border-neutral-100'>
        <span className='text-body-sm text-[var(--color-neutral-600)]'>
          Visible en agenda
        </span>
        <button
          type='button'
          onClick={onToggleActive}
          aria-label={box.isActive ? 'Desactivar gabinete' : 'Activar gabinete'}
          className={`relative w-10 h-6 rounded-full transition-colors ${
            box.isActive ? 'bg-[var(--color-brand-500)]' : 'bg-neutral-300'
          }`}
        >
          <span
            className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform ${
              box.isActive ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

function BoxEditModal({
  box,
  isNew,
  onSave,
  onClose
}: {
  box: EditingBox | null
  isNew: boolean
  onSave: (data: EditingBox) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<EditingBox>(
    box || {
      id: '',
      label: '',
      tone: 'neutral',
      isActive: true
    }
  )

  const handleSubmit = useCallback(() => {
    if (!formData.label.trim()) return
    onSave(formData)
  }, [formData, onSave])

  if (!box && !isNew) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
      onClick={onClose}
    >
      <div
        className='w-[min(28rem,95vw)] bg-white rounded-xl shadow-xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='box-edit-title'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
          <h2
            id='box-edit-title'
            className='text-title-lg font-medium text-[var(--color-neutral-900)]'
          >
            {isNew ? 'Nuevo gabinete' : 'Editar gabinete'}
          </h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Cerrar'
            className='flex items-center justify-center size-8 rounded-lg hover:bg-neutral-100 transition-colors'
          >
            <CloseRounded className='size-5 text-[var(--color-neutral-500)]' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-4'>
          {/* Label */}
          <div className='flex flex-col gap-2'>
            <label
              htmlFor='box-label'
              className='text-body-sm font-medium text-[var(--color-neutral-700)]'
            >
              Nombre del gabinete
            </label>
            <input
              id='box-label'
              type='text'
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, label: e.target.value }))
              }
              placeholder='Ej: BOX 1, Gabinete A...'
              className='h-11 px-3 rounded-lg border border-neutral-300 bg-white text-body-md text-[var(--color-neutral-900)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] transition-colors'
            />
          </div>

          {/* Tone */}
          <div className='flex flex-col gap-2'>
            <label className='text-body-sm font-medium text-[var(--color-neutral-700)]'>
              Color identificativo
            </label>
            <div className='flex flex-wrap gap-2'>
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, tone: option.value }))
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    formData.tone === option.value
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className={`size-4 rounded-full ${option.color}`} />
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>
                    {option.label}
                  </span>
                  {formData.tone === option.value && (
                    <CheckRounded className='size-4 text-[var(--color-brand-600)]' />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className='flex items-center justify-between py-3 px-4 rounded-lg bg-neutral-50'>
            <div>
              <p className='text-body-md font-medium text-[var(--color-neutral-900)]'>
                Activo
              </p>
              <p className='text-body-sm text-[var(--color-neutral-500)]'>
                Mostrar este gabinete en la agenda
              </p>
            </div>
            <button
              type='button'
              onClick={() =>
                setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
              }
              className={`relative w-10 h-6 rounded-full transition-colors ${
                formData.isActive
                  ? 'bg-[var(--color-brand-500)]'
                  : 'bg-neutral-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform ${
                  formData.isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-body-md font-medium text-[var(--color-neutral-700)] rounded-lg hover:bg-neutral-100 transition-colors'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={!formData.label.trim()}
            className='px-4 py-2 text-body-md font-medium text-white bg-[var(--color-brand-500)] rounded-lg hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isNew ? 'Crear gabinete' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BoxesConfigPage() {
  const { boxes, addBox, updateBox, deleteBox } = useConfiguration()
  const [editingBox, setEditingBox] = useState<EditingBox | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleEdit = useCallback((box: Box) => {
    setEditingBox({
      id: box.id,
      label: box.label,
      tone: box.tone,
      isActive: box.isActive
    })
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (
        window.confirm('¿Estás seguro de que quieres eliminar este gabinete?')
      ) {
        deleteBox(id)
      }
    },
    [deleteBox]
  )

  const handleToggleActive = useCallback(
    (id: string, currentActive: boolean) => {
      updateBox(id, { isActive: !currentActive })
    },
    [updateBox]
  )

  const handleSave = useCallback(
    (data: EditingBox) => {
      if (isCreating) {
        addBox({
          label: data.label,
          tone: data.tone,
          isActive: data.isActive
        })
      } else if (data.id) {
        updateBox(data.id, {
          label: data.label,
          tone: data.tone,
          isActive: data.isActive
        })
      }
      setEditingBox(null)
      setIsCreating(false)
    },
    [isCreating, addBox, updateBox]
  )

  const handleClose = useCallback(() => {
    setEditingBox(null)
    setIsCreating(false)
  }, [])

  const handleCreate = useCallback(() => {
    setEditingBox({
      id: '',
      label: '',
      tone: 'neutral',
      isActive: true
    })
    setIsCreating(true)
  }, [])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] h-[min(2.5rem,4vh)]'>
        <div>
          <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
            Gabinetes
          </p>
          <p className='text-body-sm text-[var(--color-neutral-500)]'>
            Configura los gabinetes disponibles en tu clínica
          </p>
        </div>
        <button
          type='button'
          onClick={handleCreate}
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          aria-label='Nuevo gabinete'
        >
          <AddRounded className='size-5 text-[var(--color-neutral-900)]' />
          <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
            Nuevo gabinete
          </span>
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0 overflow-auto'>
        {boxes.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <LocalHospitalRounded className='size-16 text-neutral-300 mb-4' />
            <h3 className='text-title-md font-medium text-[var(--color-neutral-700)] mb-2'>
              No hay gabinetes configurados
            </h3>
            <p className='text-body-md text-[var(--color-neutral-500)] mb-6 max-w-md'>
              Los gabinetes te permiten organizar las citas por ubicación dentro
              de tu clínica. Añade tu primer gabinete para empezar.
            </p>
            <button
              type='button'
              onClick={handleCreate}
              className='flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white transition-colors'
            >
              <AddRounded className='size-5' />
              <span className='text-body-md font-medium'>Añadir gabinete</span>
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {boxes.map((box) => (
              <BoxCard
                key={box.id}
                box={box}
                onEdit={() => handleEdit(box)}
                onDelete={() => handleDelete(box.id)}
                onToggleActive={() => handleToggleActive(box.id, box.isActive)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {(editingBox || isCreating) && (
        <BoxEditModal
          box={editingBox}
          isNew={isCreating}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </>
  )
}
