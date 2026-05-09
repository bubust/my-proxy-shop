import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Product } from '@/types'
import ProductDetailClient from './ProductDetailClient'

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createServerSupabaseClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('id', id)
    .eq('is_available', true)
    .single()

  if (!product) notFound()

  return <ProductDetailClient product={product as Product} />
}
