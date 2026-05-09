import type { CartItem } from '@/types'

const CART_KEY = 'proxy-shop-cart'

function cartKey(item: Pick<CartItem, 'product_id' | 'size' | 'color'>) {
  return `${item.product_id}|${item.size ?? ''}|${item.color ?? ''}`
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(item: CartItem) {
  const cart = getCart()
  const key = cartKey(item)
  const existing = cart.find((c) => cartKey(c) === key)
  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.push(item)
  }
  saveCart(cart)
  return cart
}

export function updateCartItem(productId: string, quantity: number, size?: string, color?: string) {
  const cart = getCart()
  const key = `${productId}|${size ?? ''}|${color ?? ''}`
  const idx = cart.findIndex((c) => cartKey(c) === key)
  if (idx === -1) return cart
  if (quantity <= 0) {
    cart.splice(idx, 1)
  } else {
    cart[idx].quantity = quantity
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(productId: string, size?: string, color?: string) {
  const key = `${productId}|${size ?? ''}|${color ?? ''}`
  const cart = getCart().filter((c) => cartKey(c) !== key)
  saveCart(cart)
  return cart
}

export function clearCart() {
  saveCart([])
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}
