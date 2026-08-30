import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Organization, Workplace, Employee } from '@/types';
import { COMPANY_NAME } from '@/constants/config';

interface TenantContextState {
  organization: Organization | null;
  workplace: Workplace | null;
  employee: Employee | null;
  companyName: string;
  companyLogoUrl: string | null;
  officeName: string;
  isLoadingTenant: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextState | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { profile, isAuthenticated, clerkOrg } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [workplace, setWorkplace] = useState<Workplace | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);

  const fetchTenantData = useCallback(async () => {
    setIsLoadingTenant(true);
    try {
      let resolvedOrg: Organization | null = null;

      // 1. Always use user's profile.organization_id for authenticated sessions
      if (profile?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .maybeSingle();

        if (orgData) {
          resolvedOrg = orgData as Organization;
        }
      }

      // 2. Match by Clerk organization slug if not resolved by ID
      if (!resolvedOrg && clerkOrg?.slug) {
        const { data: orgBySlug } = await supabase
          .from('organizations')
          .select('*')
          .ilike('slug', clerkOrg.slug.toLowerCase().trim())
          .maybeSingle();

        if (orgBySlug) {
          resolvedOrg = orgBySlug as Organization;
        }
      }

      setOrganization(resolvedOrg);

      const targetOrgId = resolvedOrg?.id || profile?.organization_id;

      // 3. Fetch Employee record for current user if authenticated
      if (profile?.id) {
        const { data: empData } = await supabase
          .from('employees')
          .select('*, department:departments!employees_department_id_fkey(*), workplace:workplaces(*)')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (empData) {
          setEmployee(empData as Employee);
          if (empData.workplace) {
            setWorkplace(empData.workplace as Workplace);
          } else if (empData.workplace_id) {
            const { data: wpData } = await supabase
              .from('workplaces')
              .select('*')
              .eq('id', empData.workplace_id)
              .maybeSingle();
            if (wpData) setWorkplace(wpData as Workplace);
          }
        }
      }

      // 4. Fallback workplace if not resolved yet
      if (targetOrgId && !workplace) {
        const { data: defaultWp } = await supabase
          .from('workplaces')
          .select('*')
          .eq('organization_id', targetOrgId)
          .limit(1)
          .maybeSingle();

        if (defaultWp) setWorkplace(defaultWp as Workplace);
      }
    } catch (err) {
      console.error('Error fetching tenant details:', err);
    } finally {
      setIsLoadingTenant(false);
    }
  }, [profile, clerkOrg]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTenantData();
    } else {
      setOrganization(null);
      setWorkplace(null);
      setEmployee(null);
    }
  }, [isAuthenticated, fetchTenantData]);

  // Dynamically prioritize Clerk Organization branding & icon
  const clerkOrgName = clerkOrg?.name || clerkOrg?.organization?.name;
  const clerkOrgLogo = clerkOrg?.imageUrl || clerkOrg?.organization?.imageUrl || (clerkOrg as any)?.logoUrl;

  const companyName = organization?.name || clerkOrgName || COMPANY_NAME;
  const companyLogoUrl = organization?.logo_url || clerkOrgLogo || (organization?.settings as any)?.logo_url || null;
  const officeName = workplace?.name || 'Main Office';

  const value: TenantContextState = {
    organization,
    workplace,
    employee,
    companyName,
    companyLogoUrl,
    officeName,
    isLoadingTenant,
    refreshTenant: fetchTenantData,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextState {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
