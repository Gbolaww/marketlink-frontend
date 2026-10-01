import { useSyncExternalStore } from 'react'

export interface CartItem {
  product_id: string
  name: string
  price_minor: number
  currency: string
  image_url: string | null
  quantity: number
}

export interface Cart {
  vendorId: string | null
  vendorName: string | null
  items: CartItem[]
}

const KEY = 'ml_cart'
const EMPTY: Cart = { vendorId: null, vendorName: null, items: [] }

let cached: Cart = read()
const listeners = new Set<() => void>()

function read(): Cart {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return parsed && Array.isArray(parsed.items) ? parsed : EMPTY
  } catch {
    return EMPTY
  }
}

function write(next: Cart) {
  cached = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode: the cart just lasts for this page view */
  }
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  // Keep tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cached = read()
      listeners.forEach((l) => l())
    }
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useCart = (): Cart => useSyncExternalStore(subscribe, () => cached)

export const cartCount = (c: Cart) => c.items.reduce((n, i) => n + i.quantity, 0)
export const cartTotal = (c: Cart) => c.items.reduce((n, i) => n + i.quantity * i.price_minor, 0)

/** An order can only contain one vendor's products, so adding from another vendor needs a decision. */
export const wouldMixVendors = (vendorId: string | undefined) =>
  !!vendorId && !!cached.vendorId && cached.vendorId !== vendorId && cached.items.length > 0

export function addToCart(
  item: Omit<CartItem, 'quantity'>,
  vendor: { id?: string; name?: string },
  quantity = 1,
  replace = false,
) {
  const base = replace || !cached.items.length ? EMPTY : cached
  const existing = base.items.find((i) => i.product_id === item.product_id)
  const items = existing
    ? base.items.map((i) => (i.product_id === item.product_id ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i))
    : [...base.items, { ...item, quantity }]
  write({ vendorId: vendor.id ?? base.vendorId, vendorName: vendor.name ?? base.vendorName, items })
}

export function setQuantity(productId: string, quantity: number) {
  const items = cached.items.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(99, quantity)) } : i))
  write({ ...cached, items })
}

export function removeFromCart(productId: string) {
  const items = cached.items.filter((i) => i.product_id !== productId)
  write(items.length ? { ...cached, items } : EMPTY)
}

export const clearCart = () => write(EMPTY)
