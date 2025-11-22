'use client'

import { SelectInput, TextInput, ToggleInput } from './AddPatientInputs'

type Props = {
  recordatorios: boolean
  onChangeRecordatorios: (v: boolean) => void
  marketing: boolean
  onChangeMarketing: (v: boolean) => void
  terminos: boolean
  onChangeTerminos: (v: boolean) => void
  telefono?: string
  onChangeTelefono?: (v: string) => void
  email?: string
  onChangeEmail?: (v: string) => void
}

export default function AddPatientStepContacto({
  recordatorios,
  onChangeRecordatorios,
  marketing,
  onChangeMarketing,
  terminos,
  onChangeTerminos,
  telefono,
  onChangeTelefono,
  email,
  onChangeEmail
}: Props) {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Teléfono
        </div>
        <div className='flex gap-3 w-full'>
          <div className='w-20'>
            <SelectInput
              placeholder='+34'
              value='+34'
              options={[
                { label: '+34', value: '+34' },
                { label: '+1', value: '+1' },
                { label: '+33', value: '+33' },
                { label: '+44', value: '+44' }
              ]}
            />
          </div>
          <div className='flex-1'>
            <TextInput
              placeholder='Value'
              required
              value={telefono}
              onChange={onChangeTelefono}
            />
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Email
        </div>
        <TextInput
          placeholder='Example@example.com'
          required
          value={email}
          onChange={onChangeEmail}
        />
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Contacto
        </div>
        <div className='grid grid-cols-2 gap-x-12 gap-y-4'>
          {['Whatsapp', 'SMS', 'Email', 'Llamada'].map((label) => (
            <label key={label} className='flex items-center gap-3'>
              <input
                type='checkbox'
                checked
                readOnly
                className='size-5 accent-[var(--color-brand-500)]'
              />
              <span className='text-body-md text-[var(--color-neutral-900)]'>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Recordatorios
        </div>
        <div className='flex items-start gap-4'>
          <ToggleInput
            ariaLabel='Recordatorios'
            checked={recordatorios}
            onChange={onChangeRecordatorios}
          />
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              Acepta comunicación SMS/WPP
            </p>
            <p className='text-label-sm text-[var(--color-neutral-600)]'>
              Se usará para recordatorios
            </p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Consentimiento
        </div>
        <div className='flex items-start gap-4'>
          <ToggleInput
            ariaLabel='Consentimiento marketing'
            checked={marketing}
            onChange={onChangeMarketing}
          />
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              Marketing y RRSS
            </p>
            <p className='text-label-sm text-[var(--color-neutral-600)]'>
              Se enviaran promociones y novedades
            </p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Términos y privacidad
        </div>
        <div className='flex items-start gap-4'>
          <ToggleInput
            ariaLabel='Términos y privacidad'
            checked={terminos}
            onChange={onChangeTerminos}
          />
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              Términos de uso y privacidad
            </p>
            <p className='text-label-sm underline text-[var(--color-brand-500)]'>
              Ver términos de uso
            </p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Contacto emergencia
        </div>
        <div className='grid grid-cols-1 gap-4'>
          <div>
            <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>
              Nombre
            </div>
            <TextInput placeholder='Value' />
          </div>
          <div>
            <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>
              Teléfono de contacto
            </div>
            <TextInput placeholder='Value' />
          </div>
        </div>
      </div>
    </div>
  )
}
