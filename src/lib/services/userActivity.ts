import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import type { Profile, AuditLog } from '@/types';

export interface UserActivityPayload {
  userId?: string | null;
  organizationId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
}

/**
 * Tracks an authenticated user activity event in Supabase (in audit_logs and updates profile timestamp)
 */
export async function trackUserActivity(payload: UserActivityPayload): Promise<void> {
  try {
    const now = new Date().toISOString();
    let orgId = payload.organizationId || null;

    if (!orgId && payload.userId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('organization_id, full_name, email, role')
        .eq('id', payload.userId)
        .maybeSingle();

      if (prof) {
        orgId = prof.organization_id;
        payload.actorName = payload.actorName || prof.full_name;
        payload.actorEmail = payload.actorEmail || prof.email;
        payload.actorRole = payload.actorRole || prof.role;
      }
    }

    if (!orgId) {
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      orgId = defaultOrg?.id || null;
    }

    const logEntry = {
      organization_id: orgId,
      user_id: payload.userId || null,
      action: payload.action,
      entity_type: payload.entityType || 'user_activity',
      entity_id: payload.entityId || payload.userId || null,
      metadata: {
        description: payload.description || payload.action,
        platform: Platform.OS,
        timestamp_ms: Date.now(),
        ...(payload.metadata || {}),
      },
      user: {
        full_name: payload.actorName || 'Clerk User',
        email: payload.actorEmail || '',
        role: payload.actorRole || 'employee',
      },
      created_at: now,
    };

    await supabase.from('audit_logs').insert(logEntry);

    // Update profile last_active timestamp if user is identified
    if (payload.userId) {
      await supabase
        .from('profiles')
        .update({
          last_active: now,
          updated_at: now,
        })
        .eq('id', payload.userId);
    }
  } catch (err) {
    console.warn('Track user activity error (non-fatal):', err);
  }
}

/**
 * Logs a Clerk user sign-in session in Supabase, updating IP and session records
 */
export async function logUserLogin(
  profile: Profile,
  ipAddress?: string | null,
  sessionId?: string | null
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const effectiveSessionId = sessionId || `sess_${Math.random().toString(36).substring(2, 15)}`;

    // Update profile session & IP info
    await supabase
      .from('profiles')
      .update({
        last_login_ip: ipAddress || null,
        session_id: effectiveSessionId,
        last_active: now,
        updated_at: now,
      })
      .eq('id', profile.id);

    // Write audit log entry
    await trackUserActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: 'USER_SIGN_IN',
      entityType: 'auth',
      entityId: profile.id,
      description: `User ${profile.full_name} (${profile.email}) signed in via Clerk`,
      actorName: profile.full_name,
      actorEmail: profile.email,
      actorRole: profile.role,
      metadata: {
        login_method: 'clerk_sso',
        ip_address: ipAddress || 'unknown',
        session_id: effectiveSessionId,
        platform: Platform.OS,
      },
    });
  } catch (err) {
    console.warn('Log user login notice:', err);
  }
}

/**
 * Logs a Clerk user sign-out session in Supabase
 */
export async function logUserLogout(profile?: Profile | null): Promise<void> {
  if (!profile) return;
  try {
    await trackUserActivity({
      userId: profile.id,
      organizationId: profile.organization_id,
      action: 'USER_SIGN_OUT',
      entityType: 'auth',
      entityId: profile.id,
      description: `User ${profile.full_name} (${profile.email}) signed out`,
      actorName: profile.full_name,
      actorEmail: profile.email,
      actorRole: profile.role,
      metadata: {
        platform: Platform.OS,
      },
    });
  } catch (err) {
    console.warn('Log user logout notice:', err);
  }
}

/**
 * Fetches recent user activity records from Supabase
 */
export async function getUserActivities(
  organizationId?: string,
  userId?: string,
  limitCount = 50
): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.limit(limitCount);
    if (error || !data) return [];
    return data as AuditLog[];
  } catch (err) {
    console.error('Failed to get user activities:', err);
    return [];
  }
}
