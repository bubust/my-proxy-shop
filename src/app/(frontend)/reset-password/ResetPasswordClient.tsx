'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 先檢查是否已有 session（PKCE 流程：callback route 已完成 code exchange）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // 相容舊版 implicit 流程（URL hash 帶 access_token）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('密碼至少 6 個字元'); return }
    if (password !== confirm) { toast.error('兩次密碼不一致'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { toast.error('更新失敗：' + error.message); return }
    toast.success('密碼已更新，請重新登入')
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">🔑</div>
        <p className="text-gray-500 text-sm">驗證連結中…</p>
        <p className="text-gray-400 text-xs mt-2">如果長時間無反應，請重新申請重設密碼。</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🔑</div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">設定新密碼</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">新密碼</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">確認新密碼</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="再輸入一次"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
          >
            {loading ? '更新中…' : '確認更新密碼'}
          </button>
        </form>
      </div>
    </div>
  )
}
