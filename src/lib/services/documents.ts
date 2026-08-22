/**
 * Document Vault & Policy Management Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { CompanyDocument } from '@/types/database';

let DOCUMENTS_STORE: CompanyDocument[] = [
  {
    id: 'doc_1',
    organization_id: 'subedge_org',
    title: 'Subedge Technology Employee Handbook (2026 Edition)',
    category: 'handbook',
    file_size_kb: 2450,
    version: 'v2.4',
    file_url: 'https://subedge.vercel.app/docs/handbook-2026.pdf',
    requires_signature: true,
    signatures_count: 52,
    uploaded_by: 'HR Policy Team',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'doc_2',
    organization_id: 'subedge_org',
    title: 'Information Security & Data Privacy Policy (SOC 2 & HIPAA)',
    category: 'policy',
    file_size_kb: 1840,
    version: 'v3.1',
    file_url: 'https://subedge.vercel.app/docs/infosec-policy.pdf',
    requires_signature: true,
    signatures_count: 58,
    uploaded_by: 'CISO Office',
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 'doc_3',
    organization_id: 'subedge_org',
    title: 'Remote Work & Hybrid Workplace Equipment Policy',
    category: 'policy',
    file_size_kb: 920,
    version: 'v1.8',
    file_url: 'https://subedge.vercel.app/docs/remote-work-policy.pdf',
    requires_signature: false,
    signatures_count: 0,
    uploaded_by: 'People Ops',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'doc_4',
    organization_id: 'subedge_org',
    title: 'Standard Non-Disclosure & Intellectual Property Agreement',
    category: 'contract',
    file_size_kb: 640,
    version: 'v2.0',
    file_url: 'https://subedge.vercel.app/docs/nda-template.pdf',
    requires_signature: true,
    signatures_count: 60,
    uploaded_by: 'Legal Department',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export async function getDocuments(): Promise<CompanyDocument[]> {
  return [...DOCUMENTS_STORE];
}

export async function uploadDocument(doc: Omit<CompanyDocument, 'id' | 'signatures_count' | 'created_at'>): Promise<CompanyDocument> {
  const newDoc: CompanyDocument = {
    ...doc,
    id: `doc_${Date.now()}`,
    signatures_count: 0,
    created_at: new Date().toISOString(),
  };
  DOCUMENTS_STORE.unshift(newDoc);
  return newDoc;
}
