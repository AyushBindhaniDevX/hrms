import { HR_NAV } from '@/constants/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { getAllLeaveRequests, processLeaveRequest } from '@/lib/services/leave';
import { formatDate } from '@/utils/format';
import type { LeaveRequest } from '@/types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Kanban,
  List,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Building2,
  IdCard,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HRLeaveWorkflowScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // View Mode: 'board' (Kanban / Workflow) or 'list'
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');

  // Drag and Drop state (Web)
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAllLeaveRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading HR leave requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      await processLeaveRequest(id, action);
      await load();
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Drag and Drop handlers for Web
  const handleDragStart = (e: any, id: string) => {
    if (e && e.dataTransfer) {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    }
    setDraggedId(id);
  };

  const handleDragOver = (e: any, columnStatus: string) => {
    if (Platform.OS === 'web' && e) {
      if (e.preventDefault) e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      if (dropTargetColumn !== columnStatus) {
        setDropTargetColumn(columnStatus);
      }
    }
  };

  const handleDragLeave = (e: any) => {
    if (Platform.OS === 'web' && e && e.preventDefault) e.preventDefault();
    setDropTargetColumn(null);
  };

  const handleDrop = async (e: any, targetStatus: 'approved' | 'rejected') => {
    if (Platform.OS === 'web' && e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const id = (e?.dataTransfer ? e.dataTransfer.getData('text/plain') : null) || draggedId;
    if (id) {
      const req = requests.find((r) => r.id === id);
      if (req && req.status === 'pending') {
        const action = targetStatus === 'approved' ? 'approve' : 'reject';
        await handleAction(id, action);
      }
    }
    setDraggedId(null);
    setDropTargetColumn(null);
  };

  const stripEmoji = (s: string) =>
    (s || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '').trim();

  // Filter requests by name, code, id, department, designation, leave type, reason
  const filtered = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const emp = r.employee as any;
      const empName = (emp?.profile?.full_name || '').toLowerCase();
      const empCode = (emp?.employee_code || emp?.id || '').toLowerCase();
      const deptName = (emp?.department?.name || '').toLowerCase();
      const desig = (emp?.designation || '').toLowerCase();
      const typeName = (r.leave_type?.name || '').toLowerCase();
      const reason = (r.reason || '').toLowerCase();

      return (
        empName.includes(q) ||
        empCode.includes(q) ||
        deptName.includes(q) ||
        desig.includes(q) ||
        typeName.includes(q) ||
        reason.includes(q)
      );
    });
  }, [requests, search]);

  const pendingList = filtered.filter((r) => r.status === 'pending');
  const approvedList = filtered.filter((r) => r.status === 'approved');
  const rejectedList = filtered.filter((r) => r.status === 'rejected');

  const statusVariant = (s: string): 'warningLight' | 'successLight' | 'dangerLight' | 'neutral' => {
    const map: Record<string, 'warningLight' | 'successLight' | 'dangerLight' | 'neutral'> = {
      pending: 'warningLight',
      approved: 'successLight',
      rejected: 'dangerLight',
      cancelled: 'neutral',
    };
    return map[s] || 'neutral';
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          <View style={[styles.heroBar, { backgroundColor: '#0b1c30' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroSubHeader}>DECISION PIPELINE & APPROVALS</Text>
              <Text style={styles.heroTitle}>Leave Request Workflow</Text>
              <Text style={styles.heroSub}>
                {pendingList.length} application{pendingList.length !== 1 ? 's' : ''} awaiting review
              </Text>
            </View>

            {/* View Mode Toggle */}
            <View style={styles.viewToggleWrap}>
              <TouchableOpacity
                onPress={() => setViewMode('board')}
                style={[
                  styles.toggleBtn,
                  viewMode === 'board' && { backgroundColor: '#006a61' },
                ]}
              >
                <Kanban size={15} color="#FFF" />
                <Text style={styles.toggleText}>Pipeline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[
                  styles.toggleBtn,
                  viewMode === 'list' && { backgroundColor: '#006a61' },
                ]}
              >
                <List size={15} color="#FFF" />
                <Text style={styles.toggleText}>List</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Search & Statistics Bar */}
        <View style={[styles.controlsBar, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
          <View style={[styles.searchBox, { borderColor: '#e2e8f0' }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              placeholder="Search by employee name, ID, department, leave type..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.countsRow}>
            <View style={[styles.countBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <Text style={[styles.countVal, { color: '#b45309' }]}>{pendingList.length}</Text>
              <Text style={[styles.countLabel, { color: '#b45309' }]}>Pending</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: '#edf8f6', borderColor: '#c4ece7' }]}>
              <Text style={[styles.countVal, { color: '#006a61' }]}>{approvedList.length}</Text>
              <Text style={[styles.countLabel, { color: '#006a61' }]}>Approved</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: '#fff5f5', borderColor: '#ffdad6' }]}>
              <Text style={[styles.countVal, { color: '#ba1a1a' }]}>{rejectedList.length}</Text>
              <Text style={[styles.countLabel, { color: '#ba1a1a' }]}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* ── KANBAN PIPELINE BOARD VIEW ────────────────────────────────────── */}
        {viewMode === 'board' ? (
          <View style={isDesktop ? styles.boardGridDesktop : styles.boardGridMobile}>
            {/* Column 1: Pending Review */}
            <View style={[styles.kanbanCol, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
              <View style={[styles.colHead, { borderBottomColor: '#f1f5f9' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.statusDot, { backgroundColor: '#d97706' }]} />
                  <Text style={[styles.colTitle, { color: colors.text }]}>Pending Review</Text>
                </View>
                <View style={[styles.colPill, { backgroundColor: '#fef3c7' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#b45309' }}>
                    {pendingList.length}
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {pendingList.length === 0 ? (
                  <View style={styles.colEmpty}>
                    <CheckCircle2 size={24} color="#006a61" />
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>
                      All caught up! No pending requests.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {pendingList.map((req) => {
                      const emp = req.employee as any;
                      const empName = emp?.profile?.full_name || 'Staff Member';
                      const empCode = emp?.employee_code || emp?.id || 'EMP';
                      const deptName = emp?.department?.name;

                      return (
                        <View
                          key={req.id}
                          // HTML5 Drag Support on Web
                          {...(Platform.OS === 'web'
                            ? ({
                                draggable: true,
                                onDragStart: (e: any) => handleDragStart(e, req.id),
                                style: [
                                  styles.cardItem,
                                  { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                                  draggedId === req.id && { opacity: 0.4 },
                                ],
                              } as any)
                            : {
                                style: [
                                  styles.cardItem,
                                  { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                                ],
                              })}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Avatar name={empName} url={emp?.profile?.avatar_url} size={40} />
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={[styles.cardEmpName, { color: colors.text }]} numberOfLines={1}>
                                {empName}
                              </Text>

                              {/* Employee ID & Department Meta Badges */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <View style={[styles.idChip, { backgroundColor: '#f1f5f9' }]}>
                                  <Text style={styles.idChipText}>{empCode}</Text>
                                </View>
                                {deptName && (
                                  <View style={[styles.deptChip, { backgroundColor: '#edf8f6' }]}>
                                    <Building2 size={10} color="#006a61" />
                                    <Text style={styles.deptChipText} numberOfLines={1}>
                                      {deptName}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text style={[styles.cardType, { color: colors.primary }]}>
                              {stripEmoji(req.leave_type?.name || 'Leave')} · {req.days}d
                            </Text>
                            {emp?.designation && (
                              <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>
                                {emp.designation}
                              </Text>
                            )}
                          </View>

                          <View style={[styles.dateChip, { backgroundColor: '#f8faff' }]}>
                            <Calendar size={12} color={colors.textSecondary} />
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              {formatDate(req.start_date)} → {formatDate(req.end_date)}
                            </Text>
                          </View>

                          {req.reason && (
                            <Text style={[styles.cardReason, { color: colors.textSecondary }]} numberOfLines={2}>
                              "{req.reason}"
                            </Text>
                          )}

                          {/* Quick Action Buttons */}
                          <View style={styles.cardActions}>
                            <TouchableOpacity
                              style={[styles.btnApprove, { backgroundColor: '#006a61' }]}
                              onPress={() => handleAction(req.id, 'approve')}
                              disabled={processingId === req.id}
                            >
                              <CheckCircle2 size={13} color="#FFF" />
                              <Text style={styles.btnActionText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.btnReject, { backgroundColor: '#ba1a1a' }]}
                              onPress={() => handleAction(req.id, 'reject')}
                              disabled={processingId === req.id}
                            >
                              <XCircle size={13} color="#FFF" />
                              <Text style={styles.btnActionText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Column 2: Approved */}
            <View
              style={[
                styles.kanbanCol,
                { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                dropTargetColumn === 'approved' && {
                  borderColor: '#006a61',
                  borderWidth: 2,
                  backgroundColor: '#f0fdf9',
                },
              ]}
              {...(Platform.OS === 'web'
                ? ({
                    onDragOver: (e: any) => handleDragOver(e, 'approved'),
                    onDragLeave: handleDragLeave,
                    onDrop: (e: any) => handleDrop(e, 'approved'),
                  } as any)
                : {})}
            >
              <View style={[styles.colHead, { borderBottomColor: '#f1f5f9' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.statusDot, { backgroundColor: '#006a61' }]} />
                  <Text style={[styles.colTitle, { color: colors.text }]}>Approved</Text>
                </View>
                <View style={[styles.colPill, { backgroundColor: '#edf8f6' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#006a61' }}>
                    {approvedList.length}
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {approvedList.length === 0 ? (
                  <View style={styles.colEmpty}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      No approved requests
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {approvedList.map((req) => {
                      const emp = req.employee as any;
                      const empName = emp?.profile?.full_name || 'Staff Member';
                      const empCode = emp?.employee_code || emp?.id || 'EMP';
                      const deptName = emp?.department?.name;

                      return (
                        <View key={req.id} style={[styles.cardItem, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Avatar name={empName} url={emp?.profile?.avatar_url} size={36} />
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={[styles.cardEmpName, { color: colors.text }]} numberOfLines={1}>
                                {empName}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <View style={[styles.idChip, { backgroundColor: '#f1f5f9' }]}>
                                  <Text style={styles.idChipText}>{empCode}</Text>
                                </View>
                                {deptName && (
                                  <View style={[styles.deptChip, { backgroundColor: '#edf8f6' }]}>
                                    <Building2 size={10} color="#006a61" />
                                    <Text style={styles.deptChipText} numberOfLines={1}>
                                      {deptName}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <Badge label="APPROVED" variant="successLight" />
                          </View>
                          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 4 }}>
                            {stripEmoji(req.leave_type?.name || 'Leave')} · {req.days}d
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                            {formatDate(req.start_date)} – {formatDate(req.end_date)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Column 3: Rejected */}
            <View
              style={[
                styles.kanbanCol,
                { backgroundColor: colors.surface, borderColor: '#e2e8f0' },
                dropTargetColumn === 'rejected' && {
                  borderColor: '#ba1a1a',
                  borderWidth: 2,
                  backgroundColor: '#fff5f5',
                },
              ]}
              {...(Platform.OS === 'web'
                ? ({
                    onDragOver: (e: any) => handleDragOver(e, 'rejected'),
                    onDragLeave: handleDragLeave,
                    onDrop: (e: any) => handleDrop(e, 'rejected'),
                  } as any)
                : {})}
            >
              <View style={[styles.colHead, { borderBottomColor: '#f1f5f9' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.statusDot, { backgroundColor: '#ba1a1a' }]} />
                  <Text style={[styles.colTitle, { color: colors.text }]}>Rejected</Text>
                </View>
                <View style={[styles.colPill, { backgroundColor: '#fff5f5' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#ba1a1a' }}>
                    {rejectedList.length}
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                {rejectedList.length === 0 ? (
                  <View style={styles.colEmpty}>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      No rejected requests
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {rejectedList.map((req) => {
                      const emp = req.employee as any;
                      const empName = emp?.profile?.full_name || 'Staff Member';
                      const empCode = emp?.employee_code || emp?.id || 'EMP';
                      const deptName = emp?.department?.name;

                      return (
                        <View key={req.id} style={[styles.cardItem, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Avatar name={empName} url={emp?.profile?.avatar_url} size={36} />
                            <View style={{ flex: 1, gap: 2 }}>
                              <Text style={[styles.cardEmpName, { color: colors.text }]} numberOfLines={1}>
                                {empName}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <View style={[styles.idChip, { backgroundColor: '#f1f5f9' }]}>
                                  <Text style={styles.idChipText}>{empCode}</Text>
                                </View>
                                {deptName && (
                                  <View style={[styles.deptChip, { backgroundColor: '#edf8f6' }]}>
                                    <Building2 size={10} color="#006a61" />
                                    <Text style={styles.deptChipText} numberOfLines={1}>
                                      {deptName}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <Badge label="REJECTED" variant="dangerLight" />
                          </View>
                          <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '700', marginTop: 4 }}>
                            {stripEmoji(req.leave_type?.name || 'Leave')} · {req.days}d
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                            {formatDate(req.start_date)} – {formatDate(req.end_date)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        ) : (
          /* ── TABLE / LIST VIEW ────────────────────────────────────────────── */
          <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: '#e2e8f0' }]}>
            <View style={[styles.tableHeader, { borderBottomColor: '#f1f5f9' }]}>
              <Text style={[styles.tableTitle, { color: colors.text }]}>
                All Leave Requests ({filtered.length})
              </Text>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyTable}>
                <Calendar size={32} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No leave requests found</Text>
              </View>
            ) : (
              <View style={{ padding: 8 }}>
                {filtered.map((item, idx) => {
                  const emp = item.employee as any;
                  const empName = emp?.profile?.full_name || 'Staff';
                  const empCode = emp?.employee_code || emp?.id || 'EMP';
                  const deptName = emp?.department?.name;

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        idx !== filtered.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9',
                        },
                      ]}
                    >
                      <Avatar name={empName} url={emp?.profile?.avatar_url} size={42} />
                      <View style={{ flex: 1, gap: 4, paddingHorizontal: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                            {empName}
                          </Text>
                          <View style={[styles.idChip, { backgroundColor: '#f1f5f9' }]}>
                            <Text style={styles.idChipText}>{empCode}</Text>
                          </View>
                          {deptName && (
                            <View style={[styles.deptChip, { backgroundColor: '#edf8f6' }]}>
                              <Building2 size={11} color="#006a61" />
                              <Text style={styles.deptChipText}>{deptName}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                          {stripEmoji(item.leave_type?.name || 'Leave')} · {formatDate(item.start_date)} — {formatDate(item.end_date)} ({item.days}d)
                        </Text>
                        {item.reason && (
                          <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
                            "{item.reason}"
                          </Text>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <Badge label={item.status} variant={statusVariant(item.status)} />
                        {item.status === 'pending' && (
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={[styles.btnApprove, { backgroundColor: '#006a61' }]}
                              onPress={() => handleAction(item.id, 'approve')}
                            >
                              <Text style={styles.btnActionText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.btnReject, { backgroundColor: '#ba1a1a' }]}
                              onPress={() => handleAction(item.id, 'reject')}
                            >
                              <Text style={styles.btnActionText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 24, paddingBottom: 64 },
  contentDesktop: { maxWidth: 1300, alignSelf: 'center', width: '100%', paddingHorizontal: 36, paddingTop: 36, gap: 28 },

  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroSubHeader: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 },

  viewToggleWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  countsRow: { flexDirection: 'row', gap: 8 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  countVal: { fontSize: 14, fontWeight: '800' },
  countLabel: { fontSize: 12, fontWeight: '600' },

  // Board
  boardGridDesktop: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  boardGridMobile: { gap: 20 },
  kanbanCol: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 480,
  },
  colHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { fontSize: 14, fontWeight: '800' },
  colPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  colScroll: { padding: 12, maxHeight: 600 },
  colEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 4,
  },

  cardItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    cursor: 'grab' as any,
  },
  cardEmpName: { fontSize: 14, fontWeight: '800' },
  cardType: { fontSize: 12, fontWeight: '700' },
  idChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  idChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deptChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006a61',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardReason: { fontSize: 12, fontStyle: 'italic', lineHeight: 16 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnApprove: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnActionText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Table
  tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { padding: 18, borderBottomWidth: 1 },
  tableTitle: { fontSize: 16, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  emptyTable: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
