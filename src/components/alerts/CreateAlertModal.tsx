'use client'

import { CloseRounded } from '@/components/icons/md3'
import {
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput
} from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import Portal from '@/components/ui/Portal'
import { useAlerts } from '@/context/AlertsContext'
import { usePatients } from '@/context/PatientsContext'
import { useEffect, useMemo, useState } from 'react'

type CreateAlertModalProps = {
  open: boolean
  onClose: () => void
  boxOptions: Array<{ id: string; label: string }>
  prefill?: {
    patientId?: string | null
    patientName?: string | null
  } | null
}

const todayIso = () => {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function uniqueOptions(
  options: Array<{ value: string; label: string }>
): Array<{ value: string; label: string }> {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

export default function CreateAlertModal({
  open,
  onClose,
  boxOptions,
  prefill
}: CreateAlertModalProps) {
  const { createAlert } = useAlerts()
  const { getPatientsForSelect } = usePatients()
  const patientOptions = useMemo(
    () => uniqueOptions(getPatientsForSelect()),
    [getPatientsForSelect]
  )

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(todayIso())
  const [dueTime, setDueTime] = useState('')
  const [patientId, setPatientId] = useState('')
  const [boxScope, setBoxScope] = useState<'single' | 'all'>('single')
  const [boxId, setBoxId] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const boxScopeOptions = useMemo(
    () => [
      { value: 'single', label: 'Box concreto' },
      { value: 'all', label: 'Todos los box' }
    ],
    []
  )

  const allBoxOptions = useMemo(
    () => uniqueOptions(boxOptions.map((option) => ({ value: option.id, label: option.label }))),
    [boxOptions]
  )

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setDueDate(todayIso())
    setDueTime('')
    setBoxScope('single')
    setBoxId(allBoxOptions[0]?.value ?? '')
    setErrorMessage(null)

    if (prefill?.patientId) {
      setPatientId(prefill.patientId)
      return
    }
    if (prefill?.patientName) {
      const found = patientOptions.find((option) => option.label === prefill.patientName)
      setPatientId(found?.value ?? '')
      return
    }
    setPatientId('')
  }, [allBoxOptions, open, patientOptions, prefill])

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) {
      setErrorMessage('El título es obligatorio.')
      return
    }
    if (!dueDate) {
      setErrorMessage('La fecha es obligatoria.')
      return
    }
    if (boxScope === 'single' && !boxId) {
      setErrorMessage('Debes seleccionar un box o marcar todos los box.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      await createAlert({
        title,
        description,
        dueDate,
        dueTime: dueTime || null,
        patientId: patientId || null,
        appliesToAllBoxes: boxScope === 'all',
        boxId: boxScope === 'single' ? boxId : null
      })
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo crear la alerta. Inténtalo de nuevo.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Portal>
      <div className='fixed inset-0 z-[9999] grid place-items-center bg-black/30 p-4'>
        <div
          className='absolute inset-0'
          onClick={onClose}
          aria-hidden='true'
        />
        <div className='relative w-[min(34rem,92vw)] rounded-[1rem] border border-[var(--color-border-default)] bg-white shadow-xl'>
          <header className='flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4'>
            <h2 className='text-title-md text-[var(--color-neutral-900)]'>Nueva alerta</h2>
            <button
              type='button'
              onClick={onClose}
              className='grid size-8 place-items-center rounded-lg text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]'
              aria-label='Cerrar modal de nueva alerta'
            >
              <CloseRounded />
            </button>
          </header>

          <form onSubmit={handleSubmit} className='space-y-4 px-6 py-5'>
            <div className='space-y-1.5'>
              <FieldLabel>Título</FieldLabel>
              <TextInput
                value={title}
                onChange={setTitle}
                placeholder='Ej. Llamar a Juan'
                required
              />
            </div>

            <div className='space-y-1.5'>
              <FieldLabel>Descripción</FieldLabel>
              <TextArea
                value={description}
                onChange={setDescription}
                placeholder='Notas opcionales para la alerta'
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <FieldLabel>Fecha</FieldLabel>
                <TextInput type='date' value={dueDate} onChange={setDueDate} />
              </div>
              <div className='space-y-1.5'>
                <FieldLabel>Hora (opcional)</FieldLabel>
                <TextInput type='time' value={dueTime} onChange={setDueTime} />
              </div>
            </div>

            <div className='space-y-1.5'>
              <FieldLabel>Paciente (opcional)</FieldLabel>
              <SelectInput
                placeholder='Buscar paciente...'
                value={patientId}
                onChange={setPatientId}
                options={patientOptions}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <FieldLabel>Visibilidad</FieldLabel>
                <SelectInput
                  value={boxScope}
                  onChange={(value) => {
                    const normalized = value === 'all' ? 'all' : 'single'
                    setBoxScope(normalized)
                  }}
                  options={boxScopeOptions}
                />
              </div>
              <div className='space-y-1.5'>
                <FieldLabel>Box</FieldLabel>
                <SelectInput
                  placeholder='Seleccionar box'
                  value={boxId}
                  onChange={setBoxId}
                  options={allBoxOptions}
                />
              </div>
            </div>

            {errorMessage && (
              <p className='text-body-sm text-[var(--color-error-600)]'>{errorMessage}</p>
            )}

            <footer className='flex items-center justify-end gap-2 pt-2'>
              <button
                type='button'
                className='h-10 rounded-[0.625rem] border border-[var(--color-border-default)] px-4 text-body-md text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-50)]'
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='h-10 rounded-[0.625rem] bg-[var(--color-brand-600)] px-4 text-body-md font-medium text-white hover:bg-[var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isSubmitting ? 'Creando...' : 'Crear alerta'}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  )
}
