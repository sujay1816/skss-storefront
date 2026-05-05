'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'

export default function AuthListener() {
  const { onLogin, onLogout } = useCartStore()
  const { syncFromDb, clearLocal } = useWishlistStore()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User just logged in — merge guest cart + sync wishlist
        await onLogin(session.user.id)
        await syncFromDb(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        // User logged out — clear local cart and wishlist
        await onLogout()
        clearLocal()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null // This component renders nothing, just listens
}
