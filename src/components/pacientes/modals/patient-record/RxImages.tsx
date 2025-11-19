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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    async function load() {
      if (!patientId) return
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
      }
    }
    void load()
  }, [patientId, supabase])
  return (
    <div
      className='bg-[#f8fafb] relative w-[74.75rem] h-[56.25rem]'
      data-node-id='457:41'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-[24px] top-[16px] cursor-pointer'
        style={{ left: 'calc(93.75% + 34.75px)' }}
        data-name='close'
        data-node-id='457:42'
      >
        <CloseRounded className='block max-w-none size-full text-[#24282c]' />
      </button>

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
          {/* Add RX button */}
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            className='absolute right-4 top-4 bg-[#f8fafb] border border-[#cbd3d9] px-4 py-2 rounded-[136px] inline-flex items-center gap-2 text-body-md text-[#24282c] cursor-pointer'
          >
            <AddPhotoAlternateRounded className='size-[24px]' />
            <span className='text-body-md text-[#24282c]'>Añadir RX</span>
          </button>
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
                const { error: insertError } = await supabase.from('clinical_attachments').insert({
                  patient_id: patientId,
                  staff_id: (await supabase.auth.getUser()).data.user?.id,
                  file_name: f.name,
                  file_type: f.type,
                  storage_path: path
                })
                if (insertError) {
                  // eslint-disable-next-line no-alert
                  alert(`No se pudo guardar el RX: ${insertError.message}`)
                }
                const d = new Date()
                let signedUrl: string | undefined
                try {
                  signedUrl = await getSignedUrl(path)
                } catch {
                  signedUrl = undefined
                }
                setItems((prev) => [
                  {
                    id: `new-${Date.now()}`,
                    title: f.name,
                    date: d.toLocaleDateString(DEFAULT_LOCALE, {
                      timeZone: DEFAULT_TIMEZONE
                    }),
                    storage_path: path,
                    signedUrl
                  },
                  ...prev
                ])
              } finally {
                if (e.target) e.target.value = ''
              }
            }}
          />

          {/* Left thumbnails rail with vertical scroll */}
          <div className='absolute left-4 top-[72px] bottom-4 w-[208px]'>
            <div className='h-full overflow-y-auto pr-2 rxThumbs'>
              {items.map((it, i) => (
                <div
                  key={it.id}
                  className={['w-[190px]', i === 0 ? '' : 'mt-4'].join(' ')}
                >
                  <button
                    type='button'
                    onClick={() => setActiveIndex(i)}
                    className={[
                      'h-[190px] w-full rounded-[8px] overflow-hidden grid place-items-center',
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
                      <ImageRounded className='text-white size-[48px]' />
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
          </div>

          {/* Main image viewer */}
          <div
            className='absolute rounded-[8px] overflow-hidden border border-[#cbd3d9] bg-[#3d434a]'
            style={{ left: 240, right: 16, top: 72, height: 448 }}
          >
            {items[activeIndex]?.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={items[activeIndex]!.signedUrl}
                alt={items[activeIndex]?.title ?? 'RX'}
                className='w-full h-full object-contain bg-[#3d434a]'
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
              {items[activeIndex]?.title ?? 'Radiografía'}
            </p>
            <p className='text-label-sm text-[#24282c]'>
              {items[activeIndex]?.date ?? '—'}
            </p>
          </div>

          {/* Description */}
          <p
            className='absolute text-body-md text-[#24282c]'
            style={{ left: 240, right: 16, top: 584 }}
          >
            {/* Descripción opcional: se podría almacenar junto al attachment en el futuro */}
            Vista previa del adjunto seleccionado.
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


