'use client'

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
  terminos?: boolean
}

export default function AddPatientStepResumen({
  nombre,
  apellidos,
  email,
  telefono,
  alergias = [],
  anotaciones,
  recordatorios,
  marketing,
  terminos
}: Props) {
  const fullName =
    [nombre, apellidos].filter(Boolean).join(' ').trim() || 'Nombre y apellidos'
  return (
    <div className='left-[14.3125rem] top-[6rem] absolute w-[35.5rem]'>
      <div className='flex items-center gap-6'>
        <div className='size-24 rounded-full bg-[var(--color-neutral-600)]' />
        <div className='flex flex-col gap-2'>
          <p className='text-title-lg text-[var(--color-neutral-900)]'>
            {fullName}
          </p>
          {email ? (
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              {email}
            </p>
          ) : null}
          {telefono ? (
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              {telefono}
            </p>
          ) : null}
        </div>
      </div>

      <div className='mt-8 grid grid-cols-[160px_1fr] gap-y-4 items-start'>
        <div className='text-label-sm text-[var(--color-neutral-500)]'>
          Alergias:
        </div>
        <div className='flex gap-2'>
          {alergias.length > 0 ? (
            alergias.map((a) => (
              <span
                key={a}
                className='inline-flex items-center px-2 py-1 rounded-full bg-[var(--color-error-200)] text-[var(--color-error-600)] text-label-sm'
              >
                {a}
              </span>
            ))
          ) : (
            <span className='text-body-md text-[var(--color-neutral-500)]'>
              —
            </span>
          )}
        </div>

        <div className='text-label-sm text-[var(--color-neutral-500)]'>
          Anotaciones:
        </div>
        <div className='text-body-md text-[var(--color-neutral-900)]'>
          {anotaciones || '—'}
        </div>

        <div className='text-label-sm text-[var(--color-neutral-500)]'>
          Consentimientos:
        </div>
        <div className='flex flex-col gap-2'>
          <ResumenItem label='Tratamiento de datos personales' checked={true} />
          <ResumenItem
            label='Consentimiento de uso de imagen'
            checked={Boolean(marketing)}
            negative
          />
          <ResumenItem
            label='Marketing y RRSS'
            checked={Boolean(marketing)}
            negative
          />
          <ResumenItem
            label='Comunicación SMS/WPP'
            checked={Boolean(recordatorios)}
          />
          <ResumenItem
            label='Términos de usos y privacidad'
            checked={Boolean(terminos)}
          />
        </div>
      </div>
    </div>
  )
}

function ResumenItem({
  label,
  checked,
  negative
}: {
  label: string
  checked: boolean
  negative?: boolean
}) {
  const icon = checked && !negative ? '✔︎' : '✖︎'
  const color =
    checked && !negative
      ? 'text-[var(--color-brand-500)]'
      : 'text-[var(--color-neutral-900)]'
  return (
    <div className='flex items-center gap-2'>
      <span className={color}>{icon}</span>
      <span className='text-body-md text-[var(--color-neutral-900)]'>
        {label}
      </span>
    </div>
  )
}
