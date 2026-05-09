'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

type GeneralValue = {
  site_name: string
}

export default function GeneralSettingsClient({ initialValue }: { initialValue: Partial<GeneralValue> }) {
  const [siteName, setSiteName] = useState(initialValue.site_name ?? 'Snow Select | 日韓代購')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('site_settings').upsert({
      key: 'general',
      value: { site_name: siteName },
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { toast.error('儲存失敗：' + error.message); return }
    toast.success('設定已儲存，重新整理後生效')
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">網站名稱</label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#e85d26]"
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            placeholder="Snow Select | 日韓代購"
          />
          <p className="text-xs text-gray-400 mt-1">顯示於導覽列、頁尾與瀏覽器標籤</p>
        </div>
        <button
          onClick={save}
          disabled={saving || !siteName.trim()}
          className="w-full bg-[#e85d26] text-white py-3 rounded-xl font-semibold hover:bg-[#f47848] transition-colors disabled:opacity-50"
        >
          {saving ? '儲存中…' : '儲存設定'}
        </button>
      </div>
    </div>
  )
}
