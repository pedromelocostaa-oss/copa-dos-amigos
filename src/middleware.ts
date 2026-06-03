import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthRoute   = pathname.startsWith('/login') || pathname.startsWith('/cadastro')
  const isPublicRoute = isAuthRoute || pathname.startsWith('/entrar/')
  const isAdminRoute  = pathname.startsWith('/admin')
  const isOnboarding  = pathname.startsWith('/onboarding')

  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Verifica se usuário está em algum bolão (exceto admin, onboarding, entrar/*, auth)
  if (user && !isPublicRoute && !isAdminRoute && !isOnboarding) {
    try {
      const { data: membership, error } = await supabase
        .from('bolao_members')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      // Só redireciona se a query funcionou E não achou membership
      // Se houve erro (ex: tabela não existe), deixa passar para evitar loop
      if (!error && !membership) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    } catch {
      // Se a query falhar, deixa o usuário passar — o page.tsx vai lidar
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
