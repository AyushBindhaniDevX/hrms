import { supabase, isolatedAuthClient } from '@/lib/supabase';
import type { Organization, Profile, Department, Workplace } from '@/types';

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
  let query = supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as Profile[];
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
  default_shift_id?: string;
  manager_id?: string;
}): Promise<string> {
  // 0. Check Organization User Limit
  const orgId = params.organization_id || '00000000-0000-0000-0000-000000000001';
  const org = await getOrganization(orgId);
  const currentUsers = await getOrgUsers(orgId);
  const currentCount = currentUsers.filter(u => u.is_active).length; // Count active users

  const pkg = org?.package_type?.toLowerCase() || 'basic';
  const limit = pkg === 'gold' ? 250 : pkg === 'silver' ? 100 : 50;

  if (currentCount >= limit) {
    throw new Error(`User limit reached for ${pkg.toUpperCase()} package (${currentCount}/${limit} users). Please upgrade to add more.`);
  }

  // 1. Sign up user via isolated client so current admin session is NOT overwritten
  const { data: authData, error: authError } = await isolatedAuthClient.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        role: params.role,
        organization_id: orgId,
      },
    },
  });

  if (authError) {
    throw new Error(`Authentication Error: ${authError.message}`);
  }

  if (!authData.user?.id) {
    throw new Error('Failed to create user account. No ID returned from Auth.');
  }

  const uid = authData.user.id;

  // 2. Insert Profile
  const now = new Date().toISOString();
  const { error: profError } = await supabase.from('profiles').upsert({
    id: uid,
    full_name: params.full_name,
    email: params.email,
    role: params.role,
    organization_id: orgId,
    phone: params.phone || null,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  if (profError) {
    console.error('Failed to create profile row:', profError);
    throw new Error(`Failed to create profile: ${profError.message}`);
  }

  // 3. Create employee record if requested
  if (params.create_employee_record) {
    const { error: empError } = await supabase.from('employees').insert({
      profile_id: uid,
      employee_code: params.employee_code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      department_id: cleanUuid(params.department_id),
      designation: params.designation || (params.role === 'admin' ? 'Administrator' : params.role === 'hr' ? 'HR Manager' : 'Staff'),
      joining_date: params.joining_date || now.split('T')[0],
      workplace_id: cleanUuid(params.workplace_id),
      basic_salary: params.basic_salary || 0,
      default_shift_id: cleanUuid(params.default_shift_id),
      manager_id: cleanUuid(params.manager_id),
      employment_status: 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    });

    if (empError) {
      console.error('Failed to create employee row:', empError);
      throw new Error(`Failed to create employee record: ${empError.message}`);
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
