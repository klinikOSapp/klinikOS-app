import React from 'react'

interface SelectProps {
  hEad?: string
  body?: string
  property1?: 'Default' | 'Variant2' | 'Variant3'
}

function Select({
  hEad = 'Resumen',
  body = 'Datos básicos de consulta, alertas, próximas citas, deuda, ...',
  property1 = 'Default'
}: SelectProps) {
  const element = (
    <p
      className="font-['Inter:Medium',_sans-serif] font-medium leading-8 relative shrink-0 text-xl w-full"
      data-node-id='410:780'
    >
      {hEad}
    </p>
  )
  const element1 = (
    <p
      className="font-['Inter:Regular',_sans-serif] font-normal leading-5 relative shrink-0 text-sm w-full"
      data-node-id='410:782'
    >
      {body}
    </p>
  )
  if (property1 === 'Variant2') {
    return (
      <div
        className='bg-[#e9fbf9] box-border content-stretch flex flex-col gap-[4px] items-start not-italic pb-[16px] pt-[24px] px-[24px] relative size-full text-[#24282c]'
        data-name='Property 1=Variant2'
        data-node-id='410:786'
      >
        {element}
        {element1}
      </div>
    )
  }
  return (
    <div
      className='box-border content-stretch flex flex-col gap-[4px] items-start not-italic pb-[16px] pt-[24px] px-[24px] relative size-full text-[#24282c]'
      data-name='Property 1=Default'
      data-node-id='410:784'
    >
      {element}
      {element1}
    </div>
  )
}

export default function UserModal() {
  return (
    <div
      className='relative w-80 h-auto'
      data-node-id='410:781'
    >
      <div className='relative size-full'>
        <div
          className='absolute bg-[#e9fbf9] box-border content-stretch flex flex-col gap-[4px] items-start left-0 not-italic pb-[16px] pt-[24px] px-[24px] text-[#24282c] top-0 w-[304px]'
          data-name='Select'
          data-node-id='410:792'
        >
          <Select property1='Variant2' />
        </div>
        <div
          className='absolute box-border content-stretch flex flex-col gap-[4px] items-start left-0 not-italic pb-[16px] pt-[24px] px-[24px] text-[#24282c] top-[116px] w-[304px]'
          data-name='Select'
          data-node-id='410:795'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-8 relative shrink-0 text-xl w-full"
            data-node-id='I410:795;410:780'
          >
            Historial clínico
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-5 relative shrink-0 text-sm w-full"
            data-node-id='I410:795;410:782'
          >
            Notas SOAP, odontograma, actos y adjuntos.
          </p>
        </div>
        <div
          className='absolute box-border content-stretch flex flex-col gap-[4px] items-start left-0 not-italic pb-[16px] pt-[24px] px-[24px] text-[#24282c] top-[232px] w-[304px]'
          data-name='Select'
          data-node-id='410:801'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-8 relative shrink-0 text-xl w-full"
            data-node-id='I410:801;410:780'
          >
            Imágenes & RX
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-5 relative shrink-0 text-sm w-full"
            data-node-id='I410:801;410:782'
          >
            Capturas intraorales/fotos antes-después y escáner 3D.
          </p>
        </div>
        <div
          className='absolute box-border content-stretch flex flex-col gap-[4px] items-start left-0 not-italic pb-[16px] pt-[24px] px-[24px] text-[#24282c] top-[348px] w-[304px]'
          data-name='Select'
          data-node-id='410:804'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-8 relative shrink-0 text-xl w-full"
            data-node-id='I410:804;410:780'
          >
            Pagos y facturas
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-5 relative shrink-0 text-sm w-full"
            data-node-id='I410:804;410:782'
          >
            Cobros, financiación embebida, facturas/recibos y conciliación.
          </p>
        </div>
        <div
          className='absolute box-border content-stretch flex flex-col gap-[4px] items-start left-0 not-italic pb-[16px] pt-[24px] px-[24px] text-[#24282c] top-[464px] w-[304px]'
          data-name='Select'
          data-node-id='410:810'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-8 relative shrink-0 text-xl w-full"
            data-node-id='I410:810;410:780'
          >
            Actividad
          </p>
          <p
            className="font-['Inter:Regular',_sans-serif] font-normal leading-5 relative shrink-0 text-sm w-full"
            data-node-id='I410:810;410:782'
          >
            log legal, toda acción con usuario, fecha/hora y contexto, para
            auditorías.
          </p>
        </div>
      </div>
      <div
        aria-hidden='true'
        className='absolute border-[#f4f8fa] border-[0px_2px_0px_0px] border-solid inset-0 pointer-events-none'
      />
    </div>
  )
}
