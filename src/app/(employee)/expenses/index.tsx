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
  DollarSign,
  Plus,
  Clock,
  CheckCircle,
  X,
  Receipt,
  Car,
  Plane,
  Building,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: string }[] = [
  { key: 'travel', label: 'Travel & Mileage', icon: '🚗' },
  { key: 'meals', label: 'Per Diem / Meals', icon: '🍱' },
  { key: 'internet', label: 'Broadband / Phone', icon: '🌐' },
  { key: 'learning', label: 'Certification / L&D', icon: '🎓' },
  { key: 'hardware', label: 'Home Office Hardware', icon: '💻' },
  { key: 'other', label: 'Other Sundry', icon: '📦' },
];

export default function EmployeeExpensesScreen() {
  const colors = useTheme();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('travel');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [isMileage, setIsMileage] = useState(false);
  const [kmDistance, setKmDistance] = useState('');

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

  const handleMileageChange = (km: string) => {
    setKmDistance(km);
    const numKm = parseFloat(km) || 0;
    const calcAmount = Math.round(numKm * 46); // ₹46/km standard rate
    setAmount(calcAmount > 0 ? calcAmount.toString() : '');
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    await createExpenseClaim({
      organization_id: 'subedge_org',
      employee_id: 'emp_demo',
      title,
      category,
      amount: numAmount,
      currency: 'INR',
      description: isMileage ? `${desc} (${kmDistance} km @ ₹46/km)` : desc,
      spent_at: new Date().toISOString().split('T')[0],
    });

    setTitle('');
    setAmount('');
    setDesc('');
    setIsMileage(false);
    setKmDistance('');
    setShowModal(false);
    loadData();
  };

  if (loading) return <LoadingState />;

  const myTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>My Expense Claims</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Submit Reimbursements, Mileage Claims & Track Settlement
            </Text>
          </View>
          <Button
            title="+ Claim Expense"
            onPress={() => setShowModal(true)}
            style={{ backgroundColor: '#0D7377' }}
          />
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          {/* Banner */}
          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerSub}>Total Submitted Claims</Text>
              <Text style={styles.bannerAmount}>{formatCurrency(myTotal)}</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Standard Settlement: Monthly Payroll</Text>
            </View>
          </View>

          {/* List */}
          <Text style={styles.sectionTitle}>Claim History ({expenses.length})</Text>
          <View style={{ gap: 12 }}>
            {expenses.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={styles.iconBox}>
                    <Receipt size={20} color="#0D7377" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                    <Text style={styles.cardMeta}>Category: {item.category.toUpperCase()} · Date: {item.spent_at}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
                    <View
                      style={[
                        styles.statusTag,
                        item.status === 'approved' && { backgroundColor: '#D1FAE5' },
                        item.status === 'pending' && { backgroundColor: '#FEF3C7' },
                        item.status === 'rejected' && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === 'approved' && { color: '#059669' },
                          item.status === 'pending' && { color: '#D97706' },
                          item.status === 'rejected' && { color: '#DC2626' },
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

        {/* Claim Modal */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit Reimbursement Claim</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Claim Title *</Text>
                <TextInput style={styles.input} placeholder="e.g. Client Site Visit Mileage" value={title} onChangeText={setTitle} />

                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => {
                        setCategory(c.key);
                        setIsMileage(c.key === 'travel');
                      }}
                      style={[styles.catBtn, category === c.key && styles.catBtnActive]}
                    >
                      <Text style={[styles.catText, category === c.key && styles.catTextActive]}>
                        {c.icon} {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {isMileage && (
                  <View style={styles.mileageBox}>
                    <Text style={styles.mileageTitle}>🚗 Mileage Calculator (₹46 / km)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter distance in kilometers (e.g. 75)"
                      value={kmDistance}
                      onChangeText={handleMileageChange}
                      keyboardType="numeric"
                    />
                  </View>
                )}

                <Text style={styles.label}>Reimbursement Amount (INR) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Description & Purpose</Text>
                <TextInput
                  style={[styles.input, { height: 75 }]}
                  multiline
                  placeholder="Briefly justify the business expenditure..."
                  value={desc}
                  onChangeText={setDesc}
                />

                <Button title="Submit for Approval" onPress={handleSubmit} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
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
  banner: {
    backgroundColor: '#0D7377',
    padding: 20,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerSub: { color: '#CCECEC', fontSize: 12, fontWeight: '600' },
  bannerAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 2 },
  badgePill: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgePillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  cardDesc: { fontSize: 12, color: '#475569', marginTop: 2 },
  cardMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1A2E', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A1A2E', backgroundColor: '#F8FAFC' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9' },
  catBtnActive: { backgroundColor: '#0D7377' },
  catText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
  mileageBox: { backgroundColor: '#F0F7F7', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#CCECEC' },
  mileageTitle: { fontSize: 12, fontWeight: '800', color: '#0D7377', marginBottom: 6 },
});
