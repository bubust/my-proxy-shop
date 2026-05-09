'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('請輸入有效 Email'),
  password: z.string().min(6, '密碼至少 6 個字元'),
})
const registerSchema = loginSchema.extend({
  name: z.string().min(2, '請輸入姓名'),
  phone: z.string().min(8, '請輸入電話號碼'),
  address: z.string().min(5, '請輸入收件地址'),
  confirmPassword: z.string().min(6, ''),
}).refine((d) => d.password === d.confirmPassword, { message: '密碼不一致', path: ['confirmPassword'] })

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })
  const [forgotEmail, setForgotEmail] = useState('')

  const handleLogin = async (data: LoginData) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
    setLoading(false)
    if (error) { toast.error('登入失敗：' + error.message); return }
    toast.success('登入成功！')
    router.push(redirect)
    router.refresh()
  }

  const handleRegister = async (data: RegisterData) => {
    setLoading(true)
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    })
    if (error) { setLoading(false); toast.error('註冊失敗：' + error.message); return }
    if (authData.user) {
      await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
        }),
      })
    }
    setLoading(false)
    toast.success('註冊成功！請確認您的 Email')
    setTab('login')
  }

  const handleForgot = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) { toast.error('發送失敗：' + error.message); return }
    toast.success('重置信已寄出，請查收 Email')
    setTab('login')
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🛍️</div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">代購商城</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tab !== 'forgot' && (
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'login' ? 'text-[#e85d26] border-b-2 border-[#e85d26]' : 'text-gray-500'}`}
            >
              登入
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'register' ? 'text-[#e85d26] border-b-2 border-[#e85d26]' : 'text-gray-500'}`}
            >
              註冊
            </button>
          </div>
        )}

        <div className="p-5">
          {/* Login */}
          {tab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                <input {...loginForm.register('email')} type="email" placeholder="your@email.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {loginForm.formState.errors.email && <p className="text-xs text-red-500 mt-0.5">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">密碼</label>
                <input {...loginForm.register('password')} type="password" placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {loginForm.formState.errors.password && <p className="text-xs text-red-500 mt-0.5">{loginForm.formState.errors.password.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50">
                {loading ? '登入中…' : '登入'}
              </button>
              <button type="button" onClick={() => setTab('forgot')} className="w-full text-center text-sm text-gray-500 hover:text-[#e85d26] transition-colors">
                忘記密碼？
              </button>
            </form>
          )}

          {/* Register */}
          {tab === 'register' && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-600">
                填寫電話與地址後，下單時將自動帶入收件資訊，不需每次重複填寫。
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">姓名</label>
                <input {...registerForm.register('name')} placeholder="王小明" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {registerForm.formState.errors.name && <p className="text-xs text-red-500 mt-0.5">{registerForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                <input {...registerForm.register('email')} type="email" placeholder="your@email.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {registerForm.formState.errors.email && <p className="text-xs text-red-500 mt-0.5">{registerForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">電話 <span className="text-red-400">*</span></label>
                <input {...registerForm.register('phone')} type="tel" placeholder="09xx-xxx-xxx" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {registerForm.formState.errors.phone && <p className="text-xs text-red-500 mt-0.5">{registerForm.formState.errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">收件地址 <span className="text-red-400">*</span></label>
                <input {...registerForm.register('address')} placeholder="縣市、區域、詳細地址" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {registerForm.formState.errors.address && <p className="text-xs text-red-500 mt-0.5">{registerForm.formState.errors.address.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">密碼</label>
                <input {...registerForm.register('password')} type="password" placeholder="至少 6 個字元" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {registerForm.formState.errors.password && <p className="text-xs text-red-500 mt-0.5">{registerForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">確認密碼</label>
                <input {...registerForm.register('confirmPassword')} type="password" placeholder="再輸入一次密碼" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
                {registerForm.formState.errors.confirmPassword && <p className="text-xs text-red-500 mt-0.5">{registerForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50">
                {loading ? '註冊中…' : '建立帳號'}
              </button>
            </form>
          )}

          {/* Forgot password */}
          {tab === 'forgot' && (
            <div>
              <h2 className="font-bold text-[#1a1a1a] mb-1">忘記密碼</h2>
              <p className="text-sm text-gray-500 mb-4">輸入您的 Email，我們將寄送重置連結</p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26] mb-3"
              />
              <button onClick={handleForgot} disabled={loading || !forgotEmail} className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50 mb-2">
                {loading ? '寄送中…' : '寄送重置信'}
              </button>
              <button onClick={() => setTab('login')} className="w-full text-center text-sm text-gray-500 hover:text-[#e85d26] transition-colors">
                返回登入
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
