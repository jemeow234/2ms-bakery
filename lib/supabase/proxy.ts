import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Keeps the Supabase session cookies fresh on every request, and sends
 * signed-out visitors away from /admin before any admin code is served.
 * The admin layout and every /api/admin route still check the role
 * themselves; this is only the cheap first gate.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          // Refreshed tokens go on the request too, so pages and route
          // handlers rendered for this request see the new session.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // A response carrying auth cookies must never be cached and served
          // to someone else.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Verifies the token (refreshing it if needed). Unlike getSession(), the
  // result can be trusted. Keep this directly after createServerClient.
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims && request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
