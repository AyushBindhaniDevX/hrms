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
  const newPeriodRef = doc(collection(db, 'payroll_periods'));
  const periodData = {
    id: newPeriodRef.id,
    month,
    year,
    organization_id: orgId,
    status: 'open',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(newPeriodRef, periodData);

  // Auto-generate payroll entries for all active employees
  const empSnap = await getDocs(query(collection(db, 'employees'), where('employment_status', '==', 'active')));
  
  // Fetch approved leaves to calculate LOP
  const lvSnap = await getDocs(query(collection(db, 'leave_requests'), where('status', '==', 'approved')));
  const unpaidLeavesByEmp: Record<string, number> = {};
  
  lvSnap.docs.forEach(lvDoc => {
    const lv = lvDoc.data();
    // Check if leave falls in this month and year (simple parsing)
    const startDate = new Date(lv.start_date);
    if (startDate.getMonth() + 1 === month && startDate.getFullYear() === year) {
      if (!lv.is_paid) {
        unpaidLeavesByEmp[lv.employee_id] = (unpaidLeavesByEmp[lv.employee_id] || 0) + (lv.total_days || 0);
      }
    }
  });
  
  empSnap.docs.forEach(empDoc => {
    const empData = empDoc.data();
    const basicSalary = empData.basic_salary || 0;
    
    // Auto-calculate LOP based on unpaid leaves
    const lopDays = unpaidLeavesByEmp[empDoc.id] || 0;
    const lopAmount = Math.round((basicSalary / 30) * lopDays);
    const allowances = {};
    const deductions = {};
    
    // basic - lop
    const grossSalary = basicSalary - lopAmount;
    const netSalary = grossSalary;

    const newPayrollRef = doc(collection(db, 'payroll'));
    batch.set(newPayrollRef, {
      id: newPayrollRef.id,
      payroll_period_id: newPeriodRef.id,
      employee_id: empDoc.id,
      basic_salary: basicSalary,
      allowances,
      deductions,
      lop_days: lopDays,
      lop_amount: lopAmount,
      gross_salary: grossSalary,
      net_salary: netSalary,
      status: 'draft',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });

  await batch.commit();
  return periodData as unknown as PayrollPeriod;
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

export async function updatePayrollEntry(id: string, updates: Partial<Payroll>): Promise<void> {
  const ref = doc(db, 'payroll', id);
  await updateDoc(ref, {
    ...updates,
    updated_at: serverTimestamp()
  });
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

export async function distributePayroll(periodId: string, month: number, year: number): Promise<void> {
  const q = query(collection(db, 'payroll'), where('payroll_period_id', '==', periodId), where('status', '==', 'processed'));
  const snap = await getDocs(q);
  
  if (snap.empty) return;

  const batch = writeBatch(db);
  
  snap.docs.forEach(d => {
    // Mark as paid
    batch.update(d.ref, {
      status: 'paid',
      updated_at: serverTimestamp()
    });

    // Generate Payslip
    const payslipNumber = `PS-${year}${String(month).padStart(2, '0')}-${d.id.substring(0, 5).toUpperCase()}`;
    const newPayslipRef = doc(collection(db, 'payslips'));
    
    batch.set(newPayslipRef, {
      id: newPayslipRef.id,
      payroll_id: d.id,
      employee_id: d.data().employee_id,
      payslip_number: payslipNumber,
      period_month: month,
      period_year: year,
      created_at: serverTimestamp(),
    });
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
