/**
 * Real-Time Asset & IT Hardware Inventory Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { CompanyAsset, AssetStatus } from '@/types/database';

export async function getAssets(): Promise<CompanyAsset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as CompanyAsset[];
}

export function subscribeToAssets(
  onUpdate: (assets: CompanyAsset[]) => void,
  onError?: (err: any) => void
): () => void {
  // Initial fetch
  getAssets().then(onUpdate).catch(onError);

  const channel = supabase
    .channel('public:assets')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assets',
      },
      () => {
        getAssets().then(onUpdate).catch(onError);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createAsset(asset: Omit<CompanyAsset, 'id' | 'created_at'>): Promise<CompanyAsset> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('assets')
    .insert({
      ...asset,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating asset in Supabase:', error);
    throw error;
  }

  return data as CompanyAsset;
}

export async function updateAssetStatus(
  assetId: string,
  status: AssetStatus,
  assignedTo?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('assets')
    .update({
      status,
      assigned_to: assignedTo !== undefined ? assignedTo : null,
      updated_at: now,
    })
    .eq('id', assetId);

  if (error) throw error;
}

export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
}
