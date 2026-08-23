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
import { Avatar } from '@/components/ui/Avatar';
import { getGreeting, formatDate, formatTime, formatMinutes, formatCurrency } from '@/utils/format';
import { getTodayAttendance, getAttendanceHistory, clockIn, clockOut, startBreak, endBreak } from '@/lib/services/attendance';
import { getLeaveBalances } from '@/lib/services/leave';
import { getPayslips } from '@/lib/services/payroll';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { getCurrentLocation, calculateDistance } from '@/lib/services/location';
import { sendClockInNotification, cancelClockInNotification } from '@/lib/services/notifications';
import {
  CalendarClock, CalendarDays, Banknote, Users, MapPin, Clock,
  ArrowRight, AlertCircle, CheckCircle2, TrendingUp, LogIn, LogOut as LogOutIcon,
  Briefcase, Bell, ChevronRight, Award, LifeBuoy, GraduationCap,
  Receipt, Laptop, Wifi, WifiOff, Navigation, Mic,
} from 'lucide-react-native';
import { GeofenceMap } from '@/components/Map/GeofenceMap';
import type { Attendance, LeaveBalance, Payslip, Employee } from '@/types';
import Animated, {
  FadeInDown, FadeIn, FadeOut, useAnimatedStyle,
  useSharedValue, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';

// ─── Pulse Ring behind the Clock-In button ────────────────────────────────────
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
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, width: '100%' },
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
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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
            setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
            const dist = calculateDistance(loc.latitude, loc.longitude, emp.workplace.latitude, emp.workplace.longitude);
            setDistance(Math.round(dist));
          } catch { setDistance(null); }
        }
      }
    } catch (err) { console.error('Dashboard load error:', err); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  // Background location tracking loop (every 60s)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const isClockedIn = todayAttendance && !todayAttendance.clock_out;
    
    if (isClockedIn && employee?.workplace) {
      interval = setInterval(async () => {
        try {
          const loc = await getCurrentLocation();
          const dist = calculateDistance(
            loc.latitude, loc.longitude, 
            employee.workplace!.latitude, employee.workplace!.longitude
          );
          setDistance(Math.round(dist));
          
          if (dist > employee.workplace!.radius_meters) {
            setOutOfBounds(true);
            await startBreak(todayAttendance.id, 'Auto-paused: Left office radius');
          } else {
            if (outOfBounds) {
              setOutOfBounds(false);
              await endBreak(todayAttendance.id);
            }
          }
        } catch (e) {
          console.warn('Geofence check failed', e);
        }
      }, 60000);
    }
    
    return () => { if (interval) clearInterval(interval); };
  }, [todayAttendance, employee, outOfBounds]);

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
      if (!result.success) {
        setClockError(result.message || 'Operation failed');
      } else {
        if (type === 'in') {
          const startTime = formatTime(new Date().toISOString());
          await sendClockInNotification(startTime);
        } else {
          await cancelClockInNotification();
        }
        await loadData();
      }
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

  // ─── Desktop KPI / Quick Links data ────────────────────────────────────────
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

  // ─── Mobile-specific data ────────────────────────────────────────────────
  const mobileKpis = [
    { label: "Today's Hours", value: todayAttendance ? formatMinutes(todayAttendance.working_minutes) : '—', color: '#0D7377', bg: '#E6F4F4', icon: Clock },
    { label: 'Leave Days', value: `${annualLeft}d`, color: '#4F46E5', bg: '#EEEBFF', icon: CalendarDays },
    { label: 'Net Salary', value: formatCurrency(netPay), color: '#0369A1', bg: '#E0F2FE', icon: Banknote },
    { label: 'Department', value: employee?.department?.name || '—', color: '#B45309', bg: '#FEF3C7', icon: Briefcase },
  ];

  const mobileQuickActions = [
    { label: 'Attendance', icon: CalendarClock, href: '/(employee)/attendance', color: '#0D7377', bg: '#E6F4F4' },
    { label: 'Leave', icon: CalendarDays, href: '/(employee)/leave', color: '#4F46E5', bg: '#EEEBFF' },
    { label: 'Payslips', icon: Banknote, href: '/(employee)/payslips', color: '#0369A1', bg: '#E0F2FE' },
    { label: 'Directory', icon: Users, href: '/(employee)/directory', color: '#B45309', bg: '#FEF3C7' },
    { label: 'Performance', icon: Award, href: '/(employee)/performance', color: '#059669', bg: '#D1FAE5' },
    { label: 'Expenses', icon: Receipt, href: '/(employee)/expenses', color: '#DC2626', bg: '#FEE2E2' },
    { label: 'Learning', icon: GraduationCap, href: '/(employee)/learning', color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Helpdesk', icon: LifeBuoy, href: '/(employee)/helpdesk', color: '#D97706', bg: '#FEF3C7' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <>
      <ScrollView
        style={mStyles.root}
        contentContainerStyle={mStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D7377" />}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Gradient Hero Banner ───────────────────────────────────────────── */}
        <View style={mStyles.heroBanner}>
          <View style={mStyles.heroBannerInner}>
            <View style={mStyles.heroLeft}>
              <Text style={mStyles.heroGreeting}>{getGreeting()}</Text>
              <Text style={mStyles.heroName}>{profile?.full_name?.split(' ')[0] ?? 'Welcome'} 👋</Text>
              <Text style={mStyles.heroDate}>{formatDate(new Date())}</Text>
            </View>
            <View style={mStyles.heroRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => router.push('/(employee)/notifications' as never)} style={{ position: 'relative', padding: 4 }}>
                  <Bell size={24} color="#FFF" />
                  <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                </TouchableOpacity>
                {profile && (
                  <TouchableOpacity onPress={() => router.push('/(employee)/profile' as never)} activeOpacity={0.85}>
                    <View style={mStyles.heroAvatarRing}>
                      <Avatar name={profile.full_name} url={profile.avatar_url} size={42} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              {/* Status pill */}
              <View style={[mStyles.statusPill, { backgroundColor: isClockedIn ? '#10B981' : '#64748B' }]}>
                {isClockedIn ? <Wifi size={10} color="#FFF" /> : <WifiOff size={10} color="#FFF" />}
                <Text style={mStyles.statusPillText}>{isClockedIn ? 'Working' : 'Offline'}</Text>
              </View>
            </View>
          </View>
          {/* Attendance stat chips inside banner */}
          <View style={mStyles.heroChips}>
            <View style={mStyles.heroChip}>
              <Text style={mStyles.heroChipLabel}>In</Text>
              <Text style={mStyles.heroChipValue}>{todayAttendance?.clock_in ? formatTime(todayAttendance.clock_in) : '--:--'}</Text>
            </View>
            <View style={mStyles.heroChipDivider} />
            <View style={mStyles.heroChip}>
              <Text style={mStyles.heroChipLabel}>Out</Text>
              <Text style={mStyles.heroChipValue}>{todayAttendance?.clock_out ? formatTime(todayAttendance.clock_out) : '--:--'}</Text>
            </View>
            <View style={mStyles.heroChipDivider} />
            <View style={mStyles.heroChip}>
              <Text style={mStyles.heroChipLabel}>Hours</Text>
              <Text style={mStyles.heroChipValue}>{todayAttendance?.working_minutes ? formatMinutes(todayAttendance.working_minutes) : '--'}</Text>
            </View>
            <View style={mStyles.heroChipDivider} />
            <View style={mStyles.heroChip}>
              <Text style={mStyles.heroChipLabel}>Status</Text>
              <Text style={mStyles.heroChipValue}>{todayAttendance ? todayAttendance.status.replace('_', ' ') : 'Not started'}</Text>
            </View>
          </View>
        </View>

        {/* ── Out of Bounds Alert ────────────────────────────────────────────── */}
        {outOfBounds && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={mStyles.alertBanner}>
              <AlertCircle color="#DC2626" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={mStyles.alertTitle}>Out of Office Boundary</Text>
                <Text style={mStyles.alertSub}>Your shift has been auto-paused. Return to resume.</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Clock In/Out Card ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(350).springify()}>
          <View style={mStyles.clockCard}>
            {/* Card header */}
            <View style={mStyles.clockCardHeader}>
              <View style={mStyles.clockCardIconWrap}>
                <Clock size={18} color="#0D7377" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mStyles.clockCardTitle}>Time Tracker</Text>
                <Text style={mStyles.clockCardSub}>{formatDate(new Date())}</Text>
              </View>
              {todayAttendance
                ? <Badge label={todayAttendance.status.replace('_', ' ')} variant={statusBadgeVariant(todayAttendance.status)} />
                : <Badge label="Not Started" variant="neutral" />}
            </View>

            {/* Location chip */}
            {distance !== null && (
              <View style={[mStyles.locChip, { backgroundColor: distance > (employee?.workplace?.radius_meters ?? 200) ? '#FEE2E2' : '#E6F4F4' }]}>
                <MapPin size={12} color={distance > (employee?.workplace?.radius_meters ?? 200) ? '#DC2626' : '#0D7377'} />
                <Text style={[mStyles.locChipText, { color: distance > (employee?.workplace?.radius_meters ?? 200) ? '#DC2626' : '#0D7377' }]}>
                  {distance}m from {employee?.workplace?.name || 'workplace'}
                </Text>
              </View>
            )}

            {/* Geofence Map — shown when workplace coordinates are available */}
            {employee?.workplace?.latitude && employee?.workplace?.longitude && (
              <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={mStyles.mapContainer}>
                <GeofenceMap
                  latitude={employee.workplace.latitude}
                  longitude={employee.workplace.longitude}
                  radius={employee.workplace.radius_meters}
                  name={employee.workplace.name}
                  outOfBounds={outOfBounds}
                />
              </Animated.View>
            )}

            {/* Error */}
            {clockError ? (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={mStyles.errorBox}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={mStyles.errorText}>{clockError}</Text>
              </Animated.View>
            ) : null}

            {/* Action button */}
            <View style={{ padding: 16, paddingTop: 8 }}>
              {!todayAttendance && (
                <PulseButton title="Clock In" onPress={() => handleClock('in')} loading={clockLoading} color="#0D7377" />
              )}
              {isClockedIn && (
                <TouchableOpacity
                  onPress={clockLoading ? undefined : () => handleClock('out')}
                  activeOpacity={0.85}
                  style={mStyles.clockOutBtn}
                >
                  <LogOutIcon size={20} color="#FFF" />
                  <Text style={clockBtnStyle.label}>{clockLoading ? 'Processing...' : 'Clock Out'}</Text>
                </TouchableOpacity>
              )}
              {isClockedOut && (
                <View style={mStyles.shiftDone}>
                  <CheckCircle2 size={22} color="#0D7377" />
                  <View>
                    <Text style={mStyles.shiftDoneTitle}>Shift Complete</Text>
                    <Text style={mStyles.shiftDoneSub}>Total: {formatMinutes(todayAttendance?.working_minutes ?? 0)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Horizontal KPI Strip ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).duration(350).springify()}>
          <Text style={mStyles.sectionTitle}>Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mStyles.kpiStrip}>
            {mobileKpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <View key={i} style={[mStyles.kpiChip, { backgroundColor: k.bg }]}>
                  <View style={[mStyles.kpiChipIcon, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                    <Icon size={16} color={k.color} />
                  </View>
                  <Text style={[mStyles.kpiChipValue, { color: k.color }]} numberOfLines={1}>{k.value}</Text>
                  <Text style={mStyles.kpiChipLabel} numberOfLines={1}>{k.label}</Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Quick Actions 2×4 Grid ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).duration(350).springify()}>
          <Text style={mStyles.sectionTitle}>Quick Access</Text>
          <View style={mStyles.quickGrid}>
            {mobileQuickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <TouchableOpacity
                  key={qa.href}
                  onPress={() => router.push(qa.href as never)}
                  style={mStyles.quickTile}
                  activeOpacity={0.75}
                >
                  <View style={[mStyles.quickTileIcon, { backgroundColor: qa.bg }]}>
                    <Icon size={24} color={qa.color} />
                  </View>
                  <Text style={mStyles.quickTileLabel} numberOfLines={1}>{qa.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Leave Balances Card ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).duration(350).springify()}>
          <View style={mStyles.card}>
            <View style={mStyles.cardHead}>
              <View style={[mStyles.cardIconWrap, { backgroundColor: '#EEEBFF' }]}>
                <CalendarDays size={16} color="#4F46E5" />
              </View>
              <Text style={mStyles.cardTitle}>Leave Balances</Text>
              <TouchableOpacity onPress={() => router.push('/(employee)/leave/apply' as never)} style={mStyles.cardAction}>
                <Text style={mStyles.cardActionText}>+ Apply</Text>
              </TouchableOpacity>
            </View>

            {leaveBalances.length === 0 ? (
              <Text style={mStyles.emptyText}>No leave quotas assigned yet.</Text>
            ) : (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 10 }}>
                {leaveBalances.slice(0, 4).map((lb) => {
                  const pct = lb.allocated_days > 0 ? lb.remaining_days / lb.allocated_days : 0;
                  const barColor = pct > 0.5 ? '#0D7377' : pct > 0.2 ? '#D97706' : '#DC2626';
                  return (
                    <View key={lb.id}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={mStyles.leaveLabel} numberOfLines={1}>{stripEmoji(lb.leave_type?.name || 'Leave')}</Text>
                        <Text style={mStyles.leaveCount}>{lb.remaining_days}/{lb.allocated_days}d</Text>
                      </View>
                      <View style={mStyles.progressBg}>
                        <View style={[mStyles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={mStyles.cardFooter} onPress={() => router.push('/(employee)/leave' as never)}>
              <Text style={mStyles.cardFooterText}>View All Leave</Text>
              <ArrowRight size={14} color="#0D7377" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Recent Attendance Activity ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(350).springify()}>
          <View style={mStyles.card}>
            <View style={mStyles.cardHead}>
              <View style={[mStyles.cardIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <CalendarClock size={16} color="#0369A1" />
              </View>
              <Text style={mStyles.cardTitle}>Recent Activity</Text>
            </View>

            {recentAttendance.length === 0 ? (
              <Text style={mStyles.emptyText}>No recent attendance records.</Text>
            ) : (
              <View style={{ paddingBottom: 4 }}>
                {recentAttendance.slice(0, 4).map((a, idx) => (
                  <View key={a.id} style={[mStyles.actRow, idx < 3 && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
                    {/* Status dot */}
                    <View style={[mStyles.actDot, {
                      backgroundColor:
                        a.status === 'present' ? '#10B981' :
                        a.status === 'late' || a.status === 'half_day' ? '#F59E0B' :
                        a.status === 'absent' ? '#EF4444' : '#94A3B8'
                    }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.actDate}>{formatDate(a.date)}</Text>
                      <Text style={mStyles.actTime}>
                        {a.clock_in ? formatTime(a.clock_in) : '—'} → {a.clock_out ? formatTime(a.clock_out) : '—'}
                        {a.working_minutes > 0 ? `  ·  ${formatMinutes(a.working_minutes)}` : ''}
                      </Text>
                    </View>
                    <Badge label={a.status.replace('_', ' ')} variant={statusBadgeVariant(a.status)} />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={mStyles.cardFooter} onPress={() => router.push('/(employee)/attendance' as never)}>
              <Text style={mStyles.cardFooterText}>Full Attendance History</Text>
              <ArrowRight size={14} color="#0D7377" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bottom spacer for nav bar */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Ovi AI HR FAB ──────────────────────────────────────────────────── */}
      <TouchableOpacity 
        style={mStyles.oviFab}
        activeOpacity={0.85}
        onPress={() => router.push('/(employee)/call-ovi' as never)}
      >
        <Mic size={24} color="#FFF" />
      </TouchableOpacity>
    </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Bar ─────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <View style={[styles.heroBar, { backgroundColor: '#1A1A2E' }]}>
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
        <View style={styles.kpiRowDesktop}>
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

      {/* ── Main 2-column ──────────────────────────────────────────────────── */}
      {outOfBounds && (
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#fff1f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecdd3', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AlertCircle color="#e11d48" size={24} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#be123c', fontSize: 15 }}>Out of Bounds</Text>
              <Text style={{ color: '#e11d48', fontSize: 13, marginTop: 2 }}>You are outside the office radius. Your active clock-in has been automatically paused.</Text>
            </View>
          </View>
        </Animated.View>
      )}
      <View style={styles.gridDesktop}>

        {/* LEFT — Clock In + Quick Links */}
        <View style={styles.colMain}>

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
                    <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{formatDate(new Date())}</Text>
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
                    <Text style={[styles.chipTime, { color: colors.text }]}>{todayAttendance?.clock_in ? formatTime(todayAttendance.clock_in) : '--:--'}</Text>
                  </View>
                </View>
                <View style={[styles.timeChip, { backgroundColor: '#f8faff' }]}>
                  <LogOutIcon size={14} color={colors.textSecondary} />
                  <View>
                    <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>Clock Out</Text>
                    <Text style={[styles.chipTime, { color: colors.text }]}>{todayAttendance?.clock_out ? formatTime(todayAttendance.clock_out) : '--:--'}</Text>
                  </View>
                </View>
                <View style={[styles.timeChip, { backgroundColor: '#edf8f6' }]}>
                  <TrendingUp size={14} color="#006a61" />
                  <View>
                    <Text style={[styles.chipLabel, { color: '#006a61' }]}>Hours</Text>
                    <Text style={[styles.chipTime, { color: '#006a61' }]}>{todayAttendance?.working_minutes ? formatMinutes(todayAttendance.working_minutes) : '--'}</Text>
                  </View>
                </View>
              </View>

              {distance !== null && (
                <View style={[styles.locRow, { backgroundColor: distance > (employee?.workplace?.radius_meters ?? 200) ? '#fff5f5' : '#edf8f6' }]}>
                  <MapPin size={13} color={distance > (employee?.workplace?.radius_meters ?? 200) ? '#ba1a1a' : '#006a61'} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: distance > (employee?.workplace?.radius_meters ?? 200) ? '#ba1a1a' : '#006a61' }}>
                    {distance}m from {employee?.workplace?.name || 'workplace'}
                  </Text>
                </View>
              )}

              {clockError ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.errorRow, { backgroundColor: '#fff5f5', borderColor: '#ffdad6' }]}>
                  <AlertCircle size={15} color="#ba1a1a" />
                  <Text style={{ color: '#ba1a1a', fontSize: 13, flex: 1 }}>{clockError}</Text>
                </Animated.View>
              ) : null}

              <View style={styles.clockActionWrap}>
                {!todayAttendance && (
                  <PulseButton title="Clock In" onPress={() => handleClock('in')} loading={clockLoading} color="#006a61" />
                )}
                {isClockedIn && (
                  <TouchableOpacity onPress={clockLoading ? undefined : () => handleClock('out')} activeOpacity={0.85} style={[styles.clockOutBtn, { backgroundColor: '#0b1c30' }]}>
                    <LogOutIcon size={20} color="#FFF" />
                    <Text style={clockBtnStyle.label}>{clockLoading ? 'Processing...' : 'Clock Out'}</Text>
                  </TouchableOpacity>
                )}
                {isClockedOut && (
                  <View style={[styles.doneRow, { backgroundColor: '#edf8f6', borderColor: '#c4ece7' }]}>
                    <CheckCircle2 size={22} color="#006a61" />
                    <View>
                      <Text style={{ color: '#006a61', fontWeight: '700', fontSize: 15 }}>Shift Complete</Text>
                      <Text style={{ color: '#006a61', fontSize: 12 }}>Total: {formatMinutes(todayAttendance?.working_minutes ?? 0)}</Text>
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
                  <TouchableOpacity key={ql.href} onPress={() => router.push(ql.href as never)} activeOpacity={0.75} style={[styles.quickCard, { backgroundColor: ql.bg }]}>
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
        <View style={styles.colSide}>

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
                <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 20, textAlign: 'center' }}>No leave quotas assigned yet.</Text>
              ) : (
                <View style={{ gap: 12 }}>
                  {leaveBalances.slice(0, 4).map((lb) => {
                    const pct = lb.allocated_days > 0 ? lb.remaining_days / lb.allocated_days : 0;
                    const barColor = pct > 0.5 ? '#006a61' : pct > 0.2 ? '#b45309' : '#ba1a1a';
                    return (
                      <View key={lb.id} style={styles.leaveRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{stripEmoji(lb.leave_type?.name || 'Leave')}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{lb.remaining_days}/{lb.allocated_days}d</Text>
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

              <TouchableOpacity style={[styles.cardFooter, { borderTopColor: '#f1f5f9' }]} onPress={() => router.push('/(employee)/leave' as never)}>
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
                <Text style={{ color: colors.textSecondary, fontSize: 13, paddingVertical: 20, textAlign: 'center' }}>No recent attendance records.</Text>
              ) : (
                <View style={{ gap: 0 }}>
                  {recentAttendance.slice(0, 4).map((a, idx) => (
                    <View key={a.id} style={[styles.actRow, idx !== recentAttendance.slice(0, 4).length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}>
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

              <TouchableOpacity style={[styles.cardFooter, { borderTopColor: '#f1f5f9' }]} onPress={() => router.push('/(employee)/attendance' as never)}>
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

// ─── MOBILE STYLES ────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingBottom: 100 },
  
  oviFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0D7377',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Hero Banner
  heroBanner: {
    backgroundColor: '#0D7377',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    marginBottom: 16,
  },
  heroBannerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
  },
  heroLeft: { flex: 1 },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.3 },
  heroName: { fontSize: 26, color: '#FFFFFF', fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  heroRight: { alignItems: 'center', gap: 8 },
  heroAvatarRing: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: { fontSize: 10, color: '#FFF', fontWeight: '700' },

  // Stat chips inside banner
  heroChips: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: -20,
  },
  heroChip: { flex: 1, alignItems: 'center' },
  heroChipLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' },
  heroChipValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '800', marginTop: 2 },
  heroChipDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // Alert
  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 14,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  alertSub: { fontSize: 12, color: '#EF4444', marginTop: 2 },

  // Clock Card
  clockCard: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  clockCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  clockCardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#E6F4F4',
    alignItems: 'center', justifyContent: 'center',
  },
  clockCardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  clockCardSub: { fontSize: 11, color: '#64748B', marginTop: 1 },

  locChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  locChipText: { fontSize: 12, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    padding: 10, borderRadius: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626' },

  clockOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
    backgroundColor: '#0F172A', width: '100%',
  },
  shiftDone: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: '#E6F4F4', borderWidth: 1, borderColor: '#A7F3D0',
  },
  shiftDoneTitle: { fontSize: 15, fontWeight: '800', color: '#0D7377' },
  shiftDoneSub: { fontSize: 12, color: '#0D7377', marginTop: 2 },

  // KPI Strip
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#0F172A',
    paddingHorizontal: 16, marginBottom: 10, letterSpacing: -0.2,
  },
  kpiStrip: { paddingHorizontal: 16, gap: 10, paddingBottom: 4, paddingRight: 24 },
  kpiChip: {
    width: 100, paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 16, alignItems: 'center', gap: 6,
  },
  kpiChipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiChipValue: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  kpiChipLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },

  // Quick Actions Grid
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 20,
  },
  quickTile: {
    width: '22%', alignItems: 'center', paddingVertical: 10,
  },
  quickTileIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  quickTileLabel: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'center' },

  // Cards
  card: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
  },
  cardIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#0F172A' },
  cardAction: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#E6F4F4' },
  cardActionText: { fontSize: 12, fontWeight: '800', color: '#0D7377' },
  emptyText: { textAlign: 'center', fontSize: 13, color: '#94A3B8', paddingVertical: 20, paddingHorizontal: 16 },

  leaveLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1 },
  leaveCount: { fontSize: 12, color: '#64748B' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Activity
  actRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  actDot: { width: 8, height: 8, borderRadius: 4 },
  actDate: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  actTime: { fontSize: 11, color: '#64748B', marginTop: 1 },

  // Card Footer
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  cardFooterText: { fontSize: 13, fontWeight: '700', color: '#0D7377' },

  // Map / Geofence
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
});

// ─── DESKTOP STYLES (unchanged) ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 64, gap: 24 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 40, paddingTop: 40, gap: 32 },

  heroBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 28, paddingTop: 36,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: -8,
  },
  heroGreeting: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heroName: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  heroDate: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6 },
  heroBell: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  kpiRowDesktop: { flexDirection: 'row', gap: 16 },
  kpiCard: { flex: 1, minWidth: 140, padding: 16, borderRadius: 14, borderWidth: 1, gap: 6 },
  kpiIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#0b1c30', letterSpacing: -0.5 },
  kpiSub: { fontSize: 11, color: '#64748b' },

  gridDesktop: { flexDirection: 'row', gap: 28, alignItems: 'flex-start', paddingHorizontal: 0 },
  colMain: { flex: 3, gap: 24 },
  colSide: { flex: 2, gap: 20 },

  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },

  card: {
    borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16 },
  cardIconPill: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  cardSub: { fontSize: 12, marginTop: 1 },

  timeChipRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  timeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  chipLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  chipTime: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },

  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, margin: 20, marginTop: 0, borderRadius: 8, borderWidth: 1 },
  clockActionWrap: { padding: 20, paddingTop: 8 },
  clockOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, width: '100%' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, borderWidth: 1 },

  quickGrid: { gap: 12 },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14 },
  quickIconWrap: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 14, fontWeight: '700' },
  quickSub: { fontSize: 12, marginTop: 1 },

  leaveRow: { paddingHorizontal: 20 },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  actRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 13 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, marginTop: 8 },
});
