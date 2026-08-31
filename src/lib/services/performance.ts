import { supabase } from '@/lib/supabase';
import type {
  Goal,
  KeyResult,
  AppraisalReview,
  PerformanceRatingBreakdown,
  Kudos,
  KudosBadge,
  AppraisalRecommendation,
  Employee,
  Profile,
} from '@/types';
import { createAuditLog } from './audit';
import { createNotification } from './notifications';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function getGoals(options?: {
  employeeId?: string;
  departmentId?: string;
  category?: string;
  status?: string;
  organizationId?: string;
}): Promise<Goal[]> {
  let query = supabase.from('goals').select('*, employee:employees(*, profile:profiles(*)), department:departments(*)');

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.departmentId) query = query.eq('department_id', options.departmentId);
  if (options?.category) query = query.eq('category', options.category);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.organizationId) query = query.or(`organization_id.eq.${options.organizationId},organization_id.is.null`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Goal[];
}

export async function createGoal(
  data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<Goal> {
  const now = new Date().toISOString();
  const { data: result, error } = await supabase
    .from('goals')
    .insert({
      ...data,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;

  await createAuditLog('CREATE_GOAL', 'goal', result.id, {
    title: result.title,
    category: result.category,
    priority: result.priority,
  });

  return result as Goal;
}

export async function deleteGoal(goalId: string, userId?: string): Promise<boolean> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (!error && userId) {
    await createAuditLog('DELETE_GOAL', 'goal', goalId, { deleted_by: userId });
  }
  return !error;
}

export async function updateGoal(
  id: string,
  data: Partial<Goal>,
  userId?: string
): Promise<Goal> {
  const now = new Date().toISOString();
  const { data: result, error } = await supabase
    .from('goals')
    .update({ ...data, updated_at: now })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return result as Goal;
}

export async function updateKeyResult(
  goalId: string,
  krId: string,
  currentValue: number,
  userId?: string
): Promise<Goal> {
  const { data: goal } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (!goal) throw new Error('Goal not found');

  const keyResults = (goal.key_results || []).map((kr: KeyResult) => {
    if (kr.id === krId) {
      const completed = currentValue >= kr.target_value;
      return { ...kr, current_value: currentValue, completed };
    }
    return kr;
  });

  const completedCount = keyResults.filter((kr: KeyResult) => kr.completed).length;
  const progress = keyResults.length > 0 ? Math.round((completedCount / keyResults.length) * 100) : 0;
  const status = progress === 100 ? 'completed' : progress > 0 ? 'on_track' : goal.status;

  return updateGoal(goalId, { key_results: keyResults, progress, status }, userId);
}

export async function getAppraisals(options?: {
  employeeId?: string;
  status?: string;
  period?: string;
  organizationId?: string;
}): Promise<AppraisalReview[]> {
  let query = supabase.from('appraisal_reviews').select('*, employee:employees(*, profile:profiles(*)), reviewer:profiles(*)');

  if (options?.employeeId) query = query.eq('employee_id', options.employeeId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.period) query = query.eq('period', options.period);
  if (options?.organizationId) query = query.or(`organization_id.eq.${options.organizationId},organization_id.is.null`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as AppraisalReview[];
}

export async function createAppraisal(
  data: Omit<AppraisalReview, 'id' | 'created_at' | 'updated_at'>,
  userId?: string
): Promise<AppraisalReview> {
  const now = new Date().toISOString();
  const { data: result, error } = await supabase
    .from('appraisal_reviews')
    .insert({
      ...data,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;

  await createAuditLog('INITIATE_APPRAISAL', 'appraisal_review', result.id, {
    cycle: result.cycle_name,
    employee_id: result.employee_id,
  });

  return result as AppraisalReview;
}

export async function submitSelfReview(
  id: string,
  data: {
    self_rating: number;
    self_comments: string;
    ratings_breakdown?: PerformanceRatingBreakdown;
  },
  userId?: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('appraisal_reviews')
    .update({
      self_rating: data.self_rating,
      self_comments: data.self_comments,
      ratings_breakdown: data.ratings_breakdown || null,
      self_submitted_at: now,
      status: 'manager_review',
      updated_at: now,
    })
    .eq('id', id);

  if (error) throw error;

  await createAuditLog('SUBMIT_SELF_APPRAISAL', 'appraisal_review', id, {
    rating: data.self_rating,
  });
}

export async function submitManagerReview(
  id: string,
  data: {
    manager_rating: number;
    manager_comments: string;
    overall_score: number;
    recommendation: AppraisalRecommendation;
    ratings_breakdown?: PerformanceRatingBreakdown;
    reviewer_id: string;
  },
  employeeProfileId?: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('appraisal_reviews')
    .update({
      manager_rating: data.manager_rating,
      manager_comments: data.manager_comments,
      overall_score: data.overall_score,
      recommendation: data.recommendation,
      ratings_breakdown: data.ratings_breakdown || null,
      reviewer_id: data.reviewer_id,
      manager_submitted_at: now,
      status: 'completed',
      updated_at: now,
    })
    .eq('id', id);

  if (error) throw error;

  await createAuditLog('COMPLETE_MANAGER_APPRAISAL', 'appraisal_review', id, {
    rating: data.manager_rating,
    overall_score: data.overall_score,
    recommendation: data.recommendation,
  });

  if (employeeProfileId) {
    await createNotification(
      employeeProfileId,
      'performance',
      'Appraisal Review Completed',
      `Your appraisal review has been finalized with an overall score of ${data.overall_score}/100.`
    );
  }
}

export async function getKudos(): Promise<Kudos[]> {
  const { data, error } = await supabase
    .from('kudos')
    .select('*, sender:profiles!kudos_sender_id_fkey(*), receiver:profiles!kudos_receiver_id_fkey(*)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Kudos[];
}

export async function sendKudos(data: {
  sender_id: string;
  receiver_id: string;
  badge: KudosBadge;
  message: string;
  sender_name?: string;
}): Promise<Kudos> {
  const now = new Date().toISOString();
  const { data: result, error } = await supabase
    .from('kudos')
    .insert({
      organization_id: DEFAULT_ORG_ID,
      sender_id: data.sender_id,
      receiver_id: data.receiver_id,
      badge: data.badge,
      message: data.message,
      created_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;

  await createNotification(
    data.receiver_id,
    'kudos',
    'New Kudos Received',
    `${data.sender_name || 'A teammate'} sent you a "${data.badge.toUpperCase()}" badge: "${data.message}"`
  );

  return result as Kudos;
}
