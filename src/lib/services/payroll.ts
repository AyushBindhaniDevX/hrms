import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { PayrollPeriod, Payroll, Payslip, Employee } from '@/types';

export async function getPayslips(employeeId: string): Promise<Payslip[]> {
  const q = query(
    collection(db, 'payslips'),
    where('employee_id', '==', employeeId),
    orderBy('period_year', 'desc'),
    orderBy('period_month', 'desc')
  );
  const snap = await getDocs(q);
  const payslips = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  for (const ps of payslips) {
    if (ps.payroll_id) {
      const pDoc = await getDoc(doc(db, 'payroll', ps.payroll_id));
      if (pDoc.exists()) ps.payroll = { id: pDoc.id, ...pDoc.data() };
    }
  }
  
  return payslips as Payslip[];
}

export async function getPayslipDetail(payslipId: string): Promise<Payslip | null> {
  const docSnap = await getDoc(doc(db, 'payslips', payslipId));
  if (!docSnap.exists()) return null;
  const ps = { id: docSnap.id, ...docSnap.data() } as any;
  
  if (ps.payroll_id) {
    const pDoc = await getDoc(doc(db, 'payroll', ps.payroll_id));
    if (pDoc.exists()) {
      ps.payroll = { id: pDoc.id, ...pDoc.data() };
      
      if (ps.payroll.employee_id) {
        const eDoc = await getDoc(doc(db, 'employees', ps.payroll.employee_id));
        if (eDoc.exists()) {
          ps.payroll.employee = { id: eDoc.id, ...eDoc.data() };
          if (ps.payroll.employee.profile_id) {
             const profDoc = await getDoc(doc(db, 'profiles', ps.payroll.employee.profile_id));
             if (profDoc.exists()) ps.payroll.employee.profile = { id: profDoc.id, ...profDoc.data() };
          }
        }
      }
    }
  }
  
  return ps as Payslip;
}

// HR Functions
export async function getPayrollPeriods(): Promise<PayrollPeriod[]> {
  const q = query(
    collection(db, 'payroll_periods'),
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollPeriod));
}

export async function createPayrollPeriod(month: number, year: number, orgId: string): Promise<PayrollPeriod> {
  const newRef = doc(collection(db, 'payroll_periods'));
  const data = {
    id: newRef.id,
    month,
    year,
    organization_id: orgId,
    status: 'open',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  await setDoc(newRef, data);
  return data as unknown as PayrollPeriod;
}

export async function getPayrollEntries(periodId: string): Promise<Payroll[]> {
  const q = query(
    collection(db, 'payroll'),
    where('payroll_period_id', '==', periodId),
    orderBy('created_at', 'asc')
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  for (const entry of entries) {
    if (entry.employee_id) {
      const eDoc = await getDoc(doc(db, 'employees', entry.employee_id));
      if (eDoc.exists()) {
        entry.employee = { id: eDoc.id, ...eDoc.data() };
        if (entry.employee.profile_id) {
           const profDoc = await getDoc(doc(db, 'profiles', entry.employee.profile_id));
           if (profDoc.exists()) entry.employee.profile = { id: profDoc.id, ...profDoc.data() };
        }
        if (entry.employee.department_id) {
           const dDoc = await getDoc(doc(db, 'departments', entry.employee.department_id));
           if (dDoc.exists()) entry.employee.department = { id: dDoc.id, ...dDoc.data() };
        }
      }
    }
  }
  
  return entries as Payroll[];
}

export async function createPayrollEntry(entry: {
  payroll_period_id: string;
  employee_id: string;
  basic_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  lop_days: number;
  lop_amount: number;
  gross_salary: number;
  net_salary: number;
}): Promise<Payroll> {
  const newRef = doc(collection(db, 'payroll'));
  const data = {
    id: newRef.id,
    ...entry,
    status: 'draft',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  await setDoc(newRef, data);
  return data as unknown as Payroll;
}

export async function updatePayrollEntry(
  id: string,
  updates: Partial<Payroll>
): Promise<void> {
  await updateDoc(doc(db, 'payroll', id), {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

export async function processPayrollPeriod(periodId: string): Promise<void> {
  // Get all payroll entries
  const q = query(collection(db, 'payroll'), where('payroll_period_id', '==', periodId));
  const snap = await getDocs(q);
  
  // Use a batch to process
  const batch = writeBatch(db);
  
  snap.docs.forEach(d => {
    batch.update(d.ref, {
      status: 'processed',
      updated_at: serverTimestamp()
    });
  });
  
  // Update period
  const periodRef = doc(db, 'payroll_periods', periodId);
  batch.update(periodRef, {
    status: 'closed',
    processed_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  
  await batch.commit();
}

export async function generatePayslip(payrollId: string, employeeId: string, month: number, year: number): Promise<Payslip> {
  const payslipNumber = `PS-${year}${String(month).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;
  const newRef = doc(collection(db, 'payslips'));
  
  const data = {
    id: newRef.id,
    payroll_id: payrollId,
    employee_id: employeeId,
    payslip_number: payslipNumber,
    period_month: month,
    period_year: year,
    created_at: serverTimestamp(),
  };
  
  await setDoc(newRef, data);
  return data as unknown as Payslip;
}
