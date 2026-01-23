/* eslint-disable @next/next/no-img-element */
import React from 'react'
import {
  AddPhotoAlternateRounded,
  CloseRounded,
  ImageRounded,
  DeleteRounded
} from '@/components/icons/md3'

type RxImagesProps = {
  onClose?: () => void
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
    description: 'Caries distal profunda en 2.6, probable pulpitis reversible. No signos radiográficos de patología periapical activa. Periodonto compatible con gingivitis localizada leve.'
  }
]

export default function RxImages({ onClose }: RxImagesProps) {
  const [images, setImages] = React.useState<RxImage[]>(initialImages)
  const [selectedId, setSelectedId] = React.useState<string>('1')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const selectedImage = images.find(img => img.id === selectedId) || images[0]

  const handleAddClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: RxImage[] = []
    const today = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-')

    Array.from(files).forEach((file, index) => {
      const url = URL.createObjectURL(file)
      const id = `new-${Date.now()}-${index}`
      newImages.push({
        id,
        name: file.name.replace(/\.[^/.]+$/, '') || `Radiografía ${images.length + index + 1}`,
        date: today,
        url,
        description: ''
      })
    })

    setImages(prev => [...prev, ...newImages])
    if (newImages.length > 0) {
      setSelectedId(newImages[0].id)
    }

    // Reset input
    e.target.value = ''
  }

  const handleDelete = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
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
      images.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })
    }
  }, [images])

  return (
    <div
      className='bg-[#f8fafb] relative w-full h-full'
      data-node-id='457:41'
    >
      {/* Header */}
      <div
        className='absolute bg-[#f8fafb] content-stretch flex flex-col gap-[8px] items-start left-[32px] top-[40px] w-[568px]'
        data-name='Header'
      >
        <div className='content-stretch flex gap-[8px] items-center relative shrink-0'>
          <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#24282c] text-title-lg text-nowrap whitespace-pre">
            Imágenes RX
          </p>
        </div>
        <p className="font-['Inter:Regular',_sans-serif] min-w-full relative shrink-0 text-[#24282c] text-body-sm w-[min-content]">
          Consulta las imágenes radiológicas de tus pacientes, así como añadir
          anotaciones para el resto del equipo.
        </p>
      </div>

      {/* Card - anchor to left/right to avoid rounding overflow */}
      <div
        className='absolute bg-white border border-[#e2e7ea] border-solid rounded-[8px]'
        style={{ left: 32, right: 32, top: 164, height: 683 }}
        data-node-id='457:95'
      >
        <div
          className='relative rounded-[inherit] px-plnav py-fluid-md'
          style={{ height: 683 }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Add RX button */}
          <button
            type='button'
            onClick={handleAddClick}
            className='absolute right-4 top-4 bg-[#f8fafb] border border-[#cbd3d9] px-4 py-2 rounded-[136px] inline-flex items-center gap-2 text-body-md text-[#24282c] cursor-pointer hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-400)] transition-colors'
          >
            <AddPhotoAlternateRounded className='size-[24px]' />
            <span className='text-body-md text-[#24282c]'>Añadir RX</span>
          </button>

          {/* Left thumbnails rail with vertical scroll */}
          <div className='absolute left-4 top-[72px] bottom-4 w-[208px]'>
            <div className='h-full overflow-y-auto pr-2 rxThumbs'>
              {images.map((img) => (
                <div 
                  key={img.id} 
                  className={`w-[190px] ${img.id !== images[0]?.id ? 'mt-4' : ''} cursor-pointer group relative`}
                  onClick={() => setSelectedId(img.id)}
                >
                  <div className={`bg-[#24282c] h-[190px] rounded-[8px] overflow-hidden grid place-items-center ${
                    selectedId === img.id 
                      ? 'border-2 border-[#51d6c7]' 
                      : 'border border-[#cbd3d9]'
                  }`}>
                    {img.url ? (
                      <img 
                        src={img.url} 
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageRounded className='text-white size-[48px]' />
                    )}
                  </div>
                  {/* Delete button on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(img.id)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label="Eliminar imagen"
                  >
                    <DeleteRounded className="size-4" />
                  </button>
                  <div className='mt-1'>
                    <p className='text-body-md text-[#24282c] truncate'>
                      {img.name}
                    </p>
                    <p className='text-label-sm text-[#24282c]'>
                      {img.date}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Empty state if no images */}
              {images.length === 0 && (
                <div className="w-[190px] h-[190px] border-2 border-dashed border-[#cbd3d9] rounded-[8px] grid place-items-center">
                  <div className="text-center">
                    <ImageRounded className="text-[#cbd3d9] size-12 mx-auto mb-2" />
                    <p className="text-label-sm text-[#8a95a1]">Sin imágenes</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main image viewer */}
          <div
            className='absolute rounded-[8px] overflow-hidden border border-[#cbd3d9] bg-[#3d434a]'
            style={{ left: 240, right: 16, top: 72, height: 448 }}
          >
            {selectedImage?.url ? (
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className='w-full h-full grid place-items-center'>
                <ImageRounded className='text-white size-[64px]' />
              </div>
            )}
          </div>

          {/* Title row */}
          <div
            className='absolute flex items-center justify-between'
            style={{ left: 240, right: 16, top: 536 }}
          >
            <p className='text-title-lg text-[#24282c]'>
              {selectedImage?.name || 'Sin imagen seleccionada'}
            </p>
            <p className='text-label-sm text-[#24282c]'>
              {selectedImage?.date || ''}
            </p>
          </div>

          {/* Description */}
          <p
            className='absolute text-body-md text-[#24282c]'
            style={{ left: 240, right: 16, top: 584 }}
          >
            {selectedImage?.description || 'Sin descripción disponible.'}
          </p>
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
    </div>
  )
}


