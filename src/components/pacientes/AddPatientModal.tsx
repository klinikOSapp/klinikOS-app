'use client'

import React from 'react'
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded'
import RadioButtonCheckedRounded from '@mui/icons-material/RadioButtonCheckedRounded'
// Asterisk assets from Figma selection
const imgAsterisk =
  'http://localhost:3845/assets/2c0b73eef693330c4ad396e42d1a639aaaf6d877.svg'
const imgAsteriskFill =
  'http://localhost:3845/assets/89c71339b6f825dee2958100e7a1d16d1c04f4f0.svg'

// Assets extraídos del nodo de Figma
const imgClose =
  'http://localhost:3845/assets/22dff4ef254111ec5a16c529f81e35739c11def8.svg'
const imgCalendarMonth =
  'http://localhost:3845/assets/3d92926ba79b59e44b635f696cb1b2cfb147749d.svg'
const imgChevron =
  'http://localhost:3845/assets/985de8ab20e1c34c1aa6387667d3a8fd36990e06.svg'
const imgAddAPhoto =
  'http://localhost:3845/assets/ee08810cc071752f059ba9c6e1362efc6c5ec0d7.svg'
const imgArrowForward =
  'http://localhost:3845/assets/74e023fd9c6ef161e0d5da779408f9a2e3d79587.svg'

type AddPatientModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
      {children}
    </p>
  )
}

function TextInput({
  placeholder = 'Value',
  required
}: {
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className='relative'>
      <input
        placeholder={placeholder}
        className='w-full h-12 rounded-[8px] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-[16px] leading-[24px] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
      />
      {required && (
        <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[#B91C1C]'>
          *
        </span>
      )}
    </div>
  )
}

function DateInput() {
  return (
    <div className='relative'>
      <input
        placeholder='DD/MM/AAAA'
        className='w-full h-12 rounded-[8px] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] pl-2.5 pr-10 text-[16px] leading-[24px] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
      />
      <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-700)]'>
        📅
      </span>
    </div>
  )
}

function SelectInput() {
  return (
    <div className='relative'>
      <select className='appearance-none w-full h-12 rounded-[8px] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-[16px] leading-[24px] text-[var(--color-neutral-900)] outline-none'>
        <option>Value</option>
      </select>
      <span className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-700)]'>
        ▾
      </span>
    </div>
  )
}

export default function AddPatientModal({
  open,
  onClose,
  onContinue
}: AddPatientModalProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          onClick={(e) => e.stopPropagation()}
        >
          <div className='w-[1092px] h-[956px] relative bg-[#F8FAFB] rounded-lg overflow-hidden'>
            <div className='w-[1092px] h-14 px-8 left-0 top-0 absolute border-b border-[#CBD3D9] inline-flex justify-between items-center'>
              <div className='justify-start text-[#24282C] text-lg font-medium font-sans leading-7'>
                Formulario de creación de usuarios
              </div>
              <button
                type='button'
                aria-label='Cerrar'
                onClick={onClose}
                className='w-3.5 h-3.5'
              >
                <img alt='' src={imgClose} className='block w-3.5 h-3.5' />
              </button>
            </div>

            <div
              data-devide='Desktop'
              className='left-[32px] top-[96px] absolute inline-flex justify-start items-start gap-3'
            >
              <div
                data-has-line='true'
                data-orientation='Vertical'
                className='w-6 h-12 relative'
              >
                <div
                  data-state='Fill'
                  className='w-6 h-6 left-0 top-0 absolute'
                >
                  <RadioButtonCheckedRounded
                    style={{ width: 24, height: 24, color: '#51D6C7' }}
                  />
                </div>
                <div className='absolute left-[10px] top-[26px] w-[2px] h-[22px] bg-[#24282C]'></div>
              </div>
              <div className='justify-start text-[#24282C] text-base font-medium font-sans leading-normal'>
                Paciente
              </div>
            </div>

            <div
              data-devide='Desktop'
              className='left-[32px] top-[144px] absolute inline-flex justify-start items-start gap-3'
            >
              <div
                data-has-line='true'
                data-orientation='Vertical'
                className='w-6 h-12 relative'
              >
                <div
                  data-state='radio_button_unchecked'
                  className='w-6 h-6 left-0 top-0 absolute'
                >
                  <RadioButtonUncheckedRounded
                    style={{ width: 24, height: 24, color: '#24282C' }}
                  />
                </div>
                <div className='absolute left-[10px] top-[26px] w-[2px] h-[22px] bg-[#24282C]'></div>
              </div>
              <div className='justify-start text-[#24282C] text-base font-medium font-sans leading-normal'>
                Contacto
              </div>
            </div>

            <div
              data-devide='Desktop'
              className='left-[32px] top-[192px] absolute inline-flex justify-start items-start gap-3'
            >
              <div
                data-has-line='true'
                data-orientation='Vertical'
                className='w-6 h-12 relative'
              >
                <div
                  data-state='radio_button_unchecked'
                  className='w-6 h-6 left-0 top-0 absolute'
                >
                  <RadioButtonUncheckedRounded
                    style={{ width: 24, height: 24, color: '#24282C' }}
                  />
                </div>
                <div className='absolute left-[10px] top-[26px] w-[2px] h-[22px] bg-[#24282C]'></div>
              </div>
              <div className='justify-start text-[#24282C] text-base font-medium font-sans leading-normal'>
                Administrativo
              </div>
            </div>

            <div
              data-devide='Desktop'
              className='left-[32px] top-[240px] absolute inline-flex justify-start items-start gap-3'
            >
              <div
                data-has-line='true'
                data-orientation='Vertical'
                className='w-6 h-12 relative'
              >
                <div
                  data-state='radio_button_unchecked'
                  className='w-6 h-6 left-0 top-0 absolute'
                >
                  <RadioButtonUncheckedRounded
                    style={{ width: 24, height: 24, color: '#24282C' }}
                  />
                </div>
                <div className='absolute left-[10px] top-[26px] w-[2px] h-[22px] bg-[#24282C]'></div>
              </div>
              <div className='justify-start text-[#24282C] text-base font-medium font-sans leading-normal'>
                Salud
              </div>
            </div>

            <div
              data-devide='Desktop'
              className='left-[32px] top-[288px] absolute inline-flex justify-start items-start gap-3'
            >
              <div
                data-has-line='false'
                data-orientation='Vertical'
                className='w-6 h-12 relative'
              >
                <div
                  data-state='radio_button_unchecked'
                  className='w-6 h-6 left-0 top-0 absolute'
                >
                  <RadioButtonUncheckedRounded
                    style={{ width: 24, height: 24, color: '#24282C' }}
                  />
                </div>
              </div>
              <div className='justify-start text-[#24282C] text-base font-medium font-sans leading-normal'>
                Consentimientos
              </div>
            </div>

            <div
              data-property-1='Default'
              className='w-[568px] left-[229px] top-[96px] absolute inline-flex flex-col justify-start items-start gap-2'
            >
              <div className='inline-flex justify-start items-center gap-2'>
                <div className='justify-start text-[#24282C] text-2xl font-medium font-sans leading-loose'>
                  Datos básicos del paciente
                </div>
              </div>
            </div>

            <div
              data-has-description='false'
              data-has-icon='true'
              data-has-label='false'
              data-state='Default'
              data-typevalue='Place Holder'
              className='w-80 left-[491px] top-[287px] absolute inline-flex flex-col justify-start items-start gap-2'
            >
              <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 inline-flex justify-between items-center'>
                  <div className='justify-start text-gray-400 text-base font-normal font-sans leading-normal'>
                    Value
                  </div>
                  <div className='w-3 h-3 relative'>
                    <div
                      className='absolute inset-[12.5%]'
                      style={{
                        maskImage: `url('${imgAsterisk}')`,
                        WebkitMaskImage: `url('${imgAsterisk}')`
                      }}
                    >
                      <img
                        alt=''
                        src={imgAsteriskFill}
                        className='block w-full h-full'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-has-description='false'
              data-has-icon='true'
              data-has-label='false'
              data-state='Default'
              data-typevalue='Place Holder'
              className='w-80 left-[491px] top-[383px] absolute inline-flex flex-col justify-start items-start gap-2'
            >
              <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 inline-flex justify-between items-center'>
                  <div className='justify-start text-gray-400 text-base font-normal font-sans leading-normal'>
                    Value
                  </div>
                  <div className='w-3 h-3 relative'>
                    <div
                      className='absolute inset-[12.5%]'
                      style={{
                        maskImage: `url('${imgAsterisk}')`,
                        WebkitMaskImage: `url('${imgAsterisk}')`
                      }}
                    >
                      <img
                        alt=''
                        src={imgAsteriskFill}
                        className='block w-full h-full'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-has-description='false'
              data-has-icon='true'
              data-has-label='false'
              data-state='Default'
              data-typevalue='Place Holder'
              className='w-80 left-[491px] top-[767px] absolute inline-flex flex-col justify-start items-start gap-2'
            >
              <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 inline-flex justify-between items-center'>
                  <div className='justify-start text-gray-400 text-base font-normal font-sans leading-normal'>
                    Value
                  </div>
                  <div className='w-3 h-3 relative'>
                    <div
                      className='absolute inset-[12.5%]'
                      style={{
                        maskImage: `url('${imgAsterisk}')`,
                        WebkitMaskImage: `url('${imgAsterisk}')`
                      }}
                    >
                      <img
                        alt=''
                        src={imgAsteriskFill}
                        className='block w-full h-full'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='w-80 left-[491px] top-[479px] absolute inline-flex flex-col justify-start items-start gap-2'>
              <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 inline-flex justify-between items-center'>
                  <div className='justify-start text-gray-400 text-base font-normal font-sans leading-normal'>
                    DD/MM/AAAA
                  </div>
                  <img alt='' src={imgCalendarMonth} className='w-6 h-6' />
                </div>
              </div>
            </div>

            <div className='left-[294px] top-[160px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              Imagen del paciente
            </div>
            <div className='left-[294px] top-[287px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              Nombre
            </div>
            <div className='left-[294px] top-[383px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              Apellidos
            </div>
            <div className='left-[294px] top-[767px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              DNI/NIE
            </div>
            <div className='left-[294px] top-[479px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              Fecha de nacimiento
            </div>
            <div className='left-[294px] top-[575px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              Sexo biológico
            </div>
            <div className='left-[294px] top-[671px] absolute justify-start text-zinc-800 text-base font-normal font-sans leading-normal'>
              Idioma preferido
            </div>
            <div className='w-40 left-[294px] top-[188px] absolute justify-start text-gray-500 text-xs font-medium font-sans leading-none'>
              Toma una fotografía o súbela desde tu dispositivo
            </div>
            <button
              type='button'
              className='w-20 h-20 left-[491px] top-[160px] absolute bg-gray-200 rounded-lg outline-1 outline-offset-[-1px] outline-teal-300 overflow-hidden grid place-items-center'
            >
              <img alt='' src={imgAddAPhoto} className='w-8 h-8' />
            </button>

            <div className='w-80 left-[491px] top-[575px] absolute inline-flex flex-col justify-start items-start gap-2'>
              <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 inline-flex justify-between items-center'>
                  <div className='justify-start text-gray-400 text-base font-normal font-sans leading-normal'>
                    Value
                  </div>
                  <img alt='' src={imgChevron} className='w-6 h-6' />
                </div>
              </div>
            </div>

            <div className='w-80 left-[491px] top-[671px] absolute inline-flex flex-col justify-start items-start gap-2'>
              <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 inline-flex justify-between items-center'>
                  <div className='justify-start text-gray-400 text-base font-normal font-sans leading-normal'>
                    Value
                  </div>
                  <img alt='' src={imgChevron} className='w-6 h-6' />
                </div>
              </div>
            </div>

            <div className='w-[504px] h-0 left-[798px] top-[852px] absolute origin-top-left rotate-180 border-t border-[#AEB8C2]'></div>
            <button
              type='button'
              onClick={onContinue}
              className='w-52 px-4 py-2 left-[583px] top-[892px] absolute bg-teal-300 rounded-[136px] outline-1 outline-offset-[-1px] outline-gray-300 inline-flex justify-center items-center gap-2'
            >
              <div className='justify-start text-teal-900 text-base font-medium font-sans leading-normal'>
                Continuar
              </div>
              <img alt='' src={imgArrowForward} className='w-6 h-6' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
