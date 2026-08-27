import { supabase, isolatedAuthClient } from '@/lib/supabase';
import type { Employee, Profile, Department, Workplace } from '@/types';

function cleanUuid(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

export async function getEmployeeByProfileId(profileId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      profile:profiles(*),
      department:departments(*),
      workplace:workplaces(*),
      manager:employees!employees_manager_id_fkey(*, profile:profiles(*))
    `)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error || !data) {
    // Fallback if join syntax differs
    const { data: simpleEmp } = await supabase
      .from('employees')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!simpleEmp) return null;

    const [profRes, deptRes, wpRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
      simpleEmp.department_id ? supabase.from('departments').select('*').eq('id', simpleEmp.department_id).maybeSingle() : Promise.resolve({ data: null }),
      simpleEmp.workplace_id ? supabase.from('workplaces').select('*').eq('id', simpleEmp.workplace_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    return {
      ...simpleEmp,
      profile: profRes.data as Profile,
      department: deptRes.data as Department,
      workplace: wpRes.data as Workplace,
    } as Employee;
  }

  return data as Employee;
}

export async function getEmployees(params?: {
  department_id?: string;
  workplace_id?: string;
  employment_status?: string;
  search?: string;
  organization_id?: string;
}): Promise<Employee[]> {
  const { department_id, workplace_id, employment_status, search, organization_id } = params || {};
  let query = supabase
    .from('employees')
    .select(`
      *,
      profile:profiles(*),
      department:departments(*),
      workplace:workplaces(*)
    `);

  if (department_id) query = query.eq('department_id', department_id);
  if (workplace_id) query = query.eq('workplace_id', workplace_id);
  if (employment_status) query = query.eq('employment_status', employment_status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];

  let results = data as Employee[];

  if (organization_id) {
    results = results.filter(
      (e) =>
        e.profile?.organization_id === organization_id ||
        e.workplace?.organization_id === organization_id ||
        e.department?.organization_id === organization_id
    );
  }

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(
      (e) =>
        e.profile?.full_name?.toLowerCase().includes(s) ||
        e.designation?.toLowerCase().includes(s) ||
        e.employee_code?.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function getDirectory(search?: string, departmentId?: string): Promise<Employee[]> {
  return getEmployees({
    employment_status: 'active',
    department_id: departmentId,
    search,
  });
}

export async function getAllEmployees(): Promise<Employee[]> {
  return getEmployees();
}

export async function createEmployee(params: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
  organization_id: string;
  employee_code: string;
  department_id?: string;
  manager_id?: string;
  designation?: string;
  basic_salary?: number;
  workplace_id?: string;
  default_shift_id?: string;
}): Promise<void> {
  const orgId = params.organization_id || '00000000-0000-0000-0000-000000000001';

  // 1. Sign up user via isolated client so current admin session is NOT overwritten
  let uid: string | null = null;
  const { data: authData, error: authError } = await isolatedAuthClient.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        role: params.role || 'employee',
        organization_id: orgId,
      },
    },
  });

  if (authError) {
    if (
      authError.message?.toLowerCase().includes('already registered') ||
      authError.message?.toLowerCase().includes('already exists') ||
      authError.status === 422
    ) {
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', params.email)
        .maybeSingle();

      if (existingProf?.id) {
        uid = existingProf.id;
      } else {
        throw new Error(`Authentication Error: ${authError.message}`);
      }
    } else {
      throw new Error(`Authentication Error: ${authError.message}`);
    }
  } else {
    uid = authData.user?.id || null;
  }

  if (!uid) {
    throw new Error('Failed to create or obtain user account ID.');
  }
  const now = new Date().toISOString();

  // 2. Create/update profile
  const { error: profError } = await supabase.from('profiles').upsert({
    id: uid,
    full_name: params.full_name,
    email: params.email,
    role: params.role || 'employee',
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

  // 3. Create employee
  const empPayload: Record<string, any> = {
    profile_id: uid,
    employee_code: params.employee_code,
    department_id: cleanUuid(params.department_id),
    manager_id: cleanUuid(params.manager_id),
    workplace_id: cleanUuid(params.workplace_id),
    default_shift_id: cleanUuid(params.default_shift_id),
    employment_status: 'active',
    designation: params.designation || null,
    basic_salary: params.basic_salary || 0,
    onboarding_completed: false,
    created_at: now,
    updated_at: now,
  };

  let empRecord: any = null;
  let { data: insData, error: empError } = await supabase
    .from('employees')
    .insert(empPayload)
    .select()
    .maybeSingle();

  if (empError && empError.code === 'PGRST204') {
    const missingColMatch = empError.message?.match(/Could not find the '([^']+)' column/);
    if (missingColMatch && missingColMatch[1]) {
      delete empPayload[missingColMatch[1]];
      const retry = await supabase.from('employees').insert(empPayload).select().maybeSingle();
      insData = retry.data;
      empError = retry.error;

      if (empError && empError.code === 'PGRST204') {
        const match2 = empError.message?.match(/Could not find the '([^']+)' column/);
        if (match2 && match2[1]) {
          delete empPayload[match2[1]];
          const retry2 = await supabase.from('employees').insert(empPayload).select().maybeSingle();
          insData = retry2.data;
          empError = retry2.error;
        }
      }
    }
  }

  if (empError) {
    console.error('Failed to create employee row:', empError);
    throw new Error(`Failed to create employee record: ${empError.message}`);
  }

  empRecord = insData;

  // Link initial shift to employee_shifts roster
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



  // Send Resend Welcome Notification
  try {
    const { sendWelcomeEmail } = await import('./resend');
    await sendWelcomeEmail(
      params.email,
      params.full_name || 'Team Member',
      params.employee_code,
      params.designation || 'Staff'
    );
  } catch (mailErr) {
    console.warn('Resend welcome notification dispatch warning:', mailErr);
  }
}

export async function updateEmployee(
  id: string,
  updates: Record<string, any>
): Promise<void> {
  const payload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
  
  if ('department_id' in payload) payload.department_id = cleanUuid(payload.department_id);
  if ('workplace_id' in payload) payload.workplace_id = cleanUuid(payload.workplace_id);
  if ('manager_id' in payload) payload.manager_id = cleanUuid(payload.manager_id);
  if ('default_shift_id' in payload) payload.default_shift_id = cleanUuid(payload.default_shift_id);

  let { error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id);

  if (error && error.code === 'PGRST204') {
    const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/);
    if (missingColMatch && missingColMatch[1]) {
      delete payload[missingColMatch[1]];
      const retry = await supabase.from('employees').update(payload).eq('id', id);
      error = retry.error;
    }
  }

  if (error) throw error;
}

export async function completeOnboarding(
  employeeId: string,
  profileId: string,
  data: {
    home_address: string;
    bank_details: { bank_name: string; account_number: string; routing_number: string };
    emergency_contact: { name: string; phone: string; relationship: string };
  },
  avatarUrl?: string
) {
  const now = new Date().toISOString();

  await supabase
    .from('employees')
    .update({
      ...data,
      onboarding_completed: true,
      updated_at: now,
    })
    .eq('id', employeeId);

  if (avatarUrl) {
    await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: now,
      })
      .eq('id', profileId);
  }
}

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as Department[];
}

export async function getDepartmentsWithStats(organizationId?: string): Promise<Department[]> {
  let deptQuery = supabase.from('departments').select('*').order('name', { ascending: true });
  if (organizationId) {
    deptQuery = deptQuery.eq('organization_id', organizationId);
  }

  const [deptRes, empRes] = await Promise.all([
    deptQuery,
    getEmployees(organizationId ? { organization_id: organizationId } : undefined),
  ]);

  const departments = (deptRes.data || []) as Department[];
  const employees = (empRes || []) as Employee[];

  for (const dept of departments) {
    const deptEmps = employees.filter((e) => e.department_id === dept.id);
    dept.employee_count = deptEmps.length;

    if (dept.manager_id) {
      dept.manager = employees.find((e) => e.id === dept.manager_id);
    }
  }

  return departments;
}

export async function createDepartment(params: {
  organization_id: string;
  name: string;
  description?: string;
  manager_id?: string | null;
}): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert({
      organization_id: params.organization_id,
      name: params.name,
      description: params.description || null,
      manager_id: params.manager_id || null,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Department;
}

export async function updateDepartment(
  id: string,
  updates: Partial<Pick<Department, 'name' | 'description' | 'manager_id'>>
): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateReportingManager(employeeId: string, managerId: string | null): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update({ manager_id: managerId, updated_at: new Date().toISOString() })
    .eq('id', employeeId);

  if (error) throw error;
}

export async function getOrgHierarchy(organizationId?: string): Promise<Employee[]> {
  const allEmployees = await getEmployees(organizationId ? { organization_id: organizationId } : undefined);

  const empMap = new Map<string, Employee>();
  for (const e of allEmployees) {
    e.direct_reports = [];
    empMap.set(e.id, e);
  }

  for (const e of allEmployees) {
    if (e.manager_id && empMap.has(e.manager_id)) {
      const manager = empMap.get(e.manager_id);
      if (manager) {
        manager.direct_reports = manager.direct_reports || [];
        manager.direct_reports.push(e);
      }
    }
  }

  return allEmployees;
}

export async function getWorkplaces(organizationId?: string): Promise<Workplace[]> {
  let query = supabase
    .from('workplaces')
    .select('*')
    .order('name', { ascending: true });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as Workplace[];
}

export async function createWorkplace(params: {
  organization_id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}): Promise<Workplace> {
  const { data, error } = await supabase
    .from('workplaces')
    .insert({
      ...params,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Workplace;
}

export async function updateWorkplace(id: string, updates: Partial<Workplace>): Promise<void> {
  const { error } = await supabase
    .from('workplaces')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function getEmployeeCount(organizationId?: string): Promise<number> {
  try {
    let profQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (organizationId) {
      profQuery = profQuery.eq('organization_id', organizationId);
    }

    const { count: profCount } = await profQuery;

    let empQuery = supabase
      .from('employees')
      .select('id, profile:profiles(organization_id)', { count: 'exact' })
      .eq('employment_status', 'active');

    const { data: emps, count: empCount } = await empQuery;

    if (organizationId && emps) {
      const filtered = emps.filter((e: any) => e.profile?.organization_id === organizationId);
      return Math.max(filtered.length, profCount || 0);
    }

    return Math.max(empCount || 0, profCount || 0);
  } catch (e) {
    const emps = await getEmployees(organizationId ? { organization_id: organizationId, employment_status: 'active' } : { employment_status: 'active' });
    return emps.length;
  }
}
