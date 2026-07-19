import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  const amount = Number(req.nextUrl.searchParams.get('amount') ?? 0)

  if (!code) return NextResponse.json({ valid: false, error: '請輸入優惠碼' }, { status: 400 })

  const { data: coupon, error } = await client
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (error || !coupon) return NextResponse.json({ valid: false, error: '優惠碼不存在或已停用' }, { status: 400 })

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: '優惠碼已過期' }, { status: 400 })
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: '優惠碼已達使用上限' }, { status: 400 })
  }

  if (amount < coupon.min_amount) {
    return NextResponse.json({ valid: false, error: `消費滿 NT$ ${coupon.min_amount} 才可使用` }, { status: 400 })
  }

  let discount = 0
  if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, amount)
  } else {
    discount = Math.round(amount * coupon.value / 100)
  }

  return NextResponse.json({ valid: true, discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } })
}
