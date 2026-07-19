import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const NAV_LINKS = [
  { href: '/admin', label: '📊 儀表板', exact: true },
  { href: '/admin/orders', label: '📋 訂單管理' },
  { href: '/admin/products', label: '📦 商品管理' },
  { href: '/admin/reports', label: '📈 統計報表' },
  { href: '/admin/coupons', label: '🏷️ 優惠券' },
  { href: '/admin/members', label: '👥 會員列表' },
  { href: '/admin/settings', label: '⚙️ 設定' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-[#1a1a1a] text-white px-4 h-14 flex items-center justify-between sticky top-0 z-50">
        <Link href="/admin" className="font-bold text-lg">🛍️ 後台管理</Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">前往網站</Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex flex-col w-52 bg-white border-r border-gray-100 min-h-[calc(100vh-56px)] sticky top-14 shrink-0">
          <nav className="p-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#1a1a1a] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-w-[60px]"
            >
              <span className="text-lg">{link.label.split(' ')[0]}</span>
              <span className="text-[9px] text-gray-500 whitespace-nowrap">{link.label.split(' ')[1]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
