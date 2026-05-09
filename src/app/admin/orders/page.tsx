import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Order } from '@/types'
import AdminOrdersClient from './AdminOrdersClient'

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(name, phone), order_items(*)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">訂單管理</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <AdminOrdersClient initialOrders={(orders as Order[]) ?? []} />
      </div>
    </div>
  )
}
