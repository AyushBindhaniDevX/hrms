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
import { getTickets, createTicket } from '@/lib/services/helpdesk';
import { SupportTicket, TicketCategory, TicketPriority } from '@/types/database';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle,
  X,
  MessageSquare,
} from 'lucide-react-native';

const CATEGORIES: { key: TicketCategory; label: string }[] = [
  { key: 'it_support', label: 'IT & Hardware Support' },
  { key: 'hr_query', label: 'HR Policy / Leave' },
  { key: 'payroll_issue', label: 'Salary / Tax Form 12BB' },
  { key: 'facility', label: 'Office Desk & Facility' },
  { key: 'general', label: 'General Inquiry' },
];

export default function EmployeeHelpdeskScreen() {
  const colors = useTheme();
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

  useEffect(() => {
    loadData();
  }, []);

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
    setTitle('');
    setDesc('');
    setShowModal(false);
    loadData();
  };

  if (loading) return <LoadingState />;

  return (
    <SidebarLayout>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Helpdesk Support</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Raise Service Tickets & Track Resolution Status
            </Text>
          </View>
          <Button
            title="+ Raise New Ticket"
            onPress={() => setShowModal(true)}
            style={{ backgroundColor: '#0D7377' }}
          />
        </View>

        <ScrollView
          style={{ flex: 1, padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        >
          <Text style={styles.sectionHeader}>My Active Tickets ({tickets.length})</Text>

          <View style={{ gap: 12 }}>
            {tickets.map((t) => (
              <View key={t.id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.iconBox}>
                    <LifeBuoy size={20} color="#0D7377" />
                  </View>
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

                  <View
                    style={[
                      styles.statusBadge,
                      t.status === 'resolved' && { backgroundColor: '#D1FAE5' },
                      t.status === 'in_progress' && { backgroundColor: '#CCECEC' },
                      t.status === 'open' && { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        t.status === 'resolved' && { color: '#059669' },
                        t.status === 'in_progress' && { color: '#0D7377' },
                        t.status === 'open' && { color: '#D97706' },
                      ]}
                    >
                      {t.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal: New Ticket */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Raise Helpdesk Ticket</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                <Text style={styles.label}>Subject / Issue Title *</Text>
                <TextInput style={styles.input} placeholder="Brief summary of the issue..." value={title} onChangeText={setTitle} />

                <Text style={styles.label}>Category</Text>
                <View style={styles.catGrid}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCat(c.key)}
                      style={[styles.catBtn, cat === c.key && styles.catBtnActive]}
                    >
                      <Text style={[styles.catText, cat === c.key && styles.catTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[styles.prioBtn, priority === p && { backgroundColor: '#0D7377' }]}
                    >
                      <Text style={[styles.prioText, priority === p && { color: '#FFF' }]}>{p.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Detailed Description *</Text>
                <TextInput
                  style={[styles.input, { height: 90 }]}
                  multiline
                  placeholder="Provide logs, error codes, or context..."
                  value={desc}
                  onChangeText={setDesc}
                />

                <Button title="Submit Support Ticket" onPress={handleSubmit} style={{ backgroundColor: '#0D7377', marginTop: 16 }} />
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
