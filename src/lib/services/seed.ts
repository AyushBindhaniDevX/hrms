/**
 * Master Database Seeder (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  try {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', DEFAULT_ORG_ID)
      .maybeSingle();

    if (!existingOrg) {
      await supabase.from('organizations').insert({
        id: DEFAULT_ORG_ID,
        name: 'Oasis Enterprise',
        logo_url: null,
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          geofence_radius_default: 150,
        },
        created_at: new Date().toISOString(),
      });
    }

    return { seeded: true, message: 'Supabase organization verified.' };
  } catch (error) {
    console.error('Seed verification error:', error);
    return { seeded: false, message: 'Seed verification failed.' };
  }
}
