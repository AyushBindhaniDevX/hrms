import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useWindowDimensions, RefreshControl, Platform, Image, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState } from '@/components/ui/States';
import { HeroBalanceCard } from '@/components/ui/HeroBalanceCard';
import { ActivityCard } from '@/components/ui/ActivityCard';
import { getLeaveBalances, getLeaveRequests, cancelLeave } from '@/lib/services/leave';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { formatDate } from '@/utils/format';
import type { LeaveBalance, LeaveRequest } from '@/types';
import {
  Plane, BriefcaseMedical, Coffee, Calendar, Plus,
  XCircle, ChevronRight, Clock,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DEFAULT_SUBEDGE_LOGO as SUBEDGE_LOGO } from '@/components/ui/SubedgeBrand';

const stripEmoji = (s: string) =>
  s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '').trim();

function getLeaveIcon(name: string, size = 20) {
  const n = name.toLowerCase();
  const color = '#006a61';
  if (n.includes('annual') || n.includes('vacation') || n.includes('earned')) return <Plane size={size} color={color} />;
  if (n.includes('sick') || n.includes('medical')) return <BriefcaseMedical size={size} color={color} />;
  if (n.includes('casual') || n.includes('personal') || n.includes('comp')) return <Coffee size={size} color={color} />;
  return <Calendar size={size} color={color} />;
}

function statusVariant(s: string): 'warningLight' | 'successLight' | 'dangerLight' | 'neutral' {
  return ({ pending: 'warningLight', approved: 'successLight', rejected: 'dangerLight', cancelled: 'neutral' } as any)[s] || 'neutral';
}

export default function LeaveScreen() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 20);

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadData = useCallback(async () => {
    if (!profile) return;
    const emp = await getEmployeeByProfileId(profile.id);
    if (emp) {
      const [b, r] = await Promise.all([getLeaveBalances(emp.id), getLeaveRequests(emp.id)]);
      setBalances(b);
      setRequests(r);
    }
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try { await cancelLeave(cancelTarget); await loadData(); }
    finally { setCancelling(false); setCancelTarget(null); }
  };

  if (loading) return <LoadingState />;

  const totalRemaining = balances.reduce((sum, b) => sum + (b.remaining_days || 0), 0);
  const totalAllocated = balances.reduce((sum, b) => sum + (b.allocated_days || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + (b.used_days || 0), 0);

  const annualB = balances.find(b => (b.leave_type?.name || '').toLowerCase().includes('annual'));
  const sickB = balances.find(b => (b.leave_type?.name || '').toLowerCase().includes('sick'));
  const casualB = balances.find(b => (b.leave_type?.name || '').toLowerCase().includes('casual'));

  const displayedRequests = requests.filter((r) => {
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
          {/* Top bounce background underlay */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350, backgroundColor: '#004D47' }} />

          <ConfirmDialog
            visible={!!cancelTarget}
            title="Cancel Leave Request"
            message="Are you sure you want to cancel this leave request? This action cannot be undone."
            confirmLabel="Yes, Cancel"
            variant="danger"
            onConfirm={handleCancel}
            onCancel={() => setCancelTarget(null)}
            loading={cancelling}
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" colors={['#004D47']} />}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Mobile Gradient Header ── */}
            <View style={[mLeaveStyles.heroGradient, { paddingTop: topPadding + 10 }]}>
              <View style={mLeaveStyles.heroTop}>
                <View>
                  <Text style={mLeaveStyles.heroTag}>TOTAL AVAILABLE LEAVE</Text>
                  <Text style={mLeaveStyles.heroMainVal}>{totalRemaining} <Text style={{ fontSize: 16, fontWeight: '600' }}>Days</Text></Text>
                </View>
                <TouchableOpacity
                  style={mLeaveStyles.applyBtn}
                  onPress={() => router.push('/(employee)/leave/apply' as never)}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#006a61" />
                  <Text style={mLeaveStyles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>

              {/* Sub stats row */}
              <View style={mLeaveStyles.subStatsRow}>
                <View style={mLeaveStyles.subStatCol}>
                  <Text style={mLeaveStyles.subStatLabel}>Allocated</Text>
                  <Text style={mLeaveStyles.subStatVal}>{totalAllocated}d</Text>
                </View>
                <View style={mLeaveStyles.subStatDivider} />
                <View style={mLeaveStyles.subStatCol}>
                  <Text style={mLeaveStyles.subStatLabel}>Used</Text>
                  <Text style={[mLeaveStyles.subStatVal, { color: '#FCA5A5' }]}>{totalUsed}d</Text>
                </View>
                <View style={mLeaveStyles.subStatDivider} />
                <View style={mLeaveStyles.subStatCol}>
                  <Text style={mLeaveStyles.subStatLabel}>Remaining</Text>
                  <Text style={[mLeaveStyles.subStatVal, { color: '#6EE7B7' }]}>{totalRemaining}d</Text>
                </View>
              </View>
            </View>

            {/* ── Quota Breakdown Cards ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={mLeaveStyles.sectionTitle}>Quota Breakdown</Text>
            {balances.length === 0 ? (
              <View style={mLeaveStyles.emptyCard}>
                <Calendar size={28} color="#94A3B8" />
                <Text style={{ color: '#0F172A', marginTop: 8, fontWeight: '700' }}>No leave quotas assigned</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Contact HR to assign your leave policies.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                {balances.map((b) => {
                  const pct = b.allocated_days > 0 ? b.remaining_days / b.allocated_days : 0;
                  const barColor = pct > 0.5 ? '#006a61' : pct > 0.2 ? '#D97706' : '#DC2626';
                  return (
                    <View key={b.id} style={mLeaveStyles.quotaCard}>
                      <View style={mLeaveStyles.quotaIconWrap}>
                        {getLeaveIcon(b.leave_type?.name || '', 18)}
                      </View>
                      <Text style={mLeaveStyles.quotaName} numberOfLines={1}>
                        {stripEmoji(b.leave_type?.name || 'Leave')}
                      </Text>
                      <Text style={mLeaveStyles.quotaDays}>
                        {b.remaining_days}
                        <Text style={mLeaveStyles.quotaTotal}> / {b.allocated_days}d</Text>
                      </Text>
                      <View style={mLeaveStyles.progressBg}>
                        <View style={[mLeaveStyles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ── Leave Applications Section ── */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={mLeaveStyles.sectionTitle}>Applications</Text>
              <TouchableOpacity onPress={() => router.push('/(employee)/leave/apply' as never)}>
                <Text style={{ color: '#006a61', fontSize: 13, fontWeight: '700' }}>+ New Request</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setStatusFilter(tab)}
                  style={[mLeaveStyles.filterPill, statusFilter === tab && mLeaveStyles.filterPillActive]}
                >
                  <Text style={[mLeaveStyles.filterPillText, statusFilter === tab && mLeaveStyles.filterPillTextActive]}>
                    {tab.toUpperCase()} {tab === 'all' ? `(${requests.length})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Request Cards */}
            {displayedRequests.length === 0 ? (
              <View style={mLeaveStyles.emptyCard}>
                <Calendar size={28} color="#94A3B8" />
                <Text style={{ color: '#0F172A', fontWeight: '700', marginTop: 8 }}>No leave requests</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Tap "+ New Request" to apply.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {displayedRequests.map((req) => (
                  <View key={req.id} style={mLeaveStyles.requestCard}>
                    <View style={mLeaveStyles.reqIconWrap}>
                      {getLeaveIcon(req.leave_type?.name || '', 20)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={mLeaveStyles.reqTitle}>{stripEmoji(req.leave_type?.name || 'Leave')}</Text>
                      <Text style={mLeaveStyles.reqDates}>
                        {formatDate(req.start_date)} – {formatDate(req.end_date)}
                      </Text>
                      <Text style={mLeaveStyles.reqDuration}>{req.days} {req.days === 1 ? 'day' : 'days'}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Badge label={req.status} variant={statusVariant(req.status)} />
                      {req.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => setCancelTarget(req.id)}
                          style={mLeaveStyles.cancelBtn}
                        >
                          <XCircle size={15} color="#DC2626" />
                          <Text style={mLeaveStyles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#F8FAFC' }]}
      contentContainerStyle={[styles.content, styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006a61" />}
      showsVerticalScrollIndicator={false}
    >
      <ConfirmDialog
        visible={!!cancelTarget}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request? This action cannot be undone."
        confirmLabel="Yes, Cancel"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={cancelling}
      />

      {/* Header Frame */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={SUBEDGE_LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Leave Hub</Text>
              <Text style={styles.usernameText}>Time Off & Balances</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(employee)/leave/apply' as never)}>
            <Plus size={16} color="#FFF" />
            <Text style={styles.addButtonText}>Apply Leave</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Hero Balance Frame (matching /mobile balanceCard) */}
      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()} style={styles.balanceContainer}>
        <HeroBalanceCard
          title="TOTAL AVAILABLE LEAVE"
          primaryValue={`${totalRemaining} Days`}
          badge={totalRemaining > 0 ? 'ALLOWANCE ACTIVE' : 'EXHAUSTED'}
          badgeColor={totalRemaining > 0 ? '#006a61' : '#DC2626'}
          stats={[
            { label: 'Annual', value: `${annualB?.remaining_days ?? 0}d`, color: '#006a61' },
            { label: 'Sick / Med', value: `${sickB?.remaining_days ?? 0}d`, color: '#DC2626' },
            { label: 'Casual', value: `${casualB?.remaining_days ?? 0}d`, color: '#4F46E5' },
            { label: 'Used YTD', value: `${totalUsed}d`, color: '#64748B' },
          ]}
        />
      </Animated.View>

      {/* Breakdown Balance Cards */}
      <Animated.View entering={FadeInDown.delay(120).duration(300).springify()} style={{ paddingHorizontal: 20 }}>
        <Text style={styles.sectionTitle}>Quota Breakdown</Text>
        {balances.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={28} color="#94A3B8" />
            <Text style={{ color: '#0F172A', marginTop: 10, fontWeight: '700' }}>No leave quotas assigned</Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Contact your HR manager to set up leave policies.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
            {balances.map((b) => {
              const pct = b.allocated_days > 0 ? b.remaining_days / b.allocated_days : 0;
              const barColor = pct > 0.5 ? '#006a61' : pct > 0.2 ? '#D97706' : '#DC2626';
              const bgColor = pct > 0.5 ? '#EDF8F6' : pct > 0.2 ? '#FEF3C7' : '#FFF5F5';
              return (
                <View key={b.id} style={styles.balanceCard}>
                  <View style={[styles.balanceIconWrap, { backgroundColor: bgColor }]}>
                    {getLeaveIcon(b.leave_type?.name || '', 20)}
                  </View>
                  <Text style={styles.balanceName} numberOfLines={1}>
                    {stripEmoji(b.leave_type?.name || 'Leave')}
                  </Text>
                  <Text style={styles.balanceDays}>
                    {b.remaining_days}
                    <Text style={styles.balanceOf}> / {b.allocated_days}d</Text>
                  </Text>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
                  </View>
                  <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>
                    {b.used_days} used · {b.remaining_days} remaining
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* Requests Stream (ActivityCard frame) */}
      <Animated.View entering={FadeInDown.delay(180).duration(300).springify()} style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Leave Applications</Text>
          <TouchableOpacity onPress={() => router.push('/(employee)/leave/apply' as never)}>
            <Text style={{ color: '#006a61', fontSize: 13, fontWeight: '700' }}>+ New Application</Text>
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Calendar size={28} color="#94A3B8" />
            <Text style={{ color: '#0F172A', fontWeight: '700', marginTop: 10 }}>No leave applications yet</Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Tap "+ Apply Leave" to submit your first time off request.
            </Text>
          </View>
        ) : (
          requests.map((req) => (
            <ActivityCard
              key={req.id}
              title={stripEmoji(req.leave_type?.name || 'Leave')}
              subtitle={`${formatDate(req.start_date)} – ${formatDate(req.end_date)}  (${req.days}d)`}
              icon={getLeaveIcon(req.leave_type?.name || '', 20)}
              iconBg="#EDF8F6"
              rightBadge={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Badge label={req.status} variant={statusVariant(req.status)} />
                  {req.status === 'pending' && (
                    <TouchableOpacity onPress={() => setCancelTarget(req.id)} style={{ padding: 2 }}>
                      <XCircle size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          ))
        )}
      </Animated.View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 64 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 40, paddingTop: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
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
  addButton: {
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
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  balanceContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyCard: {
    padding: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  balanceCard: {
    width: 170,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.03)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  balanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  balanceDays: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: '#0F172A' },
  balanceOf: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
});

// ─── MOBILE LEAVE STYLES ────────────────────────────────────────────────────
const mLeaveStyles = StyleSheet.create({
  heroGradient: {
    backgroundColor: '#004D47',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 22,
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
  heroMainVal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  applyBtnText: {
    color: '#006a61',
    fontWeight: '800',
    fontSize: 13,
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  subStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  subStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 10,
  },

  // Quota breakdown horizontal cards
  quotaCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
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
  quotaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quotaName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  quotaDays: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  quotaTotal: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  // Filter Pills
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

  // Request Cards
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
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
  reqIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDF8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  reqDates: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  reqDuration: {
    fontSize: 11,
    color: '#006a61',
    fontWeight: '700',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
