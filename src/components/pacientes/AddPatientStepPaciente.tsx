'use client'

import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import DatePicker from './AddPatientDatePicker'
import AvatarImageDropdown from './AvatarImageDropdown'

export default function AddPatientStepPaciente() {
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
          triggerClassName='w-20 h-20 bg-[var(--color-neutral-200)] rounded-lg outline-[0.0625rem] outline-offset-[-0.0625rem] outline-[var(--color-brand-300)] overflow-hidden grid place-items-center'
          triggerIconClassName='w-8 h-8'
        />
      </div>

      <div className='w-80 left-[30.6875rem] top-[17.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <div className='self-stretch flex flex-col justify-start items-start gap-1'>
          <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
            <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
              Value
            </div>
            <span className='text-[var(--color-error-600)] text-body-md leading-none grid place-items-center'>
              *
            </span>
          </div>
        </div>
      </div>

      <div className='w-80 left-[30.6875rem] top-[23.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <div className='self-stretch flex flex-col justify-start items-start gap-1'>
          <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
            <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
              Value
            </div>
            <span className='text-[var(--color-error-600)] text-body-md leading-none grid place-items-center'>
              *
            </span>
          </div>
        </div>
      </div>

      <div className='w-80 left-[30.6875rem] top-[29.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <DatePicker />
      </div>

      <div className='w-80 left-[30.6875rem] top-[35.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <div className='self-stretch flex flex-col justify-start items-start gap-1'>
          <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
            <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
              Value
            </div>
            <KeyboardArrowDownRounded className='w-6 h-6' />
          </div>
        </div>
      </div>

      <div className='w-80 left-[30.6875rem] top-[41.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
        <div className='self-stretch flex flex-col justify-start items-start gap-1'>
          <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
            <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
              Value
            </div>
            <KeyboardArrowDownRounded className='w-6 h-6' />
          </div>
        </div>
      </div>
    </>
  )
}
