/**
 * Expenses & Reimbursements Service (Cloud Firestore)
 * Oasis HRMS Multi-Tenant Platform
 */

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { ExpenseClaim, ExpenseStatus, ExpenseCategory, Employee, Profile } from '@/types/database';

export async function getExpenses(employeeId?: string, organizationId?: string): Promise<ExpenseClaim[]> {
  try {
    const [expSnap, empsSnap, profsSnap] = await Promise.all([
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'employees')),
      getDocs(collection(db, 'profiles')),
    ]);

    const profMap = new Map<string, Profile>();
    profsSnap.forEach((d) => profMap.set(d.id, { id: d.id, ...d.data() } as Profile));

    const empMap = new Map<string, Employee>();
    empsSnap.forEach((d) => {
      const emp = { id: d.id, ...d.data() } as Employee;
      emp.profile = emp.profile_id ? profMap.get(emp.profile_id) : undefined;
      empMap.set(d.id, emp);
    });

    const expenses: ExpenseClaim[] = [];
    expSnap.forEach((d) => {
      const exp = { id: d.id, ...d.data() } as ExpenseClaim;
      if (employeeId && exp.employee_id !== employeeId) {
        return;
      }
      if (organizationId && exp.organization_id && exp.organization_id !== organizationId) {
        return;
      }
      exp.employee = exp.employee_id ? empMap.get(exp.employee_id) : undefined;
      expenses.push(exp);
    });

    expenses.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return expenses;
  } catch (err) {
    console.error('getExpenses error:', err);
    return [];
  }
}

export async function createExpenseClaim(
  data: Omit<ExpenseClaim, 'id' | 'status' | 'created_at'>
): Promise<ExpenseClaim> {
  const newId = `exp_${Date.now()}`;
  const now = new Date().toISOString();
  const newClaim: ExpenseClaim = {
    ...data,
    id: newId,
    status: 'pending',
    created_at: now,
  };

  await setDoc(doc(db, 'expenses', newId), newClaim);
  return newClaim;
}

export async function updateExpenseStatus(
  expenseId: string,
  status: ExpenseStatus,
  reviewerName: string,
  comments?: string
): Promise<void> {
  const now = new Date().toISOString();

  const expSnap = await getDoc(doc(db, 'expenses', expenseId));
  const expData = expSnap.exists() ? (expSnap.data() as ExpenseClaim) : null;

  await updateDoc(doc(db, 'expenses', expenseId), {
    status,
    approved_by: reviewerName,
    approved_at: now,
    ...(comments ? { comments } : {}),
    updated_at: now,
  });

  if (expData && (status === 'approved' || status === 'rejected')) {
    try {
      if (expData.employee_id) {
        const empSnap = await getDoc(doc(db, 'employees', expData.employee_id));
        if (empSnap.exists()) {
          const emp = empSnap.data() as Employee;
          let recipientEmail = '';
          let recipientName = 'Colleague';

          if (emp.profile_id) {
            const profSnap = await getDoc(doc(db, 'profiles', emp.profile_id));
            if (profSnap.exists()) {
              const prof = profSnap.data() as Profile;
              recipientEmail = prof.email || '';
              recipientName = prof.full_name || recipientName;
            }

            const { createNotification } = await import('./notifications');
            const claimTitle = expData.title || 'Expense Reimbursement';
            const claimAmount = expData.amount || 0;
            await createNotification(
              emp.profile_id,
              'expense',
              status === 'approved' ? 'Expense Claim Approved' : 'Expense Claim Rejected',
              `Your claim "${claimTitle}" (₹${claimAmount}) has been ${status}.`
            );
          }

          if (recipientEmail) {
            try {
              const { sendExpenseStatusEmail } = await import('./resend');
              await sendExpenseStatusEmail(
                recipientEmail,
                recipientName,
                expData.title || 'Expense Reimbursement',
                expData.amount || 0,
                status as 'approved' | 'rejected',
                {
                  organizationId: expData.organization_id || emp.organization_id || undefined,
                  claimId: expenseId,
                  reviewerNote: comments,
                }
              );
            } catch (mailErr) {
              console.warn('Expense status email dispatch warning:', mailErr);
            }
          }
        }
      }
    } catch (e) {}
  }
}

export async function deleteExpenseClaim(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', expenseId));
}
