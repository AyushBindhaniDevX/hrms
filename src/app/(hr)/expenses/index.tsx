import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getExpenses, updateExpenseStatus } from '@/lib/services/expenses';
import { ExpenseClaim, ExpenseStatus } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import {
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Filter,
  Check,
  X,
  CreditCard,
  Car,
  Plane,
  Building,
  TrendingUp,
  Receipt,
  ExternalLink,
} from 'lucide-react-native';

export default function HRExpensesScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ExpenseStatus | 'all'>('all');

  const loadData = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: ExpenseStatus) => {
    await updateExpenseStatus(id, status, 'Finance & HR Admin');
    loadData();
  };

  if (loading) return <LoadingState />;

  const filtered = filter === 'all' ? expenses : expenses.filter((e) => e.status === filter);
  const totalClaimed = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const approvedTotal = expenses.filter((e) => e.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingTotal = expenses.filter((e) => e.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Expenses & Reimbursements</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Corporate Claims, Mileage Calculations & Multi-tier Finance Approvals
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Top KPI Metrics Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Claims Raised</Text>
              <Text style={styles.statNumber}>{formatCurrency(totalClaimed)}</Text>
              <Text style={styles.statSub}>{expenses.length} claims in system</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Approved & Settled</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{formatCurrency(approvedTotal)}</Text>
              <Text style={styles.statSub}>Ready for payroll disbursement</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending Review</Text>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{formatCurrency(pendingTotal)}</Text>
              <Text style={styles.statSub}>Requires manager clearance</Text>
            </View>
          </View>

          {/* Filter Bar */}
          <View style={styles.filterRow}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => {
              const active = filter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFilter(status)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {status.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Claims List */}
          <View style={{ gap: 12 }}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.expenseCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.iconBox}>
                    {item.category === 'travel' ? (
                      <Car size={22} color="#0D7377" />
                    ) : item.category === 'learning' ? (
                      <TrendingUp size={22} color="#0D7377" />
                    ) : (
                      <Receipt size={22} color="#0D7377" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.claimTitle}>{item.title}</Text>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.category.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.claimDesc}>{item.description}</Text>
                    <Text style={styles.claimMeta}>
                      Claimed on {item.spent_at} · Employee ID: {item.employee_id}
                      {item.approved_by ? ` · Reviewed by: ${item.approved_by}` : ''}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Text style={styles.claimAmount}>{formatCurrency(item.amount)}</Text>

                    {item.status === 'pending' ? (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => handleStatusChange(item.id, 'approved')}
                          style={styles.approveBtn}
                        >
                          <Check size={14} color="#FFF" />
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleStatusChange(item.id, 'rejected')}
                          style={styles.rejectBtn}
                        >
                          <X size={14} color="#FFF" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'approved' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEE2E2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.status === 'approved' ? { color: '#059669' } : { color: '#DC2626' },
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 150, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  statNumber: { fontSize: 20, fontWeight: '800', marginVertical: 4, color: '#1A1A2E' },
  statSub: { fontSize: 11, color: '#94A3B8' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#0D7377', borderColor: '#0D7377' },
  filterText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF' },
  expenseCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  claimTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  catBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catBadgeText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  claimDesc: { fontSize: 12, color: '#475569', marginTop: 3 },
  claimMeta: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  claimAmount: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  approveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  actionBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
});
