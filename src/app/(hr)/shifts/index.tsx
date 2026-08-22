import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
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
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';

const ROSTER_ROWS = [
  { id: '1', name: 'Ayush Bindhani', role: 'Principal Architect', schedule: ['General', 'General', 'General', 'General', 'OFF'] },
  { id: '2', name: 'Rahul Sharma', role: 'Full Stack Engineer', schedule: ['Morning', 'Morning', 'Morning', 'OFF', 'General'] },
  { id: '3', name: 'Priya Sundaram', role: 'Cloud SRE Specialist', schedule: ['Night', 'Night', 'Night', 'OFF', 'OFF'] },
  { id: '4', name: 'Ananya Verma', role: 'Security & SOC Analyst', schedule: ['Evening', 'Evening', 'OFF', 'Evening', 'Evening'] },
];

export default function ShiftsScreen() {
  const colors = useTheme();
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'roster' | 'master'>('roster');

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
            <Text style={[styles.title, { color: colors.text }]}>Shift Scheduling & Team Rosters</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Rotational Schedules, Weekly MON-FRI Matrix & SRE Night Allowances
            </Text>
          </View>
        </View>

        {/* View Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setSelectedView('roster')}
            style={[styles.tabBtn, selectedView === 'roster' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, selectedView === 'roster' && styles.tabTextActive]}>
              📅 Weekly MON-FRI Roster Matrix
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedView('master')}
            style={[styles.tabBtn, selectedView === 'master' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, selectedView === 'master' && styles.tabTextActive]}>
              ⚙️ Shift Master & Allowances ({shifts.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {selectedView === 'roster' ? (
            <View style={{ gap: 16 }}>
              <View style={styles.rosterCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={styles.rosterTitle}>Weekly Team Schedule (Week of March 9 - 13, 2026)</Text>
                  <View style={styles.liveTag}>
                    <Sparkles size={11} color="#0D7377" />
                    <Text style={styles.liveTagText}>LIVE SYNCED WITH ATTENDANCE</Text>
                  </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, { flex: 2 }]}>EMPLOYEE</Text>
                  <Text style={styles.thCell}>MON</Text>
                  <Text style={styles.thCell}>TUE</Text>
                  <Text style={styles.thCell}>WED</Text>
                  <Text style={styles.thCell}>THU</Text>
                  <Text style={styles.thCell}>FRI</Text>
                </View>

                {/* Rows */}
                {ROSTER_ROWS.map((row) => (
                  <View key={row.id} style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.empName}>{row.name}</Text>
                      <Text style={styles.empRole}>{row.role}</Text>
                    </View>

                    {row.schedule.map((shiftName, idx) => {
                      const isNight = shiftName === 'Night';
                      const isOff = shiftName === 'OFF';
                      return (
                        <View key={idx} style={styles.cellBox}>
                          <View
                            style={[
                              styles.shiftPill,
                              isNight && { backgroundColor: '#1E293B' },
                              isOff && { backgroundColor: '#F1F5F9' },
                              !isNight && !isOff && { backgroundColor: '#F0F7F7' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.shiftPillText,
                                isNight && { color: '#FFFFFF' },
                                isOff && { color: '#94A3B8' },
                                !isNight && !isOff && { color: '#0D7377' },
                              ]}
                            >
                              {shiftName}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.grid}>
              {shifts.map((s) => (
                <View key={s.id} style={styles.shiftCard}>
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
          )}
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
  tabBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#F0F7F7' },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: '#0D7377', fontWeight: '800' },
  rosterCard: { backgroundColor: '#FFFFFF', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  rosterTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveTagText: { fontSize: 10, fontWeight: '800', color: '#0D7377' },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 8 },
  thCell: { flex: 1, fontSize: 11, fontWeight: '800', color: '#64748B', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  empName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  empRole: { fontSize: 11, color: '#64748B' },
  cellBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shiftPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 60, alignItems: 'center' },
  shiftPillText: { fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  shiftCard: { width: '48%', minWidth: 280, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  shiftDot: { width: 12, height: 12, borderRadius: 6 },
  shiftName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 12 },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F7F7', padding: 10, borderRadius: 8, marginTop: 10 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#0D7377' },
  allowanceBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  allowanceText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
});
