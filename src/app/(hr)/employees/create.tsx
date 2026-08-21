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
import { getDepartments, getWorkplaces, createEmployee } from '@/lib/services/employee';
import type { Department, Workplace } from '@/types';



export default function CreateEmployeeScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [deptId, setDeptId] = useState<string | null>(null);
  const [workplaceId, setWorkplaceId] = useState<string | null>(null);
  const [salary, setSalary] = useState('');
  const [joinDate, setJoinDate] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const [d, w] = await Promise.all([getDepartments(), getWorkplaces()]);
      setDepartments(d);
      setWorkplaces(w);
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
        designation: designation || undefined,
        department_id: deptId || undefined,
        workplace_id: workplaceId || undefined,
        basic_salary: salary ? parseFloat(salary) : undefined,
        joining_date: joinDate ? joinDate.toISOString().split('T')[0] : undefined,
      });
      if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout items={HR_NAV}>
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
          <Input label="Designation" value={designation} onChangeText={setDesignation} />

          <Select
            label="Department"
            options={departments.map(d => ({ label: d.name, value: d.id }))}
            value={deptId}
            onValueChange={setDeptId}
          />

          <Select
            label="Workplace"
            options={workplaces.map(w => ({ label: w.name, value: w.id }))}
            value={workplaceId}
            onValueChange={setWorkplaceId}
          />

          <Input label="Basic Salary" value={salary} onChangeText={setSalary} keyboardType="numeric" />
          <DatePicker label="Joining Date" value={joinDate} onChange={setJoinDate} />

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
