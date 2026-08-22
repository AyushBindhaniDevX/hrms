/**
 * Shifts & Roster Scheduling Service (Dynamic Firestore)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { WorkShift } from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';

export async function getShifts(): Promise<WorkShift[]> {
  await seedDatabaseIfEmpty();

  try {
    const shiftsRef = collection(db, 'shifts');
    const snapshot = await getDocs(shiftsRef);
    const results: WorkShift[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as WorkShift);
    });
    return results;
  } catch (error) {
    console.error('Error fetching shifts from Firestore:', error);
    return [];
  }
}
