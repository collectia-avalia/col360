import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No proteger rutas estaticas, de auth ni formularios publicos
  if (request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/invite') ||
    request.nextUrl.pathname.startsWith('/formulario') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.')) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Si no hay usuario y no estamos en login ni portal público, redirigir a login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si hay usuario, verificar rol y redirigir
  if (user) {
    // ESTRATEGIA OPTIMIZADA: Leer rol desde metadata (inyectado por admin)
    // Esto evita consultas a BD bloqueadas por RLS en el middleware
    const metadataRole = user.user_metadata?.role

    // Fallback: Si no está en metadata, intentar DB (aunque puede fallar por RLS)
    let dbRole = null
    if (!metadataRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      dbRole = profile?.role
    }

    const role = metadataRole || dbRole || 'client'

    // DEBUG LOGS
    console.log(`[Middleware] Usuario: ${user.email}`)
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}`)
    console.log(`[Middleware] Rol Detectado: ${role} (Meta: ${metadataRole}, DB: ${dbRole})`)

    // Si intenta ir a login estando logueado, redirigir a su home
    if (request.nextUrl.pathname.startsWith('/login')) {
      let target = '/dashboard'
      if (role === 'superadmin') target = '/admin'
      if (role === 'payer_guest') target = '/portal'

      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url)
    }

    // Protección de rutas específicas
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (role !== 'superadmin') {
        console.log(`[Middleware] Bloqueando acceso a /admin para rol ${role}`)
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (role === 'superadmin') {
        console.log(`[Middleware] Redirigiendo Superadmin de /dashboard a /admin`)
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      if (role === 'payer_guest') {
        console.log(`[Middleware] Redirigiendo Pagador de /dashboard a /portal`)
        const url = request.nextUrl.clone()
        url.pathname = '/portal'
        return NextResponse.redirect(url)
      }
    }

    // Redirigir raíz a dashboard correspondiente
    if (request.nextUrl.pathname === '/') {
      let target = '/dashboard'
      if (role === 'superadmin') target = '/admin'
      if (role === 'payer_guest') target = '/portal'

      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
