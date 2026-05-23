import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/profile', '/checkout', '/orders', '/wishlist', '/cart']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase unavailable — fail open for public pages, block protected routes only
    const path = request.nextUrl.pathname
    if (PROTECTED.some(r => path.startsWith(r))) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url))
    }
    return response
  }
  const path = request.nextUrl.pathname

  // FIX: redirect already-logged-in users away from auth pages
  if (user && (path === '/login' || path === '/signup')) {
    const redirect = request.nextUrl.searchParams.get('redirect') || '/'
    const safe = redirect.startsWith('/') ? redirect : '/'
    return NextResponse.redirect(new URL(safe, request.url))
  }

  // Only protect pages that need login — never redirect away from login/signup
  if (PROTECTED.some(r => path.startsWith(r)) && !user) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(path)}`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
