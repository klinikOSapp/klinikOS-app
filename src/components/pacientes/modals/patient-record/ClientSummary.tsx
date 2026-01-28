'use client'

/* eslint-disable @next/next/no-img-element */

import {
  CallRounded,
  CheckRounded,
  CloseRounded,
  EditRounded,
  MailRounded
} from '@/components/icons/md3'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import React from 'react'

type ClientSummaryProps = {
  onClose?: () => void
  initialEditMode?: boolean
  onEditModeOpened?: () => void
  /** When true, hides edit buttons and disables all editing functionality */
  readOnly?: boolean
}

// Datos iniciales del paciente (en producción vendrían de props o API)
const initialPatientData = {
  nombre: 'Lucia López Cano',
  email: 'Emailexample@gmail.com',
  telefono: '+34 666 777 888',
  fechaNacimiento: '26/02/1978',
  edad: '45 años',
  dni: '49587154S',
  pais: 'España',
  estado: 'Pre-registro',
  motivoConsulta:
    'Sufre de sensibilidad dental y necesita hacerse su limpieza bucal anual',
  origenCliente: 'Recomendación',
  recomendadoPor: 'Sonia Pujante',
  ocupacion: 'Funcionario',
  idioma: 'Español',
  contactoEmergenciaNombre: 'José Lopez',
  contactoEmergenciaEmail: 'Jose@gmail.com',
  contactoEmergenciaTelefono: '666 777 888',
  alergias: ['Penicilina', 'Latex'],
  comentario: ''
}

export default function ClientSummary({
  onClose,
  initialEditMode = false,
  onEditModeOpened,
  readOnly = false
}: ClientSummaryProps) {
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    null
  )
  const lastUrlRef = React.useRef<string | null>(null)

  // Estado de edición
  const [isEditing, setIsEditing] = React.useState(false)

  // Estados para todos los campos editables
  const [formData, setFormData] = React.useState(initialPatientData)
  const [tempFormData, setTempFormData] = React.useState(initialPatientData)

  // Efecto para abrir en modo edición cuando se pasa initialEditMode (solo si no es readOnly)
  React.useEffect(() => {
    if (initialEditMode && !readOnly) {
      setTempFormData(formData)
      setIsEditing(true)
      onEditModeOpened?.()
    }
  }, [initialEditMode, formData, onEditModeOpened, readOnly])

  const setPreviewFromFile = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    lastUrlRef.current = url
    setAvatarPreviewUrl(url)
  }, [])

  React.useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    }
  }, [])

  // Manejadores de edición
  const handleEdit = () => {
    setTempFormData(formData)
    setIsEditing(true)
  }

  const handleSave = () => {
    setFormData(tempFormData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempFormData(formData)
    setIsEditing(false)
  }

  const updateField = (
    field: keyof typeof formData,
    value: string | string[]
  ) => {
    setTempFormData((prev) => ({ ...prev, [field]: value }))
  }
  return (
    <div
      className='relative bg-[#f8fafb] overflow-hidden w-full h-full'
      data-node-id='423:822'
    >
      <div
        className='absolute content-stretch flex gap-[1.5rem] items-center left-[2rem] top-[3rem]'
        data-node-id='426:854'
      >
        <div className='relative shrink-0'>
          <div
            className='rounded-[12.5rem] size-[6rem] overflow-hidden bg-[var(--color-neutral-600)]'
            data-node-id='423:829'
          >
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt=''
                className='w-full h-full object-cover'
                loading='lazy'
              />
            ) : null}
          </div>
          <div className='absolute -bottom-1 -right-1'>
            <AvatarImageDropdown
              previewUrl={avatarPreviewUrl ?? undefined}
              onCaptureFromCamera={setPreviewFromFile}
              onUploadFromDevice={setPreviewFromFile}
            />
          </div>
        </div>
        <div
          className='content-stretch flex flex-col gap-[0.5rem] items-start relative shrink-0 w-[14.25rem]'
          data-node-id='426:853'
        >
          {isEditing ? (
            <input
              type='text'
              value={tempFormData.nombre}
              onChange={(e) => updateField('nombre', e.target.value)}
              className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] w-full not-italic text-[#24282c] text-[1.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)]"
            />
          ) : (
            <p
              className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] min-w-full not-italic relative shrink-0 text-[#24282c] text-[1.5rem]"
              data-node-id='426:830'
              style={{ width: 'min-content' }}
            >
              {formData.nombre}
            </p>
          )}
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0 w-full'
            data-node-id='426:848'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='mail'
              data-node-id='426:837'
            >
              <MailRounded className='size-6 text-[#24282c]' />
            </div>
            {isEditing ? (
              <input
                type='email'
                value={tempFormData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-full"
              />
            ) : (
              <p
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
                data-node-id='426:831'
              >
                {formData.email}
              </p>
            )}
          </div>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0'
            data-node-id='426:849'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='call'
              data-node-id='426:847'
            >
              <CallRounded className='size-6 text-[#24282c]' />
            </div>
            {isEditing ? (
              <input
                type='tel'
                value={tempFormData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-full"
              />
            ) : (
              <p
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
                data-node-id='426:838'
              >
                {formData.telefono}
              </p>
            )}
          </div>
        </div>
      </div>
      <div
        className='absolute left-[2.25rem] top-[11.5rem] w-[70.5rem] border-t border-[#e2e7ea]'
        data-node-id='426:850'
      />
      <div
        className='absolute bg-[#f7b7ba] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[6rem] top-[3rem]'
        data-node-id='426:852'
        style={{ left: 'calc(50% - 0.25rem)' }}
      >
        <p
          className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic relative shrink-0 text-[0.75rem] text-nowrap text-red-700 whitespace-pre"
          data-node-id='426:851'
        >
          Penicilina
        </p>
      </div>
      <div
        className='absolute bg-[#f7b7ba] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[6rem] top-[3rem]'
        data-node-id='426:857'
        style={{ left: 'calc(56.25% + 0.016rem)' }}
      >
        <p
          className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic relative shrink-0 text-[0.75rem] text-nowrap text-red-700 whitespace-pre"
          data-node-id='426:858'
        >
          Latex
        </p>
      </div>
      <div
        className='absolute bg-[#e2e7ea] h-[3.5rem] overflow-clip rounded-[0.5rem] top-[5.5rem] w-[30.25rem]'
        data-node-id='426:855'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        {isEditing ? (
          <textarea
            value={tempFormData.comentario}
            onChange={(e) => updateField('comentario', e.target.value)}
            placeholder='Añadir comentario sobre el paciente'
            className='w-full h-full px-2 py-2 text-[0.875rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded-[0.5rem] outline-none focus:border-[var(--color-brand-500)] resize-none text-[#24282c]'
          />
        ) : (
          <p
            className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1rem] left-[0.5rem] not-italic text-[#aeb8c2] text-[0.75rem] text-nowrap top-[0.5rem] whitespace-pre"
            data-node-id='426:856'
          >
            {formData.comentario || 'Añadir comentario sobre el paciente'}
          </p>
        )}
      </div>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic text-[#8a95a1] text-[0.75rem] text-nowrap top-[3.25rem] whitespace-pre"
        data-node-id='426:863'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >{`Alergias: `}</p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:864'
      >
        General
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:909'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[27rem] whitespace-pre"
        data-node-id='426:876'
      >
        Información adicional
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[40rem] whitespace-pre"
        data-node-id='426:885'
      >
        Contacto de emergencia
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#8a95a1] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:868'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Edad
      </p>
      <p
        className='absolute font-["Inter:Medium",_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] top-[30rem] w-[11.813rem]'
        data-node-id='426:877'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Recomendado por:
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:870'
      >
        Fecha de nacimiento
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:911'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Estado
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[30rem] whitespace-pre"
        data-node-id='426:878'
      >
        Origen del cliente
      </p>
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.contactoEmergenciaNombre}
          onChange={(e) =>
            updateField('contactoEmergenciaNombre', e.target.value)
          }
          placeholder='Nombre contacto'
          className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] top-[43rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[12rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[43rem] whitespace-pre"
          data-node-id='426:887'
        >
          {formData.contactoEmergenciaNombre}
        </p>
      )}
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:872'
      >
        DNI/NIE
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:912'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Motivo de la consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:879'
      >
        Ocupación
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:874'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Pais
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:880'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Idioma de preferencia
      </p>
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.edad}
          onChange={(e) => updateField('edad', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[18.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[6rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
          data-node-id='426:869'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.edad}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.recomendadoPor}
          onChange={(e) => updateField('recomendadoPor', e.target.value)}
          placeholder='Nombre'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[31.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
          data-node-id='426:881'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.recomendadoPor}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.fechaNacimiento}
          onChange={(e) => updateField('fechaNacimiento', e.target.value)}
          placeholder='DD/MM/AAAA'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[18.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
          data-node-id='426:871'
        >
          {formData.fechaNacimiento}
        </p>
      )}
      {isEditing ? (
        <select
          value={tempFormData.estado}
          onChange={(e) => updateField('estado', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[18.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        >
          <option value='Pre-registro'>Pre-registro</option>
          <option value='Activo'>Activo</option>
          <option value='Inactivo'>Inactivo</option>
          <option value='Pendiente'>Pendiente</option>
        </select>
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
          data-node-id='426:915'
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        >
          {formData.estado}
        </p>
      )}
      {isEditing ? (
        <select
          value={tempFormData.origenCliente}
          onChange={(e) => updateField('origenCliente', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[31.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
        >
          <option value='Recomendación'>Recomendación</option>
          <option value='Internet'>Internet</option>
          <option value='Redes Sociales'>Redes Sociales</option>
          <option value='Publicidad'>Publicidad</option>
          <option value='Otro'>Otro</option>
        </select>
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
          data-node-id='426:882'
        >
          {formData.origenCliente}
        </p>
      )}
      {isEditing ? (
        <input
          type='email'
          value={tempFormData.contactoEmergenciaEmail}
          onChange={(e) =>
            updateField('contactoEmergenciaEmail', e.target.value)
          }
          placeholder='Email contacto'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[44.75rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[12rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[44.75rem] whitespace-pre"
          data-node-id='426:891'
        >
          {formData.contactoEmergenciaEmail}
        </p>
      )}
      {isEditing ? (
        <input
          type='tel'
          value={tempFormData.contactoEmergenciaTelefono}
          onChange={(e) =>
            updateField('contactoEmergenciaTelefono', e.target.value)
          }
          placeholder='Teléfono contacto'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[46.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[46.25rem] whitespace-pre"
          data-node-id='426:894'
        >
          {formData.contactoEmergenciaTelefono}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.dni}
          onChange={(e) => updateField('dni', e.target.value)}
          placeholder='DNI/NIE'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
          data-node-id='426:873'
        >
          {formData.dni}
        </p>
      )}
      {isEditing ? (
        <textarea
          value={tempFormData.motivoConsulta}
          onChange={(e) => updateField('motivoConsulta', e.target.value)}
          placeholder='Motivo de la consulta'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] w-[30.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[3rem]"
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] w-[30.25rem]"
          data-node-id='426:916'
          style={{ left: 'calc(43.75% + 0.797rem)' }}
        >
          {formData.motivoConsulta}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.ocupacion}
          onChange={(e) => updateField('ocupacion', e.target.value)}
          placeholder='Ocupación'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] top-[36.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[10rem]"
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
          data-node-id='426:883'
        >
          {formData.ocupacion}
        </p>
      )}
      {isEditing ? (
        <input
          type='text'
          value={tempFormData.pais}
          onChange={(e) => updateField('pais', e.target.value)}
          placeholder='País'
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        />
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
          data-node-id='426:875'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.pais}
        </p>
      )}
      {isEditing ? (
        <select
          value={tempFormData.idioma}
          onChange={(e) => updateField('idioma', e.target.value)}
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[36.25rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[8rem]"
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          <option value='Español'>Español</option>
          <option value='Inglés'>Inglés</option>
          <option value='Francés'>Francés</option>
          <option value='Valenciano'>Valenciano</option>
          <option value='Catalán'>Catalán</option>
        </select>
      ) : (
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
          data-node-id='426:884'
          style={{ left: 'calc(18.75% + 1.922rem)' }}
        >
          {formData.idioma}
        </p>
      )}
      {/* Edit/Save buttons - hidden when readOnly */}
      {!readOnly &&
        (!isEditing ? (
          <button
            type='button'
            onClick={handleEdit}
            className='absolute bg-[#f8fafb] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[1rem] top-[14.125rem] cursor-pointer hover:bg-[var(--color-brand-50)] transition-colors'
            data-name='Remember - Button'
            data-node-id='426:905'
            style={{ left: 'calc(87.5% + 1.906rem)' }}
          >
            <div
              aria-hidden='true'
              className='absolute border border-[#51d6c7] border-solid inset-0 pointer-events-none rounded-[1rem]'
            />
            <EditRounded className='size-4 text-[#1e4947]' />
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic relative shrink-0 text-[#1e4947] text-[0.875rem] text-nowrap whitespace-pre"
              data-node-id='I426:905;236:963'
            >
              Editar
            </p>
          </button>
        ) : (
          <div
            className='absolute flex gap-[0.5rem] top-[14.125rem]'
            style={{ left: 'calc(80% + 1rem)' }}
          >
            <button
              type='button'
              onClick={handleCancel}
              className='bg-[#f8fafb] box-border flex gap-[0.5rem] items-center justify-center px-[0.75rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-neutral-100)] transition-colors border border-[var(--color-neutral-300)]'
            >
              <CloseRounded className='size-4 text-[var(--color-neutral-700)]' />
              <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-[var(--color-neutral-700)] text-[0.875rem]">
                Cancelar
              </span>
            </button>
            <button
              type='button'
              onClick={handleSave}
              className='bg-[var(--color-brand-500)] box-border flex gap-[0.5rem] items-center justify-center px-[0.75rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-brand-600)] transition-colors'
            >
              <CheckRounded className='size-4 text-white' />
              <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-white text-[0.875rem]">
                Guardar
              </span>
            </button>
          </div>
        ))}
    </div>
  )
}
