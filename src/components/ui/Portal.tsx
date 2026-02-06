'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
  /**
   * ID del elemento donde se montará el portal.
   * Por defecto se crea un div con id 'portal-root' en el body.
   */
  containerId?: string
}

/**
 * Portal component que renderiza sus hijos fuera del árbol DOM padre,
 * directamente en el body. Útil para modales, tooltips, dropdowns, etc.
 * 
 * Esto soluciona problemas de z-index y contextos de apilamiento (stacking context).
 */
export default function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const [mounted, setMounted] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Buscar o crear el contenedor
    let element = document.getElementById(containerId)
    
    if (!element) {
      element = document.createElement('div')
      element.id = containerId
      document.body.appendChild(element)
    }
    
    setContainer(element)

    return () => {
      // No eliminamos el contenedor porque otros portales podrían usarlo
    }
  }, [containerId])

  // No renderizar en el servidor
  if (!mounted || !container) {
    return null
  }

  return createPortal(children, container)
}
