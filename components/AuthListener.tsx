'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'

export default function AuthListener() {
  const { syncFromDb: syncCartFromDb, clearCart } = useCartStore()
  const { syncFromDb: syncWishlistFromDb, clearLocal } = useWishlistStore()

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        syncWishlistFromDb(session.user.id)
        syncCartFromDb(session.user.id)   // ← syncs DB cart into local on login
      }
      if (event === 'SIGNED_OUT') {
        clearLocal()
        clearCart()                        // ← clears local cart on logout
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return null
}
