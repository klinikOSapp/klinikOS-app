'use client'

import CancelRounded from '@mui/icons-material/CancelRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlined'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import { type AllergyEntry } from './AddPatientStepSalud'

type AllergySeverity = 'leve' | 'moderada' | 'grave' | 'extrema'

const severityColors: Record<AllergySeverity, { bg: string; text: string }> = {
  leve: {
    bg: 'bg-[var(--color-warning-100)]',
    text: 'text-[var(--color-warning-700)]'
  },
  moderada: {
    bg: 'bg-[var(--color-warning-200)]',
    text: 'text-[var(--color-warning-800)]'
  },
  grave: {
    bg: 'bg-[var(--color-error-100)]',
    text: 'text-[var(--color-error-700)]'
  },
  extrema: {
    bg: 'bg-[var(--color-error-200)]',
    text: 'text-[var(--color-error-800)]'
  }
}

const severityLabels: Record<AllergySeverity, string> = {
  leve: 'L',
  moderada: 'M',
  grave: 'G',
  extrema: 'E'
}

type Props = {
  nombre?: string
  apellidos?: string
  email?: string
  telefono?: string
  alergias?: string[]
  alergiasConSeveridad?: AllergyEntry[]
  anotaciones?: string
  recordatorios?: boolean
  marketing?: boolean
}

export default function AddPatientStepResumen({
  nombre,
  apellidos,
  email,
  telefono,
  alergias = [],
  alergiasConSeveridad = [],
  anotaciones,
  recordatorios,
  marketing
}: Props) {
  const fullName =
    [nombre, apellidos].filter(Boolean).join(' ').trim() || 'Lucia López Cano'
  return (
    <>
      {/* Avatar + Info del Paciente */}
      <div className='absolute left-[18.375rem] top-[0rem] flex items-center gap-6'>
        <div className='size-24 rounded-full bg-[var(--color-neutral-700)]' />
        <div className='flex flex-col gap-2 w-[14.25rem]'>
          <p className='text-[1.5rem] leading-[2rem] font-medium text-[var(--color-neutral-900)]'>
            {fullName}
          </p>
          <div className='flex items-center gap-2'>
            <MailOutlineRounded
              style={{
                width: 20,
                height: 20,
                color: 'var(--color-neutral-900)'
              }}
            />
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              {email || 'Email no proporcionado'}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <PhoneRounded
              style={{
                width: 20,
                height: 20,
                color: 'var(--color-neutral-900)'
              }}
            />
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              {telefono || 'Teléfono no proporcionado'}
            </p>
          </div>
        </div>
      </div>

      {/* Alergias */}
      <p className='absolute left-[18.375rem] top-[8.25rem] text-[0.75rem] leading-[1rem] font-medium text-[#8A95A1]'>
        Alergias:
      </p>
      <div className='absolute left-[25.5625rem] top-[8rem] flex flex-wrap items-center gap-2 max-w-[24rem]'>
        {alergiasConSeveridad.length > 0 ? (
          alergiasConSeveridad.map((a) => {
            const colors = severityColors[a.severity]
            return (
              <span
                key={a.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${colors.bg} ${colors.text} text-[0.75rem] leading-[1rem] font-medium`}
                title={`Severidad: ${a.severity}`}
              >
                {a.name}
                <span className='opacity-70'>
                  ({severityLabels[a.severity]})
                </span>
              </span>
            )
          })
        ) : alergias.length > 0 ? (
          alergias.map((a) => (
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
      <p className='absolute left-[18.375rem] top-[11rem] text-[0.75rem] leading-[1rem] font-medium text-[#8A95A1]'>
        Anotaciones:
      </p>
      <p className='absolute left-[25.5625rem] top-[11rem] text-body-md text-[var(--color-neutral-900)] w-[24rem]'>
        {anotaciones || 'Sin anotaciones'}
      </p>

      {/* Consentimientos */}
      <p className='absolute left-[18.375rem] top-[15.5rem] text-[0.75rem] leading-[1rem] font-medium text-[#8A95A1]'>
        Consentimientos:
      </p>

      <ResumenItem
        label='Tratamiento de datos personales'
        checked={true}
        top='15.5rem'
      />
      <ResumenItem
        label='Consentimiento de uso de imagen'
        checked={Boolean(marketing)}
        negative
        top='17.625rem'
      />
      <ResumenItem
        label='Marketing y RRSS'
        checked={Boolean(marketing)}
        negative
        top='19.75rem'
      />
      <ResumenItem
        label='Comunicación SMS/WPP'
        checked={Boolean(recordatorios)}
        top='21.875rem'
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

  return (
    <div
      className='absolute left-[25.5625rem] flex items-center gap-2'
      style={{ top }}
    >
      {showCheck ? (
        <CheckCircleRounded
          style={{ width: 24, height: 24, color: 'var(--color-brand-500)' }}
        />
      ) : (
        <CancelRounded
          style={{ width: 24, height: 24, color: 'var(--color-neutral-900)' }}
        />
      )}
      <span className='text-body-md text-[var(--color-neutral-900)]'>
        {label}
      </span>
    </div>
  )
}
