'use client'

import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import { SelectInput, TextInput } from './AddPatientInputs'

export default function AddPatientStepContacto() {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Teléfono</div>
        <div className='flex gap-3 w-full'>
          <div className='relative w-20'>
            <select className='appearance-none w-full h-12 rounded-lg bg-[var(--color-neutral-50)] outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] pl-2.5 pr-8 text-body-md text-[var(--color-neutral-900)]'>
              <option>+34</option>
            </select>
            <KeyboardArrowDownRounded className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-700)]' />
          </div>
          <div className='flex-1'>
            <TextInput placeholder='Value' required />
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Email</div>
        <TextInput placeholder='Example@example.com' required />
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Contacto</div>
        <div className='grid grid-cols-2 gap-x-12 gap-y-4'>
          {['Whatsapp', 'SMS', 'Email', 'Llamada'].map((label) => (
            <label key={label} className='flex items-center gap-3'>
              <input type='checkbox' checked readOnly className='size-5 accent-[var(--color-brand-500)]' />
              <span className='text-body-md text-[var(--color-neutral-900)]'>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Recordatorios</div>
        <div className='flex items-start gap-4'>
          <div className='w-10 h-6 rounded-[70px] bg-[var(--color-brand-500)] relative shrink-0'>
            <div className='absolute w-[18px] h-[18px] rounded-full bg-[var(--color-brand-50)] right-[3px] top-[3px]' />
          </div>
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>Acepta comunicación SMS/WPP</p>
            <p className='text-label-sm text-[var(--color-neutral-600)]'>Se usará para recordatorios</p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Consentimiento</div>
        <div className='flex items-start gap-4'>
          <div className='w-10 h-6 rounded-[70px] bg-[var(--color-brand-500)] relative shrink-0'>
            <div className='absolute w-[18px] h-[18px] rounded-full bg-[var(--color-brand-50)] right-[3px] top-[3px]' />
          </div>
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>Marketing y RRSS</p>
            <p className='text-label-sm text-[var(--color-neutral-600)]'>Se enviaran promociones y novedades</p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Términos y privacidad</div>
        <div className='flex items-start gap-4'>
          <div className='w-10 h-6 rounded-[70px] bg-[var(--color-brand-500)] relative shrink-0'>
            <div className='absolute w-[18px] h-[18px] rounded-full bg-[var(--color-brand-50)] right-[3px] top-[3px]' />
          </div>
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>Términos de uso y privacidad</p>
            <p className='text-label-sm underline text-[var(--color-brand-500)]'>Ver términos de uso</p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>Contacto emergencia</div>
        <div className='grid grid-cols-1 gap-4'>
          <div>
            <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>Nombre</div>
            <TextInput placeholder='Value' />
          </div>
          <div>
            <div className='text-title-sm text-[var(--color-neutral-900)] mb-2'>Teléfono de contacto</div>
            <TextInput placeholder='Value' />
          </div>
        </div>
      </div>
    </div>
  )
}


