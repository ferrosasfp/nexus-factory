import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

function extractLocaleFromPath(pathname: string): string | null {
  const segments = pathname.split('/')
  const possibleLocale = segments[1]
  if (routing.locales.includes(possibleLocale as typeof routing.locales[number])) {
    return possibleLocale
  }
  return null
}

function stripLocale(pathname: string, locale: string): string {
  return pathname.replace(`/${locale}`, '') || '/'
}

export async function middleware(request: NextRequest) {
  // Step 1: Run next-intl middleware (handles locale detection + redirect)
  const intlResponse = intlMiddleware(request)

  // If intlMiddleware redirected (e.g., / → /en), return immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  // Rutas públicas sin Supabase (demo Field Shift: sin login ni cookies de sesión)
  const publicLocale = extractLocaleFromPath(request.nextUrl.pathname) ?? routing.defaultLocale
  if (stripLocale(request.nextUrl.pathname, publicLocale).startsWith('/field-shift')) {
    return intlResponse
  }

  // Step 2: Run Supabase auth check on the intl response
  const response = intlResponse

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const locale = extractLocaleFromPath(pathname) ?? routing.defaultLocale
  const pathWithoutLocale = stripLocale(pathname, locale)

  const isProtectedRoute = pathWithoutLocale.startsWith('/dashboard') ||
    pathWithoutLocale.startsWith('/wallet') ||
    pathWithoutLocale.startsWith('/contracts') ||
    pathWithoutLocale.startsWith('/storage')

  const isAuthRoute = pathWithoutLocale.startsWith('/login') ||
    pathWithoutLocale.startsWith('/signup')

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL(`/${locale}/login`, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)

    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c)
    })

    return redirectResponse
  }

  if (isAuthRoute && user) {
    const redirectUrl = new URL(`/${locale}/dashboard`, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)

    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c)
    })

    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
