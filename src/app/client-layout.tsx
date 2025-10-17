'use client'

import Layout from '@/components/layout/Layout'
import { useAdaptiveDPI } from '@/hooks/useAdaptiveDPI'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useAdaptiveDPI({ designWidth: 1920, baseRem: 10 })

  return <Layout>{children}</Layout>
}