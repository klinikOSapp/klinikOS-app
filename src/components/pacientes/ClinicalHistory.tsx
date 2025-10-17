import React from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'

const imgImage7 =
  'http://localhost:3845/assets/f920d7654ef7da272b238b8cf87335e1b7525e87.png'
const imgFrame257 =
  'http://localhost:3845/assets/32603aa2bb5a605bdf4f394aa9dbfdb440bdd68e.png'
const imgFrame258 =
  'http://localhost:3845/assets/169480ffca2c939f628b1c3cf2e79c07ca83281d.png'
const imgFrame22 =
  'http://localhost:3845/assets/74312461fa6f1aeea37c8026f0fa560c8bac19d6.svg'
const imgFrame24 =
  'http://localhost:3845/assets/e8e9c127c34862c30917d77b4fd0c3ca2bf6e29e.svg'

type ClinicalHistoryProps = {
  onClose?: () => void
}

export default function ClinicalHistory({ onClose }: ClinicalHistoryProps) {
  return (
    <div
      className='bg-[#f8fafb] relative w-[1196px]'
      style={{ width: 1196, height: 900 }}
      data-node-id='426:934'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-[24px] top-[16px] cursor-pointer'
        data-name='close'
        data-node-id='426:935'
        style={{ left: 'calc(93.75% + 34.75px)' }}
      >
        <CloseRounded className='size-6 text-[#24282c]' />
      </button>

      <div
        className='absolute bg-[#24282c] box-border content-stretch flex gap-[8px] items-center justify-center left-[32px] px-[8px] py-[4px] rounded-[72px] top-[164px]'
        data-node-id='426:1016'
      >
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#f8fafb] text-[12px] text-nowrap whitespace-pre">
          Próximas
        </p>
      </div>
      <div
        className='absolute box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[4px] rounded-[72px] top-[164px]'
        data-node-id='426:1017'
        style={{ left: 'calc(6.25% + 42.25px)' }}
      >
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#24282c] text-[12px] text-nowrap whitespace-pre">
          Pasadas
        </p>
      </div>
      <div
        className='absolute box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[4px] rounded-[72px] top-[164px]'
        data-node-id='426:1019'
        style={{ left: 'calc(12.5% + 48.5px)' }}
      >
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#24282c] text-[12px] text-nowrap whitespace-pre">
          Confirmadas
        </p>
      </div>
      <div
        className='absolute box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[4px] rounded-[72px] top-[164px]'
        data-node-id='426:1021'
        style={{ left: 'calc(25% + 5px)' }}
      >
        <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#24282c] text-[12px] text-nowrap whitespace-pre">
          Inaxistencia
        </p>
      </div>

      {/* Timeline cards left */}
      <div
        className='absolute bg-white border border-[#51d6c7] border-solid box-border content-stretch flex flex-col gap-[16px] items-start px-[16px] py-[8px] rounded-[8px] top-[204px] w-[314px]'
        data-node-id='426:1045'
        style={{ left: 'calc(6.25% + 10.25px)' }}
      >
        <div className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0'>
          <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[#24282c] text-[16px] w-full">
            Limpieza dental
          </p>
          <div className='content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full'>
            <div className='content-stretch flex gap-[8px] items-center relative shrink-0'>
              <div className='relative shrink-0 size-[24px]'>
                <CalendarMonthRounded className='size-6 text-[#535c66]' />
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] text-nowrap whitespace-pre">
                Jue 16 septiembre, 2025
              </p>
            </div>
            <div className='content-stretch flex gap-[8px] items-center relative shrink-0 w-full'>
              <div className='relative shrink-0 size-[24px]'>
                <PlaceRounded className='size-6 text-[#535c66]' />
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] text-nowrap whitespace-pre">
                KlinkOS Ayora
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className='absolute bg-white border border-[#e2e7ea] border-solid box-border content-stretch flex flex-col gap-[16px] items-start px-[16px] py-[8px] rounded-[8px] top-[349px] w-[314px]'
        data-node-id='426:1063'
        style={{ left: 'calc(6.25% + 10.25px)' }}
      >
        <div className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0'>
          <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic relative shrink-0 text-[#24282c] text-[16px] w-full">
            Limpieza dental
          </p>
          <div className='content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full'>
            <div className='content-stretch flex gap-[8px] items-center relative shrink-0'>
              <div className='relative shrink-0 size-[24px]'>
                <CalendarMonthRounded className='size-6 text-[#535c66]' />
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] text-nowrap whitespace-pre">
                Jue 16 septiembre, 2025
              </p>
            </div>
            <div className='content-stretch flex gap-[8px] items-center relative shrink-0 w-full'>
              <div className='relative shrink-0 size-[24px]'>
                <PlaceRounded className='size-6 text-[#535c66]' />
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] text-nowrap whitespace-pre">
                KlinkOS Ayora
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className='absolute h-[102px] w-[24px] left-[45px] top-[204px]'>
        <img alt='' className='block max-w-none size-full' src={imgFrame22} />
      </div>
      <div className='absolute h-[213px] w-[24px] left-[45px] top-[306px]'>
        <img alt='' className='block max-w-none size-full' src={imgFrame24} />
      </div>

      {/* Header */}
      <div
        className='absolute bg-[#f8fafb] content-stretch flex flex-col gap-[8px] items-start left-[32px] top-[40px] w-[568px]'
        data-name='Header'
      >
        <div className='content-stretch flex gap-[8px] items-center relative shrink-0'>
          <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[36px] relative shrink-0 text-[#24282c] text-[28px] text-nowrap whitespace-pre">
            Historial clínico
          </p>
        </div>
        <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] min-w-full relative shrink-0 text-[#24282c] text-[14px] w-[min-content]">
          Filtra el historial clínico, consulta los detalles y sube imágenes y
          documentos.
        </p>
      </div>

      {/* Right details card */}
      <div
        className='absolute bg-white border border-[#e2e7ea] border-solid rounded-[8px]'
        style={{
          left: 'calc(31.25% + 65.25px)',
          top: 164,
          width: 717,
          height: 707
        }}
      >
        <div
          className='relative rounded-[inherit] overflow-y-auto pr-2 pb-4'
          style={{ width: 717, height: 707 }}
        >
          <p className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[32px] left-[24px] not-italic text-[#24282c] text-[24px] text-nowrap top-[24px] whitespace-pre">
            Limpieza dental
          </p>
          <div className='absolute size-[24px]' style={{ left: 677, top: 16 }}>
            <EditRounded className='size-6 text-[#24282c]' />
          </div>

          {/* Attachments */}
          <div className='absolute content-stretch flex flex-col gap-[16px] items-start left-[24px] top-[588px] w-[677px]'>
            <div className='content-stretch flex items-center justify-between relative shrink-0 w-full'>
              <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] text-nowrap whitespace-pre">
                Archivos adjuntos
              </p>
              <div className='content-stretch flex gap-[4px] items-center relative shrink-0'>
                <div className='relative shrink-0 size-[24px]'>
                  <AddRounded className='size-6 text-[#59ded2]' />
                </div>
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#59ded2] text-[14px] text-nowrap whitespace-pre">
                  Subir documento
                </p>
              </div>
            </div>
            <div className='border border-[#cbd3d9] border-solid box-border content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[8px] relative rounded-[8px] shrink-0'>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] text-nowrap whitespace-pre">
                Copia póliza seguro
              </p>
              <div className='relative shrink-0 size-[24px]'>
                <DownloadRounded className='size-6 text-[#535c66]' />
              </div>
            </div>
          </div>

          {/* Odontograma */}
          <div className='absolute content-stretch flex flex-col gap-[8px] items-start left-[24px] top-[700px] w-[677px]'>
            <div className='content-stretch flex items-center justify-between relative shrink-0 w-full'>
              <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] text-nowrap whitespace-pre">
                Odontograma
              </p>
              <div className='content-stretch flex gap-[4px] items-center relative shrink-0'>
                <div className='relative shrink-0 size-[24px]'>
                  <AddRounded className='size-6 text-[#59ded2]' />
                </div>
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#59ded2] text-[14px] text-nowrap whitespace-pre">
                  Subir odontograma
                </p>
              </div>
            </div>
            <div className='border border-[#aeb8c2] border-solid h-[174px] relative rounded-[8px] shrink-0 w-[227px]'>
              <div className='h-[174px] overflow-clip relative rounded-[inherit] w-[227px]'>
                <div className='absolute h-[176px] left-[-1px] top-[-1px] w-[229px]'>
                  <img
                    alt=''
                    className='absolute inset-0 max-w-none object-cover pointer-events-none size-full'
                    src={imgImage7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SOAP sections */}
          <div className='absolute content-stretch flex flex-col gap-[24px] items-start left-[24px] top-[80px] w-[677px]'>
            <div className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] w-full">
                  Subjetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[16px] relative shrink-0 text-[#aeb8c2] text-[12px] w-full">
                  ¿Por qué viene?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] w-full">
                Siente dolor 7/10 al frío en 2.6 desde hace 3 días
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] w-full">
                  Objetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[16px] relative shrink-0 text-[#aeb8c2] text-[12px] w-full">
                  ¿Qué tiene?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] w-full">
                Caries oclusal profunda en 2.6; sensibilidad al frío positiva;
                RX: proximidad pulpar
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] w-full">
                  Evaluación
                </p>
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[16px] relative shrink-0 text-[#aeb8c2] text-[12px] w-full">
                  ¿Qué le hacemos?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] w-full">
                Pulpitis reversible 2.6. Dx diferencial: hipersensibilidad
                dentinaria.
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] w-full">
                  Plan
                </p>
                <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[16px] relative shrink-0 text-[#aeb8c2] text-[12px] w-full">
                  Tratamiento a seguir
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] relative shrink-0 text-[#535c66] text-[14px] w-full">
                Operatoria en 2.6 hoy; barniz desensibilizante; ibuprofeno PRN;
                control en 2 semanas; higiene en 6 meses (recall).
              </p>
            </div>
          </div>

          {/* Attended by */}
          <div className='absolute content-stretch flex flex-col gap-[16px] items-start left-[24px] top-[476px] w-[337px]'>
            <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[24px] relative shrink-0 text-[#24282c] text-[16px] w-full">
              Atendido Por:
            </p>
            <div className='content-stretch flex gap-[33px] items-center relative shrink-0 w-full'>
              <div className='content-stretch flex gap-[12px] items-center relative shrink-0 w-[152px]'>
                <div className='relative rounded-[48px] shrink-0 size-[36px]'>
                  <div
                    aria-hidden='true'
                    className='absolute inset-0 pointer-events-none rounded-[48px]'
                  >
                    <div className='absolute bg-white inset-0 rounded-[48px]' />
                    <div className='absolute inset-0 overflow-hidden rounded-[48px]'>
                      <img
                        alt=''
                        className='absolute h-[150%] left-0 max-w-none top-[-2.88%] w-full'
                        src={imgFrame257}
                      />
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[4px] items-start relative shrink-0 w-[96px]">
                  <p className='leading-[20px] relative shrink-0 text-[#24282c] text-[14px] w-full'>
                    Daniel Soriano
                  </p>
                  <p className='leading-[16px] relative shrink-0 text-[#cbd3d9] text-[12px] w-full'>
                    Higienista
                  </p>
                </div>
              </div>
              <div className='content-stretch flex gap-[12px] items-center relative shrink-0 w-[152px]'>
                <div className='relative rounded-[48px] shrink-0 size-[36px]'>
                  <div
                    aria-hidden='true'
                    className='absolute inset-0 pointer-events-none rounded-[48px]'
                  >
                    <div className='absolute bg-white inset-0 rounded-[48px]' />
                    <div className='absolute inset-0 overflow-hidden rounded-[48px]'>
                      <img
                        alt=''
                        className='absolute h-[150%] left-0 max-w-none top-[-2.88%] w-full'
                        src={imgFrame258}
                      />
                    </div>
                  </div>
                </div>
                <div className="basis-0 content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                  <p className='leading-[20px] relative shrink-0 text-[#24282c] text-[14px] w-full'>
                    Carlos Ramirez
                  </p>
                  <p className='leading-[16px] relative shrink-0 text-[#cbd3d9] text-[12px] w-full'>
                    Odontólogo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
