import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getDepartments, createEmployee, getAllEmployees } from '@/lib/services/employee';
import type { Department, Employee } from '@/types';



export default function CreateEmployeeScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [deptId, setDeptId] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [role, setRole] = useState<string>('employee');
  const [designation, setDesignation] = useState('');
  const [basicSalary, setBasicSalary] = useState('');

  useEffect(() => {
    (async () => {
      const [d, m] = await Promise.all([getDepartments(), getAllEmployees()]);
      setDepartments(d);
      setManagers(m);
    })();
  }, []);

  const handleCreate = async () => {
    if (!fullName || !email || !password || !empCode) {
      setError('Name, email, password, and employee code are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createEmployee({
        full_name: fullName,
        email,
        password,
        phone: phone || undefined,
        organization_id: profile?.organization_id || '',
        employee_code: empCode,
        department_id: deptId || undefined,
        manager_id: managerId || undefined,
        role: role,
        designation: designation || undefined,
        basic_salary: parseFloat(basicSalary) || 0,
      });
      if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
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
          <Button title="← Cancel" onPress={() => { if (router.canGoBack()) if (router.canGoBack()) { router.back(); } else { router.replace('/'); } else router.replace('/'); }} variant="ghost" size="sm" />
          <Text style={[styles.title, { color: colors.text }]}>Add Employee</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Text style={{ color: colors.danger }}>{error}</Text>
            </View>
          ) : null}

          <Input label="Full Name *" value={fullName} onChangeText={setFullName} />
          <Input label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password *" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Employee Code *" value={empCode} onChangeText={setEmpCode} />
          <Input label="Designation (Job Title)" value={designation} onChangeText={setDesignation} />
          <Input label="Base Salary" value={basicSalary} onChangeText={setBasicSalary} keyboardType="numeric" />

          <Select
            label="Department"
            options={departments.map(d => ({ label: d.name, value: d.id }))}
            value={deptId}
            onValueChange={setDeptId}
          />

          <Select
            label="Reporting To (Manager)"
            options={managers.map(m => ({ label: m.profile?.full_name || m.employee_code || 'Unknown', value: m.id }))}
            value={managerId}
            onValueChange={setManagerId}
          />

          <Select
            label="System Role"
            options={[
              { label: 'Employee', value: 'employee' },
              { label: 'HR Manager', value: 'hr' },
              { label: 'Administrator', value: 'admin' },
            ]}
            value={role}
            onValueChange={setRole}
          />

          <Button title="Create Employee" onPress={handleCreate} loading={loading} />
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '600' },
  form: { padding: 16, maxWidth: 500, alignSelf: 'center', width: '100%' },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
});
