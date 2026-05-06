import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

interface WishlistStore {
  ids: string[]
  toggle: (productId: string, userId?: string) => Promise<void>
  isWishlisted: (productId: string) => boolean
  syncFromDb: (userId: string) => Promise<void>
  clearLocal: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: async (productId, userId) => {
        const isIn = get().ids.includes(productId)
        set(state => ({ ids: isIn ? state.ids.filter(id => id !== productId) : [...state.ids, productId] }))
        if (userId) {
          const supabase = createClient()
          if (isIn) await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId)
          else await supabase.from('wishlists').insert({ user_id: userId, product_id: productId })
        }
      },
      isWishlisted: (productId) => get().ids.includes(productId),
      syncFromDb: async (userId) => {
        const supabase = createClient()
        const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', userId)
        if (data) set({ ids: data.map((r: any) => r.product_id) })
      },
      clearLocal: () => set({ ids: [] }),
    }),
    { name: 'skss-wishlist' }
  )
)
