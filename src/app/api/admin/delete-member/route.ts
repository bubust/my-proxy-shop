import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { targetId } = await request.json()
  if (!targetId) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  if (targetId === user.id) return NextResponse.json({ error: '不能刪除自己' }, { status: 400 })

  // 1. 訂單保留，但解除 user_id 關聯（避免 FK 衝突）
  const { error: ordersErr } = await adminClient
    .from('orders')
    .update({ user_id: null })
    .eq('user_id', targetId)
  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 })

  // 2. 明確刪除 profile
  const { error: profileErr } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', targetId)
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  // 3. 刪除 auth user
  const { error } = await adminClient.auth.admin.deleteUser(targetId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
