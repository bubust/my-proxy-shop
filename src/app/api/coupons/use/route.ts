import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ ok: false }, { status: 400 })

  const { data: coupon } = await client.from('coupons').select('id, used_count').eq('code', code.toUpperCase()).single()
  if (!coupon) return NextResponse.json({ ok: false }, { status: 404 })

  await client.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id)
  return NextResponse.json({ ok: true })
}
