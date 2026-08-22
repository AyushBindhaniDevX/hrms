/**
 * Document Vault & Company Policies Service (Dynamic Firestore)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { CompanyDocument } from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';

export async function getDocuments(): Promise<CompanyDocument[]> {
  await seedDatabaseIfEmpty();

  try {
    const docsRef = collection(db, 'documents');
    const snapshot = await getDocs(docsRef);
    const results: CompanyDocument[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as CompanyDocument);
    });
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching documents from Firestore:', error);
    return [];
  }
}

export async function signDocument(documentId: string, employeeId: string): Promise<void> {
  try {
    const docRef = doc(db, 'documents', documentId);
    const snapshot = await getDocs(collection(db, 'documents'));
    const docData = snapshot.docs.find((d) => d.id === documentId)?.data();
    const currentCount = docData?.signatures_count || 0;

    await updateDoc(docRef, {
      signatures_count: currentCount + 1,
    });
  } catch (error) {
    console.error('Error signing document in Firestore:', error);
  }
}
