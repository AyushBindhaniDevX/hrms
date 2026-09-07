/**
 * Master Database Seeder (Cloud Firestore)
 * Oasis HRMS Multi-Tenant Platform
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function seedDatabaseIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  try {
    const orgSnap = await getDoc(doc(db, 'organizations', DEFAULT_ORG_ID));

    if (!orgSnap.exists()) {
      await setDoc(doc(db, 'organizations', DEFAULT_ORG_ID), {
        id: DEFAULT_ORG_ID,
        name: 'Oasis Enterprise',
        logo_url: null,
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          geofence_radius_default: 150,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return { seeded: true, message: 'Firebase organization verified.' };
  } catch (error) {
    console.error('Seed verification error:', error);
    return { seeded: false, message: 'Seed verification failed.' };
  }
}
