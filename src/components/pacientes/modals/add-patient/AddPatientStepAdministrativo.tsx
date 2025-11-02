'use client'

import {
  SelectInput,
  TextArea,
  TextInput,
  ToggleInput
} from './AddPatientInputs'

type Props = {
  facturaEmpresa: boolean
  onChangeFacturaEmpresa: (v: boolean) => void
  notas?: string
  onChangeNotas?: (v: string) => void
}

export default function AddPatientStepAdministrativo({
  facturaEmpresa,
  onChangeFacturaEmpresa,
  notas,
  onChangeNotas
}: Props) {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Profesional de referencia
        </div>
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Canal de captación
        </div>
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Notas
        </div>
        <TextArea placeholder='Value' value={notas} onChange={onChangeNotas} />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Cobertura
        </div>
        <SelectInput />
        <TextInput placeholder='Compañía' />
        <TextInput placeholder='Número de póliza' />
        <TextInput placeholder='Vencimiento' />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Dirección fiscal
        </div>
        <TextInput placeholder='Calle' />
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput placeholder='Número' />
          <TextInput placeholder='Piso' />
        </div>
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput placeholder='Ciudad' />
          <TextInput placeholder='Provincia' />
        </div>
        <SelectInput />
        <div className='flex items-center gap-4'>
          <ToggleInput
            ariaLabel='Facturar a empresa'
            checked={facturaEmpresa}
            onChange={onChangeFacturaEmpresa}
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Facturar a empresa
          </span>
        </div>
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Pago
        </div>
        <SelectInput />
        <SelectInput />
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-body-sm text-[var(--color-neutral-900)]'>
          Firma
        </div>
        <div className='w-20 h-20 rounded-lg border border-[var(--color-brand-500)] bg-[var(--color-neutral-200)]' />
      </div>
    </div>
  )
}
