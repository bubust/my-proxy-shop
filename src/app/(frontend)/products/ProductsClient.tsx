'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Product, Category } from '@/types'
import ProductCard from '@/components/ProductCard'

export default function ProductsClient({
  products,
  categories,
  initialCountry,
}: {
  products: Product[]
  categories: Category[]
  initialCountry: string | null
}) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry)
  const [search, setSearch] = useState('')

  const countries = Array.from(new Set(products.map(p => p.country).filter(Boolean))) as string[]

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === null || p.category_id === selectedCategory
    const matchCountry = selectedCountry === null || p.country === selectedCountry
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchCountry && matchSearch
  })

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜尋商品名稱…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#e85d26] bg-white"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Country filters */}
      {countries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {selectedCountry && (
            <button
              onClick={() => setSelectedCountry(null)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#e85d26]/10 text-[#e85d26] hover:bg-[#e85d26]/20 transition-colors"
            >
              <X size={11} /> 清除國家篩選
            </button>
          )}
          {countries.map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedCountry === country
                  ? 'bg-[#e85d26] text-white border-[#e85d26]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d26]'
              }`}
            >
              {country}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-base">找不到符合的商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  )
}
