import { supabase } from '@/lib/supabase';
import type { PayrollPeriod, Payroll, Payslip, Employee } from '@/types';

export async function getPayslips(employeeId: string): Promise<Payslip[]> {
  const { data, error } = await supabase
    .from('payslips')
    .select(`
      *,
      payroll:payroll(
        *,
        employee:employees(*, profile:profiles(*))
      )
    `)
    .eq('employee_id', employeeId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (error || !data) return [];
  return data as Payslip[];
}

export async function getPayslipDetail(payslipId: string): Promise<Payslip | null> {
  const { data, error } = await supabase
    .from('payslips')
    .select(`
      *,
      payroll:payroll(
        *,
        employee:employees(*, profile:profiles(*))
      )
    `)
    .eq('id', payslipId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Payslip;
}

export async function getPayrollPeriods(): Promise<PayrollPeriod[]> {
  const { data, error } = await supabase
    .from('payroll_periods')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error || !data) return [];
  return data as PayrollPeriod[];
}

export async function createPayrollPeriod(month: number, year: number, orgId: string): Promise<PayrollPeriod> {
  const now = new Date().toISOString();

  // 1. Create payroll period
  const { data: period, error: periodErr } = await supabase
    .from('payroll_periods')
    .insert({
      month,
      year,
      organization_id: orgId,
      status: 'open',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (periodErr) throw periodErr;

  // 2. Fetch active employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('employment_status', 'active');

  // 3. Generate draft payroll entries
  if (employees && employees.length > 0) {
    const entries = employees.map((emp) => {
      const basic = emp.basic_salary || 0;
      return {
        payroll_period_id: period.id,
        employee_id: emp.id,
        basic_salary: basic,
        allowances: {},
        deductions: {},
        lop_days: 0,
        lop_amount: 0,
        gross_salary: basic,
        net_salary: basic,
        status: 'draft',
        created_at: now,
        updated_at: now,
      };
    });

    await supabase.from('payroll').insert(entries);
  }

  return period as PayrollPeriod;
}

export async function getPayrollEntries(periodId: string): Promise<Payroll[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select(`
      *,
      employee:employees(*, profile:profiles(*), department:departments(*))
    `)
    .eq('payroll_period_id', periodId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as Payroll[];
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
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('payroll')
    .insert({
      ...entry,
      status: 'draft',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Payroll;
}

export async function updatePayrollEntry(
  id: string,
  updates: Partial<Payroll>
): Promise<void> {
  const { error } = await supabase
    .from('payroll')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function processPayrollPeriod(periodId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('payroll')
    .update({ status: 'processed', updated_at: now })
    .eq('payroll_period_id', periodId);

  await supabase
    .from('payroll_periods')
    .update({ status: 'closed', processed_at: now, updated_at: now })
    .eq('id', periodId);
}

export async function distributePayroll(periodId: string, month: number, year: number): Promise<void> {
  const now = new Date().toISOString();

  // Mark all entries as paid
  const { data: entries } = await supabase
    .from('payroll')
    .select('*')
    .eq('payroll_period_id', periodId)
    .eq('status', 'processed');

  if (!entries || entries.length === 0) return;

  await supabase
    .from('payroll')
    .update({ status: 'paid', updated_at: now })
    .eq('payroll_period_id', periodId);

  // Generate payslips
  const payslips = entries.map((entry) => ({
    payroll_id: entry.id,
    employee_id: entry.employee_id,
    payslip_number: `PS-${year}${String(month).padStart(2, '0')}-${entry.id.substring(0, 5).toUpperCase()}`,
    period_month: month,
    period_year: year,
    created_at: now,
  }));

  await supabase.from('payslips').insert(payslips);
}
