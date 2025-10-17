/**
 * MainLayout - Professional Responsive Layout Wrapper
 * 
 * This component provides the foundational responsive layout structure for the
 * KlinikOS application. It implements the container strategy and max-width
 * constraints defined in the Tailwind configuration.
 * 
 * Features:
 * - Responsive container with strategic max-width constraints
 * - Proper sidebar + content area layout
 * - Fluid spacing that scales with viewport
 * - Professional mobile-first approach (ready for future mobile support)
 * 
 * Usage:
 * <MainLayout>
 *   <YourPageContent />
 * </MainLayout>
 */

import React from 'react'

interface MainLayoutProps {
  children: React.ReactNode
  /**
   * Container size - determines max-width of content area
   * - 'dashboard': 1600px (default for dashboard pages)
   * - 'content': 1440px (for content-heavy pages)
   * - 'narrow': 1280px (for focused interfaces)
   * - 'full': no max-width (for special cases)
   */
  container?: 'dashboard' | 'content' | 'narrow' | 'full'
  /**
   * Padding strategy
   * - 'responsive': fluid padding that scales with viewport (default)
   * - 'fixed': consistent padding at all sizes
   * - 'compact': tighter padding for dense interfaces
   */
  padding?: 'responsive' | 'fixed' | 'compact'
}

export default function MainLayout({ 
  children, 
  container = 'dashboard',
  padding = 'responsive'
}: MainLayoutProps) {
  
  // Container max-width classes based on strategy
  const containerClasses = {
    'dashboard': 'max-w-dashboard',  // 1600px
    'content': 'max-w-layout',      // 1440px  
    'narrow': 'max-w-layout-sm',    // 1280px
    'full': 'w-full'                // no max-width
  }
  
  // Padding classes based on strategy
  const paddingClasses = {
    'responsive': 'p-container-sm lg:p-container-md xl:p-container-lg', // fluid
    'fixed': 'p-6',                 // consistent 24px
    'compact': 'p-4'                // tight 16px
  }
  
  return (
    <div className="w-full">
      {/* Main content container with responsive constraints */}
      <div className={`
        ${containerClasses[container]}
        mx-auto 
        ${paddingClasses[padding]}
        transition-spacing duration-200 ease-out
      `}>
        {children}
      </div>
    </div>
  )
}

/**
 * USAGE EXAMPLES:
 * 
 * // Standard dashboard page (most common)
 * <MainLayout>
 *   <DashboardContent />
 * </MainLayout>
 * 
 * // Content-heavy page with smaller container
 * <MainLayout container="content">
 *   <ArticleContent />
 * </MainLayout>
 * 
 * // Focused interface with compact padding
 * <MainLayout container="narrow" padding="compact">
 *   <FormContent />
 * </MainLayout>
 * 
 * // Special full-width layout
 * <MainLayout container="full" padding="fixed">
 *   <DataVisualization />
 * </MainLayout>
 */