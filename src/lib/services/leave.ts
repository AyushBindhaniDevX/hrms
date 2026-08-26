import { supabase } from '@/lib/supabase';
import type { LeaveType, LeaveBalance, LeaveRequest, LeaveProcessResponse, Employee } from '@/types';

const DEFAULT_LEAVE_TYPES = [
  { name: 'Annual Leave', annual_days: 18, is_paid: true },
  { name: 'Sick Leave', annual_days: 12, is_paid: true },
  { name: 'Casual Leave', annual_days: 7, is_paid: true },
  { name: 'Maternity Leave', annual_days: 90, is_paid: true },
  { name: 'Paternity Leave', annual_days: 7, is_paid: true },
  { name: 'Compensatory Leave', annual_days: 5, is_paid: true },
  { name: 'Unpaid Leave', annual_days: 30, is_paid: false },
];

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .order('name', { ascending: true });

  if (!error && data && data.length > 0) {
    const unique = Array.from(new Map((data as LeaveType[]).map((item) => [item.name, item])).values());
    return unique;
  }

  // Seed default if empty
  const defaultOrgId = '00000000-0000-0000-0000-000000000001';
  const seeded: LeaveType[] = [];
  for (const lt of DEFAULT_LEAVE_TYPES) {
    const { data: newType } = await supabase
      .from('leave_types')
      .insert({
        organization_id: defaultOrgId,
        name: lt.name,
        annual_days: lt.annual_days,
        is_paid: lt.is_paid,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (newType) seeded.push(newType as LeaveType);
  }
  return seeded.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
  const y = year ?? new Date().getFullYear();
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*, leave_type:leave_types(*)')
    .eq('employee_id', employeeId)
    .eq('year', y);

  if (error || !data) return [];
  return data as LeaveBalance[];
}

export async function getLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, leave_type:leave_types(*)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as LeaveRequest[];
}

export async function applyLeave(params: {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day: boolean;
  reason: string;
}): Promise<LeaveRequest> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      ...params,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select('*, leave_type:leave_types(*)')
    .single();

  if (error) throw error;
  return data as LeaveRequest;
}

export async function cancelLeave(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

export async function getPendingLeaveRequests(organizationId?: string): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types(*),
      employee:employees!inner(*, profile:profiles!inner(*), department:departments(*))
    `)
    .eq('status', 'pending');

  if (organizationId) {
    query = query.eq('employee.profile.organization_id', organizationId);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as LeaveRequest[];
}

export async function getAllLeaveRequests(organizationId?: string): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types(*),
      employee:employees!inner(*, profile:profiles!inner(*), department:departments(*))
    `);

  if (organizationId) {
    query = query.eq('employee.profile.organization_id', organizationId);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

  if (error || !data) return [];
  return data as LeaveRequest[];
}

export async function processLeaveRequest(
  requestId: string,
  action: 'approve' | 'reject',
  approverName?: string
): Promise<LeaveProcessResponse> {
  const now = new Date().toISOString();

  // 1. Fetch request details
  const { data: reqData, error: reqErr } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(*, profile:profiles(*))')
    .eq('id', requestId)
    .single();

  if (reqErr || !reqData) throw new Error('Leave request not found');

  if (action === 'approve') {
    const y = new Date(reqData.start_date).getFullYear();
    const { data: balData } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', reqData.employee_id)
      .eq('leave_type_id', reqData.leave_type_id)
      .eq('year', y)
      .maybeSingle();

    if (balData) {
      const newUsed = (balData.used_days || 0) + reqData.days;
      const newRem = (balData.allocated_days || 0) - newUsed;
      await supabase
        .from('leave_balances')
        .update({ used_days: newUsed, remaining_days: newRem, updated_at: now })
        .eq('id', balData.id);
    }
  }

  // 2. Update status
  const { error: updateErr } = await supabase
    .from('leave_requests')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: approverName || 'HR Management',
      updated_at: now,
    })
    .eq('id', requestId);

  if (updateErr) throw updateErr;

  // 3. Trigger Notification
  if (reqData.employee?.profile_id) {
    try {
      const { createNotification } = await import('./notifications');
      await createNotification(
        reqData.employee.profile_id,
        'leave_status',
        `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        `Your leave request from ${reqData.start_date} to ${reqData.end_date} has been ${action}d.`
      );
    } catch (e) {}
  }

  return {
    success: true,
    message: `Leave request ${action}d successfully.`,
    request_id: requestId,
    new_status: action === 'approve' ? 'approved' : 'rejected',
  };
}
