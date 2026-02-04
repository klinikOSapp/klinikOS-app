import { NextRequest, NextResponse } from 'next/server'

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
  const query = searchParams.get('q')

  // Validate query parameter
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'El parámetro de búsqueda debe tener al menos 2 caracteres' },
      { status: 400 }
    )
  }

  try {
    // Call CIMA API
    const cimaUrl = `https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(query)}`
    
    const response = await fetch(cimaUrl, {
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 1 hour to reduce API calls
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      throw new Error(`CIMA API responded with status: ${response.status}`)
    }

    const data: CIMAResponse = await response.json()

    // Filter and transform results
    // Only show commercialized medications and limit to 20 results
    const medicamentos: MedicamentoSimplificado[] = data.resultados
      .filter((med) => med.comerc) // Only commercialized
      .slice(0, 20) // Limit results
      .map((med) => ({
        nregistro: med.nregistro,
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
      total: data.totalFilas,
      resultados: medicamentos
    })
  } catch (error) {
    console.error('Error fetching from CIMA API:', error)
    return NextResponse.json(
      { error: 'Error al buscar medicamentos. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
