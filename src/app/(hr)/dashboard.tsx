import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, RefreshControl } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { HR_NAV } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { LoadingState } from '@/components/ui/States';
import { getEmployeeCount } from '@/lib/services/employee';
import { getAttendanceStats } from '@/lib/services/attendance';
import { getPendingLeaveRequests, processLeaveRequest } from '@/lib/services/leave';
import { formatDate } from '@/utils/format';
import type { LeaveRequest } from '@/types';

export default function HRDashboard() {
  const colors = useTheme();
  const { profile, role } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // If Admin is logged in, redirect to Admin Dashboard
  if (role === 'admin' || profile?.role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [empCount, setEmpCount] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, late: 0, halfDay: 0, total: 0 });
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [count, stats, leaves] = await Promise.all([
        getEmployeeCount(),
        getAttendanceStats(today),
        getPendingLeaveRequests(),
      ]);
      setEmpCount(count);
      setAttendanceStats(stats);
      setPendingLeaves(leaves);
    } catch (err) {
      console.error('HR dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleLeaveAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await processLeaveRequest(id, action);
      await loadData();
    } catch (err) {
      console.error(err);
    }
    setProcessing(null);
  };

  if (loading) return <LoadingState />;

  const content = (
    <ScrollView
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>HR Dashboard</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 15 }}>Welcome back, {profile?.full_name}</Text>

      {/* Stats */}
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        <StatCard label="Total Employees" value={empCount} />
        <StatCard label="Present Today" value={attendanceStats.present} color="#16A34A" />
        <StatCard label="Late Today" value={attendanceStats.late} color="#D97706" />
        <StatCard label="On Leave" value={pendingLeaves.length} color="#3B82F6" />
      </View>

      <View style={isDesktop ? styles.dashboardGrid : styles.mobileStack}>
        
        {/* Main Column */}
        <View style={isDesktop ? styles.mainCol : styles.mobileStack}>
          {/* Pending Leave Requests */}
          <Card style={{ flex: 1 }}>
            <View style={styles.cardHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Leave Requests</Text>
              <Badge label={pendingLeaves.length.toString()} variant={pendingLeaves.length > 0 ? 'warning' : 'neutral'} />
            </View>
            
            {pendingLeaves.length === 0 ? (
              <Text style={{ color: colors.textSecondary, paddingVertical: 12 }}>No pending requests to review.</Text>
            ) : (
              pendingLeaves.slice(0, 5).map(req => (
                <View key={req.id} style={[styles.leaveRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={[{ color: colors.text, fontWeight: '600', fontSize: 15 }]}>
                      {(req.employee as any)?.profile?.full_name || 'Employee'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                      {req.leave_type?.name} · {formatDate(req.start_date)} — {formatDate(req.end_date)}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                      {req.days} Day{req.days > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button
                      title="✓ Approve"
                      onPress={() => handleLeaveAction(req.id, 'approve')}
                      size="sm"
                      loading={processing === req.id}
                      style={{ paddingHorizontal: 16 }}
                    />
                    <Button
                      title="✗"
                      onPress={() => handleLeaveAction(req.id, 'reject')}
                      variant="danger"
                      size="sm"
                      loading={processing === req.id}
                    />
                  </View>
                </View>
              ))
            )}
            {pendingLeaves.length > 0 && (
              <Button
                title="View All Requests"
                onPress={() => router.push('/(hr)/leave' as never)}
                variant="ghost"
                size="sm"
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </View>

        {/* Side Column */}
        <View style={isDesktop ? styles.sideCol : styles.mobileStack}>
          {/* Quick Actions */}
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.appGrid}>
              {HR_NAV.slice(1).map(item => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.href}
                    onPress={() => router.push(item.href as never)}
                    style={[styles.appBtn, { backgroundColor: colors.backgroundElement }]}
                  >
                    {Icon && <Icon size={24} color={colors.primary} />}
                    <Text style={[styles.appBtnText, { color: colors.text }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

      </View>
    </ScrollView>
  );

  return (
    <SidebarLayout items={HR_NAV}>
      {content}
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  contentDesktop: { maxWidth: 1100, alignSelf: 'center', width: '100%', padding: 32 },
  pageTitle: { fontSize: 28, fontWeight: '700' },
  
  statsGrid: { gap: 16, marginBottom: 8 },
  statsGridDesktop: { flexDirection: 'row' },
  
  // Grid System
  dashboardGrid: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  mobileStack: { gap: 16 },
  mainCol: { flex: 2 },
  sideCol: { flex: 1 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  
  leaveRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  
  // App Grid
  appGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  appBtn: { 
    width: '46%', 
    aspectRatio: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  appBtnText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
