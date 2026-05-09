'use client'

import { useEffect, useState } from 'react'
import { UploadCloud, ChevronDown, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import type { Collection } from '@/types'

export default function AdminQuickPublish({ collections }: { collections: Collection[] }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(data?.role === 'admin')
    })
  }, [])

  if (!isAdmin || collections.length === 0) return null

  const activate = async (col: Collection) => {
    setLoading(col.id)
    const { error } = await supabase.from('products').update({ is_available: true }).eq('collection_id', col.id)
    setLoading(null)
    if (error) { toast.error('上架失敗'); return }
    toast.success(`「${col.name}」已全部上架`)
    setOpen(false)
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40">
      {open && (
        <div className="mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden w-56">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] text-white">
            <span className="text-sm font-semibold">選擇批次上架</span>
            <button onClick={() => setOpen(false)}><X size={15} /></button>
          </div>
          <div className="py-1">
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => activate(col)}
                disabled={loading === col.id}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 hover:text-[#e85d26] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud size={14} />
                {loading === col.id ? '上架中…' : col.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#e85d26] text-white px-4 py-2.5 rounded-full shadow-lg font-semibold text-sm hover:bg-[#f47848] transition-colors"
      >
        <UploadCloud size={16} /> 一鍵上架 <ChevronDown size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
    </div>
  )
}
