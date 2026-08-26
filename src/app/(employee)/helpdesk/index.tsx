import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal as RNModal,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { getTickets, createTicket } from '@/lib/services/helpdesk';
import { SupportTicket, TicketCategory, TicketPriority } from '@/types/database';
import {
  LifeBuoy,
  Plus,
  CheckCircle,
  X,
  MessageSquare,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { formatCurrency } from '@/utils/format';

const CATEGORIES: { key: TicketCategory; label: string }[] = [
  { key: 'it_support', label: 'IT & Hardware Support' },
  { key: 'hr_query', label: 'HR Policy / Leave' },
  { key: 'payroll_issue', label: 'Salary / Tax Form 12BB' },
  { key: 'facility', label: 'Office Desk & Facility' },
  { key: 'general', label: 'General Inquiry' },
];

export default function EmployeeHelpdeskScreen() {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<TicketCategory>('it_support');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [desc, setDesc] = useState('');

  const loadData = async () => {
    try {
      const data = await getTickets('emp_demo');
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim()) return;
    await createTicket({
      organization_id: 'subedge_org',
      employee_id: 'emp_demo',
      title,
      category: cat,
      priority,
      description: desc,
    });
    setTitle(''); setDesc(''); setShowModal(false); loadData();
  };

  if (loading) return <LoadingState />;

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <View style={[mStyles.root, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeInDown.duration(300).springify()} style={[mStyles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[mStyles.headerTitle, { color: colors.text }]}>Helpdesk</Text>
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
            <Text style={[mStyles.sectionTitle, { color: colors.text }]}>My Tickets ({tickets.length})</Text>

            {tickets.length === 0 ? (
              <View style={mStyles.emptyState}>
                <LifeBuoy size={40} color={colors.textSecondary} />
                <Text style={mStyles.emptyText}>No active tickets. You're all good!</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {tickets.map((t, idx) => (
                  <Animated.View key={t.id} entering={FadeInDown.delay(idx * 80).duration(300).springify()}>
                    <View style={[mStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={mStyles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={mStyles.tktNum}>{t.ticket_number}</Text>
                          <Text style={mStyles.tktCat}>{t.category.replace('_', ' ').toUpperCase()}</Text>
                        </View>
                        <View style={[mStyles.statusBadge, t.status === 'resolved' ? { backgroundColor: '#D1FAE5' } : t.status === 'in_progress' ? { backgroundColor: '#CCECEC' } : { backgroundColor: '#FEF3C7' }]}>
                          <Text style={[mStyles.statusBadgeText, t.status === 'resolved' ? { color: '#059669' } : t.status === 'in_progress' ? { color: '#0D7377' } : { color: '#D97706' }]}>
                            {t.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={[mStyles.tktTitle, { color: colors.text }]}>{t.title}</Text>
                      <Text style={[mStyles.tktDesc, { color: colors.textSecondary }]} numberOfLines={2}>{t.description}</Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4 }}>
                        <AlertCircle size={12} color={t.priority === 'urgent' || t.priority === 'high' ? '#DC2626' : colors.textSecondary} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: t.priority === 'urgent' || t.priority === 'high' ? '#DC2626' : colors.textSecondary, textTransform: 'uppercase' }}>
                          Priority: {t.priority}
                        </Text>
                      </View>

                      {t.resolution_notes ? (
                        <View style={mStyles.resBox}>
                          <Text style={mStyles.resLabel}>Resolution from Support:</Text>
                          <Text style={mStyles.resText}>{t.resolution_notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
          <View style={{ height: 80 }} />
        </ScrollView>

        <TouchableOpacity onPress={() => setShowModal(true)} style={mStyles.fab} activeOpacity={0.8}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Mobile Modal */}
        <RNModal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
          <View style={[mStyles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[mStyles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[mStyles.modalTitle, { color: colors.text }]}>Raise Ticket</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 4 }}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={[mStyles.label, { color: colors.text }]}>Subject / Issue Title *</Text>
              <TextInput style={[mStyles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]} placeholder="Brief summary of the issue..." placeholderTextColor={colors.textSecondary} value={title} onChangeText={setTitle} />

              <Text style={[mStyles.label, { color: colors.text, marginTop: 16 }]}>Category</Text>
              <View style={mStyles.catGrid}>
                {CATEGORIES.map((c) => {
                  const isActive = cat === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCat(c.key)}
                      style={[mStyles.catBtn, { backgroundColor: isActive ? '#0D7377' : colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={[mStyles.catText, { color: isActive ? '#FFF' : colors.text }]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[mStyles.label, { color: colors.text, marginTop: 16 }]}>Priority</Text>
              <View style={mStyles.prioGrid}>
                {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => {
                  const isActive = priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[mStyles.prioBtn, { backgroundColor: isActive ? '#0D7377' : colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={[mStyles.prioText, { color: isActive ? '#FFF' : colors.text }]}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[mStyles.label, { color: colors.text, marginTop: 16 }]}>Detailed Description *</Text>
              <TextInput
                style={[mStyles.input, { height: 100, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                multiline
                placeholder="Provide logs, error codes, or context..."
                placeholderTextColor={colors.textSecondary}
                value={desc}
                onChangeText={setDesc}
              />

              <Button title="Submit Support Ticket" onPress={handleSubmit} style={{ backgroundColor: '#0D7377', marginTop: 24 }} />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </RNModal>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP LAYOUT (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Helpdesk Support</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Raise Service Tickets & Track Resolution Status</Text>
        </View>
        <Button title="+ Raise New Ticket" onPress={() => setShowModal(true)} style={{ backgroundColor: '#0D7377' }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
        <Text style={styles.sectionHeader}>My Active Tickets ({tickets.length})</Text>
        <View style={{ gap: 12 }}>
          {tickets.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.iconBox}><LifeBuoy size={20} color="#0D7377" /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.tktNum}>{t.ticket_number}</Text>
                    <Text style={styles.tktCat}>{t.category.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.tktTitle}>{t.title}</Text>
                  <Text style={styles.tktDesc}>{t.description}</Text>
                  {t.resolution_notes ? (
                    <View style={styles.resBox}>
                      <Text style={styles.resLabel}>Resolution from Support:</Text>
                      <Text style={styles.resText}>{t.resolution_notes}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={[styles.statusBadge, t.status === 'resolved' && { backgroundColor: '#D1FAE5' }, t.status === 'in_progress' && { backgroundColor: '#CCECEC' }, t.status === 'open' && { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.statusBadgeText, t.status === 'resolved' && { color: '#059669' }, t.status === 'in_progress' && { color: '#0D7377' }, t.status === 'open' && { color: '#D97706' }]}>
                    {t.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal: New Ticket Desktop */}
      {showModal && (
        <RNModal visible={showModal} animationType="fade" transparent onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Raise Helpdesk Ticket</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><X size={20} color="#64748B" /></TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Subject / Issue Title *</Text>
                <TextInput style={styles.input} placeholder="Brief summary of the issue..." value={title} onChangeText={setTitle} />
                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity key={c.key} onPress={() => setCat(c.key)} style={[styles.catBtn, cat === c.key && styles.catBtnActive]}>
                      <Text style={[styles.catText, cat === c.key && styles.catTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                    <TouchableOpacity key={p} onPress={() => setPriority(p)} style={[styles.prioBtn, priority === p && { backgroundColor: '#0D7377' }]}>
                      <Text style={[styles.prioText, priority === p && { color: '#FFF' }]}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Detailed Description *</Text>
                <TextInput style={[styles.input, { height: 90 }]} multiline placeholder="Provide logs, error codes, or context..." value={desc} onChangeText={setDesc} />
                <Button title="Submit Support Ticket" onPress={handleSubmit} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
              </ScrollView>
            </View>
          </View>
        </RNModal>
      )}
    </View>
  );
}

// ─── MOBILE STYLES ─────────────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 16, fontSize: 14 },
  
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tktNum: { fontSize: 12, fontWeight: '800', color: '#0D7377' },
  tktCat: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  tktTitle: { fontSize: 15, fontWeight: '700' },
  tktDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  
  resBox: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, marginTop: 12 },
  resLabel: { fontSize: 11, fontWeight: '800', color: '#166534', marginBottom: 4 },
  resText: { fontSize: 13, color: '#15803D' },

  fab: {
    position: 'absolute', right: 20, bottom: 20,
    backgroundColor: '#0D7377', width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },

  modalSheet: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  catText: { fontSize: 13, fontWeight: '600' },
  
  prioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prioBtn: { flex: 1, minWidth: '45%', paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  prioText: { fontSize: 12, fontWeight: '700' },
});

// ─── DESKTOP STYLES ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F7F7', alignItems: 'center', justifyContent: 'center' },
  tktNum: { fontSize: 12, fontWeight: '800', color: '#0D7377' },
  tktCat: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  tktTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginTop: 3 },
  tktDesc: { fontSize: 13, color: '#475569', marginTop: 2 },
  resBox: { backgroundColor: '#F0FDF4', padding: 8, borderRadius: 6, marginTop: 8 },
  resLabel: { fontSize: 11, fontWeight: '700', color: '#166534' },
  resText: { fontSize: 12, color: '#15803D', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
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
  prioBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' },
  prioText: { fontSize: 11, color: '#475569', fontWeight: '700' },
});
