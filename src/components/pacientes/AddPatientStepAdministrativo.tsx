'use client'

import { SelectInput, TextArea, TextInput } from './AddPatientInputs'

export default function AddPatientStepAdministrativo() {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Profesional de referencia</div>
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Canal de captación</div>
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Notas</div>
        <TextArea placeholder='Value' />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Cobertura</div>
        <SelectInput />
        <TextInput placeholder='Compañía' />
        <TextInput placeholder='Número de póliza' />
        <TextInput placeholder='Vencimiento' />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Dirección fiscal</div>
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
          <div className='w-10 h-6 rounded-[70px] bg-[var(--color-brand-500)] relative shrink-0'>
            <div className='absolute w-[18px] h-[18px] rounded-full bg-[var(--color-brand-50)] right-[3px] top-[3px]' />
          </div>
          <span className='text-body-md text-[var(--color-neutral-900)]'>Facturar a empresa</span>
        </div>
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Pago</div>
        <SelectInput />
        <SelectInput />
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-body-sm text-[var(--color-neutral-900)]'>Firma</div>
        <div className='w-20 h-20 rounded-lg border border-[var(--color-brand-500)] bg-[var(--color-neutral-200)]' />
      </div>
    </div>
  )
}


