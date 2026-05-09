import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Order } from '@/types'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/OrderStatusBadge'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default async function MemberOrdersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member" className="text-gray-400 hover:text-gray-600">← 會員中心</Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">我的訂單</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-500">還沒有訂單記錄</p>
          <Link href="/products" className="mt-4 inline-block text-[#e85d26] font-medium hover:underline">去選購商品 →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(orders as Order[]).map((order) => (
            <Link
              key={order.id}
              href={`/member/orders/${order.id}`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-[#e85d26]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-sm">{order.order_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(order.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">收件：{order.recipient_name}</p>
                <p className="font-bold text-[#e85d26]">NT$ {order.total.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
