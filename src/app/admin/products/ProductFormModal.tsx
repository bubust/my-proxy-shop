'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { X, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Collection } from '@/types'
import Image from 'next/image'

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'F']
const COLOR_OPTIONS = ['黑色', '白色', '米白色', '粉紅色', '卡其色']

function CheckboxGroup({ label, options, selected, onChange }: {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}) {
  const [custom, setCustom] = useState('')

  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])

  const addCustom = () => {
    const val = custom.trim()
    if (!val || selected.includes(val)) { setCustom(''); return }
    onChange([...selected, val])
    setCustom('')
  }

  // custom items = selected that aren't in predefined options
  const customSelected = selected.filter(s => !options.includes(s))

  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const checked = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                checked
                  ? 'bg-[#e85d26] text-white border-[#e85d26]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d26]'
              }`}
            >
              {opt}
            </button>
          )
        })}
        {customSelected.map(opt => (
          <span key={opt} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#e85d26] text-white border border-[#e85d26]">
            {opt}
            <button type="button" onClick={() => toggle(opt)}><X size={11} /></button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            placeholder="自訂"
            className="w-16 border border-dashed border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#e85d26] placeholder:text-gray-300"
          />
          {custom.trim() && (
            <button type="button" onClick={addCustom} className="text-[#e85d26]"><Plus size={16} /></button>
          )}
        </div>
      </div>
    </div>
  )
}

const schema = z.object({
  name: z.string().min(1, '商品名稱必填'),
  description: z.string().optional(),
  price: z.string().min(1, '請輸入價格'),
  original_price: z.string().optional(),
  cost_price: z.string().optional(),
  country: z.string().optional(),
  category_id: z.string().optional(),
  stock: z.string().optional(),
  note: z.string().optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  tags: z.string().optional(),
  collection_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const COUNTRIES = ['日本', '韓國', '美國', '英國', '歐洲', '澳洲']

export default function ProductFormModal({
  product,
  categories,
  collections,
  defaultCollectionId,
  onClose,
}: {
  product: Product | null
  categories: Category[]
  collections: Collection[]
  defaultCollectionId?: number | null
  onClose: (saved?: Product) => void
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [colors, setColors] = useState<string[]>(product?.colors ?? [])
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const moveImage = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= images.length) return
    setImages((prev) => {
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      original_price: product.original_price != null ? String(product.original_price) : '',
      cost_price: product.cost_price != null ? String(product.cost_price) : '',
      country: product.country ?? '',
      category_id: product.category_id != null ? String(product.category_id) : '',
      stock: String(product.stock),
      note: product.note ?? '',
      is_available: product.is_available,
      is_featured: product.is_featured,
      tags: product.tags?.join(', ') ?? '',
      collection_id: product.collection_id != null ? String(product.collection_id) : '',
    } : { is_available: true as boolean, is_featured: false as boolean, stock: '-1', collection_id: defaultCollectionId != null ? String(defaultCollectionId) : '' },
  })

  const uploadImage = async (file: File, productId: string) => {
    const ext = file.name.split('.').pop()
    const fileName = `${productId}/${Date.now()}.${ext}`
    // Compress: only allow < 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('圖片需小於 2MB')
      return null
    }
    const { error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) { toast.error('上傳失敗：' + error.message); return null }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 10) { toast.error('最多上傳 10 張圖片'); return }
    setUploading(true)
    const pid = product?.id ?? `temp-${Date.now()}`
    for (const file of files) {
      const url = await uploadImage(file, pid)
      if (url) setImages((prev) => [...prev, url])
    }
    setUploading(false)
  }

  const removeImage = (url: string) => setImages((prev) => prev.filter((i) => i !== url))

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    const payload = {
      name: data.name,
      description: data.description || null,
      price: parseFloat(data.price),
      original_price: data.original_price ? parseFloat(data.original_price) : null,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      country: data.country || null,
      category_id: data.category_id ? parseInt(data.category_id) : null,
      stock: parseInt(data.stock ?? '-1'),
      note: data.note || null,
      is_available: data.is_available,
      is_featured: data.is_featured,
      tags,
      colors,
      sizes,
      images,
      collection_id: data.collection_id ? parseInt(data.collection_id) : null,
      updated_at: new Date().toISOString(),
    }

    let error, saved
    if (product) {
      ;({ error, data: saved } = await supabase.from('products').update(payload).eq('id', product.id).select('*, categories(*), collections(*)').single())
    } else {
      ;({ error, data: saved } = await supabase.from('products').insert(payload).select('*, categories(*), collections(*)').single())
    }

    setSaving(false)
    if (error) { toast.error('儲存失敗：' + error.message); return }
    toast.success(product ? '商品已更新' : '商品已新增')
    onClose(saved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-[#1a1a1a]">{product ? '編輯商品' : '新增商品'}</h2>
          <button onClick={() => onClose()} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Images */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">商品圖片（最多 10 張）</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((img, idx) => (
                <div key={img} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <Image src={img} alt="商品圖" fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(img)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center z-10">
                    <X size={10} />
                  </button>
                  {images.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="bg-black/50 text-white w-6 h-6 flex items-center justify-center disabled:opacity-0"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === images.length - 1}
                        className="bg-black/50 text-white w-6 h-6 flex items-center justify-center disabled:opacity-0"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <label className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#e85d26] transition-colors">
                  <Upload size={18} className="text-gray-400" />
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
            {uploading && <p className="text-xs text-gray-500">上傳中…</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">商品名稱 *</label>
            <input {...register('name')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">分類</label>
              <select {...register('category_id')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]">
                <option value="">選擇分類</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">來源國</label>
              <select {...register('country')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]">
                <option value="">選擇國家</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">代購價格 *</label>
              <input {...register('price')} type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
              {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">原價（選填）</label>
              <input {...register('original_price')} type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">庫存（-1=無限）</label>
              <input {...register('stock')} type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
            </div>
          </div>

          {/* 成本（僅管理員可見） */}
          {(() => {
            const price = parseFloat(watch('price') ?? '0') || 0
            const cost = parseFloat(watch('cost_price') ?? '0') || 0
            const profit = price > 0 && cost > 0 ? price - cost : null
            const margin = profit !== null && price > 0 ? Math.round((profit / price) * 100) : null
            return (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                <label className="text-xs font-medium text-amber-700">🔒 成本（僅管理員可見）</label>
                <input
                  {...register('cost_price')}
                  type="number"
                  placeholder="成本價格"
                  className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
                />
                {profit !== null && (
                  <p className="text-xs text-amber-700">
                    毛利：NT$ {profit.toLocaleString()}（毛利率 {margin}%）
                  </p>
                )}
              </div>
            )
          })()}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">商品描述</label>
            <textarea {...register('description')} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26] resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">標籤（逗號分隔）</label>
            <input {...register('tags')} placeholder="限量, 人氣, 新品" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
          </div>

          {collections.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">加入批次</label>
              <select {...register('collection_id')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]">
                <option value="">不加入批次</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <CheckboxGroup label="尺寸" options={SIZE_OPTIONS} selected={sizes} onChange={setSizes} />
          <CheckboxGroup label="顏色" options={COLOR_OPTIONS} selected={colors} onChange={setColors} />

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">備註（限購說明）</label>
            <input {...register('note')} placeholder="每人限購 1 件" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('is_available')} type="checkbox" className="w-4 h-4 accent-[#e85d26]" />
              <span className="text-sm font-medium text-gray-700">上架中</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('is_featured')} type="checkbox" className="w-4 h-4 accent-[#e85d26]" />
              <span className="text-sm font-medium text-gray-700">精選商品</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
          >
            {saving ? '儲存中…' : product ? '更新商品' : '新增商品'}
          </button>
        </form>
      </div>
    </div>
  )
}
