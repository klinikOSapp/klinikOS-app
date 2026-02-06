/**
 * HU-018: Advanced Radiography Viewer
 * Features: Zoom, Brightness, Contrast, Comparison mode
 */
'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import {
  CloseRounded,
  ZoomInRounded,
  ZoomOutRounded,
  RestartAltRounded,
  CompareRounded,
  DownloadRounded,
  PrintRounded,
  BrightnessHighRounded,
  ContrastRounded,
  FullscreenRounded
} from '@/components/icons/md3'

type RxImage = {
  id: string
  name: string
  date: string
  url: string
  description: string
}

type RxImageViewerProps = {
  open: boolean
  onClose: () => void
  images: RxImage[]
  selectedImageId: string
  onSelectImage?: (id: string) => void
}

// Single image display with controls
type ImageDisplayProps = {
  image: RxImage | null
  zoom: number
  brightness: number
  contrast: number
  onZoomChange: (delta: number) => void
  position: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  showControls?: boolean
  label?: string
}

function ImageDisplay({
  image,
  zoom,
  brightness,
  contrast,
  position,
  onPositionChange,
  showControls = false,
  label
}: ImageDisplayProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onPositionChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    // Wheel zoom is handled by parent
  }

  if (!image) {
    return (
      <div className='flex-1 flex items-center justify-center bg-[#1a1a1a] rounded-lg'>
        <p className='text-neutral-400 text-body-md'>Selecciona una imagen</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='flex-1 relative bg-[#1a1a1a] rounded-lg overflow-hidden'
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {label && (
        <div className='absolute top-3 left-3 z-10 px-3 py-1 bg-black/60 rounded-full'>
          <span className='text-white text-label-sm font-medium'>{label}</span>
        </div>
      )}
      
      <div
        className='w-full h-full flex items-center justify-center transition-transform'
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          filter: `brightness(${brightness}%) contrast(${contrast}%)`
        }}
      >
        {image.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.name}
            className='max-w-full max-h-full object-contain select-none'
            draggable={false}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
            <div className='w-64 h-64 bg-neutral-800 rounded-lg flex items-center justify-center'>
              <span className='text-neutral-500 text-6xl'>RX</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Image info overlay */}
      <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4'>
        <p className='text-white text-body-md font-medium'>{image.name}</p>
        <p className='text-neutral-300 text-label-sm'>{image.date}</p>
      </div>
    </div>
  )
}

export default function RxImageViewer({
  open,
  onClose,
  images,
  selectedImageId,
  onSelectImage
}: RxImageViewerProps) {
  // State
  const [zoom, setZoom] = React.useState(1)
  const [brightness, setBrightness] = React.useState(100)
  const [contrast, setContrast] = React.useState(100)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isCompareMode, setIsCompareMode] = React.useState(false)
  const [compareImageId, setCompareImageId] = React.useState<string | null>(null)
  const [comparePosition, setComparePosition] = React.useState({ x: 0, y: 0 })

  // Selected images
  const selectedImage = images.find(img => img.id === selectedImageId) || null
  const compareImage = compareImageId ? images.find(img => img.id === compareImageId) || null : null

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setZoom(1)
      setBrightness(100)
      setContrast(100)
      setPosition({ x: 0, y: 0 })
      setComparePosition({ x: 0, y: 0 })
      setIsCompareMode(false)
      setCompareImageId(null)
    }
  }, [open])

  // Handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 4))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setComparePosition({ x: 0, y: 0 })
  }
  const handleResetFilters = () => {
    setBrightness(100)
    setContrast(100)
  }

  const handleToggleCompare = () => {
    if (isCompareMode) {
      setIsCompareMode(false)
      setCompareImageId(null)
    } else {
      // Find another image to compare
      const otherImage = images.find(img => img.id !== selectedImageId)
      if (otherImage) {
        setCompareImageId(otherImage.id)
        setIsCompareMode(true)
      }
    }
  }

  const handleDownload = () => {
    if (selectedImage?.url) {
      const link = document.createElement('a')
      link.href = selectedImage.url
      link.download = `${selectedImage.name}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePrint = () => {
    if (selectedImage?.url) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>${selectedImage.name}</title></head>
            <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">
              <img src="${selectedImage.url}" style="max-width:100%; max-height:100%; filter: brightness(${brightness}%) contrast(${contrast}%);" />
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.onload = () => printWindow.print()
      }
    }
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case '0':
          handleResetZoom()
          break
        case 'c':
        case 'C':
          handleToggleCompare()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className='fixed inset-0 z-[9999] bg-black/95 flex flex-col'>
      {/* Top toolbar */}
      <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-800'>
        <div className='flex items-center gap-4'>
          <h2 className='text-white text-title-md'>Visor de radiografías</h2>
          {selectedImage && (
            <span className='text-neutral-400 text-body-sm'>
              {selectedImage.name} - {selectedImage.date}
            </span>
          )}
        </div>
        <button
          type='button'
          onClick={onClose}
          className='p-2 hover:bg-neutral-800 rounded-lg transition-colors'
          aria-label='Cerrar'
        >
          <CloseRounded className='size-6 text-white' />
        </button>
      </div>

      {/* Main content */}
      <div className='flex-1 flex overflow-hidden'>
        {/* Left sidebar - thumbnails (only in compare mode or always visible) */}
        {(isCompareMode || images.length > 1) && (
          <div className='w-48 border-r border-neutral-800 p-3 overflow-y-auto'>
            <p className='text-neutral-400 text-label-sm mb-3 uppercase'>
              {isCompareMode ? 'Seleccionar para comparar' : 'Imágenes'}
            </p>
            <div className='space-y-3'>
              {images.map(img => (
                <button
                  key={img.id}
                  type='button'
                  onClick={() => {
                    if (isCompareMode && img.id !== selectedImageId) {
                      setCompareImageId(img.id)
                    } else {
                      onSelectImage?.(img.id)
                    }
                  }}
                  className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    img.id === selectedImageId
                      ? 'border-brand-500'
                      : img.id === compareImageId
                        ? 'border-amber-500'
                        : 'border-transparent hover:border-neutral-600'
                  }`}
                >
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full bg-neutral-800 flex items-center justify-center'>
                      <span className='text-neutral-500 text-2xl'>RX</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image viewer(s) */}
        <div className='flex-1 flex p-4 gap-4'>
          <ImageDisplay
            image={selectedImage}
            zoom={zoom}
            brightness={brightness}
            contrast={contrast}
            position={position}
            onPositionChange={setPosition}
            onZoomChange={() => {}}
            label={isCompareMode ? 'Principal' : undefined}
          />

          {isCompareMode && (
            <ImageDisplay
              image={compareImage}
              zoom={zoom}
              brightness={brightness}
              contrast={contrast}
              position={comparePosition}
              onPositionChange={setComparePosition}
              onZoomChange={() => {}}
              label='Comparación'
            />
          )}
        </div>

        {/* Right sidebar - controls */}
        <div className='w-64 border-l border-neutral-800 p-4'>
          {/* Zoom controls */}
          <div className='mb-6'>
            <p className='text-neutral-400 text-label-sm mb-3 uppercase'>Zoom</p>
            <div className='flex items-center gap-2 mb-3'>
              <button
                type='button'
                onClick={handleZoomOut}
                className='p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors'
                aria-label='Reducir zoom'
              >
                <ZoomOutRounded className='size-5 text-white' />
              </button>
              <div className='flex-1 text-center'>
                <span className='text-white text-body-md font-medium'>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <button
                type='button'
                onClick={handleZoomIn}
                className='p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors'
                aria-label='Aumentar zoom'
              >
                <ZoomInRounded className='size-5 text-white' />
              </button>
            </div>
            <button
              type='button'
              onClick={handleResetZoom}
              className='w-full flex items-center justify-center gap-2 py-2 text-neutral-400 hover:text-white transition-colors'
            >
              <RestartAltRounded className='size-4' />
              <span className='text-label-sm'>Restablecer</span>
            </button>
          </div>

          {/* Brightness control */}
          <div className='mb-6'>
            <div className='flex items-center gap-2 mb-2'>
              <BrightnessHighRounded className='size-4 text-neutral-400' />
              <p className='text-neutral-400 text-label-sm uppercase'>Brillo</p>
              <span className='ml-auto text-white text-label-sm'>{brightness}%</span>
            </div>
            <input
              type='range'
              min='0'
              max='200'
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className='w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-brand-500'
            />
          </div>

          {/* Contrast control */}
          <div className='mb-6'>
            <div className='flex items-center gap-2 mb-2'>
              <ContrastRounded className='size-4 text-neutral-400' />
              <p className='text-neutral-400 text-label-sm uppercase'>Contraste</p>
              <span className='ml-auto text-white text-label-sm'>{contrast}%</span>
            </div>
            <input
              type='range'
              min='0'
              max='200'
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className='w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-brand-500'
            />
          </div>

          {/* Reset filters */}
          <button
            type='button'
            onClick={handleResetFilters}
            className='w-full flex items-center justify-center gap-2 py-2 mb-6 text-neutral-400 hover:text-white border border-neutral-700 rounded-lg transition-colors'
          >
            <RestartAltRounded className='size-4' />
            <span className='text-body-sm'>Restablecer filtros</span>
          </button>

          {/* Comparison mode toggle */}
          {images.length > 1 && (
            <button
              type='button'
              onClick={handleToggleCompare}
              className={`w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-lg transition-colors ${
                isCompareMode
                  ? 'bg-brand-500 text-brand-900'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white'
              }`}
            >
              <CompareRounded className='size-5' />
              <span className='text-body-sm font-medium'>
                {isCompareMode ? 'Salir de comparación' : 'Comparar imágenes'}
              </span>
            </button>
          )}

          {/* Actions */}
          <div className='pt-4 border-t border-neutral-800'>
            <p className='text-neutral-400 text-label-sm mb-3 uppercase'>Acciones</p>
            <div className='space-y-2'>
              <button
                type='button'
                onClick={handleDownload}
                className='w-full flex items-center gap-3 px-3 py-2 text-white hover:bg-neutral-800 rounded-lg transition-colors'
              >
                <DownloadRounded className='size-5' />
                <span className='text-body-sm'>Descargar imagen</span>
              </button>
              <button
                type='button'
                onClick={handlePrint}
                className='w-full flex items-center gap-3 px-3 py-2 text-white hover:bg-neutral-800 rounded-lg transition-colors'
              >
                <PrintRounded className='size-5' />
                <span className='text-body-sm'>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className='mt-6 pt-4 border-t border-neutral-800'>
            <p className='text-neutral-500 text-label-sm mb-2'>Atajos de teclado</p>
            <div className='space-y-1 text-label-sm'>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Zoom +/-</span>
                <span className='text-neutral-400'>+ / -</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Restablecer</span>
                <span className='text-neutral-400'>0</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Comparar</span>
                <span className='text-neutral-400'>C</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-neutral-500'>Cerrar</span>
                <span className='text-neutral-400'>Esc</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image description */}
      {selectedImage?.description && (
        <div className='px-6 py-4 border-t border-neutral-800'>
          <p className='text-neutral-400 text-label-sm mb-1'>Descripción</p>
          <p className='text-white text-body-sm'>{selectedImage.description}</p>
        </div>
      )}
    </div>,
    document.body
  )
}
