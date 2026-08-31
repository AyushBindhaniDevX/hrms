import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  TextInput,
  RefreshControl,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { HeroBalanceCard } from '@/components/ui/HeroBalanceCard';
import { ActivityCard } from '@/components/ui/ActivityCard';
import {
  getAttendanceHistory,
  getTodayAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
} from '@/lib/services/attendance';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { getCurrentLocation, calculateDistance } from '@/lib/services/location';
import { formatTime, formatMinutes } from '@/utils/format';
import type { Attendance, Employee } from '@/types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  TrendingUp,
  TrendingDown,
  CalendarX,
  ChevronRight,
  LogIn,
  LogOut as LogOutIcon,
  Coffee,
  Play,
  ScanFace,
  Fingerprint,
  Sparkles,
  ShieldCheck,
  MapPin,
} from 'lucide-react-native';
import { MONTHS } from '@/constants/config';
import { FaceVerificationModal } from '@/components/attendance/FaceVerificationModal';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { DEFAULT_SUBEDGE_LOGO as SUBEDGE_LOGO } from '@/components/ui/SubedgeBrand';

export default function AttendanceScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [filtered, setFiltered] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState('');

  // Elapsed working seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Face Verification Modal
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalType, setFaceModalType] = useState<'in' | 'out'>('in');
  const [pendingLoc, setPendingLoc] = useState<{ latitude: number; longitude: number }>({ latitude: 0, longitude: 0 });
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const emp = await getEmployeeByProfileId(profile.id);
      setEmployee(emp);
      if (emp) {
        const [history, today] = await Promise.all([
          getAttendanceHistory(emp.id, 60),
          getTodayAttendance(emp.id),
        ]);
        setRecords(history);
        setFiltered(history);
        setTodayAttendance(today);
      }
    } catch (e) {
      console.error('Attendance load error:', e);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live timer for active shift
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (todayAttendance?.clock_in && !todayAttendance?.clock_out) {
      const startTime = new Date(todayAttendance.clock_in).getTime();
      const updateTimer = () => {
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayAttendance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleInitiateClock = async (type: 'in' | 'out') => {
    setClockError('');
    setClockLoading(true);
    try {
      let loc = { latitude: 0, longitude: 0 };
      try {
        loc = await getCurrentLocation();
      } catch (locErr) {
        console.warn('Location retrieval fallback:', locErr);
        loc = { latitude: 20.2961, longitude: 85.8245 };
      }
      setPendingLoc(loc);
      setFaceModalType(type);
      setShowFaceModal(true);
    } catch (err: unknown) {
      setClockError(err instanceof Error ? err.message : 'Could not prepare attendance.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleVerifiedFace = async (faceSnapshot?: string) => {
    if (!profile) return;
    setClockLoading(true);
    try {
      if (faceModalType === 'in') {
        await clockIn(pendingLoc.latitude, pendingLoc.longitude, faceSnapshot, profile.id);
      } else {
        await clockOut(pendingLoc.latitude, pendingLoc.longitude, faceSnapshot, profile.id);
      }
      await loadData();
    } catch (err: unknown) {
      setClockError(err instanceof Error ? err.message : 'Clocking request failed.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleBreak = async (action: 'start' | 'end') => {
    if (!employee) return;
    setClockLoading(true);
    try {
      if (action === 'start') {
        await startBreak(employee.id, 'Tea / Rest Break');
      } else {
        await endBreak(employee.id);
      }
      await loadData();
    } catch (err: unknown) {
      setClockError(err instanceof Error ? err.message : 'Break action failed.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(records);
      return;
    }
    const t = text.toLowerCase();
    setFiltered(
      records.filter(
        (r) =>
          r.date.includes(t) ||
          r.status.includes(t) ||
          formatShortDate(r.date).toLowerCase().includes(t)
      )
    );
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

  const formatTimerDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) return <LoadingState />;

  const isClockedIn = Boolean(todayAttendance?.clock_in && !todayAttendance?.clock_out);
  const isClockedOut = Boolean(todayAttendance?.clock_in && todayAttendance?.clock_out);
  const activeBreak = todayAttendance?.breaks?.find((b: any) => !b.end);

  const presentDays = records.filter((r) => r.status === 'present').length;
  const lateDays = records.filter((r) => r.status === 'late').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const totalDays = records.length;
  const totalMins = records.reduce((acc, r) => acc + (r.working_minutes || 0), 0);
  const avgHours = totalDays > 0 ? totalMins / totalDays / 60 : 0;
  const exceptions = lateDays + absentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const now = new Date();
  const currentMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const displayedRecords = filtered.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: '#004D47' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Top bounce underlay matching header card */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: '#004D47' }} />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={['#004D47']} />}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Mobile Gradient Header ── */}
            <View style={[mAttStyles.heroGradient, { paddingTop: topPadding + 10 }]}>
              <View style={mAttStyles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={mAttStyles.heroTag}>TODAY'S SHIFT</Text>
                  <Text style={mAttStyles.heroTitle}>
                    {isClockedIn
                      ? activeBreak
                        ? 'On Break'
                        : 'Shift Active'
                      : isClockedOut
                      ? 'Shift Completed'
                      : 'Ready to Clock In'}
                  </Text>
                </View>
                {isClockedIn && (
                  <View style={mAttStyles.timerPill}>
                    <Clock size={14} color="#6EE7B7" />
                    <Text style={mAttStyles.timerPillText}>{formatTimerDisplay(elapsedSeconds)}</Text>
                  </View>
                )}
              </View>

              {/* In/Out Times Strip */}
              <View style={mAttStyles.timeStrip}>
                <View style={mAttStyles.timeCol}>
                  <Text style={mAttStyles.timeLabel}>Clock In</Text>
                  <Text style={mAttStyles.timeVal}>
                    {todayAttendance?.clock_in ? formatTime(todayAttendance.clock_in) : '--:--'}
                  </Text>
                </View>
                <View style={mAttStyles.timeDivider} />
                <View style={mAttStyles.timeCol}>
                  <Text style={mAttStyles.timeLabel}>Clock Out</Text>
                  <Text style={mAttStyles.timeVal}>
                    {todayAttendance?.clock_out ? formatTime(todayAttendance.clock_out) : '--:--'}
                  </Text>
                </View>
                <View style={mAttStyles.timeDivider} />
                <View style={mAttStyles.timeCol}>
                  <Text style={mAttStyles.timeLabel}>Duration</Text>
                  <Text style={[mAttStyles.timeVal, { color: '#6EE7B7' }]}>
                    {todayAttendance?.working_minutes ? formatMinutes(todayAttendance.working_minutes) : '0h 0m'}
                  </Text>
                </View>
              </View>

              {/* Action Button Row */}
              <View style={mAttStyles.heroBtnRow}>
                {!isClockedIn && !isClockedOut && (
                  <TouchableOpacity
                    style={[mAttStyles.punchBtn, { backgroundColor: '#FFFFFF' }]}
                    onPress={() => handleInitiateClock('in')}
                    disabled={clockLoading}
                    activeOpacity={0.85}
                  >
                    <ScanFace size={18} color="#006a61" />
                    <Text style={[mAttStyles.punchBtnText, { color: '#006a61' }]}>
                      {clockLoading ? 'Verifying...' : 'Face ID Clock In'}
                    </Text>
                  </TouchableOpacity>
                )}

                {isClockedIn && (
                  <>
                    {!activeBreak ? (
                      <TouchableOpacity
                        style={[mAttStyles.punchBtn, { backgroundColor: 'rgba(255,255,255,0.18)', flex: 1 }]}
                        onPress={() => handleBreak('start')}
                        disabled={clockLoading}
                      >
                        <Coffee size={16} color="#FFF" />
                        <Text style={mAttStyles.punchBtnText}>Break</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[mAttStyles.punchBtn, { backgroundColor: '#059669', flex: 1 }]}
                        onPress={() => handleBreak('end')}
                        disabled={clockLoading}
                      >
                        <Play size={16} color="#FFF" />
                        <Text style={mAttStyles.punchBtnText}>Resume</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[mAttStyles.punchBtn, { backgroundColor: '#EF4444', flex: 1.4 }]}
                      onPress={() => handleInitiateClock('out')}
                      disabled={clockLoading}
                    >
                      <LogOutIcon size={16} color="#FFF" />
                      <Text style={mAttStyles.punchBtnText}>
                        {clockLoading ? 'Processing...' : 'Clock Out'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {isClockedOut && (
                  <View style={mAttStyles.shiftCompletedPill}>
                    <CheckCircle2 size={16} color="#6EE7B7" />
                    <Text style={{ color: '#6EE7B7', fontWeight: '700', fontSize: 13 }}>
                      Today's Attendance Recorded
                    </Text>
                  </View>
                )}
              </View>
            </View>

          {/* ── Summary Stat Row ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(350).springify()} style={mAttStyles.statRow}>
            <View style={mAttStyles.statChip}>
              <Text style={mAttStyles.statChipVal}>{attendanceRate}%</Text>
              <Text style={mAttStyles.statChipLabel}>On-Time</Text>
            </View>
            <View style={mAttStyles.statChip}>
              <Text style={[mAttStyles.statChipVal, { color: '#006a61' }]}>{presentDays}d</Text>
              <Text style={mAttStyles.statChipLabel}>Present</Text>
            </View>
            <View style={mAttStyles.statChip}>
              <Text style={[mAttStyles.statChipVal, { color: '#D97706' }]}>{lateDays}d</Text>
              <Text style={mAttStyles.statChipLabel}>Late</Text>
            </View>
            <View style={mAttStyles.statChip}>
              <Text style={[mAttStyles.statChipVal, { color: '#DC2626' }]}>{absentDays}d</Text>
              <Text style={mAttStyles.statChipLabel}>Absent</Text>
            </View>
          </Animated.View>

          {/* ── Search & Filter Tabs ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <View style={mAttStyles.searchWrap}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                placeholder="Search by date or month..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={handleSearch}
                style={mAttStyles.searchInput}
              />
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
              {(['all', 'present', 'late', 'absent'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setStatusFilter(tab)}
                  style={[mAttStyles.filterPill, statusFilter === tab && mAttStyles.filterPillActive]}
                >
                  <Text style={[mAttStyles.filterPillText, statusFilter === tab && mAttStyles.filterPillTextActive]}>
                    {tab.toUpperCase()} {tab === 'all' ? `(${records.length})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Attendance History Cards ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 10 }}>
            {displayedRecords.length === 0 ? (
              <View style={mAttStyles.emptyBox}>
                <CalendarX size={36} color="#94A3B8" />
                <Text style={mAttStyles.emptyText}>No attendance records found</Text>
              </View>
            ) : (
              displayedRecords.map((item, idx) => (
                <Animated.View key={item.id || idx} entering={FadeInDown.delay(Math.min(idx * 40, 300)).duration(300)}>
                  <View style={mAttStyles.historyCard}>
                    <View style={mAttStyles.cardLeft}>
                      <Text style={mAttStyles.cardDate}>{formatShortDate(item.date)}</Text>
                      <View style={mAttStyles.cardTimeRow}>
                        <Clock size={13} color="#64748B" />
                        <Text style={mAttStyles.cardTimeText}>
                          {item.clock_in ? formatTime(item.clock_in) : '--:--'} → {item.clock_out ? formatTime(item.clock_out) : '--:--'}
                        </Text>
                        {item.working_minutes > 0 && (
                          <Text style={mAttStyles.cardDurationText}>
                            ({formatMinutes(item.working_minutes)})
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={mAttStyles.cardRight}>
                      <Badge
                        label={item.status.toUpperCase()}
                        variant={
                          item.status === 'present'
                            ? 'successLight'
                            : item.status === 'late'
                            ? 'warningLight'
                            : 'dangerLight'
                        }
                      />
                      {item.face_verified && (
                        <View style={mAttStyles.faceTag}>
                          <ShieldCheck size={11} color="#006a61" />
                          <Text style={mAttStyles.faceTagText}>Face ID</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        </ScrollView>

        <FaceVerificationModal
          visible={showFaceModal}
          onClose={() => setShowFaceModal(false)}
          onVerified={handleVerifiedFace}
          employeeName={profile?.full_name || 'Staff Member'}
          officeName={employee?.workplace?.name || 'Office Workplace'}
          isClockingIn={faceModalType === 'in'}
          enrolledFaceUrl={employee?.profile?.avatar_url || null}
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006a61" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header Frame ───────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={SUBEDGE_LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Attendance Hub</Text>
              <Text style={styles.usernameText}>Biometric Logs & Shifts</Text>
            </View>
          </View>
          {!isClockedIn && !isClockedOut ? (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => handleInitiateClock('in')}
              disabled={clockLoading}
            >
              <ScanFace size={16} color="#FFF" />
              <Text style={styles.headerActionBtnText}>Clock In</Text>
            </TouchableOpacity>
          ) : isClockedIn ? (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => handleInitiateClock('out')}
              disabled={clockLoading}
            >
              <LogOutIcon size={16} color="#FFF" />
              <Text style={styles.headerActionBtnText}>Clock Out</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerDonePill}>
              <CheckCircle2 size={15} color="#006a61" />
              <Text style={styles.headerDoneText}>Shift Done</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Hero Balance Card Frame (matching /mobile balanceCard) ─────────── */}
      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
        <HeroBalanceCard
          title="MONTHLY ATTENDANCE SUMMARY"
          primaryValue={`${attendanceRate}% On-Time`}
          badge={attendanceRate >= 90 ? 'EXCELLENT' : 'STANDARD'}
          badgeColor={attendanceRate >= 90 ? '#006a61' : '#F59E0B'}
          stats={[
            { label: 'Present Days', value: `${presentDays}/${totalDays}d`, color: '#006a61' },
            { label: 'Avg Shift', value: `${avgHours.toFixed(1)}h`, color: '#0369A1' },
            { label: 'Late Arrivals', value: `${lateDays}d`, color: '#D97706' },
            { label: 'Absences', value: `${absentDays}d`, color: '#DC2626' },
          ]}
        />
      </Animated.View>

      {/* ── Today's Live Clock-In / Clock-Out Hero Card ───────────────────── */}
      <Animated.View entering={FadeInDown.delay(120).duration(350).springify()}>
        <View style={[styles.heroCard, { backgroundColor: '#0b1c30' }]}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.liveDot, { backgroundColor: isClockedIn ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.heroTag}>TODAY'S SHIFT STATUS</Text>
              </View>
              <Text style={styles.heroTitle}>
                {isClockedIn
                  ? activeBreak
                    ? 'On Scheduled Break'
                    : 'Currently Working'
                  : isClockedOut
                  ? 'Shift Completed'
                  : 'Ready to Clock In'}
              </Text>
              <Text style={styles.heroSub}>
                {isClockedIn
                  ? `Clocked in at ${formatTime(todayAttendance!.clock_in!)} • Biometrics Verified`
                  : isClockedOut
                  ? `Clocked out at ${formatTime(todayAttendance!.clock_out!)} • ${Math.round((todayAttendance!.working_minutes || 0) / 60)}h worked`
                  : 'Capture face or device biometrics to record today\'s attendance'}
              </Text>
            </View>

            {/* Live Clock Timer */}
            {isClockedIn && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerLabel}>SHIFT DURATION</Text>
                <Text style={styles.timerValue}>{formatTimerDisplay(elapsedSeconds)}</Text>
              </View>
            )}
          </View>

          {clockError ? (
            <View style={styles.errorBanner}>
              <AlertTriangle size={15} color="#F87171" />
              <Text style={styles.errorBannerText}>{clockError}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.heroActionsRow}>
            {!isClockedIn && !isClockedOut && (
              <TouchableOpacity
                style={[styles.clockActionBtn, { backgroundColor: '#006a61' }]}
                onPress={() => handleInitiateClock('in')}
                disabled={clockLoading}
              >
                <ScanFace size={18} color="#FFF" />
                <Text style={styles.clockActionBtnText}>
                  {clockLoading ? 'Preparing...' : 'Face ID / Biometric Clock In'}
                </Text>
              </TouchableOpacity>
            )}

            {isClockedIn && (
              <>
                {!activeBreak ? (
                  <TouchableOpacity
                    style={[styles.breakBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                    onPress={() => handleBreak('start')}
                    disabled={clockLoading}
                  >
                    <Coffee size={16} color="#FFF" />
                    <Text style={styles.breakBtnText}>Take Break</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.breakBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleBreak('end')}
                    disabled={clockLoading}
                  >
                    <Play size={16} color="#FFF" />
                    <Text style={styles.breakBtnText}>Resume Shift</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.clockActionBtn, { backgroundColor: '#ba1a1a', flex: 1 }]}
                  onPress={() => handleInitiateClock('out')}
                  disabled={clockLoading}
                >
                  <LogOutIcon size={18} color="#FFF" />
                  <Text style={styles.clockActionBtnText}>
                    {clockLoading ? 'Verifying...' : 'Face ID Clock Out'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isClockedOut && (
              <View style={styles.completedPill}>
                <CheckCircle2 size={16} color="#34D399" />
                <Text style={{ color: '#34D399', fontWeight: '700', fontSize: 13 }}>
                  Today's Attendance Confirmed & Sealed
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* ── Daily Records Section ─────────────────────────────────────────── */}
      <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
        <View style={[styles.tableHeader, { borderBottomColor: '#f1f5f9' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{currentMonthLabel} Attendance Logs</Text>
          <View style={[styles.searchBox, { borderColor: '#e2e8f0' }]}>
            <Search size={14} color={colors.textSecondary} />
            <TextInput
              placeholder="Search date or status..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={handleSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyTable}>
            <CalendarX size={36} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No attendance records found</Text>
          </View>
        ) : (
          <View style={{ padding: 8 }}>
            {filtered.map((item, idx) => (
              <View
                key={item.id || idx}
                style={[
                  styles.tableRow,
                  idx !== filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
                ]}
              >
                <View style={styles.dateCol}>
                  <Text style={[styles.dateText, { color: colors.text }]}>{formatShortDate(item.date)}</Text>
                  <Text style={[styles.rawDate, { color: colors.textSecondary }]}>{item.date}</Text>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 12, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                      {item.clock_in ? `In: ${formatTime(item.clock_in)}` : 'No In Punch'}
                    </Text>
                    {item.clock_out && (
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                        • Out: {formatTime(item.clock_out)}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    Total: {formatMinutes(item.working_minutes || 0)}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Badge
                    label={item.status.toUpperCase()}
                    variant={
                      item.status === 'present'
                        ? 'successLight'
                        : item.status === 'late'
                        ? 'warningLight'
                        : 'dangerLight'
                    }
                  />
                  {item.face_verified && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <ShieldCheck size={11} color="#006a61" />
                      <Text style={{ fontSize: 10, color: '#006a61', fontWeight: '700' }}>Face Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Face ID & Biometrics Verification Modal ──────────────────────── */}
      <FaceVerificationModal
        visible={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        onVerified={handleVerifiedFace}
        employeeName={profile?.full_name || 'Staff Member'}
        officeName={employee?.workplace?.name || 'Office Workplace'}
        isClockingIn={faceModalType === 'in'}
        enrolledFaceUrl={employee?.profile?.avatar_url || null}
        profileId={profile?.id}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 60 },
  contentDesktop: { padding: 32, maxWidth: 1300, alignSelf: 'center', width: '100%', gap: 24 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  usernameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerActionBtn: {
    backgroundColor: '#006a61',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 106, 97, 0.25)' },
      default: {
        shadowColor: '#006a61',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  headerActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerDonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#EDF8F6',
  },
  headerDoneText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006a61',
  },

  heroCard: {
    padding: 22,
    borderRadius: 20,
    gap: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  heroTag: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, maxWidth: 600 },
  timerBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  timerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  timerValue: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 10,
    borderRadius: 8,
  },
  errorBannerText: { color: '#FCA5A5', fontSize: 12, flex: 1 },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  clockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  clockActionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  breakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  breakBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  tableCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    gap: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 200,
  },
  searchInput: { fontSize: 13, padding: 0, flex: 1 },
  emptyTable: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  dateCol: { minWidth: 110 },
  dateText: { fontSize: 14, fontWeight: '700' },
  rawDate: { fontSize: 11, marginTop: 1 },
});

// ─── MOBILE ATTENDANCE STYLES ────────────────────────────────────────────────
const mAttStyles = StyleSheet.create({
  heroGradient: {
    backgroundColor: '#004D47',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #006a61 0%, #004D47 50%, #003D38 100%)',
        boxShadow: '0 8px 32px rgba(0, 77, 71, 0.3)',
      },
      default: {
        shadowColor: '#004D47',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTag: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timerPillText: {
    color: '#6EE7B7',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  timeCol: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timeDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  punchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shiftCompletedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(110, 231, 183, 0.18)',
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
  },

  // Stat Row
  statRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: -10,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  statChipVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  statChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },

  // Search & Filter
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
    padding: 0,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#006a61',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  // History Cards
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  cardLeft: {
    flex: 1,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardDurationText: {
    fontSize: 12,
    color: '#006a61',
    fontWeight: '700',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  faceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDF8F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  faceTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006a61',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
});
