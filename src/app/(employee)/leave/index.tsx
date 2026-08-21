import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useWindowDimensions, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState } from '@/components/ui/States';
import { getLeaveBalances, getLeaveRequests, cancelLeave } from '@/lib/services/leave';
import { getEmployeeByProfileId } from '@/lib/services/employee';
import { formatDate } from '@/utils/format';
import type { LeaveBalance, LeaveRequest } from '@/types';
import {
  Plane, BriefcaseMedical, Coffee, Calendar, Plus,
  XCircle, ChevronRight, Clock,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const stripEmoji = (s: string) =>
  s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '').trim();

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

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

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try { await cancelLeave(cancelTarget); await loadData(); }
    finally { setCancelling(false); setCancelTarget(null); }
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <View style={[styles.pageHero, { backgroundColor: '#0b1c30' }]}>
          <View>
            <Text style={styles.heroTitle}>Leave Management</Text>
            <Text style={styles.heroSub}>Track your time off and submit requests.</Text>
          </View>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => router.push('/(employee)/leave/apply' as never)}
          >
            <Plus size={16} color="#FFF" />
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Balance Cards */}
      <Animated.View entering={FadeInDown.delay(80).duration(300).springify()}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Leave Balances</Text>
        {balances.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <Calendar size={28} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 10, fontWeight: '600' }}>No leave quotas assigned</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Contact your HR manager to set up leave quotas.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {balances.map((b) => {
              const pct = b.allocated_days > 0 ? b.remaining_days / b.allocated_days : 0;
              const barColor = pct > 0.5 ? '#006a61' : pct > 0.2 ? '#b45309' : '#ba1a1a';
              const bgColor = pct > 0.5 ? '#edf8f6' : pct > 0.2 ? '#fef3c7' : '#fff5f5';
              return (
                <View key={b.id} style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
                  <View style={[styles.balanceIconWrap, { backgroundColor: bgColor }]}>
                    {getLeaveIcon(b.leave_type?.name || '', 20)}
                  </View>
                  <Text style={[styles.balanceName, { color: colors.text }]} numberOfLines={1}>
                    {stripEmoji(b.leave_type?.name || 'Leave')}
                  </Text>
                  <Text style={[styles.balanceDays, { color: colors.text }]}>
                    {b.remaining_days}
                    <Text style={[styles.balanceOf, { color: colors.textSecondary }]}> / {b.allocated_days}d</Text>
                  </Text>
                  <View style={[styles.progressBg]}>
                    <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                    {b.used_days} used · {b.remaining_days} remaining
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {/* Requests */}
      <Animated.View entering={FadeInDown.delay(160).duration(300).springify()}>
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Requests</Text>
          <TouchableOpacity onPress={() => router.push('/(employee)/leave/apply' as never)}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ New</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.requestsCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          {requests.length === 0 ? (
            <View style={styles.emptyInCard}>
              <Calendar size={28} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600', marginTop: 10 }}>No leave requests yet</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                Tap "+ New" above to submit your first leave request.
              </Text>
            </View>
          ) : (
            requests.map((req, i) => (
              <View
                key={req.id}
                style={[
                  styles.reqRow,
                  i !== requests.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
                ]}
              >
                {/* Icon */}
                <View style={[styles.reqIcon, { backgroundColor: '#f4f6fa' }]}>
                  {getLeaveIcon(req.leave_type?.name || '', 18)}
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                    {stripEmoji(req.leave_type?.name || 'Leave')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={11} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {formatDate(req.start_date)} – {formatDate(req.end_date)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                    {req.days} day{req.days !== 1 ? 's' : ''} · Applied {formatDate(req.created_at)}
                  </Text>
                </View>

                {/* Status + Cancel */}
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Badge label={req.status} variant={statusVariant(req.status)} />
                  {req.status === 'pending' && (
                    <TouchableOpacity onPress={() => setCancelTarget(req.id)}>
                      <XCircle size={16} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 24, paddingBottom: 64 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 40, paddingTop: 40, gap: 32 },

  pageHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#006a61',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14, letterSpacing: -0.2, paddingHorizontal: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },

  emptyCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },

  // Balance card — horizontal scroll
  balanceCard: {
    width: 180,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  balanceIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  balanceName: { fontSize: 13, fontWeight: '700' },
  balanceDays: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  balanceOf: { fontSize: 13, fontWeight: '500' },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },

  // Requests
  requestsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  reqIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyInCard: { padding: 48, alignItems: 'center' },
});
