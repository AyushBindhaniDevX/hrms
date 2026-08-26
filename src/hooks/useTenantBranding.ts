import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Organization } from '@/types';

export function useTenantBranding() {
  const [tenant, setTenant] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detectTenant() {
      if (Platform.OS !== 'web') {
        setLoading(false);
        return;
      }

      try {
        const hostname = window.location.hostname;
        // Ignore localhost, 127.0.0.1 without subdomains
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.')) {
          setLoading(false);
          return;
        }

        const parts = hostname.split('.');
        // Extract subdomain (e.g. "shanti-hospital" from "shanti-hospital.localhost")
        if (parts.length >= 2 && parts[0] !== 'www') {
          const slug = parts[0];
          
          const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (data && !error) {
            setTenant(data as Organization);
          }
        }
      } catch (err) {
        console.error('Failed to load tenant branding:', err);
      } finally {
        setLoading(false);
      }
    }

    detectTenant();
  }, []);

  return { tenant, loading };
}
