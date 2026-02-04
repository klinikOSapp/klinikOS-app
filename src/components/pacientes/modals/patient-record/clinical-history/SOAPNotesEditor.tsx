'use client'

import type { VisitSOAPNotes } from '@/context/AppointmentsContext'

type SOAPField = 'subjective' | 'objective' | 'assessment' | 'plan'

type SOAPNotesEditorProps = {
  notes: VisitSOAPNotes | undefined
  isEditing: boolean
  onChange: (field: SOAPField, value: string) => void
}

// Grouped SOAP sections: S/O and A/P
const SOAP_GROUPS: Array<{
  groupKey: 'so' | 'ap'
  title: string
  description: string
  fields: Array<{
    key: SOAPField
    label: string
    placeholder: string
  }>
}> = [
  {
    groupKey: 'so',
    title: 'S/O',
    description: 'Subjetivo / Objetivo',
    fields: [
      {
        key: 'subjective',
        label: 'Subjetivo (¿Por qué viene?)',
        placeholder: 'Síntomas reportados por el paciente...'
      },
      {
        key: 'objective',
        label: 'Objetivo (¿Qué tiene?)',
        placeholder: 'Hallazgos clínicos observados...'
      }
    ]
  },
  {
    groupKey: 'ap',
    title: 'A/P',
    description: 'Evaluación / Plan',
    fields: [
      {
        key: 'assessment',
        label: 'Evaluación (¿Qué le hacemos?)',
        placeholder: 'Diagnóstico y evaluación...'
      },
      {
        key: 'plan',
        label: 'Plan (Tratamiento a seguir)',
        placeholder: 'Plan de tratamiento...'
      }
    ]
  }
]

export default function SOAPNotesEditor({
  notes,
  isEditing,
  onChange
}: SOAPNotesEditorProps) {
  return (
    <div className='flex flex-col gap-6'>
      {SOAP_GROUPS.map((group) => (
        <div key={group.groupKey} className='flex flex-col gap-4'>
          {/* Group header */}
          <div className='flex items-center gap-3'>
            <div className='px-2.5 py-1 bg-[var(--color-brand-50)] rounded-lg'>
              <span className="font-['Inter:SemiBold',_sans-serif] text-[var(--color-brand-700)] text-body-md">
                {group.title}
              </span>
            </div>
            <span className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-500)] text-body-sm">
              {group.description}
            </span>
          </div>

          {/* Fields in group */}
          <div className='flex flex-col gap-4 pl-1'>
            {group.fields.map((field) => (
              <div
                key={field.key}
                className='flex flex-col gap-[var(--spacing-gapsm)]'
              >
                <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-700)] text-body-sm">
                  {field.label}
                </p>
                {isEditing ? (
                  <textarea
                    value={notes?.[field.key] || ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded-lg px-3 py-2 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[4.5rem] transition-colors"
                  />
                ) : notes?.[field.key] ? (
                  <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm whitespace-pre-wrap bg-[var(--color-neutral-50)] px-3 py-2 rounded-lg">
                    {notes[field.key]}
                  </p>
                ) : (
                  <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-body-sm italic">
                    Sin información
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Last updated info */}
      {notes?.updatedAt && (
        <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-label-sm border-t border-[var(--color-neutral-200)] pt-3 mt-2">
          Última actualización:{' '}
          {new Date(notes.updatedAt).toLocaleString('es-ES')}
          {notes.updatedBy && ` por ${notes.updatedBy}`}
        </p>
      )}
    </div>
  )
}
