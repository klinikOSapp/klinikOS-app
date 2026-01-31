'use client'

import React from 'react'
import type { VisitSOAPNotes } from '@/context/AppointmentsContext'

type SOAPField = 'subjective' | 'objective' | 'assessment' | 'plan'

type SOAPNotesEditorProps = {
  notes: VisitSOAPNotes | undefined
  isEditing: boolean
  onChange: (field: SOAPField, value: string) => void
}

const SOAP_FIELDS: Array<{
  key: SOAPField
  title: string
  description: string
  placeholder: string
}> = [
  {
    key: 'subjective',
    title: 'Subjetivo',
    description: '¿Por qué viene?',
    placeholder: 'Síntomas reportados por el paciente...'
  },
  {
    key: 'objective',
    title: 'Objetivo',
    description: '¿Qué tiene?',
    placeholder: 'Hallazgos clínicos observados...'
  },
  {
    key: 'assessment',
    title: 'Evaluación',
    description: '¿Qué le hacemos?',
    placeholder: 'Diagnóstico y evaluación...'
  },
  {
    key: 'plan',
    title: 'Plan',
    description: 'Tratamiento a seguir',
    placeholder: 'Plan de tratamiento...'
  }
]

export default function SOAPNotesEditor({
  notes,
  isEditing,
  onChange
}: SOAPNotesEditorProps) {
  return (
    <div className='flex flex-col gap-5'>
      {SOAP_FIELDS.map((field) => (
        <div key={field.key} className='flex flex-col gap-[var(--spacing-gapsm)]'>
          <div className='flex flex-col'>
            <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-md">
              {field.title}
            </p>
            <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-label-sm">
              {field.description}
            </p>
          </div>
          {isEditing ? (
            <textarea
              value={notes?.[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded-lg px-3 py-2 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[4.5rem] transition-colors"
            />
          ) : notes?.[field.key] ? (
            <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-700)] text-body-sm whitespace-pre-wrap">
              {notes[field.key]}
            </p>
          ) : (
            <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-body-sm italic">
              Sin información
            </p>
          )}
        </div>
      ))}
      
      {/* Last updated info */}
      {notes?.updatedAt && (
        <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-label-sm">
          Última actualización: {new Date(notes.updatedAt).toLocaleString('es-ES')}
          {notes.updatedBy && ` por ${notes.updatedBy}`}
        </p>
      )}
    </div>
  )
}
