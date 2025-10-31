import React from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import MailRounded from '@mui/icons-material/MailRounded'
import CallRounded from '@mui/icons-material/CallRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'

type ClientSummaryProps = {
  onClose?: () => void
}

export default function ClientSummary({ onClose }: ClientSummaryProps) {
  return (
    <div
      className='relative bg-[#f8fafb] overflow-hidden w-[74.75rem] h-[56.25rem]'
      data-node-id='423:822'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-[1.5rem] top-[1rem] cursor-pointer'
        data-name='close'
        data-node-id='410:779'
        style={{ left: 'calc(93.75% + 2.172rem)' }}
      >
        <CloseRounded className='size-6 text-[#24282c]' />
      </button>
      <div
        className='absolute content-stretch flex gap-[1.5rem] items-center left-[2rem] top-[3rem]'
        data-node-id='426:854'
      >
        <div
          className='bg-[#535c66] rounded-[12.5rem] shrink-0 size-[6rem]'
          data-node-id='423:829'
        />
        <div
          className='content-stretch flex flex-col gap-[0.5rem] items-start relative shrink-0 w-[14.25rem]'
          data-node-id='426:853'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] min-w-full not-italic relative shrink-0 text-[#24282c] text-[1.5rem]"
            data-node-id='426:830'
            style={{ width: 'min-content' }}
          >
            Lucia López Cano
          </p>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0 w-full'
            data-node-id='426:848'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='mail'
              data-node-id='426:837'
            >
              <MailRounded className='size-6 text-[#24282c]' />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
              data-node-id='426:831'
            >
              Emailexample@gmail.com
            </p>
          </div>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0'
            data-node-id='426:849'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='call'
              data-node-id='426:847'
            >
              <CallRounded className='size-6 text-[#24282c]' />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
              data-node-id='426:838'
            >
              +34 666 777 888
            </p>
          </div>
        </div>
      </div>
      <div
        className='absolute h-0 left-[2.25rem] top-[11.5rem] w-[70.5rem]'
        data-node-id='426:850'
      >
        <div className='absolute bottom-0 left-0 right-0 top-[-0.063rem]'>
          <img alt='' className='block max-w-none size-full' src={imgLine1} />
        </div>
      </div>
      <div
        className='absolute bg-[#f7b7ba] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[6rem] top-[3rem]'
        data-node-id='426:852'
        style={{ left: 'calc(50% - 0.25rem)' }}
      >
        <p
          className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic relative shrink-0 text-[0.75rem] text-nowrap text-red-700 whitespace-pre"
          data-node-id='426:851'
        >
          Penicilina
        </p>
      </div>
      <div
        className='absolute bg-[#f7b7ba] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[6rem] top-[3rem]'
        data-node-id='426:857'
        style={{ left: 'calc(56.25% + 0.016rem)' }}
      >
        <p
          className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic relative shrink-0 text-[0.75rem] text-nowrap text-red-700 whitespace-pre"
          data-node-id='426:858'
        >
          Latex
        </p>
      </div>
      <div
        className='absolute bg-[#e2e7ea] h-[3.5rem] overflow-clip rounded-[0.5rem] top-[5.5rem] w-[30.25rem]'
        data-node-id='426:855'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1rem] left-[0.5rem] not-italic text-[#aeb8c2] text-[0.75rem] text-nowrap top-[0.5rem] whitespace-pre"
          data-node-id='426:856'
        >
          Añadir comentario sobre el paciente
        </p>
      </div>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] not-italic text-[#8a95a1] text-[0.75rem] text-nowrap top-[3.25rem] whitespace-pre"
        data-node-id='426:863'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >{`Alergias: `}</p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:864'
      >
        General
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:909'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[27rem] whitespace-pre"
        data-node-id='426:876'
      >
        Información adicional
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[40rem] whitespace-pre"
        data-node-id='426:885'
      >
        Contacto de emergencia
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:868'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Edad
      </p>
      <p
        className='absolute font-["Inter:Medium",_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] top-[30rem] w-[11.813rem]'
        data-node-id='426:877'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Recomendado por:
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:870'
      >
        Fecha de nacimiento
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:911'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Estado
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[30rem] whitespace-pre"
        data-node-id='426:878'
      >
        Origen del cliente
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[43rem] whitespace-pre"
        data-node-id='426:887'
      >
        José Lopez
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:872'
      >
        DNI/NIE
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:912'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Motivo de la consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:879'
      >
        Ocupación
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:874'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Pais
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:880'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Idioma de preferencia
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
        data-node-id='426:869'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        45 años
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
        data-node-id='426:881'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Sonia Pujante
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
        data-node-id='426:871'
      >
        26/02/1978
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
        data-node-id='426:915'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Pre-registro
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
        data-node-id='426:882'
      >
        Recomendación
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[44.75rem] whitespace-pre"
        data-node-id='426:891'
      >
        Jose@gmail.com
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[46.25rem] whitespace-pre"
        data-node-id='426:894'
      >
        666 777 888
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
        data-node-id='426:873'
      >
        49587154S
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] w-[30.25rem]"
        data-node-id='426:916'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Sufre de sensibilidad dental y necesita hacerse su limpieza bucal anual
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
        data-node-id='426:883'
      >
        Funcionario
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
        data-node-id='426:875'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        España
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
        data-node-id='426:884'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Español
      </p>
      <div
        className='absolute bg-[#f8fafb] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[1rem] top-[14.125rem]'
        data-name='Remember - Button'
        data-node-id='426:905'
        style={{ left: 'calc(87.5% + 1.906rem)' }}
      >
        <div
          aria-hidden='true'
          className='absolute border border-[#51d6c7] border-solid inset-0 pointer-events-none rounded-[1rem]'
        />
        <p
          className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic relative shrink-0 text-[#1e4947] text-[0.875rem] text-nowrap whitespace-pre"
          data-node-id='I426:905;236:963'
        >
          Editar
        </p>
      </div>
      <div
        className='absolute size-[1.5rem] top-[14.25rem]'
        data-name='more_vert'
        data-node-id='426:923'
        style={{ left: 'calc(93.75% + 1.172rem)' }}
      >
        <MoreVertRounded className='size-6 text-[#24282c]' />
      </div>
    </div>
  )
}
