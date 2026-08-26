import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types';
import { Platform } from 'react-native';

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let actorName = 'System / Administrator';
    let actorEmail = user?.email || 'admin@subedge.com';
    let actorRole = 'admin';

    let actorOrgId = '00000000-0000-0000-0000-000000000001';

    if (user?.id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) {
        actorName = prof.full_name || actorName;
        actorEmail = prof.email || actorEmail;
        actorRole = prof.role || actorRole;
        if (prof.organization_id) actorOrgId = prof.organization_id;
      }
    }

    const logData = {
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      organization_id: actorOrgId,
      metadata: {
        ...(metadata || {}),
        platform: Platform.OS,
        timestamp_ms: Date.now(),
      },
      user_id: user?.id || null,
      user: {
        full_name: actorName,
        email: actorEmail,
        role: actorRole,
      },
      created_at: new Date().toISOString(),
    };

    await supabase.from('audit_logs').insert(logData);
  } catch (error) {
    console.error('Error creating audit log in Supabase:', error);
  }
}

export async function getAuditLogs(limitCount = 100, organizationId?: string): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.limit(limitCount);

  if (error || !data) return [];
  return data as AuditLog[];
}

export function subscribeToAuditLogs(
  onUpdate: (logs: AuditLog[]) => void
): () => void {
  getAuditLogs().then(onUpdate);

  const channel = supabase
    .channel('public:audit_logs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'audit_logs',
      },
      () => {
        getAuditLogs().then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
