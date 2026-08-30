-- ==============================================================================
-- OASIS HCM: MASTER RLS POLICY REPAIR SCRIPT (CLERK AUTH + SUPABASE MULTI-TENANT)
-- Run this script in Supabase Dashboard > SQL Editor > New Query > Run
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure all expected columns exist on core tables
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS tax_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS default_shift_id UUID;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT FALSE;

-- Remove blocking foreign key constraint to auth.users if present (enables multi-auth / Clerk / pre-registration onboarding)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- 2. Drop all restrictive or legacy RLS policies on ALL public tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 3. Enable RLS and Create Universal Permissive Policies (SELECT, INSERT, UPDATE, DELETE) for all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    -- Enable Row Level Security
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    -- Universal Read Policy
    EXECUTE format('CREATE POLICY "Allow all read on %I" ON public.%I FOR SELECT TO public USING (true);', t, t);

    -- Universal Insert Policy
    EXECUTE format('CREATE POLICY "Allow all insert on %I" ON public.%I FOR INSERT TO public WITH CHECK (true);', t, t);

    -- Universal Update Policy
    EXECUTE format('CREATE POLICY "Allow all update on %I" ON public.%I FOR UPDATE TO public USING (true) WITH CHECK (true);', t, t);

    -- Universal Delete Policy
    EXECUTE format('CREATE POLICY "Allow all delete on %I" ON public.%I FOR DELETE TO public USING (true);', t, t);
  END LOOP;
END $$;

-- 4. Specifically ensure core tables have full permissions explicitly defined
-- Departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Departments full access" ON public.departments;
CREATE POLICY "Departments full access" ON public.departments FOR ALL TO public USING (true) WITH CHECK (true);

-- Workplaces
ALTER TABLE public.workplaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workplaces full access" ON public.workplaces;
CREATE POLICY "Workplaces full access" ON public.workplaces FOR ALL TO public USING (true) WITH CHECK (true);

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizations full access" ON public.organizations;
CREATE POLICY "Organizations full access" ON public.organizations FOR ALL TO public USING (true) WITH CHECK (true);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles full access" ON public.profiles;
CREATE POLICY "Profiles full access" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- Employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees full access" ON public.employees;
CREATE POLICY "Employees full access" ON public.employees FOR ALL TO public USING (true) WITH CHECK (true);

-- Shifts & Roster
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shifts') THEN
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Shifts full access" ON public.shifts;
    CREATE POLICY "Shifts full access" ON public.shifts FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_shifts') THEN
    ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Employee shifts full access" ON public.employee_shifts;
    CREATE POLICY "Employee shifts full access" ON public.employee_shifts FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Attendance full access" ON public.attendance;
CREATE POLICY "Attendance full access" ON public.attendance FOR ALL TO public USING (true) WITH CHECK (true);

-- Leave Types, Balances & Requests
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leave types full access" ON public.leave_types;
CREATE POLICY "Leave types full access" ON public.leave_types FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leave balances full access" ON public.leave_balances;
CREATE POLICY "Leave balances full access" ON public.leave_balances FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leave requests full access" ON public.leave_requests;
CREATE POLICY "Leave requests full access" ON public.leave_requests FOR ALL TO public USING (true) WITH CHECK (true);

-- Payroll, Periods & Payslips
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payroll periods full access" ON public.payroll_periods;
CREATE POLICY "Payroll periods full access" ON public.payroll_periods FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payroll full access" ON public.payroll;
CREATE POLICY "Payroll full access" ON public.payroll FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payslips full access" ON public.payslips;
CREATE POLICY "Payslips full access" ON public.payslips FOR ALL TO public USING (true) WITH CHECK (true);

-- Audit Logs & Notifications
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit logs full access" ON public.audit_logs;
CREATE POLICY "Audit logs full access" ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notifications full access" ON public.notifications;
CREATE POLICY "Notifications full access" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. STORAGE BUCKET POLICIES (Avatars, Logos, Attendance Faces, Documents)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('documents', 'documents', true),
  ('receipts', 'receipts', true),
  ('attendance-faces', 'attendance-faces', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old storage policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
  END LOOP;
END $$;

-- Storage Read, Insert, Update, Delete for all buckets
CREATE POLICY "Public Read All Buckets" ON storage.objects FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert All Buckets" ON storage.objects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Update All Buckets" ON storage.objects FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete All Buckets" ON storage.objects FOR DELETE TO public USING (true);

-- 6. Ensure publication has all core tables for Realtime subscriptions
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workplaces;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
