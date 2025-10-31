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
    <p className='text-[1rem] leading-[1.5rem] text-[var(--color-neutral-900)]'>
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
        className='w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-[1rem] leading-[1.5rem] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
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
        className='w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] pl-2.5 pr-10 text-[1rem] leading-[1.5rem] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
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
      <select className='appearance-none w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-[1rem] leading-[1.5rem] text-[var(--color-neutral-900)] outline-none'>
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
          <div
            className='w-[68.25rem] h-[59.75rem] max-w-[92vw] max-h-[85vh] shrink-0 relative bg-[#F8FAFB] rounded-lg overflow-hidden flex items-start justify-center'
            style={{
              width: 'min(68.25rem, calc(68.25rem * (85vh / 60rem)))',
              height: 'min(59.75rem, calc(59.75rem * (85vh / 60rem)))'
            }}
          >
            {/* Scaled content to always fit within 85vh without scroll */}
            <div
              className='relative w-[68.25rem] h-[60rem]'
              style={{
                transform: 'scale(min(1, calc(85vh / 60rem)))',
                transformOrigin: 'top left'
              }}
            >
              <div className='w-[68.25rem] h-14 px-8 left-0 top-0 absolute border-b border-[#CBD3D9] inline-flex justify-between items-center'>
                <div className='justify-start text-[#24282C] text-[1.5rem] font-medium font-sans leading-[2rem]'>
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
                className='left-[2rem] top-[6rem] absolute inline-flex justify-start items-start gap-3'
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
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[#24282C]'></div>
                </div>
                <div className='justify-start text-[#24282C] text-[1rem] font-medium font-sans leading-[1.5rem]'>
                  Paciente
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[9rem] absolute inline-flex justify-start items-start gap-3'
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
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[#24282C]'></div>
                </div>
                <div className='justify-start text-[#24282C] text-[1rem] font-medium font-sans leading-[1.5rem]'>
                  Contacto
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[12rem] absolute inline-flex justify-start items-start gap-3'
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
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[#24282C]'></div>
                </div>
                <div className='justify-start text-[#24282C] text-[1rem] font-medium font-sans leading-[1.5rem]'>
                  Administrativo
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[15rem] absolute inline-flex justify-start items-start gap-3'
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
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[#24282C]'></div>
                </div>
                <div className='justify-start text-[#24282C] text-[1rem] font-medium font-sans leading-[1.5rem]'>
                  Salud
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[18rem] absolute inline-flex justify-start items-start gap-3'
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
                <div className='justify-start text-[#24282C] text-[1rem] font-medium font-sans leading-[1.5rem]'>
                  Consentimientos
                </div>
              </div>

              <div
                data-property-1='Default'
                className='w-[35.5rem] left-[14.3125rem] top-[6rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='inline-flex justify-start items-center gap-2'>
                  <div className='justify-start text-[#24282C] text-[1.5rem] font-medium font-sans leading-[2rem]'>
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
                className='w-80 left-[30.6875rem] top-[17.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-gray-300 inline-flex justify-between items-center'>
                    <div className='justify-start text-gray-400 text-[1rem] font-normal font-sans leading-[1.5rem]'>
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
                className='w-80 left-[30.6875rem] top-[23.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-gray-300 inline-flex justify-between items-center'>
                    <div className='justify-start text-gray-400 text-[1rem] font-normal font-sans leading-[1.5rem]'>
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
                className='w-80 left-[30.6875rem] top-[47.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-gray-300 inline-flex justify-between items-center'>
                    <div className='justify-start text-gray-400 text-[1rem] font-normal font-sans leading-[1.5rem]'>
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

              <div className='w-80 left-[30.6875rem] top-[29.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-gray-300 inline-flex justify-between items-center'>
                    <div className='justify-start text-gray-400 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                      DD/MM/AAAA
                    </div>
                    <img alt='' src={imgCalendarMonth} className='w-6 h-6' />
                  </div>
                </div>
              </div>

              <div className='left-[18.375rem] top-[10rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                Imagen del paciente
              </div>
              <div className='left-[18.375rem] top-[17.9375rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                Nombre
              </div>
              <div className='left-[18.375rem] top-[23.9375rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                Apellidos
              </div>
              <div className='left-[18.375rem] top-[47.9375rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                DNI/NIE
              </div>
              <div className='left-[18.375rem] top-[29.9375rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                Fecha de nacimiento
              </div>
              <div className='left-[18.375rem] top-[35.9375rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                Sexo biológico
              </div>
              <div className='left-[18.375rem] top-[41.9375rem] absolute justify-start text-zinc-800 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                Idioma preferido
              </div>
              <div className='w-40 left-[18.375rem] top-[11.75rem] absolute justify-start text-gray-500 text-[0.75rem] font-medium font-sans leading-[1rem]'>
                Toma una fotografía o súbela desde tu dispositivo
              </div>
              <button
                type='button'
                className='w-20 h-20 left-[30.6875rem] top-[10rem] absolute bg-gray-200 rounded-lg outline-[0.0625rem] outline-offset-[-0.0625rem] outline-teal-300 overflow-hidden grid place-items-center'
              >
                <img alt='' src={imgAddAPhoto} className='w-8 h-8' />
              </button>

              <div className='w-80 left-[30.6875rem] top-[35.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-gray-300 inline-flex justify-between items-center'>
                    <div className='justify-start text-gray-400 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                      Value
                    </div>
                    <img alt='' src={imgChevron} className='w-6 h-6' />
                  </div>
                </div>
              </div>

              <div className='w-80 left-[30.6875rem] top-[41.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-gray-50 rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-gray-300 inline-flex justify-between items-center'>
                    <div className='justify-start text-gray-400 text-[1rem] font-normal font-sans leading-[1.5rem]'>
                      Value
                    </div>
                    <img alt='' src={imgChevron} className='w-6 h-6' />
                  </div>
                </div>
              </div>

              <div className='w-[31.5rem] h-0 left-[49.875rem] top-[53.25rem] absolute origin-top-left rotate-180 border-t-[0.0625rem] border-[#AEB8C2]'></div>
              <button
                type='button'
                onClick={onContinue}
                className='w-52 px-4 py-2 left-[36.4375rem] top-[55.75rem] absolute bg-teal-300 rounded-[8.5rem] outline-[0.0625rem] outline-offset-[-0.0625rem] outline-gray-300 inline-flex justify-center items-center gap-2'
              >
                <div className='justify-start text-teal-900 text-[1rem] font-medium font-sans leading-[1.5rem]'>
                  Continuar
                </div>
                <img alt='' src={imgArrowForward} className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
