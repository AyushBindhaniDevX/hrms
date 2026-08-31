import { supabase } from '@/lib/supabase';
import { getEmployees } from './employee';
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

import { getHolidaysForDateRange } from './holidays';

export async function getPayrollPeriods(organizationId?: string): Promise<PayrollPeriod[]> {
  let query = supabase
    .from('payroll_periods')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as PayrollPeriod[];
}

/** Count absent + unpaid-leave days for an employee in a given month/year, EXCLUDING declared holidays */
async function countLopDays(employeeId: string, month: number, year: number): Promise<number> {
  try {
    // Build date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    // 1. Fetch holidays in this period to exclude from absent count
    const holidays = await getHolidaysForDateRange(startDate, endDate);
    const holidayDates = new Set(holidays.filter(h => h.type !== 'optional').map(h => h.date));

    // 2. Count absent attendance days that are NOT declared holidays
    const { data: absentRecords } = await supabase
      .from('attendance')
      .select('id, date')
      .eq('employee_id', employeeId)
      .eq('status', 'absent')
      .gte('date', startDate)
      .lt('date', endDate);

    const validAbsences = (absentRecords || []).filter(r => !holidayDates.has(r.date));
    const absentDays = validAbsences.length;

    // 3. Count approved unpaid leave days in the period
    const { data: unpaidLeaves } = await supabase
      .from('leave_requests')
      .select('days, leave_type:leave_types(is_paid)')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('start_date', startDate)
      .lt('start_date', endDate);

    const unpaidLeaveDays = (unpaidLeaves || []).reduce((acc, lr) => {
      const isPaid = (lr.leave_type as any)?.is_paid ?? true;
      return isPaid ? acc : acc + (lr.days || 0);
    }, 0);

    return absentDays + unpaidLeaveDays;
  } catch {
    return 0;
  }
}

/** Calculate TDS based on annual taxable income and employee tax regime / custom TDS % */
export function calculateTds(annualBasic: number, taxConfig?: Record<string, any>): number {
  if (taxConfig?.tds_percentage != null && !isNaN(Number(taxConfig.tds_percentage)) && taxConfig.tds_percentage !== '') {
    return Math.round((annualBasic * Number(taxConfig.tds_percentage)) / 100);
  }

  const regime = taxConfig?.tax_regime || 'new';
  const annualTaxable = annualBasic * 12;

  if (regime === 'custom') {
    const customRate = Number(taxConfig?.custom_tax_percentage ?? taxConfig?.tds_percentage ?? 0);
    return Math.round((annualBasic * customRate) / 100);
  }

  if (regime === 'old') {
    // Old regime slabs (FY 2024-25 / 2026, simplified)
    let tax = 0;
    if (annualTaxable <= 250000) tax = 0;
    else if (annualTaxable <= 500000) tax = (annualTaxable - 250000) * 0.05;
    else if (annualTaxable <= 1000000) tax = 12500 + (annualTaxable - 500000) * 0.2;
    else tax = 112500 + (annualTaxable - 1000000) * 0.3;
    return Math.round(tax / 12);
  } else {
    // New regime slabs
    let tax = 0;
    if (annualTaxable <= 300000) tax = 0;
    else if (annualTaxable <= 700000) tax = (annualTaxable - 300000) * 0.05;
    else if (annualTaxable <= 1000000) tax = 20000 + (annualTaxable - 700000) * 0.1;
    else if (annualTaxable <= 1200000) tax = 50000 + (annualTaxable - 1000000) * 0.15;
    else if (annualTaxable <= 1500000) tax = 80000 + (annualTaxable - 1200000) * 0.2;
    else tax = 140000 + (annualTaxable - 1500000) * 0.3;
    if (annualTaxable <= 700000) tax = 0;
    return Math.round(tax / 12);
  }
}

/**
 * Computes statutory salary breakdown strictly from an employee's profile and enrollment tax_config
 */
export async function calculateStatutoryForEmployee(
  emp: Employee,
  month: number,
  year: number,
  customLopDays?: number
): Promise<{
  basic_salary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  lop_days: number;
  lop_amount: number;
  gross_salary: number;
  net_salary: number;
}> {
  const basic = emp.basic_salary || 0;
  const taxConfig = (emp as any).tax_config || {};

  // 1. EPF (Employee 12% or custom percentage / exempt)
  let epfRate = 0.12;
  if (taxConfig.epf_exempt) {
    epfRate = 0;
  } else if (taxConfig.epf_percentage != null && !isNaN(Number(taxConfig.epf_percentage))) {
    epfRate = Number(taxConfig.epf_percentage) / 100;
  }
  const epf = Math.round(basic * epfRate);

  // 2. Professional Tax (PT)
  let pt = basic > 15000 ? 200 : 0;
  if (taxConfig.pt_amount != null && !isNaN(Number(taxConfig.pt_amount))) {
    pt = Number(taxConfig.pt_amount);
  }

  // 3. TDS / Income Tax
  const tds = calculateTds(basic, taxConfig);

  // 4. LOP Days & Amount (excluding declared public holidays)
  const lopDays = customLopDays !== undefined ? customLopDays : await countLopDays(emp.id, month, year);
  const lopAmount = lopDays > 0 ? Math.round((basic / 26) * lopDays) : 0;

  // 5. Allowances: HRA & Special Allowance
  let hraRate = taxConfig.hra_type === 'metro' ? 0.5 : 0.4;
  if (taxConfig.hra_percentage != null && !isNaN(Number(taxConfig.hra_percentage))) {
    hraRate = Number(taxConfig.hra_percentage) / 100;
  }
  const hra = Math.round(basic * hraRate);
  const specialAllowance = Math.max(0, Math.round(basic * 0.1));

  const allowances: Record<string, number> = {
    'HRA': hra,
    'Special Allowance': specialAllowance,
  };

  if (taxConfig.transport_allowance && Number(taxConfig.transport_allowance) > 0) {
    allowances['Transport Allowance'] = Math.round(Number(taxConfig.transport_allowance));
  }

  const deductions: Record<string, number> = {
    'EPF': epf,
    'Professional Tax': pt,
    'TDS': tds,
  };

  // 6. Custom Admin Enrolled Allowances, Bonuses, Deductions & Taxes
  const customItems: any[] = Array.isArray(taxConfig.custom_items) ? taxConfig.custom_items : [];
  customItems.forEach((item) => {
    if (!item.name || !item.value) return;
    const isPercentage = item.amount_type === 'percentage';
    const computedVal = isPercentage ? Math.round((basic * Number(item.value)) / 100) : Math.round(Number(item.value));
    
    if (item.type === 'deduction') {
      deductions[item.name] = computedVal;
    } else {
      // 'earning', 'bonus', 'reimbursement'
      allowances[item.name] = computedVal;
    }
  });

  const totalAllowances = Object.values(allowances).reduce((sum, v) => sum + v, 0);
  const gross = basic + totalAllowances - lopAmount;
  const totalDeductions = Object.values(deductions).reduce((sum, v) => sum + v, 0);
  const netSalary = Math.max(0, gross - totalDeductions);

  return {
    basic_salary: basic,
    allowances,
    deductions,
    lop_days: lopDays,
    lop_amount: lopAmount,
    gross_salary: gross,
    net_salary: netSalary,
  };
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

  // 2. Fetch active employees for this organization
  const employees = await getEmployees({ organization_id: orgId, employment_status: 'active' });

  // 3. Generate draft payroll entries reflecting all enrolled PF, TDS, HRA & PT details
  if (employees && employees.length > 0) {
    const entries = await Promise.all(
      employees.map(async (emp) => {
        const breakdown = await calculateStatutoryForEmployee(emp, month, year);
        return {
          payroll_period_id: period.id,
          employee_id: emp.id,
          basic_salary: breakdown.basic_salary,
          allowances: breakdown.allowances,
          deductions: breakdown.deductions,
          lop_days: breakdown.lop_days,
          lop_amount: breakdown.lop_amount,
          gross_salary: breakdown.gross_salary,
          net_salary: breakdown.net_salary,
          status: 'draft',
          created_at: now,
          updated_at: now,
        };
      })
    );

    await supabase.from('payroll').insert(entries);
  }

  return period as PayrollPeriod;
}

/**
 * Re-sync and recalculate all draft entries in a payroll period using the latest employee details
 */
export async function recalculatePeriodEntries(periodId: string): Promise<void> {
  const { data: period } = await supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (!period) throw new Error('Payroll period not found');

  const { data: existingEntries } = await supabase
    .from('payroll')
    .select('*, employee:employees(*, profile:profiles(*))')
    .eq('payroll_period_id', periodId);

  if (!existingEntries || existingEntries.length === 0) return;

  const now = new Date().toISOString();

  for (const entry of existingEntries) {
    if (entry.employee) {
      const breakdown = await calculateStatutoryForEmployee(
        entry.employee as Employee,
        period.month,
        period.year,
        entry.lop_days
      );

      await supabase
        .from('payroll')
        .update({
          basic_salary: breakdown.basic_salary,
          allowances: breakdown.allowances,
          deductions: breakdown.deductions,
          lop_amount: breakdown.lop_amount,
          gross_salary: breakdown.gross_salary,
          net_salary: breakdown.net_salary,
          updated_at: now,
        })
        .eq('id', entry.id);
    }
  }
}

export async function getPayrollEntries(periodId: string): Promise<Payroll[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select(`
      *,
      employee:employees(*, profile:profiles(*), department:departments!employees_department_id_fkey(*))
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

  // Generate payslips for all employees in this period
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

/** Generate a payslip for a single payroll entry (called by HR on demand) */
export async function generatePayslipForEntry(
  payrollEntry: Payroll,
  month: number,
  year: number
): Promise<Payslip> {
  const now = new Date().toISOString();

  // Check if payslip already exists for this payroll entry
  const { data: existing } = await supabase
    .from('payslips')
    .select('*')
    .eq('payroll_id', payrollEntry.id)
    .maybeSingle();

  if (existing) return existing as Payslip;

  // Mark payroll entry as paid if it's processed
  if (payrollEntry.status === 'processed' || payrollEntry.status === 'draft') {
    await supabase
      .from('payroll')
      .update({ status: 'paid', updated_at: now })
      .eq('id', payrollEntry.id);
  }

  const payslipNumber = `PS-${year}${String(month).padStart(2, '0')}-${payrollEntry.id.substring(0, 5).toUpperCase()}`;

  const { data, error } = await supabase
    .from('payslips')
    .insert({
      payroll_id: payrollEntry.id,
      employee_id: payrollEntry.employee_id,
      payslip_number: payslipNumber,
      period_month: month,
      period_year: year,
      created_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Payslip;
}
