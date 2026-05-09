import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Order, OrderItem } from '@/types'
import { format } from 'date-fns'
import AdminOrderActions from './AdminOrderActions'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/OrderStatusBadge'

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createServerSupabaseClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), profiles(name, phone)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const o = order as Order & { order_items: OrderItem[]; profiles: { name: string; phone: string } }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600">← 訂單管理</Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">訂單詳細</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-[#1a1a1a] mb-3">訂單資訊</h2>
          <div className="space-y-1.5 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">編號：</span>{o.order_number}</p>
            <p><span className="font-medium text-gray-800">日期：</span>{format(new Date(o.created_at), 'yyyy/MM/dd HH:mm')}</p>
            <p className="flex items-center gap-2"><span className="font-medium text-gray-800">狀態：</span><OrderStatusBadge status={o.status} /></p>
            <p className="flex items-center gap-2"><span className="font-medium text-gray-800">付款：</span><PaymentStatusBadge status={o.payment_status} /></p>
            <p><span className="font-medium text-gray-800">金額：</span>NT$ {o.total.toLocaleString()}</p>
            {o.tracking_number && (
              <p><span className="font-medium text-gray-800">追蹤號：</span><span className="font-mono">{o.tracking_number}</span></p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-[#1a1a1a] mb-3">收件資訊</h2>
          <div className="space-y-1.5 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">收件人：</span>{o.recipient_name}</p>
            <p><span className="font-medium text-gray-800">電話：</span>{o.recipient_phone}</p>
            <p><span className="font-medium text-gray-800">地址：</span>{o.shipping_address}</p>
            {o.note && <p><span className="font-medium text-gray-800">備註：</span>{o.note}</p>}
            <p><span className="font-medium text-gray-800">會員：</span>{o.profiles?.name ?? '—'}</p>
          </div>
        </div>
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
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1a1a1a]">{item.product_name}</p>
                <p className="text-xs text-gray-500">NT$ {item.price.toLocaleString()} × {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">NT$ {item.subtotal.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-bold">
          <span>合計</span>
          <span className="text-[#e85d26]">NT$ {o.total.toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <AdminOrderActions order={o} />
    </div>
  )
}
