'use client'

import { SelectInput, TextInput, ToggleInput } from './AddPatientInputs'

type Props = {
  recordatorios: boolean
  onChangeRecordatorios: (v: boolean) => void
  marketing: boolean
  onChangeMarketing: (v: boolean) => void
  phonePrefix?: string
  onChangePhonePrefix?: (v: string) => void
  telefono?: string
  onChangeTelefono?: (v: string) => void
  email?: string
  onChangeEmail?: (v: string) => void
  emergencyName?: string
  onChangeEmergencyName?: (v: string) => void
  emergencyPhone?: string
  onChangeEmergencyPhone?: (v: string) => void
  emergencyEmail?: string
  onChangeEmergencyEmail?: (v: string) => void
  referidoPor?: string
  onChangeReferidoPor?: (v: string) => void
}

export default function AddPatientStepContacto({
  recordatorios,
  onChangeRecordatorios,
  marketing,
  onChangeMarketing,
  phonePrefix = '+34',
  onChangePhonePrefix,
  telefono,
  onChangeTelefono,
  email,
  onChangeEmail,
  emergencyName,
  onChangeEmergencyName,
  emergencyPhone,
  onChangeEmergencyPhone,
  emergencyEmail,
  onChangeEmergencyEmail,
  referidoPor,
  onChangeReferidoPor
}: Props) {
  return (
    <div className='ml-[18.375rem] inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-full overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Teléfono
        </div>
        <div className='flex gap-3 w-full'>
          <div className='w-20'>
            <SelectInput
              placeholder='+34'
              value={phonePrefix}
              onChange={onChangePhonePrefix}
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
              placeholder='612 345 678'
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
          placeholder='ejemplo@correo.com'
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

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Contacto emergencia
        </div>
        <div className='grid grid-cols-1 gap-4'>
          <div>
            <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>
              Nombre
            </div>
            <TextInput
              placeholder='Value'
              value={emergencyName}
              onChange={onChangeEmergencyName}
            />
          </div>
          <div>
            <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>
              Teléfono de contacto
            </div>
            <TextInput
              placeholder='Value'
              value={emergencyPhone}
              onChange={onChangeEmergencyPhone}
            />
          </div>
          {emergencyEmail !== undefined && (
            <div>
              <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>
                Email
              </div>
              <TextInput
                placeholder='persona@ejemplo.com'
                value={emergencyEmail}
                onChange={onChangeEmergencyEmail}
              />
            </div>
          )}
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Referido por
        </div>
        <TextInput
          placeholder='Nombre de quien refirió al paciente'
          value={referidoPor}
          onChange={onChangeReferidoPor}
        />
      </div>
    </div>
  )
}
