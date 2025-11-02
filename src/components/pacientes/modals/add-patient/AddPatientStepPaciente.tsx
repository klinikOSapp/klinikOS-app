'use client'

import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import React from 'react'
import DatePicker from './AddPatientDatePicker'
import { SelectInput, TextInput } from './AddPatientInputs'

type Props = {
  nombre?: string
  onChangeNombre?: (v: string) => void
  apellidos?: string
  onChangeApellidos?: (v: string) => void
  fechaNacimiento?: Date | null
  onChangeFechaNacimiento?: (d: Date) => void
  dni?: string
  onChangeDni?: (v: string) => void
  sexo?: string
  onChangeSexo?: (v: string) => void
  idioma?: string
  onChangeIdioma?: (v: string) => void
}

export default function AddPatientStepPaciente({
  nombre,
  onChangeNombre,
  apellidos,
  onChangeApellidos,
  fechaNacimiento,
  onChangeFechaNacimiento,
  dni,
  onChangeDni,
  sexo,
  onChangeSexo,
  idioma,
  onChangeIdioma
}: Props) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const lastUrlRef = React.useRef<string | null>(null)

  const setPreviewFromFile = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    lastUrlRef.current = url
    setPreviewUrl(url)
  }, [])

  React.useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    }
  }, [])

  return (
    <>
      <div className='left-[18.375rem] top-[10rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        Imagen del paciente
      </div>
      <div className='left-[18.375rem] top-[17.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        Nombre
      </div>
      <div className='left-[18.375rem] top-[23.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        Apellidos
      </div>
      <div className='left-[18.375rem] top-[47.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        DNI/NIE
      </div>
      <div className='left-[18.375rem] top-[29.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        Fecha de nacimiento
      </div>
      <div className='left-[18.375rem] top-[35.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        Sexo biológico
      </div>
      <div className='left-[18.375rem] top-[41.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
        Idioma preferido
      </div>
      <div className='w-40 left-[18.375rem] top-[11.75rem] absolute justify-start text-[var(--color-neutral-500)] text-label-sm font-medium font-sans'>
        Toma una fotografía o súbela desde tu dispositivo
      </div>

      <div className='left-[30.6875rem] top-[10rem] absolute'>
        <AvatarImageDropdown
          previewUrl={previewUrl ?? undefined}
          onCaptureFromCamera={setPreviewFromFile}
          onUploadFromDevice={setPreviewFromFile}
          triggerClassName='w-20 h-20 bg-[var(--color-neutral-200)] rounded-lg outline-[0.0625rem] outline-offset-[-0.0625rem] outline-[var(--color-brand-300)] overflow-hidden grid place-items-center'
          triggerIconClassName='w-8 h-8'
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[17.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <TextInput
          placeholder='Nombre'
          required
          value={nombre}
          onChange={onChangeNombre}
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[23.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <TextInput
          placeholder='Apellidos'
          required
          value={apellidos}
          onChange={onChangeApellidos}
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[29.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <DatePicker
          value={fechaNacimiento ?? undefined}
          onChange={onChangeFechaNacimiento}
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[35.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <SelectInput
          placeholder='Selecciona sexo'
          value={sexo ?? ''}
          onChange={onChangeSexo}
          options={[
            { label: 'Femenino', value: 'femenino' },
            { label: 'Masculino', value: 'masculino' },
            { label: 'Otro / Prefiero no decir', value: 'otro' }
          ]}
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[41.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <SelectInput
          placeholder='Selecciona idioma'
          value={idioma ?? ''}
          onChange={onChangeIdioma}
          options={[
            { label: 'Español', value: 'es' },
            { label: 'Francés', value: 'fr' },
            { label: 'Inglés', value: 'en' },
            { label: 'Valenciano', value: 'va' }
          ]}
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[47.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <TextInput
          placeholder='DNI/NIE'
          required
          value={dni}
          onChange={onChangeDni}
        />
      </div>
    </>
  )
}
