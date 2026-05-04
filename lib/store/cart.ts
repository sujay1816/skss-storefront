import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, colour: string) => void
  updateQty: (productId: string, colour: string, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set(state => {
        const existing = state.items.find(i => i.productId === item.productId && i.colour === item.colour)
        if (existing) {
          return { items: state.items.map(i => i.productId === item.productId && i.colour === item.colour ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) } : i) }
        }
        return { items: [...state.items, item] }
      }),
      removeItem: (productId, colour) => set(state => ({ items: state.items.filter(i => !(i.productId === productId && i.colour === colour)) })),
      updateQty: (productId, colour, qty) => set(state => ({ items: state.items.map(i => i.productId === productId && i.colour === colour ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i) })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + (i.salePrice ?? i.originalPrice) * i.quantity, 0),
    }),
    { name: 'skss-cart' }
  )
)
