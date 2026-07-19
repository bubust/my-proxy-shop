'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, Tag, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getCart, updateCartItem, removeFromCart, clearCart } from '@/lib/cart'
import type { CartItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const SHIPPING_FEE = 60
const FREE_SHIPPING_THRESHOLD = 5500

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
  const [couponCode, setCouponCode] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponChecking, setCouponChecking] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    setItems(getCart())
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
  const remove = (item: CartItem) => {
    refresh(removeFromCart(item.product_id, item.size, item.color))
    // Clear coupon if cart becomes empty
    setCouponCode(''); setDiscountAmount(0); setCouponInput('')
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + shippingFee - discountAmount

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponChecking(true)
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponInput.trim())}&amount=${subtotal}`)
      const data = await res.json()
      if (!res.ok || !data.valid) {
        toast.error(data.error || '優惠券無效')
        return
      }
      setCouponCode(couponInput.trim().toUpperCase())
      setDiscountAmount(data.discount)
      toast.success(`折扣 NT$ ${data.discount} 已套用！`)
    } catch {
      toast.error('驗證失敗，請稍後再試')
    } finally {
      setCouponChecking(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode(''); setDiscountAmount(0); setCouponInput('')
    toast.success('已移除優惠券')
  }

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
          shipping_fee: shippingFee,
          discount_amount: discountAmount,
          coupon_code: couponCode || null,
          total: Math.max(0, total),
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

      // Increment coupon usage if coupon applied
      if (couponCode) {
        await fetch(`/api/coupons/use`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode }) })
      }

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
          {/* Order summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h2 className="font-semibold text-[#1a1a1a] mb-3">訂單摘要</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>小計（{items.reduce((s, i) => s + i.quantity, 0)} 件）</span>
              <span>NT$ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">運費</span>
              {shippingFee === 0 ? (
                <span className="text-green-600 font-medium">免運費</span>
              ) : (
                <span className="text-gray-700">NT$ {shippingFee}</span>
              )}
            </div>
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <p className="text-xs text-blue-500 mb-1">
                再消費 NT$ {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} 即可免運！
              </p>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 mb-1">
                <span>優惠折扣（{couponCode}）</span>
                <span>- NT$ {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-[#1a1a1a]">
              <span>總計</span>
              <span className="text-[#e85d26]">NT$ {Math.max(0, total).toLocaleString()}</span>
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h2 className="font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
              <Tag size={15} /> 優惠券
            </h2>
            {couponCode ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle size={14} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-mono font-semibold flex-1">{couponCode}</span>
                <span className="text-sm text-green-700">-NT$ {discountAmount}</span>
                <button onClick={removeCoupon} className="text-xs text-red-400 hover:text-red-600 ml-1">移除</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="輸入優惠碼"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26] uppercase"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponChecking || !couponInput.trim()}
                  className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {couponChecking ? '…' : '套用'}
                </button>
              </div>
            )}
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

            <p className="text-xs text-gray-400">訂單送出後，我們將與您確認代購細節。</p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '送出中…' : `確認下單 NT$ ${Math.max(0, total).toLocaleString()}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
