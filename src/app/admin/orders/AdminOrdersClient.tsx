'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { Trash2, Pencil, X, Plus, ChevronDown } from 'lucide-react'
import type { Order, OrderStatus, PaymentStatus, OrderItem } from '@/types'

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '待確認' },
  { value: 'confirmed', label: '已確認' },
  { value: 'purchasing', label: '採購中' },
  { value: 'shipped', label: '已出貨' },
  { value: 'arrived', label: '已到貨' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: 'unpaid', label: '未付款' },
  { value: 'paid', label: '已付款' },
  { value: 'refunded', label: '已退款' },
]

type EditItem = {
  id?: string        // 有 id = 既有，無 id = 新增
  product_name: string
  quantity: number
  price: number
  size: string
  color: string
  _delete?: boolean  // 標記刪除
}

function EditModal({ order, onClose, onSave }: {
  order: Order
  onClose: () => void
  onSave: (updated: Order) => void
}) {
  const originalItems = (order.order_items ?? []) as OrderItem[]
  const [items, setItems] = useState<EditItem[]>(
    originalItems.map(i => ({
      id: i.id,
      product_name: i.product_name,
      quantity: i.quantity,
      price: i.price,
      size: i.size ?? '',
      color: i.color ?? '',
    }))
  )
  const [adminNote, setAdminNote] = useState(order.admin_note ?? '')
  const [recipientName, setRecipientName] = useState(order.recipient_name)
  const [recipientPhone, setRecipientPhone] = useState(order.recipient_phone)
  const [shippingAddress, setShippingAddress] = useState(order.shipping_address)
  const [saving, setSaving] = useState(false)

  const activeItems = items.filter(i => !i._delete)
  const newTotal = activeItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const updateItem = (idx: number, field: keyof EditItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      return item.id ? { ...item, _delete: true } : null  // 既有 → 標刪除；新增 → 直接移除
    }).filter(Boolean) as EditItem[])
  }

  const addItem = () => {
    setItems(prev => [...prev, { product_name: '', quantity: 1, price: 0, size: '', color: '' }])
  }

  const save = async () => {
    if (activeItems.some(i => !i.product_name.trim())) {
      toast.error('品名不能為空')
      return
    }
    setSaving(true)

    // 刪除標記刪除的
    const toDelete = items.filter(i => i._delete && i.id)
    for (const item of toDelete) {
      await supabase.from('order_items').delete().eq('id', item.id!)
    }

    // 更新既有
    const toUpdate = items.filter(i => !i._delete && i.id)
    for (const item of toUpdate) {
      await supabase.from('order_items').update({
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        size: item.size || null,
        color: item.color || null,
      }).eq('id', item.id!)
    }

    // 新增
    const toInsert = items.filter(i => !i._delete && !i.id)
    if (toInsert.length > 0) {
      await supabase.from('order_items').insert(toInsert.map(i => ({
        order_id: order.id,
        product_name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.price * i.quantity,
        size: i.size || null,
        color: i.color || null,
      })))
    }

    // 更新訂單主資訊
    const { error } = await supabase.from('orders').update({
      subtotal: newTotal,
      total: newTotal,
      admin_note: adminNote || null,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      shipping_address: shippingAddress,
      updated_at: new Date().toISOString(),
    }).eq('id', order.id)

    setSaving(false)
    if (error) { toast.error('儲存失敗：' + error.message); return }

    // 重新 fetch 此訂單的 items 來更新畫面
    const { data: newItems } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    toast.success('訂單已更新')
    onSave({
      ...order,
      subtotal: newTotal,
      total: newTotal,
      admin_note: adminNote || null,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      shipping_address: shippingAddress,
      order_items: newItems ?? [],
    })
    onClose()
  }

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#e85d26] w-full'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#1a1a1a]">編輯訂單</h2>
            <p className="text-xs text-gray-400 mt-0.5">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* 商品明細 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">商品明細</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-[#e85d26] hover:underline">
                <Plus size={12} /> 新增商品
              </button>
            </div>
            <div className="space-y-2">
              {items.filter(i => !i._delete).map((item, idx) => {
                const realIdx = items.indexOf(item)
                return (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <div className="col-span-4">
                      <input value={item.product_name} onChange={e => updateItem(realIdx, 'product_name', e.target.value)}
                        placeholder="品名" className={inputCls} />
                    </div>
                    <div className="col-span-1">
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(realIdx, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="數量" className={inputCls + ' text-center'} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min={0} value={item.price} onChange={e => updateItem(realIdx, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="單價" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <input value={item.size} onChange={e => updateItem(realIdx, 'size', e.target.value)}
                        placeholder="尺寸" className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <input value={item.color} onChange={e => updateItem(realIdx, 'color', e.target.value)}
                        placeholder="顏色" className={inputCls} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeItem(realIdx)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {items.filter(i => !i._delete).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">尚無商品</p>
              )}
            </div>
            <div className="mt-2 text-right text-sm font-bold text-[#e85d26]">
              合計：NT$ {newTotal.toLocaleString()}
            </div>
          </div>

          {/* 收件資訊 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">收件資訊</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">收件人</label>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">電話</label>
                <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-0.5 block">地址</label>
                <input value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* 管理員備註 */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">管理員備註</label>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              rows={2}
              placeholder="例如：已確認庫存、特殊處理說明…"
              className={inputCls + ' resize-none'}
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
          >
            {saving ? '儲存中…' : '儲存變更'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const updateStatus = async (orderId: string, field: 'status' | 'payment_status', value: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) { toast.error('更新失敗'); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o))
    toast.success('已更新')
  }

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`確定刪除訂單 ${orderNumber}？此動作無法復原。`)) return
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setOrders(prev => prev.filter(o => o.id !== orderId))
    toast.success('訂單已刪除')
  }

  const handleSave = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
  }

  if (orders.length === 0) {
    return <div className="text-center py-12 text-gray-400">尚無訂單</div>
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {orders.map((order) => {
          const items = (order.order_items ?? []) as OrderItem[]
          const isOpen = expanded.has(order.id)
          return (
            <div key={order.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
              {/* 主資訊列 */}
              <div
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 cursor-pointer select-none ${isOpen ? 'mb-3' : ''}`}
                onClick={() => toggleExpand(order.id)}
              >
                <ChevronDown
                  size={14}
                  className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
                <span className="font-mono text-xs text-[#e85d26] font-semibold w-44 shrink-0">{order.order_number}</span>
                <span className="text-sm text-gray-700 w-20 shrink-0">
                  {(order.profiles as { name?: string })?.name ?? '—'}
                </span>
                <span className="text-sm font-bold text-[#1a1a1a] w-24 shrink-0">
                  NT$ {Number(order.total).toLocaleString()}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, 'status', e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#e85d26] cursor-pointer"
                >
                  {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select
                  value={order.payment_status}
                  onChange={(e) => updateStatus(order.id, 'payment_status', e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#e85d26] cursor-pointer"
                >
                  {PAYMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span className="text-xs text-gray-400 ml-auto hidden md:block">
                  {format(new Date(order.created_at), 'MM/dd HH:mm')}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingOrder(order) }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="編輯訂單"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteOrder(order.id, order.order_number) }}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="刪除訂單"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* 可折疊內容 */}
              {isOpen && <div className="mt-3">

              {/* 商品明細 */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-400">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium">品名</th>
                      <th className="text-center px-3 py-1.5 font-medium w-12">數量</th>
                      <th className="text-center px-3 py-1.5 font-medium w-16">尺寸</th>
                      <th className="text-center px-3 py-1.5 font-medium w-16">顏色</th>
                      <th className="text-right px-3 py-1.5 font-medium w-20">小計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-2 text-gray-300 text-center">無商品資料</td></tr>
                    ) : items.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-gray-700">{item.product_name}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{item.size ?? '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{item.color ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-700 font-medium">NT$ {Number(item.subtotal).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 收件 + 備考 */}
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-gray-500">
                <span><span className="text-gray-400">收件人</span> {order.recipient_name}</span>
                <span><span className="text-gray-400">電話</span> {order.recipient_phone}</span>
                <span><span className="text-gray-400">地址</span> {order.shipping_address}</span>
                {order.note && <span><span className="text-gray-400">備考</span> {order.note}</span>}
                {order.admin_note && <span className="text-[#e85d26]"><span className="font-semibold">管理員備註</span> {order.admin_note}</span>}
              </div>
              </div>}
            </div>
          )
        })}
      </div>

      {editingOrder && (
        <EditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={(updated) => { handleSave(updated); setEditingOrder(null) }}
        />
      )}
    </>
  )
}
