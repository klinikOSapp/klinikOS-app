'use client'

import Layout from '@/components/layout/Layout'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return <Layout>{children}</Layout>
}