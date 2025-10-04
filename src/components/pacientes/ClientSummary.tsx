import React from 'react'

const imgClose =
  'http://localhost:3845/assets/5ef958204bb620a694618e0538ad4b9d50b8e1c7.svg'
const imgMail =
  'http://localhost:3845/assets/dae09d8400da9390276da864f02dcc6039a223aa.svg'
const imgCall =
  'http://localhost:3845/assets/b7ea77f86188bf6ab0ebf35824da37c39ace0c81.svg'
const imgLine1 =
  'http://localhost:3845/assets/a5fd2c78e5af92f84d85671667ff4e2a8a0f2cfd.svg'
const imgMoreVert =
  'http://localhost:3845/assets/49a32dc9867150df332161df4c1841329bdafc17.svg'

type ClientSummaryProps = {
  onClose?: () => void
}

export default function ClientSummary({ onClose }: ClientSummaryProps) {
  return (
    <div
      className='bg-[#f8fafb] relative w-[1196px]'
      data-node-id='423:822'
      style={{ width: 1196, height: 900 }}
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-[24px] top-[16px] cursor-pointer'
        data-name='close'
        data-node-id='410:779'
        style={{ left: 'calc(93.75% + 34.75px)' }}
      >
        <img alt='' className='block max-w-none size-full' src={imgClose} />
      </button>
      <div
        className='absolute content-stretch flex gap-[24px] items-center left-[32px] top-[48px]'
        data-node-id='426:854'
      >
        <div
          className='bg-[#535c66] rounded-[200px] shrink-0 size-[96px]'
          data-node-id='423:829'
        />
        <div
          className='content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[228px]'
          data-node-id='426:853'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[32px] min-w-full not-italic relative shrink-0 text-[#24282c] text-[24px]"
            data-node-id='426:830'
            style={{ width: 'min-content' }}
          >
            Lucia López Cano
          </p>
          <div
            className='content-stretch flex gap-[8px] items-center relative shrink-0 w-full'
            data-node-id='426:848'
          >
            <div
              className='relative shrink-0 size-[24px]'
              data-name='mail'
              data-node-id='426:837'
            >
              <img
                alt=''
                className='block max-w-none size-full'
                src={imgMail}
              />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#24282c] text-[16px] text-nowrap whitespace-pre"
              data-node-id='426:831'
            >
              Emailexample@gmail.com
            </p>
          </div>
          <div
            className='content-stretch flex gap-[8px] items-center relative shrink-0'
            data-node-id='426:849'
          >
            <div
              className='relative shrink-0 size-[24px]'
              data-name='call'
              data-node-id='426:847'
            >
              <img
                alt=''
                className='block max-w-none size-full'
                src={imgCall}
              />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#24282c] text-[16px] text-nowrap whitespace-pre"
              data-node-id='426:838'
            >
              +34 666 777 888
            </p>
          </div>
        </div>
      </div>
      <div
        className='absolute h-0 left-[36px] top-[184px] w-[1128px]'
        data-node-id='426:850'
      >
        <div className='absolute bottom-0 left-0 right-0 top-[-1px]'>
          <img alt='' className='block max-w-none size-full' src={imgLine1} />
        </div>
      </div>
      <div
        className='absolute bg-[#f7b7ba] box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[4px] rounded-[96px] top-[48px]'
        data-node-id='426:852'
        style={{ left: 'calc(50% - 4px)' }}
      >
        <p
          className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-red-700 whitespace-pre"
          data-node-id='426:851'
        >
          Penicilina
        </p>
      </div>
      <div
        className='absolute bg-[#f7b7ba] box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[4px] rounded-[96px] top-[48px]'
        data-node-id='426:857'
        style={{ left: 'calc(56.25% + 0.25px)' }}
      >
        <p
          className="font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-red-700 whitespace-pre"
          data-node-id='426:858'
        >
          Latex
        </p>
      </div>
      <div
        className='absolute bg-[#e2e7ea] h-[56px] overflow-clip rounded-[8px] top-[88px] w-[484px]'
        data-node-id='426:855'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >
        <p
          className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[16px] left-[8px] not-italic text-[#aeb8c2] text-[12px] text-nowrap top-[8px] whitespace-pre"
          data-node-id='426:856'
        >
          Añadir comentario sobre el paciente
        </p>
      </div>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[16px] not-italic text-[#8a95a1] text-[12px] text-nowrap top-[52px] whitespace-pre"
        data-node-id='426:863'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >{`Alergias: `}</p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[32px] left-[32px] not-italic text-[#24282c] text-[24px] text-nowrap top-[224px] whitespace-pre"
        data-node-id='426:864'
      >
        General
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[32px] not-italic text-[#24282c] text-[24px] text-nowrap top-[224px] whitespace-pre"
        data-node-id='426:909'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >
        Consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[32px] left-[32px] not-italic text-[#24282c] text-[24px] text-nowrap top-[432px] whitespace-pre"
        data-node-id='426:876'
      >
        Información adicional
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[32px] left-[32px] not-italic text-[#24282c] text-[24px] text-nowrap top-[640px] whitespace-pre"
        data-node-id='426:885'
      >
        Contacto de emergencia
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic text-[#24282c] text-[16px] text-nowrap top-[272px] whitespace-pre"
        data-node-id='426:868'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        Edad
      </p>
      <p
        className='absolute font-["Inter:Medium",_sans-serif] font-medium leading-[24px] not-italic text-[#24282c] text-[16px] top-[480px] w-[189px]'
        data-node-id='426:877'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        Recomendado por:
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] left-[32px] not-italic text-[#24282c] text-[16px] text-nowrap top-[272px] whitespace-pre"
        data-node-id='426:870'
      >
        Fecha de nacimiento
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic text-[#24282c] text-[16px] text-nowrap top-[272px] whitespace-pre"
        data-node-id='426:911'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >
        Estado
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] left-[32px] not-italic text-[#24282c] text-[16px] text-nowrap top-[480px] whitespace-pre"
        data-node-id='426:878'
      >
        Origen del cliente
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] left-[32px] not-italic text-[#24282c] text-[16px] text-nowrap top-[688px] whitespace-pre"
        data-node-id='426:887'
      >
        José Lopez
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] left-[32px] not-italic text-[#24282c] text-[16px] text-nowrap top-[344px] whitespace-pre"
        data-node-id='426:872'
      >
        DNI/NIE
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic text-[#24282c] text-[16px] text-nowrap top-[344px] whitespace-pre"
        data-node-id='426:912'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >
        Motivo de la consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] left-[32px] not-italic text-[#24282c] text-[16px] text-nowrap top-[552px] whitespace-pre"
        data-node-id='426:879'
      >
        Ocupación
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic text-[#24282c] text-[16px] text-nowrap top-[344px] whitespace-pre"
        data-node-id='426:874'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        Pais
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[24px] not-italic text-[#24282c] text-[16px] text-nowrap top-[552px] whitespace-pre"
        data-node-id='426:880'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        Idioma de preferencia
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic text-[#535c66] text-[14px] text-nowrap top-[300px] whitespace-pre"
        data-node-id='426:869'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        45 años
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic text-[#535c66] text-[14px] text-nowrap top-[508px] whitespace-pre"
        data-node-id='426:881'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        Sonia Pujante
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[32px] not-italic text-[#535c66] text-[14px] text-nowrap top-[300px] whitespace-pre"
        data-node-id='426:871'
      >
        26/02/1978
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic text-[#535c66] text-[14px] text-nowrap top-[300px] whitespace-pre"
        data-node-id='426:915'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >
        Pre-registro
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[32px] not-italic text-[#535c66] text-[14px] text-nowrap top-[508px] whitespace-pre"
        data-node-id='426:882'
      >
        Recomendación
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[32px] not-italic text-[#535c66] text-[14px] text-nowrap top-[716px] whitespace-pre"
        data-node-id='426:891'
      >
        Jose@gmail.com
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[32px] not-italic text-[#535c66] text-[14px] text-nowrap top-[740px] whitespace-pre"
        data-node-id='426:894'
      >
        666 777 888
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[32px] not-italic text-[#535c66] text-[14px] text-nowrap top-[372px] whitespace-pre"
        data-node-id='426:873'
      >
        49587154S
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic text-[#535c66] text-[14px] top-[372px] w-[484px]"
        data-node-id='426:916'
        style={{ left: 'calc(43.75% + 12.75px)' }}
      >
        Sufre de sensibilidad dental y necesita hacerse su limpieza bucal anual
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] left-[32px] not-italic text-[#535c66] text-[14px] text-nowrap top-[580px] whitespace-pre"
        data-node-id='426:883'
      >
        Funcionario
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic text-[#535c66] text-[14px] text-nowrap top-[372px] whitespace-pre"
        data-node-id='426:875'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        España
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic text-[#535c66] text-[14px] text-nowrap top-[580px] whitespace-pre"
        data-node-id='426:884'
        style={{ left: 'calc(18.75% + 30.75px)' }}
      >
        Español
      </p>
      <div
        className='absolute bg-[#f8fafb] box-border content-stretch flex gap-[8px] items-center justify-center px-[8px] py-[4px] rounded-[16px] top-[226px]'
        data-name='Remember - Button'
        data-node-id='426:905'
        style={{ left: 'calc(87.5% + 30.5px)' }}
      >
        <div
          aria-hidden='true'
          className='absolute border border-[#51d6c7] border-solid inset-0 pointer-events-none rounded-[16px]'
        />
        <p
          className="font-['Inter:Regular',_sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#1e4947] text-[14px] text-nowrap whitespace-pre"
          data-node-id='I426:905;236:963'
        >
          Editar
        </p>
      </div>
      <div
        className='absolute size-[24px] top-[228px]'
        data-name='more_vert'
        data-node-id='426:923'
        style={{ left: 'calc(93.75% + 18.75px)' }}
      >
        <img alt='' className='block max-w-none size-full' src={imgMoreVert} />
      </div>
    </div>
  )
}
