import { supabase } from '@/lib/supabase';
import type { Organization, Profile, Department, Workplace } from '@/types';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function cleanUuid(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Organization;
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId);

  if (error) throw error;
}

export async function getOrgUsers(organizationId?: string): Promise<Profile[]> {
  try {
    let query = supabase
      .from('profiles')
      .select('*, employee:employees(*, department:departments!employees_department_id_fkey(*), workplace:workplaces(*))')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (!error && data) {
      return data as Profile[];
    }

    let fallbackQuery = supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true })
      .order('full_name', { ascending: true });

    if (organizationId) {
      fallbackQuery = fallbackQuery.eq('organization_id', organizationId);
    }

    const { data: fallbackData } = await fallbackQuery;
    return (fallbackData || []) as Profile[];
  } catch (err) {
    console.error('getOrgUsers error:', err);
    return [];
  }
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;

  try {
    const { createAuditLog } = await import('./audit');
    await createAuditLog('user_role_updated', 'profile', userId, { new_role: role });
  } catch (e) {}
}

export async function updateUserProfileData(
  userId: string,
  data: { full_name?: string; phone?: string | null; role?: string }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;

  try {
    const { createAuditLog } = await import('./audit');
    await createAuditLog('user_profile_updated', 'profile', userId, data);
  } catch (e) {}
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;

  try {
    const { createAuditLog } = await import('./audit');
    await createAuditLog(
      isActive ? 'user_account_activated' : 'user_account_deactivated',
      'profile',
      userId,
      { is_active: isActive }
    );
  } catch (e) {}
}

export async function deleteUserRecord(userId: string): Promise<void> {
  // Delete linked employee records
  await supabase.from('employees').delete().eq('profile_id', userId);
  // Delete from profiles
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;

  try {
    const { createAuditLog } = await import('./audit');
    await createAuditLog('user_account_deleted', 'profile', userId);
  } catch (e) {}
}

export async function createSystemUser(params: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'hr' | 'employee';
  organization_id: string;
  phone?: string;
  create_employee_record?: boolean;
  employee_code?: string;
  department_id?: string;
  designation?: string;
  joining_date?: string;
  workplace_id?: string;
  basic_salary?: number;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern' | string;
  default_shift_id?: string;
  manager_id?: string;
  epf_percentage?: number | string;
  socso_percentage?: number | string;
  tax_percentage?: number | string;
  tax_regime?: string;
  hra_percentage?: number | string;
  transport_allowance?: number;
  other_allowances?: number;
  tax_config?: Record<string, any>;
}): Promise<string> {
  // 0. Check Organization User Limit
  let orgId = params.organization_id;
  if (!orgId) {
    const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
    orgId = defaultOrg?.id;
  }
  const org = orgId ? await getOrganization(orgId) : null;
  const currentUsers = orgId ? await getOrgUsers(orgId) : [];
  const currentCount = currentUsers.filter(u => u.is_active).length; // Count active users

  const pkg = org?.package_type?.toLowerCase() || 'basic';
  const limit = pkg === 'gold' ? 250 : pkg === 'silver' ? 100 : 50;

  if (currentCount >= limit) {
    throw new Error(`User limit reached for ${pkg.toUpperCase()} package (${currentCount}/${limit} users). Please upgrade to add more.`);
  }

  // 1. Check if user already exists in profiles or register in Supabase Auth
  let uid: string = '';
  const cleanEmail = params.email.trim().toLowerCase();

  const { data: existingProf } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existingProf?.id) {
    uid = existingProf.id;
  } else {
    // Register user account in Supabase Auth
    try {
      const defaultPassword = params.password || (params.phone ? `Pass@${params.phone.slice(-4)}` : 'Welcome@123');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: defaultPassword,
        options: {
          data: {
            full_name: params.full_name,
            role: params.role,
            organization_id: orgId,
          },
        },
      });

      if (authData?.user?.id) {
        uid = authData.user.id;
      }
    } catch (authErr) {
      console.warn('Supabase Auth pre-registration notice:', authErr);
    }

    if (!uid) {
      uid = generateUuid();
    }
  }

  // 2. Insert Profile
  const now = new Date().toISOString();
  const profPayload: Record<string, any> = {
    id: uid,
    full_name: params.full_name,
    email: cleanEmail,
    role: params.role,
    organization_id: orgId,
    phone: params.phone || null,
    is_active: true,
    needs_password_change: true,
    created_at: now,
    updated_at: now,
  };

  let { error: profError } = await supabase.from('profiles').upsert(profPayload);
  if (profError && profError.code === 'PGRST204') {
    delete profPayload.needs_password_change;
    const retry = await supabase.from('profiles').upsert(profPayload);
    profError = retry.error;
  }

  if (profError) {
    console.error('Failed to create profile row:', profError);
    if (profError.message?.includes('profiles_id_fkey')) {
      throw new Error("Database Foreign Key constraint 'profiles_id_fkey' is preventing profile creation. Please run 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;' in Supabase SQL editor.");
    }
    throw new Error(`Failed to create profile: ${profError.message}`);
  }

  // 3. Create employee record if requested
  if (params.create_employee_record) {
    const taxConfig = {
      ...(params.tax_config || {}),
      epf_percentage: params.epf_percentage != null ? Number(params.epf_percentage) : 12,
      socso_percentage: params.socso_percentage != null ? Number(params.socso_percentage) : 0.5,
      tax_percentage: params.tax_percentage != null ? Number(params.tax_percentage) : 5,
      tds_percentage: params.tax_percentage != null ? Number(params.tax_percentage) : 5,
      tax_regime: params.tax_regime || 'custom',
      hra_percentage: params.hra_percentage != null ? Number(params.hra_percentage) : 40,
      transport_allowance: params.transport_allowance || 0,
      other_allowances: params.other_allowances || 0,
    };

    const empPayload: Record<string, any> = {
      profile_id: uid,
      organization_id: orgId,
      employee_code: params.employee_code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department_id: cleanUuid(params.department_id),
      designation: params.designation || (params.role === 'admin' ? 'Administrator' : params.role === 'hr' ? 'HR Manager' : 'Staff'),
      employment_type: params.employment_type || 'full_time',
      joining_date: params.joining_date || now.split('T')[0],
      workplace_id: cleanUuid(params.workplace_id),
      basic_salary: params.basic_salary || 0,
      default_shift_id: cleanUuid(params.default_shift_id),
      manager_id: cleanUuid(params.manager_id),
      tax_config: taxConfig,
      employment_status: 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    };

    let empRecord: any = null;
    let attempts = 0;
    while (attempts < 6) {
      attempts++;
      const { data: insData, error: empError } = await supabase
        .from('employees')
        .insert(empPayload)
        .select()
        .maybeSingle();

      if (!empError) {
        empRecord = insData;
        break;
      }

      if (empError.code === 'PGRST204' || empError.message?.includes('schema cache')) {
        const missingColMatch = empError.message?.match(/Could not find the '([^']+)' column/);
        if (missingColMatch && missingColMatch[1]) {
          delete empPayload[missingColMatch[1]];
          continue;
        }
      }

      console.error('Failed to create employee row:', empError);
      throw new Error(`Failed to create employee record: ${empError.message}`);
    }

    // If shift was selected, also link in employee_shifts for roster
    if (params.default_shift_id && empRecord?.id) {
      try {
        const today = now.split('T')[0];
        await supabase.from('employee_shifts').upsert({
          id: `${empRecord.id}_${today}`,
          employee_id: empRecord.id,
          date: today,
          shift_id: cleanUuid(params.default_shift_id),
          organization_id: orgId,
          created_at: now,
        });
      } catch (e) {
        console.warn('Could not assign initial employee shift:', e);
      }
    }
  }

  try {
    const { createAuditLog } = await import('./audit');
    await createAuditLog('user_account_created', 'profile', uid, {
      full_name: params.full_name,
      email: params.email,
      role: params.role,
      has_employee_record: !!params.create_employee_record,
    });
  } catch (e) {}

  // Send Resend Welcome / Onboarding invitation email
  try {
    const { sendWelcomeEmail } = await import('./resend');
    await sendWelcomeEmail(
      params.email,
      params.full_name || 'Team Member',
      params.employee_code || 'EMP-ACCESS',
      params.role === 'admin' ? 'Administrator' : params.role === 'hr' ? 'HR Manager' : 'Employee'
    );
  } catch (mailErr) {
    console.warn('Welcome notification dispatch warning:', mailErr);
  }

  return uid;
}

export async function createDepartment(orgId: string, name: string, description: string): Promise<string> {
  const { data, error } = await supabase
    .from('departments')
    .insert({
      organization_id: orgId,
      name,
      description,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function createWorkplace(
  orgId: string,
  name: string,
  address: string,
  latitude: number,
  longitude: number,
  radiusMeters: number
): Promise<string> {
  const { data, error } = await supabase
    .from('workplaces')
    .insert({
      organization_id: orgId,
      name,
      address,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
