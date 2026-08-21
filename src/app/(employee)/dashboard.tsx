import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, useWindowDimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { getGreeting, formatDate, formatTime, formatMinutes, formatCurrency } from '@/utils/format';
import { getTodayAttendance, getAttendanceHistory, clockIn, clockOut } from '@/lib/services/attendance';
import { getLeaveBalances } from '@/lib/services/leave';
import { getPayslips } from '@/lib/services/payroll';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { getCurrentLocation, calculateDistance } from '@/lib/services/location';
import {
  CalendarClock, CalendarDays, Banknote, Users, MapPin, Clock,
  ArrowRight, AlertCircle, CheckCircle2, TrendingUp, LogIn, LogOut as LogOutIcon,
  Briefcase, Bell, ChevronRight,
} from 'lucide-react-native';
import type { Attendance, LeaveBalance, Payslip, Employee } from '@/types';
import Animated, {
  FadeInDown, FadeIn, FadeOut, useAnimatedStyle,
  useSharedValue, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';

// ─── Pulse Ring behind the Clock-In button ───────────────────────────────────
function PulseButton({ onPress, loading, title, color }: { onPress: () => void; loading: boolean; title: string; color: string }) {
  const ring1 = useSharedValue(1);
  const ring1Op = useSharedValue(0.5);

  useEffect(() => {
    ring1.value = withRepeat(withSequence(withTiming(1.15, { duration: 1400, easing: Easing.out(Easing.ease) }), withTiming(1, { duration: 1400 })), -1, true);
    ring1Op.value = withRepeat(withSequence(withTiming(0, { duration: 1400 }), withTiming(0.5, { duration: 1400 })), -1, true);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: ring1Op.value,
    position: 'absolute',
    top: -8, left: -8, right: -8, bottom: -8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: color,
  }));

  return (
    <View style={{ position: 'relative', width: '100%', marginTop: 4 }}>
      {!loading && <Animated.View style={ringStyle} />}
      <TouchableOpacity
        onPress={loading ? undefined : onPress}
        activeOpacity={0.85}
        style={[clockBtnStyle.btn, { backgroundColor: color }]}
      >
        <LogIn size={20} color="#FFF" />
        <Text style={clockBtnStyle.label}>{loading ? 'Processing...' : title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const clockBtnStyle = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, width: '100%' },
  label: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<Payslip | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState('');
  const [distance, setDistance] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const emp = await getEmployeeByProfileId(profile.id);
      setEmployee(emp);
      if (emp) {
        const [today, history, balances, payslips] = await Promise.all([
          getTodayAttendance(emp.id),
          getAttendanceHistory(emp.id, 5),
          getLeaveBalances(emp.id),
          getPayslips(emp.id),
        ]);
        setTodayAttendance(today);
        setRecentAttendance(history);
        setLeaveBalances(balances);
        setLatestPayslip(payslips.length > 0 ? payslips[0] : null);
        if (emp.workplace) {
          try {
            const loc = await getCurrentLocation();
            const dist = calculateDistance(loc.latitude, loc.longitude, emp.workplace.latitude, emp.workplace.longitude);
            setDistance(Math.round(dist));
          } catch { setDistance(null); }
        }
      }
    } catch (err) { console.error('Dashboard load error:', err); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleClock = async (type: 'in' | 'out') => {
    setClockError('');
    setClockLoading(true);
    try {
      let loc = { latitude: 0, longitude: 0 };
      try { loc = await getCurrentLocation(); } catch { /* no permission */ }
      const result = type === 'in'
        ? await clockIn(loc.latitude, loc.longitude)
        : await clockOut(loc.latitude, loc.longitude);
      if (!result.success) setClockError(result.message || 'Operation failed');
      else await loadData();
    } catch (err: unknown) {
      setClockError(err instanceof Error ? err.message : 'Failed. Please try again.');
    } finally { setClockLoading(false); }
  };

  const isClockedIn = todayAttendance && !todayAttendance.clock_out;
  const isClockedOut = todayAttendance && todayAttendance.clock_out;

  const statusBadgeVariant = (s: string): 'successLight' | 'warningLight' | 'dangerLight' | 'neutral' => {
    const m: Record<string, 'successLight' | 'warningLight' | 'dangerLight' | 'neutral'> = {
      present: 'successLight', late: 'warningLight', half_day: 'warningLight', absent: 'dangerLight', on_leave: 'neutral',
    };
    return m[s] || 'neutral';
  };

  const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '').trim();

  if (loading) return <LoadingState />;

  const netPay = latestPayslip?.payroll?.net_salary ?? 0;
  const annualLeave = leaveBalances.find(b => (b.leave_type?.name || '').toLowerCase().includes('annual'));
  const annualLeft = annualLeave?.remaining_days ?? 0;

  const kpis = [
    {
      label: 'Today', value: todayAttendance ? formatMinutes(todayAttendance.working_minutes) : '—',
      sub: todayAttendance?.clock_in ? `In: ${formatTime(todayAttendance.clock_in)}` : 'Not clocked in',
      icon: <Clock size={20} color="#006a61" />, bg: '#edf8f6', border: '#c4ece7',
    },
    {
      label: 'Annual Leave', value: `${annualLeft}d`,
      sub: annualLeave ? `of ${annualLeave.allocated_days} days` : 'No quota',
      icon: <CalendarDays size={20} color="#4f46e5" />, bg: '#eeebff', border: '#d5d0f5',
    },
    {
      label: 'Net Salary', value: formatCurrency(netPay),
      sub: latestPayslip?.period_month ? `Month ${latestPayslip.period_month}` : 'No payslip',
      icon: <Banknote size={20} color="#0369a1" />, bg: '#e0f2fe', border: '#b9e3fc',
    },
    {
      label: 'Department', value: employee?.department?.name || '—',
      sub: employee?.designation || 'Employee',
      icon: <Briefcase size={20} color="#b45309" />, bg: '#fef3c7', border: '#fde68a',
    },
  ];

  const quickLinks = [
    { label: 'Attendance', sub: 'View logs', href: '/(employee)/attendance', icon: CalendarClock, color: '#006a61', bg: '#edf8f6' },
    { label: 'Leave', sub: 'Apply & track', href: '/(employee)/leave', icon: CalendarDays, color: '#4f46e5', bg: '#eeebff' },
    { label: 'Payslips', sub: 'Salary history', href: '/(employee)/payslips', icon: Banknote, color: '#0369a1', bg: '#e0f2fe' },
    { label: 'Directory', sub: 'Find colleagues', href: '/(employee)/directory', icon: Users, color: '#b45309', bg: '#fef3c7' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Bar ─────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <View style={[styles.heroBar, { backgroundColor: '#0b1c30' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>{getGreeting()}</Text>
            <Text style={styles.heroName}>{profile?.full_name?.split(' ')[0] ?? 'Welcome'} 👋</Text>
            <Text style={styles.heroDate}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(employee)/notifications' as never)}
            style={[styles.heroBell, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <Bell size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(80).duration(350).springify()}>
        <View style={isDesktop ? styles.kpiRowDesktop : styles.kpiRowMobile}>
          {kpis.map((k, i) => (
            <View key={i} style={[styles.kpiCard, { backgroundColor: k.bg, borderColor: k.border }]}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>{k.icon}</View>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiValue} numberOfLines={1}>{k.value}</Text>
              <Text style={styles.kpiSub} numberOfLines={1}>{k.sub}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ── Main 2-column or 1-column ──────────────────────────────────────── */}
      <View style={isDesktop ? styles.gridDesktop : styles.gridMobile}>

        {/* LEFT — Clock In + Quick Links */}
        <View style={isDesktop ? styles.colMain : styles.fullCol}>

          {/* Clock-In Card */}
          <Animated.View entering={FadeInDown.delay(160).duration(350).springify()}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.cardIconPill, { backgroundColor: '#edf8f6' }]}>
                    <Clock size={18} color="#006a61" />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Time Tracking</Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                      {formatDate(new Date())}
                    </Text>
                  </View>
                </View>
                {todayAttendance
                  ? <Badge label={todayAttendance.status.replace('_', ' ')} variant={statusBadgeVariant(todayAttendance.status)} />
                  : <Badge label="Not Started" variant="neutral" />}
              </View>

              {/* Time chips */}
              <View style={styles.timeChipRow}>
                <View style={[styles.timeChip, { backgroundColor: '#f8faff' }]}>
                  <LogIn size={14} color="#006a61" />
                  <View>
                    <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>Clock In</Text>
                    <Text style={[styles.chipTime, { color: colors.text }]}>
                      {todayAttendance?.clock_in ? formatTime(todayAttendance.clock_in) : '--:--'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.timeChip, { backgroundColor: '#f8faff' }]}>
                  <LogOutIcon size={14} color={colors.textSecondary} />
                  <View>
                    <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>Clock Out</Text>
                    <Text style={[styles.chipTime, { color: colors.text }]}>
                      {todayAttendance?.clock_out ? formatTime(todayAttendance.clock_out) : '--:--'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.timeChip, { backgroundColor: '#edf8f6' }]}>
                  <TrendingUp size={14} color="#006a61" />
                  <View>
                    <Text style={[styles.chipLabel, { color: '#006a61' }]}>Hours</Text>
                    <Text style={[styles.chipTime, { color: '#006a61' }]}>
                      {todayAttendance?.working_minutes ? formatMinutes(todayAttendance.working_minutes) : '--'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location indicator */}
              {distance !== null && (
                <View style={[styles.locRow, {
                  backgroundColor: distance > (employee?.workplace?.radius_meters ?? 200) ? '#fff5f5' : '#edf8f6'
                }]}>
                  <MapPin size={13} color={distance > (employee?.workplace?.radius_meters ?? 200) ? '#ba1a1a' : '#006a61'} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: distance > (employee?.workplace?.radius_meters ?? 200) ? '#ba1a1a' : '#006a61' }}>
                    {distance}m from {employee?.workplace?.name || 'workplace'}
                  </Text>
                </View>
              )}

              {/* Error */}
              {clockError ? (
                <Animated.View entering={FadeIn} exiting={FadeOut}
                  style={[styles.errorRow, { backgroundColor: '#fff5f5', borderColor: '#ffdad6' }]}>
                  <AlertCircle size={15} color="#ba1a1a" />
                  <Text style={{ color: '#ba1a1a', fontSize: 13, flex: 1 }}>{clockError}</Text>
                </Animated.View>
              ) : null}

              {/* Action */}
              <View style={styles.clockActionWrap}>
                {!todayAttendance && (
                  <PulseButton title="Clock In" onPress={() => handleClock('in')} loading={clockLoading} color="#006a61" />
                )}
                {isClockedIn && (
                  <TouchableOpacity
                    onPress={clockLoading ? undefined : () => handleClock('out')}
                    activeOpacity={0.85}
                    style={[styles.clockOutBtn, { backgroundColor: '#0b1c30' }]}
                  >
                    <LogOutIcon size={20} color="#FFF" />
                    <Text style={clockBtnStyle.label}>{clockLoading ? 'Processing...' : 'Clock Out'}</Text>
                  </TouchableOpacity>
                )}
                {isClockedOut && (
                  <View style={[styles.doneRow, { backgroundColor: '#edf8f6', borderColor: '#c4ece7' }]}>
                    <CheckCircle2 size={22} color="#006a61" />
                    <View>
                      <Text style={{ color: '#006a61', fontWeight: '700', fontSize: 15 }}>Shift Complete</Text>
                      <Text style={{ color: '#006a61', fontSize: 12 }}>
                        Total: {formatMinutes(todayAttendance?.working_minutes ?? 0)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Quick Links Grid */}
          <Animated.View entering={FadeInDown.delay(240).duration(350).springify()}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Quick Access</Text>
            <View style={styles.quickGrid}>
              {quickLinks.map((ql) => {
                const Icon = ql.icon;
                return (
                  <TouchableOpacity
                    key={ql.href}
                    onPress={() => router.push(ql.href as never)}
                    activeOpacity={0.75}
                    style={[styles.quickCard, { backgroundColor: ql.bg }]}
                  >
                    <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                      <Icon size={22} color={ql.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.quickLabel, { color: colors.text }]}>{ql.label}</Text>
                      <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{ql.sub}</Text>
                    </View>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>

        {/* RIGHT — Leave + Recent Activity */}
        <View style={isDesktop ? styles.colSide : styles.fullCol}>

          {/* Leave Balances */}
          <Animated.View entering={FadeInDown.delay(320).duration(350).springify()}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.cardIconPill, { backgroundColor: '#eeebff' }]}>
                    <CalendarDays size={18} color="#4f46e5" />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Leave Balances</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(employee)/leave/apply' as never)}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Apply</Text>
                </TouchableOpacity>
              </View>

              {leaveBalances.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 20, textAlign: 'center' }}>
                  No leave quotas assigned yet.
                </Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {leaveBalances.slice(0, 4).map((lb) => {
                    const pct = lb.allocated_days > 0 ? lb.remaining_days / lb.allocated_days : 0;
                    const barColor = pct > 0.5 ? '#006a61' : pct > 0.2 ? '#b45309' : '#ba1a1a';
                    return (
                      <View key={lb.id} style={styles.leaveRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                              {stripEmoji(lb.leave_type?.name || 'Leave')}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                              {lb.remaining_days}/{lb.allocated_days}d
                            </Text>
                          </View>
                          <View style={[styles.progressBg, { backgroundColor: '#f1f5f9' }]}>
                            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity style={[styles.cardFooter, { borderTopColor: '#f1f5f9' }]}
                onPress={() => router.push('/(employee)/leave' as never)}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>View All Leave</Text>
                <ArrowRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Recent Attendance */}
          <Animated.View entering={FadeInDown.delay(400).duration(350).springify()}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.cardIconPill, { backgroundColor: '#e0f2fe' }]}>
                    <CalendarClock size={18} color="#0369a1" />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Activity</Text>
                </View>
              </View>

              {recentAttendance.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 20, textAlign: 'center' }}>
                  No recent attendance records.
                </Text>
              ) : (
                <View style={{ gap: 0 }}>
                  {recentAttendance.slice(0, 4).map((a, idx) => (
                    <View key={a.id} style={[
                      styles.actRow,
                      idx !== recentAttendance.slice(0, 4).length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }
                    ]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{formatDate(a.date)}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                          {a.clock_in ? formatTime(a.clock_in) : '—'} → {a.clock_out ? formatTime(a.clock_out) : '—'}
                          {a.working_minutes > 0 ? `  ·  ${formatMinutes(a.working_minutes)}` : ''}
                        </Text>
                      </View>
                      <Badge label={a.status.replace('_', ' ')} variant={statusBadgeVariant(a.status)} />
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={[styles.cardFooter, { borderTopColor: '#f1f5f9' }]}
                onPress={() => router.push('/(employee)/attendance' as never)}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Full History</Text>
                <ArrowRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 64, gap: 24 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 40, paddingTop: 40, gap: 32 },

  // Hero
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: -8,
  },
  heroGreeting: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heroName: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  heroDate: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6 },
  heroBell: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  // KPI row
  kpiRowDesktop: { flexDirection: 'row', gap: 16 },
  kpiRowMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  kpiIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#0b1c30', letterSpacing: -0.5 },
  kpiSub: { fontSize: 11, color: '#64748b' },

  // Grid
  gridDesktop: { flexDirection: 'row', gap: 28, alignItems: 'flex-start', paddingHorizontal: 0 },
  gridMobile: { gap: 20, paddingHorizontal: 16 },
  colMain: { flex: 3, gap: 24 },
  colSide: { flex: 2, gap: 20 },
  fullCol: { gap: 20 },

  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },

  // Cards
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  cardIconPill: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  cardSub: { fontSize: 12, marginTop: 1 },

  // Time chips
  timeChipRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  chipTime: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },

  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    borderWidth: 1,
  },
  clockActionWrap: { padding: 20, paddingTop: 8 },
  clockOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  // Quick links
  quickGrid: { gap: 12 },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
  },
  quickIconWrap: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontWeight: '700' },
  quickSub: { fontSize: 12, marginTop: 1 },

  // Leave balances
  leaveRow: { paddingHorizontal: 20 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Recent activity
  actRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 13 },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 8,
  },
});
