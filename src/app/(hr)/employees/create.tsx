import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getDepartments, createEmployee, getEmployees } from '@/lib/services/employee';
import { getShifts } from '@/lib/services/shifts';
import type { Department, Employee, WorkShift } from '@/types';
import { RefreshCw, Sparkles } from 'lucide-react-native';

export default function CreateEmployeeScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { organization: tenantOrg } = useTenant();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [deptId, setDeptId] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [role, setRole] = useState<string>('employee');
  const [designation, setDesignation] = useState('');
  const [basicSalary, setBasicSalary] = useState('');

  const tenantDomain = (tenantOrg?.settings as any)?.domain || (typeof window !== 'undefined' && window.location.hostname.includes('shanti') ? 'shantimemorialhospital.com' : 'subedge.com');

  const generateRandomCode = () => {
    const prefix = tenantDomain.includes('shanti') ? 'SMH' : 'EMP';
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomDigits}`;
  };

  useEffect(() => {
    setEmpCode(generateRandomCode());
  }, [tenantDomain]);

    useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        const orgId = tenantOrg?.id || profile?.organization_id || '00000000-0000-0000-0000-000000000002';
        const [d, m, s] = await Promise.all([
          getDepartments(orgId),
          getEmployees({ organization_id: orgId }),
          getShifts(orgId)
        ]);
        if (isActive) {
          setDepartments(d || []);
          setManagers(m || []);
          setShifts(s || []);
        }
      })();
      return () => { isActive = false; };
    }, [profile, tenantOrg])
  );

  const handleNameChange = (name: string) => {
    setFullName(name);
    const words = name.trim().split(/\s+/);
    const cleanWords = words.filter((w) => !/^(dr|mr|mrs|ms|prof)\.?$/i.test(w));
    const mainName = cleanWords[0] || words[0] || '';
    const usernamePrefix = mainName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (usernamePrefix) {
      setUsername(usernamePrefix);
    }
  };

  const handleCreate = async () => {
    if (!fullName || !username || !empCode || !phone) {
      setError('Name, username, phone, and employee code are required');
      return;
    }
    if (!shiftId) {
      setError('Please select a default shift for the employee');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const orgId = tenantOrg?.id || profile?.organization_id || '00000000-0000-0000-0000-000000000002';
      const fullEmail = username.includes('@') ? username.trim().toLowerCase() : `${username.trim().toLowerCase()}@${tenantDomain}`;

      await createEmployee({
        full_name: fullName.trim(),
        email: fullEmail,
        password: phone.trim(),
        phone: phone.trim(),
        organization_id: orgId,
        employee_code: empCode.trim(),
        department_id: deptId || undefined,
        manager_id: managerId || undefined,
        default_shift_id: shiftId || undefined,
        role: role,
        designation: designation.trim() || undefined,
        basic_salary: parseFloat(basicSalary) || 0,
      });
      router.replace('/(hr)/employees' as never);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Button title="← Cancel" onPress={() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }} variant="ghost" size="sm" />
          <Text style={[styles.title, { color: colors.text }]}>Add New Employee</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Text style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={fullName}
            onChangeText={handleNameChange}
          />

          <Input
            label="Work Username (Login ID) *"
            placeholder="e.g. rahul"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            rightElement={
              <View style={styles.domainBadge}>
                <Text style={styles.domainText}>@{tenantDomain}</Text>
              </View>
            }
          />

          <Input
            label="Employee Code *"
            value={empCode}
            onChangeText={setEmpCode}
            rightElement={
              <TouchableOpacity
                onPress={() => setEmpCode(generateRandomCode())}
                style={styles.randomBtn}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color="#0D7377" />
                <Text style={styles.randomBtnText}>Random</Text>
              </TouchableOpacity>
            }
          />

          <Input label="Phone Number (used as default password) *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Designation / Position" placeholder="e.g. Chief Medical Officer" value={designation} onChangeText={setDesignation} />
          <Input label="Monthly Base Salary (INR)" value={basicSalary} onChangeText={setBasicSalary} keyboardType="numeric" placeholder="50000" />

          <Select
            label="Department"
            options={departments.map((d) => ({ label: d.name, value: d.id }))}
            value={deptId}
            onValueChange={setDeptId}
          />

          <Select
            label="Reporting Manager"
            options={managers.map((m) => ({ label: m.profile?.full_name || m.employee_code || 'Unknown', value: m.id }))}
            value={managerId}
            onValueChange={setManagerId}
          />

          <Select
            label="Default Shift (For Attendance) *"
            placeholder="Select a shift..."
            options={shifts.map((s) => ({ label: `${s.name} (${s.start_time} - ${s.end_time})`, value: s.id }))}
            value={shiftId || ''}
            onValueChange={(val) => setShiftId(val || null)}
          />

          <Select
            label="System Role"
            options={[
              { label: 'Employee', value: 'employee' },
              { label: 'HR Manager', value: 'hr' },
              { label: 'Administrator', value: 'admin' },
            ]}
            value={role}
            onValueChange={(val) => setRole(val || 'employee')}
          />

          <Button
            title="Create & Onboard Employee"
            onPress={handleCreate}
            loading={loading}
            size="lg"
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  form: { padding: 24, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 6 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  domainBadge: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
    alignSelf: 'stretch',
  },
  domainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    backgroundColor: '#E6F4F4',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  randomBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D7377',
  },
});
