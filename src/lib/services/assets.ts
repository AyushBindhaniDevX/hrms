/**
 * Real-Time Asset & IT Hardware Inventory Service (Cloud Firestore)
 * Oasis HRMS Multi-Tenant Platform
 */

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { CompanyAsset, AssetStatus } from '@/types/database';

export async function getAssets(organizationId?: string): Promise<CompanyAsset[]> {
  try {
    const snap = await getDocs(collection(db, 'assets'));
    const assets: CompanyAsset[] = [];
    snap.forEach((d) => {
      const a = { id: d.id, ...d.data() } as CompanyAsset;
      if (!organizationId || !a.organization_id || a.organization_id === organizationId) {
        assets.push(a);
      }
    });
    assets.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return assets;
  } catch (err) {
    console.error('getAssets error:', err);
    return [];
  }
}

export function subscribeToAssets(
  onUpdate: (assets: CompanyAsset[]) => void,
  onError?: (err: any) => void,
  organizationId?: string
): () => void {
  const q = collection(db, 'assets');

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const assets: CompanyAsset[] = [];
      snapshot.forEach((d) => {
        const a = { id: d.id, ...d.data() } as CompanyAsset;
        if (!organizationId || !a.organization_id || a.organization_id === organizationId) {
          assets.push(a);
        }
      });
      assets.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      onUpdate(assets);
    },
    (err) => {
      console.warn('subscribeToAssets error:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

export async function createAsset(asset: Omit<CompanyAsset, 'id' | 'created_at'>): Promise<CompanyAsset> {
  const assetId = `ast_${Date.now()}`;
  const now = new Date().toISOString();
  const newAsset: CompanyAsset = {
    ...asset,
    id: assetId,
    created_at: now,
  };

  await setDoc(doc(db, 'assets', assetId), newAsset);
  return newAsset;
}

export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
  assignedTo?: string | null,
  assignedToName?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status,
    assigned_to_id: assignedTo !== undefined ? assignedTo : null,
    updated_at: now,
  };
  if (assignedToName !== undefined) {
    updatePayload.assigned_employee_name = assignedToName;
  }

  await updateDoc(doc(db, 'assets', assetId), updatePayload);
}

export async function verifyAndAuditAsset(assetId: string, auditorName: string): Promise<any> {
  const now = new Date().toISOString();
  const updates = {
    last_audited_at: now,
    last_auditor_name: auditorName,
    updated_at: now,
  };
  await updateDoc(doc(db, 'assets', assetId), updates);
  const snap = await getDoc(doc(db, 'assets', assetId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function disposeAsset(assetId: string, salvageValue: number, reason: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'assets', assetId), {
    status: 'retired',
    salvage_value: salvageValue,
    disposal_reason: reason,
    disposed_at: now,
    updated_at: now,
  });
}

export async function deleteAsset(assetId: string): Promise<void> {
  await deleteDoc(doc(db, 'assets', assetId));
}
