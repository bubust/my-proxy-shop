import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileNav from '@/components/MobileNav'
import { getSiteName } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const siteName = await getSiteName()
  return (
    <>
      <Navbar siteName={siteName} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer siteName={siteName} />
      <MobileNav />
    </>
  )
}
