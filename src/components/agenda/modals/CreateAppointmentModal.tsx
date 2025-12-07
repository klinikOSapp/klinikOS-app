'use client'

import { useEffect, useState } from 'react'

type CreateAppointmentModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (data: AppointmentFormData) => void
  initialData?: Partial<AppointmentFormData>
}

export type AppointmentFormData = {
  servicio: string
  paciente: string
  responsable: string
  observaciones: string
  presupuesto: string
  fecha: string
  hora: string
}

const getEmptyFormData = (): AppointmentFormData => ({
  servicio: '',
  paciente: '',
  responsable: '',
  observaciones: '',
  presupuesto: '',
  fecha: '',
  hora: ''
})

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: CreateAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>(() => getEmptyFormData())

  useEffect(() => {
    if (!isOpen) {
      setFormData(getEmptyFormData())
      return
    }

    if (initialData) {
      setFormData((previous) => ({
        ...previous,
        ...initialData
      }))
    }
  }, [initialData, isOpen])

  const handleSubmit = () => {
    onSubmit?.(formData)
    // Reset form
    setFormData(getEmptyFormData())
  }

  if (!isOpen) return null

  // Mock data - replace with real data from your backend
  const servicios = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'limpieza', label: 'Limpieza dental' },
    { value: 'ortodoncia', label: 'Ortodoncia' },
    { value: 'endodoncia', label: 'Endodoncia' },
  ]

  const pacientes = [
    { value: '1', label: 'Juan Pérez' },
    { value: '2', label: 'María García' },
    { value: '3', label: 'Carlos Rodríguez' },
  ]

  const responsables = [
    { value: 'dr1', label: 'Dr. Antonio López' },
    { value: 'dr2', label: 'Dra. Carmen Sánchez' },
    { value: 'dr3', label: 'Dr. Miguel Torres' },
  ]

  const presupuestos = [
    { value: 'p1', label: 'Presupuesto #001' },
    { value: 'p2', label: 'Presupuesto #002' },
    { value: 'p3', label: 'Presupuesto #003' },
  ]

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className='relative w-[min(68.25rem,92vw)] h-[min(59.75rem,85vh)] overflow-clip rounded-lg bg-[#f8fafb]'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='relative min-h-[59.75rem] w-full'>
          {/* Header Bar - 56px height, border bottom */}
          <div className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-solid border-[#cbd3d9] px-8 bg-[#f8fafb]'>
          <p className='font-medium text-[1.125rem] leading-[1.75rem] text-[#24282c]'>
            Añadir cita
          </p>
          <button
            onClick={onClose}
            className='flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-200 transition-colors'
            aria-label='Cerrar modal'
          >
            <span className='material-symbols-rounded text-sm text-[#24282c]'>
              close
            </span>
          </button>
        </div>

        {/* Main Title - left: 229px (14.3125rem), top: 96px (6rem) */}
        <div
          className='absolute flex items-center gap-2'
          style={{
            left: 'calc(20.97% + 1.5rem)',
            top: '6rem',
          }}
        >
          <p className='font-medium text-[1.5rem] leading-[2rem] text-[#24282c]'>
            Añadir una cita al calendario
          </p>
        </div>

        {/* Servicio - top: 184px (11.5rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '11.5rem',
          }}
        >
          Servicio
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '11.5rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.servicio}
            onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar servicio</option>
            {servicios.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Paciente - top: 287px (17.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '17.9375rem',
          }}
        >
          Paciente
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '17.9375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.paciente}
            onChange={(e) => setFormData({ ...formData, paciente: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar paciente</option>
            {pacientes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Responsable - top: 383px (23.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '23.9375rem',
          }}
        >
          Responsable
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '23.9375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.responsable}
            onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar responsable</option>
            {responsables.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Observaciones - top: 479px (29.9375rem), height: 80px */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '29.9375rem',
          }}
        >
          Observaciones
        </p>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          placeholder='Añadir observaciones'
          className='absolute h-[5rem] resize-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 font-normal text-base leading-6 text-[#24282c] placeholder:text-[#aeb8c2] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '29.9375rem',
            width: '19.1875rem',
          }}
          rows={3}
        />

        {/* Presupuesto - top: 607px (37.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '37.9375rem',
          }}
        >
          Presupuesto
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '37.9375rem',
            width: '19.1875rem',
          }}
        >
          <select
            value={formData.presupuesto}
            onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
            className='h-[3rem] w-full appearance-none rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-8 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          >
            <option value=''>Seleccionar presupuesto</option>
            {presupuestos.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#6d7783]'>
              keyboard_arrow_down
            </span>
          </div>
        </div>

        {/* Fecha de la cita - top: 703px (43.9375rem) */}
        <p
          className='absolute font-normal text-base leading-6 text-[#24282c]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '43.9375rem',
          }}
        >
          Fecha de la cita
        </p>
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem)',
            top: '43.9375rem',
            width: '19.1875rem',
          }}
        >
          <input
            type='date'
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            placeholder='Martes 13 de Octubre'
            className='h-[3rem] w-full rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-10 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          />
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#aeb8c2]'>
              calendar_month
            </span>
          </div>
        </div>

        {/* Hora de la cita - alineada con la fecha, sin etiqueta */}
        <div
          className='absolute'
          style={{
            left: 'calc(44.96% + 0.8rem + 20.6875rem)',
            top: '43.9375rem',
            width: '12rem',
          }}
        >
          <input
            type='time'
            value={formData.hora}
            onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
            className='h-[3rem] w-full rounded-lg border-[0.5px] border-solid border-[#cbd3d9] bg-[#f8fafb] px-[0.625rem] py-2 pr-6 font-normal text-base leading-6 text-[#aeb8c2] focus:text-[#24282c] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 cursor-pointer'
          />
          <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
            <span className='material-symbols-rounded text-2xl text-[#aeb8c2]'>
              schedule
            </span>
          </div>
        </div>

        {/* Separator Line - top: 776px (48.5rem) */}
        <div
          className='absolute h-px bg-[#cbd3d9]'
          style={{
            left: 'calc(26.92% + 0.375rem)',
            top: '48.5rem',
            width: '31.5rem',
          }}
        />

        {/* Add Button - top: 820px (51.25rem) */}
        <button
          onClick={handleSubmit}
          className='absolute flex items-center justify-center gap-2 rounded-[8.5rem] border border-solid border-[#cbd3d9] bg-[#51d6c7] px-4 py-2 transition-all hover:bg-[#3fb7ab] active:scale-95'
          style={{
            left: 'calc(50% + 2.3125rem)',
            top: '51.25rem',
            width: '13.4375rem',
            height: '2.5rem',
          }}
        >
          <span className='font-medium text-base leading-6 text-[#1e4947]'>
            Añadir
          </span>
          <span className='material-symbols-rounded text-2xl text-[#1e4947]'>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
    </div>
  )
}

