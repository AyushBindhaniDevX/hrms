import { GeofenceMap } from '@/components/Map/GeofenceMap';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { DEFAULT_SUBEDGE_LOGO as SUBEDGE_LOGO } from '@/components/ui/SubedgeBrand';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { clockIn, clockOut, getAttendanceHistory, getTodayAttendance } from '@/lib/services/attendance';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { getLeaveBalances } from '@/lib/services/leave';
import { calculateDistance, getCurrentLocation } from '@/lib/services/location';
import { cancelClockInNotification, sendClockInNotification } from '@/lib/services/notifications';
import { getPayslips } from '@/lib/services/payroll';
import type { Attendance, Employee, LeaveBalance, Payslip } from '@/types';
import { formatCurrency, formatDate, formatMinutes, formatTime, getGreeting } from '@/utils/format';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Banknote,
  Bell,
  Briefcase,
  CalendarClock, CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogIn, LogOut as LogOutIcon,
  MapPin,
  Mic,
  Navigation,
  Receipt,
  TrendingUp,
  Users
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut, useAnimatedStyle,
  useSharedValue, withRepeat, withSequence, withTiming,
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

import { FaceVerificationModal } from '@/components/attendance/FaceVerificationModal';
import { useTenant } from '@/context/TenantContext';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const colors = useTheme();
  const { profile } = useAuth();
  const { companyName, officeName, companyLogoUrl } = useTenant();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20);

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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Face Verification Modal state
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalType, setFaceModalType] = useState<'in' | 'out'>('in');
  const [pendingLoc, setPendingLoc] = useState<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });

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
      }
    } catch (err) { console.error('Dashboard load error:', err); }
    finally { setLoading(false); }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  // Location tracking and distance computation
  useEffect(() => {
    if (employee?.workplace?.latitude && employee?.workplace?.longitude) {
      getCurrentLocation()
        .then((loc) => {
          setUserLocation(loc);
          const dist = calculateDistance(
            loc.latitude,
            loc.longitude,
            employee.workplace!.latitude,
            employee.workplace!.longitude
          );
          setDistance(Math.round(dist));
        })
        .catch(() => { });
    }
  }, [employee]);

  // Periodic distance refresh
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (employee?.workplace?.latitude && employee?.workplace?.longitude) {
      interval = setInterval(() => {
        getCurrentLocation()
          .then((loc) => {
            setUserLocation(loc);
            const dist = calculateDistance(
              loc.latitude,
              loc.longitude,
              employee.workplace!.latitude,
              employee.workplace!.longitude
            );
            setDistance(Math.round(dist));
          })
          .catch(() => { });
      }, 60000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [employee]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleClock = async (type: 'in' | 'out') => {
    setClockError('');
    setClockLoading(true);
    try {
      let loc = { latitude: 0, longitude: 0 };
      try {
        loc = await getCurrentLocation();
        setUserLocation(loc);
      } catch (locErr) {
        console.warn('Location retrieval notice:', locErr);
        // Fallback default coordinates if unavailable
        loc = userLocation || { latitude: 20.2961, longitude: 85.8245 };
      }

      if (employee?.workplace?.latitude && employee?.workplace?.longitude) {
        const dist = calculateDistance(
          loc.latitude,
          loc.longitude,
          employee.workplace.latitude,
          employee.workplace.longitude
        );
        setDistance(Math.round(dist));
      }

      setPendingLoc(loc);
      setFaceModalType(type);
      setShowFaceModal(true);
    } catch (err: unknown) {
      setClockError(err instanceof Error ? err.message : 'Failed to prepare clocking. Please try again.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleFaceVerified = async (faceSnapshot?: string) => {
    setClockLoading(true);
    setClockError('');
    try {
      const loc = pendingLoc || userLocation || { latitude: 0, longitude: 0 };
      const result = faceModalType === 'in'
        ? await clockIn(loc.latitude, loc.longitude, faceSnapshot)
        : await clockOut(loc.latitude, loc.longitude, faceSnapshot);

      if (!result.success) {
        setClockError(result.message || 'Operation failed');
      } else {
        try {
          if (faceModalType === 'in') {
            const startTime = formatTime(new Date().toISOString());
            await sendClockInNotification(startTime);
          } else {
            await cancelClockInNotification();
          }
        } catch (notifErr) { }

        setShowFaceModal(false);
        await loadData();
      }
    } catch (err: unknown) {
      console.error('Biometric clock error:', err);
      setClockError(err instanceof Error ? err.message : 'Biometric clocking failed. Please try again.');
    } finally {
      setClockLoading(false);
    }
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

  // Geofence: compute outside state from current distance — warning-only, never blocks clock action
  const geofenceRadius = employee?.workplace?.radius_meters ?? 200;
  const isOutsideGeofence = distance !== null && employee?.workplace?.latitude && distance > geofenceRadius;

  // ─── Desktop KPI / Quick Links data ────────────────────────────────────────
  const kpis = [
    {
      label: 'Today',
      value: todayAttendance?.working_minutes != null ? formatMinutes(todayAttendance.working_minutes) : '—',
      sub: todayAttendance?.clock_in ? `In: ${formatTime(todayAttendance.clock_in)}` : 'Not clocked in',
      icon: <Clock size={20} color="#006a61" />, bg: '#edf8f6', border: '#c4ece7',
    },
    {
      label: 'Annual Leave', value: `${annualLeft}d`,
      sub: annualLeave ? `of ${annualLeave.allocated_days} days` : 'No quota',
      icon: <CalendarDays size={20} color="#4f46e5" />, bg: '#eeebff', border: '#d5d0f5',
    },
    {
      label: 'Net Salary', value: formatCurrency(netPay ?? 0),
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
    { label: "Today's Hours", value: todayAttendance?.working_minutes != null ? formatMinutes(todayAttendance.working_minutes) : '—', color: '#006a61', bg: '#E6F4F4', icon: Clock },
    { label: 'Leave Left', value: `${annualLeft}d`, color: '#4F46E5', bg: '#EEEBFF', icon: CalendarDays },
    { label: 'Net Pay', value: formatCurrency(netPay ?? 0), color: '#0369A1', bg: '#E0F2FE', icon: Banknote },
    { label: 'Dept', value: employee?.department?.name || '—', color: '#B45309', bg: '#FEF3C7', icon: Briefcase },
  ];

  const mobileQuickActions = [
    { label: 'Attendance', icon: CalendarClock, href: '/(employee)/attendance', color: '#006a61', bg: '#E6F4F4' },
    { label: 'Leave', icon: CalendarDays, href: '/(employee)/leave', color: '#4F46E5', bg: '#EEEBFF' },
    { label: 'Payslips', icon: Banknote, href: '/(employee)/payslips', color: '#0369A1', bg: '#E0F2FE' },
    { label: 'Expenses', icon: Receipt, href: '/(employee)/expenses', color: '#DC2626', bg: '#FEE2E2' },
    { label: 'Performance', icon: Award, href: '/(employee)/performance', color: '#059669', bg: '#D1FAE5' },
    { label: 'Directory', icon: Users, href: '/(employee)/directory', color: '#B45309', bg: '#FEF3C7' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT — Professional Minimalist Redesign
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    const clockInTime = todayAttendance?.clock_in ? formatTime(todayAttendance.clock_in) : '--:--';
    const clockOutTime = todayAttendance?.clock_out ? formatTime(todayAttendance.clock_out) : '--:--';
    const hoursWorked = todayAttendance?.working_minutes ? formatMinutes(todayAttendance.working_minutes) : '0h 0m';

    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Top bounce underlay matching header card */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: '#FFFFFF' }} />

          <ScrollView
            style={mStyles.root}
            contentContainerStyle={mStyles.content}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006a61" />}
            showsVerticalScrollIndicator={false}
            bounces
          >
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <View style={[mStyles.header, { paddingTop: topPadding + 10 }]}>
              <View style={mStyles.headerTop}>
                <View style={mStyles.headerLeft}>
                  {companyLogoUrl ? (
                    <Image source={{ uri: companyLogoUrl }} style={mStyles.headerLogo} resizeMode="contain" />
                  ) : (
                    <Image source={SUBEDGE_LOGO} style={mStyles.headerLogo} resizeMode="contain" />
                  )}
                  <View>
                    <Text style={mStyles.headerGreeting}>{getGreeting()}</Text>
                    <Text style={mStyles.headerName} numberOfLines={1}>
                      {profile?.full_name?.split(' ')[0] || 'Team Member'}
                    </Text>
                  </View>
                </View>
                <View style={mStyles.headerRight}>
                  <TouchableOpacity
                    style={mStyles.headerBell}
                    onPress={() => router.push('/(employee)/notifications' as never)}
                  >
                    <Bell size={20} color="#1a1a2e" />
                    {unreadCount > 0 && <View style={mStyles.headerBellDot} />}
                  </TouchableOpacity>
                  {profile && (
                    <TouchableOpacity
                      onPress={() => router.push('/(employee)/profile' as never)}
                      activeOpacity={0.85}
                    >
                      <Avatar name={profile.full_name} url={profile.avatar_url} size={40} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Status Bar */}
              <View style={mStyles.statusBar}>
                <View style={mStyles.statusItem}>
                  <Text style={mStyles.statusLabel}>Clock In</Text>
                  <Text style={mStyles.statusValue}>{clockInTime}</Text>
                </View>
                <View style={mStyles.statusDivider} />
                <View style={mStyles.statusItem}>
                  <Text style={mStyles.statusLabel}>Clock Out</Text>
                  <Text style={mStyles.statusValue}>{clockOutTime}</Text>
                </View>
                <View style={mStyles.statusDivider} />
                <View style={mStyles.statusItem}>
                  <Text style={mStyles.statusLabel}>Hours</Text>
                  <Text style={[mStyles.statusValue, { color: '#006a61' }]}>{hoursWorked}</Text>
                </View>
              </View>

              {/* Status Indicators */}
              <View style={mStyles.statusIndicators}>
                <View style={[mStyles.statusPill, {
                  backgroundColor: isClockedIn ? '#E6F4F4' : isClockedOut ? '#F1F5F9' : '#F8FAFC',
                }]}>
                  <View style={[mStyles.statusDot, {
                    backgroundColor: isClockedIn ? '#006a61' : isClockedOut ? '#94A3B8' : '#CBD5E1',
                  }]} />
                  <Text style={[mStyles.statusPillText, {
                    color: isClockedIn ? '#006a61' : isClockedOut ? '#64748B' : '#94A3B8',
                  }]}>
                    {isClockedIn ? 'Active Shift' : isClockedOut ? 'Shift Complete' : 'Not Clocked In'}
                  </Text>
                </View>
                {distance !== null && (
                  <View style={[mStyles.locationPill, {
                    backgroundColor: distance > geofenceRadius ? '#FEF2F2' : '#E6F4F4',
                  }]}>
                    <MapPin size={12} color={distance > geofenceRadius ? '#DC2626' : '#006a61'} />
                    <Text style={[mStyles.locationText, {
                      color: distance > geofenceRadius ? '#DC2626' : '#006a61',
                    }]}>
                      {distance}m away
                    </Text>
                  </View>
                )}
              </View>
            </View>

          {/* ── Clock Action ──────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400).springify()} style={mStyles.clockActionWrap}>
            {!todayAttendance && (
              <PulseButton title="Clock In" onPress={() => handleClock('in')} loading={clockLoading} color="#006a61" />
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
              <View style={mStyles.shiftComplete}>
                <CheckCircle2 size={20} color="#006a61" />
                <View style={{ flex: 1 }}>
                  <Text style={mStyles.shiftCompleteTitle}>Shift Complete</Text>
                  <Text style={mStyles.shiftCompleteSub}>Logged {formatMinutes(todayAttendance?.working_minutes ?? 0)} today</Text>
                </View>
              </View>
            )}
            {clockError ? (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={mStyles.errorBox}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={mStyles.errorText}>{clockError}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>

          {/* ── Geofence Alert ──────────────────────────────────────────────────── */}
          {isOutsideGeofence && isClockedIn && (
            <Animated.View entering={FadeInDown.duration(300)} style={mStyles.alertContainer}>
              <View style={mStyles.alertBanner}>
                <AlertCircle color="#D97706" size={16} />
                <View style={{ flex: 1 }}>
                  <Text style={mStyles.alertTitle}>Outside Office Zone</Text>
                  <Text style={mStyles.alertSub}>
                    {Math.round(distance ?? 0)}m from workplace. Logged as remote.
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── KPI Stats ────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(140).duration(400).springify()} style={mStyles.kpiRow}>
            {mobileKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <View key={kpi.label} style={mStyles.kpiCard}>
                  <View style={[mStyles.kpiIcon, { backgroundColor: kpi.bg }]}>
                    <Icon size={16} color={kpi.color} />
                  </View>
                  <Text style={mStyles.kpiValue} numberOfLines={1}>{kpi.value}</Text>
                  <Text style={mStyles.kpiLabel} numberOfLines={1}>{kpi.label}</Text>
                </View>
              );
            })}
          </Animated.View>

          {/* ── Quick Actions ────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={mStyles.quickSection}>
            <Text style={mStyles.sectionTitle}>Quick Actions</Text>
            <View style={mStyles.quickGrid}>
              {mobileQuickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <TouchableOpacity
                    key={qa.href}
                    onPress={() => router.push(qa.href as never)}
                    style={mStyles.quickTile}
                    activeOpacity={0.7}
                  >
                    <View style={[mStyles.quickTileIcon, { backgroundColor: qa.bg }]}>
                      <Icon size={22} color={qa.color} />
                    </View>
                    <Text style={mStyles.quickTileLabel} numberOfLines={1}>{qa.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Workplace Map ────────────────────────────────────────────────── */}
          {employee?.workplace?.latitude && employee?.workplace?.longitude && (
            <Animated.View entering={FadeInDown.delay(260).duration(400).springify()} style={mStyles.mapSection}>
              <View style={mStyles.mapCard}>
                <View style={mStyles.mapHeader}>
                  <View style={mStyles.mapIconWrap}>
                    <Navigation size={16} color="#006a61" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={mStyles.mapTitle}>Workplace Location</Text>
                    <Text style={mStyles.mapSub}>{employee.workplace.name || 'Office'}</Text>
                  </View>
                </View>
                <View style={mStyles.mapContainer}>
                  <GeofenceMap
                    latitude={employee.workplace.latitude}
                    longitude={employee.workplace.longitude}
                    radius={employee.workplace.radius_meters}
                    name={employee.workplace.name}
                    outOfBounds={!!isOutsideGeofence}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Leave Balances ──────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(320).duration(400).springify()} style={mStyles.sectionSpacing}>
            <View style={mStyles.card}>
              <View style={mStyles.cardHead}>
                <View style={[mStyles.cardIcon, { backgroundColor: '#EEEBFF' }]}>
                  <CalendarDays size={16} color="#4F46E5" />
                </View>
                <Text style={mStyles.cardTitle}>Leave Balances</Text>
                <TouchableOpacity onPress={() => router.push('/(employee)/leave/apply' as never)} style={mStyles.cardAction}>
                  <Text style={mStyles.cardActionText}>Apply</Text>
                </TouchableOpacity>
              </View>

              {leaveBalances.length === 0 ? (
                <View style={mStyles.emptyState}>
                  <Text style={mStyles.emptyText}>No leave quotas assigned</Text>
                </View>
              ) : (
                <View style={mStyles.leaveList}>
                  {leaveBalances.slice(0, 4).map((lb) => {
                    const pct = lb.allocated_days > 0 ? lb.remaining_days / lb.allocated_days : 0;
                    const barColor = pct > 0.5 ? '#006a61' : pct > 0.2 ? '#D97706' : '#DC2626';
                    return (
                      <View key={lb.id} style={mStyles.leaveItem}>
                        <View style={mStyles.leaveRow}>
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
                <ArrowRight size={14} color="#006a61" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Recent Attendance ──────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(380).duration(400).springify()} style={mStyles.sectionSpacing}>
            <View style={mStyles.sectionHeader}>
              <Text style={mStyles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(employee)/attendance' as never)}>
                <Text style={mStyles.sectionSeeAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentAttendance.length === 0 ? (
              <View style={mStyles.emptyCard}>
                <Text style={mStyles.emptyText}>No recent attendance records</Text>
              </View>
            ) : (
              <View style={mStyles.activityList}>
                {recentAttendance.slice(0, 5).map((a, idx) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[mStyles.activityRow, idx !== Math.min(recentAttendance.length, 5) - 1 && mStyles.activityRowBorder]}
                    onPress={() => router.push('/(employee)/attendance' as never)}
                    activeOpacity={0.7}
                  >
                    <View style={mStyles.activityDot}>
                      <View style={[mStyles.activityDotInner, {
                        backgroundColor: a.status === 'present' ? '#006a61' : a.status === 'late' ? '#D97706' : a.status === 'absent' ? '#DC2626' : '#94A3B8',
                      }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mStyles.activityDate}>{formatDate(a.date)}</Text>
                      <Text style={mStyles.activityTime}>
                        {a.clock_in ? formatTime(a.clock_in) : '—'} → {a.clock_out ? formatTime(a.clock_out) : '—'}
                        {a.working_minutes > 0 ? `  ·  ${formatMinutes(a.working_minutes)}` : ''}
                      </Text>
                    </View>
                    <Badge label={a.status.replace('_', ' ')} variant={statusBadgeVariant(a.status)} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Ovi AI FAB ────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={mStyles.oviFab}
          activeOpacity={0.85}
          onPress={() => router.push('/(employee)/call-ovi' as never)}
        >
          <Mic size={22} color="#FFF" />
        </TouchableOpacity>

        {/* ── Face Verification Modal ────────────────────────────────────────── */}
        <FaceVerificationModal
          visible={showFaceModal}
          onClose={() => setShowFaceModal(false)}
          onVerified={handleFaceVerified}
          employeeName={profile?.full_name || 'Team Member'}
          officeName={officeName || employee?.workplace?.name || 'Office Workplace'}
          isClockingIn={faceModalType === 'in'}
          enrolledFaceUrl={profile?.avatar_url || null}
          profileId={profile?.id}
        />
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
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
              <Text style={styles.heroName}>{profile?.full_name?.split(' ')[0] ?? 'Welcome'}</Text>
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
        {isOutsideGeofence && isClockedIn && (
          <Animated.View entering={FadeInDown.duration(350).springify()}>
            <View style={{ marginBottom: 16, padding: 16, backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AlertCircle color="#D97706" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#B45309', fontSize: 15 }}>Outside Office Zone</Text>
                <Text style={{ color: '#D97706', fontSize: 13, marginTop: 2 }}>You are {Math.round(distance ?? 0)}m from {employee?.workplace?.name || 'workplace'}. Clocking as remote — attendance is still tracked.</Text>
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
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Apply</Text>
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

      <FaceVerificationModal
        visible={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        onVerified={handleFaceVerified}
        employeeName={profile?.full_name || 'Team Member'}
        officeName={officeName || employee?.workplace?.name || 'Office Workplace'}
        isClockingIn={faceModalType === 'in'}
        enrolledFaceUrl={profile?.avatar_url || null}
        profileId={profile?.id}
      />
    </>
  );
}

// ─── MOBILE STYLES — Professional Minimalist ──────────────────────────────────
const mStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 100 },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerGreeting: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerBellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },

  // Status Indicators
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Clock Action ─────────────────────────────────────────────────────────────
  clockActionWrap: {
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 16,
  },
  clockOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)' },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  shiftComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#E6F4F4',
    borderWidth: 1,
    borderColor: '#B8E0DC',
  },
  shiftCompleteTitle: { fontSize: 15, fontWeight: '700', color: '#006a61' },
  shiftCompleteSub: { fontSize: 12, color: '#006a61', marginTop: 2 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626' },

  // ── Alert Banner ───────────────────────────────────────────────────────────
  alertContainer: { paddingHorizontal: 20, marginBottom: 12 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  alertSub: { fontSize: 12, color: '#D97706', marginTop: 2 },

  // ── KPI Stats ──────────────────────────────────────────────────────────────
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 2,
    textAlign: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── Section Headers ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  sectionSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006a61',
  },
  sectionSpacing: { paddingHorizontal: 20, marginBottom: 20 },

  // ── Quick Actions ──────────────────────────────────────────────────────────
  quickSection: { paddingHorizontal: 20, marginBottom: 20 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTile: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  quickTileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  // ── Map Card ───────────────────────────────────────────────────────────────
  mapSection: { paddingHorizontal: 20, marginBottom: 20 },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  mapIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  mapSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  mapContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // ── Cards ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
        elevation: 2,
      },
    }),
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardAction: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEEBFF',
  },
  cardActionText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { textAlign: 'center', fontSize: 13, color: '#94A3B8' },

  // ── Leave Balances ──────────────────────────────────────────────────────────
  leaveList: { paddingHorizontal: 16, paddingBottom: 14, gap: 14 },
  leaveItem: { gap: 6 },
  leaveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1 },
  leaveCount: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  cardFooterText: { fontSize: 13, fontWeight: '700', color: '#006a61' },

  // ── Activity Timeline ──────────────────────────────────────────────────────
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
  },

  // ── Ovi FAB ────────────────────────────────────────────────────────────────
  oviFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006a61',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0, 106, 97, 0.3)' },
      default: {
        shadowColor: '#006a61',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
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