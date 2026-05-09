'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ShieldCheck, ShieldOff, KeyRound, Pencil, X, StickyNote, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

type MemberWithEmail = Profile & { email: string }

function EditModal({ member, onClose, onSave }: {
  member: MemberWithEmail
  onClose: () => void
  onSave: (updated: Partial<MemberWithEmail>) => void
}) {
  const [name, setName] = useState(member.name ?? '')
  const [phone, setPhone] = useState(member.phone ?? '')
  const [address, setAddress] = useState(member.address ?? '')
  const [adminNote, setAdminNote] = useState(member.admin_note ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: name || null,
      phone: phone || null,
      address: address || null,
      admin_note: adminNote || null,
    }).eq('id', member.id)
    setSaving(false)
    if (error) { toast.error('儲存失敗：' + error.message); return }
    toast.success('已更新')
    onSave({ name: name || null, phone: phone || null, address: address || null, admin_note: adminNote || null })
    onClose()
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]'
  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block'

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#1a1a1a]">編輯會員資料</h2>
            <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={labelCls}>姓名</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="會員姓名" />
          </div>
          <div>
            <label className={labelCls}>電話</label>
            <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="0912-345-678" />
          </div>
          <div>
            <label className={labelCls}>地址</label>
            <input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="收件地址" />
          </div>
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1">
                <StickyNote size={11} className="text-[#e85d26]" /> 備註（僅管理員可見）
              </span>
            </label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="例如：常購韓系服飾、VIP 客戶…"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
          >
            {saving ? '儲存中…' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminMembersClient({ initialMembers }: { initialMembers: MemberWithEmail[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [loading, setLoading] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editing, setEditing] = useState<MemberWithEmail | null>(null)

  const sendReset = async (member: MemberWithEmail) => {
    if (!confirm(`寄送重設密碼信給「${member.name ?? member.email}」（${member.email}）？`)) return
    setResetLoading(member.id)
    const res = await fetch('/api/admin/send-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: member.email }),
    })
    setResetLoading(null)
    if (!res.ok) { toast.error('寄送失敗'); return }
    toast.success('重設密碼信已寄出')
  }

  const toggleRole = async (member: MemberWithEmail) => {
    const newRole = member.role === 'admin' ? 'user' : 'admin'
    const label = newRole === 'admin' ? '設為管理員' : '取消管理員'
    if (!confirm(`確定將「${member.name ?? member.email}」${label}？`)) return

    setLoading(member.id)
    const res = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: member.id, role: newRole }),
    })
    setLoading(null)

    if (!res.ok) { toast.error('操作失敗'); return }
    setMembers(prev => prev.map(m => m.id === member.id ? ({ ...m, role: newRole } as MemberWithEmail) : m))
    toast.success(`已${label}`)
  }

  const deleteMember = async (member: MemberWithEmail) => {
    if (!confirm(`確定刪除會員「${member.name ?? member.email}」？\n此操作無法復原，訂單資料將保留。`)) return
    setDeleteLoading(member.id)
    const res = await fetch('/api/admin/delete-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: member.id }),
    })
    setDeleteLoading(null)
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? '刪除失敗'); return }
    setMembers(prev => prev.filter(m => m.id !== member.id))
    toast.success('會員已刪除')
  }

  const handleSave = (id: string, updated: Partial<MemberWithEmail>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m))
  }

  if (members.length === 0) {
    return <div className="text-center py-12 text-gray-400">尚無會員</div>
  }

  return (
    <>
      {editing && (
        <EditModal
          member={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => handleSave(editing.id, updated)}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">姓名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">帳號（Email）</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">電話</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">備註</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">角色</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">加入日期</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#e85d26]/20 text-[#e85d26] flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="font-medium text-[#1a1a1a]">{m.name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{m.email}</td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500">{m.phone ?? '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {m.admin_note
                    ? <span className="text-xs text-gray-500 max-w-[160px] truncate block" title={m.admin_note}>{m.admin_note}</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.role === 'admin' ? 'bg-[#e85d26]/10 text-[#e85d26]' : 'bg-gray-100 text-gray-600'}`}>
                    {m.role === 'admin' ? '管理員' : '會員'}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                  {format(new Date(m.created_at), 'yyyy/MM/dd')}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setEditing(m)}
                      title="編輯資料"
                      className="p-1.5 text-gray-400 hover:text-[#e85d26] hover:bg-[#e85d26]/10 rounded-lg transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => sendReset(m)}
                      disabled={resetLoading === m.id}
                      title="寄重設密碼信"
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      onClick={() => toggleRole(m)}
                      disabled={loading === m.id}
                      title={m.role === 'admin' ? '取消管理員' : '設為管理員'}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                        m.role === 'admin'
                          ? 'text-[#e85d26] hover:bg-[#e85d26]/10'
                          : 'text-gray-400 hover:text-[#e85d26] hover:bg-[#e85d26]/10'
                      }`}
                    >
                      {m.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                    </button>
                    <button
                      onClick={() => deleteMember(m)}
                      disabled={deleteLoading === m.id}
                      title="刪除會員"
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
