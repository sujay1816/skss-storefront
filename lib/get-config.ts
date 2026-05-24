import { createClient } from '@supabase/supabase-js'

// Reads a key from site_config first, falls back to process.env
// This lets keys set in the admin Setup tab take effect without needing Vercel env vars
let cache: Record<string, string> = {}
let cacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

async function getConfigMap(): Promise<Record<string, string>> {
  if (Date.now() - cacheTime < CACHE_TTL && Object.keys(cache).length > 0) return cache
  // Skip DB if env vars not configured (prevents errors during cold start)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return {}
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data } = await sb.from('site_config').select('key, value')
    const map: Record<string, string> = {}
    data?.forEach((r: any) => { if (r.key && r.value) map[r.key] = r.value })
    cache = map
    cacheTime = Date.now()
    return map
  } catch { return {} }
}

export async function getCfg(
  setupKey: string,       // key stored in site_config (e.g. 'setup_razorpay_key_secret')
  envFallback?: string    // process.env value to fall back to
): Promise<string> {
  const map = await getConfigMap()
  return map[setupKey] || envFallback || ''
}
