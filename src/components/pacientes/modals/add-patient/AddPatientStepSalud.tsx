'use client'

import { SelectInput, TextArea, ToggleInput } from './AddPatientInputs'

type Props = {
  embarazo: boolean
  onChangeEmbarazo: (v: boolean) => void
  tabaquismo: boolean
  onChangeTabaquismo: (v: boolean) => void
  alergiasText?: string
  onChangeAlergiasText?: (v: string) => void
  antecedentes?: string
  onChangeAntecedentes?: (v: string) => void
  miedo?: string
  onChangeMiedo?: (v: string) => void
}

export default function AddPatientStepSalud({
  embarazo,
  onChangeEmbarazo,
  tabaquismo,
  onChangeTabaquismo,
  alergiasText,
  onChangeAlergiasText,
  antecedentes,
  onChangeAntecedentes,
  miedo,
  onChangeMiedo
}: Props) {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Alergias relevantes
        </div>
        <TextArea
          placeholder='Value'
          value={alergiasText}
          onChange={onChangeAlergiasText}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Medicamentos
        </div>
        <TextArea placeholder='Value' />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='flex items-start gap-4'>
          <ToggleInput
            ariaLabel='Embarazo'
            checked={embarazo}
            onChange={onChangeEmbarazo}
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Embarazo
          </span>
        </div>
        <div className='flex items-start gap-4'>
          <ToggleInput
            ariaLabel='Tabaquismo'
            checked={tabaquismo}
            onChange={onChangeTabaquismo}
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Tabaquismo
          </span>
        </div>
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Antecedentes
        </div>
        <SelectInput
          placeholder='Selecciona antecedentes'
          value={antecedentes ?? ''}
          onChange={onChangeAntecedentes}
          options={[
            { label: 'Diabetes', value: 'diabetes' },
            { label: 'Hipertensión', value: 'hipertension' },
            { label: 'Cardiopatía', value: 'cardiopatia' },
            { label: 'Alergias medicamentos', value: 'alergias' },
            { label: 'Ninguno', value: 'ninguno' }
          ]}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Motivo de consulta
        </div>
        <TextArea placeholder='Value' />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Miedo al dentista
        </div>
        <SelectInput
          placeholder='Selecciona nivel (1-10)'
          value={miedo ?? ''}
          onChange={onChangeMiedo}
          options={[
            { label: '1 - Ningún miedo', value: '1' },
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
            { label: '5 - Miedo moderado', value: '5' },
            { label: '6', value: '6' },
            { label: '7', value: '7' },
            { label: '8', value: '8' },
            { label: '9', value: '9' },
            { label: '10 - Miedo extremo', value: '10' }
          ]}
        />
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Accesibilidad
        </div>
        <label className='flex items-center gap-3'>
          <input
            type='checkbox'
            checked
            readOnly
            className='size-5 accent-[var(--color-brand-500)]'
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Movilidad reducida
          </span>
        </label>
        <label className='flex items-center gap-3'>
          <input
            type='checkbox'
            checked
            readOnly
            className='size-5 accent-[var(--color-brand-500)]'
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Interprete
          </span>
        </label>
      </div>
    </div>
  )
}
