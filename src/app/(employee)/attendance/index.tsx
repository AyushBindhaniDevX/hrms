import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useWindowDimensions, TextInput, RefreshControl,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { getAttendanceHistory } from '@/lib/services/attendance';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { formatTime, formatMinutes } from '@/utils/format';
import type { Attendance } from '@/types';
import {
  Download, CheckCircle2, Clock, AlertTriangle, Search,
  TrendingUp, TrendingDown, CalendarX, ChevronRight,
} from 'lucide-react-native';
import { MONTHS } from '@/constants/config';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

export default function AttendanceScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [records, setRecords] = useState<Attendance[]>([]);
  const [filtered, setFiltered] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!profile) return;
    const emp = await getEmployeeByProfileId(profile.id);
    if (emp) {
      const data = await getAttendanceHistory(emp.id, 60);
      setRecords(data);
      setFiltered(data);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(records);
      return;
    }
    const t = text.toLowerCase();
    setFiltered(records.filter(r =>
      r.date.includes(t) ||
      r.status.includes(t) ||
      formatShortDate(r.date).toLowerCase().includes(t)
    ));
  };

  const statusVariant = (s: string): 'successLight' | 'warningLight' | 'dangerLight' | 'neutral' => {
    const map: Record<string, 'successLight' | 'warningLight' | 'dangerLight' | 'neutral'> = {
      present: 'successLight',
      late: 'warningLight',
      half_day: 'warningLight',
      absent: 'dangerLight',
      on_leave: 'neutral',
    };
    return map[s] || 'neutral';
  };

  const statusDot = (s: string): string => {
    const map: Record<string, string> = {
      present: '#10B981',
      late: '#F59E0B',
      half_day: '#F59E0B',
      absent: '#EF4444',
      on_leave: '#94A3B8',
    };
    return map[s] || '#94A3B8';
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      const m = MONTHS[d.getMonth()].substring(0, 3);
      return `${m} ${d.getDate()}, ${day}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) return <LoadingState />;

  // KPI stats
  const presentDays = records.filter(r => r.status === 'present').length;
  const lateDays = records.filter(r => r.status === 'late').length;
  const absentDays = records.filter(r => r.status === 'absent').length;
  const totalDays = records.length;
  const totalMins = records.reduce((acc, r) => acc + (r.working_minutes || 0), 0);
  const avgHours = totalDays > 0 ? totalMins / totalDays / 60 : 0;
  const exceptions = lateDays + absentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const now = new Date();
  const currentMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <ScrollView
        style={mStyles.root}
        contentContainerStyle={mStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D7377" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Standard Page Header ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={mStyles.header}>
          <Text style={mStyles.headerTitle}>Attendance</Text>
        </Animated.View>

        {/* ── Attendance Stats ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(40).duration(350).springify()}>
          <View style={mStyles.heroBanner}>
            {/* Big attendance rate ring */}
            <View style={mStyles.rateContainer}>
              <View style={mStyles.rateCircle}>
                <Text style={mStyles.rateNumber}>{attendanceRate}%</Text>
                <Text style={mStyles.rateLabel}>Attendance</Text>
              </View>
            </View>

            {/* Stat chips */}
            <View style={mStyles.statRow}>
              <View style={mStyles.statChip}>
                <Text style={[mStyles.statValue, { color: '#34D399' }]}>{presentDays}</Text>
                <Text style={mStyles.statLabel}>Present</Text>
              </View>
              <View style={mStyles.statDivider} />
              <View style={mStyles.statChip}>
                <Text style={[mStyles.statValue, { color: '#FBBF24' }]}>{lateDays}</Text>
                <Text style={mStyles.statLabel}>Late</Text>
              </View>
              <View style={mStyles.statDivider} />
              <View style={mStyles.statChip}>
                <Text style={[mStyles.statValue, { color: '#F87171' }]}>{absentDays}</Text>
                <Text style={mStyles.statLabel}>Absent</Text>
              </View>
              <View style={mStyles.statDivider} />
              <View style={mStyles.statChip}>
                <Text style={[mStyles.statValue, { color: '#60A5FA' }]}>{avgHours.toFixed(1)}h</Text>
                <Text style={mStyles.statLabel}>Avg/Day</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Search Bar ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).duration(350).springify()}>
          <View style={mStyles.searchRow}>
            <View style={mStyles.searchBox}>
              <Search size={15} color="#94A3B8" />
              <TextInput
                placeholder="Search by date, status..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={handleSearch}
                style={mStyles.searchInput}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── Records Section Title ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).duration(350).springify()}>
          <View style={mStyles.recordsHeader}>
            <Text style={mStyles.recordsTitle}>Daily Logs</Text>
            <View style={mStyles.recordsBadge}>
              <Text style={mStyles.recordsBadgeText}>{filtered.length} records</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Records Feed ──────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <Animated.View entering={FadeIn.delay(160)} style={mStyles.emptyState}>
            <CalendarX size={36} color="#CBD5E1" />
            <Text style={mStyles.emptyText}>
              {search ? `No records matching "${search}"` : 'No attendance records found.'}
            </Text>
          </Animated.View>
        ) : (
          <View style={mStyles.recordsList}>
            {filtered.map((r, idx) => (
              <Animated.View
                key={r.id}
                entering={FadeInDown.delay(120 + idx * 30).duration(300).springify()}
              >
                <View style={mStyles.recordCard}>
                  {/* Status border bar */}
                  <View style={[mStyles.recordBar, { backgroundColor: statusDot(r.status) }]} />

                  <View style={mStyles.recordBody}>
                    <View style={mStyles.recordTop}>
                      <View>
                        <Text style={mStyles.recordDate}>{formatShortDate(r.date)}</Text>
                        <View style={mStyles.recordTimeRow}>
                          <Clock size={11} color="#94A3B8" />
                          <Text style={mStyles.recordTime}>
                            {r.clock_in ? formatTime(r.clock_in) : '--:--'} → {r.clock_out ? formatTime(r.clock_out) : '--:--'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Badge label={r.status.replace('_', ' ')} variant={statusVariant(r.status)} />
                        {r.working_minutes > 0 && (
                          <Text style={mStyles.recordHours}>{formatMinutes(r.working_minutes)}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Attendance History</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Overview of your daily logs and timesheets.
          </Text>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={styles.cardsGridDesktop}>
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.kpiTitle, { color: colors.textSecondary }]}>Present Days</Text>
            <View style={[styles.iconPill, { backgroundColor: '#eaf1ff' }]}>
              <CheckCircle2 size={16} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {presentDays}
            <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '500' }}> / {totalDays}</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={13} color="#006a61" />
            <Text style={{ color: '#006a61', fontSize: 13, fontWeight: '500' }}>
              {attendanceRate}% attendance rate
            </Text>
          </View>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.kpiTitle, { color: colors.textSecondary }]}>Avg Hours/Day</Text>
            <View style={[styles.iconPill, { backgroundColor: '#f1f5f9' }]}>
              <Clock size={16} color={colors.textSecondary} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {avgHours.toFixed(1)}
            <Text style={{ fontSize: 16, color: colors.textSecondary, fontWeight: '500' }}> hrs</Text>
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Last {totalDays} days</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.kpiTitle, { color: colors.textSecondary }]}>Exceptions</Text>
            <View style={[styles.iconPill, { backgroundColor: colors.dangerLight }]}>
              <AlertTriangle size={16} color={colors.danger} />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{exceptions}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {exceptions > 0 ? (
              <>
                <TrendingDown size={13} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '500' }}>
                  {lateDays} late, {absentDays} absent
                </Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} color="#006a61" />
                <Text style={{ color: '#006a61', fontSize: 13, fontWeight: '500' }}>All good!</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Logs Table */}
      <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
        <View style={[styles.tableHeader, { borderBottomColor: '#f1f5f9' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{currentMonthLabel} Logs</Text>
          <View style={[styles.searchContainer, { borderColor: '#e2e8f0' }]}>
            <Search size={14} color={colors.textSecondary} />
            <TextInput
              placeholder="Filter records..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={handleSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={{ padding: 48, alignItems: 'center', gap: 12 }}>
            <CalendarX size={32} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
              {search ? `No records matching "${search}"` : 'No attendance records found.'}
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tableRowHeader, { borderBottomColor: '#f1f5f9' }]}>
              <Text style={[styles.colHeader, { flex: 2 }]}>Date</Text>
              <Text style={[styles.colHeader, { flex: 2 }]}>Clock In</Text>
              <Text style={[styles.colHeader, { flex: 2 }]}>Clock Out</Text>
              <Text style={[styles.colHeader, { flex: 2 }]}>Total Hours</Text>
              <Text style={[styles.colHeader, { flex: 2 }]}>Status</Text>
            </View>
            {filtered.map((r, i) => (
              <View key={r.id} style={[styles.tableRow, i !== filtered.length - 1 && { borderBottomColor: '#f1f5f9', borderBottomWidth: 1 }]}>
                <Text style={[styles.cellText, { flex: 2, fontWeight: '600' }]}>{formatShortDate(r.date)}</Text>
                <Text style={[styles.cellText, { flex: 2, color: colors.textSecondary }]}>
                  {r.clock_in ? formatTime(r.clock_in) : '—'}
                </Text>
                <Text style={[styles.cellText, { flex: 2, color: colors.textSecondary }]}>
                  {r.clock_out ? formatTime(r.clock_out) : '—'}
                </Text>
                <Text style={[styles.cellText, { flex: 2, color: colors.textSecondary }]}>
                  {r.working_minutes > 0 ? formatMinutes(r.working_minutes) : '—'}
                </Text>
                <View style={{ flex: 2, alignItems: 'flex-start' }}>
                  <Badge label={r.status.replace('_', ' ')} variant={statusVariant(r.status)} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── MOBILE STYLES ─────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingBottom: 90 },

  // Standard Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },

  // Stats Card
  heroBanner: {
    backgroundColor: '#0D7377',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Rate display
  rateContainer: { alignItems: 'center', paddingVertical: 20 },
  rateCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  rateNumber: { fontSize: 30, fontWeight: '900', color: '#FFFFFF' },
  rateLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },

  // Stat chips
  statRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
    paddingVertical: 14, paddingHorizontal: 4,
    marginHorizontal: -20,
  },
  statChip: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },

  // Search
  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },

  // Records header
  recordsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 10,
  },
  recordsTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  recordsBadge: {
    backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  recordsBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  // Record cards
  recordsList: { paddingHorizontal: 16, gap: 10 },
  recordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  recordBar: { width: 4 },
  recordBody: { flex: 1, padding: 14 },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  recordDate: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  recordTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordTime: { fontSize: 12, color: '#64748B' },
  recordHours: { fontSize: 11, fontWeight: '700', color: '#0D7377' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
});

// ─── DESKTOP STYLES (unchanged) ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40, gap: 36 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },

  cardsGridDesktop: { flexDirection: 'row', gap: 20 },
  kpiCard: { flex: 1, padding: 18, borderRadius: 12, borderWidth: 1, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiTitle: { fontSize: 13, fontWeight: '600' },
  iconPill: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  tableCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, flexWrap: 'wrap', gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    minWidth: 160, flex: 1, maxWidth: 240, gap: 6,
  },
  searchInput: { flex: 1, fontSize: 13 },

  table: { width: '100%' },
  tableRowHeader: {
    flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 10,
    borderBottomWidth: 1, backgroundColor: '#fafafa',
  },
  colHeader: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  cellText: { fontSize: 14, color: '#0b1c30' },
});
