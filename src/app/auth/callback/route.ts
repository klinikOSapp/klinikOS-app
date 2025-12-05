import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getBaseUrl(request: NextRequest): string {
  // Use NEXT_PUBLIC_APP_URL if set (for production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Try to get the actual host from forwarded headers (Railway, Vercel, etc.)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  
  // Fallback to request URL origin
  const requestUrl = new URL(request.url)
  return requestUrl.origin
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/pacientes'
  const baseUrl = getBaseUrl(request)

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, baseUrl))
    }
  }

  // Return to login page with error if something went wrong
  return NextResponse.redirect(new URL('/login?error=auth', baseUrl))
}

