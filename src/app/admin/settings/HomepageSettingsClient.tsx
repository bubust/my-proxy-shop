'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

type Step = { icon: string; title: string; desc: string }
type Country = { flag: string; name: string; link?: string }
type HomepageValue = {
  hero_title: string
  hero_title_highlight: string
  hero_subtitle: string
  hero_btn_primary: string
  hero_btn_secondary: string
  steps_title: string
  steps: Step[]
  featured_title: string
  countries: Country[]
}

export default function HomepageSettingsClient({ initialValue }: { initialValue: HomepageValue }) {
  const [v, setV] = useState<HomepageValue>(initialValue)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof HomepageValue, val: unknown) => setV(prev => ({ ...prev, [field]: val }))

  const updateStep = (i: number, field: keyof Step, val: string) =>
    set('steps', v.steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const updateCountry = (i: number, field: keyof Country, val: string) =>
    set('countries', v.countries.map((c, idx) => idx === i ? { ...c, [field]: val } : c))

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'homepage', value: v, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) { toast.error('儲存失敗：' + error.message); return }
    toast.success('首頁設定已儲存')
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]'
  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block'
  const sectionCls = 'bg-white rounded-xl border border-gray-100 p-5 space-y-4'

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Hero */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-[#1a1a1a]">Banner 區塊</h2>
        <div>
          <label className={labelCls}>主標題</label>
          <input className={inputCls} value={v.hero_title} onChange={e => set('hero_title', e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">橘色強調文字（從主標題結尾往前算）：</p>
          <input className={inputCls + ' mt-1'} value={v.hero_title_highlight} onChange={e => set('hero_title_highlight', e.target.value)} placeholder="例如：精選代購" />
        </div>
        <div>
          <label className={labelCls}>副標題</label>
          <textarea className={inputCls} rows={2} value={v.hero_subtitle} onChange={e => set('hero_subtitle', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>主要按鈕文字</label>
            <input className={inputCls} value={v.hero_btn_primary} onChange={e => set('hero_btn_primary', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>次要按鈕文字</label>
            <input className={inputCls} value={v.hero_btn_secondary} onChange={e => set('hero_btn_secondary', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Countries */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1a1a1a]">國家標籤</h2>
          <button onClick={() => set('countries', [...v.countries, { flag: '🌏', name: '新國家' }])}
            className="text-xs text-[#e85d26] flex items-center gap-1 hover:underline">
            <Plus size={13} /> 新增
          </button>
        </div>
        <div className="space-y-2">
          {v.countries.map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <input className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-[#e85d26]"
                  value={c.flag} onChange={e => updateCountry(i, 'flag', e.target.value)} />
                <input className={inputCls + ' flex-1'} placeholder="國家名稱" value={c.name} onChange={e => updateCountry(i, 'name', e.target.value)} />
                <button onClick={() => set('countries', v.countries.filter((_, idx) => idx !== i))}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-[#e85d26] ml-0"
                placeholder={`連結（預設：/products?country=${c.name || '日本'}）`}
                value={c.link ?? ''}
                onChange={e => updateCountry(i, 'link', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-[#1a1a1a]">流程步驟</h2>
        <div>
          <label className={labelCls}>區塊標題</label>
          <input className={inputCls} value={v.steps_title} onChange={e => set('steps_title', e.target.value)} />
        </div>
        <div className="space-y-4">
          {v.steps.map((step, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="text-xs font-medium text-gray-400">步驟 {i + 1}</div>
              <div className="flex gap-2">
                <input className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-[#e85d26]"
                  value={step.icon} onChange={e => updateStep(i, 'icon', e.target.value)} />
                <input className={inputCls + ' flex-1'} placeholder="標題" value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} />
              </div>
              <input className={inputCls} placeholder="說明文字" value={step.desc} onChange={e => updateStep(i, 'desc', e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Featured title */}
      <div className={sectionCls}>
        <h2 className="font-semibold text-[#1a1a1a]">精選商品區塊</h2>
        <div>
          <label className={labelCls}>區塊標題</label>
          <input className={inputCls} value={v.featured_title} onChange={e => set('featured_title', e.target.value)} />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50">
        {saving ? '儲存中…' : '儲存設定'}
      </button>
    </div>
  )
}
