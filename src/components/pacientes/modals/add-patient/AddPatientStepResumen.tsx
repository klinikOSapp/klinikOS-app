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
  const consentList = [
    { label: 'Tratamiento de datos personales', value: true },
    {
      label: 'Consentimiento uso de imagen',
      value: Boolean(marketing)
    },
    {
      label: 'Marketing y redes sociales',
      value: Boolean(marketing)
    },
    {
      label: 'Comunicación SMS/WPP',
      value: Boolean(recordatorios)
    },
    {
      label: 'Términos de uso y privacidad',
      value: Boolean(terminos)
    }
  ]
  return (
    <div className='absolute left-[9.5rem] top-[5rem] w-[46rem]'>
      <div className='rounded-[1.5rem] bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] border border-[#e4e9ee] p-8 flex flex-col gap-8'>
        <div className='flex flex-wrap items-center gap-6'>
          <div className='size-24 rounded-full bg-[var(--color-neutral-600)] border-2 border-[var(--color-neutral-200)]' />
          <div className='flex flex-col gap-1 min-w-[14rem]'>
            <p className='text-title-lg text-[var(--color-neutral-900)]'>{fullName}</p>
            {email ? <p className='text-body-md text-[var(--color-neutral-600)]'>{email}</p> : null}
            {telefono ? (
              <p className='text-body-md text-[var(--color-neutral-600)]'>{telefono}</p>
            ) : null}
          </div>
        </div>

        <div className='grid gap-8 md:grid-cols-2'>
          <div className='flex flex-col gap-6'>
            <section className='space-y-2'>
              <p className='text-label-sm uppercase tracking-[0.05em] text-[var(--color-neutral-500)]'>
                Alergias
              </p>
              <div className='flex flex-wrap gap-2'>
                {alergias.length > 0 ? (
                  alergias.map((a) => (
                    <span
                      key={a}
                      className='inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-error-100)] text-[var(--color-error-600)] text-label-sm'
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className='text-body-md text-[var(--color-neutral-500)]'>—</span>
                )}
              </div>
            </section>
            <section className='space-y-2'>
              <p className='text-label-sm uppercase tracking-[0.05em] text-[var(--color-neutral-500)]'>
                Notas internas
              </p>
              <div className='rounded-xl border border-[#e4e9ee] bg-[var(--color-neutral-50)] px-3 py-2 text-body-md text-[var(--color-neutral-800)] min-h-[3rem]'>
                {anotaciones?.trim() || '—'}
              </div>
            </section>
          </div>

          <div className='space-y-4'>
            <p className='text-label-sm uppercase tracking-[0.05em] text-[var(--color-neutral-500)]'>
              Consentimientos
            </p>
            <div className='flex flex-col gap-3'>
              {consentList.map((item) => (
                <ResumenItem key={item.label} label={item.label} checked={item.value} />
              ))}
            </div>
          </div>
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
      <span className={`${color} text-label-md`}>{icon}</span>
      <span className='text-body-md text-[var(--color-neutral-900)]'>{label}</span>
    </div>
  )
}
