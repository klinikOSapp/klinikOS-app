'use client'

import {
  ArrowBackRounded,
  DownloadRounded,
  RestartAltRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  useConfiguration,
  type DocumentTemplate
} from '@/context/ConfigurationContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Re-export DocumentTemplate for backward compatibility
export type { DocumentTemplate } from '@/context/ConfigurationContext'

// Template variable categories and their available variables
const TEMPLATE_VARIABLES = {
  paciente: {
    label: 'Paciente',
    variables: [
      { key: '{{paciente.nombre}}', label: 'Nombre completo' },
      { key: '{{paciente.dni}}', label: 'DNI/NIE' },
      { key: '{{paciente.email}}', label: 'Email' },
      { key: '{{paciente.telefono}}', label: 'Teléfono' },
      { key: '{{paciente.direccion}}', label: 'Dirección' },
      { key: '{{paciente.fecha_nacimiento}}', label: 'Fecha de nacimiento' },
      { key: '{{paciente.edad}}', label: 'Edad' },
      { key: '{{paciente.sexo}}', label: 'Sexo' }
    ]
  },
  clinica: {
    label: 'Clínica',
    variables: [
      { key: '{{clinica.nombre}}', label: 'Nombre comercial' },
      { key: '{{clinica.razon_social}}', label: 'Razón social' },
      { key: '{{clinica.nif}}', label: 'NIF/CIF' },
      { key: '{{clinica.direccion}}', label: 'Dirección completa' },
      { key: '{{clinica.telefono}}', label: 'Teléfono' },
      { key: '{{clinica.email}}', label: 'Email' },
      { key: '{{clinica.web}}', label: 'Página web' },
      { key: '{{clinica.iban}}', label: 'IBAN bancario' },
      { key: '{{clinica.email_facturacion}}', label: 'Email de facturación' }
    ]
  },
  profesional: {
    label: 'Profesional',
    variables: [
      { key: '{{profesional.nombre}}', label: 'Nombre completo' },
      { key: '{{profesional.especialidad}}', label: 'Especialidad' },
      { key: '{{profesional.num_colegiado}}', label: 'Número colegiado' },
      { key: '{{profesional.firma}}', label: 'Firma digital' }
    ]
  },
  documento: {
    label: 'Documento',
    variables: [
      { key: '{{documento.fecha}}', label: 'Fecha actual' },
      { key: '{{documento.numero}}', label: 'Número de documento' },
      { key: '{{documento.tipo}}', label: 'Tipo de documento' }
    ]
  },
  tratamiento: {
    label: 'Tratamiento',
    variables: [
      { key: '{{tratamiento.nombre}}', label: 'Nombre del tratamiento' },
      { key: '{{tratamiento.descripcion}}', label: 'Descripción' },
      { key: '{{tratamiento.precio}}', label: 'Precio' },
      { key: '{{tratamiento.pieza}}', label: 'Pieza dental' }
    ]
  },
  presupuesto: {
    label: 'Presupuesto',
    variables: [
      { key: '{{presupuesto.subtotal}}', label: 'Subtotal' },
      { key: '{{presupuesto.descuento}}', label: 'Descuento' },
      { key: '{{presupuesto.total}}', label: 'Total' },
      { key: '{{presupuesto.validez}}', label: 'Días de validez' }
    ]
  },
  receta: {
    label: 'Receta',
    variables: [
      { key: '{{receta.medicamento}}', label: 'Medicamento' },
      { key: '{{receta.dosis}}', label: 'Dosis' },
      { key: '{{receta.frecuencia}}', label: 'Frecuencia' },
      { key: '{{receta.duracion}}', label: 'Duración' },
      { key: '{{receta.via}}', label: 'Vía de administración' },
      { key: '{{receta.notas}}', label: 'Notas del caso' }
    ]
  }
}

// Font options
const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Roboto, sans-serif', label: 'Roboto' }
]

const FONT_SIZES = [
  { value: '10px', label: '10' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' }
]

const COLORS = [
  { value: '#000000', label: 'Negro' },
  { value: '#1E4947', label: 'Verde marca' },
  { value: '#535C66', label: 'Gris oscuro' },
  { value: '#6B7280', label: 'Gris' },
  { value: '#1E40AF', label: 'Azul' },
  { value: '#047857', label: 'Verde' },
  { value: '#B91C1C', label: 'Rojo' },
  { value: '#7C3AED', label: 'Morado' }
]

type Props = {
  open: boolean
  onClose: () => void
  template: DocumentTemplate | null
  onSave: (template: DocumentTemplate) => void
  onReset: (templateId: string) => void
}

// Toolbar Button Component
function ToolbarButton({
  icon,
  label,
  active,
  onClick,
  disabled
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]'
          : 'hover:bg-neutral-100 text-[var(--color-neutral-700)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon}
    </button>
  )
}

// Toolbar Separator
function ToolbarSeparator() {
  return <div className='w-px h-6 bg-neutral-200 mx-1' />
}

export default function TemplateEditorModal({
  open,
  onClose,
  template,
  onSave,
  onReset
}: Props) {
  // Get clinic info from configuration context
  const { clinicInfo, activeProfessionals } = useConfiguration()

  const editorRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState('')
  // Logo always comes from clinic configuration - only position is per-template
  const [logoPosition, setLogoPosition] = useState({ x: 20, y: 20 })
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showPreview, setShowPreview] = useState(false)
  const [showVariablesMenu, setShowVariablesMenu] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false)

  // Font state
  const [currentFont, setCurrentFont] = useState('Arial, sans-serif')
  const [currentSize, setCurrentSize] = useState('14px')
  const [currentColor, setCurrentColor] = useState('#000000')

  // Clinic logo from configuration (always used, not per-template)
  const clinicLogo = clinicInfo.logo

  // Initialize content when template changes
  useEffect(() => {
    if (template) {
      setContent(template.content)
      // Only logo position is stored per-template, logo itself comes from clinic config
      setLogoPosition(template.logoPosition || { x: 20, y: 20 })
      setHasUnsavedChanges(false)
    }
  }, [template])

  // Set content to editor when it loads
  useEffect(() => {
    if (editorRef.current && content && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content
    }
  }, [content, open])

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true)
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, onClose])

  // Force close without saving
  const handleForceClose = useCallback(() => {
    setShowUnsavedConfirm(false)
    setHasUnsavedChanges(false)
    onClose()
  }, [onClose])

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    setHasUnsavedChanges(true)
  }, [])

  // Format handlers
  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')
  const handleUnderline = () => execCommand('underline')
  const handleStrikethrough = () => execCommand('strikeThrough')

  const handleAlignLeft = () => execCommand('justifyLeft')
  const handleAlignCenter = () => execCommand('justifyCenter')
  const handleAlignRight = () => execCommand('justifyRight')
  const handleAlignJustify = () => execCommand('justifyFull')

  const handleBulletList = () => execCommand('insertUnorderedList')
  const handleNumberedList = () => execCommand('insertOrderedList')

  const handleFontChange = (font: string) => {
    setCurrentFont(font)
    execCommand('fontName', font)
  }

  const handleSizeChange = (size: string) => {
    setCurrentSize(size)
    // Use a span wrapper for custom font sizes
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        const span = document.createElement('span')
        span.style.fontSize = size
        range.surroundContents(span)
        setHasUnsavedChanges(true)
      }
    }
  }

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    execCommand('foreColor', color)
  }

  // Insert variable at cursor position
  const handleInsertVariable = useCallback((variableKey: string) => {
    const selection = window.getSelection()
    if (selection && editorRef.current) {
      const range = selection.getRangeAt(0)

      // Create a styled span for the variable
      const variableSpan = document.createElement('span')
      variableSpan.className = 'template-variable'
      variableSpan.contentEditable = 'false'
      variableSpan.style.cssText = `
        background: #E0F2FE;
        color: #0369A1;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        margin: 0 2px;
        display: inline-block;
      `
      variableSpan.textContent = variableKey

      range.deleteContents()
      range.insertNode(variableSpan)

      // Move cursor after the inserted variable
      range.setStartAfter(variableSpan)
      range.setEndAfter(variableSpan)
      selection.removeAllRanges()
      selection.addRange(range)

      setHasUnsavedChanges(true)
    }
    setShowVariablesMenu(false)
  }, [])

  // Handle logo drag (logo comes from clinic config, only position is editable)
  const handleLogoMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const logoElement = e.currentTarget as HTMLElement
    const rect = logoElement.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDraggingLogo(true)
  }, [])

  const handleLogoMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingLogo) return

      const container = editorRef.current?.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      const newX = Math.max(
        0,
        Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 150)
      )
      const newY = Math.max(
        0,
        Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 60)
      )

      setLogoPosition({ x: newX, y: newY })
      setHasUnsavedChanges(true)
    },
    [isDraggingLogo, dragOffset]
  )

  const handleLogoMouseUp = useCallback(() => {
    setIsDraggingLogo(false)
  }, [])

  // Save handler - logo comes from clinic config, only position is saved per-template
  const handleSave = useCallback(() => {
    if (!template || !editorRef.current) return

    const updatedTemplate: DocumentTemplate = {
      ...template,
      content: editorRef.current.innerHTML,
      // logoUrl is NOT saved per-template - it always comes from clinic config
      logoPosition,
      lastModified: new Date().toISOString()
    }

    onSave(updatedTemplate)
    setHasUnsavedChanges(false)
  }, [template, logoPosition, onSave])

  // Reset handler
  const handleReset = useCallback(() => {
    if (!template) return
    onReset(template.id)
    setShowResetConfirm(false)
    setHasUnsavedChanges(false)
  }, [template, onReset])

  // Content change handler
  const handleContentChange = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      // Save: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }

      // Escape to close
      if (e.key === 'Escape') {
        if (showPreview) {
          setShowPreview(false)
        } else if (showVariablesMenu) {
          setShowVariablesMenu(false)
        } else if (showResetConfirm) {
          setShowResetConfirm(false)
        } else if (showUnsavedConfirm) {
          setShowUnsavedConfirm(false)
        } else {
          handleClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    open,
    showPreview,
    showVariablesMenu,
    showResetConfirm,
    showUnsavedConfirm,
    handleClose,
    handleSave
  ])

  // Get first active professional for preview
  const firstProfessional = activeProfessionals[0]

  // Build full clinic address
  const clinicFullAddress = useMemo(() => {
    const parts = [clinicInfo.direccion]
    if (clinicInfo.codigoPostal) parts.push(clinicInfo.codigoPostal)
    if (clinicInfo.poblacion) parts.push(clinicInfo.poblacion)
    return parts.join(', ')
  }, [clinicInfo.direccion, clinicInfo.codigoPostal, clinicInfo.poblacion])

  // Preview content with real clinic data + sample patient data
  const previewContent = useMemo(() => {
    if (!editorRef.current) return ''

    let html = editorRef.current.innerHTML

    // Replace variables with real clinic data + sample data for patient/document
    const previewData: Record<string, string> = {
      // Patient data (sample for preview)
      '{{paciente.nombre}}': 'María García López',
      '{{paciente.dni}}': '12345678A',
      '{{paciente.email}}': 'maria.garcia@email.com',
      '{{paciente.telefono}}': '612 345 678',
      '{{paciente.direccion}}': 'Calle Mayor 123, 28001 Madrid',
      '{{paciente.fecha_nacimiento}}': '15/03/1985',
      '{{paciente.edad}}': '40',
      '{{paciente.sexo}}': 'Mujer',

      // REAL CLINIC DATA from configuration
      '{{clinica.nombre}}':
        clinicInfo.nombreComercial || 'Nombre de la clínica',
      '{{clinica.nif}}': clinicInfo.cif || 'CIF/NIF',
      '{{clinica.direccion}}': clinicFullAddress || 'Dirección de la clínica',
      '{{clinica.telefono}}': clinicInfo.telefono || 'Teléfono',
      '{{clinica.email}}': clinicInfo.email || 'email@clinica.com',
      '{{clinica.web}}': clinicInfo.web || 'www.clinica.com',
      '{{clinica.razon_social}}':
        clinicInfo.razonSocial || clinicInfo.nombreComercial || '',
      '{{clinica.iban}}': clinicInfo.iban || '',
      '{{clinica.email_facturacion}}':
        clinicInfo.emailBancario || clinicInfo.email || '',

      // Professional data (first active professional or sample)
      '{{profesional.nombre}}':
        firstProfessional?.name || 'Dr. Nombre Apellido',
      '{{profesional.especialidad}}': firstProfessional?.role || 'Especialidad',
      '{{profesional.num_colegiado}}': 'COEM 12345',
      '{{profesional.firma}}': '[Firma Digital]',

      // Document data (sample)
      '{{documento.fecha}}': new Date().toLocaleDateString('es-ES'),
      '{{documento.numero}}': 'DOC-2026-00123',
      '{{documento.tipo}}': template?.type || 'Documento',

      // Treatment data (sample)
      '{{tratamiento.nombre}}': 'Limpieza dental profesional',
      '{{tratamiento.descripcion}}': 'Limpieza dental con ultrasonidos',
      '{{tratamiento.precio}}': '75,00 €',
      '{{tratamiento.pieza}}': '1.6',

      // Budget data (sample)
      '{{presupuesto.subtotal}}': '450,00 €',
      '{{presupuesto.descuento}}': '45,00 €',
      '{{presupuesto.total}}': '405,00 €',
      '{{presupuesto.validez}}': '30 días',

      // Prescription data (sample)
      '{{receta.medicamento}}': 'Ibuprofeno 600mg',
      '{{receta.dosis}}': '1 comprimido',
      '{{receta.frecuencia}}': 'Cada 8 horas',
      '{{receta.duracion}}': '5 días',
      '{{receta.via}}': 'Oral',
      '{{receta.notas}}': 'Tomar con alimentos'
    }

    // Replace variable spans with actual values
    Object.entries(previewData).forEach(([key, value]) => {
      // Replace both the styled span version and plain text version
      const escapedKey = key.replace(/[{}]/g, '\\$&')
      const spanRegex = new RegExp(
        `<span[^>]*class="template-variable"[^>]*>[^<]*${escapedKey}[^<]*</span>`,
        'g'
      )
      html = html.replace(
        spanRegex,
        `<strong style="color: #1E4947;">${value}</strong>`
      )
      html = html.replace(new RegExp(escapedKey, 'g'), value)
    })

    return html
  }, [
    template?.type,
    showPreview,
    clinicInfo,
    clinicFullAddress,
    firstProfessional
  ])

  if (!open || !template) return null

  const modalContent = (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
      onMouseMove={handleLogoMouseMove}
      onMouseUp={handleLogoMouseUp}
    >
      <div
        className='w-[min(90rem,95vw)] h-[min(56rem,92vh)] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='template-editor-title'
      >
        {/* Header */}
        <header className='flex-none flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[var(--color-surface)]'>
          <div className='flex items-center gap-4'>
            <button
              type='button'
              onClick={handleClose}
              className='p-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer'
              aria-label='Volver'
            >
              <ArrowBackRounded className='size-5 text-[var(--color-neutral-700)]' />
            </button>
            <div>
              <h2
                id='template-editor-title'
                className='text-title-lg font-medium text-[var(--color-neutral-900)]'
              >
                Editar plantilla: {template.title}
              </h2>
              <p className='text-body-sm text-[var(--color-neutral-500)]'>
                Personaliza el diseño y contenido del documento
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            {hasUnsavedChanges && (
              <span className='text-body-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full'>
                Cambios sin guardar
              </span>
            )}
            <button
              type='button'
              onClick={() => setShowResetConfirm(true)}
              className='flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              <RestartAltRounded className='size-5 text-[var(--color-neutral-700)]' />
              <span className='text-body-md text-[var(--color-neutral-700)]'>
                Restaurar original
              </span>
            </button>
            <button
              type='button'
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                showPreview
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                  : 'border-neutral-300 hover:bg-neutral-50 text-[var(--color-neutral-700)]'
              }`}
            >
              <VisibilityRounded className='size-5' />
              <span className='text-body-md'>
                {showPreview ? 'Editar' : 'Previsualizar'}
              </span>
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className='flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer'
            >
              <DownloadRounded className='size-5 text-white' />
              <span className='text-body-md font-medium text-white'>
                Guardar cambios
              </span>
            </button>
          </div>
        </header>

        {/* Toolbar */}
        {!showPreview && (
          <div className='flex-none px-6 py-3 border-b border-neutral-200 bg-neutral-50'>
            <div className='flex items-center gap-2 flex-wrap'>
              {/* Font Family */}
              <select
                value={currentFont}
                onChange={(e) => handleFontChange(e.target.value)}
                className='h-8 px-2 rounded border border-neutral-300 text-body-sm text-[var(--color-neutral-700)] bg-white cursor-pointer'
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>

              {/* Font Size */}
              <select
                value={currentSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                className='h-8 px-2 rounded border border-neutral-300 text-body-sm text-[var(--color-neutral-700)] bg-white cursor-pointer w-16'
              >
                {FONT_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>

              {/* Font Color */}
              <div className='relative'>
                <input
                  type='color'
                  value={currentColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className='w-8 h-8 rounded border border-neutral-300 cursor-pointer'
                  title='Color del texto'
                />
              </div>

              <ToolbarSeparator />

              {/* Text Formatting */}
              <ToolbarButton
                icon={<span className='font-bold text-sm'>B</span>}
                label='Negrita (Ctrl+B)'
                onClick={handleBold}
              />
              <ToolbarButton
                icon={<span className='italic text-sm'>I</span>}
                label='Cursiva (Ctrl+I)'
                onClick={handleItalic}
              />
              <ToolbarButton
                icon={<span className='underline text-sm'>U</span>}
                label='Subrayado (Ctrl+U)'
                onClick={handleUnderline}
              />
              <ToolbarButton
                icon={<span className='line-through text-sm'>S</span>}
                label='Tachado'
                onClick={handleStrikethrough}
              />

              <ToolbarSeparator />

              {/* Alignment */}
              <ToolbarButton
                icon={
                  <svg
                    className='size-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M3 21h18v-2H3v2zm0-4h12v-2H3v2zm0-4h18v-2H3v2zm0-4h12v-2H3v2zm0-6v2h18V3H3z' />
                  </svg>
                }
                label='Alinear izquierda'
                onClick={handleAlignLeft}
              />
              <ToolbarButton
                icon={
                  <svg
                    className='size-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M7 21h10v-2H7v2zm-4-4h18v-2H3v2zm4-4h10v-2H7v2zm-4-4h18v-2H3v2zm4-6v2h10V3H7z' />
                  </svg>
                }
                label='Centrar'
                onClick={handleAlignCenter}
              />
              <ToolbarButton
                icon={
                  <svg
                    className='size-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12v-2H9v2zm-6-6v2h18V3H3z' />
                  </svg>
                }
                label='Alinear derecha'
                onClick={handleAlignRight}
              />
              <ToolbarButton
                icon={
                  <svg
                    className='size-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-6v2h18V3H3z' />
                  </svg>
                }
                label='Justificar'
                onClick={handleAlignJustify}
              />

              <ToolbarSeparator />

              {/* Lists */}
              <ToolbarButton
                icon={
                  <svg
                    className='size-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z' />
                  </svg>
                }
                label='Lista con viñetas'
                onClick={handleBulletList}
              />
              <ToolbarButton
                icon={
                  <svg
                    className='size-4'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z' />
                  </svg>
                }
                label='Lista numerada'
                onClick={handleNumberedList}
              />

              <ToolbarSeparator />

              {/* Variables Dropdown */}
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setShowVariablesMenu(!showVariablesMenu)}
                  className={`flex items-center gap-2 h-8 px-3 rounded border transition-colors cursor-pointer ${
                    showVariablesMenu
                      ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]'
                      : 'border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>
                    Insertar variable
                  </span>
                  <svg
                    className={`size-4 transition-transform ${
                      showVariablesMenu ? 'rotate-180' : ''
                    }`}
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M7 10l5 5 5-5z' />
                  </svg>
                </button>

                {showVariablesMenu && (
                  <div className='absolute top-full left-0 mt-1 w-72 max-h-80 overflow-y-auto bg-white border border-neutral-200 rounded-lg shadow-xl z-50'>
                    {Object.entries(TEMPLATE_VARIABLES).map(
                      ([category, { label, variables }]) => (
                        <div
                          key={category}
                          className='border-b border-neutral-100 last:border-0'
                        >
                          <div className='px-3 py-2 bg-neutral-50'>
                            <span className='text-label-sm font-medium text-[var(--color-neutral-600)]'>
                              {label}
                            </span>
                          </div>
                          {variables.map((variable) => (
                            <button
                              key={variable.key}
                              type='button'
                              onClick={() => handleInsertVariable(variable.key)}
                              className='w-full px-3 py-2 text-left hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer'
                            >
                              <span className='text-body-sm text-[var(--color-neutral-900)]'>
                                {variable.label}
                              </span>
                              <span className='text-label-sm text-[var(--color-neutral-500)] ml-2'>
                                {variable.key}
                              </span>
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <ToolbarSeparator />

              {/* Logo info - logo comes from clinic configuration */}
              <div className='flex items-center gap-2 h-8 px-3 rounded bg-[var(--color-neutral-50)] border border-neutral-200'>
                {clinicLogo ? (
                  <>
                    <img
                      src={clinicLogo}
                      alt='Logo'
                      className='h-5 w-auto object-contain'
                    />
                    <span className='text-body-sm text-[var(--color-neutral-600)]'>
                      Logo de la clínica (arrastra para posicionar)
                    </span>
                  </>
                ) : (
                  <span className='text-body-sm text-[var(--color-neutral-500)]'>
                    Sin logo · Configúralo en Datos de la clínica
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editor / Preview Area */}
        <div className='flex-1 overflow-hidden p-6 bg-[#E2E7EA]'>
          <div className='h-full overflow-auto flex justify-center'>
            <div
              className='bg-white shadow-lg relative'
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm'
              }}
            >
              {/* Logo (draggable) - comes from clinic configuration */}
              {clinicLogo && !showPreview && (
                <div
                  className={`absolute cursor-move select-none ${
                    isDraggingLogo ? 'opacity-70' : ''
                  }`}
                  style={{
                    left: logoPosition.x,
                    top: logoPosition.y,
                    zIndex: 10
                  }}
                  onMouseDown={handleLogoMouseDown}
                >
                  <img
                    src={clinicLogo}
                    alt='Logo de la clínica'
                    className='max-w-[150px] max-h-[60px] object-contain pointer-events-none'
                    draggable={false}
                  />
                  <div className='absolute -bottom-6 left-0 text-label-sm text-[var(--color-neutral-500)] whitespace-nowrap'>
                    Arrastra para posicionar
                  </div>
                </div>
              )}

              {/* Logo in preview mode */}
              {clinicLogo && showPreview && (
                <div
                  className='absolute'
                  style={{
                    left: logoPosition.x,
                    top: logoPosition.y
                  }}
                >
                  <img
                    src={clinicLogo}
                    alt='Logo de la clínica'
                    className='max-w-[150px] max-h-[60px] object-contain'
                  />
                </div>
              )}

              {/* Editor Content */}
              {showPreview ? (
                <div
                  className='prose prose-sm max-w-none'
                  style={{
                    paddingTop: clinicLogo ? '70px' : '0',
                    fontFamily: 'Arial, sans-serif'
                  }}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleContentChange}
                  className='outline-none min-h-full'
                  style={{
                    paddingTop: clinicLogo ? '70px' : '0',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer with help text */}
        <footer className='flex-none px-6 py-3 border-t border-neutral-200 bg-neutral-50'>
          <div className='flex items-center justify-between'>
            <p className='text-body-sm text-[var(--color-neutral-500)]'>
              Usa{' '}
              <kbd className='px-1.5 py-0.5 bg-neutral-200 rounded text-label-sm'>
                Ctrl+S
              </kbd>{' '}
              para guardar • Las variables se reemplazarán automáticamente al
              generar el documento
            </p>
            <p className='text-body-sm text-[var(--color-neutral-500)]'>
              Última modificación:{' '}
              {template.lastModified
                ? new Date(template.lastModified).toLocaleString('es-ES')
                : 'Nunca'}
            </p>
          </div>
        </footer>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/40'
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className='w-[min(28rem,95vw)] bg-white rounded-xl shadow-xl overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='p-6'>
              <h3 className='text-title-lg font-medium text-[var(--color-neutral-900)] mb-2'>
                ¿Restaurar plantilla original?
              </h3>
              <p className='text-body-md text-[var(--color-neutral-600)]'>
                Se perderán todos los cambios realizados en esta plantilla y se
                restaurará a la versión predeterminada del sistema.
              </p>
            </div>
            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
              <button
                type='button'
                onClick={() => setShowResetConfirm(false)}
                className='px-4 py-2 text-body-md font-medium text-[var(--color-neutral-700)] rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer'
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={handleReset}
                className='px-4 py-2 text-body-md font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer'
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation */}
      <ConfirmDialog
        open={showUnsavedConfirm}
        onClose={() => setShowUnsavedConfirm(false)}
        onConfirm={handleForceClose}
        title='¿Salir sin guardar?'
        message='Tienes cambios sin guardar en esta plantilla. Si sales ahora, perderás todos los cambios realizados.'
        confirmLabel='Salir sin guardar'
        cancelLabel='Seguir editando'
        variant='warning'
      />
    </div>
  )

  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}
