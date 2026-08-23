/**
 * Real-Time Asset & IT Hardware Inventory Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { CompanyAsset, AssetStatus } from '@/types/database';

export async function getAssets(): Promise<CompanyAsset[]> {
  try {
    const assetsRef = collection(db, 'assets');
    const q = query(assetsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const results: CompanyAsset[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as CompanyAsset);
    });
    return results;
  } catch (error) {
    console.error('Error fetching assets from Firestore:', error);
    // Fallback if index on created_at not present
    try {
      const snap = await getDocs(collection(db, 'assets'));
      const fallback: CompanyAsset[] = [];
      snap.forEach((d) => fallback.push({ id: d.id, ...d.data() } as CompanyAsset));
      return fallback.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } catch {
      return [];
    }
  }
}

/**
 * Real-time Live Firestore Listener for Assets
 */
export function subscribeToAssets(
  onUpdate: (assets: CompanyAsset[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const assetsRef = collection(db, 'assets');
    const unsubscribe = onSnapshot(
      assetsRef,
      (snapshot) => {
        const results: CompanyAsset[] = [];
        snapshot.forEach((d) => {
          results.push({ id: d.id, ...d.data() } as CompanyAsset);
        });
        results.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        onUpdate(results);
      },
      (err) => {
        console.error('Real-time assets subscription error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to attach real-time assets listener:', err);
    return () => {};
  }
}

export async function createAsset(asset: Omit<CompanyAsset, 'id' | 'created_at'>): Promise<CompanyAsset> {
  const newId = `asset_${Date.now()}`;
  const newAsset: CompanyAsset = {
    ...asset,
    id: newId,
    created_at: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'assets', newId), {
      ...newAsset,
      created_at: new Date().toISOString(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating asset in Firestore:', error);
  }

  return newAsset;
}

export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
  assignedToId?: string | null,
  assignedEmployeeName?: string | null
): Promise<void> {
  try {
    const assetRef = doc(db, 'assets', assetId);
    await updateDoc(assetRef, {
      status,
      assigned_to_id: assignedToId !== undefined ? assignedToId : null,
      assigned_employee_name: assignedToId ? (assignedEmployeeName || null) : null,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating asset in Firestore:', error);
  }
}

export async function verifyAndAuditAsset(
  assetId: string,
  auditorName: string
): Promise<CompanyAsset | null> {
  try {
    const assetRef = doc(db, 'assets', assetId);
    const auditTime = new Date().toISOString();
    await updateDoc(assetRef, {
      last_audited_at: auditTime,
      last_auditor_name: auditorName,
      updated_at: serverTimestamp(),
    });
    const updated = await getAssets();
    return updated.find((a) => a.id === assetId) || null;
  } catch (error) {
    console.error('Error auditing asset in Firestore:', error);
    return null;
  }
}

export async function disposeAsset(
  assetId: string,
  salvageValue: number,
  reason: string
): Promise<void> {
  try {
    const assetRef = doc(db, 'assets', assetId);
    await updateDoc(assetRef, {
      status: 'retired',
      salvage_value: salvageValue,
      disposal_reason: reason,
      disposed_at: new Date().toISOString(),
      assigned_to_id: null,
      assigned_employee_name: null,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error disposing asset in Firestore:', error);
  }
}

export async function deleteAsset(assetId: string): Promise<void> {
  try {
    const assetRef = doc(db, 'assets', assetId);
    await deleteDoc(assetRef);
  } catch (error) {
    console.error('Error deleting asset from Firestore:', error);
  }
}
