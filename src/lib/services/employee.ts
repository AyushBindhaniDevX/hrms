import { supabase } from '@/lib/supabase';
import type { Employee, Profile, Department, Workplace } from '@/types';

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

export async function getEmployeeByProfileId(profileId: string): Promise<Employee | null> {
  try {
    let { data: simpleEmp, error } = await supabase
      .from('employees')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    // Auto-provision an employee record if user has a profile but no employee row yet
    if (!simpleEmp) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (prof) {
        const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
        const { data: newEmp } = await supabase
          .from('employees')
          .insert({
            profile_id: prof.id,
            employee_code: empCode,
            designation: prof.role === 'admin' ? 'System Administrator' : prof.role === 'hr' ? 'HR Manager' : 'Team Member',
            employment_status: 'active',
            joining_date: new Date().toISOString().split('T')[0],
          })
          .select('*')
          .maybeSingle();

        if (newEmp) {
          simpleEmp = newEmp;
        }
      }
    }

    if (!simpleEmp) return null;

    const [profRes, deptRes, wpRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
      simpleEmp.department_id
        ? supabase.from('departments').select('*').eq('id', simpleEmp.department_id).maybeSingle()
        : Promise.resolve({ data: null }),
      simpleEmp.workplace_id
        ? supabase.from('workplaces').select('*').eq('id', simpleEmp.workplace_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      ...simpleEmp,
      profile: (profRes.data || undefined) as Profile,
      department: (deptRes.data || undefined) as Department,
      workplace: (wpRes.data || undefined) as Workplace,
    } as Employee;
  } catch (err) {
    console.error('Error fetching employee by profile ID:', err);
    return null;
  }
}

export async function getEmployees(params?: {
  department_id?: string;
  workplace_id?: string;
  employment_status?: string;
  search?: string;
  organization_id?: string;
}): Promise<Employee[]> {
  const { department_id, workplace_id, employment_status, search, organization_id } = params || {};
  
  // 1. Fetch existing employees from database
  let query = supabase
    .from('employees')
    .select(`
      *,
      profile:profiles(*),
      department:departments!employees_department_id_fkey(*),
      workplace:workplaces(*)
    `);

  if (department_id) query = query.eq('department_id', department_id);
  if (workplace_id) query = query.eq('workplace_id', workplace_id);
  if (employment_status) query = query.eq('employment_status', employment_status);

  const { data, error } = await query.order('created_at', { ascending: false });
  let existingEmps: Employee[] = (!error && data) ? (data as Employee[]) : [];

  // 2. Fetch all active profiles to ensure any registered user has an employee record
  try {
    let profQuery = supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true);

    if (organization_id) {
      profQuery = profQuery.eq('organization_id', organization_id);
    }

    const { data: activeProfiles } = await profQuery;

    if (activeProfiles && activeProfiles.length > 0) {
      const existingProfileIds = new Set(existingEmps.map(e => e.profile_id || (e.profile as any)?.id));
      
      for (const prof of activeProfiles) {
        if (!existingProfileIds.has(prof.id)) {
          const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
          const targetOrgId = prof.organization_id || organization_id;
          
          try {
            const { data: newEmp } = await supabase
              .from('employees')
              .insert({
                profile_id: prof.id,
                employee_code: empCode,
                designation: prof.role === 'admin' ? 'System Administrator' : prof.role === 'hr' ? 'HR Manager' : 'Team Member',
                employment_status: 'active',
                joining_date: new Date().toISOString().split('T')[0],
                basic_salary: 35000,
              })
              .select(`
                *,
                profile:profiles(*),
                department:departments!employees_department_id_fkey(*),
                workplace:workplaces(*)
              `)
              .maybeSingle();

            if (newEmp) {
              existingEmps.push(newEmp as Employee);
            } else {
              existingEmps.push({
                id: prof.id,
                profile_id: prof.id,
                organization_id: targetOrgId || '',
                employee_code: empCode,
                designation: prof.role === 'admin' ? 'System Administrator' : prof.role === 'hr' ? 'HR Manager' : 'Team Member',
                employment_status: 'active',
                joining_date: new Date().toISOString().split('T')[0],
                basic_salary: 35000,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                profile: prof,
              } as unknown as Employee);
            }
          } catch {
            existingEmps.push({
              id: prof.id,
              profile_id: prof.id,
              organization_id: targetOrgId || '',
              employee_code: empCode,
              designation: prof.role === 'admin' ? 'System Administrator' : prof.role === 'hr' ? 'HR Manager' : 'Team Member',
              employment_status: 'active',
              joining_date: new Date().toISOString().split('T')[0],
              basic_salary: 35000,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              profile: prof,
            } as unknown as Employee);
          }
          existingProfileIds.add(prof.id);
        }
      }
    }
  } catch (profErr) {
    console.warn('Error syncing active profiles in getEmployees:', profErr);
  }

  let results = existingEmps;

  if (organization_id) {
    results = results.filter(
      (e) =>
        e.organization_id === organization_id ||
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
        e.employee_code?.toLowerCase().includes(s) ||
        e.profile?.email?.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function getDirectory(search?: string, departmentId?: string, organizationId?: string): Promise<Employee[]> {
  const emps = await getEmployees({
    department_id: departmentId,
    search,
    organization_id: organizationId,
  });

  // Include all non-terminated employees in directory
  return emps.filter(e => e.employment_status !== 'terminated');
}

export async function getAllEmployees(organizationId?: string): Promise<Employee[]> {
  return getEmployees(organizationId ? { organization_id: organizationId } : undefined);
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
  tax_config?: {
    pf_number?: string | null;
    tax_regime?: 'old' | 'new' | 'custom' | string;
    tds_percentage?: number | null;
    epf_percentage?: number | null;
    pt_amount?: number | null;
    hra_percentage?: number | null;
    custom_tax_percentage?: number | null;
    esop_value?: number | null;
    hra_type?: 'metro' | 'non-metro' | 'custom';
    epf_exempt?: boolean;
  } | null;
}): Promise<void> {
  let orgId = params.organization_id;
  if (!orgId) {
    const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
    orgId = defaultOrg?.id;
  }

  // 1. Check if profile exists by email or generate new profile identifier
  let uid: string = '';
  const { data: existingProf } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', params.email)
    .maybeSingle();

  if (existingProf?.id) {
    uid = existingProf.id;
  } else {
    uid = generateUuid();
  }

  const now = new Date().toISOString();

  // 2. Create/update profile
  const profPayload: Record<string, any> = {
    id: uid,
    full_name: params.full_name,
    email: params.email,
    role: params.role || 'employee',
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
    throw new Error(`Failed to create profile: ${profError.message}`);
  }

  // 3. Create employee
  const empPayload: Record<string, any> = {
    profile_id: uid,
    organization_id: orgId,
    employee_code: params.employee_code,
    department_id: cleanUuid(params.department_id),
    manager_id: cleanUuid(params.manager_id),
    workplace_id: cleanUuid(params.workplace_id),
    default_shift_id: cleanUuid(params.default_shift_id),
    employment_status: 'active',
    designation: params.designation || null,
    basic_salary: params.basic_salary || 0,
    tax_config: params.tax_config || null,
    onboarding_completed: false,
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

  let attempts = 0;
  while (attempts < 6) {
    attempts++;
    const { error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', id);

    if (!error) return;

    if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
      const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/);
      if (missingColMatch && missingColMatch[1]) {
        delete payload[missingColMatch[1]];
        continue;
      }
    }

    throw error;
  }
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

export async function getDepartments(organizationId?: string): Promise<Department[]> {
  try {
    let query = supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback: fetch all available departments to prevent UI lockout
      const { data: fallbackData } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      return (fallbackData || []) as Department[];
    }

    return data as Department[];
  } catch (err) {
    console.error('getDepartments error:', err);
    return [];
  }
}

export async function getDepartmentsWithStats(organizationId?: string): Promise<Department[]> {
  try {
    let deptQuery = supabase.from('departments').select('*').order('name', { ascending: true });
    if (organizationId) {
      deptQuery = deptQuery.eq('organization_id', organizationId);
    }

    const [deptRes, empRes] = await Promise.all([
      deptQuery,
      getEmployees(organizationId ? { organization_id: organizationId } : undefined),
    ]);

    let departments = (deptRes.data || []) as Department[];
    if (departments.length === 0 && organizationId) {
      const { data: allDepts } = await supabase.from('departments').select('*').order('name', { ascending: true });
      departments = (allDepts || []) as Department[];
    }
    const employees = (empRes || []) as Employee[];

    for (const dept of departments) {
      const deptEmps = employees.filter((e) => e.department_id === dept.id);
      dept.employee_count = deptEmps.length;

      if (dept.manager_id) {
        dept.manager = employees.find((e) => e.id === dept.manager_id);
      }
    }

    return departments;
  } catch (err) {
    console.error('getDepartmentsWithStats error:', err);
    return [];
  }
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
  try {
    let query = supabase
      .from('workplaces')
      .select('*')
      .order('name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      const { data: fallbackWps } = await supabase
        .from('workplaces')
        .select('*')
        .order('name', { ascending: true });

      return (fallbackWps || []) as Workplace[];
    }

    return data as Workplace[];
  } catch (err) {
    console.error('getWorkplaces error:', err);
    return [];
  }
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
