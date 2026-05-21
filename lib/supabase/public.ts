// Public data client — no cookies, no auth
// Used for ISR-cached pages (homepage, shop) so Next.js can cache responses
// The cookie-based client forces dynamic rendering per user, breaking ISR
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
