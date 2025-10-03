'use client'

import React from 'react'
import { BottomBar } from './BottomBar'

export default function MobileLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen flex flex-col'>
      <div className='h-topbar-mobile' />
      <div className='flex-1'>{children}</div>
      <BottomBar />
    </div>
  )
}
