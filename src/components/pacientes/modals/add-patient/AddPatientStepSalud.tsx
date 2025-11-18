'use client'

import { SelectInput, TextArea, ToggleInput } from './AddPatientInputs'

type Props = {
  embarazo: boolean
  onChangeEmbarazo: (v: boolean) => void
  tabaquismo: boolean
  onChangeTabaquismo: (v: boolean) => void
  alergiasText?: string
  onChangeAlergiasText?: (v: string) => void
  medicamentosText?: string
  onChangeMedicamentosText?: (v: string) => void
  motivoConsulta?: string
  onChangeMotivoConsulta?: (v: string) => void
  fearScale?: string
  onChangeFearScale?: (v: string) => void
  mobilityRestricted?: boolean
  onChangeMobilityRestricted?: (v: boolean) => void
  needsInterpreter?: boolean
  onChangeNeedsInterpreter?: (v: boolean) => void
}

export default function AddPatientStepSalud({
  embarazo,
  onChangeEmbarazo,
  tabaquismo,
  onChangeTabaquismo,
  alergiasText,
  onChangeAlergiasText,
  medicamentosText,
  onChangeMedicamentosText,
  motivoConsulta,
  onChangeMotivoConsulta,
  fearScale,
  onChangeFearScale,
  mobilityRestricted,
  onChangeMobilityRestricted,
  needsInterpreter,
  onChangeNeedsInterpreter
}: Props) {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Alergias relevantes
        </div>
        <TextArea placeholder='Value' value={alergiasText} onChange={onChangeAlergiasText} />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Medicamentos
        </div>
        <TextArea
          placeholder='Value'
          value={medicamentosText}
          onChange={onChangeMedicamentosText}
        />
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
        <SelectInput />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Motivo de consulta
        </div>
        <TextArea placeholder='Value' value={motivoConsulta} onChange={onChangeMotivoConsulta} />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Miedo al dentista
        </div>
        <SelectInput
          placeholder='1 -10'
          value={fearScale ?? ''}
          onChange={onChangeFearScale}
          options={Array.from({ length: 10 }).map((_, idx) => ({
            label: String(idx + 1),
            value: String(idx + 1)
          }))}
        />
      </div>

      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Accesibilidad
        </div>
        <label className='flex items-center gap-3'>
          <input
            type='checkbox'
            checked={mobilityRestricted}
            onChange={(e) => onChangeMobilityRestricted?.(e.target.checked)}
            className='size-5 accent-[var(--color-brand-500)]'
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Movilidad reducida
          </span>
        </label>
        <label className='flex items-center gap-3'>
          <input
            type='checkbox'
            checked={needsInterpreter}
            onChange={(e) => onChangeNeedsInterpreter?.(e.target.checked)}
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
