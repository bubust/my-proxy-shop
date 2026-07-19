import { NextResponse } from 'next/server'

const SQL = `
CREATE TABLE IF NOT EXISTS public.coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percent')),
  value NUMERIC NOT NULL,
  min_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'service role full access'
  ) THEN
    CREATE POLICY "service role full access" ON public.coupons USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'migration complete' as result;
`

export async function GET() {
  const pat = process.env.SUPABASE_PAT
  if (!pat) return NextResponse.json({ error: 'SUPABASE_PAT not set' }, { status: 500 })

  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!ref) return NextResponse.json({ error: 'Cannot determine project ref' }, { status: 500 })

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data, ref }, { status: res.status })
  return NextResponse.json({ ok: true, result: data, ref })
}
