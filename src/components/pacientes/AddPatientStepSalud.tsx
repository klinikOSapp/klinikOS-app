'use client'

import { SelectInput, TextArea } from './AddPatientInputs'

export default function AddPatientStepSalud() {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Alergias relevantes</div>
        <TextArea placeholder='Value' />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Medicamentos</div>
        <TextArea placeholder='Value' />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='flex items-start gap-4'>
          <div className='w-10 h-6 rounded-[70px] bg-[var(--color-brand-500)] relative shrink-0'>
            <div className='absolute w-[18px] h-[18px] rounded-full bg-[var(--color-brand-50)] right-[3px] top-[3px]' />
          </div>
          <span className='text-body-md text-[var(--color-neutral-900)]'>Embarazo</span>
        </div>
        <div className='flex items-start gap-4'>
          <div className='w-10 h-6 rounded-[70px] bg-[var(--color-brand-500)] relative shrink-0'>
            <div className='absolute w-[18px] h-[18px] rounded-full bg-[var(--color-brand-50)] right-[3px] top-[3px]' />
          </div>
        <span className='text-body-md text-[var(--color-neutral-900)]'>Tabaquismo</span>
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Antecedentes</div>
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Motivo de consulta</div>
        <TextArea placeholder='Value' />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Miedo al dentista</div>
        <SelectInput placeholder='1 -10' />
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Accesibilidad</div>
        <label className='flex items-center gap-3'>
          <input type='checkbox' checked readOnly className='size-5 accent-[var(--color-brand-500)]' />
          <span className='text-body-md text-[var(--color-neutral-900)]'>Movilidad reducida</span>
        </label>
        <label className='flex items-center gap-3'>
          <input type='checkbox' checked readOnly className='size-5 accent-[var(--color-brand-500)]' />
          <span className='text-body-md text-[var(--color-neutral-900)]'>Interprete</span>
        </label>
      </div>
    </div>
  )
}


