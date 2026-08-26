/**
 * Document Vault & Company Policies Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { CompanyDocument } from '@/types/database';

export async function getDocuments(): Promise<CompanyDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as CompanyDocument[];
}

export async function signDocument(documentId: string, employeeId: string): Promise<void> {
  const { data: docData } = await supabase
    .from('documents')
    .select('signatures_count')
    .eq('id', documentId)
    .maybeSingle();

  const currentCount = docData?.signatures_count || 0;

  await supabase
    .from('documents')
    .update({ signatures_count: currentCount + 1, updated_at: new Date().toISOString() })
    .eq('id', documentId);
}
