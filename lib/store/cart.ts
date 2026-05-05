import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  userId: string | null
  addItem: (item: CartItem) => Promise<void>
  removeItem: (productId: string, colour: string) => Promise<void>
  updateQty: (productId: string, colour: string, qty: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: () => number
  subtotal: () => number
  // Auth lifecycle
  onLogin: (userId: string) => Promise<void>
  onLogout: () => Promise<void>
}

// Save cart to Supabase
async function saveCartToDb(userId: string, items: CartItem[]) {
  const supabase = createClient()
  // Delete existing cart for user
  await supabase.from('carts').delete().eq('user_id', userId)
  if (items.length === 0) return
  // Insert all items
  await supabase.from('carts').insert(
    items.map(i => ({
      user_id: userId,
      product_id: i.productId,
      product_name: i.productName,
      product_slug: i.productSlug,
      product_image: i.productImage,
      colour: i.colour,
      colour_hex: i.colourHex,
      original_price: i.originalPrice,
      sale_price: i.salePrice,
      quantity: i.quantity,
      stock: i.stock,
      gst_rate: i.gstRate,
    }))
  )
}

// Load cart from Supabase
async function loadCartFromDb(userId: string): Promise<CartItem[]> {
  const supabase = createClient()
  const { data } = await supabase.from('carts').select('*').eq('user_id', userId)
  if (!data) return []
  return data.map((r: any) => ({
    productId: r.product_id,
    productName: r.product_name,
    productSlug: r.product_slug,
    productImage: r.product_image || '',
    colour: r.colour,
    colourHex: r.colour_hex || '#000000',
    originalPrice: Number(r.original_price),
    salePrice: r.sale_price ? Number(r.sale_price) : null,
    quantity: r.quantity,
    stock: r.stock,
    gstRate: r.gst_rate,
  }))
}

// Merge two carts — guest items added to saved cart, quantities combined up to stock limit
function mergeCarts(savedItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const merged = [...savedItems]
  for (const guestItem of guestItems) {
    const existing = merged.find(i => i.productId === guestItem.productId && i.colour === guestItem.colour)
    if (existing) {
      // Combine quantities up to stock limit
      existing.quantity = Math.min(existing.quantity + guestItem.quantity, existing.stock)
    } else {
      merged.push(guestItem)
    }
  }
  return merged
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,

      addItem: async (item) => {
        set(state => {
          const existing = state.items.find(i => i.productId === item.productId && i.colour === item.colour)
          const newItems = existing
            ? state.items.map(i => i.productId === item.productId && i.colour === item.colour
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i)
            : [...state.items, item]
          // Save to DB if logged in
          if (state.userId) saveCartToDb(state.userId, newItems)
          return { items: newItems }
        })
      },

      removeItem: async (productId, colour) => {
        set(state => {
          const newItems = state.items.filter(i => !(i.productId === productId && i.colour === colour))
          if (state.userId) saveCartToDb(state.userId, newItems)
          return { items: newItems }
        })
      },

      updateQty: async (productId, colour, qty) => {
        set(state => {
          const newItems = state.items.map(i =>
            i.productId === productId && i.colour === colour
              ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i)
          if (state.userId) saveCartToDb(state.userId, newItems)
          return { items: newItems }
        })
      },

      clearCart: async () => {
        const { userId } = get()
        if (userId) await saveCartToDb(userId, [])
        set({ items: [] })
      },

      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + (i.salePrice ?? i.originalPrice) * i.quantity, 0),

      // Called after successful login
      onLogin: async (userId: string) => {
        const guestItems = get().items // items added before login
        const savedItems = await loadCartFromDb(userId) // items saved from previous sessions
        const mergedItems = mergeCarts(savedItems, guestItems)
        // Save merged cart to DB
        await saveCartToDb(userId, mergedItems)
        set({ items: mergedItems, userId })
      },

      // Called on logout
      onLogout: async () => {
        // Cart already saved to DB, just clear local state
        set({ items: [], userId: null })
      },
    }),
    {
      name: 'skss-cart',
      // Only persist items and userId to localStorage as backup
      partialize: (state) => ({ items: state.items, userId: state.userId }),
    }
  )
)
