import { createClient } from '@supabase/supabase-js'
import type { Product, Category, Collection } from '@/types'
import AdminProductsClient from './AdminProductsClient'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function AdminProductsPage() {
  const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
    adminClient.from('products').select('*, categories(*), collections(*)').order('created_at', { ascending: false }),
    adminClient.from('categories').select('*').order('sort_order'),
    adminClient.from('collections').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <AdminProductsClient
      products={(products as Product[]) ?? []}
      categories={(categories as Category[]) ?? []}
      collections={(collections as Collection[]) ?? []}
    />
  )
}
