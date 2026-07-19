'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Order, OrderItem } from '@/types'
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, startOfWeek, startOfMonth, subMonths } from 'date-fns'
import { ShoppingBag, Package, ClipboardList, Download, Pencil, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

type FullOrder = Order & { order_items: OrderItem[] }

const PURCHASE_STATUSES = ['pending', 'confirmed', 'purchasing']

const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', confirmed: '已確認', purchasing: '採購中',
  shipped: '已出貨', arrived: '已到台', completed: '已完成', cancelled: '已取消',
}
const PAYMENT_LABELS: Record<string, string> = {
  unpaid: '未付款', paid: '已付款', refunded: '已退款',
}

const ALL_STATUSES = ['pending', 'confirmed', 'purchasing', 'shipped', 'arrived', 'completed', 'cancelled']
const ALL_PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded']

const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
const today = () => fmt(new Date())

const PRESETS = [
  { label: '今日', from: () => today(), to: () => today() },
  { label: '本週', from: () => fmt(startOfWeek(new Date(), { weekStartsOn: 1 })), to: () => today() },
  { label: '本月', from: () => fmt(startOfMonth(new Date())), to: () => today() },
  { label: '近 3 個月', from: () => fmt(subMonths(new Date(), 3)), to: () => today() },
]

// ── 訂單編輯 Modal ────────────────────────────────────────
function EditOrderModal({ order, onClose, onSaved }: { order: FullOrder; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    recipient_name: order.recipient_name ?? '',
    recipient_phone: order.recipient_phone ?? '',
    shipping_address: order.shipping_address ?? '',
    status: order.status,
    payment_status: order.payment_status,
    admin_note: order.admin_note ?? '',
    tracking_number: order.tracking_number ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('orders').update({
      recipient_name: form.recipient_name,
      recipient_phone: form.recipient_phone,
      shipping_address: form.shipping_address,
      status: form.status,
      payment_status: form.payment_status,
      admin_note: form.admin_note || null,
      tracking_number: form.tracking_number || null,
      updated_at: new Date().toISOString(),
    }).eq('id', order.id)
    setSaving(false)
    if (error) { toast.error('儲存失敗：' + error.message); return }
    toast.success('訂單已更新')
    onSaved()
    onClose()
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26]'
  const labelCls = 'text-xs font-medium text-gray-500 mb-1 block'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1a1a1a]">編輯訂單</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* 狀態 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>訂單狀態</label>
              <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>付款狀態</label>
              <select className={inputCls} value={form.payment_status} onChange={e => set('payment_status', e.target.value)}>
                {ALL_PAYMENT_STATUSES.map(s => <option key={s} value={s}>{PAYMENT_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          {/* 收件人 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>收件人姓名</label>
              <input className={inputCls} value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>電話</label>
              <input className={inputCls} value={form.recipient_phone} onChange={e => set('recipient_phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>收件地址</label>
            <input className={inputCls} value={form.shipping_address} onChange={e => set('shipping_address', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>物流追蹤號碼</label>
            <input className={inputCls} value={form.tracking_number} onChange={e => set('tracking_number', e.target.value)} placeholder="選填" />
          </div>
          <div>
            <label className={labelCls}>管理員備注</label>
            <textarea className={inputCls} rows={2} value={form.admin_note} onChange={e => set('admin_note', e.target.value)} placeholder="選填" />
          </div>
          {/* 商品明細（唯讀） */}
          {order.order_items?.length > 0 && (
            <div>
              <label className={labelCls}>商品明細</label>
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-700">{item.product_name}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {item.size && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{item.size}</span>}
                      {item.color && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{item.color}</span>}
                      <span className="font-semibold text-gray-600">×{item.quantity}</span>
                      <span className="text-gray-500">NT$ {Number(item.subtotal).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5">
          <button onClick={save} disabled={saving}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50">
            {saving ? '儲存中…' : '儲存變更'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 採購清單 ────────────────────────────────────────────────
function PurchaseTab({ orders, onEditOrder }: { orders: FullOrder[]; onEditOrder: (o: FullOrder) => void }) {
  const activeOrders = orders.filter(o => PURCHASE_STATUSES.includes(o.status))

  const purchaseMap = useMemo(() => {
    const map: Record<string, {
      name: string
      totalQty: number
      sizes: Record<string, number>
      colors: Record<string, number>
      orderDetails: { number: string; qty: number; size: string | null; color: string | null; recipient: string; orderId: string }[]
    }> = {}
    activeOrders.forEach(order => {
      ;(order.order_items ?? []).forEach((item: OrderItem) => {
        if (!map[item.product_name]) {
          map[item.product_name] = { name: item.product_name, totalQty: 0, sizes: {}, colors: {}, orderDetails: [] }
        }
        const e = map[item.product_name]
        e.totalQty += item.quantity
        if (item.size) e.sizes[item.size] = (e.sizes[item.size] ?? 0) + item.quantity
        if (item.color) e.colors[item.color] = (e.colors[item.color] ?? 0) + item.quantity
        e.orderDetails.push({ number: order.order_number, qty: item.quantity, size: item.size, color: item.color, recipient: order.recipient_name, orderId: order.id })
      })
    })
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty)
  }, [activeOrders])

  const totalItems = purchaseMap.reduce((s, p) => s + p.totalQty, 0)
  const unpaid = activeOrders.filter(o => o.payment_status === 'unpaid')

  const exportPurchase = () => {
    const wb = XLSX.utils.book_new()
    const rows: unknown[][] = [['#', '商品名稱', '總數量', '尺寸明細', '顏色明細', '訂單資訊']]
    purchaseMap.forEach((p, i) => {
      const sizeStr = Object.entries(p.sizes).map(([s, q]) => `${s}×${q}`).join(' ')
      const colorStr = Object.entries(p.colors).map(([c, q]) => `${c}×${q}`).join(' ')
      const orderStr = p.orderDetails.map(o => `${o.number}(${o.recipient} ×${o.qty})`).join(', ')
      rows.push([i + 1, p.name, p.totalQty, sizeStr || '—', colorStr || '—', orderStr])
    })
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, ws, '採購清單')
    XLSX.writeFile(wb, `採購清單_${today()}.xlsx`)
  }

  return (
    <div className="space-y-4">
      {/* 摘要 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '待處理訂單', value: activeOrders.length, unit: '筆' },
          { label: '商品種類', value: purchaseMap.length, unit: '種' },
          { label: '需採購總件數', value: totalItems, unit: '件' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-[#e85d26]">{s.value}<span className="text-sm font-normal ml-0.5">{s.unit}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 未付款警示 */}
      {unpaid.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">⚠️ 未付款訂單（{unpaid.length} 筆）—— 採購前請確認</p>
          <div className="space-y-1.5">
            {unpaid.map(o => (
              <div key={o.id} className="flex items-center gap-4 text-xs text-amber-700">
                <span className="font-mono w-40">{o.order_number}</span>
                <span className="w-24 truncate">{o.recipient_name}</span>
                <span className="font-semibold">NT$ {Number(o.total).toLocaleString()}</span>
                <span className="text-amber-500">{STATUS_LABELS[o.status]}</span>
                <button
                  onClick={() => onEditOrder(o)}
                  className="ml-auto flex items-center gap-1 text-xs text-amber-600 border border-amber-300 bg-white hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors"
                >
                  <Pencil size={11} /> 編輯
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 採購清單表 */}
      {purchaseMap.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
          <p>目前無待採購訂單</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-[#1a1a1a]">採購明細</h2>
            <button onClick={exportPurchase} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#e85d26] border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              <Download size={13} /> 匯出
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-400 w-8">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">商品名稱</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 w-16">總數量</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">尺寸</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">顏色</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">訂單明細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {purchaseMap.map((product, idx) => (
                <tr key={product.name} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-3 py-3 text-center text-xs text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{product.name}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-lg font-bold text-[#e85d26]">{product.totalQty}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {Object.keys(product.sizes).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(product.sizes).map(([s, q]) => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s} × {q}</span>
                        ))}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {Object.keys(product.colors).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(product.colors).map(([c, q]) => (
                          <span key={c} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{c} × {q}</span>
                        ))}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {product.orderDetails.map((o, i) => {
                        const fullOrder = orders.find(ord => ord.id === o.orderId)
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono text-[#e85d26] shrink-0">{o.number}</span>
                            <span className="shrink-0">{o.recipient}</span>
                            <span className="font-semibold text-gray-700">×{o.qty}</span>
                            {o.size && <span className="bg-blue-50 text-blue-600 px-1.5 rounded">{o.size}</span>}
                            {o.color && <span className="bg-purple-50 text-purple-600 px-1.5 rounded">{o.color}</span>}
                            {fullOrder && (
                              <button
                                onClick={() => onEditOrder(fullOrder)}
                                className="ml-1 text-gray-300 hover:text-[#e85d26] transition-colors"
                                title="編輯訂單"
                              >
                                <Pencil size={11} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── 銷售概覽 ────────────────────────────────────────────────
function SalesTab({ orders, onEditOrder }: { orders: FullOrder[]; onEditOrder: (o: FullOrder) => void }) {
  const [dateFrom, setDateFrom] = useState(fmt(subMonths(new Date(), 1)))
  const [dateTo, setDateTo] = useState(today())
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setDateFrom(preset.from()); setDateTo(preset.to()); setActivePreset(preset.label)
  }

  const filtered = useMemo(() => orders.filter(o => {
    const d = parseISO(o.created_at)
    return isWithinInterval(d, { start: startOfDay(parseISO(dateFrom)), end: endOfDay(parseISO(dateTo)) })
  }), [orders, dateFrom, dateTo])

  const stats = useMemo(() => {
    const total = filtered.length
    const revenue = filtered.reduce((s, o) => s + Number(o.total), 0)
    const avgOrder = total > 0 ? revenue / total : 0
    const paidCount = filtered.filter(o => o.payment_status === 'paid').length
    const payRate = total > 0 ? Math.round((paidCount / total) * 100) : 0
    return { total, revenue, avgOrder, payRate }
  }, [filtered])

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {}
    filtered.forEach(o => o.order_items?.forEach((item: OrderItem) => {
      if (!counts[item.product_name]) counts[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
      counts[item.product_name].qty += item.quantity
      counts[item.product_name].revenue += Number(item.subtotal)
    }))
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 10)
  }, [filtered])

  const statusStats = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach(o => { counts[o.status] = (counts[o.status] ?? 0) + 1 })
    return Object.entries(counts).map(([key, value]) => ({ name: STATUS_LABELS[key] ?? key, value }))
  }, [filtered])

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const orderRows: unknown[][] = [['訂單編號', '日期', '收件人', '商品', '數量', '尺寸', '顏色', '小計', '訂單狀態', '付款', '總金額', '備考']]
    filtered.forEach(o => {
      const items = o.order_items ?? []
      if (items.length === 0) {
        orderRows.push([o.order_number, format(parseISO(o.created_at), 'yyyy/MM/dd HH:mm'), o.recipient_name, '', '', '', '', '', STATUS_LABELS[o.status], PAYMENT_LABELS[o.payment_status], o.total, o.note ?? ''])
      } else {
        items.forEach((item: OrderItem, i) => {
          orderRows.push([
            i === 0 ? o.order_number : '',
            i === 0 ? format(parseISO(o.created_at), 'yyyy/MM/dd HH:mm') : '',
            i === 0 ? o.recipient_name : '',
            item.product_name, item.quantity, item.size ?? '', item.color ?? '', item.subtotal,
            i === 0 ? STATUS_LABELS[o.status] : '',
            i === 0 ? PAYMENT_LABELS[o.payment_status] : '',
            i === 0 ? o.total : '',
            i === 0 ? (o.note ?? '') : '',
          ])
        })
      }
    })
    const ws1 = XLSX.utils.aoa_to_sheet(orderRows)
    ws1['!cols'] = [14, 18, 10, 24, 6, 8, 8, 8, 10, 10, 10, 20].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws1, '訂單明細')
    const productRows: unknown[][] = [['商品名稱', '銷售數量', '銷售金額']]
    topProducts.forEach(p => productRows.push([p.name, p.qty, p.revenue]))
    const ws2 = XLSX.utils.aoa_to_sheet(productRows)
    ws2['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws2, '商品銷售統計')
    XLSX.writeFile(wb, `銷售報表_${dateFrom}_${dateTo}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activePreset === p.label ? 'bg-[#e85d26] text-white border-[#e85d26]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#e85d26]'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-600">自訂：</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26]" />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e85d26]" />
          <button onClick={exportExcel} className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-500 hover:text-[#e85d26] px-3 py-2 rounded-xl transition-colors ml-auto">
            <Download size={13} /> 匯出 Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '訂單數', value: `${stats.total} 筆` },
          { label: '營業額', value: `NT$ ${stats.revenue.toLocaleString()}` },
          { label: '平均客單價', value: `NT$ ${Math.round(stats.avgOrder).toLocaleString()}` },
          { label: '付款率', value: `${stats.payRate}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-xl md:text-2xl font-bold text-[#e85d26]">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 訂單列表（可編輯） */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-[#1a1a1a]">訂單列表</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map(o => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm">
                <span className="font-mono text-xs text-[#e85d26] w-40 shrink-0">{o.order_number}</span>
                <span className="text-xs text-gray-400 w-28 shrink-0">{format(parseISO(o.created_at), 'MM/dd HH:mm')}</span>
                <span className="text-gray-700 flex-1 truncate">{o.recipient_name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">{STATUS_LABELS[o.status]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${o.payment_status === 'paid' ? 'bg-green-50 text-green-600' : o.payment_status === 'unpaid' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                  {PAYMENT_LABELS[o.payment_status]}
                </span>
                <span className="font-semibold text-gray-700 shrink-0">NT$ {Number(o.total).toLocaleString()}</span>
                <button
                  onClick={() => onEditOrder(o)}
                  className="shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-[#e85d26] border border-gray-200 hover:border-[#e85d26] px-2 py-1 rounded-lg transition-colors"
                >
                  <Pencil size={11} /> 編輯
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-4 text-sm">商品銷售排行（前 10 名）</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">選定期間無資料</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} 件`, '銷售量']} />
              <Bar dataKey="qty" fill="#e85d26" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-3 text-sm">訂單狀態分佈</h2>
        <div className="space-y-2">
          {statusStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">選定期間無資料</p>
          ) : statusStats.map(s => (
            <div key={s.name} className="flex items-center gap-3 text-sm">
              <span className="text-gray-600 w-16 shrink-0">{s.name}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#e85d26] rounded-full" style={{ width: `${(s.value / stats.total) * 100}%` }} />
              </div>
              <span className="font-semibold text-[#1a1a1a] w-8 text-right">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminReportsClient({ orders }: { orders: FullOrder[] }) {
  const [tab, setTab] = useState<'purchase' | 'sales'>('purchase')
  const [editingOrder, setEditingOrder] = useState<FullOrder | null>(null)
  const router = useRouter()

  const handleSaved = () => router.refresh()

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">統計報表</h1>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('purchase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'purchase' ? 'bg-[#e85d26] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#e85d26]'}`}>
          <ClipboardList size={15} /> 採購清單
        </button>
        <button onClick={() => setTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'sales' ? 'bg-[#e85d26] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#e85d26]'}`}>
          <Package size={15} /> 銷售概覽
        </button>
      </div>

      {tab === 'purchase'
        ? <PurchaseTab orders={orders} onEditOrder={setEditingOrder} />
        : <SalesTab orders={orders} onEditOrder={setEditingOrder} />
      }

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
