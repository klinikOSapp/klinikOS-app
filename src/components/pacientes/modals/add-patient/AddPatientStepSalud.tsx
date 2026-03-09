'use client'

import CloseRounded from '@mui/icons-material/CloseRounded'
import WarningRounded from '@mui/icons-material/WarningRounded'
import React from 'react'
import {
  SelectInput,
  TextArea,
  TextInput,
  ToggleInput
} from './AddPatientInputs'

export type AllergySeverity = 'leve' | 'moderada' | 'grave' | 'extrema'

export type AllergyEntry = {
  id: string
  name: string
  severity: AllergySeverity
  notes?: string
}

const severityColors: Record<
  AllergySeverity,
  { bg: string; text: string; border: string }
> = {
  leve: {
    bg: 'bg-[var(--color-warning-100)]',
    text: 'text-[var(--color-warning-700)]',
    border: 'border-[var(--color-warning-300)]'
  },
  moderada: {
    bg: 'bg-[var(--color-warning-200)]',
    text: 'text-[var(--color-warning-800)]',
    border: 'border-[var(--color-warning-400)]'
  },
  grave: {
    bg: 'bg-[var(--color-error-100)]',
    text: 'text-[var(--color-error-700)]',
    border: 'border-[var(--color-error-400)]'
  },
  extrema: {
    bg: 'bg-[var(--color-error-200)]',
    text: 'text-[var(--color-error-800)]',
    border: 'border-[var(--color-error-600)]'
  }
}

const severityLabels: Record<AllergySeverity, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  grave: 'Grave',
  extrema: 'Extrema'
}

type Props = {
  embarazo: boolean
  onChangeEmbarazo: (v: boolean) => void
  tabaquismo: boolean
  onChangeTabaquismo: (v: boolean) => void
  alergias?: AllergyEntry[]
  onChangeAlergias?: (v: AllergyEntry[]) => void
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
  alergias = [],
  onChangeAlergias,
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
  const [newAllergyName, setNewAllergyName] = React.useState('')
  const [newAllergySeverity, setNewAllergySeverity] =
    React.useState<AllergySeverity>('moderada')

  const handleAddAllergy = () => {
    if (!newAllergyName.trim()) return
    const newAllergy: AllergyEntry = {
      id: `alg-new-${Date.now()}`,
      name: newAllergyName.trim(),
      severity: newAllergySeverity
    }
    onChangeAlergias?.([...alergias, newAllergy])
    setNewAllergyName('')
    setNewAllergySeverity('moderada')
  }

  const handleRemoveAllergy = (id: string) => {
    onChangeAlergias?.(alergias.filter((a) => a.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAllergy()
    }
  }

  return (
    <div className='ml-[18.375rem] inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-full overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-3 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Alergias relevantes
        </div>

        {alergias.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {alergias.map((allergy) => {
              const colors = severityColors[allergy.severity]
              return (
                <div
                  key={allergy.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colors.bg} ${colors.border}`}
                >
                  <span className={`text-body-sm font-medium ${colors.text}`}>
                    {allergy.name}
                  </span>
                  <span className={`text-label-sm ${colors.text} opacity-80`}>
                    ({severityLabels[allergy.severity]})
                  </span>
                  <button
                    type='button'
                    onClick={() => handleRemoveAllergy(allergy.id)}
                    className={`p-0.5 rounded-full hover:bg-black/10 ${colors.text}`}
                    aria-label={`Eliminar alergia ${allergy.name}`}
                  >
                    <CloseRounded style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className='flex gap-2 items-end'>
          <div className='flex-1'>
            <TextInput
              placeholder='Nombre de la alergia (ej: Penicilina)'
              value={newAllergyName}
              onChange={setNewAllergyName}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className='w-32'>
            <SelectInput
              placeholder='Severidad'
              value={newAllergySeverity}
              onChange={(v) => setNewAllergySeverity(v as AllergySeverity)}
              options={[
                { label: 'Leve', value: 'leve' },
                { label: 'Moderada', value: 'moderada' },
                { label: 'Grave', value: 'grave' },
                { label: 'Extrema', value: 'extrema' }
              ]}
            />
          </div>
          <button
            type='button'
            onClick={handleAddAllergy}
            disabled={!newAllergyName.trim()}
            className='h-12 px-4 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-brand-900)] text-body-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-brand-400)] transition-colors'
          >
            Añadir
          </button>
        </div>

        {alergias.some(
          (a) => a.severity === 'grave' || a.severity === 'extrema'
        ) && (
          <div className='flex items-center gap-2 p-3 rounded-lg bg-[var(--color-error-50)] border border-[var(--color-error-200)]'>
            <WarningRounded
              style={{ width: 20, height: 20, color: 'var(--color-error-600)' }}
            />
            <span className='text-body-sm text-[var(--color-error-700)]'>
              Este paciente tiene alergias graves o extremas. Se mostrará una
              alerta visible en su ficha.
            </span>
          </div>
        )}
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
          Motivo de consulta
        </div>
        <TextArea
          placeholder='Value'
          value={motivoConsulta}
          onChange={onChangeMotivoConsulta}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Miedo al dentista
        </div>
        <SelectInput
          placeholder='Selecciona nivel (1-10)'
          value={fearScale ?? ''}
          onChange={onChangeFearScale}
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
