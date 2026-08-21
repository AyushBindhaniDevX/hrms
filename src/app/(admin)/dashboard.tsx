import { ADMIN_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getEmployeeCount } from '@/lib/services/employee';
import { getAttendanceStats } from '@/lib/services/attendance';
import { getOrgUsers, getOrganization } from '@/lib/services/organization';
import { getAuditLogs } from '@/lib/services/audit';
import { OrgSetupWizard } from '@/components/admin/OrgSetupWizard';
import { formatDate, formatDateTime, getGreeting } from '@/utils/format';
import type { Organization, AuditLog, Profile } from '@/types';
import {
  Users,
  Shield,
  ShieldCheck,
  Calendar,
  Settings,
  Key,
  UserPlus,
  ArrowRight,
  Activity,
  CheckCircle2,
  MapPin,
  CreditCard,
  Umbrella,
  Server,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminDashboard() {
  const colors = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [empCount, setEmpCount] = useState(0);
  const [users, setUsers] = useState<Profile[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, late: 0, halfDay: 0, total: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const [count, attStats, orgUsers, orgData, logs] = await Promise.all([
        getEmployeeCount(),
        getAttendanceStats(today),
        getOrgUsers(),
        getOrganization(profile.organization_id || '00000000-0000-0000-0000-000000000001'),
        getAuditLogs(5),
      ]);
      setEmpCount(count);
      setAttendanceStats(attStats);
      setUsers(orgUsers);
      setOrganization(orgData);
      setRecentLogs(logs);

      if (orgData && (!orgData.name || orgData.name.includes('Default') || orgData.name === 'New Organization')) {
        setShowWizard(true);
      }
    } catch (err) {
      console.error('Admin dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingState />;

  const hrCount = users.filter((u) => u.role === 'hr').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.is_active).length;

  const kpis = [
    {
      label: 'Total Staff',
      value: empCount,
      sub: `${activeCount} active user accounts`,
      icon: <Users size={20} color="#006a61" />,
      bg: '#edf8f6',
      border: '#c4ece7',
    },
    {
      label: 'Administrators',
      value: adminCount,
      sub: `${hrCount} HR Managers`,
      icon: <ShieldCheck size={20} color="#4f46e5" />,
      bg: '#eeebff',
      border: '#d5d0f5',
    },
    {
      label: 'Present Today',
      value: attendanceStats.present,
      sub: `${attendanceStats.late} late arrivals`,
      icon: <Calendar size={20} color="#0369a1" />,
      bg: '#e0f2fe',
      border: '#b9e3fc',
    },
    {
      label: 'System Status',
      value: '100% OK',
      sub: 'All services online',
      icon: <Server size={20} color="#16a34a" />,
      bg: '#f0fdf4',
      border: '#bbf7d0',
    },
  ];

  const quickActions = [
    {
      label: 'Add New User',
      sub: 'Create login & role',
      href: '/(admin)/users',
      icon: UserPlus,
      color: '#006a61',
      bg: '#edf8f6',
    },
    {
      label: 'User Management',
      sub: `${users.length} registered accounts`,
      href: '/(admin)/users',
      icon: Key,
      color: '#4f46e5',
      bg: '#eeebff',
    },
    {
      label: 'Workplace Locations',
      sub: 'Geofences & office radius',
      href: '/(hr)/locations',
      icon: MapPin,
      color: '#0369a1',
      bg: '#e0f2fe',
    },
    {
      label: 'Organization Settings',
      sub: 'Company name & hours',
      href: '/(admin)/settings',
      icon: Settings,
      color: '#b45309',
      bg: '#fef3c7',
    },
  ];

  const actionColor = (action: string): 'successLight' | 'warningLight' | 'dangerLight' | 'neutral' => {
    if (action.includes('created') || action.includes('approve') || action.includes('activated')) return 'successLight';
    if (action.includes('deactivat') || action.includes('reject') || action.includes('delete')) return 'dangerLight';
    if (action.includes('role') || action.includes('update') || action.includes('change')) return 'warningLight';
    return 'neutral';
  };

  return (
    <>
      <SidebarLayout items={ADMIN_NAV}>
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <Animated.View entering={FadeInDown.duration(350).springify()}>
            <View style={[styles.heroBar, { backgroundColor: '#0b1c30' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroGreeting}>{getGreeting().toUpperCase()}, {profile?.full_name?.split(' ')[0] || 'ADMIN'}</Text>
                <Text style={styles.heroTitle}>{organization?.name || 'Oasis HRMS'}</Text>
                <Text style={styles.heroSub}>
                  System Administration Console · {formatDate(new Date())}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(admin)/users' as never)}
                style={styles.heroAddBtn}
                activeOpacity={0.85}
              >
                <UserPlus size={16} color="#FFF" />
                <Text style={styles.heroAddBtnText}>Add User</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* KPI Grid */}
          <Animated.View entering={FadeInDown.delay(80).duration(350).springify()}>
            <View style={isDesktop ? styles.kpiRowDesktop : styles.kpiRowMobile}>
              {kpis.map((k, i) => (
                <View key={i} style={[styles.kpiCard, { backgroundColor: k.bg, borderColor: k.border }]}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
                    {k.icon}
                  </View>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiValue} numberOfLines={1}>{k.value}</Text>
                  <Text style={styles.kpiSub} numberOfLines={1}>{k.sub}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* 2-Column Grid */}
          <View style={isDesktop ? styles.gridDesktop : styles.gridMobile}>
            {/* Left Column: Quick Actions & Navigation */}
            <View style={isDesktop ? styles.colMain : styles.fullCol}>
              <Animated.View entering={FadeInDown.delay(160).duration(350).springify()}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Admin Shortcuts</Text>
                <View style={styles.quickGrid}>
                  {quickActions.map((qa) => {
                    const Icon = qa.icon;
                    return (
                      <TouchableOpacity
                        key={qa.label}
                        onPress={() => router.push(qa.href as never)}
                        activeOpacity={0.75}
                        style={[styles.quickCard, { backgroundColor: qa.bg }]}
                      >
                        <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                          <Icon size={22} color={qa.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.quickLabel, { color: colors.text }]}>{qa.label}</Text>
                          <Text style={[styles.quickSub, { color: colors.textSecondary }]}>{qa.sub}</Text>
                        </View>
                        <ArrowRight size={16} color={qa.color} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>

              {/* System Overview Card */}
              <Animated.View entering={FadeInDown.delay(240).duration(350).springify()}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.cardIconWrap, { backgroundColor: '#edf8f6' }]}>
                        <Server size={18} color="#006a61" />
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>System Infrastructure</Text>
                    </View>
                    <Badge label="ONLINE" variant="successLight" />
                  </View>
                  <View style={styles.infraGrid}>
                    <View style={styles.infraItem}>
                      <Text style={styles.infraLabel}>Database</Text>
                      <Text style={[styles.infraVal, { color: '#006a61' }]}>Cloud Firestore (Connected)</Text>
                    </View>
                    <View style={styles.infraItem}>
                      <Text style={styles.infraLabel}>Auth Service</Text>
                      <Text style={[styles.infraVal, { color: '#006a61' }]}>Firebase Authentication</Text>
                    </View>
                    <View style={styles.infraItem}>
                      <Text style={styles.infraLabel}>Org ID</Text>
                      <Text style={[styles.infraVal, { color: colors.textSecondary }]} numberOfLines={1}>
                        {profile?.organization_id || '00000000-0000-0000-0000-000000000001'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Right Column: Recent Audit Activity */}
            <View style={isDesktop ? styles.colSide : styles.fullCol}>
              <Animated.View entering={FadeInDown.delay(320).duration(350).springify()}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.cardIconWrap, { backgroundColor: '#fef3c7' }]}>
                        <Activity size={18} color="#b45309" />
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Audit Events</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(admin)/audit-logs' as never)}>
                      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>View All</Text>
                    </TouchableOpacity>
                  </View>

                  {recentLogs.length === 0 ? (
                    <View style={{ padding: 32, alignItems: 'center' }}>
                      <Shield size={32} color={colors.textSecondary} />
                      <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
                        No audit events recorded yet.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                      {recentLogs.map((log, idx) => (
                        <View
                          key={log.id}
                          style={[
                            styles.logRow,
                            idx !== recentLogs.length - 1 && {
                              borderBottomWidth: 1,
                              borderBottomColor: '#f1f5f9',
                            },
                          ]}
                        >
                          <View style={{ flex: 1, gap: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Badge label={log.action.replace('_', ' ')} variant={actionColor(log.action)} />
                              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                                {log.entity_type}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                              {formatDateTime(log.created_at)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.cardFooter, { borderTopColor: '#f1f5f9' }]}
                    onPress={() => router.push('/(admin)/audit-logs' as never)}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                      Complete Audit Trail
                    </Text>
                    <ArrowRight size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </SidebarLayout>

      <OrgSetupWizard
        visible={showWizard}
        organization={organization}
        onComplete={() => {
          setShowWizard(false);
          load();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 24, paddingBottom: 60 },
  contentDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 36, paddingTop: 36, gap: 28 },

  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroGreeting: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },
  heroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#006a61',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroAddBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

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
  kpiIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#0b1c30', letterSpacing: -0.5 },
  kpiSub: { fontSize: 11, color: '#64748b' },

  gridDesktop: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  gridMobile: { gap: 20, paddingHorizontal: 16 },
  colMain: { flex: 3, gap: 24 },
  colSide: { flex: 2, gap: 20 },
  fullCol: { gap: 20 },

  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.2 },

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

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 14,
  },
  cardIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },

  infraGrid: { padding: 20, paddingTop: 4, gap: 12 },
  infraItem: { gap: 2 },
  infraLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  infraVal: { fontSize: 13, fontWeight: '600' },

  logRow: { paddingVertical: 12 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
