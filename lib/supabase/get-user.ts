import { createClient } from './server'
import type { UserProfile } from '@/types'

export async function getUser(): Promise<UserProfile | null> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return null
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name || '',
      phone: profile.phone || null,
      avatarUrl: profile.avatar_url || null,
      role: profile.role,
      isBlocked: profile.is_blocked,
      whatsappOptedIn: profile.whatsapp_opted_in,
      createdAt: profile.created_at,
    }
  } catch {
    return null
  }
}
