import { createClient } from '@supabase/supabase-js'
import HomepageSettingsClient from './HomepageSettingsClient'
import GeneralSettingsClient from './GeneralSettingsClient'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function AdminSettingsPage() {
  const [{ data: homepageData }, { data: generalData }] = await Promise.all([
    adminClient.from('site_settings').select('value').eq('key', 'homepage').single(),
    adminClient.from('site_settings').select('value').eq('key', 'general').single(),
  ])
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">基本設定</h1>
        <GeneralSettingsClient initialValue={generalData?.value ?? {}} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">首頁設定</h1>
        <HomepageSettingsClient initialValue={homepageData?.value ?? {}} />
      </div>
    </div>
  )
}
