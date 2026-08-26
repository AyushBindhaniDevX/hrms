import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';
import { supabase } from '@/lib/supabase';
import { formatDate, formatTime, formatMinutes } from '@/utils/format';
import type { Attendance } from '@/types';

export default function AttendanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const router = useRouter();
  const [record, setRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data } = await supabase
        .from('attendance')
        .select('*, workplace:workplaces(*)')
        .eq('id', id)
        .maybeSingle();

      setRecord((data || null) as Attendance | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!record) return <View style={styles.container}><Text>Not found</Text></View>;

  const statusVariant = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
      present: 'success', late: 'warning', half_day: 'warning', absent: 'danger',
    };
    return map[s] || 'neutral';
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Button title="← Back" onPress={() => { if (router.canGoBack()) if (router.canGoBack()) { router.back(); } else { router.replace('/'); } else router.replace('/'); }} variant="ghost" size="sm" />
        <Text style={[styles.title, { color: colors.text }]}>Attendance Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(record.date)}</Text>
            <Badge label={record.status} variant={statusVariant(record.status)} />
          </View>

          <Row label="Clock In" value={record.clock_in ? formatTime(record.clock_in) : 'N/A'} />
          <Row label="Clock Out" value={record.clock_out ? formatTime(record.clock_out) : 'N/A'} />
          <Row label="Working Hours" value={formatMinutes(record.working_minutes)} />
          <Row label="Clock In Verified" value={record.clock_in_verified ? '✓ Yes' : '✗ No'} />
          <Row label="Clock Out Verified" value={record.clock_out_verified ? '✓ Yes' : '✗ No'} />
          {record.clock_in_latitude && (
            <Row label="Clock In Location" value={`${record.clock_in_latitude.toFixed(4)}, ${record.clock_in_longitude?.toFixed(4)}`} />
          )}
          {record.clock_out_latitude && (
            <Row label="Clock Out Location" value={`${record.clock_out_latitude.toFixed(4)}, ${record.clock_out_longitude?.toFixed(4)}`} />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '600' },
  dateText: { fontSize: 20, fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
});
