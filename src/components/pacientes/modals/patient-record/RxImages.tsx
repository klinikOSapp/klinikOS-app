/* eslint-disable @next/next/no-img-element */
import {
  AddPhotoAlternateRounded,
  DeleteRounded,
  FullscreenRounded,
  ImageRounded
} from '@/components/icons/md3'
import { usePatientFiles } from '@/context/PatientFilesContext'
import React from 'react'
import RxImageViewer from './RxImageViewer'

type RxImagesProps = {
  onClose?: () => void
  patientId?: string
}

type RxImage = {
  id: string
  name: string
  date: string
  url: string
  description: string
}

// Datos iniciales de ejemplo
const initialImages: RxImage[] = [
  {
    id: '1',
    name: 'Periapical 2.6',
    date: '24-06-2025',
    url: '',
    description:
      'Caries distal profunda en 2.6, probable pulpitis reversible. No signos radiográficos de patología periapical activa. Periodonto compatible con gingivitis localizada leve.'
  }
]

export default function RxImages({ onClose, patientId }: RxImagesProps) {
  const { getRxImagesByPatient } = usePatientFiles()
  const [localImages, setLocalImages] = React.useState<RxImage[]>(initialImages)
  const [selectedId, setSelectedId] = React.useState<string>('1')
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  // HU-018: Advanced viewer state
  const [viewerOpen, setViewerOpen] = React.useState(false)

  // Get images from context (uploaded from clinical history)
  const contextFiles = patientId ? getRxImagesByPatient(patientId) : []

  // Convert context files to RxImage format
  const contextImages: RxImage[] = contextFiles.map((file) => ({
    id: file.id,
    name: file.name,
    date: new Date(file.uploadedAt)
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '-'),
    url: file.url,
    description: file.description || ''
  }))

  // Combine local images with context images (avoid duplicates by id)
  const images = React.useMemo(() => {
    const localIds = new Set(localImages.map((img) => img.id))
    const uniqueContextImages = contextImages.filter(
      (img) => !localIds.has(img.id)
    )
    return [...localImages, ...uniqueContextImages]
  }, [localImages, contextImages])

  const selectedImage = images.find((img) => img.id === selectedId) || images[0]

  // Update selected image when images change
  React.useEffect(() => {
    if (!selectedImage && images.length > 0) {
      setSelectedId(images[0].id)
    }
  }, [images, selectedImage])

  const handleAddClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: RxImage[] = []
    const today = new Date()
      .toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '-')

    Array.from(files).forEach((file, index) => {
      const url = URL.createObjectURL(file)
      const id = `new-${Date.now()}-${index}`
      newImages.push({
        id,
        name:
          file.name.replace(/\.[^/.]+$/, '') ||
          `Radiografía ${images.length + index + 1}`,
        date: today,
        url,
        description: ''
      })
    })

    setLocalImages((prev) => [...prev, ...newImages])
    if (newImages.length > 0) {
      setSelectedId(newImages[0].id)
    }

    // Reset input
    e.target.value = ''
  }

  const handleDelete = (id: string) => {
    setLocalImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id)
      // If we deleted the selected image, select the first one
      if (selectedId === id && filtered.length > 0) {
        setSelectedId(filtered[0].id)
      }
      return filtered
    })
  }

  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      localImages.forEach((img) => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className='bg-[#f8fafb] w-full h-full flex flex-col overflow-hidden'
      data-node-id='457:41'
    >
      {/* Header */}
      <div
        className='shrink-0 bg-[#f8fafb] flex flex-col gap-[8px] items-start px-8 pt-10 pb-6'
        data-name='Header'
      >
        <div className='flex gap-[8px] items-center'>
          <p className="font-['Inter:Regular',_sans-serif] text-[#24282c] text-title-lg whitespace-pre">
            Imágenes RX
          </p>
        </div>
        <p className="font-['Inter:Regular',_sans-serif] text-[#24282c] text-body-sm">
          Consulta las imágenes radiológicas de tus pacientes, así como añadir
          anotaciones para el resto del equipo.
        </p>
      </div>

      {/* Card - grows to fill available space */}
      <div
        className='flex-1 min-h-0 mx-8 mb-8 bg-white border border-[#e2e7ea] border-solid rounded-[8px] overflow-hidden'
        data-node-id='457:95'
      >
        <div className='h-full flex flex-col p-4'>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            onChange={handleFileChange}
            className='hidden'
          />

          {/* Header row with Add RX button */}
          <div className='shrink-0 flex justify-end mb-4'>
            <button
              type='button'
              onClick={handleAddClick}
              className='bg-[#f8fafb] border border-[#cbd3d9] px-4 py-2 rounded-[136px] inline-flex items-center gap-2 text-body-md text-[#24282c] cursor-pointer hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-400)] transition-colors'
            >
              <AddPhotoAlternateRounded className='size-[24px]' />
              <span className='text-body-md text-[#24282c]'>Añadir RX</span>
            </button>
          </div>

          {/* Content row with thumbnails and viewer */}
          <div className='flex-1 min-h-0 flex gap-4'>
            {/* Left thumbnails rail with vertical scroll */}
            <div className='shrink-0 w-[208px] overflow-y-auto pr-2 rxThumbs'>
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`w-[190px] ${
                    img.id !== images[0]?.id ? 'mt-4' : ''
                  } cursor-pointer group relative`}
                  onClick={() => setSelectedId(img.id)}
                >
                  <div
                    className={`bg-[#24282c] h-[190px] rounded-[8px] overflow-hidden grid place-items-center ${
                      selectedId === img.id
                        ? 'border-2 border-[#51d6c7]'
                        : 'border border-[#cbd3d9]'
                    }`}
                  >
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.name}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <ImageRounded className='text-white size-[48px]' />
                    )}
                  </div>
                  {/* Delete button on hover */}
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(img.id)
                    }}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
                    aria-label='Eliminar imagen'
                  >
                    <DeleteRounded className='size-4' />
                  </button>
                  <div className='mt-1'>
                    <p className='text-body-md text-[#24282c] truncate'>
                      {img.name}
                    </p>
                    <p className='text-label-sm text-[#24282c]'>{img.date}</p>
                  </div>
                </div>
              ))}

              {/* Empty state if no images */}
              {images.length === 0 && (
                <div className='w-[190px] h-[190px] border-2 border-dashed border-[#cbd3d9] rounded-[8px] grid place-items-center'>
                  <div className='text-center'>
                    <ImageRounded className='text-[#cbd3d9] size-12 mx-auto mb-2' />
                    <p className='text-label-sm text-[#8a95a1]'>Sin imágenes</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: viewer + info */}
            <div className='flex-1 min-w-0 flex flex-col gap-4'>
              {/* Main image viewer */}
              <div className='flex-1 min-h-0 rounded-[8px] overflow-hidden border border-[#cbd3d9] bg-[#3d434a] group relative'>
                {selectedImage?.url ? (
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className='w-full h-full object-contain'
                  />
                ) : (
                  <div className='w-full h-full grid place-items-center'>
                    <ImageRounded className='text-white size-[64px]' />
                  </div>
                )}

                {/* HU-018: Open advanced viewer button */}
                <button
                  type='button'
                  onClick={() => setViewerOpen(true)}
                  className='absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all'
                  aria-label='Abrir visor avanzado'
                  title='Visor avanzado (zoom, brillo, contraste, comparación)'
                >
                  <FullscreenRounded className='size-6 text-white' />
                </button>
              </div>

              {/* Title row */}
              <div className='shrink-0 flex items-center justify-between'>
                <p className='text-title-lg text-[#24282c]'>
                  {selectedImage?.name || 'Sin imagen seleccionada'}
                </p>
                <p className='text-label-sm text-[#24282c]'>
                  {selectedImage?.date || ''}
                </p>
              </div>

              {/* Description */}
              <p className='shrink-0 text-body-md text-[#24282c]'>
                {selectedImage?.description || 'Sin descripción disponible.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .rxThumbs {
          scrollbar-width: thin;
          scrollbar-color: #51d6c7 transparent;
        }
        .rxThumbs::-webkit-scrollbar {
          width: 6px;
        }
        .rxThumbs::-webkit-scrollbar-track {
          background: transparent;
        }
        .rxThumbs::-webkit-scrollbar-thumb {
          background-color: #51d6c7;
          border-radius: 16px;
        }
      `}</style>

      {/* HU-018: Advanced RX Image Viewer */}
      <RxImageViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={images}
        selectedImageId={selectedId}
        onSelectImage={setSelectedId}
      />
    </div>
  )
}
