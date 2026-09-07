import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import type { AuditLog, Profile } from '@/types';
import { Platform } from 'react-native';

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  actorUserId?: string
): Promise<void> {
  try {
    let actorName = 'System / Administrator';
    let actorEmail = 'admin@oasis.io';
    let actorRole = 'admin';
    let actorOrgId: string | null = null;
    let userId: string | null = actorUserId || null;

    if (userId) {
      const profSnap = await getDoc(doc(db, 'profiles', userId));
      if (profSnap.exists()) {
        const prof = profSnap.data() as Profile;
        actorName = prof.full_name || actorName;
        actorEmail = prof.email || actorEmail;
        actorRole = prof.role || actorRole;
        if (prof.organization_id) actorOrgId = prof.organization_id;
      }
    }

    if (!actorOrgId) {
      actorOrgId = '00000000-0000-0000-0000-000000000001';
    }

    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logData: AuditLog = {
      id: logId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      organization_id: actorOrgId,
      metadata: {
        ...(metadata || {}),
        platform: Platform.OS,
        timestamp_ms: Date.now(),
      },
      user_id: userId,
      user: {
        full_name: actorName,
        email: actorEmail,
        role: actorRole as any,
      },
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'audit_logs', logId), logData);
  } catch (error) {
    console.error('Error creating audit log in Firestore:', error);
  }
}

export async function getAuditLogs(limitCount = 100, organizationId?: string): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'audit_logs'));
    const logs: AuditLog[] = [];
    snap.forEach((d) => {
      const l = { id: d.id, ...d.data() } as AuditLog;
      if (!organizationId || !l.organization_id || l.organization_id === organizationId) {
        logs.push(l);
      }
    });

    logs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return logs.slice(0, limitCount);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return [];
  }
}

export function subscribeToAuditLogs(
  onUpdate: (logs: AuditLog[]) => void
): () => void {
  const q = collection(db, 'audit_logs');

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const logs: AuditLog[] = [];
      snapshot.forEach((d) => logs.push({ id: d.id, ...d.data() } as AuditLog));
      logs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      onUpdate(logs.slice(0, 100));
    },
    (err) => {
      console.warn('subscribeToAuditLogs error:', err);
    }
  );

  return unsubscribe;
}
