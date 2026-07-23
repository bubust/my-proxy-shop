'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, FolderOpen, FolderPlus, UploadCloud, PowerOff, X, Copy, MoveRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Collection } from '@/types'
import ProductFormModal from './ProductFormModal'
import { useRouter } from 'next/navigation'

function NewCollectionModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Collection) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('collections').insert({ name: name.trim(), description: description.trim() || null }).select().single()
    setSaving(false)
    if (error) { toast.error('建立失敗：' + error.message); return }
    toast.success('批次已建立')
    onCreate(data as Collection)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1a1a1a]">新增批次</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">批次名稱 *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：2025夏季特賣"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">備註（選填）</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="這批的說明…"
            />
          </div>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
          >
            {saving ? '建立中…' : '建立批次'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 移動到批次的彈窗
function MoveToCollectionModal({
  count,
  collections,
  onClose,
  onMove,
}: {
  count: number
  collections: Collection[]
  onClose: () => void
  onMove: (collectionId: number | null) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1a1a1a]">移動 {count} 件商品到批次</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-3 space-y-1">
          <button
            onClick={() => onMove(null)}
            className="w-full text-left px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            移出批次（不屬於任何批次）
          </button>
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => onMove(col.id)}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[#1a1a1a] hover:bg-orange-50 hover:text-[#e85d26] transition-colors flex items-center gap-2"
            >
              <FolderOpen size={15} className="text-[#e85d26]" />
              {col.name}
            </button>
          ))}
          {collections.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-4">尚無批次，請先新增批次</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminProductsClient({
  products: initialProducts,
  categories,
  collections: initialCollections,
}: {
  products: Product[]
  categories: Category[]
  collections: Collection[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [collections, setCollections] = useState(initialCollections)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [activeCollection, setActiveCollection] = useState<number | null>(null)
  const [newCollectionOpen, setNewCollectionOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()

  const refresh = () => router.refresh()

  const visibleProducts = activeCollection === null
    ? products.filter(p => p.collection_id === null)
    : products.filter(p => p.collection_id === activeCollection)

  // ── 單筆操作 ──────────────────────────────────
  const toggleAvailable = async (product: Product) => {
    const { error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id)
    if (error) { toast.error('更新失敗'); return }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p))
    toast.success(!product.is_available ? '已上架' : '已下架')
  }

  const toggleFeatured = async (product: Product) => {
    const { error } = await supabase.from('products').update({ is_featured: !product.is_featured }).eq('id', product.id)
    if (error) { toast.error('更新失敗'); return }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p))
    toast.success(!product.is_featured ? '已設為精選' : '已取消精選')
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`確定要刪除「${product.name}」嗎？`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) { toast.error('刪除失敗'); return }
    setProducts(prev => prev.filter(p => p.id !== product.id))
    setSelected(prev => { const s = new Set(prev); s.delete(product.id); return s })
    toast.success('已刪除')
  }

  // ── 全部下架 ──────────────────────────────────
  const takeAllOffline = async () => {
    if (!confirm('確定要將所有商品全部下架嗎？')) return
    const { error } = await supabase.from('products').update({ is_available: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { toast.error('操作失敗：' + error.message); return }
    setProducts(prev => prev.map(p => ({ ...p, is_available: false })))
    toast.success('已全部下架')
  }

  // ── 批次操作 ──────────────────────────────────
  const activateCollection = async (col: Collection) => {
    if (!confirm(`確定要將批次「${col.name}」所有商品上架嗎？`)) return
    const { error } = await supabase.from('products').update({ is_available: true }).eq('collection_id', col.id)
    if (error) { toast.error('操作失敗：' + error.message); return }
    setProducts(prev => prev.map(p => p.collection_id === col.id ? { ...p, is_available: true } : p))
    toast.success(`批次「${col.name}」已上架`)
  }

  const deleteCollection = async (col: Collection) => {
    const count = products.filter(p => p.collection_id === col.id).length
    if (!confirm(`確定刪除批次「${col.name}」？${count > 0 ? `\n（${count} 件商品將移出批次，但商品不會被刪除）` : ''}`)) return
    const { error } = await supabase.from('collections').delete().eq('id', col.id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setCollections(prev => prev.filter(c => c.id !== col.id))
    setProducts(prev => prev.map(p => p.collection_id === col.id ? { ...p, collection_id: null } : p))
    if (activeCollection === col.id) setActiveCollection(null)
    toast.success('批次已刪除')
  }

  // ── checkbox 選取 ─────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === visibleProducts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visibleProducts.map(p => p.id)))
    }
  }

  const clearSelected = () => setSelected(new Set())

  // ── 批量刪除 ──────────────────────────────────
  const bulkDelete = async () => {
    if (!confirm(`確定要刪除選取的 ${selected.size} 件商品嗎？此操作無法復原。`)) return
    setBulkLoading(true)
    const ids = Array.from(selected)
    const { error } = await supabase.from('products').delete().in('id', ids)
    setBulkLoading(false)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setProducts(prev => prev.filter(p => !ids.includes(p.id)))
    setSelected(new Set())
    toast.success(`已刪除 ${ids.length} 件商品`)
  }

  // ── 批量複製 ──────────────────────────────────
  const bulkDuplicate = async () => {
    if (!confirm(`確定要複製選取的 ${selected.size} 件商品嗎？`)) return
    setBulkLoading(true)
    const ids = Array.from(selected)
    const targets = products.filter(p => ids.includes(p.id))
    const copies = targets.map(({ id, created_at, updated_at, ...rest }) => ({
      ...rest,
      name: rest.name + '（複製）',
      is_available: false,
    }))
    const { data, error } = await supabase.from('products').insert(copies).select('*, categories(*), collections(*)')
    setBulkLoading(false)
    if (error) { toast.error('複製失敗：' + error.message); return }
    setProducts(prev => [...(data as Product[]), ...prev])
    setSelected(new Set())
    toast.success(`已複製 ${ids.length} 件商品（下架狀態）`)
  }

  // ── 批量移動到批次 ────────────────────────────
  const bulkMove = async (collectionId: number | null) => {
    setBulkLoading(true)
    const ids = Array.from(selected)
    const { error } = await supabase.from('products').update({ collection_id: collectionId }).in('id', ids)
    setBulkLoading(false)
    setMoveModalOpen(false)
    if (error) { toast.error('移動失敗：' + error.message); return }
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, collection_id: collectionId } : p))
    setSelected(new Set())
    const colName = collectionId ? collections.find(c => c.id === collectionId)?.name : null
    toast.success(colName ? `已移動到「${colName}」` : '已移出批次')
  }

  const openAdd = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setEditTarget(p); setModalOpen(true) }

  const allVisibleSelected = visibleProducts.length > 0 && selected.size === visibleProducts.length
  const someSelected = selected.size > 0

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">商品管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={takeAllOffline}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <PowerOff size={14} /> 全部下架
          </button>
          <button
            onClick={() => setNewCollectionOpen(true)}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FolderPlus size={14} /> 新增批次
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#e85d26] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#f47848] transition-colors"
          >
            <Plus size={16} /> 新增商品
          </button>
        </div>
      </div>

      {/* 批次 Tabs */}
      {collections.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCollection(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              activeCollection === null
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            未分批（{products.filter(p => p.collection_id === null).length}）
          </button>
          {collections.map(col => {
            const count = products.filter(p => p.collection_id === col.id).length
            const active = activeCollection === col.id
            return (
              <div key={col.id} className={`flex items-center rounded-xl border transition-colors ${active ? 'border-[#e85d26]' : 'border-gray-200'}`}>
                <button
                  onClick={() => setActiveCollection(active ? null : col.id)}
                  className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-sm font-medium ${active ? 'text-[#e85d26]' : 'text-gray-600'}`}
                >
                  <FolderOpen size={14} />{col.name}（{count}）
                </button>
                <button onClick={() => activateCollection(col)} title="一鍵上架此批次" className="px-2 py-1.5 text-green-500 hover:bg-green-50 transition-colors border-l border-gray-200">
                  <UploadCloud size={14} />
                </button>
                <button onClick={() => deleteCollection(col)} title="刪除批次" className="px-2 py-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-r-xl transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 選取操作列 */}
      {someSelected && (
        <div className="mb-3 flex items-center gap-3 bg-[#1a1a1a] text-white px-4 py-2.5 rounded-xl">
          <span className="text-sm font-semibold">已選取 {selected.size} 件</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setMoveModalOpen(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <MoveRight size={14} /> 移動到批次
            </button>
            <button
              onClick={bulkDuplicate}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Copy size={14} /> 複製
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> 刪除
            </button>
            <button onClick={clearSelected} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="accent-[#e85d26] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="text-center px-2 py-3 text-xs font-semibold text-gray-400 w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-16">圖片</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">名稱</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">批次</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">分類</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">價格</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">庫存</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">上架</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">精選</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p, idx) => {
                const isSelected = selected.has(p.id)
                return (
                  <tr key={p.id} className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        className="accent-[#e85d26] w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1a1a1a] line-clamp-1">{p.name}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {p.collection_id
                        ? <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{collections.find(c => c.id === p.collection_id)?.name ?? '—'}</span>
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                      {(p.categories as { emoji?: string; name: string } | undefined)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">NT$ {p.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell text-gray-500">
                      {p.stock === -1 ? '∞' : p.stock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleAvailable(p)} className={p.is_available ? 'text-green-500' : 'text-gray-300'}>
                        {p.is_available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <button onClick={() => toggleFeatured(p)} className={p.is_featured ? 'text-[#e85d26]' : 'text-gray-300'}>
                        {p.is_featured ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {visibleProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>{activeCollection !== null ? '此批次尚無商品' : '尚無商品，點選「新增商品」開始'}</p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ProductFormModal
          product={editTarget}
          categories={categories}
          collections={collections}
          defaultCollectionId={editTarget ? undefined : activeCollection}
          onClose={() => { setModalOpen(false); refresh() }}
        />
      )}

      {newCollectionOpen && (
        <NewCollectionModal
          onClose={() => setNewCollectionOpen(false)}
          onCreate={(col) => setCollections(prev => [col, ...prev])}
        />
      )}

      {moveModalOpen && (
        <MoveToCollectionModal
          count={selected.size}
          collections={collections}
          onClose={() => setMoveModalOpen(false)}
          onMove={bulkMove}
        />
      )}
    </>
  )
}
