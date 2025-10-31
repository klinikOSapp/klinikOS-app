import React from 'react'

const imgImage8 =
  'http://localhost:3845/assets/81fc6bd3b04b58147318626ad1d3149aa0c146fe.png'
const imgClose =
  'http://localhost:3845/assets/5ef958204bb620a694618e0538ad4b9d50b8e1c7.svg'
const imgAddIcon =
  'http://localhost:3845/assets/d7b1b4487f3951ea647dcf8ec980e427ffe208c0.svg'

type RxImagesProps = {
  onClose?: () => void
}

export default function RxImages({ onClose }: RxImagesProps) {
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
        <img alt='' className='block max-w-none size-full' src={imgClose} />
      </button>

      {/* Header */}
      <div
        className='absolute bg-[#f8fafb] content-stretch flex flex-col gap-[8px] items-start left-[32px] top-[40px] w-[568px]'
        data-name='Header'
      >
        <div className='content-stretch flex gap-[8px] items-center relative shrink-0'>
          <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#24282c] text-title-lg text-nowrap whitespace-pre">
            Imágenes & RX
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
            className='absolute right-4 top-4 bg-[#f8fafb] border border-[#cbd3d9] px-4 py-2 rounded-[136px] inline-flex items-center gap-2 text-body-md text-[#24282c] cursor-pointer'
          >
            
            <img alt='' src={imgAddIcon} className='size-[24px]' />
            <span className='text-body-md text-[#24282c]'>Añadir RX</span>
          </button>

          {/* Left thumbnails rail with vertical scroll */}
          <div className='absolute left-4 top-[72px] bottom-4 w-[208px]'>
            <div className='h-full overflow-y-auto pr-2 rxThumbs'>
              {/* First selected thumb */}
              <div className='w-[190px]'>
                <div className='bg-[#24282c] border-2 border-[#51d6c7] h-[190px] rounded-[8px] overflow-hidden'>
                  <img
                    alt=''
                    src={imgImage8}
                    className='w-[114%] h-full object-cover -ml-[7%]'
                  />
                </div>
                <div className='mt-1'>
                  <p className='text-body-md text-[#24282c]'>
                    Radiografía 1
                  </p>
                  <p className='text-label-sm text-[#24282c]'>
                    24-06-2025
                  </p>
                </div>
              </div>
              {/* More thumbs - placeholders to enable scroll */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className='w-[190px] mt-4'>
                  <div className='bg-[#24282c] border border-[#cbd3d9] h-[190px] rounded-[8px]' />
                  <div className='mt-1'>
                    <p className='text-body-md text-[#24282c]'>
                      Radiografía {i + 2}
                    </p>
                    <p className='text-label-sm text-[#24282c]'>
                      24-06-2025
                    </p>
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
            <img
              alt=''
              src={imgImage8}
              className='w-[114%] h-full object-cover -ml-[7%]'
            />
          </div>

          {/* Title row */}
          <div
            className='absolute flex items-center justify-between'
            style={{ left: 240, right: 16, top: 536 }}
          >
            <p className='text-title-lg text-[#24282c]'>
              Periapical 2.6
            </p>
            <p className='text-label-sm text-[#24282c]'>
              24-06-2025
            </p>
          </div>

          {/* Description */}
          <p
            className='absolute text-body-md text-[#24282c]'
            style={{ left: 240, right: 16, top: 584 }}
          >
            Caries distal profunda en 2.6, probable pulpitis reversible. No
            signos radiográficos de patología periapical activa. Periodonto
            compatible con gingivitis localizada leve.
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
