import { createClient } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import AdminMembersClient from './AdminMembersClient'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function AdminMembersPage() {
  const [{ data: profiles }, { data: { users } }] = await Promise.all([
    adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email ?? '']))

  const members = (profiles as Profile[])?.map(p => ({
    ...p,
    email: emailMap[p.id] ?? '—',
  })) ?? []

  return (
    <div>
      <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">會員管理</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <AdminMembersClient initialMembers={members} />
      </div>
    </div>
  )
}
