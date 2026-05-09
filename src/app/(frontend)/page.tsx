import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import type { Product } from '@/types'
import ProductCard from '@/components/ProductCard'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

type Country = { flag: string; name: string; link?: string }

export default async function HomePage() {
  const [{ data: settingsData }, { data: featured }] = await Promise.all([
    adminClient.from('site_settings').select('value').eq('key', 'homepage').single(),
    adminClient.from('products').select('*, categories(*)').eq('is_featured', true).eq('is_available', true).order('created_at', { ascending: false }).limit(8),
  ])

  const s = settingsData?.value ?? {}
  const heroTitle: string = s.hero_title ?? '日韓美歐精選代購'
  const heroHighlight: string = s.hero_title_highlight ?? '精選代購'
  const heroSubtitle: string = s.hero_subtitle ?? '專業代購服務，讓您輕鬆取得全球限定商品，安全可靠直送到府'
  const heroBtnPrimary: string = s.hero_btn_primary ?? '立即選購'
  const featuredTitle: string = s.featured_title ?? '精選商品'
  const countries: Country[] = s.countries ?? []

  const titlePrefix = heroTitle.endsWith(heroHighlight)
    ? heroTitle.slice(0, heroTitle.length - heroHighlight.length)
    : heroTitle

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-[#1a1a1a] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]" />
        <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-8 text-center">
          <h1 className="text-xl md:text-3xl font-bold mb-2 leading-tight">
            {titlePrefix}<span className="text-[#e85d26]">{heroHighlight}</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mb-4 max-w-lg mx-auto">
            {heroSubtitle}
          </p>
          <Link href="/products" className="inline-block bg-[#e85d26] text-white px-10 py-3 rounded-full font-bold hover:bg-[#f47848] transition-colors text-base">
            全部商品
          </Link>
          {countries.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {countries.map((c) => (
                <Link
                  key={c.name}
                  href={c.link || `/products?country=${encodeURIComponent(c.name)}`}
                  className="bg-white/10 text-white text-xs px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  {c.flag} {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 精選商品 */}
      {featured && featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-4">
            <h2 className="text-base md:text-lg font-bold text-[#1a1a1a]">{featuredTitle}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {(featured as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
