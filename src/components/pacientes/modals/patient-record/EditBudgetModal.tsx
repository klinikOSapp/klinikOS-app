'use client'

import { AddRounded, CloseRounded, DeleteRounded } from '@/components/icons/md3'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  BudgetGeneralDiscount,
  BudgetRow,
  BudgetTreatment
} from './BudgetsPayments'

type EditBudgetModalProps = {
  open: boolean
  onClose: () => void
  budget: BudgetRow | null
  onSave: (updatedBudget: BudgetRow) => void
}

export default function EditBudgetModal({
  open,
  onClose,
  budget,
  onSave
}: EditBudgetModalProps) {
  const [formData, setFormData] = useState<{
    description: string
    date: string
    professional: string
    insurer: string
    validUntil: string
    treatments: BudgetTreatment[]
    generalDiscount: BudgetGeneralDiscount
  }>({
    description: '',
    date: '',
    professional: '',
    insurer: '',
    validUntil: '',
    treatments: [],
    generalDiscount: { type: 'percentage', value: 0 }
  })

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open && budget) {
      setFormData({
        description: budget.description,
        date: budget.date,
        professional: budget.professional,
        insurer: budget.insurer || '',
        validUntil: budget.validUntil || '',
        treatments: budget.treatments ? [...budget.treatments] : [],
        generalDiscount: budget.generalDiscount || {
          type: 'percentage',
          value: 0
        }
      })
    }
  }, [open, budget])

  // Escape key handler
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open || !budget) return null

  // Calculate totals
  const calculateSubtotal = () => {
    return formData.treatments.reduce((sum, t) => {
      const importe =
        parseFloat(t.importe.replace(/[€\s.]/g, '').replace(',', '.')) || 0
      return sum + importe
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmount =
      formData.generalDiscount.type === 'percentage'
        ? subtotal * (formData.generalDiscount.value / 100)
        : formData.generalDiscount.value
    return subtotal - discountAmount
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const subtotal = calculateSubtotal()
    const total = calculateTotal()

    const updatedBudget: BudgetRow = {
      ...budget,
      description: formData.description,
      date: formData.date,
      professional: formData.professional,
      insurer: formData.insurer || undefined,
      validUntil: formData.validUntil || undefined,
      treatments: formData.treatments,
      generalDiscount:
        formData.generalDiscount.value > 0
          ? formData.generalDiscount
          : undefined,
      subtotal: subtotal,
      amount: `${total.toLocaleString('es-ES', {
        minimumFractionDigits: 2
      })} €`,
      history: [
        ...(budget.history || []),
        {
          date: new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          action: 'Presupuesto editado',
          user: 'Sistema'
        }
      ]
    }

    onSave(updatedBudget)
    onClose()
  }

  const handleTreatmentChange = (
    index: number,
    field: keyof BudgetTreatment,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newTreatments = [...prev.treatments]
      newTreatments[index] = { ...newTreatments[index], [field]: value }

      // Recalculate importe if precio or descuento changes
      if (field === 'precio' || field === 'porcentajeDescuento') {
        const precioStr =
          field === 'precio' ? (value as string) : newTreatments[index].precio
        const descuentoPct =
          field === 'porcentajeDescuento'
            ? (value as number)
            : newTreatments[index].porcentajeDescuento || 0

        const precioNum =
          parseFloat(precioStr.replace(/[€\s.]/g, '').replace(',', '.')) || 0
        const descuentoAmount = precioNum * (descuentoPct / 100)
        const importe = precioNum - descuentoAmount

        newTreatments[index].descuento =
          descuentoPct > 0 ? `${descuentoPct}%` : '-'
        newTreatments[index].importe = `${importe.toLocaleString('es-ES', {
          minimumFractionDigits: 2
        })} €`
      }

      return { ...prev, treatments: newTreatments }
    })
  }

  const handleAddTreatment = () => {
    setFormData((prev) => ({
      ...prev,
      treatments: [
        ...prev.treatments,
        {
          tratamiento: '',
          precio: '0,00 €',
          descuento: '-',
          importe: '0,00 €',
          porcentajeDescuento: 0
        }
      ]
    }))
  }

  const handleRemoveTreatment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      treatments: prev.treatments.filter((_, i) => i !== index)
    }))
  }

  const content = (
    <div
      className='fixed inset-0 z-[9999] bg-black/30'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Editar presupuesto'
          onClick={(e) => e.stopPropagation()}
          className='relative w-[min(56rem,92vw)] max-h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col shadow-xl'
        >
          {/* Header */}
          <header className='flex items-center justify-between px-6 py-4 border-b border-[#E2E7EA] bg-[#FAFCFD]'>
            <h2 className='text-[1.125rem] font-semibold text-[#24282C]'>
              Editar Presupuesto {budget.id}
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='p-1 hover:bg-[#E2E7EA] rounded-lg transition-colors cursor-pointer'
              aria-label='Cerrar'
            >
              <CloseRounded className='w-5 h-5 text-[#535C66]' />
            </button>
          </header>

          {/* Content */}
          <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto'>
            <div className='p-6 space-y-6'>
              {/* Información General */}
              <section>
                <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                  Información General
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='col-span-2'>
                    <label className='block text-[0.75rem] text-[#535C66] mb-1'>
                      Descripción
                    </label>
                    <input
                      type='text'
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value
                        }))
                      }
                      className='w-full h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-[0.75rem] text-[#535C66] mb-1'>
                      Fecha de creación
                    </label>
                    <input
                      type='text'
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value
                        }))
                      }
                      placeholder='DD/MM/AA'
                      className='w-full h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-[0.75rem] text-[#535C66] mb-1'>
                      Válido hasta
                    </label>
                    <input
                      type='text'
                      value={formData.validUntil}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          validUntil: e.target.value
                        }))
                      }
                      placeholder='DD/MM/AA'
                      className='w-full h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-[0.75rem] text-[#535C66] mb-1'>
                      Profesional
                    </label>
                    <input
                      type='text'
                      value={formData.professional}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          professional: e.target.value
                        }))
                      }
                      className='w-full h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                    />
                  </div>
                  <div>
                    <label className='block text-[0.75rem] text-[#535C66] mb-1'>
                      Aseguradora
                    </label>
                    <input
                      type='text'
                      value={formData.insurer}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          insurer: e.target.value
                        }))
                      }
                      placeholder='Opcional'
                      className='w-full h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                    />
                  </div>
                </div>
              </section>

              {/* Tratamientos */}
              <section>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide'>
                    Tratamientos ({formData.treatments.length})
                  </h3>
                  <button
                    type='button'
                    onClick={handleAddTreatment}
                    className='flex items-center gap-1 px-3 py-1.5 text-[0.75rem] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] rounded-lg transition-colors cursor-pointer'
                  >
                    <AddRounded className='w-4 h-4' />
                    Añadir tratamiento
                  </button>
                </div>

                {formData.treatments.length > 0 ? (
                  <div className='border border-[#E2E7EA] rounded-lg overflow-hidden'>
                    <table className='w-full'>
                      <thead>
                        <tr className='bg-[#F8FAFB] border-b border-[#E2E7EA]'>
                          <th className='px-3 py-2 text-left text-[0.75rem] font-medium text-[#535C66] w-16'>
                            Pieza
                          </th>
                          <th className='px-3 py-2 text-left text-[0.75rem] font-medium text-[#535C66]'>
                            Tratamiento
                          </th>
                          <th className='px-3 py-2 text-right text-[0.75rem] font-medium text-[#535C66] w-28'>
                            Precio
                          </th>
                          <th className='px-3 py-2 text-right text-[0.75rem] font-medium text-[#535C66] w-20'>
                            Dto. %
                          </th>
                          <th className='px-3 py-2 text-right text-[0.75rem] font-medium text-[#535C66] w-28'>
                            Importe
                          </th>
                          <th className='px-3 py-2 w-12'></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.treatments.map((treatment, idx) => (
                          <tr
                            key={idx}
                            className='border-b border-[#E2E7EA] last:border-b-0'
                          >
                            <td className='px-3 py-2'>
                              <input
                                type='text'
                                value={treatment.pieza || ''}
                                onChange={(e) =>
                                  handleTreatmentChange(
                                    idx,
                                    'pieza',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className='w-full h-8 px-2 rounded border border-neutral-200 text-[0.8125rem] text-[#24282C] focus:outline-none focus:ring-1 focus:ring-brand-500'
                                placeholder='-'
                              />
                            </td>
                            <td className='px-3 py-2'>
                              <input
                                type='text'
                                value={treatment.tratamiento}
                                onChange={(e) =>
                                  handleTreatmentChange(
                                    idx,
                                    'tratamiento',
                                    e.target.value
                                  )
                                }
                                className='w-full h-8 px-2 rounded border border-neutral-200 text-[0.8125rem] text-[#24282C] focus:outline-none focus:ring-1 focus:ring-brand-500'
                                required
                              />
                            </td>
                            <td className='px-3 py-2'>
                              <input
                                type='text'
                                value={treatment.precio}
                                onChange={(e) =>
                                  handleTreatmentChange(
                                    idx,
                                    'precio',
                                    e.target.value
                                  )
                                }
                                className='w-full h-8 px-2 rounded border border-neutral-200 text-[0.8125rem] text-[#24282C] text-right focus:outline-none focus:ring-1 focus:ring-brand-500'
                              />
                            </td>
                            <td className='px-3 py-2'>
                              <input
                                type='number'
                                min='0'
                                max='100'
                                value={treatment.porcentajeDescuento || 0}
                                onChange={(e) =>
                                  handleTreatmentChange(
                                    idx,
                                    'porcentajeDescuento',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className='w-full h-8 px-2 rounded border border-neutral-200 text-[0.8125rem] text-[#24282C] text-right focus:outline-none focus:ring-1 focus:ring-brand-500'
                              />
                            </td>
                            <td className='px-3 py-2 text-[0.8125rem] font-medium text-[#24282C] text-right'>
                              {treatment.importe}
                            </td>
                            <td className='px-3 py-2'>
                              <button
                                type='button'
                                onClick={() => handleRemoveTreatment(idx)}
                                className='p-1 hover:bg-red-50 rounded transition-colors cursor-pointer'
                                aria-label='Eliminar tratamiento'
                              >
                                <DeleteRounded className='w-4 h-4 text-red-500' />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='border border-dashed border-[#E2E7EA] rounded-lg p-6 text-center'>
                    <p className='text-[0.875rem] text-[#AEB8C2]'>
                      No hay tratamientos añadidos
                    </p>
                  </div>
                )}
              </section>

              {/* Descuento General */}
              <section>
                <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                  Descuento General
                </h3>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <select
                      value={formData.generalDiscount.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          generalDiscount: {
                            ...prev.generalDiscount,
                            type: e.target.value as 'percentage' | 'fixed'
                          }
                        }))
                      }
                      className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white cursor-pointer'
                    >
                      <option value='percentage'>Porcentaje (%)</option>
                      <option value='fixed'>Importe fijo (€)</option>
                    </select>
                    <input
                      type='number'
                      min='0'
                      step={
                        formData.generalDiscount.type === 'percentage'
                          ? '1'
                          : '0.01'
                      }
                      max={
                        formData.generalDiscount.type === 'percentage'
                          ? '100'
                          : undefined
                      }
                      value={formData.generalDiscount.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          generalDiscount: {
                            ...prev.generalDiscount,
                            value: parseFloat(e.target.value) || 0
                          }
                        }))
                      }
                      className='w-24 h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
                    />
                  </div>
                </div>
              </section>

              {/* Resumen */}
              <section>
                <h3 className='text-[0.8125rem] font-semibold text-[#535C66] uppercase tracking-wide mb-3'>
                  Resumen
                </h3>
                <div className='bg-[#F8FAFB] border border-[#E2E7EA] rounded-lg p-4'>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-[0.8125rem] text-[#535C66]'>
                        Subtotal tratamientos
                      </span>
                      <span className='text-[0.875rem] text-[#24282C]'>
                        {calculateSubtotal().toLocaleString('es-ES', {
                          minimumFractionDigits: 2
                        })}{' '}
                        €
                      </span>
                    </div>
                    {formData.generalDiscount.value > 0 && (
                      <div className='flex justify-between items-center'>
                        <span className='text-[0.8125rem] text-[#535C66]'>
                          Descuento general (
                          {formData.generalDiscount.type === 'percentage'
                            ? `${formData.generalDiscount.value}%`
                            : `${formData.generalDiscount.value} €`}
                          )
                        </span>
                        <span className='text-[0.875rem] text-[#22C55E]'>
                          -
                          {(formData.generalDiscount.type === 'percentage'
                            ? calculateSubtotal() *
                              (formData.generalDiscount.value / 100)
                            : formData.generalDiscount.value
                          ).toLocaleString('es-ES', {
                            minimumFractionDigits: 2
                          })}{' '}
                          €
                        </span>
                      </div>
                    )}
                    <div className='border-t border-[#E2E7EA] pt-2 mt-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-[0.9375rem] font-semibold text-[#24282C]'>
                          TOTAL
                        </span>
                        <span className='text-[1.125rem] font-bold text-[var(--color-brand-700)]'>
                          {calculateTotal().toLocaleString('es-ES', {
                            minimumFractionDigits: 2
                          })}{' '}
                          €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <footer className='border-t border-[#E2E7EA] bg-[#FAFCFD] px-6 py-4'>
              <div className='flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2 rounded-full border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='px-5 py-2 rounded-full bg-[#51D6C7] hover:bg-[#3ECBBB] text-[#1E4947] text-title-sm font-medium transition-colors cursor-pointer'
                >
                  Guardar cambios
                </button>
              </div>
            </footer>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
