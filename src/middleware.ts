import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const PUBLIC_PATHS = ['/login']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
  const cookies = request.cookies.getAll()
  console.log('MW cookies:', cookies.map(c => c.name))
  return cookies
},
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          })
        },
      },
    }
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const currentLocale =
    routing.locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ??
    routing.defaultLocale

  const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathnameWithoutLocale === p || pathnameWithoutLocale.startsWith(`${p}/`)
  )

  
  console.log('MW user:', user?.email, '| path:', pathname)

  if (!user && !isPublicPath) {
    const loginUrl = new URL(`/${currentLocale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublicPath) {
    const dashboardUrl = new URL(`/${currentLocale}`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Run i18n middleware and merge cookies from supabase into its response
  const intlResponse = intlMiddleware(request)
  
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}