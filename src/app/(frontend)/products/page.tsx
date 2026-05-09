import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Product, Category } from '@/types'
import ProductsClient from './ProductsClient'

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country: initialCountry } = await searchParams
  const supabase = await createServerSupabaseClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, categories(*)')
      .eq('is_available', true)   // 下架商品不顯示，售完(stock=0)仍顯示
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order'),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">全部商品</h1>
      <ProductsClient
        products={(products as Product[]) ?? []}
        categories={(categories as Category[]) ?? []}
        initialCountry={initialCountry ?? null}
      />
    </div>
  )
}
