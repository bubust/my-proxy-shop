import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import AdminDashboardCharts from './AdminDashboardCharts'
import type { Order } from '@/types'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { format } from 'date-fns'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: monthOrders },
    { data: monthOrdersData },
    { count: totalMembers },
    { count: activeProducts },
    { data: recentOrders },
    { data: allOrders30 },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('orders').select('total').gte('created_at', startOfMonth),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_available', true),
    supabase.from('orders').select('*, profiles(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('created_at, status').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const monthRevenue = monthOrdersData?.reduce((s, o) => s + Number(o.total), 0) ?? 0

  const KPIs = [
    { label: '本月訂單', value: monthOrders ?? 0, unit: '筆', icon: '📋' },
    { label: '本月營業額', value: `NT$ ${(monthRevenue).toLocaleString()}`, unit: '', icon: '💰' },
    { label: '總會員數', value: totalMembers ?? 0, unit: '人', icon: '👥' },
    { label: '上架商品', value: activeProducts ?? 0, unit: '件', icon: '📦' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">儀表板</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIs.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-xl md:text-2xl font-bold text-[#1a1a1a]">{kpi.value}{kpi.unit}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminDashboardCharts orders={allOrders30 ?? []} />

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#1a1a1a]">最新訂單</h2>
          <Link href="/admin/orders" className="text-xs text-[#e85d26] hover:underline">查看全部 →</Link>
        </div>
        <div className="space-y-3">
          {recentOrders?.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">{order.order_number}</p>
                <p className="text-xs text-gray-400">
                  {(order.profiles as { name?: string })?.name ?? '—'} ·{' '}
                  {format(new Date(order.created_at), 'MM/dd HH:mm')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <p className="text-sm font-semibold text-[#1a1a1a]">NT$ {Number(order.total).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
