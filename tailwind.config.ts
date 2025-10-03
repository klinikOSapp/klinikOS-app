// Figma tokens extracted from @figma/Layout (exact hex/px values)
// Colors
// brand: {
//   0:  #F0FAFA,
//   50: #E9FBF9,
//   100:#D3F7F3,
//   200:#A8EFE7,
//   300:#7DE7DC,
//   400:#59DED2,
//   500:#51D6C7,
//   600:#3FB7AB,
//   700:#338F88,
//   800:#2A6B67,
//   900:#1E4947,
// }
// neutral: {
//   0:  #FFFFFF,
//   50: #F8FAFB,
//   100:#EEF2F4,
//   200:#E2E7EA,
//   300:#CBD3D9,
//   400:#AEB8C2,
//   500:#8A95A1,
//   600:#6D7783,
//   700:#535C66,
//   800:#3D434A,
//   900:#24282C,
// }
// success (Éxito): { 50:#E9F8F1, 200:#A0E3C3, 600:#2E7D5B, 800:#1D4F3A }
// warning (Aviso): { 50:#FFF7E8, 200:#FFD188, 600:#D97706, 800:#92400E } // 600/800 mapped from Figma's amber-600/amber-800
// error: { 50:#FEEBEC, 200:#F7B7BA, 600:#B91C1C, 800:#7F1D1D } // 600/800 mapped from Figma's red-700/red-900
// info: { 50:#F3EAFF, 200:#D4B5FF, 600:#7825EB, 800:#5A1EAF }
// Spacing: topbar=64px, sidebar(expanded)=256px, sidebar(collapsed)=80px, navItem=48px, cta=56px, gapSm=8px, gapMd=16px, plNav=24px
// Typography: Title/Medium: Inter 18/28 500; Body/Medium: Inter 16/24 400
// Radii: 16px (CTA, content top-left),
// Shadows: CTA => 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)
// Active indicator (nav clicked): inset 4px 0 0 0 #A8EFE7

export default {
  theme: {
    extend: {
      colors: {
        brand: {
          0: '#F0FAFA',
          50: '#E9FBF9',
          100: '#D3F7F3',
          200: '#A8EFE7',
          300: '#7DE7DC',
          400: '#59DED2',
          500: '#51D6C7',
          600: '#3FB7AB',
          700: '#338F88',
          800: '#2A6B67',
          900: '#1E4947'
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F8FAFB',
          100: '#EEF2F4',
          200: '#E2E7EA',
          300: '#CBD3D9',
          400: '#AEB8C2',
          500: '#8A95A1',
          600: '#6D7783',
          700: '#535C66',
          800: '#3D434A',
          900: '#24282C'
        },
        success: {
          50: '#E9F8F1',
          200: '#A0E3C3',
          600: '#2E7D5B',
          800: '#1D4F3A'
        },
        warning: {
          50: '#FFF7E8',
          200: '#FFD188',
          600: '#D97706', // amber-600
          800: '#92400E' // amber-800
        },
        error: {
          50: '#FEEBEC',
          200: '#F7B7BA',
          600: '#B91C1C', // red-700
          800: '#7F1D1D' // red-900
        },
        info: {
          50: '#F3EAFF',
          200: '#D4B5FF',
          600: '#7825EB',
          800: '#5A1EAF'
        }
      },
      spacing: {
        topbar: '64px',
        sidebar: '256px',
        'sidebar-collapsed': '80px',
        'nav-item': '48px',
        cta: '56px',
        'topbar-mobile': '56px',
        'bottombar-mobile': '64px',
        gapsm: '8px',
        gapmd: '16px',
        plnav: '24px'
      },
      borderRadius: {
        xl: '16px',
        'tl-16': '16px'
      },
      boxShadow: {
        cta: '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
        'nav-active': 'inset 4px 0 0 0 #A8EFE7'
      },
      fontFamily: {
        inter: [
          'var(--font-inter)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif'
        ]
      },
      fontSize: {
        'title-md': ['18px', { lineHeight: '28px', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }]
      },
      screens: {
        mobile: '360px',
        desktop: '905px'
      }
    }
  }
} satisfies import('tailwindcss').Config
