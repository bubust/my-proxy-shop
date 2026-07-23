export interface Collection {
  id: number
  name: string
  description: string | null
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  emoji: string
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  currency: string
  country: string | null
  category_id: number | null
  images: string[]
  stock: number
  is_available: boolean
  is_featured: boolean
  tags: string[]
  colors: string[]
  sizes: string[]
  size_prices: Record<string, number> | null
  sort_order: number | null
  cost_price: number | null
  note: string | null
  collection_id: number | null
  created_at: string
  updated_at: string
  categories?: Category
  collections?: Collection
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'purchasing'
  | 'shipped'
  | 'arrived'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  price: number
  quantity: number
  subtotal: number
  size: string | null
  color: string | null
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: OrderStatus
  payment_status: PaymentStatus
  subtotal: number
  shipping_fee: number
  discount_amount: number
  coupon_code: string | null
  total: number
  currency: string
  recipient_name: string
  recipient_phone: string
  shipping_address: string
  note: string | null
  admin_note: string | null
  tracking_number: string | null
  paid_at: string | null
  shipped_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  profiles?: {
    name: string
    phone: string
  }
}

export interface Coupon {
  id: number
  code: string
  type: 'fixed' | 'percent'
  value: number
  min_amount: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  address: string | null
  role: 'admin' | 'member'
  admin_note: string | null
  created_at: string
}

export interface CartItem {
  product_id: string
  name: string
  price: number
  image: string | null
  quantity: number
  size?: string
  color?: string
}
