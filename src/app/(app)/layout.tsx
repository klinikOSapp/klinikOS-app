import React from 'react'
import Layout from '@/components/layout/Layout'

export default function AppLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return <Layout>{children}</Layout>
}


