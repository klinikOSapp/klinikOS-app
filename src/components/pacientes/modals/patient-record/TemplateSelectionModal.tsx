'use client'

import {
  CloseRounded,
  DescriptionRounded,
  SearchRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import {
  DOCUMENT_TYPE_LABELS,
  useConfiguration,
  type DocumentTemplate,
  type DocumentTemplateType
} from '@/context/ConfigurationContext'
import { useMemo, useState } from 'react'

type TemplateSelectionModalProps = {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: DocumentTemplate) => void
}

// Filter options for document types
const TYPE_FILTERS: Array<{ value: DocumentTemplateType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'consentimiento', label: 'Consentimientos' },
  { value: 'informe', label: 'Informes' },
  { value: 'justificante', label: 'Justificantes' },
  { value: 'receta', label: 'Recetas' },
  { value: 'presupuesto', label: 'Presupuestos' },
  { value: 'factura', label: 'Facturas' }
]

// Template card component
function TemplateCard({
  template,
  onSelect
}: {
  template: DocumentTemplate
  onSelect: () => void
}) {
  return (
    <button
      type='button'
      onClick={onSelect}
      className='w-full text-left bg-white border border-neutral-200 rounded-lg p-4 hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-pointer group'
    >
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors'>
          <DescriptionRounded className='size-5 text-brand-600' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-body-md font-medium text-neutral-900 truncate'>
            {template.title}
          </p>
          <span className='inline-flex items-center px-2 py-0.5 mt-1 rounded text-label-sm bg-neutral-100 text-neutral-600'>
            {DOCUMENT_TYPE_LABELS[template.type]}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function TemplateSelectionModal({
  open,
  onClose,
  onSelectTemplate
}: TemplateSelectionModalProps) {
  const { documentTemplates } = useConfiguration()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentTemplateType | 'all'>('all')

  // Filter templates based on search and type
  const filteredTemplates = useMemo(() => {
    let result = documentTemplates

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
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
  }, [documentTemplates, typeFilter, search])

  // Group templates by type for display
  const groupedTemplates = useMemo(() => {
    const groups: Record<DocumentTemplateType, DocumentTemplate[]> = {
      consentimiento: [],
      informe: [],
      justificante: [],
      receta: [],
      presupuesto: [],
      factura: []
    }

    filteredTemplates.forEach((template) => {
      groups[template.type].push(template)
    })

    return groups
  }, [filteredTemplates])

  const handleSelect = (template: DocumentTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  if (!open) return null

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
        onClick={onClose}
      >
        <div
          className='w-[min(48rem,95vw)] max-h-[min(40rem,90vh)] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col'
          onClick={(e) => e.stopPropagation()}
          role='dialog'
          aria-modal='true'
          aria-labelledby='template-selection-title'
        >
          {/* Header */}
          <div className='flex-none flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
            <div>
              <h2
                id='template-selection-title'
                className='text-title-lg font-medium text-neutral-900'
              >
                Seleccionar plantilla de documento
              </h2>
              <p className='text-body-sm text-neutral-500 mt-1'>
                Elige una plantilla para crear un nuevo documento
              </p>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer'
              aria-label='Cerrar'
            >
              <CloseRounded className='size-5 text-neutral-500' />
            </button>
          </div>

          {/* Toolbar */}
          <div className='flex-none px-6 py-3 border-b border-neutral-100 flex items-center gap-4'>
            {/* Search */}
            <div className='relative flex-1'>
              <SearchRounded className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-neutral-400' />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Buscar plantilla...'
                className='w-full h-10 pl-10 pr-4 rounded-lg border border-neutral-300 text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
                autoFocus
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentTemplateType | 'all')}
              className='h-10 pl-3 pr-8 rounded-lg border border-neutral-300 text-body-md text-neutral-700 bg-white cursor-pointer'
            >
              {TYPE_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            {filteredTemplates.length > 0 ? (
              typeFilter === 'all' ? (
                // Show grouped by type when no filter is applied
                <div className='space-y-6'>
                  {(Object.entries(groupedTemplates) as [DocumentTemplateType, DocumentTemplate[]][])
                    .filter(([, templates]) => templates.length > 0)
                    .map(([type, templates]) => (
                      <div key={type}>
                        <h3 className='text-body-sm font-medium text-neutral-500 uppercase tracking-wide mb-3'>
                          {DOCUMENT_TYPE_LABELS[type]} ({templates.length})
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          {templates.map((template) => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onSelect={() => handleSelect(template)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                // Show flat list when filter is applied
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleSelect(template)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className='flex flex-col items-center justify-center py-12'>
                <div className='w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4'>
                  <DescriptionRounded className='size-8 text-neutral-400' />
                </div>
                <p className='text-body-md text-neutral-600 mb-1'>
                  No se encontraron plantillas
                </p>
                <p className='text-body-sm text-neutral-400'>
                  Prueba con otros términos de búsqueda o filtros
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex-none px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
            <p className='text-body-sm text-neutral-500'>
              {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''} disponible{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </Portal>
  )
}
