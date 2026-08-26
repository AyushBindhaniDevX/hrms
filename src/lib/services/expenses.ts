/**
 * Expenses & Reimbursements Service (Supabase)
 * Oasis HRMS Multi-Tenant Platform
 */

import { supabase } from '@/lib/supabase';
import { ExpenseClaim, ExpenseStatus, ExpenseCategory } from '@/types/database';

export async function getExpenses(employeeId?: string): Promise<ExpenseClaim[]> {
  let query = supabase.from('expenses').select('*');

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as ExpenseClaim[];
}

export async function createExpenseClaim(
  data: Omit<ExpenseClaim, 'id' | 'status' | 'created_at'>
): Promise<ExpenseClaim> {
  const newId = `exp_${Date.now()}`;
  const newClaim: ExpenseClaim = {
    ...data,
    id: newId,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('expenses').insert(newClaim);
  if (error) {
    console.error('Error creating expense claim in Supabase:', error);
  }

  return newClaim;
}

export async function updateExpenseStatus(
  expenseId: string,
  status: ExpenseStatus,
  reviewerName: string,
  comments?: string
): Promise<void> {
  const now = new Date().toISOString();

  const { data: expData } = await supabase
    .from('expenses')
    .select('*, employee:employees(*, profile:profiles(*))')
    .eq('id', expenseId)
    .maybeSingle();

  const { error } = await supabase
    .from('expenses')
    .update({
      status,
      approved_by: reviewerName,
      approved_at: now,
      ...(comments ? { comments } : {}),
      updated_at: now,
    })
    .eq('id', expenseId);

  if (error) throw error;

  if (expData && (status === 'approved' || status === 'rejected')) {
    try {
      const profileId = expData.employee?.profile_id;
      const claimTitle = expData.title || 'Expense Reimbursement';
      const claimAmount = expData.amount || 0;

      if (profileId) {
        const { createNotification } = await import('./notifications');
        await createNotification(
          profileId,
          'expense',
          status === 'approved' ? 'Expense Claim Approved' : 'Expense Claim Rejected',
          `Your claim "${claimTitle}" (₹${claimAmount}) has been ${status}.`
        );
      }
    } catch (e) {}
  }
}

export async function deleteExpenseClaim(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}
