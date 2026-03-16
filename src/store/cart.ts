import { create } from 'zustand'

export type CartItemAddon = { id: string; name: string; price: number }
export type CartItemVariant = { id: string; name: string; price_modifier: number }

export type CartItem = {
  cartItemId: string // Unique ID for the cart line item (uuid)
  productId: string
  name: string
  basePrice: number
  qty: number
  variant?: CartItemVariant | null
  addons: CartItemAddon[]
  note?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (cartItemId: string) => void
  updateQty: (cartItemId: string, qty: number) => void
  updateNote: (cartItemId: string, note: string) => void
  clearCart: () => void
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    // Note: We could check if identical item exists, but because of notes/variants, 
    // it's often safer in POS to just add a new line or let user adjust qty manually.
    // For simplicity, we just add it to the list.
    return { items: [...state.items, item] }
  }),
  removeItem: (cartItemId) => set((state) => ({
    items: state.items.filter(item => item.cartItemId !== cartItemId)
  })),
  updateQty: (cartItemId, qty) => set((state) => ({
    items: state.items.map(item => 
      item.cartItemId === cartItemId ? { ...item, qty: Math.max(1, qty) } : item
    )
  })),
  updateNote: (cartItemId, note) => set((state) => ({
    items: state.items.map(item => 
      item.cartItemId === cartItemId ? { ...item, note } : item
    )
  })),
  clearCart: () => set({ items: [] }),
  getSubtotal: () => {
    return get().items.reduce((total, item) => {
      const variantAdd = item.variant?.price_modifier || 0
      const addonsAdd = item.addons.reduce((sum, addon) => sum + addon.price, 0)
      const itemPrice = item.basePrice + variantAdd + addonsAdd
      return total + (itemPrice * item.qty)
    }, 0)
  }
}))
