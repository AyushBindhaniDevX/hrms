/**
 * Expenses & Reimbursements Service (Dynamic Firestore)
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { ExpenseClaim, ExpenseStatus, ExpenseCategory } from '@/types/database';
import { seedDatabaseIfEmpty } from './seed';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export async function getExpenses(employeeId?: string): Promise<ExpenseClaim[]> {
  await seedDatabaseIfEmpty();

  try {
    const expensesRef = collection(db, 'expenses');
    let q = query(expensesRef);

    if (employeeId) {
      q = query(expensesRef, where('employee_id', '==', employeeId));
    }

    const snapshot = await getDocs(q);
    const results: ExpenseClaim[] = [];
    snapshot.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as ExpenseClaim);
    });

    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching expenses from Firestore:', error);
    return [];
  }
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

  try {
    await setDoc(doc(db, 'expenses', newId), newClaim);
  } catch (error) {
    console.error('Error creating expense in Firestore:', error);
  }

  return newClaim;
}

export async function updateExpenseStatus(
  expenseId: string,
  status: ExpenseStatus,
  reviewerName: string,
  comments?: string
): Promise<void> {
  try {
    const expRef = doc(db, 'expenses', expenseId);
    await updateDoc(expRef, {
      status,
      approved_by: reviewerName,
      approved_at: new Date().toISOString(),
      ...(comments ? { comments } : {}),
    });

    if (status === 'approved' || status === 'rejected') {
      const { sendExpenseStatusEmail } = await import('./resend');
      await sendExpenseStatusEmail(
        'ayush.bindhani@subedge.com',
        'Ayush Bindhani',
        'Expense Reimbursement Claim',
        3450,
        status
      );
    }
  } catch (error) {
    console.error('Error updating expense status in Firestore:', error);
  }
}
