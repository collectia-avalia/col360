import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/'

  const supabase = await createClient()
  const cookieStore = await cookies()

  let hasSession = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      hasSession = true
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })
    if (!error) {
      hasSession = true
    }
  }

  if (hasSession) {
    // En Next.js 15, las cookies modificadas en cookieStore NO se transfieren
    // automáticamente a un nuevo NextResponse.redirect. Debemos copiarlas manualmente.
    const response = NextResponse.redirect(`${requestUrl.origin}${next}`)
    
    cookieStore.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: '/',
        secure: true,
        sameSite: 'lax',
      })
    })

    return response
  }

  // Si hay un error de autenticación o los parámetros no son correctos, redirigir a login con un error explícito
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
}
