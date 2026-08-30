/**
 * Real-Time Asset & IT Hardware Inventory Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { CompanyAsset, AssetStatus } from '@/types/database';

export async function getAssets(organizationId?: string): Promise<CompanyAsset[]> {
  let query = supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as CompanyAsset[];
}

export function subscribeToAssets(
  onUpdate: (assets: CompanyAsset[]) => void,
  onError?: (err: any) => void,
  organizationId?: string
): () => void {
  // Initial fetch
  getAssets(organizationId).then(onUpdate).catch(onError);

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
        getAssets(organizationId).then(onUpdate).catch(onError);
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

  const { error } = await supabase
    .from('assets')
    .update(updatePayload)
    .eq('id', assetId);

  if (error) throw error;
}

export async function verifyAndAuditAsset(assetId: string, auditorName: string): Promise<any> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('assets')
    .update({
      last_audited_at: now,
      last_auditor_name: auditorName,
      updated_at: now,
    })
    .eq('id', assetId)
    .select('*')
    .single();

  if (error) {
    console.warn('Audit update fallback:', error);
  }
  return data;
}

export async function disposeAsset(assetId: string, salvageValue: number, reason: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('assets')
    .update({
      status: 'retired',
      salvage_value: salvageValue,
      disposal_reason: reason,
      disposed_at: now,
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
