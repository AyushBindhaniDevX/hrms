-- ==============================================================================
-- ATTENDANCE REGULARIZATION
-- Lets employees request a correction to an attendance record (missed punch,
-- wrong time, wrong status). HR / admin review and, on approval, the change is
-- applied to the attendance table.
--
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_regularizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- The attendance row being corrected. May be NULL when no record exists yet
  -- (e.g. a completely missed day). Format of attendance.id is emp_id_YYYY-MM-DD.
  attendance_id TEXT REFERENCES public.attendance(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  requested_clock_in TIMESTAMPTZ,
  requested_clock_out TIMESTAMPTZ,
  requested_status attendance_status,
  reason TEXT NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending', -- reuse pending/approved/rejected/cancelled
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attreg_employee ON public.attendance_regularizations(employee_id);
CREATE INDEX IF NOT EXISTS idx_attreg_org ON public.attendance_regularizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_attreg_status ON public.attendance_regularizations(status);
CREATE INDEX IF NOT EXISTS idx_attreg_date ON public.attendance_regularizations(date);

-- Row Level Security — mirror the permissive Clerk-auth pattern used by the rest of the schema.
ALTER TABLE public.attendance_regularizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all select on attendance_regularizations" ON public.attendance_regularizations;
CREATE POLICY "Allow all select on attendance_regularizations" ON public.attendance_regularizations
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow all insert on attendance_regularizations" ON public.attendance_regularizations;
CREATE POLICY "Allow all insert on attendance_regularizations" ON public.attendance_regularizations
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on attendance_regularizations" ON public.attendance_regularizations;
CREATE POLICY "Allow all update on attendance_regularizations" ON public.attendance_regularizations
  FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all delete on attendance_regularizations" ON public.attendance_regularizations;
CREATE POLICY "Allow all delete on attendance_regularizations" ON public.attendance_regularizations
  FOR DELETE TO public USING (true);

-- Optional: live updates for HR approval queues
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_regularizations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
