import { createServerSupabaseClient } from '@/lib/supabase-server'
import AdminReportsClient from './AdminReportsClient'

export default async function AdminReportsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  return <AdminReportsClient orders={orders ?? []} />
}
