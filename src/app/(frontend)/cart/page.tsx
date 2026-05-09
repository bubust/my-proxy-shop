'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getCart, updateCartItem, removeFromCart, clearCart } from '@/lib/cart'
import type { CartItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const schema = z.object({
  recipient_name: z.string().min(2, '請輸入收件人姓名'),
  recipient_phone: z.string().min(8, '請輸入有效電話號碼'),
  shipping_address: z.string().min(5, '請輸入收件地址'),
  note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    setItems(getCart())
    // 自動帶入會員資料
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('name, phone, address').eq('id', user.id).single()
      if (!profile) return
      reset({
        recipient_name: profile.name ?? '',
        recipient_phone: profile.phone ?? '',
        shipping_address: profile.address ?? '',
      })
    })
  }, [reset])

  const refresh = (newItems: CartItem[]) => {
    setItems(newItems)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const updateQty = (item: CartItem, qty: number) => refresh(updateCartItem(item.product_id, qty, item.size, item.color))
  const remove = (item: CartItem) => refresh(removeFromCart(item.product_id, item.size, item.color))

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('請先登入再下單')
      router.push('/login?redirect=/cart')
      return
    }
    if (items.length === 0) {
      toast.error('購物車是空的')
      return
    }

    setSubmitting(true)
    try {
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          subtotal,
          total: subtotal,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          shipping_address: data.shipping_address,
          note: data.note || null,
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        product_image: item.image,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        size: item.size ?? null,
        color: item.color ?? null,
      }))

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
      if (itemsErr) throw itemsErr

      clearCart()
      window.dispatchEvent(new Event('cart-updated'))
      toast.success('訂單已送出！')
      router.push(`/member/orders/${order.id}`)
    } catch {
      toast.error('訂單送出失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-xl font-semibold text-gray-700 mb-2">購物車是空的</p>
        <p className="text-gray-500 mb-6">快去挑選喜歡的商品吧！</p>
        <Link href="/products" className="bg-[#e85d26] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors inline-flex items-center gap-2">
          <ShoppingBag size={18} /> 去逛逛
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">購物車</h1>
      <div className="md:grid md:grid-cols-5 md:gap-8">
        {/* Items list */}
        <div className="md:col-span-3 space-y-3 mb-6 md:mb-0">
          {items.map((item) => (
            <div key={`${item.product_id}|${item.size ?? ''}|${item.color ?? ''}`} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] line-clamp-2 leading-snug">{item.name}</p>
                {(item.size || item.color) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[item.size, item.color].filter(Boolean).join('・')}
                  </p>
                )}
                <p className="text-sm text-[#e85d26] font-semibold mt-0.5">NT$ {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(item, item.quantity - 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Minus size={12} />
                </button>
                <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item, item.quantity + 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Plus size={12} />
                </button>
                <button onClick={() => remove(item)} className="w-7 h-7 rounded-lg border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-50 ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">訂單摘要</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>小計（{items.length} 件商品）</span>
              <span>NT$ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>運費</span>
              <span>確認後通知</span>
            </div>
            <div className="flex justify-between font-bold text-[#1a1a1a]">
              <span>預估金額</span>
              <span className="text-[#e85d26]">NT$ {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <h2 className="font-semibold text-[#1a1a1a]">收件資訊</h2>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">收件人姓名 *</label>
              <input {...register('recipient_name')} placeholder="王小明" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26]" />
              {errors.recipient_name && <p className="text-xs text-red-500 mt-0.5">{errors.recipient_name.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">聯絡電話 *</label>
              <input {...register('recipient_phone')} placeholder="0912-345-678" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26]" />
              {errors.recipient_phone && <p className="text-xs text-red-500 mt-0.5">{errors.recipient_phone.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">收件地址 *</label>
              <textarea {...register('shipping_address')} placeholder="台北市信義區..." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26] resize-none" />
              {errors.shipping_address && <p className="text-xs text-red-500 mt-0.5">{errors.shipping_address.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">備註（選填）</label>
              <textarea {...register('note')} placeholder="特殊要求..." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26] resize-none" />
            </div>

            <p className="text-xs text-gray-400">訂單送出後，我們將與您確認代購細節與總費用。</p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '送出中…' : '確認下單'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
