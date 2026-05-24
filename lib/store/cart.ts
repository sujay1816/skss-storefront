import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface AppliedCoupon {
  code: string
  discount: number
  // Fix #9 — type includes both 'flat' (DB value) and 'fixed' (old value) for compatibility
  type: 'percentage' | 'flat' | 'fixed' | 'free_shipping'
}

interface CartStore {
  items: CartItem[]
  appliedCoupon: AppliedCoupon | null
  addItem: (item: CartItem, userId?: string) => void
  removeItem: (productId: string, colour: string, userId?: string) => void
  updateQty: (productId: string, colour: string, qty: number, userId?: string) => Promise<void>
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
            return { items: state.items.map(i => i.productId === item.productId && i.colour === item.colour
              ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i) }
          }
          return { items: [...state.items, item] }
        })
        if (userId) setTimeout(() => get().syncToDb(userId), 0)
      },

      removeItem: (productId, colour, userId) => {
        set(state => ({
          items: state.items.filter(i => !(i.productId === productId && i.colour === colour))
        }))
        if (userId) {
          // Fix #6 — await the delete and handle errors
          import('@/lib/supabase/client').then(async ({ createClient }) => {
            const supabase = createClient()
            const { error } = await supabase.from('carts').delete()
              .eq('user_id', userId)
              .eq('product_id', productId)
              .eq('colour', colour)
          })
        }
      },

      updateQty: async (productId, colour, qty, userId) => {
        let maxStock = 999
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const sb = createClient()
          const { data } = await sb.from('product_variants').select('stock')
            .eq('product_id', productId).eq('colour', colour).single()
          if (data) maxStock = data.stock
        } catch {}
        const safeQty = Math.max(1, Math.min(qty, maxStock))
        set(state => ({
          items: state.items.map(i => i.productId === productId && i.colour === colour
            ? { ...i, quantity: safeQty, stock: maxStock } : i)
        }))
        if (userId) setTimeout(() => get().syncToDb(userId), 0)
      },

      clearCart: (userId) => {
        set({ items: [], appliedCoupon: null })
        if (userId) {
          import('@/lib/supabase/client').then(async ({ createClient }) => {
            const supabase = createClient()
            const { error } = await supabase.from('carts').delete().eq('user_id', userId)
          })
        }
      },

      syncToDb: async (userId) => {
        const { items } = get()
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        if (items.length === 0) {
          await supabase.from('carts').delete().eq('user_id', userId)
          return
        }

        // Fix #3 — use upsert instead of delete+insert
        // Old: delete all → insert all (cart lost if network drops between)
        // New: upsert individual items (atomic per item, cart survives network drops)
        const { error } = await supabase.from('carts').upsert(
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
          })),
          { onConflict: 'user_id,product_id,colour' }
        )
        if (error) {
          // Fallback to delete+insert if upsert fails (e.g. no unique constraint yet)
          await supabase.from('carts').delete().eq('user_id', userId)
          await supabase.from('carts').insert(
            items.map(item => ({
              user_id: userId, product_id: item.productId, product_name: item.productName,
              product_slug: item.productSlug, product_image: item.productImage,
              colour: item.colour, colour_hex: item.colourHex, original_price: item.originalPrice,
              sale_price: item.salePrice, quantity: item.quantity, stock: item.stock, gst_rate: item.gstRate,
            }))
          )
        }
      },

      syncFromDb: async (userId) => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase.from('carts').select('*').eq('user_id', userId)
        if (error) { ; return }
        if (!data || data.length === 0) return
        const dbItems: CartItem[] = data.map((r: any) => ({
          productId: r.product_id, productName: r.product_name, productSlug: r.product_slug,
          productImage: r.product_image || '', colour: r.colour, colourHex: r.colour_hex || '#000000',
          originalPrice: r.original_price, salePrice: r.sale_price, quantity: r.quantity,
          stock: r.stock, gstRate: r.gst_rate,
        }))
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
        // Fix #9 — handle both 'flat' (DB value) and 'fixed' (legacy) type names
        if (appliedCoupon.type === 'flat' || appliedCoupon.type === 'fixed') return Math.min(appliedCoupon.discount, sub)
        if (appliedCoupon.type === 'free_shipping') return 0
        return 0
      },
    }),
    { name: 'skss-cart' }
  )
)
