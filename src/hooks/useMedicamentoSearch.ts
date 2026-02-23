'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MedicamentoSimplificado } from '@/app/api/medicamentos/route'

interface UseMedicamentoSearchResult {
  resultados: MedicamentoSimplificado[]
  loading: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

// Simple in-memory cache
const cache = new Map<string, { data: MedicamentoSimplificado[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Hook for searching medications with debounce and caching
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @param minChars - Minimum characters to trigger search (default: 2)
 */
export function useMedicamentoSearch(
  debounceMs: number = 300,
  minChars: number = 2
): UseMedicamentoSearchResult {
  const [resultados, setResultados] = useState<MedicamentoSimplificado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const latestQueryRef = useRef('')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchMedicamentos = useCallback(async (query: string) => {
    latestQueryRef.current = query

    // Check cache first
    const cacheKey = query.toLowerCase()
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (latestQueryRef.current !== query) return
      setResultados(cached.data)
      setError(null)
      setLoading(false)
      return
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(
        `/api/medicamentos?q=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al buscar medicamentos')
      }

      const data = await response.json()
      const medicamentos = Array.isArray(data.resultados) ? data.resultados : []
      
      // Update cache
      cache.set(cacheKey, { data: medicamentos, timestamp: Date.now() })

      if (latestQueryRef.current !== query) return
      
      setResultados(medicamentos)
      setError(typeof data.error === 'string' && data.error ? data.error : null)
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      
      console.error('Error searching medications:', err)
      if (latestQueryRef.current !== query) return
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setResultados([])
    } finally {
      if (latestQueryRef.current === query) {
        setLoading(false)
      }
    }
  }, [])

  const search = useCallback((query: string) => {
    const normalizedQuery = query.trim()

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Clear results if query is too short
    if (!normalizedQuery || normalizedQuery.length < minChars) {
      // Cancel pending request to avoid stale late results
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      latestQueryRef.current = normalizedQuery
      setResultados([])
      setLoading(false)
      setError(null)
      return
    }

    // Set loading immediately for better UX
    setLoading(true)
    setError(null)

    // Debounce the actual search
    debounceTimerRef.current = setTimeout(() => {
      fetchMedicamentos(normalizedQuery)
    }, debounceMs)
  }, [debounceMs, minChars, fetchMedicamentos])

  const clearResults = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    latestQueryRef.current = ''
    setResultados([])
    setError(null)
    setLoading(false)
  }, [])

  return {
    resultados,
    loading,
    error,
    search,
    clearResults
  }
}

export type { MedicamentoSimplificado }
