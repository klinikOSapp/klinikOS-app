'use client'

import Layout from '@/components/layout/Layout'

interface ClientLayoutProps {
  children: React.ReactNode
  ctaMenuItems?: { id: string; label: string; onClick?: () => void }[]
}

export default function ClientLayout({ children, ctaMenuItems }: ClientLayoutProps) {
  return <Layout ctaMenuItems={ctaMenuItems}>{children}</Layout>
}