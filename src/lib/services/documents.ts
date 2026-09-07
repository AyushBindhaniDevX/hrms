/**
 * Document Vault & Company Policies Service (Cloud Firestore)
 * Oasis HRMS Multi-Tenant Platform
 */

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { CompanyDocument } from '@/types/database';

export async function getDocuments(): Promise<CompanyDocument[]> {
  try {
    const snap = await getDocs(collection(db, 'documents'));
    const docs: CompanyDocument[] = [];
    snap.forEach((d) => docs.push({ id: d.id, ...d.data() } as CompanyDocument));
    docs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return docs;
  } catch (err) {
    console.error('getDocuments error:', err);
    return [];
  }
}

export async function signDocument(documentId: string, employeeId: string): Promise<void> {
  const docRef = doc(db, 'documents', documentId);
  const snap = await getDoc(docRef);
  const currentCount = snap.exists() ? (snap.data()?.signatures_count || 0) : 0;

  await updateDoc(docRef, {
    signatures_count: currentCount + 1,
    updated_at: new Date().toISOString(),
  });
}
