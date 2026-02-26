'use client'

import { CloseRounded, InfoRounded } from '@/components/icons/md3'
import {
  SelectInput,
  TextInput
} from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import { useConfiguration } from '@/context/ConfigurationContext'
import React from 'react'
import { createPortal } from 'react-dom'

type AddProductionModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (data: ProductionFormData) => void
}

type ProductionFormData = {
  treatment: string
  professional: string
  price: string
  date: string
  insurer: string
}

// Mock data for dropdowns
const TREATMENTS = [
  { value: 'operacion-mandibula', label: 'Operación mandíbula' },
  { value: 'consulta-inicial', label: 'Consulta inicial' },
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'extraccion-muela', label: 'Extracción de muela' },
  { value: 'implante-dental', label: 'Implante dental' },
  { value: 'ferula-descarga', label: 'Férula de descarga' },
  { value: 'ortodoncia', label: 'Tratamiento de ortodoncia' },
  { value: 'blanqueamiento', label: 'Blanqueamiento dental' }
]

const INSURERS = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'adeslas', label: 'Adeslas' },
  { value: 'sanitas', label: 'Sanitas' },
  { value: 'dkv', label: 'DKV' }
]

const DATES = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'manana', label: 'Mañana' },
  { value: 'otra', label: 'Otra fecha...' }
]

export default function AddProductionModal({
  open,
  onClose,
  onSubmit
}: AddProductionModalProps) {
  const { professionalNameOptions } = useConfiguration()
  const [formData, setFormData] = React.useState<ProductionFormData>({
    treatment: '',
    professional: '',
    price: '',
    date: '',
    insurer: ''
  })

  const handleChange = (field: keyof ProductionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
    onClose()
  }

  const resetForm = () => {
    setFormData({
      treatment: '',
      professional: '',
      price: '',
      date: '',
      insurer: ''
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={handleClose}
      />

      {/* Modal - 848px = 53rem */}
      <div
        className='relative bg-white rounded-lg w-[53rem] overflow-hidden'
        data-node-id='3092:13770'
      >
        {/* Header - 56px height */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>Añadir producción</h2>
          <button
            type='button'
            onClick={handleClose}
            className='text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-[0.875rem]' />
          </button>
        </div>

        {/* Content - padding 32px */}
        <form
          onSubmit={handleSubmit}
          className='flex flex-col gap-10 items-end px-8 py-8'
        >
          <div className='flex flex-col gap-6 w-full'>
            {/* Section title */}
            <div className='flex items-center gap-2'>
              <p className='text-title-md text-neutral-900'>
                Introduce los datos de la producción
              </p>
            </div>

            {/* Form fields */}
            <div className='flex flex-col gap-6 w-full'>
              {/* Tratamiento */}
              <div className='flex flex-col gap-2 w-full'>
                <label className='text-body-sm text-neutral-900'>
                  Tratamiento
                </label>
                <SelectInput
                  placeholder='Seleccionar tratamiento'
                  value={formData.treatment}
                  onChange={(v) => handleChange('treatment', v)}
                  options={TREATMENTS}
                />
                <span className='text-[0.6875rem] font-medium leading-4 text-neutral-600'>
                  Texto descriptivo
                </span>
              </div>

              {/* Profesional */}
              <div className='flex flex-col gap-2 w-full'>
                <label className='text-body-sm text-neutral-900'>
                  Profesional
                </label>
                <SelectInput
                  placeholder='Seleccionar profesional'
                  value={formData.professional}
                  onChange={(v) => handleChange('professional', v)}
                  options={professionalNameOptions}
                />
                <span className='text-[0.6875rem] font-medium leading-4 text-neutral-600'>
                  Texto descriptivo
                </span>
              </div>

              {/* Precio y Fecha - lado a lado */}
              <div className='flex gap-6'>
                {/* Precio - 380px = 23.75rem */}
                <div className='flex flex-col gap-2 w-[23.75rem]'>
                  <label className='text-body-sm text-neutral-900'>
                    Precio
                  </label>
                  <TextInput
                    placeholder='Introducir precio'
                    value={formData.price}
                    onChange={(v) => handleChange('price', v)}
                    required
                  />
                </div>

                {/* Fecha - 380px = 23.75rem */}
                <div className='flex flex-col gap-2 w-[23.75rem]'>
                  <label className='text-body-sm text-neutral-900'>Fecha</label>
                  <SelectInput
                    placeholder='Seleccionar fecha'
                    value={formData.date}
                    onChange={(v) => handleChange('date', v)}
                    options={DATES}
                  />
                </div>
              </div>

              {/* Aseguradora - 380px */}
              <div className='flex flex-col gap-2 w-[23.75rem]'>
                <label className='text-body-sm text-neutral-900'>
                  Aseguradora (opcional)
                </label>
                <SelectInput
                  placeholder='Seleccionar aseguradora'
                  value={formData.insurer}
                  onChange={(v) => handleChange('insurer', v)}
                  options={INSURERS}
                />
              </div>
            </div>

            {/* Info message */}
            <div className='flex items-center gap-2'>
              <InfoRounded className='size-6 text-neutral-900' />
              <p className='text-body-sm text-neutral-900'>
                Se creará sin presupuesto previo
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='w-[12.1875rem] px-4 py-2 rounded-[8.5rem] bg-brand-500 text-title-sm text-brand-900 hover:bg-brand-400 active:bg-brand-600 transition-colors cursor-pointer'
            >
              Añadir producción
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
