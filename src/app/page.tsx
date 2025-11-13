import LandingAnimation from '@/components/auth/LandingAnimation'

export default function PreAuthLanding() {
  return (
    <main
      className='relative min-h-[100dvh] w-full overflow-hidden'
      style={{ backgroundImage: 'var(--prelogin-bg-gradient)' }}
    >
      <div className='absolute inset-0 grid place-items-center'>
        <LandingAnimation />
      </div>
    </main>
  )
}
