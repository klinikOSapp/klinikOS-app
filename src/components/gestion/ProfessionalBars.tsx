import type { CSSProperties } from 'react'

const imgFilterAlt =
  'http://localhost:3845/assets/622ee6e3207960b9a18935df21e77e84c84d7c28.svg'
const imgGrid =
  'http://localhost:3845/assets/1c7e662cc8affdff9c0a9a4d251f4fc6a1bd0385.svg'

const AXIS_LABELS = [350, 300, 250, 200, 150, 100, 50, 0]
const PROFESSIONAL_LABELS = [
  'Dr. Guille',
  'Dra. Laura',
  'Tamara (Hig.)',
  'Nerea (Hig.)'
]

// Medidas extraídas de Figma y convertidas a rem (px ÷ 16)
const CARD_WIDTH_REM = '33.0625rem' // 529px
const CARD_HEIGHT_REM = '21.375rem' // 342px
const HEADER_LEFT = '1rem' // 16px
const HEADER_TOP = '1rem' // 16px
const HEADER_WIDTH = '31.0625rem' // 497px
const GRID_LEFT = '3.4375rem' // 55px
const GRID_TOP = '5.25rem' // 84px
const GRID_WIDTH = '27.375rem' // 438px
const GRID_HEIGHT = '13rem' // 208px
const Y_LABEL_LEFT = '1rem' // 16px
const Y_LABEL_TOP = '4.5rem' // 72px
const Y_LABEL_HEIGHT = '13.75rem' // 220px
const X_LABEL_TOP = '18.875rem' // 302px

const BARS = [
  {
    label: 'Dr. Guille',
    color: '#2A6B67',
    left: '3.4375rem', // 55px
    top: '6.0625rem', // 97px
    height: '12.1875rem' // 195px
  },
  {
    label: 'Dra. Laura',
    color: '#51D6C7',
    left: '10.4375rem', // 167px
    top: '8.125rem', // 130px
    height: '10.125rem' // 162px
  },
  {
    label: 'Tamara (Hig.)',
    color: '#D3F7F3',
    left: '18.5rem', // 296px
    top: '10.9375rem', // 175px
    height: '7.3125rem' // 117px
  },
  {
    label: 'Nerea (Hig.)',
    color: '#A8EFE7',
    left: '26.875rem', // 430px
    top: '9.9375rem', // 159px
    height: '8.3125rem' // 133px
  }
]

export default function ProfessionalBars() {
  const cardStyles: CSSProperties = {
    width: '100%',
    maxWidth: `min(${CARD_WIDTH_REM}, 95vw, var(--chart-prof-width-limit, ${CARD_WIDTH_REM}))`,
    height: `min(${CARD_HEIGHT_REM}, var(--chart-prof-height-limit, ${CARD_HEIGHT_REM}))`
  }

  return (
    <section
      className='relative overflow-visible rounded-[0.5rem] bg-white shadow-elevation-card'
      style={cardStyles}
    >
      <header
        className='absolute flex items-center justify-between'
        style={{
          left: HEADER_LEFT,
          top: HEADER_TOP,
          width: HEADER_WIDTH,
          height: '1.5rem' // 24px
        }}
      >
        <h3 className='text-[1rem] font-medium leading-[1.5rem] text-[#24282C]'>
          Facturación por profesional
        </h3>
        <img
          src={imgFilterAlt}
          alt=''
          className='h-[1.5rem] w-[1.5rem]'
          style={{ color: '#6D7783' }}
        />
      </header>

      {/* Área de gráfico */}
      <div
        className='relative h-full w-full'
        style={{ transform: 'translateY(-0.5rem)' }}
      >
        {/* Líneas de guía */}
        <div
          className='absolute'
          style={{
            left: GRID_LEFT,
            top: GRID_TOP,
            width: GRID_WIDTH,
            height: GRID_HEIGHT
          }}
        >
          <img
            src={imgGrid}
            alt=''
            className='h-full w-full max-w-none'
            style={{ opacity: 0.6 }}
          />
        </div>

        {/* Barras */}
        {BARS.map((bar) => (
          <div
            key={bar.label}
            className='absolute w-[3.625rem] rounded-[1rem]'
            style={{
              left: bar.left,
              top: bar.top,
              height: bar.height,
              backgroundColor: bar.color
            }}
          />
        ))}

        {/* Eje Y */}
        <div
          className='absolute flex w-max flex-col justify-between text-[0.75rem] font-normal leading-[1rem] text-[#AEB8C2]'
          style={{
            left: Y_LABEL_LEFT,
            top: Y_LABEL_TOP,
            height: Y_LABEL_HEIGHT
          }}
        >
          {AXIS_LABELS.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* Eje X */}
        <div
          className='absolute flex justify-between text-[0.75rem] font-normal leading-[1rem] text-[#AEB8C2]'
          style={{
            left: GRID_LEFT,
            top: X_LABEL_TOP,
            width: GRID_WIDTH
          }}
        >
          {PROFESSIONAL_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
