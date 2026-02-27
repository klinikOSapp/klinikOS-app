'use client'

import {
  AddRounded,
  FilterAltRounded,
  SearchRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import {
  DEFAULT_DOCUMENT_TEMPLATES,
  DOCUMENT_TYPE_LABELS,
  useConfiguration,
  type DocumentTemplate,
  type DocumentTemplateType
} from '@/context/ConfigurationContext'
import { useCallback, useMemo, useState } from 'react'
import TemplateEditorModal from './TemplateEditorModal'

// Document card component with miniature preview
function DocumentCard({
  template,
  onEdit
}: {
  template: DocumentTemplate
  onEdit: () => void
}) {
  return (
    <div className='w-[min(22rem,100%)] bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-4'>
        <div className='flex-1 min-w-0 mr-3'>
          <p className='text-body-md font-medium text-[var(--color-neutral-900)] truncate'>
            {template.title}
          </p>
          <span className='inline-flex items-center px-2 py-0.5 mt-1 rounded text-label-sm bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'>
            {DOCUMENT_TYPE_LABELS[template.type]}
          </span>
        </div>
        <button
          type='button'
          onClick={onEdit}
          className='flex items-center justify-center px-3 py-1.5 rounded-2xl border border-[var(--color-brand-500)] bg-[var(--color-page-bg)] hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer flex-shrink-0'
        >
          <span className='text-body-sm font-medium text-[var(--color-brand-700)]'>
            Editar
          </span>
        </button>
      </div>

      {/* Document Preview - scaled down for miniature effect */}
      <div className='flex-1 bg-[var(--color-neutral-50)] p-3 overflow-hidden'>
        <div
          className='bg-white border border-neutral-200 rounded shadow-sm p-4 h-[min(20rem,35vh)] overflow-hidden origin-top-left scale-[0.45]'
          style={{ width: '220%' }}
        >
          <div
            className='prose prose-sm max-w-none'
            style={{ fontSize: '12px', lineHeight: '1.4' }}
            dangerouslySetInnerHTML={{
              __html: template.content.replace(
                /\{\{[^}]+\}\}/g,
                '<span style="background:#E0F2FE;color:#0369A1;padding:1px 4px;border-radius:2px;font-size:10px;">···</span>'
              )
            }}
          />
        </div>
      </div>

      {/* Footer with last modified */}
      {template.lastModified && (
        <div className='px-4 py-2 border-t border-neutral-100 bg-neutral-50'>
          <p className='text-label-sm text-[var(--color-neutral-500)]'>
            Modificado:{' '}
            {new Date(template.lastModified).toLocaleDateString('es-ES')}
          </p>
        </div>
      )}
    </div>
  )
}

// Filter options
const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'factura', label: 'Facturas' },
  { value: 'receta', label: 'Recetas' },
  { value: 'presupuesto', label: 'Presupuestos' },
  { value: 'justificante', label: 'Justificantes' },
  { value: 'consentimiento', label: 'Consentimientos' },
  { value: 'informe', label: 'Informes' }
]

export default function Documents() {
  // Use configuration context for templates
  const {
    documentTemplates,
    addDocumentTemplate,
    updateDocumentTemplate,
    resetDocumentTemplate
  } = useConfiguration()

  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocType, setNewDocType] =
    useState<DocumentTemplateType>('consentimiento')

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = documentTemplates

    // Apply type filter
    if (filter !== 'all') {
      result = result.filter((t) => t.type === filter)
    }

    // Apply search
    const term = search.trim().toLowerCase()
    if (term) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          DOCUMENT_TYPE_LABELS[t.type].toLowerCase().includes(term)
      )
    }

    return result
  }, [documentTemplates, filter, search])

  // Edit handler
  const handleEdit = useCallback((template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setShowEditor(true)
  }, [])

  // Save handler
  const handleSave = useCallback(
    (updatedTemplate: DocumentTemplate) => {
      updateDocumentTemplate(updatedTemplate.id, updatedTemplate)
      setShowEditor(false)
      setSelectedTemplate(null)
    },
    [updateDocumentTemplate]
  )

  // Reset handler
  const handleReset = useCallback(
    (templateId: string) => {
      resetDocumentTemplate(templateId)
      // Update selected template if it's the one being reset
      const template = documentTemplates.find((t) => t.id === templateId)
      if (selectedTemplate && selectedTemplate.id === templateId && template) {
        setSelectedTemplate({
          ...template,
          content: DEFAULT_DOCUMENT_TEMPLATES[template.type],
          logoUrl: undefined,
          logoPosition: undefined
        })
      }
    },
    [documentTemplates, resetDocumentTemplate, selectedTemplate]
  )

  // Create new document handler
  const handleCreateDocument = useCallback(() => {
    if (!newDocTitle.trim()) return

    addDocumentTemplate({
      title: newDocTitle.trim(),
      type: newDocType,
      content: DEFAULT_DOCUMENT_TEMPLATES[newDocType],
      isDefault: false
    })

    setShowNewDocumentModal(false)
    setNewDocTitle('')
    setNewDocType('consentimiento')
  }, [newDocTitle, newDocType, addDocumentTemplate])

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Plantillas de documentos
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          onClick={() => setShowNewDocumentModal(true)}
        >
          <AddRounded className='text-[var(--color-neutral-900)] size-6' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
            Nuevo documento
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-lg h-full overflow-hidden flex flex-col'>
          {/* Toolbar */}
          <div className='flex-none px-[min(2rem,3vw)] py-[min(1rem,1.5vh)] border-b border-neutral-100'>
            <div className='flex items-center justify-between gap-4'>
              <p className='text-label-sm text-[var(--color-neutral-500)]'>
                {filteredTemplates.length} plantilla
                {filteredTemplates.length !== 1 ? 's' : ''}
              </p>
              <div className='flex items-center gap-3'>
                {/* Search */}
                <div className='relative'>
                  <SearchRounded className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[var(--color-neutral-400)]' />
                  <input
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Buscar plantilla...'
                    className='h-9 pl-10 pr-4 rounded-lg border border-neutral-300 text-body-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)] w-[min(16rem,40vw)]'
                  />
                </div>

                {/* Filter */}
                <div className='relative'>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className='h-9 pl-3 pr-8 rounded-lg border border-neutral-300 text-body-sm text-[var(--color-neutral-700)] bg-white cursor-pointer appearance-none'
                  >
                    {FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FilterAltRounded className='absolute right-2 top-1/2 -translate-y-1/2 size-5 text-[var(--color-neutral-500)] pointer-events-none' />
                </div>
              </div>
            </div>
          </div>

          {/* Document Cards Grid */}
          <div className='flex-1 overflow-auto p-[min(2rem,3vw)]'>
            {filteredTemplates.length > 0 ? (
              <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'>
                {filteredTemplates.map((template) => (
                  <DocumentCard
                    key={template.id}
                    template={template}
                    onEdit={() => handleEdit(template)}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-full py-16'>
                <div className='w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4'>
                  <svg
                    className='size-8 text-neutral-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <p className='text-body-md text-[var(--color-neutral-600)] mb-1'>
                  No se encontraron plantillas
                </p>
                <p className='text-body-sm text-[var(--color-neutral-400)]'>
                  Prueba con otros términos de búsqueda o filtros
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        open={showEditor}
        onClose={() => {
          setShowEditor(false)
          setSelectedTemplate(null)
        }}
        template={selectedTemplate}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* New Document Modal */}
      {showNewDocumentModal && (
        <Portal>
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
            onClick={() => setShowNewDocumentModal(false)}
          >
            <div
              className='w-[min(28rem,95vw)] bg-white rounded-xl shadow-xl overflow-hidden'
              onClick={(e) => e.stopPropagation()}
              role='dialog'
              aria-modal='true'
              aria-labelledby='new-doc-title'
            >
              <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
                <h2
                  id='new-doc-title'
                  className='text-title-lg font-medium text-[var(--color-neutral-900)]'
                >
                  Nueva plantilla de documento
                </h2>
                <button
                  type='button'
                  onClick={() => setShowNewDocumentModal(false)}
                  className='text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] cursor-pointer'
                  aria-label='Cerrar'
                >
                  ✕
                </button>
              </div>
              <div className='p-6 space-y-4'>
                <div>
                  <label
                    htmlFor='doc-title'
                    className='block text-body-sm font-medium text-[var(--color-neutral-700)] mb-2'
                  >
                    Nombre del documento
                  </label>
                  <input
                    id='doc-title'
                    type='text'
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder='Ej: Consentimiento para ortodoncia'
                    className='w-full h-11 px-3 rounded-lg border border-neutral-300 text-body-md text-[var(--color-neutral-900)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]'
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    htmlFor='doc-type'
                    className='block text-body-sm font-medium text-[var(--color-neutral-700)] mb-2'
                  >
                    Tipo de documento
                  </label>
                  <select
                    id='doc-type'
                    value={newDocType}
                    onChange={(e) =>
                      setNewDocType(e.target.value as DocumentTemplateType)
                    }
                    className='w-full h-11 px-3 rounded-lg border border-neutral-300 text-body-md text-[var(--color-neutral-700)] bg-white cursor-pointer'
                  >
                    <option value='factura'>Factura</option>
                    <option value='receta'>Receta</option>
                    <option value='presupuesto'>Presupuesto</option>
                    <option value='justificante'>Justificante</option>
                    <option value='consentimiento'>Consentimiento</option>
                    <option value='informe'>Informe</option>
                  </select>
                </div>
              </div>
              <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
                <button
                  type='button'
                  onClick={() => setShowNewDocumentModal(false)}
                  className='px-4 py-2 text-body-md font-medium text-[var(--color-neutral-700)] rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer'
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  onClick={handleCreateDocument}
                  disabled={!newDocTitle.trim()}
                  className='px-4 py-2 text-body-md font-medium text-white bg-[var(--color-brand-500)] rounded-lg hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer'
                >
                  Crear y editar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
