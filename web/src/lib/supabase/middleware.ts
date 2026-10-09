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

  // IMPORTANTE: No proteger rutas estaticas, de auth ni formularios publicos.
  // /api/cron y /api/webhooks llegan sin sesión (Vercel Cron, Wompi) y se autentican
  // ellos mismos (CRON_SECRET, firma del evento).
  // Este filtro es solo de navegación: la autorización real está en cada página,
  // server action y route handler (lib/auth/guards.ts).
  const path = request.nextUrl.pathname
  if (path.startsWith('/_next') ||
    path.startsWith('/auth') ||
    path.startsWith('/formulario') ||
    path.startsWith('/invite/') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/signup') ||
    path.startsWith('/static') ||
    path.startsWith('/api/cron/') ||
    path.startsWith('/api/webhooks/') ||
    /\.(?:ico|png|jpe?g|gif|webp|svg|css|js|map|txt|xml|woff2?)$/.test(path)) {
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
    // El rol sale SOLO de public.profiles (la política RLS permite leer el propio perfil).
    // user_metadata no sirve: el propio usuario puede modificarlo.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || 'client'

    // Si intenta ir a login estando logueado, redirigir a su home
    if (request.nextUrl.pathname.startsWith('/login')) {
      let target = '/dashboard'
      if (role === 'admin') target = '/admin'
      if (role === 'payer_guest') target = '/portal'

      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url)
    }

    // Protección de rutas específicas
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        console.log(`[Middleware] Bloqueando acceso a /admin para rol ${role}`)
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
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
      if (role === 'admin') target = '/admin'
      if (role === 'payer_guest') target = '/portal'

      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
