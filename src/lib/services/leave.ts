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

export async function getLeaveTypes(organizationId?: string): Promise<LeaveType[]> {
  try {
    let query = supabase.from('leave_types').select('*');
    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      const unique = Array.from(new Map((data as LeaveType[]).map((item) => [item.name, item])).values());
      return unique;
    }
  } catch (err) {
    console.warn('Could not query remote leave_types, using defaults:', err);
  }

  // Safe fallback to default leave types without causing 409 conflicts
  return DEFAULT_LEAVE_TYPES.map((lt, idx) => ({
    id: `lt_${idx + 1}`,
    name: lt.name,
    annual_days: lt.annual_days,
    is_paid: lt.is_paid,
    organization_id: organizationId || '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as LeaveType[];
}

export async function getLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalance[]> {
  const y = year ?? new Date().getFullYear();
  try {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*, leave_type:leave_types(*)')
      .eq('employee_id', employeeId)
      .eq('year', y);

    if (!error && data && data.length > 0) {
      return data as LeaveBalance[];
    }
  } catch (err) {}

  // If no specific balance rows exist yet in the database for this employee,
  // generate default active quotas from leave types
  const types = await getLeaveTypes();
  return types.map((lt) => ({
    id: `bal_${employeeId}_${lt.id}_${y}`,
    employee_id: employeeId,
    leave_type_id: lt.id,
    year: y,
    allocated_days: lt.annual_days || 12,
    used_days: 0,
    remaining_days: lt.annual_days || 12,
    leave_type: lt,
  })) as LeaveBalance[];
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
        `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        `Your ${reqData.leave_type?.name || 'leave'} request for ${reqData.days} day(s) from ${reqData.start_date} to ${reqData.end_date} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        action === 'approve' ? 'success' : 'alert'
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

export async function updateLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  allocatedDays: number,
  usedDays: number = 0,
  year?: number
): Promise<void> {
  const y = year ?? new Date().getFullYear();
  const id = `bal_${employeeId}_${leaveTypeId}_${y}`;
  const remaining = Math.max(0, allocatedDays - usedDays);
  const now = new Date().toISOString();

  const payload = {
    id,
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    year: y,
    allocated_days: allocatedDays,
    used_days: usedDays,
    remaining_days: remaining,
    updated_at: now,
  };

  const { error } = await supabase.from('leave_balances').upsert(payload);
  if (error) throw error;
}
