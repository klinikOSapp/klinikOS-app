'use client'

import React from 'react'
import { AddRounded } from '@/components/icons/md3'

// Types
type DocumentType = {
  id: string
  title: string
  type: 'factura' | 'receta' | 'justificante' | 'consentimiento'
}

// Document card component with preview
function DocumentCard({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className='w-[min(22rem,100%)] bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-5 h-24'>
        <p className='text-body-md font-normal text-[var(--color-neutral-900)] max-w-[13rem]'>
          {title}
        </p>
        <button
          type='button'
          onClick={onEdit}
          className='flex items-center justify-center px-3 py-1 rounded-2xl border border-[var(--color-brand-500)] bg-[var(--color-page-bg)] hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer'
        >
          <span className='text-body-sm text-[var(--color-brand-900)]'>Editar</span>
        </button>
      </div>

      {/* Document Preview - scaled down container for miniature effect */}
      <div className='flex-1 bg-[var(--color-neutral-50)] p-4 overflow-hidden'>
        <div className='bg-white border border-neutral-200 rounded shadow-sm p-6 h-[min(31rem,50vh)] overflow-hidden origin-top-left scale-[0.55]' style={{ width: '180%' }}>
          {/* Logo & Clinic Info */}
          <div className='flex items-start justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <div className='w-32 h-8 bg-neutral-200 rounded' />
              <span className='text-label-sm text-neutral-500'>Dental</span>
            </div>
            <div className='text-right'>
              <p className='text-label-sm text-neutral-700'>Clínica Tama Dental</p>
              <p className='text-label-sm text-neutral-500'>Dirección completa</p>
              <p className='text-label-sm text-neutral-500'>Teléfono de contacto</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className='bg-neutral-50 rounded p-3 mb-4'>
            <div className='flex justify-between mb-3'>
              <div>
                <p className='text-label-sm text-neutral-500'>Paciente:</p>
                <p className='text-label-sm text-neutral-700'>Nombre y apellidos</p>
              </div>
              <div className='text-right'>
                <p className='text-label-sm text-neutral-500'>Fecha:</p>
                <p className='text-label-sm text-neutral-700'>24/06/2025</p>
              </div>
            </div>
            <div className='flex gap-6'>
              <div>
                <p className='text-label-sm text-neutral-500'>DNI:</p>
                <p className='text-label-sm text-neutral-700'>44556677 X</p>
              </div>
              <div>
                <p className='text-label-sm text-neutral-500'>Sexo:</p>
                <p className='text-label-sm text-neutral-700'>Hombre</p>
              </div>
              <div>
                <p className='text-label-sm text-neutral-500'>Edad:</p>
                <p className='text-label-sm text-neutral-700'>45</p>
              </div>
            </div>
          </div>

          {/* Content rows */}
          <div className='space-y-3 mb-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='bg-neutral-50 rounded p-3'>
                <div className='flex gap-4 text-label-sm'>
                  <div>
                    <p className='text-neutral-500'>Medicamento:</p>
                    <p className='text-neutral-700'>Antibiol</p>
                  </div>
                  <div>
                    <p className='text-neutral-500'>Dosis:</p>
                    <p className='text-neutral-700'>500mg</p>
                  </div>
                  <div>
                    <p className='text-neutral-500'>Frecuencia:</p>
                    <p className='text-neutral-700'>3 por día</p>
                  </div>
                  <div>
                    <p className='text-neutral-500'>Duración:</p>
                    <p className='text-neutral-700'>7 días</p>
                  </div>
                  <div>
                    <p className='text-neutral-500'>Vía administración:</p>
                    <p className='text-neutral-700'>Oral</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Case & Doctor Info */}
          <div className='border-t border-neutral-200 pt-3'>
            <div className='mb-3'>
              <p className='text-label-sm text-neutral-500'>Caso:</p>
              <p className='text-label-sm text-neutral-700'>Breve descripción del caso, (no es obligatorio rellenarlo)</p>
            </div>
            <div className='border-t border-neutral-200 pt-3'>
              <div className='flex justify-between'>
                <div>
                  <p className='text-label-sm text-neutral-500'>Doctor:</p>
                  <p className='text-label-sm text-neutral-700'>Nombre y apellidos</p>
                </div>
                <div className='text-right'>
                  <p className='text-label-sm text-neutral-500'>Número colegiado:</p>
                  <p className='text-label-sm text-neutral-700'>XX 895 895 895</p>
                </div>
              </div>
              <div className='mt-3'>
                <p className='text-label-sm text-neutral-500'>Firma:</p>
                <p className='text-label-sm text-neutral-700'>-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sample documents
const documents: DocumentType[] = [
  { id: 'd1', title: 'Facturas', type: 'factura' },
  { id: 'd2', title: 'Recetas', type: 'receta' },
  { id: 'd3', title: 'Justificantes', type: 'justificante' },
  { id: 'd4', title: 'Consentimiento Protección de datos (RGPD)', type: 'consentimiento' },
  { id: 'd5', title: 'Consentimiento Tratamiento con sedación', type: 'consentimiento' }
]

export default function BillingLegalPage() {
  const handleEditDocument = (documentId: string) => {
    // TODO: Open document editor modal
    console.log('Edit document:', documentId)
  }

  const handleNewDocument = () => {
    // TODO: Open new document creation modal
    console.log('Create new document')
  }

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-8 pr-0 h-[min(2.5rem,4vh)]'>
        <p className='text-headline-sm font-normal text-[var(--color-neutral-900)]'>
          Documentos
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          onClick={handleNewDocument}
        >
          <AddRounded className='text-[var(--color-neutral-900)] size-6' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
            Nuevo Documento
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 ml-8 mr-0 mt-6 mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-auto'>
          {/* Document Cards Grid */}
          <div className='p-8'>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8'>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  title={doc.title}
                  onEdit={() => handleEditDocument(doc.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
