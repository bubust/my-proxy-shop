import { createServerSupabaseClient } from '@/lib/supabase-server'
import AdminCouponsClient from './AdminCouponsClient'

export default async function AdminCouponsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminCouponsClient initialCoupons={coupons ?? []} />
}
