import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateEmployee } from '@/lib/services/employee';
import { formatDate, formatCurrency } from '@/utils/format';
import type { Employee } from '@/types';



export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const router = useRouter();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    (async () => {
      const empDoc = await getDoc(doc(db, 'employees', id!));
      const data = empDoc.exists() ? { id: empDoc.id, ...empDoc.data() } : null;
      setEmp(data as Employee);
      setLoading(false);
    })();
  }, [id]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const newStatus = emp?.employment_status === 'active' ? 'inactive' : 'active';
      await updateEmployee(id!, { employment_status: newStatus as any });
      setEmp(prev => prev ? { ...prev, employment_status: newStatus as any } : null);
    } catch {}
    setDeactivating(false);
    setShowDeactivate(false);
  };

  if (loading) return <LoadingState />;
  if (!emp) return <Text>Not found</Text>;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Button title="← Back" onPress={() => { if (router.canGoBack()) if (router.canGoBack()) { router.back(); } else { router.replace('/'); } else router.replace('/'); }} variant="ghost" size="sm" />
          <Text style={[styles.title, { color: colors.text }]}>Employee Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' }}>
          <Card style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 16 }}>
            <Avatar name={emp.profile?.full_name || ''} url={emp.profile?.avatar_url} size={72} />
            <Text style={[styles.empName, { color: colors.text }]}>{emp.profile?.full_name}</Text>
            <Text style={{ color: colors.textSecondary }}>{emp.designation}</Text>
            <Badge
              label={emp.employment_status}
              variant={emp.employment_status === 'active' ? 'success' : 'danger'}
            />
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <Row label="Employee Code" value={emp.employee_code || 'N/A'} colors={colors} />
            <Row label="Email" value={emp.profile?.email || ''} colors={colors} />
            <Row label="Phone" value={emp.profile?.phone || 'N/A'} colors={colors} />
            <Row label="Department" value={emp.department?.name || 'N/A'} colors={colors} />
            <Row label="Workplace" value={emp.workplace?.name || 'N/A'} colors={colors} />
            <Row label="Basic Salary" value={formatCurrency(emp.basic_salary)} colors={colors} />
            <Row label="Joining Date" value={emp.joining_date ? formatDate(emp.joining_date) : 'N/A'} colors={colors} />
            <Row label="Role" value={emp.profile?.role?.toUpperCase() || ''} colors={colors} />
          </Card>

          <Button
            title={emp.employment_status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
            onPress={() => setShowDeactivate(true)}
            variant={emp.employment_status === 'active' ? 'danger' : 'primary'}
          />
        </ScrollView>

        <ConfirmDialog
          visible={showDeactivate}
          title={emp.employment_status === 'active' ? 'Deactivate?' : 'Activate?'}
          message={`Are you sure you want to ${emp.employment_status === 'active' ? 'deactivate' : 'activate'} this employee?`}
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivate(false)}
          loading={deactivating}
          variant={emp.employment_status === 'active' ? 'danger' : 'primary'}
        />
      </View>
    </SidebarLayout>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '600' },
  empName: { fontSize: 22, fontWeight: '700', marginTop: 12, marginBottom: 4 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '500' },
});
