'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import type { OrderStatus } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待確認', confirmed: '已確認', purchasing: '代購中',
  shipped: '已出貨', arrived: '已到台', completed: '已完成', cancelled: '已取消',
}
const PIE_COLORS = ['#94a3b8', '#3b82f6', '#e85d26', '#a855f7', '#6366f1', '#22c55e', '#ef4444']

export default function AdminDashboardCharts({ orders }: { orders: { created_at: string; status: string }[] }) {
  const lineData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
    return days.map((day) => {
      const dayStr = format(day, 'MM/dd')
      const count = orders.filter((o) => format(new Date(o.created_at), 'MM/dd') === dayStr).length
      return { date: dayStr, 訂單數: count }
    })
  }, [orders])

  const pieData = useMemo(() => {
    const counts: Partial<Record<OrderStatus, number>> = {}
    orders.forEach((o) => {
      counts[o.status as OrderStatus] = (counts[o.status as OrderStatus] ?? 0) + 1
    })
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key as OrderStatus] ?? key,
      value,
    }))
  }, [orders])

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-4 text-sm">近 30 天每日訂單</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="訂單數" stroke="#e85d26" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h2 className="font-semibold text-[#1a1a1a] mb-4 text-sm">訂單狀態分佈</h2>
        {pieData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">尚無資料</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {pieData.map((_entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
