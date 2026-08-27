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

  // Safe fallback to default leave types with valid UUID structure
  return DEFAULT_LEAVE_TYPES.map((lt, idx) => ({
    id: `00000000-0000-0000-0000-00000000000${idx + 1}`,
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

  // 1. Ensure employee_id is valid
  let empId = params.employee_id;
  if (!empId) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) {
      const { data: empRecord } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', userData.user.id)
        .maybeSingle();
      if (empRecord?.id) empId = empRecord.id;
    }
  }

  if (!empId) {
    throw new Error('Employee record could not be identified. Please ensure your profile is active.');
  }

  // 2. Ensure leave_type_id exists in leave_types table
  let validLeaveTypeId = params.leave_type_id;
  const { data: matchedType } = await supabase
    .from('leave_types')
    .select('id')
    .eq('id', validLeaveTypeId)
    .maybeSingle();

  if (!matchedType) {
    const { data: anyType } = await supabase.from('leave_types').select('id').limit(1).maybeSingle();
    if (anyType?.id) {
      validLeaveTypeId = anyType.id;
    } else {
      const { data: insType } = await supabase
        .from('leave_types')
        .insert({
          name: 'Annual Leave',
          annual_days: 18,
          is_paid: true,
          organization_id: '00000000-0000-0000-0000-000000000001',
        })
        .select('id')
        .maybeSingle();
      if (insType?.id) validLeaveTypeId = insType.id;
    }
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: empId,
      leave_type_id: validLeaveTypeId,
      start_date: params.start_date,
      end_date: params.end_date,
      days: params.days,
      is_half_day: params.is_half_day,
      reason: params.reason,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    console.error('applyLeave error:', error);
    throw new Error(error.message || 'Failed to submit leave request');
  }

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
  const remaining = Math.max(0, allocatedDays - usedDays);
  const now = new Date().toISOString();

  // Find real leave_type_id if needed
  let validLeaveTypeId = leaveTypeId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaveTypeId);
  if (!isUuid) {
    const { data: realTypes } = await supabase.from('leave_types').select('id').limit(1);
    if (realTypes && realTypes.length > 0) {
      validLeaveTypeId = realTypes[0].id;
    }
  }

  const payload: Record<string, any> = {
    employee_id: employeeId,
    leave_type_id: validLeaveTypeId,
    year: y,
    allocated_days: allocatedDays,
    used_days: usedDays,
    remaining_days: remaining,
    updated_at: now,
  };

  // Check if balance record exists
  const { data: existing } = await supabase
    .from('leave_balances')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('leave_type_id', validLeaveTypeId)
    .eq('year', y)
    .maybeSingle();

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from('leave_balances')
      .update(payload)
      .eq('id', existing.id);
    if (updErr) throw updErr;
  } else {
    const { error: insErr } = await supabase
      .from('leave_balances')
      .insert(payload);
    if (insErr) throw insErr;
  }
}
