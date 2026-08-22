import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { getShifts } from '@/lib/services/shifts';
import { WorkShift } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import {
  Clock,
  Calendar,
  Users,
  Sun,
  Moon,
  Sunset,
} from 'lucide-react-native';

export default function ShiftsScreen() {
  const colors = useTheme();
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getShifts();
      setShifts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Shift Scheduling & Rosters</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Rotational Schedules, Shift Allowances & SRE On-Call
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          <View style={styles.grid}>
            {shifts.map((s) => (
              <View key={s.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={[styles.shiftDot, { backgroundColor: s.color }]} />
                  {s.allowance_per_day > 0 && (
                    <View style={styles.allowanceBadge}>
                      <Text style={styles.allowanceText}>+{formatCurrency(s.allowance_per_day)} / Day</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.shiftName}>{s.name}</Text>
                <View style={styles.timeBox}>
                  <Clock size={16} color="#0D7377" />
                  <Text style={styles.timeText}>{s.start_time} — {s.end_time} IST</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '48%', minWidth: 280, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  shiftDot: { width: 12, height: 12, borderRadius: 6 },
  shiftName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 12 },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F7F7', padding: 10, borderRadius: 8, marginTop: 10 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#0D7377' },
  allowanceBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  allowanceText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
});
