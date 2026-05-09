'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCartCount } from '@/lib/cart'

export default function MobileNav() {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setCartCount(getCartCount())
    const handler = () => setCartCount(getCartCount())
    window.addEventListener('cart-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('cart-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const links = [
    { href: '/', icon: Home, label: '首頁' },
    { href: '/products', icon: ShoppingBag, label: '商品' },
    { href: '/cart', icon: ShoppingCart, label: '購物車', badge: cartCount },
    { href: '/member', icon: User, label: '會員' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative min-h-[56px] ${
                active ? 'text-[#e85d26]' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon size={22} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#e85d26] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
