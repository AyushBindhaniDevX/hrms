import { supabase } from '@/lib/supabase';
import { triggerAutomationEvent } from '@/lib/services/automations';
import { trackUserActivity } from '@/lib/services/userActivity';
import type { Profile, UserRole, Organization, Employee } from '@/types';

export const CLERK_ORG_ID = 'org_3IbggHa7ecDbMpzRHMooxpMJFvb';

export const CLERK_ROLE_MAP: Record<string, UserRole> = {
  'org:admin': 'admin',
  'org:hr': 'hr',
  'org:member': 'employee',
  'admin': 'admin',
  'hr': 'hr',
  'member': 'employee',
  'basic_member': 'employee',
};

/**
 * Maps a Clerk organization role key to internal HCM UserRole
 * (e.g. 'org:admin' -> 'admin', 'org:hr' -> 'hr', 'org:member' -> 'employee')
 */
export function mapClerkRoleToUserRole(clerkRole?: string | null): UserRole {
  if (!clerkRole) return 'employee';
  const normalized = clerkRole.toLowerCase().trim();
  return CLERK_ROLE_MAP[normalized] || (normalized.includes('admin') ? 'admin' : normalized.includes('hr') ? 'hr' : 'employee');
}

/**
 * Synchronizes Clerk Organization info (Name, Slug, and Logo) into Supabase by comparing the Organization Slug
 */
export async function syncClerkOrgToDatabase(clerkOrg?: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
}): Promise<Organization | null> {
  const orgId = clerkOrg?.id;
  const rawSlug = clerkOrg?.slug?.toLowerCase().trim() || null;
  const orgName = clerkOrg?.name || (rawSlug ? rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1) : 'Subedge Technology Pvt Ltd');
  const orgLogo = clerkOrg?.imageUrl || null;

  try {
    let existingOrg: any = null;

    // 1. PRIMARY MATCH: Compare slug with Supabase organizations.slug (case-insensitive)
    if (rawSlug) {
      const { data: orgBySlug } = await supabase
        .from('organizations')
        .select('*')
        .ilike('slug', rawSlug)
        .limit(1)
        .maybeSingle();

      if (orgBySlug) {
        existingOrg = orgBySlug;
      }
    }

    // 2. SECONDARY MATCH: Compare by Clerk Org ID or settings->clerk_org_id
    if (!existingOrg && orgId) {
      const { data: orgById } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();

      if (orgById) {
        existingOrg = orgById;
      }
    }

    // 3. TERTIARY MATCH: If slug was null, check default org or existing orgs
    if (!existingOrg && !rawSlug) {
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (defaultOrg) {
        existingOrg = defaultOrg;
      }
    }

    const now = new Date().toISOString();
    const finalSlug = existingOrg?.slug || rawSlug || 'subedge';
    const targetId = existingOrg?.id || orgId || `org_${finalSlug}`;

    const orgPayload = {
      id: targetId,
      name: existingOrg?.name || orgName,
      slug: finalSlug,
      logo_url: orgLogo || existingOrg?.logo_url || null,
      package_type: (existingOrg?.package_type || 'gold') as any,
      settings: {
        ...(existingOrg?.settings as any || {}),
        domain: `${finalSlug}.com`,
        logo_url: orgLogo || (existingOrg?.settings as any)?.logo_url || null,
        clerk_org_id: orgId || (existingOrg?.settings as any)?.clerk_org_id || null,
      },
      created_at: existingOrg?.created_at || now,
    };

    const { data: upsertedOrg, error } = await supabase
      .from('organizations')
      .upsert(orgPayload, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (!error && upsertedOrg) {
      return upsertedOrg as Organization;
    }
    if (existingOrg) {
      return existingOrg as Organization;
    }
  } catch (err) {
    console.warn('Clerk organization slug compare notice:', err);
  }

  // Fallback to any existing organization
  try {
    const { data: fallbackOrg } = await supabase.from('organizations').select('*').limit(1).maybeSingle();
    if (fallbackOrg) {
      return fallbackOrg as Organization;
    }
  } catch {}

  return null;
}

/**
 * Synchronizes an authenticated Clerk user into Supabase profiles and employees tables,
 * linking their profile to the matched Supabase organization slug.
 */
export async function syncClerkUserToProfile(clerkUser: {
  id: string;
  fullName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  orgRole?: string | null;
  orgId?: string | null;
  orgName?: string | null;
  orgSlug?: string | null;
  orgImageUrl?: string | null;
}): Promise<{ profile: Profile; employee: Employee | null } | null> {
  const role = mapClerkRoleToUserRole(clerkUser.orgRole);

  // 1. Compare and Sync Organization by Slug in Supabase
  const syncedOrg = await syncClerkOrgToDatabase({
    id: clerkUser.orgId,
    name: clerkUser.orgName,
    slug: clerkUser.orgSlug,
    imageUrl: clerkUser.orgImageUrl,
  });

  const now = new Date().toISOString();
  const email = clerkUser.email || `${clerkUser.id}@clerk.user`;

  // 2. Find if profile exists by ID or email
  let existingProfile: any = null;
  try {
    const { data: profById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clerkUser.id)
      .maybeSingle();

    if (profById) {
      existingProfile = profById;
    } else {
      const { data: profByEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profByEmail) {
        existingProfile = profByEmail;
        // Migrate placeholder profile FKs to new Clerk user ID
        try {
          await supabase
            .from('employees')
            .update({ profile_id: clerkUser.id })
            .eq('profile_id', profByEmail.id);
          await supabase.from('profiles').delete().eq('id', profByEmail.id);
        } catch (mErr) {}
      }
    }
  } catch (e) {}

  // Determine target organization ID (priority: matched syncedOrg.id -> existingProfile.organization_id -> default)
  const targetOrgId = syncedOrg?.id || existingProfile?.organization_id || CLERK_ORG_ID;

  // 3. Upsert profile in Supabase with matched organization_id
  const profilePayload = {
    id: clerkUser.id,
    full_name: clerkUser.fullName || existingProfile?.full_name || 'Clerk User',
    email: email,
    avatar_url: clerkUser.imageUrl || existingProfile?.avatar_url || null,
    role: role,
    organization_id: targetOrgId,
    is_active: true,
    last_active: now,
    created_at: existingProfile?.created_at || now,
    updated_at: now,
  };

  let savedProfile: Profile = profilePayload as Profile;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      savedProfile = data as Profile;
    }
  } catch (e) {
    console.warn('Profile sync warning:', e);
  }

  // 4. Ensure corresponding employee record exists in Supabase and belongs to targetOrgId
  let savedEmployee: Employee | null = null;
  try {
    const { data: existingEmp } = await supabase
      .from('employees')
      .select('*, department:departments!employees_department_id_fkey(*), workplace:workplaces(*)')
      .eq('profile_id', savedProfile.id)
      .maybeSingle();

    if (existingEmp) {
      savedEmployee = existingEmp as Employee;
      // Update employee organization_id if mismatched with organization
      if (existingEmp.organization_id !== targetOrgId) {
        await supabase
          .from('employees')
          .update({ organization_id: targetOrgId, updated_at: now })
          .eq('id', existingEmp.id);
        savedEmployee.organization_id = targetOrgId;
      }
    } else {
      // Auto-provision employee record for this user in the matched organization
      const empCode = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      const designation = role === 'admin' ? 'System Administrator' : role === 'hr' ? 'HR Specialist' : 'Software Engineer';

      const { data: newEmp, error: empErr } = await supabase
        .from('employees')
        .insert({
          profile_id: savedProfile.id,
          organization_id: targetOrgId,
          employee_code: empCode,
          designation,
          basic_salary: 60000,
          employment_status: 'active',
          joining_date: now.split('T')[0],
        })
        .select('*')
        .maybeSingle();

      if (!empErr && newEmp) {
        savedEmployee = newEmp as Employee;

        // Initialize default leave balances
        try {
          const { data: leaveTypes } = await supabase
            .from('leave_types')
            .select('*')
            .eq('organization_id', targetOrgId);

          if (leaveTypes && leaveTypes.length > 0) {
            const balances = leaveTypes.map((lt) => ({
              employee_id: newEmp.id,
              leave_type_id: lt.id,
              allocated_days: lt.annual_days || 12,
              used_days: 0,
              remaining_days: lt.annual_days || 12,
              year: new Date().getFullYear(),
            }));
            await supabase.from('leave_balances').insert(balances);
          }
        } catch (lbErr) {
          console.warn('Leave balance setup note:', lbErr);
        }

        // Trigger welcome email automation
        if (savedProfile.email) {
          try {
            await triggerAutomationEvent('on_employee_created', {
              email: savedProfile.email,
              name: savedProfile.full_name,
              employeeCode: empCode,
              designation,
            });
          } catch (autoErr) {}
        }
      }
    }
  } catch (empErr) {
    console.warn('Employee record sync notice:', empErr);
  }

  return {
    profile: savedProfile,
    employee: savedEmployee,
  };
}
