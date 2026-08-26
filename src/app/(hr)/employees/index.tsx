import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getEmployees } from '@/lib/services/employee';
import type { Employee } from '@/types';

export default function EmployeesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { organization: tenantOrg } = useTenant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const orgId = tenantOrg?.id || profile?.organization_id;
      const data = await getEmployees({ organization_id: orgId });
      setEmployees(data);
      setLoading(false);
    })();
  }, [profile, tenantOrg]);

  const filtered = employees.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.profile?.full_name?.toLowerCase().includes(s) ||
      e.employee_code?.toLowerCase().includes(s) ||
      e.designation?.toLowerCase().includes(s);
  });

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Employees</Text>
          <Button title="+ Add Employee" onPress={() => router.push('/(hr)/employees/create' as never)} size="sm" />
        </View>

        <View style={{ padding: 16 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search employees..." />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(hr)/employees/${item.id}` as never)}>
              <Card style={styles.row}>
                <Avatar name={item.profile?.full_name || ''} url={item.profile?.avatar_url} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.empName, { color: colors.text }]}>{item.profile?.full_name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {item.designation} · {item.department?.name || 'No dept'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.employee_code}</Text>
                </View>
                <Badge
                  label={item.employment_status}
                  variant={item.employment_status === 'active' ? 'success' : 'danger'}
                />
              </Card>
            </TouchableOpacity>
          )}
        />
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  empName: { fontSize: 15, fontWeight: '500' },
});
