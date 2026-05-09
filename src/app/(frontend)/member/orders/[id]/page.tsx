import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Order, OrderItem } from '@/types'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/OrderStatusBadge'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

const STEPS = [
  { key: 'pending',    label: '待確認' },
  { key: 'confirmed',  label: '已確認' },
  { key: 'purchasing', label: '代購中' },
  { key: 'shipped',    label: '已出貨' },
  { key: 'arrived',    label: '已到台' },
  { key: 'completed',  label: '已完成' },
]

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const o = order as Order & { order_items: OrderItem[] }
  const cancelled = o.status === 'cancelled'
  const stepIndex = cancelled ? -1 : STEPS.findIndex((s) => s.key === o.status)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member/orders" className="text-gray-400 hover:text-gray-600">← 我的訂單</Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">訂單詳細</h1>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-[#1a1a1a]">{o.order_number}</p>
            <p className="text-xs text-gray-400">{format(new Date(o.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <OrderStatusBadge status={o.status} />
            <PaymentStatusBadge status={o.payment_status} />
          </div>
        </div>

        {/* Progress bar */}
        {!cancelled && (
          <div className="relative">
            <div className="flex justify-between mb-2">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${i <= stepIndex ? 'bg-[#e85d26] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${i <= stepIndex ? 'text-[#e85d26] font-semibold' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-gray-100 -z-10">
              <div
                className="h-full bg-[#e85d26] transition-all"
                style={{ width: stepIndex >= 0 ? `${(stepIndex / (STEPS.length - 1)) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
        {cancelled && (
          <div className="text-center py-2 text-red-500 font-semibold">此訂單已取消</div>
        )}

        {o.tracking_number && (
          <div className="mt-3 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            🚚 追蹤號碼：<span className="font-mono font-bold">{o.tracking_number}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-3">商品明細</h2>
        <div className="space-y-3">
          {o.order_items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {item.product_image ? (
                  <Image src={item.product_image} alt={item.product_name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] line-clamp-1">{item.product_name}</p>
                <p className="text-xs text-gray-500">NT$ {item.price.toLocaleString()} × {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-[#1a1a1a]">NT$ {item.subtotal.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between font-bold">
          <span>合計</span>
          <span className="text-[#e85d26]">NT$ {o.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Shipping info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-3">收件資訊</h2>
        <div className="space-y-1.5 text-sm text-gray-600">
          <p>收件人：{o.recipient_name}</p>
          <p>電話：{o.recipient_phone}</p>
          <p>地址：{o.shipping_address}</p>
          {o.note && <p>備註：{o.note}</p>}
        </div>
      </div>
    </div>
  )
}
