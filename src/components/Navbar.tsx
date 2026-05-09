'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { getCartCount } from '@/lib/cart'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar({ siteName }: { siteName: string }) {
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ id?: string; email?: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  const fetchRole = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setIsAdmin(data?.role === 'admin')
  }

  useEffect(() => {
    setCartCount(getCartCount())
    const handleStorage = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', handleStorage)
    window.addEventListener('storage', handleStorage)

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) fetchRole(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      else setIsAdmin(false)
    })
    return () => {
      window.removeEventListener('cart-updated', handleStorage)
      window.removeEventListener('storage', handleStorage)
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#1a1a1a]">
          {siteName}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/products" className="hover:text-[#e85d26] transition-colors">商品列表</Link>
          <Link href="/about" className="hover:text-[#e85d26] transition-colors">代購流程</Link>
          {user ? (
            <>
              <Link href="/member" className="hover:text-[#e85d26] transition-colors">會員中心</Link>
              <button onClick={handleLogout} className="hover:text-[#e85d26] transition-colors">登出</button>
            </>
          ) : (
            <Link href="/login" className="hover:text-[#e85d26] transition-colors">登入</Link>
          )}
          <Link href="/cart" className="relative">
            <ShoppingCart size={20} className="text-gray-700 hover:text-[#e85d26] transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#e85d26] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="bg-[#1a1a1a] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#e85d26] transition-colors">後台管理</Link>
          )}
        </div>

        {/* Mobile icons */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/cart" className="relative">
            <ShoppingCart size={22} className="text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#e85d26] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3 text-sm font-medium text-gray-700">
          <Link href="/products" onClick={() => setMenuOpen(false)}>商品列表</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>代購流程</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-[#e85d26] font-semibold">後台管理</Link>
              )}
              <Link href="/member" onClick={() => setMenuOpen(false)}>會員中心</Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-left">登出</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>登入</Link>
          )}
        </div>
      )}
    </nav>
  )
}
