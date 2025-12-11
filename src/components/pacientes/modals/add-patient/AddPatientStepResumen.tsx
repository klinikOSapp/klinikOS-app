'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'

type Props = {
  // Datos básicos
  nombre?: string
  apellidos?: string
  email?: string
  telefono?: string
  alergias?: string[]
  anotaciones?: string
  // Consentimientos / toggles
  recordatorios?: boolean
  marketing?: boolean
}

export default function AddPatientStepResumen({
  nombre,
  apellidos,
  email,
  telefono,
  alergias = [],
  anotaciones,
  recordatorios,
  marketing
}: Props) {
  const fullName =
    [nombre, apellidos].filter(Boolean).join(' ').trim() || 'Lucia López Cano'
  return (
    <>
      {/* Avatar + Info del Paciente */}
      <div className='absolute left-[18.375rem] top-[10rem] flex items-center gap-6'>
        <div className='size-24 rounded-full bg-[var(--color-neutral-700)]' />
        <div className='flex flex-col gap-2 w-[14.25rem]'>
          <p className='text-[1.5rem] leading-[2rem] font-medium text-[var(--color-neutral-900)]'>
            {fullName}
          </p>
          <div className='flex items-center gap-2'>
            <MD3Icon
              name='MailOutlineRounded'
              size='md'
              className='text-[var(--color-neutral-900)]'
            />
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              {email || 'Email no proporcionado'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <MD3Icon
              name='PhoneRounded'
              size='md'
              className='text-[var(--color-neutral-900)]'
            />
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              {telefono || 'Teléfono no proporcionado'}
            </p>
          </div>
        </div>
      </div>

      {/* Alergias */}
      <p className='absolute left-[18.375rem] top-[18.25rem] text-[0.75rem] leading-[1rem] font-medium text-[#8A95A1]'>
        Alergias:
      </p>
      <div className='absolute left-[25.5625rem] top-[18rem] flex items-center gap-2'>
        {alergias.length > 0 ? (
          alergias.map((a, index) => (
            <span
              key={a}
              className='inline-flex items-center px-2 py-1 rounded-full bg-[var(--color-error-200)] text-[var(--color-error-600)] text-[0.75rem] leading-[1rem] font-medium'
            >
              {a}
            </span>
          ))
        ) : (
          <span className='text-body-md text-[var(--color-neutral-500)]'>
            Sin alergias
          </span>
        )}
      </div>

      {/* Anotaciones */}
      <p className='absolute left-[18.375rem] top-[21rem] text-[0.75rem] leading-[1rem] font-medium text-[#8A95A1]'>
        Anotaciones:
      </p>
      <p className='absolute left-[25.5625rem] top-[21rem] text-body-md text-[var(--color-neutral-900)] w-[24rem]'>
        {anotaciones || 'Sin anotaciones'}
      </p>

      {/* Consentimientos */}
      <p className='absolute left-[18.375rem] top-[25.5rem] text-[0.75rem] leading-[1rem] font-medium text-[#8A95A1]'>
        Consentimientos:
      </p>

      <ResumenItem
        label='Tratamiento de datos personales'
        checked={true}
        top='25.5rem'
      />
      <ResumenItem
        label='Consentimiento de uso de imagen'
        checked={Boolean(marketing)}
        negative
        top='27.625rem'
      />
      <ResumenItem
        label='Marketing y RRSS'
        checked={Boolean(marketing)}
        negative
        top='29.75rem'
      />
      <ResumenItem
        label='Comunicación SMS/WPP'
        checked={Boolean(recordatorios)}
        top='31.875rem'
      />
    </>
  )
}

function ResumenItem({
  label,
  checked,
  negative,
  top
}: {
  label: string
  checked: boolean
  negative?: boolean
  top: string
}) {
  const showCheck = checked && !negative
  const showCancel = !checked || negative

  return (
    <div
      className='absolute left-[25.5625rem] flex items-center gap-2'
      style={{ top }}
    >
      {showCheck ? (
        <MD3Icon
          name='CheckCircleRounded'
          size='lg'
          className='text-[var(--color-brand-500)]'
        />
      ) : (
        <MD3Icon
          name='CancelRounded'
          size='lg'
          className='text-[var(--color-neutral-900)]'
        />
      )}
      <span className='text-body-md text-[var(--color-neutral-900)]'>
        {label}
      </span>
    </div>
  )
}
