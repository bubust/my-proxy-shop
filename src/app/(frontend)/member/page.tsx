import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MemberPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: orders } = await supabase.from('orders').select('id, status').eq('user_id', user.id)

  const total = orders?.length ?? 0
  const active = orders?.filter((o) => !['completed', 'cancelled'].includes(o.status)).length ?? 0
  const completed = orders?.filter((o) => o.status === 'completed').length ?? 0

  const LINKS = [
    { href: '/member/orders', icon: '📋', label: '我的訂單', desc: `共 ${total} 筆` },
    { href: '/member/profile', icon: '👤', label: '個人資料', desc: '修改姓名、電話、地址' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-[#1a1a1a] text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#e85d26] flex items-center justify-center text-2xl font-bold">
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-bold text-lg">{profile?.name ?? '會員'}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '全部訂單', value: total },
          { label: '進行中', value: active },
          { label: '已完成', value: completed },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-[#e85d26]">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="space-y-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-[#e85d26]/30 transition-colors"
          >
            <span className="text-2xl">{link.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-[#1a1a1a]">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <span className="text-gray-400">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
