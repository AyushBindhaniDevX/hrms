/**
 * Asset & IT Hardware Inventory Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { CompanyAsset, AssetStatus } from '@/types/database';

let ASSETS_STORE: CompanyAsset[] = [
  {
    id: 'asset_1',
    organization_id: 'subedge_org',
    name: 'MacBook Pro 16" (M3 Max, 36GB)',
    asset_tag: 'SUB-LPT-042',
    category: 'laptop',
    model: 'Apple MacBook Pro 16 2024',
    serial_number: 'C02G89A4MD6R',
    purchase_date: '2025-01-15',
    value: 249900,
    status: 'in_use',
    assigned_to_id: 'emp_demo',
    notes: 'Assigned to Principal Architect',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'asset_2',
    organization_id: 'subedge_org',
    name: 'Dell UltraSharp 27" 4K USB-C Monitor',
    asset_tag: 'SUB-MON-018',
    category: 'monitor',
    model: 'Dell U2723QE',
    serial_number: 'CN-0N897-74261',
    purchase_date: '2025-02-10',
    value: 54000,
    status: 'in_use',
    assigned_to_id: 'emp_demo',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'asset_3',
    organization_id: 'subedge_org',
    name: 'Yubico YubiKey 5C NFC Security Key',
    asset_tag: 'SUB-SEC-099',
    category: 'security_token',
    model: 'YubiKey 5C NFC FIPS',
    serial_number: 'YK998231',
    purchase_date: '2025-03-01',
    value: 6500,
    status: 'available',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'asset_4',
    organization_id: 'subedge_org',
    name: 'ThinkPad X1 Carbon Gen 12',
    asset_tag: 'SUB-LPT-055',
    category: 'laptop',
    model: 'Lenovo ThinkPad X1 2025',
    serial_number: 'PF4B9912',
    purchase_date: '2025-02-20',
    value: 185000,
    status: 'available',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export async function getAssets(): Promise<CompanyAsset[]> {
  return [...ASSETS_STORE];
}

export async function createAsset(asset: Omit<CompanyAsset, 'id' | 'created_at'>): Promise<CompanyAsset> {
  const newAsset: CompanyAsset = {
    ...asset,
    id: `asset_${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  ASSETS_STORE.unshift(newAsset);
  return newAsset;
}

export async function updateAssetStatus(assetId: string, status: AssetStatus, assignedToId?: string | null): Promise<CompanyAsset> {
  const item = ASSETS_STORE.find((a) => a.id === assetId);
  if (!item) throw new Error('Asset not found');
  item.status = status;
  if (assignedToId !== undefined) item.assigned_to_id = assignedToId;
  return item;
}
