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
        // Optimistically update local state
        set(state => ({
          ids: isIn ? state.ids.filter(id => id !== productId) : [...state.ids, productId]
        }))

        if (userId) {
          const supabase = createClient()
          // Fix #5 — handle errors and revert local state if DB write fails
          if (isIn) {
            const { error } = await supabase.from('wishlists').delete()
              .eq('user_id', userId).eq('product_id', productId)
            if (error) {
              // Revert optimistic update
              set(state => ({ ids: [...state.ids, productId] }))
            }
          } else {
            const { error } = await supabase.from('wishlists').insert({
              user_id: userId, product_id: productId
            })
            if (error) {
              // Revert optimistic update
              set(state => ({ ids: state.ids.filter(id => id !== productId) }))
            }
          }
        }
      },

      isWishlisted: (productId) => get().ids.includes(productId),

      syncFromDb: async (userId) => {
        const supabase = createClient()
        const { data, error } = await supabase.from('wishlists')
          .select('product_id').eq('user_id', userId)
        if (error) { ; return }
        if (data) set({ ids: data.map((r: any) => r.product_id) })
      },

      clearLocal: () => set({ ids: [] }),
    }),
    { name: 'skss-wishlist' }
  )
)
