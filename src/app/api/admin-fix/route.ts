import { NextRequest, NextResponse } from 'next/server'

const SQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== 'fix-trigger-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.SUPABASE_PAT
  const projectRef = 'ouaoeyenwwlfupyhauux'
  const results: Record<string, unknown> = {}

  // 試多個端點
  for (const base of ['https://api.supabase.com', 'https://api.supabase.io']) {
    const url = `${base}/v1/projects/${projectRef}/database/query`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: SQL }),
      })
      const data = await res.json()
      results[base] = { status: res.status, data }
      if (res.ok) return NextResponse.json({ ok: true, endpoint: base, data })
    } catch (e) {
      results[base] = { error: String(e) }
    }
  }

  return NextResponse.json({ failed: true, results })
}
