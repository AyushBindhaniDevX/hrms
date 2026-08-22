import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getExpenses, createExpenseClaim } from '@/lib/services/expenses';
import { ExpenseClaim, ExpenseCategory } from '@/types/database';
import { formatCurrency } from '@/utils/format';
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle,
  X,
  FileUp,
} from 'lucide-react-native';

const CATEGORIES: { key: ExpenseCategory; label: string }[] = [
  { key: 'internet', label: 'Broadband / Internet' },
  { key: 'learning', label: 'Certifications & Courses' },
  { key: 'travel', label: 'Travel & Cab' },
  { key: 'meals', label: 'Team Lunch / Meals' },
  { key: 'hardware', label: 'Desk Accessories / Hardware' },
  { key: 'other', label: 'Miscellaneous' },
];

export default function EmployeeExpensesScreen() {
  const colors = useTheme();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('internet');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const loadData = async () => {
    try {
      const data = await getExpenses('emp_demo');
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

  const handleSubmit = async () => {
    if (!title.trim() || !amount.trim()) return;
    await createExpenseClaim({
      organization_id: 'subedge_org',
      employee_id: 'emp_demo',
      title,
      category,
      amount: parseFloat(amount) || 0,
      currency: 'INR',
      description: desc,
      spent_at: new Date().toISOString().split('T')[0],
    });
    setTitle('');
    setAmount('');
    setDesc('');
    setShowModal(false);
    loadData();
  };

  if (loading) return <LoadingState />;

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>My Expense Claims</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Submit & Track Work Reimbursements
            </Text>
          </View>
          <Button
            title="+ Submit New Claim"
            onPress={() => setShowModal(true)}
            style={{ backgroundColor: '#0D7377' }}
          />
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Summary */}
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>Total Claims Submitted</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Fast Reimbursement via Payroll</Text>
            </View>
          </View>

          {/* List */}
          <Text style={styles.sectionHeader}>Recent Submissions</Text>
          <View style={{ gap: 12 }}>
            {expenses.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.iconBox}>
                    <Receipt size={20} color="#0D7377" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>
                      {item.category.toUpperCase()} · {item.spent_at}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                    <View
                      style={[
                        styles.statusTag,
                        item.status === 'approved' && { backgroundColor: '#D1FAE5' },
                        item.status === 'pending' && { backgroundColor: '#FEF3C7' },
                        item.status === 'reimbursed' && { backgroundColor: '#CCECEC' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          item.status === 'approved' && { color: '#059669' },
                          item.status === 'pending' && { color: '#D97706' },
                          item.status === 'reimbursed' && { color: '#0D7377' },
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal: New Claim */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit Expense Reimbursement</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Claim Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. March Broadband Bill"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCategory(c.key)}
                      style={[styles.catBtn, category === c.key && styles.catBtnActive]}
                    >
                      <Text style={[styles.catText, category === c.key && styles.catTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Amount (INR) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1499"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />

                <Text style={styles.label}>Description / Purpose</Text>
                <TextInput
                  style={[styles.input, { height: 70 }]}
                  multiline
                  placeholder="Business justification..."
                  value={desc}
                  onChangeText={setDesc}
                />

                <Button
                  title="Submit for Approval"
                  onPress={handleSubmit}
                  style={{ backgroundColor: '#0D7377', marginTop: 16 }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  summaryCard: {
    backgroundColor: '#0D7377',
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: { color: '#CCECEC', fontSize: 13, fontWeight: '600' },
  summaryAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  badgePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemAmount: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A2E',
    backgroundColor: '#F8FAFC',
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  catBtnActive: { backgroundColor: '#0D7377' },
  catText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
});
