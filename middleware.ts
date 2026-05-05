import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/profile', '/checkout', '/orders', '/wishlist']
const GUEST_ONLY = ['/login', '/signup', '/forgot-password', '/reset-password']

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

  // Refresh session — this keeps cookies fresh automatically
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protect pages that require login
  if (PROTECTED.some(r => path.startsWith(r)) && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Only redirect away from login/signup if user is verified and session is fresh
  // Do NOT redirect if there's any doubt — avoids the loop issue
  if (GUEST_ONLY.some(r => path.startsWith(r)) && user) {
    // Check if it's a real active session by verifying the user exists
    if (user.id) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
