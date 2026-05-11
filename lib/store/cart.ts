import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface AppliedCoupon {
  code: string
  discount: number
  type: 'percentage' | 'fixed' | 'free_shipping'
}

interface CartStore {
  items: CartItem[]
  appliedCoupon: AppliedCoupon | null
  addItem: (item: CartItem, userId?: string) => void
  removeItem: (productId: string, colour: string, userId?: string) => void
  updateQty: (productId: string, colour: string, qty: number, userId?: string) => void
  clearCart: (userId?: string) => void
  syncToDb: (userId: string) => Promise<void>
  syncFromDb: (userId: string) => Promise<void>
  totalItems: () => number
  subtotal: () => number
  couponDiscount: () => number
  setCoupon: (coupon: AppliedCoupon | null) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,

      addItem: (item, userId) => {
        set(state => {
          const existing = state.items.find(i => i.productId === item.productId && i.colour === item.colour)
          if (existing) {
            return { items: state.items.map(i => i.productId === item.productId && i.colour === item.colour ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i) }
          }
          return { items: [...state.items, item] }
        })
        // Sync to DB if user is logged in
        if (userId) {
          setTimeout(() => get().syncToDb(userId), 0)
        }
      },

      removeItem: (productId, colour, userId) => {
        set(state => ({
          items: state.items.filter(i => !(i.productId === productId && i.colour === colour))
        }))
        if (userId) {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient()
            supabase.from('carts').delete()
              .eq('user_id', userId)
              .eq('product_id', productId)
              .eq('colour', colour)
          })
        }
      },

      updateQty: (productId, colour, qty, userId) => {
        set(state => ({
          items: state.items.map(i => i.productId === productId && i.colour === colour
            ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i)
        }))
        if (userId) {
          setTimeout(() => get().syncToDb(userId), 0)
        }
      },

      clearCart: (userId) => {
        set({ items: [], appliedCoupon: null })
        if (userId) {
          import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient()
            supabase.from('carts').delete().eq('user_id', userId)
          })
        }
      },

      syncToDb: async (userId) => {
        const { items } = get()
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        // Clear existing cart and rewrite — simplest approach
        await supabase.from('carts').delete().eq('user_id', userId)
        if (items.length === 0) return
        await supabase.from('carts').insert(
          items.map(item => ({
            user_id: userId,
            product_id: item.productId,
            product_name: item.productName,
            product_slug: item.productSlug,
            product_image: item.productImage,
            colour: item.colour,
            colour_hex: item.colourHex,
            original_price: item.originalPrice,
            sale_price: item.salePrice,
            quantity: item.quantity,
            stock: item.stock,
            gst_rate: item.gstRate,
          }))
        )
      },

      syncFromDb: async (userId) => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase.from('carts').select('*').eq('user_id', userId)
        if (!data || data.length === 0) return
        const dbItems: CartItem[] = data.map((r: any) => ({
          productId: r.product_id,
          productName: r.product_name,
          productSlug: r.product_slug,
          productImage: r.product_image || '',
          colour: r.colour,
          colourHex: r.colour_hex || '#000000',
          originalPrice: r.original_price,
          salePrice: r.sale_price,
          quantity: r.quantity,
          stock: r.stock,
          gstRate: r.gst_rate,
        }))
        // Merge DB items with local items — local takes priority for quantity
        const { items: localItems } = get()
        const merged = [...dbItems]
        localItems.forEach(local => {
          const exists = merged.find(i => i.productId === local.productId && i.colour === local.colour)
          if (!exists) merged.push(local)
        })
        set({ items: merged })
      },

      setCoupon: (coupon) => set({ appliedCoupon: coupon }),

      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),

      subtotal: () => get().items.reduce((s, i) => s + (i.salePrice ?? i.originalPrice) * i.quantity, 0),

      couponDiscount: () => {
        const { appliedCoupon, items } = get()
        if (!appliedCoupon) return 0
        const sub = items.reduce((s, i) => s + (i.salePrice ?? i.originalPrice) * i.quantity, 0)
        if (appliedCoupon.type === 'percentage') return Math.round(sub * appliedCoupon.discount / 100)
        if (appliedCoupon.type === 'fixed') return appliedCoupon.discount
        if (appliedCoupon.type === 'free_shipping') return 0
        return 0
      },
    }),
    { name: 'skss-cart' }
  )
)
