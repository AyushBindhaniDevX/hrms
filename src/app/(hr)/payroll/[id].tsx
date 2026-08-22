import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import {
  getPayrollEntries, createPayrollEntry, processPayrollPeriod, generatePayslip, distributePayroll
} from '@/lib/services/payroll';
import { getAllEmployees } from '@/lib/services/employee';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatCurrency } from '@/utils/format';
import { MONTHS } from '@/constants/config';
import type { Payroll, PayrollPeriod, Employee } from '@/types';



export default function PayrollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [entries, setEntries] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [distributing, setDistributing] = useState(false);

  // Form state
  const [selEmpId, setSelEmpId] = useState<string | null>(null);
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('0');
  const [ta, setTa] = useState('0');
  const [pf, setPf] = useState('0');
  const [tax, setTax] = useState('0');
  const [lopDays, setLopDays] = useState('0');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [periodData, entriesData, emps] = await Promise.all([
      getDoc(doc(db, 'payroll_periods', id!)).then(res => ({ data: { id: res.id, ...res.data() } })),
      getPayrollEntries(id!),
      getAllEmployees(),
    ]);
    setPeriod(periodData.data as PayrollPeriod);
    setEntries(entriesData);
    setEmployees(emps);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAddEntry = async () => {
    if (!selEmpId || !basicSalary) return;
    setAdding(true);
    const basic = parseFloat(basicSalary);
    const allowances = { HRA: parseFloat(hra) || 0, TA: parseFloat(ta) || 0 };
    const deductions = { PF: parseFloat(pf) || 0, Tax: parseFloat(tax) || 0 };
    const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
    const gross = basic + totalAllowances;
    const lDays = parseFloat(lopDays) || 0;
    const lopAmount = lDays > 0 ? (basic / 30) * lDays : 0;
    const net = gross - totalDeductions - lopAmount;

    try {
      await createPayrollEntry({
        payroll_period_id: id!,
        employee_id: selEmpId,
        basic_salary: basic,
        allowances,
        deductions,
        lop_days: lDays,
        lop_amount: lopAmount,
        gross_salary: gross,
        net_salary: Math.max(net, 0),
      });
      setShowAdd(false);
      await load();
    } catch {}
    setAdding(false);
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await processPayrollPeriod(id!);
      await load();
    } catch {}
    setProcessing(false);
  };

  const handleDistribute = async () => {
    setDistributing(true);
    try {
      await distributePayroll(id!, period!.month, period!.year);
      await load();
    } catch {}
    setDistributing(false);
  };

  if (loading) return <LoadingState />;
  if (!period) return <Text>Not found</Text>;

  const totalNet = entries.reduce((sum, e) => sum + e.net_salary, 0);

  return (
    <SidebarLayout items={HR_NAV}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Button title="← Back" onPress={() => { if (router.canGoBack()) if (router.canGoBack()) { router.back(); } else { router.replace('/'); } else router.replace('/'); }} variant="ghost" size="sm" />
          <Text style={[styles.title, { color: colors.text }]}>
            {MONTHS[period.month - 1]} {period.year}
          </Text>
          <Badge label={period.status} variant={period.status === 'closed' ? 'success' : 'warning'} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Summary */}
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[{ color: colors.text, fontWeight: '600' }]}>Total Payroll</Text>
              <Text style={[{ color: colors.success, fontSize: 20, fontWeight: '700' }]}>{formatCurrency(totalNet)}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              {entries.length} employee{entries.length !== 1 ? 's' : ''}
            </Text>
          </Card>

          {/* Entries */}
          {entries.map(entry => {
            const emp = entry.employee as any;
            return (
              <Card key={entry.id}>
                <View style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ color: colors.text, fontWeight: '500' }]}>{emp?.profile?.full_name || 'Employee'}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      Basic: {formatCurrency(entry.basic_salary)} · Gross: {formatCurrency(entry.gross_salary)}
                    </Text>
                  </View>
                  <Text style={[{ color: colors.success, fontWeight: '700', fontSize: 16 }]}>
                    {formatCurrency(entry.net_salary)}
                  </Text>
                </View>
              </Card>
            );
          })}

          {/* Actions */}
          {period.status === 'open' && (
            <View style={{ gap: 8 }}>
              <Button title="+ Add Employee Payroll" onPress={() => setShowAdd(true)} variant="outline" />
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {period.status === 'open' && (
              <Button title="Process Payroll" onPress={handleProcess} loading={processing} style={{ flex: 1 }} />
            )}
            {period.status === 'closed' && (
              <Button title="Distribute Payslips" onPress={handleDistribute} loading={distributing} style={{ flex: 1 }} />
            )}
          </View>
        </ScrollView>

        {/* Add Entry Modal */}
        <Modal visible={showAdd} onClose={() => setShowAdd(false)} title="Add Payroll Entry">
          <ScrollView style={{ maxHeight: 400 }}>
            <Select
              label="Employee"
              options={employees.map(e => ({ label: e.profile?.full_name || e.employee_code || '', value: e.id }))}
              value={selEmpId}
              onValueChange={(v) => {
                setSelEmpId(v);
                const emp = employees.find(e => e.id === v);
                if (emp) setBasicSalary(String(emp.basic_salary));
              }}
            />
            <Input label="Basic Salary" value={basicSalary} onChangeText={setBasicSalary} keyboardType="numeric" />
            <Input label="HRA" value={hra} onChangeText={setHra} keyboardType="numeric" />
            <Input label="Transport Allowance" value={ta} onChangeText={setTa} keyboardType="numeric" />
            <Input label="PF Deduction" value={pf} onChangeText={setPf} keyboardType="numeric" />
            <Input label="Tax Deduction" value={tax} onChangeText={setTax} keyboardType="numeric" />
            <Input label="LOP Days" value={lopDays} onChangeText={setLopDays} keyboardType="numeric" />
            <Button title="Add Entry" onPress={handleAddEntry} loading={adding} />
          </ScrollView>
        </Modal>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '600' },
  entryRow: { flexDirection: 'row', alignItems: 'center' },
});
