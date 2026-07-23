'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/types'

const COUNTRY_FLAG: Record<string, string> = {
  日本: '🇯🇵', 韓國: '🇰🇷', 美國: '🇺🇸', 英國: '🇬🇧', 歐洲: '🇪🇺', 澳洲: '🇦🇺',
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  const images = product.images?.length > 0 ? product.images : [null]
  const displayPrice = (selectedSize && product.size_prices?.[selectedSize]) || product.price
  const discount = product.original_price && product.original_price > displayPrice
    ? Math.round((1 - displayPrice / product.original_price) * 100)
    : null
  const outOfStock = product.stock === 0

  const needsSize = (product.sizes?.length ?? 0) > 0
  const needsColor = (product.colors?.length ?? 0) > 0
  const missingSize = needsSize && !selectedSize
  const missingColor = needsColor && !selectedColor
  const canAdd = !outOfStock && !missingSize && !missingColor

  const handleAdd = () => {
    if (outOfStock) return
    if (missingSize && missingColor) { toast.error('請選擇尺寸與顏色'); return }
    if (missingSize) { toast.error('請先選擇尺寸'); return }
    if (missingColor) { toast.error('請先選擇顏色'); return }
    addToCart({
      product_id: product.id,
      name: product.name,
      price: displayPrice,
      image: images[0],
      quantity: qty,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
    })
    window.dispatchEvent(new Event('cart-updated'))
    const spec = [selectedSize, selectedColor].filter(Boolean).join('・')
    toast.success(`已加入 ${qty} 件到購物車${spec ? `（${spec}）` : ''}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="md:grid md:grid-cols-2 md:gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {images[activeImg] ? (
              <Image src={images[activeImg]!} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">📦</div>
            )}
            {discount && (
              <span className="absolute top-3 left-3 bg-[#e85d26] text-white text-sm font-bold px-2 py-1 rounded-lg">
                -{discount}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-[#e85d26]' : 'border-transparent'}`}
                >
                  {img ? (
                    <Image src={img} alt={`圖片${i + 1}`} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-5 md:mt-0">
          {product.categories && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {(product.categories as { emoji?: string; name: string }).emoji} {(product.categories as { name: string }).name}
            </span>
          )}
          {product.country && (
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {COUNTRY_FLAG[product.country] ?? '🌏'} {product.country}
            </span>
          )}

          <h1 className="text-xl md:text-2xl font-bold text-[#1a1a1a] mt-3 mb-2 leading-snug">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-[#e85d26]">NT$ {displayPrice.toLocaleString()}</span>
            {product.original_price && (
              <span className="text-base text-gray-400 line-through">NT$ {product.original_price.toLocaleString()}</span>
            )}
          </div>

          <div className={`text-sm font-medium mb-4 ${outOfStock ? 'text-red-500' : product.stock === -1 ? 'text-green-600' : product.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
            {outOfStock ? '已售完' : product.stock === -1 ? '現貨充足' : `剩餘 ${product.stock} 件`}
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{product.description}</p>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mb-4">
              <p className={`text-sm font-medium mb-2 flex items-center gap-1.5 ${missingSize ? 'text-red-500' : 'text-gray-700'}`}>
                尺寸 {missingSize && <span className="text-xs font-normal">（必選）</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSize === s
                        ? 'bg-[#e85d26] text-white border-[#e85d26]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d26]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="mb-4">
              <p className={`text-sm font-medium mb-2 flex items-center gap-1.5 ${missingColor ? 'text-red-500' : 'text-gray-700'}`}>
                顏色 {missingColor && <span className="text-xs font-normal">（必選）</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedColor === c
                        ? 'bg-[#e85d26] text-white border-[#e85d26]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d26]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.note && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 text-sm text-orange-700">
              ⚠️ {product.note}
            </div>
          )}

          {/* Qty selector */}
          {!outOfStock && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm font-medium text-gray-700">數量</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(product.stock === -1 ? qty + 1 : Math.min(product.stock, qty + 1))}
                  className="px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky add to cart (mobile) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100 md:relative md:border-0 md:px-0 md:py-0 md:mt-2">
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            !outOfStock && !canAdd
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#e85d26] text-white hover:bg-[#f47848]'
          }`}
        >
          <ShoppingCart size={18} />
          {outOfStock ? '商品已售完'
            : missingSize && missingColor ? '請選擇尺寸與顏色'
            : missingSize ? '請選擇尺寸'
            : missingColor ? '請選擇顏色'
            : '加入購物車'}
        </button>
      </div>

      {/* Proxy notes */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-semibold text-gray-800 mb-2">代購注意事項</p>
        <p>• 代購商品依當地售價加上代購服務費計算</p>
        <p>• 下單後我們將盡速確認商品，並通知詳細費用（含運費）</p>
        <p>• 國際運送時間依目的地不同，通常需 7–21 個工作天</p>
        <p>• 如商品缺貨或停售，我們將主動告知並全額退款</p>
      </div>
    </div>
  )
}
