'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cart'
import { useWishlistStore } from '@/lib/store/wishlist'

export default function AuthListener() {
  const cartStore = useCartStore()
  const { syncFromDb, clearLocal } = useWishlistStore()

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        syncFromDb(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        clearLocal()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return null
}
