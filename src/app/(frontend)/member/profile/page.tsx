'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const schema = z.object({
  name: z.string().min(2, '請輸入姓名'),
  phone: z.string().optional(),
  address: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) reset({ name: profile.name ?? '', phone: profile.phone ?? '', address: profile.address ?? '' })
    }
    init()
  }, [reset, router])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ name: data.name, phone: data.phone, address: data.address }).eq('id', user.id)
    setLoading(false)
    if (error) { toast.error('儲存失敗'); return }
    toast.success('個人資料已更新')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/member" className="text-gray-400 hover:text-gray-600">← 會員中心</Link>
        <h1 className="text-xl font-bold text-[#1a1a1a]">個人資料</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Email：</span>{userEmail}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">姓名 *</label>
            <input {...register('name')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">聯絡電話</label>
            <input {...register('phone')} placeholder="0912-345-678" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">常用地址</label>
            <textarea {...register('address')} rows={2} placeholder="台北市信義區..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26] resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50">
            {loading ? '儲存中…' : '儲存變更'}
          </button>
        </form>
      </div>
    </div>
  )
}
