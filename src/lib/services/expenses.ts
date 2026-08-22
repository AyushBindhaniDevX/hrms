/**
 * Expenses & Reimbursements Service
 * Subedge Technology Pvt Ltd — Oasis Platform
 */

import { ExpenseClaim, ExpenseStatus, ExpenseCategory } from '@/types/database';

let EXPENSES_STORE: ExpenseClaim[] = [
  {
    id: 'exp_1',
    organization_id: 'subedge_org',
    employee_id: 'emp_demo',
    title: 'High-speed Fiber Internet (March 2026)',
    category: 'internet',
    amount: 1499,
    currency: 'INR',
    description: 'Monthly broadband bill for remote engineering setup.',
    status: 'approved',
    spent_at: '2026-03-01',
    approved_by: 'HR Admin',
    approved_at: '2026-03-02',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'exp_2',
    organization_id: 'subedge_org',
    employee_id: 'emp_demo',
    title: 'AWS Certified Security Specialty Exam Voucher',
    category: 'learning',
    amount: 16500,
    currency: 'INR',
    description: 'Professional certification reimbursement per company L&D policy.',
    status: 'pending',
    spent_at: '2026-03-05',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'exp_3',
    organization_id: 'subedge_org',
    employee_id: 'emp_demo',
    title: 'Client Lunch at Bengaluru Office',
    category: 'meals',
    amount: 3200,
    currency: 'INR',
    description: 'Enterprise healthcare partner quarterly roadmap meeting.',
    status: 'reimbursed',
    spent_at: '2026-02-24',
    approved_by: 'Finance Lead',
    approved_at: '2026-02-25',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

export async function getExpenses(employeeId?: string): Promise<ExpenseClaim[]> {
  if (employeeId) {
    return EXPENSES_STORE.filter((e) => e.employee_id === employeeId);
  }
  return [...EXPENSES_STORE];
}

export async function createExpenseClaim(
  data: Omit<ExpenseClaim, 'id' | 'status' | 'created_at'>
): Promise<ExpenseClaim> {
  const newClaim: ExpenseClaim = {
    ...data,
    id: `exp_${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  EXPENSES_STORE.unshift(newClaim);
  return newClaim;
}

export async function updateExpenseStatus(
  expenseId: string,
  status: ExpenseStatus,
  reviewerName: string,
  comments?: string
): Promise<ExpenseClaim> {
  const claim = EXPENSES_STORE.find((e) => e.id === expenseId);
  if (!claim) throw new Error('Expense claim not found');
  claim.status = status;
  claim.approved_by = reviewerName;
  claim.approved_at = new Date().toISOString();
  if (comments) claim.comments = comments;
  return claim;
}
