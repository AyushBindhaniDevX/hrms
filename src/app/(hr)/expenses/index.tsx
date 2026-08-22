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
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react-native';

export default function HRExpensesScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const handleAction = async (id: string, status: ExpenseStatus) => {
    await updateExpenseStatus(id, status, 'HR Manager');
    loadData();
  };

  if (loading) return <LoadingState />;

  const filtered = expenses.filter((e) => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  const totalPending = expenses.filter((e) => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses.filter((e) => e.status === 'approved' || e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0);

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Expenses & Reimbursements</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Corporate Expense Claims & Policy Compliance Audit
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Summary Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pending Review</Text>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{formatCurrency(totalPending)}</Text>
              <Text style={styles.statSub}>{expenses.filter((e) => e.status === 'pending').length} requests</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Approved & Processed</Text>
              <Text style={[styles.statNumber, { color: '#0D7377' }]}>{formatCurrency(totalApproved)}</Text>
              <Text style={styles.statSub}>{expenses.filter((e) => e.status === 'approved').length} claims</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Reimbursed</Text>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {formatCurrency(expenses.filter((e) => e.status === 'reimbursed').reduce((s, e) => s + e.amount, 0))}
              </Text>
              <Text style={styles.statSub}>Direct Deposit</Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {['all', 'pending', 'approved', 'reimbursed', 'rejected'].map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setFilterStatus(st)}
                style={[
                  styles.filterPill,
                  filterStatus === st && { backgroundColor: '#0D7377', borderColor: '#0D7377' },
                ]}
              >
                <Text style={[styles.filterPillText, filterStatus === st && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Claims Table / Cards */}
          <View style={styles.claimsList}>
            {filtered.map((item) => (
              <View key={item.id} style={styles.claimCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.iconBox}>
                    <Receipt size={22} color="#0D7377" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimTitle}>{item.title}</Text>
                    <Text style={styles.claimMeta}>
                      Category: {item.category.toUpperCase()} · Date: {item.spent_at}
                    </Text>
                    <Text style={styles.claimDesc}>{item.description}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.claimAmount}>{formatCurrency(item.amount)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'approved' && { backgroundColor: '#D1FAE5' },
                        item.status === 'pending' && { backgroundColor: '#FEF3C7' },
                        item.status === 'reimbursed' && { backgroundColor: '#CCECEC' },
                        item.status === 'rejected' && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.status === 'approved' && { color: '#059669' },
                          item.status === 'pending' && { color: '#D97706' },
                          item.status === 'reimbursed' && { color: '#0D7377' },
                          item.status === 'rejected' && { color: '#DC2626' },
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleAction(item.id, 'approved')}
                      style={[styles.actionBtn, { backgroundColor: '#0D7377' }]}
                    >
                      <Text style={styles.actionBtnText}>Approve Claim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAction(item.id, 'rejected')}
                      style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                    >
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  topBar: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statNumber: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11, color: '#94A3B8' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  claimsList: { gap: 12 },
  claimCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  claimMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  claimDesc: { fontSize: 13, color: '#334155', marginTop: 4 },
  claimAmount: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
