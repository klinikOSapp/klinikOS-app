'use client'

import { AddRounded, CloseRounded, DeleteRounded } from '@/components/icons/md3'
import type {
  BudgetTypeData,
  BudgetTypeTreatment
} from '@/components/pacientes/shared/budgetTypeData'
import { TREATMENT_CATALOG } from '@/components/pacientes/shared/treatmentTypes'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

// ============================================
// Types
// ============================================
type BudgetTypeEditorModalProps = {
  open: boolean
  onClose: () => void
  onSave: (budgetType: Omit<BudgetTypeData, 'id'> | BudgetTypeData) => void
  editingBudgetType?: BudgetTypeData | null
}

// Convert TREATMENT_CATALOG to array for easier rendering
const treatmentOptions = Object.entries(TREATMENT_CATALOG).map(
  ([code, entry]) => ({
    code,
    description: entry.description,
    price:
      parseFloat(
        entry.amount
          .replace(/[^\d,.-]/g, '')
          .replace('.', '')
          .replace(',', '.')
      ) || 0,
    familia: entry.familia
  })
)

// ============================================
// Main Component
// ============================================
export default function BudgetTypeEditorModal({
  open,
  onClose,
  onSave,
  editingBudgetType
}: BudgetTypeEditorModalProps) {
  const [mounted, setMounted] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [treatments, setTreatments] = useState<BudgetTypeTreatment[]>([])
  const [isActive, setIsActive] = useState(true)

  // Treatment selector state
  const [showTreatmentSelector, setShowTreatmentSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Validation error state
  const [errors, setErrors] = useState<{ name?: string; treatments?: string }>(
    {}
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize form when editing
  useEffect(() => {
    if (open) {
      if (editingBudgetType) {
        setName(editingBudgetType.name)
        setDescription(editingBudgetType.description)
        setTreatments([...editingBudgetType.treatments])
        setIsActive(editingBudgetType.isActive)
      } else {
        setName('')
        setDescription('')
        setTreatments([])
        setIsActive(true)
      }
      setShowTreatmentSelector(false)
      setSearchTerm('')
      setErrors({})
    }
  }, [open, editingBudgetType])

  // Calculate total price
  const totalPrice = useMemo(() => {
    return treatments.reduce((sum, t) => sum + t.precio, 0)
  }, [treatments])

  // Filter treatments for selector
  const filteredTreatments = useMemo(() => {
    if (!searchTerm.trim()) return treatmentOptions
    const term = searchTerm.toLowerCase()
    return treatmentOptions.filter(
      (t) =>
        t.code.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
    )
  }, [searchTerm])

  // Add treatment
  const handleAddTreatment = useCallback(
    (code: string, description: string, price: number) => {
      const newTreatment: BudgetTypeTreatment = {
        codigo: code,
        tratamiento: description,
        precio: price
      }
      setTreatments((prev) => [...prev, newTreatment])
      setShowTreatmentSelector(false)
      setSearchTerm('')
    },
    []
  )

  // Remove treatment
  const handleRemoveTreatment = useCallback((index: number) => {
    setTreatments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Save
  const handleSave = useCallback(() => {
    const newErrors: { name?: string; treatments?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'El nombre del paquete es obligatorio'
    }
    if (treatments.length === 0) {
      newErrors.treatments = 'Debe añadir al menos un tratamiento'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    const budgetTypeData = {
      ...(editingBudgetType?.id ? { id: editingBudgetType.id } : {}),
      name: name.trim(),
      description: description.trim(),
      treatments,
      totalPrice,
      isActive
    }

    onSave(budgetTypeData as BudgetTypeData | Omit<BudgetTypeData, 'id'>)
    onClose()
  }, [
    name,
    description,
    treatments,
    totalPrice,
    isActive,
    editingBudgetType,
    onSave,
    onClose
  ])

  // Escape key handler
  useEffect(() => {
    if (!open) return undefined
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open || !mounted) return null

  const content = (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label={
            editingBudgetType
              ? 'Editar presupuesto tipo'
              : 'Crear presupuesto tipo'
          }
          onClick={(event) => event.stopPropagation()}
          className='w-[min(40rem,90vw)] max-h-[85vh] bg-[var(--color-surface)] rounded-lg shadow-xl flex flex-col overflow-hidden'
        >
          {/* Header */}
          <header className='flex items-center justify-between h-[3.5rem] px-6 border-b border-[var(--color-neutral-300)] shrink-0'>
            <h2 className='text-title-md text-[var(--color-neutral-900)]'>
              {editingBudgetType
                ? 'Editar presupuesto tipo'
                : 'Crear presupuesto tipo'}
            </h2>
            <button
              type='button'
              onClick={onClose}
              aria-label='Cerrar'
              className='flex items-center justify-center size-8 rounded-full text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer'
            >
              <CloseRounded className='size-5' />
            </button>
          </header>

          {/* Content */}
          <div className='flex-1 overflow-auto p-6 space-y-6'>
            {/* Name */}
            <div className='space-y-2'>
              <label
                htmlFor='budget-name'
                className='block text-body-md font-medium text-[var(--color-neutral-900)]'
              >
                Nombre *
              </label>
              <input
                id='budget-name'
                type='text'
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name)
                    setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder='Ej: Pack Revisión Completa'
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'budget-name-error' : undefined}
                className={`w-full h-[2.75rem] px-4 rounded-lg border bg-[var(--color-surface)] text-body-md text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] outline-none transition-colors ${
                  errors.name
                    ? 'border-[var(--color-error-500)] focus:border-[var(--color-error-500)]'
                    : 'border-[var(--color-neutral-300)] focus:border-[var(--color-brand-500)]'
                }`}
              />
              {errors.name && (
                <p
                  id='budget-name-error'
                  className='text-body-sm text-[var(--color-error-600)] mt-1'
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <label
                htmlFor='budget-description'
                className='block text-body-md font-medium text-[var(--color-neutral-900)]'
              >
                Descripción
              </label>
              <input
                id='budget-description'
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Ej: Limpieza + consulta inicial + radiografía'
                className='w-full h-[2.75rem] px-4 rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-surface)] text-body-md text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] outline-none focus:border-[var(--color-brand-500)] transition-colors'
              />
            </div>

            {/* Treatments */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <label className='block text-body-md font-medium text-[var(--color-neutral-900)]'>
                  Tratamientos ({treatments.length}) *
                </label>
                <button
                  type='button'
                  onClick={() => {
                    setShowTreatmentSelector(true)
                    if (errors.treatments)
                      setErrors((prev) => ({ ...prev, treatments: undefined }))
                  }}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-50)] text-body-sm font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
                >
                  <AddRounded className='size-4' />
                  Añadir
                </button>
              </div>
              {errors.treatments && (
                <p className='text-body-sm text-[var(--color-error-600)]'>
                  {errors.treatments}
                </p>
              )}

              {/* Treatment selector dropdown */}
              {showTreatmentSelector && (
                <div className='border border-[var(--color-neutral-300)] rounded-lg bg-[var(--color-surface)] shadow-lg'>
                  <div className='p-3 border-b border-[var(--color-neutral-200)]'>
                    <input
                      type='text'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder='Buscar tratamiento...'
                      className='w-full h-[2.25rem] px-3 rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] text-body-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] outline-none focus:border-[var(--color-brand-500)] transition-colors'
                      autoFocus
                    />
                  </div>
                  <div className='max-h-[12rem] overflow-auto'>
                    {filteredTreatments.map((treatment) => (
                      <button
                        key={treatment.code}
                        type='button'
                        onClick={() =>
                          handleAddTreatment(
                            treatment.code,
                            treatment.description,
                            treatment.price
                          )
                        }
                        className='w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--color-neutral-50)] transition-colors'
                      >
                        <div className='flex items-center gap-3'>
                          <span className='text-body-sm font-medium text-[var(--color-neutral-600)]'>
                            {treatment.code}
                          </span>
                          <span className='text-body-md text-[var(--color-neutral-900)]'>
                            {treatment.description}
                          </span>
                        </div>
                        <span className='text-body-md text-[var(--color-neutral-700)]'>
                          {treatment.price.toLocaleString('es-ES')} €
                        </span>
                      </button>
                    ))}
                    {filteredTreatments.length === 0 && (
                      <p className='px-4 py-3 text-body-md text-[var(--color-neutral-500)]'>
                        No se encontraron tratamientos
                      </p>
                    )}
                  </div>
                  <div className='p-2 border-t border-[var(--color-neutral-200)]'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowTreatmentSelector(false)
                        setSearchTerm('')
                      }}
                      className='w-full py-1.5 text-body-sm text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] transition-colors cursor-pointer'
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Selected treatments list */}
              {treatments.length > 0 ? (
                <div className='border border-[var(--color-neutral-200)] rounded-lg overflow-hidden'>
                  {treatments.map((treatment, index) => (
                    <div
                      key={`${treatment.codigo}-${index}`}
                      className='flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-neutral-200)] last:border-b-0 bg-[var(--color-neutral-50)]'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='text-body-sm font-medium text-[var(--color-neutral-600)]'>
                          {treatment.codigo}
                        </span>
                        <span className='text-body-md text-[var(--color-neutral-900)]'>
                          {treatment.tratamiento}
                        </span>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-body-md text-[var(--color-neutral-700)]'>
                          {treatment.precio.toLocaleString('es-ES')} €
                        </span>
                        <button
                          type='button'
                          onClick={() => handleRemoveTreatment(index)}
                          className='p-1 rounded text-[var(--color-error-500)] hover:bg-[var(--color-error-50)] transition-colors cursor-pointer'
                          aria-label='Eliminar tratamiento'
                        >
                          <DeleteRounded className='size-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-body-md text-[var(--color-neutral-500)] py-4 text-center border border-dashed border-[var(--color-neutral-300)] rounded-lg'>
                  No hay tratamientos añadidos
                </p>
              )}
            </div>

            {/* Active toggle */}
            <div className='flex items-center justify-between py-2'>
              <span className='text-body-md text-[var(--color-neutral-900)]'>
                Estado
              </span>
              <button
                type='button'
                onClick={() => setIsActive(!isActive)}
                className={`relative w-[3rem] h-[1.5rem] rounded-full transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-brand-500)]'
                    : 'bg-[var(--color-neutral-300)]'
                }`}
              >
                <span
                  className={`absolute top-[0.125rem] w-[1.25rem] h-[1.25rem] rounded-full bg-white shadow transition-transform ${
                    isActive
                      ? 'translate-x-[1.625rem]'
                      : 'translate-x-[0.125rem]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className='flex items-center justify-between h-[4.5rem] px-6 border-t border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] shrink-0'>
            <div className='text-body-md text-[var(--color-neutral-700)]'>
              <span className='font-medium'>Precio total:</span>{' '}
              <span className='text-[var(--color-neutral-900)] font-semibold'>
                {totalPrice.toLocaleString('es-ES')} €
              </span>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 rounded-full border border-[var(--color-neutral-300)] bg-white text-body-md font-medium text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleSave}
                className='px-4 py-2 rounded-full bg-[var(--color-brand-500)] text-body-md font-medium text-[var(--color-brand-900)] hover:bg-[var(--color-brand-400)] transition-colors cursor-pointer'
              >
                {editingBudgetType
                  ? 'Guardar cambios'
                  : 'Crear presupuesto tipo'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
