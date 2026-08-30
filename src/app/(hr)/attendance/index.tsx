import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/context/TenantContext';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DatePicker } from '@/components/ui/DatePicker';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getOrgAttendance } from '@/lib/services/attendance';
import { formatTime, formatMinutes } from '@/utils/format';
import type { Attendance } from '@/types';

export default function HRAttendanceScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { organization: tenantOrg } = useTenant();
  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const orgId = tenantOrg?.id || profile?.organization_id;
      const data = await getOrgAttendance(date.toISOString().split('T')[0], orgId);
      setRecords(data);
      setLoading(false);
    })();
  }, [date, profile, tenantOrg]);

  const statusVariant = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      present: 'success', late: 'warning', half_day: 'warning', absent: 'danger',
    };
    return map[s] || 'neutral';
  };

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Attendance</Text>
        </View>

        <View style={{ padding: 16 }}>
          <DatePicker label="Date" value={date} onChange={setDate} />
        </View>

        {loading ? <LoadingState /> : (
          <FlatList
            data={records}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No records for this date</Text>}
            renderItem={({ item }) => {
              const emp = item.employee as any;
              return (
                <Card style={styles.row}>
                  <Avatar name={emp?.profile?.full_name || ''} size={36} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[{ color: colors.text, fontWeight: '500' }]}>{emp?.profile?.full_name || 'Employee'}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {item.clock_in ? formatTime(item.clock_in) : '--'} — {item.clock_out ? formatTime(item.clock_out) : '--'}
                      {' · '}{formatMinutes(item.working_minutes)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Badge label={item.status} variant={statusVariant(item.status)} />
                    <Text style={{ color: item.clock_in_verified ? colors.success : colors.danger, fontSize: 11 }}>
                      {item.clock_in_verified ? '✓ Verified' : '✗ Unverified'}
                    </Text>
                  </View>
                </Card>
              );
            }}
          />
        )}
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
