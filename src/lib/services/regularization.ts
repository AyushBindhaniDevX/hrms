import { supabase } from '@/lib/supabase';
import type { AttendanceRegularization, AttendanceStatus } from '@/types';

/**
 * Attendance regularization service.
 *
 * Employees request a correction to an attendance record (missed punch, wrong time,
 * wrong status); HR/admin review and, on approval, the change is written back to the
 * `attendance` table.
 *
 * Build-safety: the `attendance_regularizations` table ships as a manual migration
 * (create_attendance_regularization_table.sql). Every read degrades to `[]` if the
 * table is missing, and writes throw a friendly, catchable error — nothing crashes
 * the app before the migration is run. Mirrors the graceful pattern in leave.ts /
 * payroll.ts (`if (error || !data) return []`).
 */

const REG_SELECT =
  '*, employee:employees(*, profile:profiles(*), department:departments!employees_department_id_fkey(*))';

/** True when a Supabase error means the table/relation hasn't been migrated yet. */
function isMissingTable(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  return (
    code === '42P01' || // undefined_table
    code === 'PGRST205' || // PostgREST: relation not found in schema cache
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

function friendlyMissingTableError(): Error {
  return new Error(
    'Attendance regularization is not set up yet. Please run the database migration (create_attendance_regularization_table.sql).'
  );
}

/** Local YYYY-MM-DD (matches attendance id format `${employeeId}_${YYYY-MM-DD}`). */
function ymd(dateStr: string): string {
  // Accept an ISO date or date-time and normalize to the local calendar day.
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** An employee's own regularization requests, newest first. */
export async function getMyRegularizations(employeeId: string): Promise<AttendanceRegularization[]> {
  if (!employeeId) return [];
  const { data, error } = await supabase
    .from('attendance_regularizations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as AttendanceRegularization[];
}

/**
 * The org-wide review queue for HR/admin. Pass a status to filter (e.g. 'pending');
 * omit to return everything (capped).
 */
export async function getOrgRegularizations(
  organizationId?: string,
  status?: AttendanceRegularization['status']
): Promise<AttendanceRegularization[]> {
  let query = supabase.from('attendance_regularizations').select(REG_SELECT);

  if (organizationId) {
    // Match on either the row's own org column or the employee's profile org.
    query = query.or(
      `organization_id.eq.${organizationId},employee.profile.organization_id.eq.${organizationId}`
    );
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('created_at', { ascending: status === 'pending' ? true : false })
    .limit(200);

  if (error || !data) return [];
  return data as AttendanceRegularization[];
}

export async function getPendingRegularizations(
  organizationId?: string
): Promise<AttendanceRegularization[]> {
  return getOrgRegularizations(organizationId, 'pending');
}

export interface SubmitRegularizationParams {
  employee_id: string;
  date: string; // YYYY-MM-DD
  requested_clock_in?: string | null; // ISO
  requested_clock_out?: string | null; // ISO
  requested_status?: AttendanceStatus | null;
  reason: string;
}

/**
 * Submit a new (pending) regularization request. Resolves the employee's organization
 * and links the existing attendance row for that day when one exists (FK is nullable,
 * so a completely missed day is allowed).
 */
export async function submitRegularization(
  params: SubmitRegularizationParams
): Promise<AttendanceRegularization> {
  const now = new Date().toISOString();

  if (!params.employee_id) {
    throw new Error('Your employee record could not be identified. Please try again.');
  }
  if (!params.reason || !params.reason.trim()) {
    throw new Error('Please provide a reason for this regularization.');
  }
  if (!params.date) {
    throw new Error('Please select the date to regularize.');
  }

  const day = ymd(params.date);

  // Resolve organization from the employee (best effort — column is nullable).
  let orgId: string | null = null;
  try {
    const { data: emp } = await supabase
      .from('employees')
      .select('id, organization_id, profile:profiles(organization_id)')
      .eq('id', params.employee_id)
      .maybeSingle();
    orgId = emp?.organization_id || (emp?.profile as any)?.organization_id || null;
  } catch {}

  // Link the existing attendance row for that day if it exists (FK requires a real row).
  let attendanceId: string | null = null;
  try {
    const candidateId = `${params.employee_id}_${day}`;
    const { data: att } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', candidateId)
      .maybeSingle();
    if (att?.id) attendanceId = att.id;
  } catch {}

  const { data, error } = await supabase
    .from('attendance_regularizations')
    .insert({
      employee_id: params.employee_id,
      organization_id: orgId,
      attendance_id: attendanceId,
      date: day,
      requested_clock_in: params.requested_clock_in || null,
      requested_clock_out: params.requested_clock_out || null,
      requested_status: params.requested_status || null,
      reason: params.reason.trim(),
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTable(error)) throw friendlyMissingTableError();
    console.error('submitRegularization error:', error);
    throw new Error(error.message || 'Could not submit your regularization request.');
  }

  return data as AttendanceRegularization;
}

/** Employee withdraws their own pending request. */
export async function cancelRegularization(id: string): Promise<void> {
  const { error } = await supabase
    .from('attendance_regularizations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    if (isMissingTable(error)) throw friendlyMissingTableError();
    throw new Error(error.message || 'Could not cancel this request.');
  }
}

/**
 * Apply an approved regularization to the attendance table: upsert the day's row with
 * the requested punch times / status and recompute working_minutes when both punches
 * are present.
 */
async function applyToAttendance(reg: AttendanceRegularization): Promise<void> {
  const now = new Date().toISOString();
  const day = ymd(reg.date);
  const attendanceId = reg.attendance_id || `${reg.employee_id}_${day}`;

  // Load any existing row so we preserve fields we aren't changing.
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('id', attendanceId)
    .maybeSingle();

  const clockIn = reg.requested_clock_in ?? existing?.clock_in ?? null;
  const clockOut = reg.requested_clock_out ?? existing?.clock_out ?? null;

  let workingMinutes = existing?.working_minutes ?? 0;
  if (clockIn && clockOut) {
    const mins = Math.floor((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000);
    if (!isNaN(mins) && mins >= 0) workingMinutes = mins;
  }

  const status = reg.requested_status ?? existing?.status ?? 'present';

  const payload: Record<string, any> = {
    id: attendanceId,
    employee_id: reg.employee_id,
    workplace_id: existing?.workplace_id ?? null,
    date: day,
    clock_in: clockIn,
    clock_out: clockOut,
    working_minutes: workingMinutes,
    status,
    updated_at: now,
    created_at: existing?.created_at || now,
  };

  const { error } = await supabase.from('attendance').upsert(payload);
  if (error) {
    console.error('applyToAttendance error:', error);
    throw new Error('The request was approved but the attendance record could not be updated.');
  }
}

/**
 * HR/admin decision. On 'approve', the requested change is written to attendance.
 * Notifies the employee. Never crashes the caller — throws a catchable, friendly error.
 */
export async function reviewRegularization(
  id: string,
  action: 'approve' | 'reject',
  reviewerId?: string,
  reviewNote?: string
): Promise<{ success: boolean; message: string }> {
  const now = new Date().toISOString();

  // 1. Load the request (with employee for notification).
  const { data: reg, error: fetchErr } = await supabase
    .from('attendance_regularizations')
    .select('*, employee:employees(*, profile:profiles(*))')
    .eq('id', id)
    .single();

  if (fetchErr || !reg) {
    if (isMissingTable(fetchErr)) throw friendlyMissingTableError();
    throw new Error('Regularization request not found.');
  }

  // 2. Apply to attendance first when approving; if it fails, don't mark approved.
  if (action === 'approve') {
    await applyToAttendance(reg as AttendanceRegularization);
  }

  // 3. Update the request status.
  const { error: updateErr } = await supabase
    .from('attendance_regularizations')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: reviewerId || 'HR Management',
      reviewed_at: now,
      review_note: reviewNote?.trim() || null,
      updated_at: now,
    })
    .eq('id', id);

  if (updateErr) {
    if (isMissingTable(updateErr)) throw friendlyMissingTableError();
    throw new Error(updateErr.message || 'Could not update this request.');
  }

  // 4. Notify the employee (best effort).
  const profileId = (reg as any).employee?.profile_id || (reg as any).employee?.profile?.id;
  if (profileId) {
    try {
      const { createNotification } = await import('./notifications');
      await createNotification(
        profileId,
        action === 'approve' ? 'success' : 'alert', // type
        `Attendance Regularization ${action === 'approve' ? 'Approved' : 'Rejected'}`, // title
        `Your attendance regularization for ${ymd((reg as any).date)} has been ${
          action === 'approve' ? 'approved and applied' : 'rejected'
        }.` // message
      );
    } catch (e) {}
  }

  return {
    success: true,
    message: `Regularization ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
  };
}
