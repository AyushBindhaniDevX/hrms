import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getPayrollPeriods, createPayrollPeriod } from '@/lib/services/payroll';
import { MONTHS } from '@/constants/config';
import type { PayrollPeriod } from '@/types';



export default function PayrollScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newMonth, setNewMonth] = useState<string | null>(null);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const data = await getPayrollPeriods();
    setPeriods(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newMonth) return;
    setCreating(true);
    try {
      await createPayrollPeriod(parseInt(newMonth), parseInt(newYear), profile?.organization_id || '');
      setShowCreate(false);
      await load();
    } catch {}
    setCreating(false);
  };

  const statusVariant = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'neutral'> = {
      open: 'warning', processing: 'accent' as any, closed: 'success',
    };
    return map[s] || 'neutral';
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout items={HR_NAV}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Payroll</Text>
          <Button title="+ New Period" onPress={() => setShowCreate(true)} size="sm" />
        </View>

        <FlatList
          data={periods}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No payroll periods</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(hr)/payroll/${item.id}` as never)}>
              <Card style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.periodText, { color: colors.text }]}>
                    {MONTHS[item.month - 1]} {item.year}
                  </Text>
                </View>
                <Badge label={item.status} variant={statusVariant(item.status)} />
              </Card>
            </TouchableOpacity>
          )}
        />

        <Modal visible={showCreate} onClose={() => setShowCreate(false)} title="New Payroll Period">
          <Select
            label="Month"
            options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))}
            value={newMonth}
            onValueChange={setNewMonth}
          />
          <Input label="Year" value={newYear} onChangeText={setNewYear} keyboardType="numeric" />
          <Button title="Create Period" onPress={handleCreate} loading={creating} />
        </Modal>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  periodText: { fontSize: 16, fontWeight: '500' },
});
