-- ==============================================================================
-- OASIS HRMS - MASTER SUPABASE SQL SCHEMA (MULTI-TENANT & FULL SUITE)
-- Run this entire script in your Supabase SQL Editor:
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & DOMAIN TYPES
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('employee', 'hr', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day', 'on_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payroll_status AS ENUM ('draft', 'processed', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payroll_period_status AS ENUM ('open', 'processing', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 3. CORE MULTI-TENANT & HR TABLES
-- ==============================================================================

-- 3.1 Organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  package_type TEXT DEFAULT 'basic',
  settings JSONB DEFAULT '{"currency": "INR", "timezone": "Asia/Kolkata", "geofence_radius_default": 150}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure package_type exists if table was already created
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'basic';

-- 3.2 Workplaces (Offices / Branches with Geofences)
CREATE TABLE IF NOT EXISTS public.workplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  radius_meters INT NOT NULL DEFAULT 150,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Profiles (Linked 1:1 with Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'HRMS User',
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  session_id TEXT,
  last_login_ip TEXT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Employees (Operational metadata & salary)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  workplace_id UUID REFERENCES public.workplaces(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  designation TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  basic_salary NUMERIC(12, 2) DEFAULT 0.00,
  employment_status employment_status DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  home_address TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circular FK for Department Manager
DO $$ BEGIN
  ALTER TABLE public.departments
  ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 4. SMART ATTENDANCE WITH GEOFENCING & BIOMETRICS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY, -- Format: emp_id_YYYY-MM-DD
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  workplace_id UUID REFERENCES public.workplaces(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  clock_in_latitude DOUBLE PRECISION,
  clock_in_longitude DOUBLE PRECISION,
  clock_out_latitude DOUBLE PRECISION,
  clock_out_longitude DOUBLE PRECISION,
  clock_in_verified BOOLEAN DEFAULT FALSE,
  clock_out_verified BOOLEAN DEFAULT FALSE,
  face_verified BOOLEAN DEFAULT FALSE,
  face_snapshot_url TEXT,
  working_minutes INT DEFAULT 0,
  overtime_minutes INT DEFAULT 0,
  status attendance_status DEFAULT 'present',
  breaks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. LEAVE MANAGEMENT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  annual_days INT NOT NULL DEFAULT 12,
  is_paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year INT NOT NULL,
  allocated_days NUMERIC(4, 1) NOT NULL DEFAULT 0,
  used_days NUMERIC(4, 1) NOT NULL DEFAULT 0,
  remaining_days NUMERIC(4, 1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4, 1) NOT NULL,
  is_half_day BOOLEAN DEFAULT FALSE,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. PAYROLL & COMPENSATION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  month INT NOT NULL,
  year INT NOT NULL,
  status payroll_period_status DEFAULT 'open',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  allowances JSONB DEFAULT '{}'::jsonb,
  deductions JSONB DEFAULT '{}'::jsonb,
  lop_days NUMERIC(4, 1) DEFAULT 0,
  lop_amount NUMERIC(12, 2) DEFAULT 0,
  gross_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status payroll_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payslip_number TEXT UNIQUE NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. EXPENSES, IT ASSETS & HELPDESK TICKETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  receipt_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  spent_at DATE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_tag TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  value NUMERIC(12, 2) DEFAULT 0,
  current_value NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'in_use',
  assigned_to TEXT,
  assigned_employee_name TEXT,
  warranty_expiry DATE,
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. PERFORMANCE, OKRS & KUDOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'company',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'in_progress',
  progress INT DEFAULT 0,
  start_date DATE,
  target_date DATE,
  key_results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appraisal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cycle_name TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'self_review',
  self_rating NUMERIC(3, 1),
  self_comments TEXT,
  self_submitted_at TIMESTAMPTZ,
  manager_rating NUMERIC(3, 1),
  manager_comments TEXT,
  manager_submitted_at TIMESTAMPTZ,
  overall_score NUMERIC(4, 1),
  recommendation TEXT,
  ratings_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. LEARNING & DOCUMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 60,
  modules_count INT DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT FALSE,
  instructor TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  enrolled_count INT DEFAULT 0,
  certificate_title TEXT,
  pass_percentage INT DEFAULT 80,
  curriculum JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  progress_percent INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_lesson_ids JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT FALSE,
  signatures_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_mins INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. AUDIT LOGS & NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id TEXT,
  "user" JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. SUPABASE AUTH USER PROVISIONING TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE
  default_org UUID;
  user_role_val user_role;
BEGIN
  -- 1. Ensure default organization exists
  SELECT id INTO default_org FROM public.organizations LIMIT 1;
  IF default_org IS NULL THEN
    INSERT INTO public.organizations (id, name, logo_url)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Corporation', NULL)
    RETURNING id INTO default_org;
  END IF;

  -- 2. Safely parse user role
  BEGIN
    user_role_val := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role_val := 'employee'::user_role;
  END;

  IF user_role_val IS NULL THEN
    user_role_val := 'employee'::user_role;
  END IF;

  -- 3. Upsert profile
  INSERT INTO public.profiles (
    id,
    organization_id,
    full_name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    default_org,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    user_role_val,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions across public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- 12. GEOFENCE CALCULATION HELPER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.validate_geofence(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  target_workplace_id UUID
)
RETURNS JSONB AS $$
DECLARE
  wp RECORD;
  dist_meters DOUBLE PRECISION;
  is_valid BOOLEAN;
BEGIN
  SELECT * INTO wp FROM public.workplaces WHERE id = target_workplace_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Workplace not found');
  END IF;

  -- Haversine formula (Earth radius: 6,371,000 meters)
  dist_meters := 6371000 * 2 * ASIN(
    SQRT(
      POWER(SIN(RADIANS(wp.latitude - user_lat) / 2), 2) +
      COS(RADIANS(user_lat)) * COS(RADIANS(wp.latitude)) *
      POWER(SIN(RADIANS(wp.longitude - user_lng) / 2), 2)
    )
  );

  is_valid := dist_meters <= wp.radius_meters;

  RETURN jsonb_build_object(
    'valid', is_valid,
    'distance_meters', ROUND(dist_meters::numeric, 1),
    'workplace_name', wp.name,
    'allowed_radius', wp.radius_meters
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 13. STORAGE BUCKETS (AVATARS, LOGOS, RECEIPTS, FACIAL BIOMETRICS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('documents', 'documents', false),
  ('receipts', 'receipts', false),
  ('attendance-faces', 'attendance-faces', false)
ON CONFLICT (id) DO NOTHING;

-- Public Storage Read Policies (with DROP IF EXISTS for safe re-runs)
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Read Logos" ON storage.objects;
CREATE POLICY "Public Read Logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Auth Users Upload Storage" ON storage.objects;
CREATE POLICY "Auth Users Upload Storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Users Update Storage" ON storage.objects;
CREATE POLICY "Auth Users Update Storage" ON storage.objects FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth Users Delete Storage" ON storage.objects;
CREATE POLICY "Auth Users Delete Storage" ON storage.objects FOR DELETE TO authenticated USING (true);

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read organizations (e.g. for login page org selection)
DROP POLICY IF EXISTS "Allow anon select on organizations" ON public.organizations;
CREATE POLICY "Allow anon select on organizations" ON public.organizations FOR SELECT TO anon USING (true);

-- Standard Public/Authenticated Access Policies for seamless operations
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated select on %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Allow authenticated select on %I" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated insert on %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Allow authenticated insert on %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated update on %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Allow authenticated update on %I" ON public.%I FOR UPDATE TO authenticated USING (true)', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated delete on %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Allow authenticated delete on %I" ON public.%I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- Enable Realtime for live updates (wrapped safely for re-runs)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ==============================================================================
-- 15. SEED DATA (DEFAULT TENANT, OFFICES, DEPARTMENTS, LEAVE TYPES)
-- ==============================================================================
-- ==============================================================================
INSERT INTO public.organizations (id, name, slug, logo_url, package_type, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Acme Corporation',
  'acme',
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80',
  'gold',
  '{"currency": "INR", "timezone": "Asia/Kolkata", "geofence_radius_default": 150}'::jsonb
),
(
  '00000000-0000-0000-0000-000000000002',
  'Shanti Memorial Hospital',
  'shanti-memorial-hospital',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Hospital_sign.svg/1024px-Hospital_sign.svg.png',
  'silver',
  '{"currency": "INR", "timezone": "Asia/Kolkata", "geofence_radius_default": 150, "domain": "shantimemorialhospital.com"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  logo_url = EXCLUDED.logo_url,
  package_type = EXCLUDED.package_type,
  settings = EXCLUDED.settings;

INSERT INTO public.workplaces (id, organization_id, name, address, latitude, longitude, radius_meters)
VALUES 
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Headquarters - Office 1', 'Subedge Tech Park, Outer Ring Rd, Bengaluru', 12.9716, 77.5946, 200),
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Downtown Branch - Office 2', 'Connaught Place, New Delhi', 28.6139, 77.2090, 150),
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000002', 'Main Campus', 'Shanti Nagar, Mumbai', 19.0760, 72.8777, 300)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, organization_id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'Engineering', 'Software & Hardware development'),
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000001', 'Human Resources', 'HR & Administration'),
  ('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000002', 'Administration', 'Hospital Administration')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.leave_types (organization_id, name, annual_days, is_paid)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Annual Leave', 18, true),
  ('00000000-0000-0000-0000-000000000001', 'Sick Leave', 12, true),
  ('00000000-0000-0000-0000-000000000001', 'Casual Leave', 7, true),
  ('00000000-0000-0000-0000-000000000001', 'Maternity Leave', 90, true),
  ('00000000-0000-0000-0000-000000000001', 'Paternity Leave', 7, true),
  ('00000000-0000-0000-0000-000000000001', 'Compensatory Leave', 5, true)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 16. PRIMARY ADMIN ACCOUNT CREATION (ayushbindhani001@gmail.com / Nanda@5152)
-- ==============================================================================
DELETE FROM auth.users WHERE email = 'ayushbindhani001@gmail.com' AND id <> 'a0000000-0000-0000-0000-000000000001';

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'ayushbindhani001@gmail.com',
  crypt('Nanda@5152', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Ayush Bindhani","role":"admin","organization_id":"00000000-0000-0000-0000-000000000001"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  FALSE,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = crypt('Nanda@5152', gen_salt('bf')),
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = NOW();

INSERT INTO public.profiles (
  id,
  organization_id,
  full_name,
  email,
  role,
  is_active
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002', -- Shanti Memorial Hospital
  'Ayush Bindhani',
  'ayushbindhani001@gmail.com',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  organization_id = '00000000-0000-0000-0000-000000000002',
  full_name = 'Ayush Bindhani',
  is_active = true;

-- Ensure no orphaned employee record blocks this insert
DELETE FROM public.employees WHERE employee_code = 'ADM-001' AND profile_id <> 'a0000000-0000-0000-0000-000000000001';

INSERT INTO public.employees (
  profile_id,
  employee_code,
  designation,
  workplace_id,
  department_id,
  basic_salary,
  employment_status,
  onboarding_completed
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'ADM-001',
  'Principal Administrator & Architect',
  '00000000-0000-0000-0000-000000000030', -- Shanti Workplace
  '00000000-0000-0000-0000-000000000300', -- Shanti Department
  250000,
  'active',
  true
)
ON CONFLICT (profile_id) DO NOTHING;

-- Fix for Supabase 500 Database error querying schema (missing identity)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001', -- For email provider, provider_id should be the UUID
  format('{"sub":"%s","email":"%s"}', 'a0000000-0000-0000-0000-000000000001', 'ayushbindhani001@gmail.com')::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Enable RLS and public access for organizations so login screen can read branding
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Organizations are publicly readable" 
    ON public.organizations 
    FOR SELECT 
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Complete!
