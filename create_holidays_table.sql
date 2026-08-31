-- ==============================================================================
-- 📅 SUBEDGE OASIS HRMS: CREATE HOLIDAYS TABLE & NOTIFY POSTGREST SCHEMA CACHE
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Create the holidays table if not exists
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'optional', 'restricted', 'company')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_org ON public.holidays(organization_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- 4. Create open RLS policies (accessible to public/authenticated)
DROP POLICY IF EXISTS "Allow all select on holidays" ON public.holidays;
CREATE POLICY "Allow all select on holidays" ON public.holidays FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow all insert on holidays" ON public.holidays;
CREATE POLICY "Allow all insert on holidays" ON public.holidays FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on holidays" ON public.holidays;
CREATE POLICY "Allow all update on holidays" ON public.holidays FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all delete on holidays" ON public.holidays;
CREATE POLICY "Allow all delete on holidays" ON public.holidays FOR DELETE TO public USING (true);

-- 5. Seed default 2026 National / Public Holidays
INSERT INTO public.holidays (name, date, type, description, is_recurring)
VALUES
  ('New Year''s Day', '2026-01-01', 'public', 'Global New Year Holiday', true),
  ('Republic Day', '2026-01-26', 'public', 'National Republic Day', true),
  ('Maha Shivratri', '2026-02-15', 'optional', 'Cultural Festival', true),
  ('Holi (Festival of Colors)', '2026-03-04', 'public', 'National Spring Festival', true),
  ('Eid al-Fitr', '2026-03-21', 'public', 'Islamic Festival', true),
  ('Good Friday', '2026-04-03', 'public', 'Christian Holiday', true),
  ('May Day / Labor Day', '2026-05-01', 'company', 'International Workers Day', true),
  ('Independence Day', '2026-08-15', 'public', 'National Independence Day', true),
  ('Raksha Bandhan', '2026-08-28', 'optional', 'Cultural Celebration', true),
  ('Gandhi Jayanti', '2026-10-02', 'public', 'National Holiday', true),
  ('Dussehra (Vijayadashami)', '2026-10-20', 'public', 'Victory of Good over Evil', true),
  ('Diwali (Deepavali)', '2026-11-08', 'public', 'Festival of Lights', true),
  ('Guru Nanak Jayanti', '2026-11-24', 'optional', 'Sikh Festival', true),
  ('Christmas Day', '2026-12-25', 'public', 'Christmas Celebration', true)
ON CONFLICT DO NOTHING;

-- 6. Reload PostgREST schema cache so the REST API endpoint /rest/v1/holidays responds immediately
NOTIFY pgrst, 'reload schema';
