import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirect') || '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    // Fix — create profile row if it doesn't exist
    // This ensures customers who sign up via Google OAuth or email
    // appear in the admin customers page
    if (session?.user) {
      const user = session.user
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existing) {
        const fullName = user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] || ''

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'customer',
          is_blocked: false,
          whatsapp_opted_in: false,
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  return NextResponse.redirect(new URL(redirect, request.url))
}
