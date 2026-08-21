import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { formatCurrency, formatDate } from '@/utils/format';
import { MONTHS } from '@/constants/config';
import type { Payslip, Employee, Organization } from '@/types';

export function generatePayslipHtml(payslip: Payslip, employee?: Employee | null, organization?: Organization | null): string {
  const p = payslip.payroll;
  const monthName = MONTHS[payslip.period_month - 1] || 'Current Month';
  const year = payslip.period_year;
  const orgName = organization?.name || 'OASIS ENTERPRISE SUITE';
  const empName = employee?.profile?.full_name || payslip.employee?.profile?.full_name || 'Valued Employee';
  const empCode = employee?.employee_code || payslip.employee?.employee_code || payslip.payslip_number || 'EMP-001';
  const designation = employee?.designation || payslip.employee?.designation || 'Staff Member';
  const department = employee?.department?.name || payslip.employee?.department?.name || 'General';
  const email = employee?.profile?.email || payslip.employee?.profile?.email || 'N/A';

  const basicSalary = p?.basic_salary || 0;
  const allowances = p?.allowances || {};
  const deductions = p?.deductions || {};
  const lopDays = p?.lop_days || 0;
  const lopAmount = p?.lop_amount || 0;
  const grossSalary = p?.gross_salary || basicSalary;
  const netSalary = p?.net_salary || grossSalary;
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0) + lopAmount;

  const allowanceRows = Object.entries(allowances)
    .map(([k, v]) => `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #475569;">${k.replace(/_/g, ' ').toUpperCase()}</td><td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0b1c30;">${formatCurrency(v)}</td></tr>`)
    .join('');

  const deductionRows = Object.entries(deductions)
    .map(([k, v]) => `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #475569;">${k.replace(/_/g, ' ').toUpperCase()}</td><td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ba1a1a;">-${formatCurrency(v)}</td></tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payslip - ${monthName} ${year} - ${empName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 32px;
      color: #0b1c30;
      background: #ffffff;
    }
    .payslip-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #006a61;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .org-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 44px;
      height: 44px;
      background: #006a61;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 22px;
    }
    .org-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0b1c30;
    }
    .payslip-title {
      text-align: right;
    }
    .payslip-title h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #006a61;
      letter-spacing: -0.5px;
    }
    .payslip-title p {
      margin: 4px 0 0;
      font-size: 14px;
      color: #64748b;
      font-weight: 600;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: #f8faff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .meta-item label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .meta-item span {
      font-size: 14px;
      font-weight: 700;
      color: #0b1c30;
    }
    .salary-tables {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .table-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .table-header {
      background: #f1f5f9;
      padding: 12px 14px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .total-row {
      background: #fafafa;
      font-weight: 700;
    }
    .net-pay-banner {
      background: linear-gradient(135deg, #0b1c30 0%, #172a45 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .net-pay-title {
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .net-pay-amount {
      font-size: 32px;
      font-weight: 800;
      color: #86f2e4;
      margin-top: 4px;
      letter-spacing: -0.5px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 24px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #64748b;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid #94a3b8;
      margin-top: 48px;
      text-align: center;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    @media print {
      body { padding: 0; }
      .payslip-container { border: none; box-shadow: none; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <div class="org-logo">
        <div class="logo-box">O</div>
        <div>
          <div class="org-name">${orgName}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Official Payroll Statement</div>
        </div>
      </div>
      <div class="payslip-title">
        <h1>SALARY SLIP</h1>
        <p>${monthName} ${year}</p>
        <p style="font-size: 12px; font-family: monospace;">Ref: ${payslip.payslip_number || 'PS-' + payslip.id.slice(0,8).toUpperCase()}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Employee Name</label>
        <span>${empName}</span>
      </div>
      <div class="meta-item">
        <label>Employee Code</label>
        <span>${empCode}</span>
      </div>
      <div class="meta-item">
        <label>Department</label>
        <span>${department}</span>
      </div>
      <div class="meta-item">
        <label>Designation</label>
        <span>${designation}</span>
      </div>
    </div>

    <div class="salary-tables">
      <!-- Earnings -->
      <div class="table-card">
        <div class="table-header">Earnings</div>
        <table>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #475569;">BASIC SALARY</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0b1c30;">${formatCurrency(basicSalary)}</td>
          </tr>
          ${allowanceRows}
          <tr class="total-row">
            <td style="padding: 12px 14px; color: #006a61;">GROSS EARNINGS</td>
            <td style="padding: 12px 14px; text-align: right; color: #006a61;">${formatCurrency(grossSalary)}</td>
          </tr>
        </table>
      </div>

      <!-- Deductions -->
      <div class="table-card">
        <div class="table-header">Deductions</div>
        <table>
          ${deductionRows || '<tr><td style="padding: 10px 14px; color: #94a3b8; font-size: 13px;">No standard deductions</td><td style="padding: 10px 14px; text-align: right;">₹0</td></tr>'}
          ${lopDays > 0 ? `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #ba1a1a;">LOSS OF PAY (${lopDays} days)</td><td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ba1a1a;">-${formatCurrency(lopAmount)}</td></tr>` : ''}
          <tr class="total-row">
            <td style="padding: 12px 14px; color: #ba1a1a;">TOTAL DEDUCTIONS</td>
            <td style="padding: 12px 14px; text-align: right; color: #ba1a1a;">-${formatCurrency(totalDeductions)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="net-pay-banner">
      <div>
        <div class="net-pay-title">Net Take Home Pay</div>
        <div class="net-pay-amount">${formatCurrency(netSalary)}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 13px; color: #cbd5e1;">Payment Status</div>
        <div style="font-size: 16px; font-weight: 700; color: #86f2e4; margin-top: 2px;">DISBURSED & VERIFIED</div>
      </div>
    </div>

    <div class="footer">
      <div>
        <p style="margin: 0;">This is a computer-generated statement and does not require a physical seal.</p>
        <p style="margin: 4px 0 0; font-size: 11px;">Generated on: ${formatDate(new Date())}</p>
      </div>
      <div class="signature-line">
        Authorized Payroll Officer
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Downloads or prints the payslip as a PDF across Web, iOS, and Android.
 */
export async function downloadOrPrintPayslip(
  payslip: Payslip,
  employee?: Employee | null,
  organization?: Organization | null
): Promise<void> {
  const html = generatePayslipHtml(payslip, employee, organization);

  if (Platform.OS === 'web') {
    // Open printable browser window for crisp PDF export or instant printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    } else {
      await Print.printAsync({ html });
    }
  } else {
    // Native (iOS/Android): generate PDF file and open native share/save sheet
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Payslip_${payslip.period_month}_${payslip.period_year}.pdf`,
      });
    }
  }
}
