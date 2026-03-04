import React from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import AddPhotoAlternateRounded from '@mui/icons-material/AddPhotoAlternateRounded'
import ImageRounded from '@mui/icons-material/ImageRounded'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@/lib/datetime'
import { uploadPatientFile, getSignedUrl } from '@/lib/storage'

type RxImagesProps = {
  onClose?: () => void
  patientId?: string
}

export default function RxImages({ onClose, patientId }: RxImagesProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [items, setItems] = React.useState<
    { id: string; title: string; date: string; storage_path?: string; signedUrl?: string }[]
  >([])
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [toast, setToast] = React.useState<{
    message: string
    variant: 'success' | 'error'
  } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const loadImages = React.useCallback(async () => {
    if (!patientId) {
      setItems([])
      return
    }
    const { data } = await supabase
      .from('clinical_attachments')
      .select('id, file_name, file_type, storage_path, created_at')
      .eq('patient_id', patientId)
      .ilike('file_type', 'image/%')
      .order('created_at', { ascending: false })
      .limit(12)
    if (Array.isArray(data)) {
      const mapped = await Promise.all(
        data.map(async (r: any) => {
          let signedUrl: string | undefined
          if (r.storage_path) {
            try {
              signedUrl = await getSignedUrl(r.storage_path)
            } catch {
              signedUrl = undefined
            }
          }
          return {
            id: String(r.id),
            title: r.file_name ?? 'Radiografía',
            date: new Date(r.created_at).toLocaleDateString(DEFAULT_LOCALE, {
              timeZone: DEFAULT_TIMEZONE
            }),
            storage_path: r.storage_path ?? undefined,
            signedUrl
          }
        })
      )
      setItems(mapped)
      setActiveIndex(0)
    }
  }, [patientId, supabase])

  React.useEffect(() => {
    void loadImages()
  }, [loadImages])
  return (
    <div
      className='bg-[#f8fafb] relative w-full h-full flex flex-col p-8 overflow-hidden'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-6 top-4 right-4 cursor-pointer'
      >
        <CloseRounded className='block max-w-none size-full text-[#24282c]' />
      </button>

      {/* Header */}
      <div className='flex flex-col gap-2 mb-6 max-w-[568px]'>
        <p className='text-[#24282c] text-title-lg'>
          Imágenes RX
        </p>
        <p className='text-[#24282c] text-body-sm'>
          Consulta las imágenes radiológicas de tus pacientes, así como añadir
          anotaciones para el resto del equipo.
        </p>
      </div>

      {/* Card */}
      <div className='flex-1 min-h-0 bg-white border border-[#e2e7ea] rounded-lg flex flex-col overflow-hidden'>
        <div className='flex-1 min-h-0 relative flex flex-col p-4'>
          {/* Add RX button */}
          <div className='flex justify-end mb-4'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='bg-[#f8fafb] border border-[#cbd3d9] px-4 py-2 rounded-[136px] inline-flex items-center gap-2 text-body-md text-[#24282c] cursor-pointer'
            >
              <AddPhotoAlternateRounded className='size-6' />
              <span className='text-body-md text-[#24282c]'>Añadir RX</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f || !patientId) return
              try {
                const { path } = await uploadPatientFile({
                  patientId,
                  file: f,
                  kind: 'rx'
                })
                const { data: authData } = await supabase.auth.getUser()
                const staffId = authData.user?.id
                if (!staffId) throw new Error('No hay usuario autenticado')

                const { error: insertError } = await supabase.from('clinical_attachments').insert({
                  patient_id: patientId,
                  staff_id: staffId,
                  file_name: f.name,
                  file_type: f.type,
                  storage_path: path
                })
                if (insertError) throw insertError
                await loadImages()
                setToast({ message: 'RX subida correctamente', variant: 'success' })
              } catch (error: any) {
                setToast({
                  message: error?.message || 'No se pudo guardar el RX',
                  variant: 'error'
                })
              } finally {
                window.setTimeout(() => setToast(null), 3000)
                if (e.target) e.target.value = ''
              }
            }}
          />

          {/* Content: thumbnails + viewer */}
          <div className='flex flex-1 min-h-0 gap-4'>
            {/* Left thumbnails rail with vertical scroll */}
            <div className='w-[208px] shrink-0 overflow-y-auto pr-2 rxThumbs'>
              {items.map((it, i) => (
                <div
                  key={it.id}
                  className={['w-[190px]', i === 0 ? '' : 'mt-4'].join(' ')}
                >
                  <button
                    type='button'
                    onClick={() => setActiveIndex(i)}
                    className={[
                      'h-[190px] w-full rounded-lg overflow-hidden grid place-items-center',
                      i === activeIndex
                        ? 'bg-[#24282c] border-2 border-[#51d6c7]'
                        : 'bg-[#24282c] border border-[#cbd3d9]'
                    ].join(' ')}
                  >
                    {it.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.signedUrl}
                        alt={it.title}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <ImageRounded className='text-white size-12' />
                    )}
                  </button>
                  <div className='mt-1 text-left'>
                    <p className='text-body-md text-[#24282c] truncate'>
                      {it.title}
                    </p>
                    <p className='text-label-sm text-[#24282c]'>{it.date}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: viewer + info */}
            <div className='flex-1 min-w-0 flex flex-col gap-4'>
              {/* Main image viewer */}
              <div className='flex-1 min-h-0 rounded-lg overflow-hidden border border-[#cbd3d9] bg-[#3d434a]'>
                {items[activeIndex]?.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={items[activeIndex]!.signedUrl}
                    alt={items[activeIndex]?.title ?? 'RX'}
                    className='w-full h-full object-contain bg-[#3d434a]'
                  />
                ) : (
                  <div className='w-full h-full grid place-items-center'>
                    <ImageRounded className='text-white size-16' />
                  </div>
                )}
              </div>

              {/* Title row */}
              <div className='flex items-center justify-between'>
                <p className='text-title-lg text-[#24282c]'>
                  {items[activeIndex]?.title ?? 'Radiografía'}
                </p>
                <p className='text-label-sm text-[#24282c]'>
                  {items[activeIndex]?.date ?? '—'}
                </p>
              </div>

              {/* Description */}
              <p className='text-body-md text-[#24282c]'>
                Vista previa del adjunto seleccionado.
              </p>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className='fixed right-4 bottom-4 z-[200]'>
          <div
            className={[
              'min-w-[240px] max-w-[360px] rounded-lg border shadow-[var(--shadow-cta)] px-3 py-2 flex items-start gap-2',
              toast.variant === 'success'
                ? 'bg-[var(--color-success-50)] border-[var(--color-success-200)] text-[var(--color-success-800)]'
                : 'bg-[var(--color-error-50)] border-[var(--color-error-200)] text-[var(--color-error-800)]'
            ].join(' ')}
          >
            <p className='text-body-md flex-1'>{toast.message}</p>
            <button
              type='button'
              aria-label='Cerrar aviso'
              className='ml-2 leading-none text-body-md'
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
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

