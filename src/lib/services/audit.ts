import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit as limitDocs, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { AuditLog } from '@/types';

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const user = auth.currentUser;
  await addDoc(collection(db, 'audit_logs'), {
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    metadata: metadata || {},
    user_id: user?.uid || null,
    created_at: serverTimestamp(),
  });
}

export async function getAuditLogs(limit = 50, offset = 0): Promise<AuditLog[]> {
  const q = query(
    collection(db, 'audit_logs'),
    orderBy('created_at', 'desc'),
    limitDocs(limit)
  );
  
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  
  // Fetch user profiles for each log
  for (const log of logs) {
    if (log.user_id) {
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', log.user_id));
        if (profileDoc.exists()) {
          log.user = profileDoc.data();
        }
      } catch (e) {
        // ignore error fetching profile
      }
    }
  }
  
  return logs as AuditLog[];
}
