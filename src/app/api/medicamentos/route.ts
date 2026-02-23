import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CIMA_BASE_URL = 'https://cima.aemps.es/cima/rest/medicamentos'
const REQUEST_TIMEOUT_MS = 10000

// Types for CIMA API response
interface CIMAMedicamento {
  nregistro: string
  nombre: string
  labtitular: string
  dosis?: string
  formaFarmaceutica?: {
    id: number
    nombre: string
  }
  formaFarmaceuticaSimplificada?: {
    id: number
    nombre: string
  }
  viasAdministracion?: Array<{
    id: number
    nombre: string
  }>
  comerc: boolean
  receta: boolean
  generico: boolean
}

interface CIMAResponse {
  totalFilas: number
  pagina: number
  tamanioPagina: number
  resultados: CIMAMedicamento[]
}

// Simplified response type for frontend
export interface MedicamentoSimplificado {
  nregistro: string
  nombre: string
  dosis: string
  formaFarmaceutica: string
  viaAdministracion: string
  laboratorio: string
  comercializado: boolean
  generico: boolean
}

/**
 * GET /api/medicamentos?q=paracetamol
 * Proxy endpoint for CIMA AEMPS API to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = (searchParams.get('q') || '').trim()

  // Validate query parameter
  if (query.length < 2) {
    return NextResponse.json(
      { error: 'El parámetro de búsqueda debe tener al menos 2 caracteres' },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    // Call CIMA API
    const cimaUrl = `${CIMA_BASE_URL}?nombre=${encodeURIComponent(query)}`
    
    const response = await fetch(cimaUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'klinikOS/1.0 (+medication-search)',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      signal: controller.signal,
      cache: 'no-store'
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          total: 0,
          resultados: [],
          error: `Servicio CIMA no disponible (HTTP ${response.status})`
        },
        { status: 200 }
      )
    }

    const data: CIMAResponse = await response.json()
    const rawResultados = Array.isArray(data?.resultados) ? data.resultados : []

    // Filter and transform results
    // Prefer commercialized medications and limit to 20 results
    const medicamentos: MedicamentoSimplificado[] = rawResultados
      .filter((med) => med && med.comerc !== false)
      .slice(0, 20) // Limit results
      .map((med) => ({
        nregistro: med.nregistro || '',
        nombre: med.nombre,
        dosis: med.dosis || '',
        formaFarmaceutica: med.formaFarmaceuticaSimplificada?.nombre || 
                          med.formaFarmaceutica?.nombre || '',
        viaAdministracion: med.viasAdministracion?.[0]?.nombre || '',
        laboratorio: med.labtitular,
        comercializado: med.comerc,
        generico: med.generico
      }))

    return NextResponse.json({
      total: Number(data?.totalFilas) || medicamentos.length,
      resultados: medicamentos
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          total: 0,
          resultados: [],
          error: 'Tiempo de espera agotado al consultar CIMA'
        },
        { status: 200 }
      )
    }

    console.error('Error fetching from CIMA API:', error)
    return NextResponse.json(
      {
        total: 0,
        resultados: [],
        error: 'Error al buscar medicamentos en CIMA. Inténtalo de nuevo.'
      },
      { status: 200 }
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
