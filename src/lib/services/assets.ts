/**
 * Asset & IT Hardware Inventory Service (Dynamic Firestore)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { CompanyAsset, AssetStatus } from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';

export async function getAssets(): Promise<CompanyAsset[]> {
  await seedDatabaseIfEmpty();

  try {
    const assetsRef = collection(db, 'assets');
    const snapshot = await getDocs(assetsRef);
    const results: CompanyAsset[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as CompanyAsset);
    });
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching assets from Firestore:', error);
    return [];
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
    await setDoc(doc(db, 'assets', newId), newAsset);
  } catch (error) {
    console.error('Error creating asset in Firestore:', error);
  }

  return newAsset;
}

export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
  assignedToId?: string | null
): Promise<void> {
  try {
    const assetRef = doc(db, 'assets', assetId);
    await updateDoc(assetRef, {
      status,
      assigned_to_id: assignedToId !== undefined ? assignedToId : null,
      assigned_employee_name: assignedToId ? 'Ayush Bindhani' : null,
    });
  } catch (error) {
    console.error('Error updating asset in Firestore:', error);
  }
}
