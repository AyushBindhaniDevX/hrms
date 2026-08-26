import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Organization } from '@/types';

export function useTenantBranding() {
  const [tenant, setTenant] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detectTenant() {
      // Per user request, tenant is resolved purely post-login based on the user's ID/profile.
      // Subdomain-based branding lookup is disabled.
      setLoading(false);
    }

    detectTenant();
  }, []);

  return { tenant, loading };
}
