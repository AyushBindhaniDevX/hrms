import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { getAttendanceHistory } from '@/lib/services/attendance';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { formatTime, formatMinutes } from '@/utils/format';
import type { Attendance } from '@/types';
import { Download, CheckCircle2, Clock, AlertTriangle, Search, TrendingUp, TrendingDown, CalendarX } from 'lucide-react-native';
import { MONTHS } from '@/constants/config';

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

  const now = new Date();
  const currentMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
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
      <View style={isDesktop ? styles.cardsGridDesktop : styles.cardsGridMobile}>
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
              {totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0}% attendance rate
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
        ) : isDesktop ? (
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
        ) : (
          <View style={{ padding: 16, gap: 0 }}>
            {filtered.map((r, i) => (
              <View
                key={r.id}
                style={[styles.mobileRow, i !== filtered.length - 1 && { borderBottomColor: '#f1f5f9', borderBottomWidth: 1 }]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{formatShortDate(r.date)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {r.clock_in ? formatTime(r.clock_in) : '--'} – {r.clock_out ? formatTime(r.clock_out) : '--'}
                    {r.working_minutes > 0 ? `  ·  ${formatMinutes(r.working_minutes)}` : ''}
                  </Text>
                </View>
                <Badge label={r.status.replace('_', ' ')} variant={statusVariant(r.status)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', padding: 40, gap: 36 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },

  cardsGridDesktop: { flexDirection: 'row', gap: 20 },
  cardsGridMobile: { gap: 12 },
  kpiCard: { flex: 1, padding: 18, borderRadius: 12, borderWidth: 1, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiTitle: { fontSize: 13, fontWeight: '600' },
  iconPill: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  tableCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 160,
    flex: 1,
    maxWidth: 240,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 13 },

  table: { width: '100%' },
  tableRowHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: '#fafafa',
  },
  colHeader: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
  cellText: { fontSize: 14, color: '#0b1c30' },
  mobileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
});
