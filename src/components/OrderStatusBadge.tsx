import type { OrderStatus, PaymentStatus } from '@/types'

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: '待確認', color: 'bg-gray-100 text-gray-600' },
  confirmed:  { label: '已確認', color: 'bg-blue-100 text-blue-600' },
  purchasing: { label: '代購中', color: 'bg-orange-100 text-orange-600' },
  shipped:    { label: '已出貨', color: 'bg-purple-100 text-purple-600' },
  arrived:    { label: '已到台', color: 'bg-indigo-100 text-indigo-600' },
  completed:  { label: '已完成', color: 'bg-green-100 text-green-600' },
  cancelled:  { label: '已取消', color: 'bg-red-100 text-red-500' },
}

const PAYMENT_MAP: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid:   { label: '未付款', color: 'bg-yellow-100 text-yellow-700' },
  paid:     { label: '已付款', color: 'bg-green-100 text-green-600' },
  refunded: { label: '已退款', color: 'bg-gray-100 text-gray-600' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_MAP[status]
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_MAP[status]
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
}
