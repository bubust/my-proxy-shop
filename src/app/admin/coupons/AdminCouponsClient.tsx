'use client'

import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import type { Coupon } from '@/types'
import { format } from 'date-fns'

function CreateCouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    code: '',
    type: 'fixed' as 'fixed' | 'percent',
    value: '',
    min_amount: '0',
    max_uses: '',
    expires_at: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.code.trim()) { toast.error('請輸入優惠碼'); return }
    if (!form.value || Number(form.value) <= 0) { toast.error('請輸入有效折扣值'); return }
    if (form.type === 'percent' && Number(form.value) > 100) { toast.error('折扣百分比不得超過 100'); return }

    setSaving(true)
    const { error } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_amount: Number(form.min_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    })
    setSaving(false)
    if (error) {
      if (error.code === '23505') { toast.error('優惠碼已存在'); return }
      toast.error('建立失敗：' + error.message); return
    }
    toast.success('優惠券已建立！')
    onCreated()
    onClose()
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26]'
  const labelCls = 'text-xs font-medium text-gray-500 mb-1 block'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1a1a1a]">新增優惠券</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>優惠碼 *</label>
            <input className={inputCls + ' uppercase'} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="例：SNOW100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>折扣類型</label>
              <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value as 'fixed' | 'percent')}>
                <option value="fixed">固定金額（NT$）</option>
                <option value="percent">百分比（%）</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{form.type === 'fixed' ? '折扣金額（NT$）' : '折扣百分比（%）'} *</label>
              <input className={inputCls} type="number" min={1} max={form.type === 'percent' ? 100 : undefined}
                value={form.value} onChange={e => set('value', e.target.value)} placeholder={form.type === 'fixed' ? '100' : '10'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>最低消費（NT$）</label>
              <input className={inputCls} type="number" min={0} value={form.min_amount} onChange={e => set('min_amount', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>使用次數上限（空白=無限）</label>
              <input className={inputCls} type="number" min={1} value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="無限制" />
            </div>
          </div>
          <div>
            <label className={labelCls}>到期日（空白=永不過期）</label>
            <input className={inputCls} type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={save} disabled={saving}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50">
            {saving ? '建立中…' : '建立優惠券'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data ?? [])
  }

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    if (error) { toast.error('更新失敗'); return }
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(coupon.is_active ? '已停用' : '已啟用')
  }

  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`確定要刪除優惠碼「${coupon.code}」？`)) return
    const { error } = await supabase.from('coupons').delete().eq('id', coupon.id)
    if (error) { toast.error('刪除失敗'); return }
    setCoupons(prev => prev.filter(c => c.id !== coupon.id))
    toast.success('已刪除')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1a1a1a]">優惠券管理</h1>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-[#e85d26] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#f47848] transition-colors">
          <Plus size={15} /> 新增優惠券
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center text-gray-400">
          <Tag size={32} className="mx-auto mb-3 opacity-30" />
          <p>尚無優惠券，點右上角新增</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {coupons.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-[#1a1a1a]">{c.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {c.is_active ? '啟用中' : '已停用'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="font-semibold text-[#e85d26]">
                      {c.type === 'fixed' ? `折 NT$ ${c.value}` : `折 ${c.value}%`}
                    </span>
                    {c.min_amount > 0 && <span>滿 NT$ {c.min_amount} 可用</span>}
                    <span>已用 {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''} 次</span>
                    {c.expires_at && <span>到期：{format(new Date(c.expires_at), 'yyyy/MM/dd')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(c)} title={c.is_active ? '停用' : '啟用'}
                    className="text-gray-400 hover:text-[#e85d26] transition-colors">
                    {c.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => deleteCoupon(c)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creating && (
        <CreateCouponModal onClose={() => setCreating(false)} onCreated={reload} />
      )}
    </div>
  )
}
