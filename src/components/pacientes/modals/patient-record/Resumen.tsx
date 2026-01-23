'use client'

import {
  CallRounded,
  EditRounded,
  MailRounded,
  MoreVertRounded,
  SearchRounded,
  FilterListRounded,
  AppsRounded
} from '@/components/icons/md3'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import React from 'react'

type ResumenProps = {
  onClose?: () => void
}

// Datos mock del paciente (en producción vendrían de props o API)
const mockPatientData = {
  nombre: 'Lucia López Cano',
  edad: '33 años',
  email: 'Emailexample@gmail.com',
  telefono: '+34 666 777 888',
  proximaCita: {
    tipo: 'Limpieza dental',
    fecha: '28/02/26',
    hora: '12:00 h',
    doctora: 'Dra. Andrea',
    duracion: '45 minutos',
    estado: 'Aprobado'
  },
  informacionCritica: {
    alergias: ['Latex', 'Penicilina'],
    enfermedades: ['Hipotiroidismo'],
    medicacion: ['Acenocumarol (Sintrom®)', 'Eutirox, 112 mg'],
    notas: 'No hay notas'
  },
  tratamientosPendientes: [
    {
      nombre: 'Blanqueamiento dental',
      fecha: '28/03/26',
      doctora: 'Dra. Andrea',
      precio: '200€',
      estado: 'Pendiente'
    }
  ],
  saldoPendiente: '702,90 €',
  documentosPendientes: [
    { tipo: 'Consentimiento', descripcion: 'Protección de datos (RGPD)' },
    { tipo: 'Consentimiento', descripcion: 'Tratamiento con sedación' },
    { tipo: 'Receta', descripcion: 'Antiinflamatorios' },
    { tipo: 'Solicitado', descripcion: 'Copia del historial clínico' }
  ],
  facturasVencidas: [
    { numero: 'F-001', descripcion: 'Limpieza dental', importe: '72€' },
    { numero: 'F-002', descripcion: 'Limpieza dental', importe: '620€' }
  ],
  historialReciente: [
    { descripcion: 'Implante del 34' }
  ]
}

export default function Resumen({ onClose }: ResumenProps) {
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    null
  )
  const lastUrlRef = React.useRef<string | null>(null)

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

  return (
    <div
      className='relative bg-[#f8fafb] overflow-hidden w-[74.75rem] h-full overflow-y-auto'
      data-node-id='resumen-container'
    >
      {/* Header con información del paciente - Posicionamiento exacto como ClientSummary */}
      <div
        className='absolute content-stretch flex gap-[1.5rem] items-center left-[2rem] top-[2rem]'
        data-node-id='resumen-header'
      >
        {/* Avatar */}
        <div className='relative shrink-0'>
          <div
            className='rounded-[12.5rem] size-[6rem] overflow-hidden bg-[var(--color-neutral-600)]'
            data-node-id='resumen-avatar'
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

        {/* Nombre y edad */}
        <div
          className='content-stretch flex flex-col gap-[0.5rem] items-start relative shrink-0'
          data-node-id='resumen-name-section'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] not-italic relative shrink-0 text-[#24282c] text-[1.5rem]"
            data-node-id='resumen-name'
          >
            {mockPatientData.nombre}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem]"
            data-node-id='resumen-age'
          >
            Edad: {mockPatientData.edad}
          </p>
        </div>

        {/* Contacto - Alineado a la derecha */}
        <div
          className='content-stretch flex flex-col gap-[0.5rem] items-end relative shrink-0 ml-auto'
          data-node-id='resumen-contact'
        >
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0'
            data-node-id='resumen-email'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='mail'
            >
              <MailRounded className='size-6 text-[#24282c]' />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
            >
              {mockPatientData.email}
            </p>
          </div>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0'
            data-node-id='resumen-phone'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='call'
            >
              <CallRounded className='size-6 text-[#24282c]' />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
            >
              {mockPatientData.telefono}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal - Dos columnas con flex para espaciado automático */}
      <div
        className='absolute left-[2rem] top-[10rem] w-[70.75rem] flex gap-[1.5rem] items-start'
        data-node-id='resumen-content-columns'
      >
        {/* Columna izquierda */}
        <div className='flex flex-col gap-[1.5rem] w-[34.375rem]'>
          {/* Próxima cita */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-proxima-cita-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
            data-node-id='resumen-proxima-cita-title'
          >
            Próxima cita
          </p>
          <button
            type='button'
            className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
            aria-label='Editar próxima cita'
          >
            <EditRounded className='w-6 h-6 text-[#24282c]' />
          </button>
        </div>
        <div className='space-y-[0.5rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
          >
            {mockPatientData.proximaCita.tipo}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
          >
            {mockPatientData.proximaCita.fecha} - {mockPatientData.proximaCita.hora}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
          >
            {mockPatientData.proximaCita.doctora}
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
          >
            {mockPatientData.proximaCita.duracion}
          </p>
          <span className='inline-block px-[0.75rem] py-[0.25rem] bg-[#E9FBF9] text-[0.875rem] text-[var(--color-brand-700)] rounded-full'>
            {mockPatientData.proximaCita.estado}
          </span>
        </div>
      </div>

          {/* Información crítica */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-info-critica-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Información crítica
          </p>
          <button
            type='button'
            className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
            aria-label='Editar información crítica'
          >
            <EditRounded className='w-6 h-6 text-[#24282c]' />
          </button>
        </div>
        <div className='space-y-[1rem]'>
          {/* Alergias */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Alergias
            </p>
            <div className='flex flex-wrap gap-[0.5rem]'>
              {mockPatientData.informacionCritica.alergias.map((alergia, idx) => (
                <span
                  key={idx}
                  className='inline-block px-[0.75rem] py-[0.375rem] bg-[#f7b7ba] text-[0.75rem] text-red-700 rounded-full font-medium'
                >
                  {alergia}
                </span>
              ))}
            </div>
          </div>

          {/* Enfermedades */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Enfermedades
            </p>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
            >
              {mockPatientData.informacionCritica.enfermedades.join(', ')}
            </p>
          </div>

          {/* Medicación actual */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Medicación actual
            </p>
            <div className='flex flex-wrap gap-[0.5rem]'>
              {mockPatientData.informacionCritica.medicacion.map((med, idx) => (
                <span
                  key={idx}
                  className={`inline-block px-[0.75rem] py-[0.375rem] text-[0.75rem] rounded-full font-medium ${
                    idx === 0
                      ? 'bg-[#f7b7ba] text-red-700'
                      : 'bg-[var(--color-neutral-200)] text-[#24282c]'
                  }`}
                >
                  {med}
                </span>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mb-[0.5rem]"
            >
              Notas
            </p>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] italic text-[#aeb8c2] text-[0.875rem]"
            >
              {mockPatientData.informacionCritica.notas}
            </p>
          </div>
          </div>
        </div>

          {/* Tratamientos pendientes */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-tratamientos-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Tratamientos pendientes
          </p>
          <div className='flex items-center gap-[0.5rem]'>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity border border-[var(--color-neutral-300)] rounded'
              aria-label='Vista de lista'
            >
              <div className='w-full h-full border border-[var(--color-neutral-300)] rounded' />
            </button>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity border border-[var(--color-neutral-300)] rounded bg-[var(--color-brand-50)]'
              aria-label='Vista de cuadrícula'
            >
              <AppsRounded className='w-6 h-6 text-[#24282c]' />
            </button>
            <button
              type='button'
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[var(--color-brand-600)] text-[0.875rem] hover:underline ml-[0.5rem]"
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className='space-y-[0.75rem]'>
          {mockPatientData.tratamientosPendientes.map((tratamiento, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg'
            >
              <div className='flex-1'>
                <p
                  className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                >
                  {tratamiento.nombre}
                </p>
                <div className='flex items-center gap-[0.75rem] mt-[0.25rem]'>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {tratamiento.fecha}
                  </span>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {tratamiento.doctora}
                  </span>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {tratamiento.precio}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-[0.5rem]'>
                <span className='inline-block px-[0.75rem] py-[0.25rem] bg-[#FEF3C7] text-[0.875rem] text-[#D97706] rounded-full font-medium'>
                  {tratamiento.estado}
                </span>
                <button
                  type='button'
                  className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                  aria-label='Más opciones'
                >
                  <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
                </button>
              </div>
            </div>
          ))}
        </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className='flex flex-col gap-[1.5rem] w-[34.375rem]'>
          {/* Saldo pendiente */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-saldo-card'
          >
        <div className='flex items-center justify-between'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Saldo pendiente
          </p>
          <div className='flex items-center gap-[0.5rem]'>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
              aria-label='Buscar'
            >
              <SearchRounded className='w-6 h-6 text-[#24282c]' />
            </button>
            <button
              type='button'
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] px-[0.75rem] py-[0.375rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded flex items-center gap-[0.5rem]"
              aria-label='Filtrar'
            >
              <FilterListRounded className='w-4 h-4' />
              Todos
            </button>
          </div>
        </div>
        <div className='mt-[1rem] flex justify-end'>
          <span className='inline-block px-[1rem] py-[0.5rem] bg-[#f7b7ba] text-[1.125rem] text-red-700 rounded-full font-medium'>
            {mockPatientData.saldoPendiente}
          </span>
        </div>
      </div>

          {/* Documentos pendientes */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-documentos-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Documentos pendientes
          </p>
          <span
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-red-700 text-[0.875rem]"
          >
            {mockPatientData.documentosPendientes.length} documentos pendientes
          </span>
        </div>
        <div className='space-y-[0.75rem]'>
          {mockPatientData.documentosPendientes.map((doc, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg'
            >
              <div className='flex-1'>
                <p
                  className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                >
                  {doc.tipo}
                </p>
                <p
                  className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] mt-[0.25rem]"
                >
                  {doc.descripcion}
                </p>
              </div>
              <button
                type='button'
                className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                aria-label='Más opciones'
              >
                <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
              </button>
            </div>
          ))}
        </div>
      </div>

          {/* Facturas vencidas */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-facturas-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Facturas vencidas
          </p>
          <span
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-red-700 text-[0.875rem]"
          >
            {mockPatientData.facturasVencidas.length} facturas vencidas
          </span>
        </div>
        <div className='space-y-[0.75rem]'>
          {mockPatientData.facturasVencidas.map((factura, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg'
            >
              <div className='flex-1'>
                <div className='flex items-center gap-[0.75rem]'>
                  <span
                    className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                  >
                    {factura.numero}
                  </span>
                  <span
                    className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem]"
                  >
                    {factura.descripcion}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-[0.5rem]'>
                <span
                  className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
                >
                  {factura.importe}
                </span>
                <button
                  type='button'
                  className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                  aria-label='Más opciones'
                >
                  <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

          {/* Historial reciente */}
          <div
            className='bg-white rounded-xl border border-[var(--color-neutral-200)] p-[1.5rem]'
            data-node-id='resumen-historial-card'
          >
        <div className='flex items-center justify-between mb-[1rem]'>
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1.125rem]"
          >
            Historial reciente
          </p>
          <div className='flex items-center gap-[0.5rem]'>
            <select
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[0.875rem] border border-[var(--color-neutral-300)] rounded px-[0.5rem] py-[0.25rem] bg-white"
            >
              <option>6 meses</option>
            </select>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity border border-[var(--color-neutral-300)] rounded'
              aria-label='Vista de lista'
            >
              <div className='w-full h-full border border-[var(--color-neutral-300)] rounded' />
            </button>
            <button
              type='button'
              className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity border border-[var(--color-neutral-300)] rounded bg-[var(--color-brand-50)]'
              aria-label='Vista de cuadrícula'
            >
              <AppsRounded className='w-6 h-6 text-[#24282c]' />
            </button>
            <button
              type='button'
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[var(--color-brand-600)] text-[0.875rem] hover:underline ml-[0.5rem]"
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className='space-y-[0.75rem]'>
          {mockPatientData.historialReciente.map((item, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between p-[0.75rem] hover:bg-[var(--color-neutral-50)] rounded-lg'
            >
              <p
                className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic text-[#24282c] text-[1rem]"
              >
                {item.descripcion}
              </p>
              <button
                type='button'
                className='w-6 h-6 cursor-pointer hover:opacity-70 transition-opacity'
                aria-label='Más opciones'
              >
                <MoreVertRounded className='w-6 h-6 text-[#24282c]' />
              </button>
            </div>
          ))}
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
