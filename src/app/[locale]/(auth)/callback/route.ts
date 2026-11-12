import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Validate `next` to prevent open redirect attacks
  const nextRaw = searchParams.get('next') ?? `/${locale}/dashboard`
  // Only same-site paths: reject "//host" and "/\host" (browsers treat a backslash as "/")
  const isSafePath = nextRaw.startsWith('/') && !nextRaw.startsWith('//') && !nextRaw.includes('\\')
  const next = isSafePath ? nextRaw : `/${locale}/dashboard`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_error`)
}
