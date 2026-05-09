'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types'

const COUNTRY_FLAG: Record<string, string> = {
  日本: '🇯🇵',
  韓國: '🇰🇷',
  美國: '🇺🇸',
  英國: '🇬🇧',
  歐洲: '🇪🇺',
  澳洲: '🇦🇺',
}

export default function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images?.[0] ?? null
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null
  const outOfStock = product.stock === 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (outOfStock) return
    addToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: mainImage,
      quantity: 1,
    })
    window.dispatchEvent(new Event('cart-updated'))
    toast.success('已加入購物車')
  }

  return (
    <Link href={`/products/${product.id}`} className={`group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow ${outOfStock ? 'opacity-60' : ''}`}>
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">📦</div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 bg-[#e85d26] text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">已售完</span>
          </div>
        )}
        {product.country && (
          <span className="absolute top-2 right-2 text-lg">{COUNTRY_FLAG[product.country] ?? '🌏'}</span>
        )}
      </div>

      <div className="p-2.5">
        <p className="text-sm font-medium text-[#1a1a1a] line-clamp-2 mb-1.5 leading-snug">{product.name}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[#e85d26] font-bold text-sm">NT$ {product.price.toLocaleString()}</p>
            {product.original_price && (
              <p className="text-gray-400 text-xs line-through">NT$ {product.original_price.toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="bg-[#1a1a1a] text-white p-1.5 rounded-lg hover:bg-[#e85d26] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}
