'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'
import { useRouter } from 'next/navigation'
import { Copy, Bell } from 'lucide-react'

const ORDER_STATUSES = [
  { value: 'pending', label: '待確認' },
  { value: 'confirmed', label: '已確認' },
  { value: 'purchasing', label: '代購中' },
  { value: 'shipped', label: '已出貨' },
  { value: 'arrived', label: '已到台' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: '未付款' },
  { value: 'paid', label: '已付款' },
  { value: 'refunded', label: '已退款' },
]

export default function AdminOrderActions({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status)
  const [payStatus, setPayStatus] = useState(order.payment_status)
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [adminNote, setAdminNote] = useState(order.admin_note ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const copyShippingNotice = () => {
    const trackingInfo = tracking ? `\n物流追蹤號碼：${tracking}` : ''
    const msg = `【雪寶代購 出貨通知】\n\n您好，您的訂單 ${order.order_number} 已出貨！${trackingInfo}\n\n如有任何問題請隨時聯繫，感謝您的支持！`
    navigator.clipboard.writeText(msg).then(() => toast.success('通知訊息已複製，可貼上傳給客人')).catch(() => toast.error('複製失敗'))
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('orders').update({
      status,
      payment_status: payStatus,
      tracking_number: tracking || null,
      admin_note: adminNote || null,
      updated_at: new Date().toISOString(),
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(payStatus === 'paid' && order.payment_status !== 'paid' ? { paid_at: new Date().toISOString() } : {}),
      ...(status === 'shipped' && order.status !== 'shipped' ? { shipped_at: new Date().toISOString() } : {}),
    }).eq('id', order.id)
    setSaving(false)
    if (error) { toast.error('更新失敗'); return }
    toast.success('訂單已更新')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h2 className="font-semibold text-[#1a1a1a] mb-4">管理操作</h2>
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">訂單狀態</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
          >
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">付款狀態</label>
          <select
            value={payStatus}
            onChange={(e) => setPayStatus(e.target.value as typeof payStatus)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
          >
            {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-600 mb-1 block">物流追蹤號碼</label>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="EMS / DHL 追蹤號"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-gray-600 mb-1 block">管理員備註</label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={3}
          placeholder="內部備註，客戶看不到"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26] resize-none"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
      >
        {saving ? '儲存中…' : '儲存變更'}
      </button>

      {(status === 'shipped' || order.status === 'shipped' || order.status === 'arrived' || order.status === 'completed') && (
        <button
          onClick={copyShippingNotice}
          className="mt-2 w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          <Bell size={14} /> 複製出貨通知訊息
        </button>
      )}
    </div>
  )
}
